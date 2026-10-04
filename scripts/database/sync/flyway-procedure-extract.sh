#!/bin/bash
# Flyway·PlSqlInitializer 가 소유한 온보딩 프로시저 정의를 개발 DB 재적재용 SQL 로 뽑는다.
# generate: MANIFEST.tsv 의 원본에서 <이름>_devsync.sql 을 다시 만든다.
# check   : 저장소에 커밋된 SQL 이 원본과 같은지, flyway-latest 원본이 실제 최신 마이그레이션인지 검사한다.
#           (CI 가 이 모드를 돌려 복사본이 낡는 것을 막는다. DB 접속·DDL 은 하지 않는다.)
#
# 이 스크립트는 개발 DB 전용 산출물만 만든다. 운영 배포 경로
# (database/schema/procedures_standardized, deploy-procedures-prod.yml,
#  deploy-procedures-production-mysql.yml) 는 건드리지 않는다.
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
DEV_SYNC_REL="database/schema/procedures_flyway_dev_sync"

fail() {
    echo "❌ $1" >&2
    exit 1
}

flyway_procedure_extract_main() {
    local mode="${1:-}"
    case "$mode" in
        generate|check) ;;
        *)
            echo "usage: flyway-procedure-extract.sh generate|check" >&2
            return 1
            ;;
    esac
    [ -f "$ROOT/$DEV_SYNC_REL/MANIFEST.tsv" ] || fail "MANIFEST.tsv 가 없습니다: $DEV_SYNC_REL"
    command -v python3 >/dev/null 2>&1 || fail "python3 가 필요합니다."
    FLYWAY_PROC_ROOT="$ROOT" FLYWAY_PROC_REL="$DEV_SYNC_REL" FLYWAY_PROC_MODE="$mode" python3 - <<'PY'
import os
import re
import sys
from pathlib import Path

root = Path(os.environ["FLYWAY_PROC_ROOT"])
dev_sync = root / os.environ["FLYWAY_PROC_REL"]
mode = os.environ["FLYWAY_PROC_MODE"]
migration_dir = root / "src/main/resources/db/migration"
initializer = root / "src/main/java/com/coresolution/consultation/config/PlSqlInitializer.java"

IDENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
# IF / LOOP / WHILE / REPEAT 는 END IF 같은 전용 종료가 있어 깊이를 세지 않는다.
SELF_CLOSING_END = ("IF", "LOOP", "WHILE", "REPEAT")


def strip_noise(text):
    """주석과 문자열 리터럴을 같은 길이의 공백으로 바꿔 인덱스를 보존한다."""
    out = list(text)
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch == "-" and text.startswith("--", i):
            while i < n and text[i] != "\n":
                out[i] = " "
                i += 1
            continue
        if ch == "/" and text.startswith("/*", i):
            end = text.find("*/", i + 2)
            end = n if end < 0 else end + 2
            for j in range(i, end):
                if out[j] != "\n":
                    out[j] = " "
            i = end
            continue
        if ch in ("'", '"', "`"):
            quote = ch
            out[i] = " "
            i += 1
            while i < n:
                if text[i] == "\\" and i + 1 < n:
                    out[i] = " "
                    out[i + 1] = " "
                    i += 2
                    continue
                if text[i] == quote:
                    out[i] = " "
                    i += 1
                    break
                if out[i] != "\n":
                    out[i] = " "
                i += 1
            continue
        i += 1
    return "".join(out)


def find_outer_end(masked, start):
    """CREATE PROCEDURE 시작 위치에서 바깥 BEGIN 과 짝이 되는 END 의 끝 인덱스를 찾는다.

    BEGIN 과 CASE 만 깊이를 올린다. CASE 는 문(END CASE)·식(END) 어느 쪽이든 END 하나로 닫히고,
    IF/LOOP/WHILE/REPEAT 은 END IF 처럼 전용 종료가 있어 깊이를 세지 않는다.
    """
    depth = 0
    seen_begin = False
    # "END CASE" 의 CASE 는 블록을 여는 토큰이 아니므로 한 번 건너뛴다.
    consumed_case = -1
    for match in re.finditer(r"\b(BEGIN|CASE|END)\b", masked[start:], re.IGNORECASE):
        word = match.group(1).upper()
        if word in ("BEGIN", "CASE"):
            if word == "CASE" and start + match.start() == consumed_case:
                continue
            depth += 1
            seen_begin = seen_begin or word == "BEGIN"
            continue
        tail = masked[start + match.end():]
        next_word = re.match(r"\s*([A-Za-z_][A-Za-z0-9_]*)", tail)
        next_upper = next_word.group(1).upper() if next_word else ""
        if next_upper in SELF_CLOSING_END:
            continue
        depth -= 1
        if next_upper == "CASE":
            consumed_case = start + match.end() + next_word.start(1)
            continue
        if depth == 0 and seen_begin:
            end = start + match.end()
            if next_word and IDENT.match(next_word.group(1)):
                end = start + match.end() + next_word.end()
            return end
        if depth < 0:
            break
    raise ValueError("바깥 END 를 찾지 못했습니다")


def extract(source_path, name):
    text = source_path.read_text(encoding="utf-8")
    masked = strip_noise(text)
    create = re.search(
        r"\bCREATE\s+(?:DEFINER\s*=\s*\S+\s+)?PROCEDURE\s+" + re.escape(name) + r"\s*\(",
        masked,
        re.IGNORECASE,
    )
    if not create:
        raise ValueError(f"CREATE PROCEDURE {name} 를 찾지 못했습니다: {source_path}")
    end = find_outer_end(masked, create.start())
    return text[create.start():end].rstrip()


def render(name, source_rel, body):
    return (
        "-- 생성 파일 — 직접 고치지 마세요.\n"
        "-- 생성: scripts/database/sync/flyway-procedure-extract.sh generate\n"
        f"-- 원본: {source_rel}\n"
        "-- 용도: 야간 운영→개발 복사 뒤 개발 DB 재적재 전용. 운영 배포 경로와 무관합니다.\n"
        "DELIMITER //\n"
        "\n"
        f"DROP PROCEDURE IF EXISTS {name} //\n"
        "\n"
        f"{body} //\n"
        "\n"
        "DELIMITER ;\n"
    )


def migration_version(path):
    match = re.match(r"V([0-9][0-9_.]*)__", path.name)
    if not match:
        return None
    parts = re.split(r"[._]", match.group(1))
    return tuple(int(part) for part in parts if part != "")


def latest_migration_for(name):
    pattern = re.compile(
        r"\bCREATE\s+(?:DEFINER\s*=\s*\S+\s+)?PROCEDURE\s+" + re.escape(name) + r"\s*\(",
        re.IGNORECASE,
    )
    best = None
    for path in sorted(migration_dir.glob("V*.sql")):
        version = migration_version(path)
        if version is None:
            continue
        if not pattern.search(strip_noise(path.read_text(encoding="utf-8"))):
            continue
        if best is None or version > best[0]:
            best = (version, path)
    return None if best is None else best[1]


entries = []
for raw in (dev_sync / "MANIFEST.tsv").read_text(encoding="utf-8").splitlines():
    line = raw.strip()
    if not line or line.startswith("#"):
        continue
    cols = raw.split("\t")
    if len(cols) != 3:
        print(f"MANIFEST 열이 3개가 아닙니다: {raw}", file=sys.stderr)
        sys.exit(2)
    name, source_rel, kind = (col.strip() for col in cols)
    if not IDENT.match(name):
        print(f"프로시저 이름 형식이 아닙니다: {name}", file=sys.stderr)
        sys.exit(2)
    if kind not in ("flyway-latest", "pinned"):
        print(f"알 수 없는 원본 종류: {kind}", file=sys.stderr)
        sys.exit(2)
    entries.append((name, source_rel, kind))

if not entries:
    print("MANIFEST 에 항목이 없습니다.", file=sys.stderr)
    sys.exit(2)

problems = []
for name, source_rel, kind in entries:
    source = root / source_rel
    if not source.is_file():
        problems.append(f"{name}: 원본 파일이 없습니다 ({source_rel})")
        continue
    if kind == "flyway-latest":
        latest = latest_migration_for(name)
        if latest is None:
            problems.append(f"{name}: CREATE 하는 마이그레이션이 없습니다")
            continue
        latest_rel = latest.relative_to(root).as_posix()
        if latest_rel != source_rel:
            problems.append(
                f"{name}: MANIFEST 원본이 최신 마이그레이션이 아닙니다 "
                f"(manifest={source_rel} latest={latest_rel}) — generate 로 갱신하세요"
            )
            continue
    else:
        if not initializer.is_file():
            problems.append(f"{name}: PlSqlInitializer.java 를 찾지 못했습니다")
            continue
        if source_rel.split("src/main/resources/", 1)[-1] not in initializer.read_text(encoding="utf-8"):
            problems.append(
                f"{name}: pinned 원본이 PlSqlInitializer 에서 쓰이지 않습니다 ({source_rel})"
            )
            continue
    try:
        rendered = render(name, source_rel, extract(source, name))
    except ValueError as exc:
        problems.append(f"{name}: {exc}")
        continue
    target = dev_sync / f"{name}_devsync.sql"
    if mode == "generate":
        target.write_text(rendered, encoding="utf-8")
        print(f"생성: {target.relative_to(root).as_posix()}")
        continue
    if not target.is_file():
        problems.append(f"{name}: 생성 SQL 이 없습니다 — generate 를 돌리세요")
        continue
    if target.read_text(encoding="utf-8") != rendered:
        problems.append(f"{name}: 생성 SQL 이 원본과 다릅니다 — generate 를 돌리세요")

known = {f"{name}_devsync.sql" for name, _, _ in entries}
for path in sorted(dev_sync.glob("*_devsync.sql")):
    if path.name not in known:
        problems.append(f"{path.name}: MANIFEST 에 없는 파일입니다")

if problems:
    for problem in problems:
        print(f"FAIL {problem}", file=sys.stderr)
    sys.exit(1)

print(f"flyway-procedure-extract {mode} ok: {len(entries)}건")
PY
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
    flyway_procedure_extract_main "$@"
fi
