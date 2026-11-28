#!/usr/bin/env python3
"""Read-only prod.env keyring activation + startup error COUNTS.

Never prints secret values, key material, env lines, or log line text.
Never writes, restarts, or deploys.

Usage: python3 check-prod-pii-keyring-activation.py [since_utc]
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

EXPECTED_ID = os.environ.get("MG_EXPECTED_ACTIVE_KEY_ID", "p20261128")
ENV_FILE = os.environ.get("MG_ENV_FILE", "/etc/mindgarden/prod.env")
ACTIVE_FILE = os.environ.get("MG_ACTIVE_BACKEND_FILE", "/etc/mindgarden/active-backend")
LOG_DIR = os.environ.get("MG_LOG_DIR", "/var/log/mindgarden")
SINCE_UTC = sys.argv[1] if len(sys.argv) > 1 else "2026-11-28 00:59:00 UTC"
UNITS = ("mindgarden-core-blue.service", "mindgarden-core-green.service")


def has_sudo() -> bool:
    return subprocess.call(["bash", "-lc", "command -v sudo >/dev/null"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0


def test_f(path: str) -> bool:
    if has_sudo() and subprocess.call(["sudo", "test", "-f", path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0:
        return True
    return os.path.isfile(path)


def test_d(path: str) -> bool:
    if has_sudo() and subprocess.call(["sudo", "test", "-d", path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0:
        return True
    return os.path.isdir(path)


def read_file(path: str) -> str:
    """Return file text. Must not be printed by callers."""
    if has_sudo() and subprocess.call(["sudo", "test", "-f", path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0:
        try:
            return subprocess.check_output(["sudo", "cat", path], stderr=subprocess.DEVNULL, text=True)
        except subprocess.CalledProcessError:
            return ""
    try:
        return Path(path).read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def parse_env(text: str) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip().strip("\r")
        if len(val) >= 2 and val[0] == val[-1] and val[0] in ("'", '"'):
            val = val[1:-1]
        env[key] = val
    return env


def presence(val: str | None) -> str:
    return "SET" if (val or "").strip() else "EMPTY/MISSING"


def key_ids(csv: str | None) -> list[str]:
    ids: list[str] = []
    for part in (csv or "").split(","):
        part = part.strip()
        if not part:
            continue
        kid = part.split(":", 1)[0].strip()
        if kid:
            ids.append(kid)
    return ids


HMAC_ERR_RE = re.compile(
    r"(PERSONAL_DATA_HMAC_SECRET 미설정|HMAC-SHA256 계산 실패|"
    r"HMAC.*(fail|error|invalid|missing|미설정|실패)|"
    r"PiiHmac.*(fail|error|invalid|Exception))",
    re.I,
)
REDIS_RE = re.compile(
    r"RedisConnection|RedisConnectionFailure|LettuceConnection|"
    r"JedisConnection|Unable to connect to Redis|"
    r"NOAUTH|redis\.clients\.jedis|io\.lettuce|"
    r"RedisCommandTimeout|Connection refused.*6379|"
    r"UnableToConnectException|RedisSystemException|"
    r"REDIS_HOST",
    re.I,
)
REDIS_ERRISH_RE = re.compile(r"error|fail|exception|timeout|unable|refused|NOAUTH|미설정", re.I)
KEY_RE = re.compile(
    r"암호화 키를 찾을 수 없습니다|개인정보 암호화 실패|개인정보 랜덤 IV 암호화 실패|"
    r"PII GCM 암호화 실패|PII GCM 복호화|구성 파싱 실패|"
    r"활성 키가 설정되지 않았거나 존재하지 않습니다|"
    r"다중 키 설정이 비어 있습니다|"
    r"BadPadding|AEADBadTag|IllegalBlockSize|InvalidKeyException|"
    r"decrypt|Decrypt|복호화|"
    r"PersonalDataEncryption|PiiCrypto|"
    r"PERSONAL_DATA_ENCRYPTION",
    re.I,
)
KEY_ERRISH_RE = re.compile(
    r"error|fail|exception|warn|찾을 수 없|실패|미설정|비어|Invalid|BadPadding|AEAD|복호화",
    re.I,
)
LEVEL_ERR_RE = re.compile(r"\b(ERROR|FATAL|Exception|SEVERE)\b", re.I)


def count_log_errors(text: str, prefix: str) -> None:
    hmac_err = redis_err = key_err = 0
    hmac_err_level = redis_err_level = key_err_level = 0
    for line in text.splitlines():
        is_err = bool(LEVEL_ERR_RE.search(line))
        if HMAC_ERR_RE.search(line):
            hmac_err += 1
            if is_err:
                hmac_err_level += 1
        if REDIS_RE.search(line) and REDIS_ERRISH_RE.search(line):
            redis_err += 1
            if is_err:
                redis_err_level += 1
        if KEY_RE.search(line) and KEY_ERRISH_RE.search(line):
            key_err += 1
            if is_err:
                key_err_level += 1
    print(f"{prefix}_hmac_error_count={hmac_err}")
    print(f"{prefix}_hmac_error_level_count={hmac_err_level}")
    print(f"{prefix}_redis_error_count={redis_err}")
    print(f"{prefix}_redis_error_level_count={redis_err_level}")
    print(f"{prefix}_key_decrypt_error_count={key_err}")
    print(f"{prefix}_key_decrypt_error_level_count={key_err_level}")


def journalctl_text(units: tuple[str, ...] | str) -> str:
    unit_args: list[str]
    if isinstance(units, str):
        unit_args = ["-u", units]
    else:
        unit_args = []
        for u in units:
            unit_args.extend(["-u", u])
    cmd = ["journalctl", *unit_args, "--since", SINCE_UTC, "--no-pager", "-o", "cat"]
    if has_sudo():
        cmd = ["sudo", *cmd]
    try:
        return subprocess.check_output(cmd, stderr=subprocess.DEVNULL, text=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        return ""


def filelog_text() -> tuple[str, int]:
    if not test_d(LOG_DIR):
        return "", -1
    find_cmd = [
        "find",
        LOG_DIR,
        "-maxdepth",
        "2",
        "-type",
        "f",
        "(",
        "-name",
        "*.log",
        "-o",
        "-name",
        "*.log.1",
        "-o",
        "-name",
        "spring*.out",
        "-o",
        "-name",
        "app*.log",
        ")",
        "-size",
        "-20M",
        "-print",
    ]
    if has_sudo():
        find_cmd = ["sudo", *find_cmd]
    try:
        paths = subprocess.check_output(find_cmd, stderr=subprocess.DEVNULL, text=True).splitlines()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "", 0
    chunks: list[str] = []
    for p in paths:
        chunks.append(read_file(p))
    return "".join(chunks), len(paths)


def main() -> int:
    print("==========================================")
    print("prod PII keyring activation check (read-only)")
    print(f"env_file_name={os.path.basename(ENV_FILE)}")
    print(f"expected_active_key_id={EXPECTED_ID}")
    print(f"log_since={SINCE_UTC}")
    print("NO values, NO log text, NO restart.")
    print("==========================================")

    print("")
    print("1) prod.env keyring (compare/counts only)")
    print("------------------------------------------")
    if not test_f(ENV_FILE):
        print("env_file=MISSING")
        print(f"active_key_id_is_{EXPECTED_ID}=NO")
        print("keys_keyid_count=0")
        print(f"keys_has_{EXPECTED_ID}=NO")
        print("keys_has_other_keyid=NO")
        print("hmac=EMPTY/MISSING")
        print("redis_host=EMPTY/MISSING")
        print("redis_port=EMPTY/MISSING")
    else:
        print("env_file=PRESENT")
        env = parse_env(read_file(ENV_FILE))
        active = env.get("PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID", "")
        print("active_key_id_set=" + presence(active))
        print(f"active_key_id_is_{EXPECTED_ID}={'YES' if active == EXPECTED_ID else 'NO'}")

        kids = key_ids(env.get("PERSONAL_DATA_ENCRYPTION_KEYS", ""))
        print("keys=" + presence(env.get("PERSONAL_DATA_ENCRYPTION_KEYS", "")))
        print(f"keys_keyid_count={len(kids)}")
        print(f"keys_unique_keyid_count={len(set(kids))}")
        print(f"keys_has_{EXPECTED_ID}={'YES' if EXPECTED_ID in kids else 'NO'}")
        print("keys_has_other_keyid=" + ("YES" if any(k != EXPECTED_ID for k in kids) else "NO"))

        ivids = key_ids(env.get("PERSONAL_DATA_ENCRYPTION_IVS", ""))
        print("ivs=" + presence(env.get("PERSONAL_DATA_ENCRYPTION_IVS", "")))
        print(f"ivs_keyid_count={len(ivids)}")
        print(f"ivs_has_{EXPECTED_ID}={'YES' if EXPECTED_ID in ivids else 'NO'}")
        print("ivs_has_other_keyid=" + ("YES" if any(k != EXPECTED_ID for k in ivids) else "NO"))

        print("hmac=" + presence(env.get("PERSONAL_DATA_HMAC_SECRET", "")))
        print("redis_host=" + presence(env.get("REDIS_HOST", "")))
        print("redis_port=" + presence(env.get("REDIS_PORT", "")))
        print("redis_password=" + presence(env.get("REDIS_PASSWORD", "")))

    print("")
    print("2) active backend slot (name only)")
    print("------------------------------------------")
    if test_f(ACTIVE_FILE):
        slot = read_file(ACTIVE_FILE).strip().lower()
        if slot in ("blue", "green"):
            print(f"active_backend={slot}")
        elif not slot:
            print("active_backend=EMPTY")
        else:
            print(f"active_backend=UNEXPECTED_LEN={len(slot)}")
    else:
        print("active_backend=FILE_MISSING")

    print("")
    print("3) startup / journal error counts (text suppressed)")
    print("------------------------------------------")
    which = subprocess.call(["bash", "-lc", "command -v journalctl >/dev/null"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if which != 0:
        print("journalctl=MISSING")
    else:
        print("journalctl=PRESENT")
        for unit in UNITS:
            short = unit[: -len(".service")] if unit.endswith(".service") else unit
            count_log_errors(journalctl_text(unit), f"journal_{short}")
        count_log_errors(journalctl_text(UNITS), "journal_combined")

    print("")
    print("4) /var/log/mindgarden file error counts (counts only)")
    print("------------------------------------------")
    if not test_d(LOG_DIR):
        print("log_dir=MISSING_OR_UNREADABLE")
        print("filelog_hmac_error_count=-1")
        print("filelog_redis_error_count=-1")
        print("filelog_key_decrypt_error_count=-1")
    else:
        print("log_dir=PRESENT")
        text, nfiles = filelog_text()
        print(f"log_file_count={nfiles}")
        count_log_errors(text, "filelog")

    print("")
    print("done (read-only).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
