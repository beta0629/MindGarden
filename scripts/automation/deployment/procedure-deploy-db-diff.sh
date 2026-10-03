#!/bin/bash
# 저장소 배포 SQL 의 파라미터와 대상 DB information_schema.PARAMETERS 를 비교한다.
# 입력: PROCEDURE_DEPLOY_DB_DIFF_SNAPSHOT (mysql --batch TSV). 없으면 DB_* 로 SELECT 만 실행한다.
# 출력: 차이 목록(이름, missing|count|mode|type|order, repo vs db).
# PROCEDURE_DEPLOY_DB_DIFF_CONFIRM=CONFIRM 일 때만 PROCEDURE_DEPLOY_DB_DIFF_LIST 에 배포 SQL 경로를 쓴다.
# confirm 이 아니면 DDL 용 목록을 만들지 않고 0 으로 끝난다.

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/procedure-deploy-changed-only.sh"

repo=$(procedure_deploy_repo_root) || {
    echo "저장소 루트를 알 수 없습니다." >&2
    exit 2
}

snap="${PROCEDURE_DEPLOY_DB_DIFF_SNAPSHOT:-}"
if [ -z "$snap" ]; then
    echo "PARAMETER 스냅샷이 없습니다. DDL 은 하지 않습니다." >&2
    exit 2
fi
if [ ! -f "$snap" ]; then
    echo "PARAMETER 스냅샷을 열 수 없습니다. DDL 은 하지 않습니다." >&2
    exit 2
fi

list_file="${PROCEDURE_DEPLOY_DB_DIFF_LIST:-}"
export PROCEDURE_DEPLOY_REPO="$repo"
export PROCEDURE_DEPLOY_DB_DIFF_SNAPSHOT="$snap"
export PROCEDURE_DEPLOY_DB_DIFF_LIST="${list_file}"
export PROCEDURE_DEPLOY_DB_DIFF_CONFIRM="${PROCEDURE_DEPLOY_DB_DIFF_CONFIRM:-}"

python3 - <<'PY'
import csv, os, sys
from pathlib import Path

repo = Path(os.environ["PROCEDURE_DEPLOY_REPO"])
snap = Path(os.environ["PROCEDURE_DEPLOY_DB_DIFF_SNAPSHOT"])
confirm = os.environ.get("PROCEDURE_DEPLOY_DB_DIFF_CONFIRM", "")
list_path = os.environ.get("PROCEDURE_DEPLOY_DB_DIFF_LIST", "")
deploy_dir = repo / "database/schema/procedures_standardized/deployment"

def is_ident(name):
    if not name or name[0].isdigit():
        return False
    return all(c.isalnum() or c == "_" for c in name)

def norm_type(raw):
    text = (raw or "").strip().upper()
    if not text:
        return ""
    base = text.split("(", 1)[0].strip()
    aliases = {
        "BOOLEAN": "BOOL",
        "BOOL": "BOOL",
        "TINYINT": "BOOL",
        "BIT": "BOOL",
        "INT": "INT",
        "INTEGER": "INT",
        "DECIMAL": "DECIMAL",
        "NUMERIC": "DECIMAL",
        "VARCHAR": "VARCHAR",
        "CHAR": "VARCHAR",
        "TEXT": "TEXT",
        "TINYTEXT": "TEXT",
        "MEDIUMTEXT": "TEXT",
        "LONGTEXT": "TEXT",
    }
    return aliases.get(base, base)

def closing_paren(text, open_at):
    depth = 0
    for i in range(open_at, len(text)):
        if text[i] == "(":
            depth += 1
        elif text[i] == ")":
            depth -= 1
            if depth == 0:
                return i
    raise ValueError("parameter list not closed")

def split_top(body):
    parts = []
    current = []
    depth = 0
    for ch in body:
        if ch == "(":
            depth += 1
            current.append(ch)
        elif ch == ")":
            depth -= 1
            current.append(ch)
        elif ch == "," and depth == 0:
            parts.append("".join(current).strip())
            current = []
        else:
            current.append(ch)
    tail = "".join(current).strip()
    if tail:
        parts.append(tail)
    return parts

def parse_sql(path, procedure):
    text = path.read_text(encoding="utf-8")
    key = "CREATE PROCEDURE " + procedure + "("
    idx = text.find(key)
    if idx < 0:
        key = "CREATE PROCEDURE `" + procedure + "`("
        idx = text.find(key)
        if idx < 0:
            raise ValueError("CREATE PROCEDURE missing: " + procedure)
    open_at = text.find("(", idx)
    end = closing_paren(text, open_at)
    params = []
    body = "\n".join(line.split("--", 1)[0] for line in text[open_at + 1:end].splitlines())
    for part in split_top(body):
        if not part:
            continue
        tokens = part.replace("\n", " ").split()
        if len(tokens) < 3:
            raise ValueError("bad parameter: " + part)
        mode = tokens[0].upper()
        if mode not in ("IN", "OUT", "INOUT"):
            raise ValueError("bad mode: " + part)
        name = tokens[1].strip("`")
        data_type = tokens[2]
        params.append((mode, name, norm_type(data_type)))
    return params

def fmt(params):
    if params is None:
        return "missing"
    body = ", ".join(f"{i}:{mode}:{data_type}:{name}" for i, (mode, name, data_type) in enumerate(params, 1))
    return f"{len(params)} [{body}]"

repo_procs = {}
for path in sorted(deploy_dir.glob("*_deploy.sql")):
    name = path.name[: -len("_deploy.sql")]
    if not is_ident(name):
        print(f"거부: 프로시저 이름 형식이 아닙니다: {name}", file=sys.stderr)
        sys.exit(2)
    repo_procs[name] = parse_sql(path, name)

db_exists = set()
db_params = {}
with snap.open(encoding="utf-8", newline="") as fh:
    reader = csv.reader(fh, delimiter="\t")
    for row in reader:
        if not row or not row[0].strip():
            continue
        kind = row[0].strip()
        if len(row) < 3:
            continue
        name = row[1].strip()
        if not name:
            continue
        if kind == "R":
            db_exists.add(name)
            db_params.setdefault(name, [])
            continue
        if kind != "P":
            continue
        db_exists.add(name)
        ordinal = int(row[2])
        mode = (row[3] if len(row) > 3 else "").strip().upper()
        pname = (row[4] if len(row) > 4 else "").strip()
        data_type = norm_type(row[5] if len(row) > 5 else "")
        db_params.setdefault(name, []).append((ordinal, mode, pname, data_type))

for name, rows in db_params.items():
    rows.sort(key=lambda item: item[0])

diffs = []
for name in sorted(repo_procs):
    repo_params = repo_procs[name]
    if name not in db_exists:
        diffs.append((name, "missing", repo_params, None))
        continue
    db_rows = [row for row in db_params.get(name, []) if row[0] > 0]
    db_sig = [(mode, pname, data_type) for _, mode, pname, data_type in db_rows]
    if len(db_sig) != len(repo_params):
        diffs.append((name, "count", repo_params, db_sig))
        continue
    kind = None
    for repo_param, db_param in zip(repo_params, db_sig):
        if repo_param[0] != db_param[0]:
            kind = "mode"
            break
        if repo_param[2] != db_param[2]:
            kind = "type"
            break
        if repo_param[1].lower() != db_param[1].lower():
            kind = "order"
            break
    if kind:
        diffs.append((name, kind, repo_params, db_sig))

print(f"db-diff procedures repo={len(repo_procs)} db={len(db_exists)} differ={len(diffs)}")
if not diffs:
    print("db-diff: 차이 없음")
for name, kind, repo_params, db_sig in diffs:
    print(f"DIFF\t{name}\t{kind}\trepo={fmt(repo_params)}\tdb={fmt(db_sig)}")

if confirm != "CONFIRM":
    print("db-diff: confirm 이 없어 배포 목록을 만들지 않습니다.")
    sys.exit(0)

if not list_path:
    print("db-diff: 배포 목록 경로가 없습니다.", file=sys.stderr)
    sys.exit(2)

lines = []
for name, _, _, _ in diffs:
    if not is_ident(name):
        print(f"거부: 프로시저 이름 형식이 아닙니다: {name}", file=sys.stderr)
        sys.exit(2)
    rel = f"database/schema/procedures_standardized/deployment/{name}_deploy.sql"
    if not (repo / rel).is_file():
        print(f"배포 SQL 없음: {rel}", file=sys.stderr)
        sys.exit(2)
    lines.append(rel)

Path(list_path).write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")
PY

if [ "${PROCEDURE_DEPLOY_DB_DIFF_CONFIRM:-}" = "CONFIRM" ] && [ -n "${list_file}" ] && [ -f "$list_file" ]; then
    while IFS= read -r rel || [ -n "$rel" ]; do
        [ -n "$rel" ] || continue
        name=$(procedure_deploy_name_from_path "$rel") || {
            echo "거부: 배포 목록 경로를 프로시저 이름으로 읽지 못했습니다: $rel" >&2
            exit 2
        }
        procedure_deploy_is_ident "$name" || {
            echo "거부: 프로시저 이름 형식이 아닙니다: $name" >&2
            exit 2
        }
    done <"$list_file"
fi
