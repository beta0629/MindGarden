#!/bin/bash
# 저장소 배포 SQL 과 대상 DB 의 프로시저를 비교한다.
#   - 시그니처: information_schema.PARAMETERS (missing|count|mode|type|order)
#   - 본문: 정규화한 본문 해시 (body). DB 쪽은 ROUTINES.ROUTINE_DEFINITION 을 HEX 로 받은 'B' 행이다.
# 입력: PROCEDURE_DEPLOY_DB_DIFF_SNAPSHOT (mysql --batch TSV). 없으면 DDL 하지 않고 끝난다.
# 출력: 차이 목록(이름, 종류, repo vs db). 본문은 어떤 모드에서도 출력하지 않는다(해시만).
# PROCEDURE_DEPLOY_DB_DIFF_CONFIRM=CONFIRM 일 때만 PROCEDURE_DEPLOY_DB_DIFF_LIST 에 배포 SQL 경로를 쓴다.
# confirm 이 아니면 DDL 용 목록을 만들지 않고 0 으로 끝난다.
#
# 모드
#   (기본)                 차이 목록
#   --hash-report          읽기 전용. 프로시저 이름·repo 해시·db 해시·상태만 출력. 목록을 쓰지 않는다.
#                          PROCEDURE_DEPLOY_DB_DIFF_HASH_REPORT=1 과 같다.
#   --body-hash repo NAME  stdin 의 배포 SQL 에서 NAME 본문 해시만 출력(테스트용)
#   --body-hash db         stdin 의 ROUTINE_DEFINITION 해시만 출력(테스트용)
#
# 본문 정규화 규칙(양쪽 동일)
#   - 저장소 쪽은 DELIMITER 를 따라 CREATE PROCEDURE 문을 자르고, 파라미터 목록과 특성
#     (COMMENT, LANGUAGE SQL, [NOT] DETERMINISTIC, CONTAINS/NO/READS/MODIFIES SQL, SQL SECURITY)을
#     건너뛴 나머지(라벨 포함 BEGIN..END)만 쓴다. DEFINER·IF NOT EXISTS·스키마 접두는 헤더라 해시에 없다.
#   - 주석(-- , #, /* */) 제거, 공백·줄바꿈 무시, 끝의 ; 와 구분자 제거.
#   - 문자열 리터럴('..', "..")은 그대로 두고, 그 밖의 토큰은 전부 소문자. 백틱은 벗긴다.
#     (식별자·키워드 대소문자 차이는 차이가 아니다. 문자열 안 글자가 바뀌면 차이다.)
#   - MySQL 은 ROUTINE_DEFINITION 에 문자열 이스케이프(\n, \', '' 등)를 풀어서 저장한다. 그래서 저장소 본문도
#     같은 형태로 바꾼 뒤 DB 와 똑같은 토큰화·해시를 거친다. 따옴표가 든 리터럴 근처에서 주석·공백만
#     고친 경우는 differ 로 나올 수 있다(안전 쪽: 다시 배포 대상이 된다).

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/procedure-deploy-changed-only.sh"

action="diff"
body_source=""
body_name=""
if [ "${PROCEDURE_DEPLOY_DB_DIFF_HASH_REPORT:-}" = "1" ]; then
    action=hash-report
fi
while [ "$#" -gt 0 ]; do
    case "$1" in
        --hash-report)
            action=hash-report
            shift
            ;;
        --body-hash)
            action=body-hash
            body_source="${2:-}"
            if [ "$body_source" = "repo" ]; then
                body_name="${3:-}"
                procedure_deploy_is_ident "$body_name" || {
                    echo "거부: 프로시저 이름 형식이 아닙니다." >&2
                    exit 2
                }
                shift 3
            elif [ "$body_source" = "db" ]; then
                shift 2
            else
                echo "--body-hash 는 repo NAME 또는 db 만 받습니다." >&2
                exit 2
            fi
            ;;
        *)
            echo "알 수 없는 인자: $1" >&2
            exit 2
            ;;
    esac
done

repo=$(procedure_deploy_repo_root) || {
    echo "저장소 루트를 알 수 없습니다." >&2
    exit 2
}

snap="${PROCEDURE_DEPLOY_DB_DIFF_SNAPSHOT:-}"
if [ "$action" != "body-hash" ]; then
    if [ -z "$snap" ]; then
        echo "PARAMETER 스냅샷이 없습니다. DDL 은 하지 않습니다." >&2
        exit 2
    fi
    if [ ! -f "$snap" ]; then
        echo "PARAMETER 스냅샷을 열 수 없습니다. DDL 은 하지 않습니다." >&2
        exit 2
    fi
fi

list_file="${PROCEDURE_DEPLOY_DB_DIFF_LIST:-}"
if [ "$action" = "hash-report" ]; then
    list_file=""
fi
export PROCEDURE_DEPLOY_REPO="$repo"
export PROCEDURE_DEPLOY_DB_DIFF_SNAPSHOT="$snap"
export PROCEDURE_DEPLOY_DB_DIFF_LIST="${list_file}"
export PROCEDURE_DEPLOY_DB_DIFF_CONFIRM="${PROCEDURE_DEPLOY_DB_DIFF_CONFIRM:-}"
export PROCEDURE_DEPLOY_DB_DIFF_ACTION="$action"
export PROCEDURE_DEPLOY_DB_DIFF_BODY_SOURCE="$body_source"
export PROCEDURE_DEPLOY_DB_DIFF_BODY_NAME="$body_name"
body_input=""
if [ "$action" = "body-hash" ]; then
    body_input=$(mktemp "${TMPDIR:-/tmp}/mg-proc-body.XXXXXX")
    trap 'rm -f "$body_input"' EXIT
    cat >"$body_input"
fi
export PROCEDURE_DEPLOY_DB_DIFF_BODY_INPUT="$body_input"

python3 - <<'PY'
import csv, hashlib, os, re, sys
from pathlib import Path

repo = Path(os.environ["PROCEDURE_DEPLOY_REPO"])
action = os.environ.get("PROCEDURE_DEPLOY_DB_DIFF_ACTION", "diff")
confirm = os.environ.get("PROCEDURE_DEPLOY_DB_DIFF_CONFIRM", "")
list_path = os.environ.get("PROCEDURE_DEPLOY_DB_DIFF_LIST", "")
deploy_dir = repo / "database/schema/procedures_standardized/deployment"
HASH_SHOWN = 16
WORD_RE = re.compile(r"[\w$]+", re.UNICODE)
DELIM_RE = re.compile(r"[ \t]*delimiter[ \t]+(\S+)[ \t]*(?:\r?\n|$)", re.IGNORECASE)
MYSQL_ESCAPES = {
    "0": "\0", "'": "'", '"': '"', "b": "\b", "n": "\n", "r": "\r", "t": "\t",
    "Z": "\x1a", "\\": "\\", "%": "\\%", "_": "\\_",
}
CHARACTERISTICS = (
    ("language", "sql"),
    ("not", "deterministic"),
    ("deterministic",),
    ("contains", "sql"),
    ("no", "sql"),
    ("reads", "sql", "data"),
    ("modifies", "sql", "data"),
    ("sql", "security", "definer"),
    ("sql", "security", "invoker"),
)

def is_line_comment(text, i):
    if text[i] == "#":
        return True
    return text.startswith("--", i) and (i + 2 >= len(text) or text[i + 2].isspace())

def quoted_end(text, i):
    quote = text[i]
    j = i + 1
    while j < len(text):
        if text[j] == "\\" and quote != "`":
            j += 2
            continue
        if text[j] == quote:
            if j + 1 < len(text) and text[j + 1] == quote:
                j += 2
                continue
            return j + 1
        j += 1
    return len(text)

def scan_tokens(text):
    toks = []
    i = 0
    n = len(text)
    while i < n:
        c = text[i]
        if c.isspace():
            i += 1
            continue
        if is_line_comment(text, i):
            j = text.find("\n", i)
            i = n if j < 0 else j + 1
            continue
        if text.startswith("/*", i):
            j = text.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in "'\"":
            j = quoted_end(text, i)
            toks.append(("s", text[i:j], i, j))
            i = j
            continue
        if c == "`":
            j = quoted_end(text, i)
            inner = text[i + 1:j - 1] if j - 1 > i else ""
            toks.append(("w", inner.replace("``", "`").lower(), i, j))
            i = j
            continue
        m = WORD_RE.match(text, i)
        if m:
            toks.append(("w", m.group(0).lower(), i, m.end()))
            i = m.end()
            continue
        toks.append(("p", c, i, i + 1))
        i += 1
    return toks

def sql_tokens(text):
    return [(kind, value) for kind, value, _, _ in scan_tokens(text)]

def mysql_stored_literal(literal):
    # ROUTINE_DEFINITION 은 문자열 이스케이프를 풀어 둔 채 원래 따옴표로 감싸 저장한다(\% \_ 는 그대로).
    quote = literal[0]
    inner = literal[1:-1] if len(literal) >= 2 and literal[-1] == quote else literal[1:]
    out = []
    i = 0
    while i < len(inner):
        c = inner[i]
        if c == "\\" and i + 1 < len(inner):
            out.append(MYSQL_ESCAPES.get(inner[i + 1], inner[i + 1]))
            i += 2
            continue
        if c == quote and i + 1 < len(inner) and inner[i + 1] == quote:
            out.append(quote)
            i += 2
            continue
        out.append(c)
        i += 1
    return quote + "".join(out) + quote

def split_statements(text):
    stmts = []
    delim = ";"
    i = 0
    n = len(text)
    start = 0
    line_start = True
    while i < n:
        if line_start:
            m = DELIM_RE.match(text, i)
            if m:
                if text[start:i].strip():
                    stmts.append(text[start:i])
                delim = m.group(1)
                i = m.end()
                start = i
                continue
        line_start = False
        c = text[i]
        if c == "\n":
            line_start = True
            i += 1
            continue
        if is_line_comment(text, i):
            j = text.find("\n", i)
            i = n if j < 0 else j
            continue
        if text.startswith("/*", i):
            j = text.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in "'\"`":
            i = quoted_end(text, i)
            continue
        if text.startswith(delim, i):
            stmts.append(text[start:i])
            i += len(delim)
            start = i
            continue
        i += 1
    if text[start:].strip():
        stmts.append(text[start:])
    return stmts

def strip_trailing(toks):
    toks = list(toks)
    while toks and toks[-1] == ("p", ";"):
        toks.pop()
    return toks

def skip_characteristics(toks, k):
    while k < len(toks):
        if toks[k] == ("w", "comment") and k + 1 < len(toks) and toks[k + 1][0] == "s":
            k += 2
            continue
        for seq in CHARACTERISTICS:
            if all(k + i < len(toks) and toks[k + i] == ("w", word) for i, word in enumerate(seq)):
                k += len(seq)
                break
        else:
            return k
    return k

def repo_body_text(text, procedure):
    """CREATE PROCEDURE 문에서 본문만 잘라 ROUTINE_DEFINITION 과 같은 형태(문자열 이스케이프 해제)로 돌려준다."""
    target = procedure.lower()
    for stmt in split_statements(text):
        scanned = scan_tokens(stmt)
        toks = [(kind, value) for kind, value, _, _ in scanned]
        if not toks or toks[0] != ("w", "create") or ("w", "procedure") not in toks:
            continue
        k = toks.index(("w", "procedure")) + 1
        if toks[k:k + 3] == [("w", "if"), ("w", "not"), ("w", "exists")]:
            k += 3
        if k + 1 < len(toks) and toks[k + 1] == ("p", "."):
            k += 2
        if k + 1 >= len(toks) or toks[k] != ("w", target) or toks[k + 1] != ("p", "("):
            continue
        depth = 0
        end = None
        for j in range(k + 1, len(toks)):
            if toks[j] == ("p", "("):
                depth += 1
            elif toks[j] == ("p", ")"):
                depth -= 1
                if depth == 0:
                    end = j
                    break
        if end is None:
            raise ValueError("parameter list not closed")
        first = skip_characteristics(toks, end + 1)
        last = len(toks) - 1
        while last >= first and toks[last] == ("p", ";"):
            last -= 1
        if last < first:
            raise ValueError("empty body")
        parts = []
        cursor = scanned[first][2]
        for kind, _, start, stop in scanned[first:last + 1]:
            if kind == "s":
                parts.append(stmt[cursor:start])
                parts.append(mysql_stored_literal(stmt[start:stop]))
                cursor = stop
        parts.append(stmt[cursor:scanned[last][3]])
        return "".join(parts)
    raise ValueError("CREATE PROCEDURE missing")

def tokens_hash(toks):
    canon = "\x1f".join(kind + value for kind, value in toks)
    return hashlib.sha256(canon.encode("utf-8")).hexdigest()

def db_body_hash(definition):
    return tokens_hash(strip_trailing(sql_tokens(definition)))

def repo_body_hash(text, procedure):
    return db_body_hash(repo_body_text(text, procedure))

def short(digest):
    return digest[:HASH_SHOWN] if digest else "-"

if action == "body-hash":
    source_text = Path(os.environ["PROCEDURE_DEPLOY_DB_DIFF_BODY_INPUT"]).read_text(encoding="utf-8")
    try:
        if os.environ.get("PROCEDURE_DEPLOY_DB_DIFF_BODY_SOURCE") == "repo":
            print(repo_body_hash(source_text, os.environ["PROCEDURE_DEPLOY_DB_DIFF_BODY_NAME"]))
        else:
            print(db_body_hash(source_text))
    except ValueError as exc:
        print(f"본문 해시 실패: {exc}", file=sys.stderr)
        sys.exit(2)
    sys.exit(0)

snap = Path(os.environ["PROCEDURE_DEPLOY_DB_DIFF_SNAPSHOT"])

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
repo_hashes = {}
for path in sorted(deploy_dir.glob("*_deploy.sql")):
    name = path.name[: -len("_deploy.sql")]
    if not is_ident(name):
        print(f"거부: 프로시저 이름 형식이 아닙니다: {name}", file=sys.stderr)
        sys.exit(2)
    repo_procs[name] = parse_sql(path, name)
    try:
        repo_hashes[name] = repo_body_hash(path.read_text(encoding="utf-8"), name)
    except ValueError as exc:
        print(f"거부: 저장소 본문을 읽지 못했습니다: {name} ({exc})", file=sys.stderr)
        sys.exit(2)

db_exists = set()
db_params = {}
db_hashes = {}
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
        if kind == "B":
            raw = (row[5] if len(row) > 5 else "").strip()
            if raw and raw != "NULL":
                try:
                    db_hashes[name] = db_body_hash(bytes.fromhex(raw).decode("utf-8", errors="replace"))
                except ValueError:
                    print(f"거부: DB 본문 HEX 를 읽지 못했습니다: {name}", file=sys.stderr)
                    sys.exit(2)
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
        continue
    if name in db_hashes and db_hashes[name] != repo_hashes[name]:
        diffs.append((name, "body", repo_hashes[name], db_hashes[name]))

def hash_status(name):
    if name not in db_exists:
        return "missing"
    if name not in db_hashes:
        return "unavailable"
    return "same" if db_hashes[name] == repo_hashes[name] else "differ"

unavailable = [name for name in sorted(repo_procs) if hash_status(name) == "unavailable"]

if action == "hash-report":
    counts = {}
    for name in sorted(repo_procs):
        status = hash_status(name)
        counts[status] = counts.get(status, 0) + 1
        print(f"HASH\t{name}\trepo={short(repo_hashes[name])}\tdb={short(db_hashes.get(name))}\tstatus={status}")
    summary = " ".join(f"{key}={counts.get(key, 0)}" for key in ("same", "differ", "missing", "unavailable"))
    print(f"hash-report procedures repo={len(repo_procs)} {summary}")
    sys.exit(0)

print(f"db-diff procedures repo={len(repo_procs)} db={len(db_exists)} differ={len(diffs)}")
if unavailable:
    print(f"db-diff: 본문 해시 없음(ROUTINE_DEFINITION 조회 불가) {len(unavailable)}건 — 본문 비교 생략")
if not diffs:
    print("db-diff: 차이 없음")
for name, kind, repo_side, db_side in diffs:
    if kind == "body":
        print(f"DIFF\t{name}\tbody\trepo={short(repo_side)}\tdb={short(db_side)}")
    else:
        print(f"DIFF\t{name}\t{kind}\trepo={fmt(repo_side)}\tdb={fmt(db_side)}")

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
