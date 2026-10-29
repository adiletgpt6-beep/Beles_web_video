#!/usr/bin/env python3
"""Integration checks in disposable Git repositories. No network, API, paid runner or render."""
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import unittest

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / "scripts/beles.py"
RESULTS = []


def command(*args, cwd=None):
    return subprocess.run([str(x) for x in args], cwd=cwd, check=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True).stdout


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class Workflow(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="beles-integration-")
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name) / "repo"
        self.repo.mkdir()
        (self.repo / "scripts").mkdir()
        shutil.copy(CLI, self.repo / "scripts/beles.py")
        shutil.copy(ROOT / ".gitignore", self.repo / ".gitignore")
        # Use the real archived baseline bytes, never the old local MP4.
        shutil.copytree(ROOT / "production/media", self.repo / "production/media")
        baseline = self.repo / "production/jobs/BW-001"
        baseline.mkdir(parents=True)
        shutil.copy(ROOT / "production/jobs/BW-001/manifest.json", baseline / "manifest.json")
        shutil.copy(ROOT / "production/STATE.json", self.repo / "production/STATE.json")
        command("git", "init", "-q", cwd=self.repo)
        command("git", "remote", "add", "origin", str(Path(self.temp.name) / "local-test-origin.git"), cwd=self.repo)
        self.cli("sync")
        self.commit()

    def cli(self, *args, root=None, ok=True):
        repo = root or self.repo
        proc = subprocess.run([sys.executable, str(repo / "scripts/beles.py"), *args],
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=repo)
        self.assertEqual(proc.returncode, 0 if ok else 1, proc.stdout + proc.stderr)
        return json.loads(proc.stdout if ok else proc.stderr)

    def commit(self, root=None):
        repo = root or self.repo
        command("git", "add", "--all", cwd=repo)
        command("git", "-c", "user.name=Beles integration", "-c", "user.email=test@example.invalid",
                "commit", "-qm", "isolated test checkpoint", cwd=repo)

    def new_video(self):
        video = Path(self.temp.name) / "new.mp4"
        command("ffmpeg", "-v", "error", "-f", "lavfi", "-i", "color=c=blue:s=32x32:r=30",
                "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", "0.4",
                "-c:v", "libx264", "-c:a", "aac", "-y", video)
        return video

    def source(self, root=None):
        repo = root or self.repo
        manifest = json.loads((repo / "production/jobs/BW-001/manifest.json").read_text())
        return manifest, repo / manifest["source"]["cache_path"]

    def tracked_snapshot(self):
        return {str(p.relative_to(self.repo)): digest(p) for p in self.repo.rglob("*")
                if p.is_file() and ".git" not in p.relative_to(self.repo).parts
                and p.name != ".beles.lock"}

    def test_baseline_restore_verify_and_repeat(self):
        m, cache = self.source()
        self.assertFalse(cache.exists())
        restored = self.cli("restore", "BW-001")
        self.assertEqual(restored["action"], "restored")
        self.assertEqual(len(restored["parts"]), 4)
        self.assertEqual(digest(cache), m["source"]["sha256"])
        self.assertEqual(self.cli("verify", "BW-001")["probe"], m["source"]["probe"])
        before = self.tracked_snapshot()
        self.assertEqual(self.cli("restore", "BW-001")["action"], "already_valid")
        self.assertEqual(before, self.tracked_snapshot())

    def test_deleted_and_same_size_corrupt_mp4(self):
        m, cache = self.source()
        self.cli("restore", "BW-001")
        cache.unlink()
        self.assertEqual(self.cli("restore", "BW-001")["action"], "restored")
        with cache.open("r+b") as f:
            f.seek(111)
            f.write(b"bad!")
        self.assertIn("mismatch", self.cli("verify", "BW-001", ok=False)["error"])
        self.cli("restore", "BW-001")
        self.assertEqual(digest(cache), m["source"]["sha256"])

    def test_missing_and_corrupt_parts_repaired_from_git(self):
        m, _ = self.source()
        (self.repo / m["source"]["parts"][0]["path"]).unlink()
        path = self.repo / m["source"]["parts"][1]["path"]
        with path.open("r+b") as f:
            f.write(b"broken!")
        self.cli("verify", "BW-001", ok=False)
        data = self.cli("restore", "BW-001")
        self.assertEqual([p["repaired"] for p in data["parts"]], [True, True, False, False])
        self.cli("verify", "BW-001")

    def test_duplicate_baseline_and_new_source(self):
        self.cli("restore", "BW-001")
        _, cache = self.source()
        before = self.tracked_snapshot()
        self.assertEqual(self.cli("ingest", str(cache), "--brief", "Повтор")["job_id"], "BW-001")
        self.assertEqual(before, self.tracked_snapshot())
        video = self.new_video()
        first = self.cli("ingest", str(video), "--brief", "Изолированный тест")
        self.assertEqual(first["job_id"], "BW-002")
        alternate = video.with_name("renamed.mp4")
        shutil.copy(video, alternate)
        before = self.tracked_snapshot()
        repeated = self.cli("ingest", str(alternate), "--brief", "Другой текст")
        self.assertTrue(repeated["duplicate"])
        self.assertEqual(repeated["job_id"], "BW-002")
        self.assertEqual(before, self.tracked_snapshot())
        self.assertIsNone(self.cli("next")["job_id"])

    def test_unpublished_source_cannot_enter_queue(self):
        self.cli("ingest", str(self.new_video()), "--brief", "Изолированный тест")
        self.cli("restore", "BW-002")
        self.cli("verify", "BW-002", "--record-delivery", ok=False)
        data = self.cli("checkpoint", "BW-002", "--status", "in_progress", "--next-step", "Расшифровать", ok=False)
        self.assertIn("unverified", data["error"])

    def test_chat_handoff_via_two_independent_git_clones(self):
        self.cli("ingest", str(self.new_video()), "--brief", "Тест перехода между чатами")
        self.commit()
        clone = Path(self.temp.name) / "chat-two"
        command("git", "clone", "-q", "--no-hardlinks", str(self.repo), str(clone))
        m = json.loads((clone / "production/jobs/BW-002/manifest.json").read_text())
        self.assertFalse((clone / m["source"]["cache_path"]).exists())
        self.cli("restore", "BW-002", root=clone)
        self.cli("verify", "BW-002", "--record-delivery", root=clone)
        self.assertEqual(self.cli("next", root=clone)["job_id"], "BW-002")
        artifact = clone / "production/jobs/BW-002/transcript.md"
        artifact.write_text("Тестовый текст", encoding="utf-8")
        args = ("checkpoint", "BW-002", "--status", "in_progress", "--next-step",
                "Проверить кыргызские ө, ү, ң в отрезке 00:01–00:02", "--note", "Продолжить с сохранённого места",
                "--artifact", "production/jobs/BW-002/transcript.md")
        self.cli(*args, root=clone)
        self.assertFalse(self.cli(*args, root=clone)["changed"])
        (clone / "production/registry.json").unlink()  # interrupted derived-index write
        self.cli("sync", root=clone)
        self.commit(root=clone)
        final = Path(self.temp.name) / "chat-three"
        command("git", "clone", "-q", "--no-hardlinks", str(clone), str(final))
        state = self.cli("status", "BW-002", root=final)
        self.assertEqual(state["checkpoint"]["next_step"], args[5])
        self.assertEqual(len(state["checkpoint"]["events"]), 1)
        self.assertEqual(state["checkpoint"]["artifacts"], ["production/jobs/BW-002/transcript.md"])
        self.assertEqual(self.cli("next", root=final)["job_id"], "BW-002")
        self.cli("restore", "BW-002", root=final)
        self.cli("verify", "BW-002", root=final)

    def test_baseline_locked_and_empty_queue(self):
        before = self.tracked_snapshot()
        data = self.cli("checkpoint", "BW-001", "--status", "queued", "--next-step", "Переделать", ok=False)
        self.assertIn("locked", data["error"])
        self.assertEqual(before, self.tracked_snapshot())
        self.assertIsNone(self.cli("next")["job_id"])
        self.assertEqual(self.cli("next")["next_suggested_job_id"], "BW-002")

    def test_failed_restore_preserves_valid_cache(self):
        self.cli("restore", "BW-001")
        m, cache = self.source()
        before = digest(cache)
        m["source"]["parts"][0]["sha256"] = "0" * 64
        (self.repo / "production/jobs/BW-001/manifest.json").write_text(json.dumps(m))
        self.cli("restore", "BW-001", ok=False)
        self.assertEqual(before, digest(cache))
        self.assertFalse(list(cache.parent.glob(".beles-restore-*")))

    def test_invalid_input_paths_and_size_limit(self):
        invalid = Path(self.temp.name) / "not-video.mp4"
        invalid.write_bytes(b"not a video")
        self.cli("ingest", str(invalid), "--brief", "Тест", ok=False)
        huge = Path(self.temp.name) / "too-large.mp4"
        with huge.open("wb") as f:
            f.truncate(100 * 1024 * 1024 + 1)
        self.assertIn("100 MiB", self.cli("ingest", str(huge), "--brief", "Тест", ok=False)["error"])
        self.assertEqual(len(self.cli("queue")["jobs"]), 1)
        m, _ = self.source()
        m["source"]["cache_path"] = "../outside.mp4"
        (self.repo / "production/jobs/BW-001/manifest.json").write_text(json.dumps(m))
        self.assertIn("escapes", self.cli("restore", "BW-001", ok=False)["error"])

    def test_lock_and_idempotent_sync(self):
        before = self.tracked_snapshot()
        self.cli("sync")
        self.assertEqual(before, self.tracked_snapshot())
        with (self.repo / ".beles.lock").open("a") as stream:
            fcntl.flock(stream.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.assertIn("writer", self.cli("sync", ok=False)["error"])


class Recorder(unittest.TextTestResult):
    def addSuccess(self, test):
        super().addSuccess(test)
        RESULTS.append({"test": test.id().split(".")[-1], "passed": True})

    def addFailure(self, test, err):
        super().addFailure(test, err)
        RESULTS.append({"test": test.id().split(".")[-1], "passed": False})

    def addError(self, test, err):
        super().addError(test, err)
        RESULTS.append({"test": test.id().split(".")[-1], "passed": False})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", type=Path)
    opts = parser.parse_args()
    started = time.time()
    result = unittest.TextTestRunner(verbosity=2, resultclass=Recorder).run(
        unittest.defaultTestLoader.loadTestsFromTestCase(Workflow))
    if opts.report:
        opts.report.parent.mkdir(parents=True, exist_ok=True)
        report = {"passed": result.wasSuccessful(), "tests_run": result.testsRun,
                  "seconds": round(time.time() - started, 3), "cases": RESULTS,
                  "scope": "Real BW-001 archive + synthetic video in disposable local Git repos; no network or production BW-002 created",
                  "python": sys.version.split()[0],
                  "ffprobe": command("ffprobe", "-version").splitlines()[0],
                  "tool_sha256": digest(CLI)}
        opts.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    sys.exit(0 if result.wasSuccessful() else 1)
