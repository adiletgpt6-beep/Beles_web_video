#!/usr/bin/env python3
"""Beles source archive and resumable job queue. Python stdlib + ffprobe + Git."""
import argparse
import contextlib
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

PART_BYTES = 6 * 1024 * 1024
MAX_BYTES = 100 * 1024 * 1024
ID_RE = re.compile(r"BW-[0-9]{3,}\Z")
SHA_RE = re.compile(r"[0-9a-f]{64}\Z")
STATUSES = ("staged", "queued", "in_progress", "blocked", "rendered", "approved")


class Error(Exception):
    pass


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def read_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise Error(f"Cannot read {path}: {exc}") from exc


def atomic_text(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.read_text(encoding="utf-8") == text:
        return False
    fd, name = tempfile.mkstemp(prefix=".beles-", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as out:
            out.write(text)
            out.flush()
            os.fsync(out.fileno())
        os.replace(name, path)
    finally:
        Path(name).unlink(missing_ok=True)
    return True


def write_json(path, data):
    return atomic_text(path, json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def safe_path(root, value):
    if not isinstance(value, str) or not value or Path(value).is_absolute():
        raise Error(f"Invalid relative path: {value!r}")
    path = root / value
    if not path.resolve().is_relative_to(root.resolve()) or path.resolve() == root.resolve():
        raise Error(f"Path escapes repository: {value}")
    return path


def run(args, **kwargs):
    try:
        return subprocess.run(args, check=True, capture_output=True, **kwargs)
    except FileNotFoundError as exc:
        raise Error(f"Required program missing: {args[0]}") from exc
    except subprocess.CalledProcessError as exc:
        detail = exc.stderr.decode(errors="replace") if isinstance(exc.stderr, bytes) else exc.stderr
        raise Error(f"{args[0]} failed: {(detail or '')[:700]}") from exc


def git(root, *args):
    return run(["git", "-C", str(root), *args], text=True).stdout.strip()


def hashes(path):
    if not path.is_file():
        raise Error(f"File missing: {path}")
    size = path.stat().st_size
    sha = hashlib.sha256()
    blob = hashlib.sha1(b"blob " + str(size).encode() + b"\0")
    count = 0
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            sha.update(chunk)
            blob.update(chunk)
            count += len(chunk)
    if size != count:
        raise Error(f"File changed while reading: {path}")
    return {"bytes": count, "sha256": sha.hexdigest(), "git_blob_sha": blob.hexdigest()}


def check_file(path, expected):
    actual = hashes(path)
    for key in ("bytes", "sha256", "git_blob_sha"):
        if key in expected and actual[key] != expected[key]:
            raise Error(f"{path}: {key} mismatch; expected {expected[key]}, got {actual[key]}")
    return actual


def probe(path):
    data = json.loads(run(["ffprobe", "-v", "error", "-show_format", "-show_streams",
                           "-of", "json", str(path)], text=True).stdout)
    videos = [s for s in data["streams"] if s.get("codec_type") == "video"]
    audios = [s for s in data["streams"] if s.get("codec_type") == "audio"]
    if not videos or float(data.get("format", {}).get("duration", 0)) <= 0:
        raise Error(f"No playable video/duration: {path}")
    v, a = videos[0], audios[0] if audios else {}
    return {"duration_seconds": float(data["format"]["duration"]),
            "width": v["width"], "height": v["height"],
            "frame_rate": v.get("r_frame_rate"), "video_codec": v.get("codec_name"),
            "audio_codec": a.get("codec_name"),
            "sample_rate": int(a["sample_rate"]) if a.get("sample_rate") else None,
            "channels": a.get("channels")}


def validate_probe(actual, expected):
    for key, value in expected.items():
        if key == "duration_seconds":
            equal = abs(actual[key] - value) < 0.01
        else:
            equal = actual.get(key) == value
        if not equal:
            raise Error(f"ffprobe {key} mismatch: {actual.get(key)} != {value}")


def load_manifest(root, job_id):
    if not ID_RE.fullmatch(job_id):
        raise Error(f"Invalid job ID: {job_id}")
    m = read_json(safe_path(root, f"production/jobs/{job_id}/manifest.json"))
    s = m.get("source", {})
    if m.get("job_id") != job_id or m.get("role") not in ("approved_baseline", "edit"):
        raise Error(f"Invalid identity/role in {job_id}")
    if s.get("storage") != "github_git_parts" or not SHA_RE.fullmatch(s.get("sha256", "")):
        raise Error(f"Unsupported or invalid source in {job_id}")
    if type(s.get("bytes")) is not int or s["bytes"] <= 0:
        raise Error(f"Invalid source size in {job_id}")
    cache = Path(s.get("cache_path", ""))
    safe_path(root, s.get("cache_path"))
    if len(cache.parts) < 2 or cache.parts[0] != "input":
        raise Error("Source cache must be inside input/")
    parts = s.get("parts", [])
    if not parts:
        raise Error(f"No archived parts in {job_id}")
    for i, part in enumerate(parts, 1):
        expected_path = f"production/media/{s['sha256']}/part-{i:05d}.bin"
        if (part.get("path") != expected_path or type(part.get("bytes")) is not int
                or not 0 < part["bytes"] <= PART_BYTES
                or not SHA_RE.fullmatch(part.get("sha256", ""))
                or not re.fullmatch(r"[0-9a-f]{40}", part.get("git_blob_sha", ""))):
            raise Error(f"Invalid part {i} in {job_id}")
        safe_path(root, part["path"])
    if sum(p["bytes"] for p in parts) != s["bytes"]:
        raise Error(f"Part sizes do not sum to source size in {job_id}")
    return m


def checkpoint_data(root, m):
    path = root / "production/jobs" / m["job_id"] / "checkpoint.json"
    if path.exists():
        data = read_json(path)
    elif m["role"] == "approved_baseline":
        data = {"schema_version": 1, "job_id": m["job_id"], "status": "approved",
                "next_step": "Ждать новый исходник; утверждённую V5 не переделывать.",
                "note": "Beles V5 утверждена пользователем.", "artifacts": [], "events": []}
    else:
        raise Error(f"Missing checkpoint for {m['job_id']}; repair before continuing")
    if (data.get("job_id") != m["job_id"] or data.get("status") not in STATUSES
            or not data.get("next_step", "").strip()):
        raise Error(f"Invalid checkpoint for {m['job_id']}")
    if m["role"] == "approved_baseline" and data["status"] != "approved":
        raise Error("Approved baseline cannot be reopened")
    return data


def jobs(root):
    found = []
    seen = set()
    directory = root / "production/jobs"
    for path in sorted(directory.glob("BW-*/manifest.json"), key=lambda p: int(p.parent.name[3:])):
        m = load_manifest(root, path.parent.name)
        if m["source"]["sha256"] in seen:
            raise Error("Duplicate source hashes in job registry; resolve before writing")
        seen.add(m["source"]["sha256"])
        found.append((m, checkpoint_data(root, m)))
    return found


def next_id(items):
    return f"BW-{max([int(m['job_id'][3:]) for m, _ in items], default=0) + 1:03d}"


def delivery(root, m):
    path = root / "production/jobs" / m["job_id"] / "delivery.json"
    if not path.exists():
        return None
    data = read_json(path)
    return data if data.get("sha256") == m["source"]["sha256"] and data.get("verified") else None


def snapshot(root):
    items = jobs(root)
    entries = []
    for m, cp in items:
        entries.append({"job_id": m["job_id"], "role": m["role"], "status": cp["status"],
                        "source_sha256": m["source"]["sha256"],
                        "manifest": f"production/jobs/{m['job_id']}/manifest.json",
                        "next_step": cp["next_step"], "delivery_verified": bool(delivery(root, m))})
    active = next((e["job_id"] for status in ("in_progress", "queued")
                   for e in entries if e["role"] == "edit" and e["status"] == status), None)
    return {"schema_version": 1, "active_job_id": active, "next_suggested_job_id": next_id(items),
            "jobs": entries}


def handoff(m, cp):
    jid = m["job_id"]
    return (f"# {jid} — {cp['status']}\n\n"
            f"Роль: {m['role']}. Стиль: {m['approved_style']}. WhatsApp: {m['contact']}.\n\n"
            f"Следующий шаг: {cp['next_step']}\n\n{cp.get('note', '')}\n\n"
            f"Исходник: `{m['source']['original_name']}`, {m['source']['bytes']} байт.\n"
            f"SHA-256: `{m['source']['sha256']}`. Манифест: `manifest.json`.\n\n"
            f"Продолжение: `python3 scripts/beles.py status {jid}`, затем "
            f"`python3 scripts/beles.py restore {jid}` и `python3 scripts/beles.py verify {jid}`.\n\n"
            "Точное состояние, заметки, артефакты и история — `checkpoint.json`; "
            "проверка доставки — `delivery.json` (если уже выполнена). "
            "Публикуйте checkpoint и рабочие материалы в GitHub перед сменой чата.\n")


def sync(root):
    for m, cp in jobs(root):
        folder = root / "production/jobs" / m["job_id"]
        write_json(folder / "checkpoint.json", cp)
        atomic_text(folder / "HANDOFF.md", handoff(m, cp))
    data = snapshot(root)
    write_json(root / "production/registry.json", data)
    path = root / "production/STATE.json"
    if path.exists():
        state = read_json(path)
        fields = {k: data[k] for k in ("active_job_id", "next_suggested_job_id")}
        if any(state.get(k) != v for k, v in fields.items()):
            state["updated_at"] = now()
        state.update(fields)
        write_json(path, state)
    return data


@contextlib.contextmanager
def lock(root):
    with (root / ".beles.lock").open("a") as stream:
        try:
            fcntl.flock(stream.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise Error("Another Beles writer is active in this checkout; retry afterwards") from exc
        try:
            yield
        finally:
            fcntl.flock(stream.fileno(), fcntl.LOCK_UN)


def ingest(root, args):
    source = Path(args.file).resolve()
    actual = hashes(source)
    if actual["bytes"] > MAX_BYTES:
        raise Error("This tested Git-parts transport supports up to 100 MiB per source. "
                    "For larger sources configure and verify a Release/object-store transport first.")
    existing = jobs(root)
    for m, _ in existing:
        if m["source"]["sha256"] == actual["sha256"]:
            return {"job_id": m["job_id"], "duplicate": True, "changed": False}
    source_probe = probe(source)
    jid = next_id(existing)
    state = read_json(root / "production/STATE.json")
    prod = root / "production"
    with tempfile.TemporaryDirectory(prefix=".beles-ingest-", dir=prod) as temp:
        temp = Path(temp)
        archive = temp / "media"
        archive.mkdir()
        parts = []
        total_hash = hashlib.sha256()
        with source.open("rb") as stream:
            while chunk := stream.read(PART_BYTES):
                name = f"part-{len(parts) + 1:05d}.bin"
                (archive / name).write_bytes(chunk)
                total_hash.update(chunk)
                parts.append({"path": f"production/media/{actual['sha256']}/{name}",
                              **hashes(archive / name)})
        if total_hash.hexdigest() != actual["sha256"] or sum(p["bytes"] for p in parts) != actual["bytes"]:
            raise Error("Source changed during ingestion; no job registered")
        original_name = re.sub(r"[^\w.\-]", "_", source.name)
        m = {"schema_version": 1, "job_id": jid, "role": "edit",
             "repository": state["repository"], "approved_style": state["approved_style"],
             "contact": state["contact"]["display"], "created_at": now(),
             "brief": {"title": args.title or original_name, "instructions": args.brief,
                       "language": args.language, "site": args.site},
             "source": {"original_name": source.name, "bytes": actual["bytes"],
                        "sha256": actual["sha256"], "cache_path": f"input/{jid}/{original_name}",
                        "storage": "github_git_parts", "parts": parts, "probe": source_probe},
             "delivery_verification": f"production/jobs/{jid}/delivery.json"}
        cp = {"schema_version": 1, "job_id": jid, "status": "staged", "updated_at": now(),
              "next_step": "Опубликовать части и задание в GitHub; проверить restore/verify в чистом clone.",
              "note": args.brief, "artifacts": [], "events": []}
        job = temp / "job"
        job.mkdir()
        write_json(job / "manifest.json", m)
        write_json(job / "checkpoint.json", cp)
        atomic_text(job / "brief.md", f"# {jid}: {m['brief']['title']}\n\n{args.brief}\n")
        atomic_text(job / "HANDOFF.md", handoff(m, cp))
        dest = prod / "media" / actual["sha256"]
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.exists():
            for p in parts:
                check_file(safe_path(root, p["path"]), p)
        else:
            os.replace(archive, dest)
        (prod / "jobs").mkdir(exist_ok=True)
        os.rename(job, prod / "jobs" / jid)
    sync(root)
    return {"job_id": jid, "duplicate": False, "status": "staged",
            "sha256": actual["sha256"], "parts": len(parts), "next_step": cp["next_step"]}


def repair_part(root, part):
    path = safe_path(root, part["path"])
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix=".beles-part-", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as out:
            # Read only the declared content-addressed object; never restore an arbitrary path.
            proc = subprocess.run(["git", "-C", str(root), "cat-file", "blob", part["git_blob_sha"]],
                                  stdout=out, stderr=subprocess.PIPE)
            out.flush()
            os.fsync(out.fileno())
        if proc.returncode:
            raise Error(f"Cannot repair {part['path']} from Git objects; fetch/clone the published commit first")
        check_file(Path(name), part)
        os.replace(name, path)
    finally:
        Path(name).unlink(missing_ok=True)


def archive_check(root, m, repair=False):
    total = hashlib.sha256()
    size = 0
    results = []
    for part in m["source"]["parts"]:
        path = safe_path(root, part["path"])
        repaired = False
        try:
            check_file(path, part)
        except Error:
            if not repair:
                raise
            repair_part(root, part)
            repaired = True
        with path.open("rb") as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                total.update(chunk)
                size += len(chunk)
        results.append({**part, "verified": True, "repaired": repaired})
    if total.hexdigest() != m["source"]["sha256"] or size != m["source"]["bytes"]:
        raise Error("Concatenated archive checksum mismatch; cache left untouched")
    return results


def restore(root, jid):
    m = load_manifest(root, jid)
    parts = archive_check(root, m, repair=True)
    target = safe_path(root, m["source"]["cache_path"])
    try:
        check_file(target, m["source"])
        info = probe(target)
        validate_probe(info, m["source"]["probe"])
        return {"job_id": jid, "action": "already_valid", "parts": parts, "probe": info}
    except Error:
        pass
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix=".beles-restore-", suffix=".mp4", dir=target.parent)
    try:
        with os.fdopen(fd, "wb") as out:
            for part in m["source"]["parts"]:
                with safe_path(root, part["path"]).open("rb") as stream:
                    shutil.copyfileobj(stream, out)
            out.flush()
            os.fsync(out.fileno())
        check_file(Path(name), m["source"])
        info = probe(Path(name))
        validate_probe(info, m["source"]["probe"])
        os.replace(name, target)
    finally:
        Path(name).unlink(missing_ok=True)
    return {"job_id": jid, "action": "restored", "cache_path": m["source"]["cache_path"],
            "bytes": m["source"]["bytes"], "sha256": m["source"]["sha256"], "parts": parts, "probe": info}


def verify(root, jid, record=False):
    m = load_manifest(root, jid)
    parts = archive_check(root, m)
    source = safe_path(root, m["source"]["cache_path"])
    actual = check_file(source, m["source"])
    info = probe(source)
    validate_probe(info, m["source"]["probe"])
    result = {"job_id": jid, "verified": True, "bytes": actual["bytes"],
              "sha256": actual["sha256"], "parts": parts, "probe": info}
    if record:
        # Only accept archive metadata/parts identical to the checked Git commit.
        paths = [f"production/jobs/{jid}/manifest.json"] + [p["path"] for p in m["source"]["parts"]]
        for path in paths:
            if git(root, "rev-parse", f"HEAD:{path}") != hashes(safe_path(root, path))["git_blob_sha"]:
                raise Error(f"Uncommitted archive/manifest: {path}; publish and use a fresh clone first")
        origin = git(root, "remote", "get-url", "origin")
        origin = re.sub(r"(https?://)[^/@]+@", r"\1", origin)
        result.update({"checked_commit": git(root, "rev-parse", "HEAD"), "checked_at": now(),
                       "origin": origin})
        folder = root / "production/jobs" / jid
        old = delivery(root, m)
        if not old or old.get("checked_commit") != result["checked_commit"]:
            write_json(folder / "delivery.json", result)
        cp = checkpoint_data(root, m)
        if cp["status"] == "staged":
            cp.update({"status": "queued", "updated_at": now(),
                       "next_step": "Прочитать brief.md и STYLE_GUIDE.md; расшифровать исходник и выбрать дубли.",
                       "note": "Исходник восстановлен и проверен из опубликованных Git-объектов."})
            write_json(folder / "checkpoint.json", cp)
        sync(root)
    return result


def checkpoint(root, args):
    m = load_manifest(root, args.job_id)
    cp = checkpoint_data(root, m)
    if m["role"] == "approved_baseline" or cp["status"] == "approved":
        raise Error("Approved job is locked; register genuinely new material instead")
    status = args.status or cp["status"]
    if status != "staged" and not delivery(root, m):
        raise Error("Source delivery is unverified; publish, restore and verify --record-delivery first")
    if status == "staged" and cp["status"] != "staged":
        raise Error("A delivered job cannot be returned to staged")
    if status == "approved" and not args.user_approved:
        raise Error("Approval requires explicit user approval and --user-approved")
    artifacts = sorted(set(cp.get("artifacts", []) + (args.artifact or [])))
    for value in artifacts:
        path = safe_path(root, value)
        if not value.startswith(f"production/jobs/{args.job_id}/") or not path.is_file():
            raise Error("Artifacts must exist inside this job's directory")
    desired = {"status": status, "next_step": args.next_step, "note": args.note or "", "artifacts": artifacts}
    if all(cp.get(k) == v for k, v in desired.items()):
        return {"job_id": args.job_id, "changed": False, **desired}
    cp.update(desired)
    cp["updated_at"] = now()
    cp.setdefault("events", []).append({"at": cp["updated_at"], **desired})
    write_json(root / "production/jobs" / args.job_id / "checkpoint.json", cp)
    sync(root)
    return {"job_id": args.job_id, "changed": True, **desired}


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    sub = p.add_subparsers(dest="command", required=True)
    ing = sub.add_parser("ingest", help="Register actual NEW source; duplicate SHA returns existing ID")
    ing.add_argument("file")
    ing.add_argument("--brief", required=True)
    ing.add_argument("--title")
    ing.add_argument("--language", default="ky")
    ing.add_argument("--site")
    for name in ("status", "queue", "next", "sync"):
        cmd = sub.add_parser(name)
        if name == "status":
            cmd.add_argument("job_id", nargs="?")
    sub.add_parser("restore").add_argument("job_id")
    ver = sub.add_parser("verify")
    ver.add_argument("job_id")
    ver.add_argument("--record-delivery", action="store_true",
                     help="Run only in an independent clone of the published GitHub commit")
    cp = sub.add_parser("checkpoint")
    cp.add_argument("job_id")
    cp.add_argument("--status", choices=STATUSES)
    cp.add_argument("--next-step", required=True)
    cp.add_argument("--note")
    cp.add_argument("--artifact", action="append")
    cp.add_argument("--user-approved", action="store_true")
    args = p.parse_args(argv)
    root = args.root.resolve()
    try:
        if args.command == "status" and args.job_id:
            m = load_manifest(root, args.job_id)
            result = {"manifest": m, "checkpoint": checkpoint_data(root, m), "delivery": delivery(root, m)}
        elif args.command in ("status", "queue", "next"):
            result = snapshot(root)
            if args.command == "next":
                result = {"job_id": result["active_job_id"],
                          "next_suggested_job_id": result["next_suggested_job_id"],
                          "message": "Нет задания, готового к монтажу; проверьте staged/blocked в queue. BW-001 не переделывать." if not result["active_job_id"] else "Продолжить по checkpoint задания."}
        elif args.command == "verify" and not args.record_delivery:
            result = verify(root, args.job_id)
        else:
            with lock(root):
                if args.command == "ingest":
                    if not args.brief.strip():
                        raise Error("A nonempty brief is required")
                    result = ingest(root, args)
                elif args.command == "restore":
                    result = restore(root, args.job_id)
                elif args.command == "verify":
                    result = verify(root, args.job_id, record=True)
                elif args.command == "checkpoint":
                    if not args.next_step.strip():
                        raise Error("A concrete next step is required")
                    result = checkpoint(root, args)
                else:
                    result = sync(root)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (Error, OSError, ValueError, KeyError, TypeError) as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
