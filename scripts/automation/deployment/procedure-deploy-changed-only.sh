#!/bin/bash
# 표준 프로시저 배포: 변경 파일 선택과 안전한 교체.
# 배포 스크립트가 source 하고, 원격에서는 apply-one 으로 실행한다.
# 변경되지 않은 프로시저 SQL 은 실행하지 않는다.

procedure_deploy_is_sha() {
    case "$1" in
        *[!0-9a-fA-F]*) return 1 ;;
    esac
    [ "${#1}" -eq 40 ]
}

procedure_deploy_is_ident() {
    case "$1" in
        ""|*[!A-Za-z0-9_]*) return 1 ;;
        [0-9]*) return 1 ;;
    esac
    return 0
}

procedure_deploy_repo_root() {
    local here
    here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd) || return 1
    cd "$here/../../.." && pwd
}

procedure_deploy_event_before() {
    local path before
    path="${GITHUB_EVENT_PATH:-}"
    [ -n "$path" ] && [ -f "$path" ] || return 1
    if ! command -v python3 >/dev/null 2>&1; then
        return 1
    fi
    before=$(
        GITHUB_EVENT_PATH="$path" GITHUB_EVENT_NAME="${GITHUB_EVENT_NAME:-}" python3 - <<'PY'
import json, os, sys
path = os.environ.get("GITHUB_EVENT_PATH", "")
name = os.environ.get("GITHUB_EVENT_NAME", "")
with open(path, encoding="utf-8") as fh:
    event = json.load(fh)
before = ""
if name == "push":
    before = event.get("before") or ""
elif name == "pull_request":
    pr = event.get("pull_request") or {}
    base = pr.get("base") or {}
    before = base.get("sha") or ""
if not isinstance(before, str):
    before = ""
sys.stdout.write(before)
PY
    )
    [ -n "$before" ] || return 1
    printf '%s\n' "$before"
}

procedure_deploy_ensure_commit() {
    local sha="$1"
    if git rev-parse --verify --quiet "${sha}^{commit}" >/dev/null 2>&1; then
        return 0
    fi
    if [ "${PROCEDURE_DEPLOY_NO_FETCH:-}" = "1" ]; then
        return 1
    fi
    GIT_TERMINAL_PROMPT=0 git fetch --no-tags origin "$sha" >/dev/null 2>&1 || return 1
    git rev-parse --verify --quiet "${sha}^{commit}" >/dev/null 2>&1
}

procedure_deploy_name_from_path() {
    local path="$1"
    local rest name
    path=${path%$'\r'}
    path=${path#./}
    case "$path" in
        database/schema/procedures_standardized/deployment/*_deploy.sql)
            rest=${path#database/schema/procedures_standardized/deployment/}
            case "$rest" in
                */*) return 1 ;;
            esac
            name=${rest%_deploy.sql}
            ;;
        database/schema/procedures_standardized/*_standardized.sql)
            rest=${path#database/schema/procedures_standardized/}
            case "$rest" in
                */*) return 1 ;;
            esac
            name=${rest%_standardized.sql}
            ;;
        *)
            return 1
            ;;
    esac
    procedure_deploy_is_ident "$name" || return 1
    printf '%s\n' "$name"
}

procedure_deploy_names_from_list() {
    local path name seen
    seen=" "
    while IFS= read -r path || [ -n "$path" ]; do
        [ -n "$path" ] || continue
        case "$path" in
            \#*) continue ;;
        esac
        name=$(procedure_deploy_name_from_path "$path") || continue
        case "$seen" in
            *" ${name} "*) ;;
            *)
                seen="${seen}${name} "
                printf '%s\n' "$name"
                ;;
        esac
    done
}

procedure_deploy_collect_changed_paths() {
    local repo from to diff_file rc use_parent
    use_parent=0
    if [ -n "${PROCEDURE_DEPLOY_CHANGED_FILES:-}" ]; then
        if [ ! -f "$PROCEDURE_DEPLOY_CHANGED_FILES" ]; then
            echo "변경 파일 목록을 열 수 없습니다." >&2
            return 2
        fi
        cat "$PROCEDURE_DEPLOY_CHANGED_FILES"
        return 0
    fi
    from="${PROCEDURE_DEPLOY_FROM:-}"
    to="${PROCEDURE_DEPLOY_TO:-${GITHUB_SHA:-}}"
    if [ -z "$from" ]; then
        from=$(procedure_deploy_event_before || true)
    fi
    if [ "$from" = "0000000000000000000000000000000000000000" ]; then
        use_parent=1
        from=""
    fi
    if [ -z "$to" ] || ! procedure_deploy_is_sha "$to"; then
        echo "배포 끝 커밋을 알 수 없습니다." >&2
        return 2
    fi
    if [ "$use_parent" -eq 0 ] && ! procedure_deploy_is_sha "$from"; then
        echo "배포 시작 커밋을 알 수 없습니다." >&2
        return 2
    fi
    repo=$(procedure_deploy_repo_root) || {
        echo "저장소 루트를 알 수 없습니다." >&2
        return 2
    }
    diff_file=$(mktemp "${TMPDIR:-/tmp}/mg-proc-diff.XXXXXX")
    rc=0
    (
        cd "$repo" || exit 2
        if [ "$use_parent" -eq 1 ]; then
            from=$(git rev-parse --verify --quiet "${to}^") || exit 2
        else
            procedure_deploy_ensure_commit "$from" || exit 2
        fi
        procedure_deploy_ensure_commit "$to" || exit 2
        echo "프로시저 변경 범위: ${from}..${to}" >&2
        git diff --name-only --diff-filter=ACMRT "$from" "$to"
    ) >"$diff_file" || rc=$?
    if [ "$rc" -ne 0 ]; then
        rm -f "$diff_file"
        echo "배포 커밋 범위를 읽지 못했습니다." >&2
        return 2
    fi
    cat "$diff_file"
    rm -f "$diff_file"
}

procedure_deploy_list_names() {
    local path_file rc
    path_file=$(mktemp "${TMPDIR:-/tmp}/mg-proc-paths.XXXXXX")
    rc=0
    procedure_deploy_collect_changed_paths >"$path_file" || rc=$?
    if [ "$rc" -ne 0 ]; then
        rm -f "$path_file"
        return "$rc"
    fi
    procedure_deploy_names_from_list <"$path_file"
    rc=$?
    rm -f "$path_file"
    return "$rc"
}

procedure_deploy_staging_name() {
    local proc="$1"
    local stage="${proc}__mg_stage"
    if [ "${#stage}" -gt 64 ]; then
        echo "스테이징 이름이 너무 깁니다: $proc" >&2
        return 1
    fi
    printf '%s\n' "$stage"
}

procedure_deploy_assert_drop_targets() {
    local expected="$1"
    local file="$2"
    awk -v expected="$expected" '
        /^[[:space:]]*DROP PROCEDURE IF EXISTS[[:space:]]/ {
            line = $0
            sub(/^[[:space:]]*DROP PROCEDURE IF EXISTS[[:space:]]+/, "", line)
            if (substr(line, 1, 1) == "`") {
                sub(/^`/, "", line)
                sub(/`.*/, "", line)
            } else {
                sub(/[[:space:]].*/, "", line)
                sub(/\/\/.*/, "", line)
            }
            if (line != expected) {
                printf "거부: DROP 대상 %s (허용 %s). 실제 프로시저는 DROP 하지 않습니다.\n", line, expected > "/dev/stderr"
                bad = 1
            }
            count++
        }
        END {
            if (bad || count < 1) exit 1
        }
    ' "$file"
}

procedure_deploy_write_staging_sql() {
    local proc="$1"
    local src="$2"
    local dest="$3"
    local stage
    stage=$(procedure_deploy_staging_name "$proc") || return 1
    if ! awk -v proc="$proc" -v stage="$stage" '
        function replace_ident_after(line, prefix, from_name, to_name,    pos, head, rest, quote, nxt) {
            pos = index(line, prefix)
            if (pos == 0) {
                return ""
            }
            head = substr(line, 1, pos + length(prefix) - 1)
            rest = substr(line, pos + length(prefix))
            quote = ""
            if (substr(rest, 1, 1) == "`") {
                quote = "`"
                rest = substr(rest, 2)
            }
            if (length(rest) < length(from_name)) {
                return ""
            }
            if (substr(rest, 1, length(from_name)) != from_name) {
                return ""
            }
            nxt = substr(rest, length(from_name) + 1, 1)
            if (nxt ~ /[A-Za-z0-9_]/) {
                return ""
            }
            return head quote to_name substr(rest, length(from_name) + 1)
        }
        BEGIN { drop_done = 0; create_done = 0 }
        {
            line = $0
            if (!drop_done && line ~ /^[[:space:]]*DROP PROCEDURE IF EXISTS[[:space:]]/) {
                rewritten = replace_ident_after(line, "DROP PROCEDURE IF EXISTS ", proc, stage)
                if (rewritten != "") {
                    line = rewritten
                    drop_done = 1
                }
            } else if (!create_done && line ~ /^[[:space:]]*CREATE PROCEDURE[[:space:]]/) {
                rewritten = replace_ident_after(line, "CREATE PROCEDURE ", proc, stage)
                if (rewritten != "") {
                    line = rewritten
                    create_done = 1
                }
            }
            print line
        }
        END {
            if (drop_done != 1 || create_done != 1) exit 2
        }
    ' "$src" >"$dest"; then
        rm -f "$dest"
        echo "스테이징 SQL 을 만들지 못했습니다: $proc" >&2
        return 1
    fi
}

procedure_deploy_unescape_mysql_batch() {
    awk '
        {
            s = $0
            out = ""
            i = 1
            n = length(s)
            while (i <= n) {
                c = substr(s, i, 1)
                if (c == "\\" && i < n) {
                    n2 = substr(s, i + 1, 1)
                    if (n2 == "n") { out = out "\n"; i += 2; continue }
                    if (n2 == "t") { out = out "\t"; i += 2; continue }
                    if (n2 == "r") { out = out "\r"; i += 2; continue }
                    if (n2 == "\\") { out = out "\\"; i += 2; continue }
                    if (n2 == "0") { i += 2; continue }
                    out = out n2
                    i += 2
                    continue
                }
                out = out c
                i++
            }
            printf "%s", out
        }
    '
}

procedure_deploy_show_create_statement() {
    printf '%s\n' "$1" | awk -F '\t' 'NF >= 3 { print $3; exit }' | procedure_deploy_unescape_mysql_batch
}

procedure_deploy_write_restore_sql() {
    local statement="$1"
    local dest="$2"
    if [ -z "$statement" ]; then
        return 1
    fi
    {
        printf '%s\n' "DELIMITER MG_DEPLOY_END"
        printf '%s\n' "$statement"
        printf '%s\n' "MG_DEPLOY_END"
        printf '%s\n' "DELIMITER ;"
    } >"$dest"
}

procedure_deploy_run_mysql() {
    local user="$1"
    local host="$2"
    local pass="$3"
    shift 3
    MYSQL_PWD="$pass" mysql -h "$host" -u "$user" "$DB_NAME" "$@"
}

procedure_deploy_attempt() {
    local mode="$1"
    local payload="$2"
    local user="$3"
    local host="$4"
    local pass="$5"
    local out="$6"
    local err="$7"
    if [ "$mode" = "file" ]; then
        procedure_deploy_run_mysql "$user" "$host" "$pass" <"$payload" >"$out" 2>"$err"
        return $?
    fi
    procedure_deploy_run_mysql "$user" "$host" "$pass" -N --batch -e "$payload" </dev/null >"$out" 2>"$err"
}

procedure_deploy_emit_query_out() {
    local mode="$1"
    local out="$2"
    if [ "$mode" = "query" ]; then
        cat "$out"
    fi
}

procedure_deploy_mysql_dispatch() {
    local mode="$1"
    local payload="$2"
    local out err
    out=$(mktemp "${TMPDIR:-/tmp}/mg-mysql-out.XXXXXX")
    err=$(mktemp "${TMPDIR:-/tmp}/mg-mysql-err.XXXXXX")
    if procedure_deploy_attempt "$mode" "$payload" "$DB_USER" "$DB_HOST" "${DB_PASS:-}" "$out" "$err"; then
        procedure_deploy_emit_query_out "$mode" "$out"
        rm -f "$out" "$err"
        return 0
    fi
    cat "$err" >&2
    if ! grep -qE '1227|SYSTEM_USER' "$err"; then
        rm -f "$out" "$err"
        return 1
    fi
    if [ -n "${ROUTINE_ADMIN_USER:-}" ]; then
        echo "1227 재시도: 관리 계정" >&2
        if procedure_deploy_attempt "$mode" "$payload" "$ROUTINE_ADMIN_USER" "$DB_HOST" "${ROUTINE_ADMIN_PASS:-}" "$out" "$err"; then
            procedure_deploy_emit_query_out "$mode" "$out"
            rm -f "$out" "$err"
            return 0
        fi
        cat "$err" >&2
    fi
    if [ -n "${ROUTINE_FALLBACK_ROOT_PASS:-}" ]; then
        echo "1227 재시도: root" >&2
        if procedure_deploy_attempt "$mode" "$payload" "root" "$DB_HOST" "$ROUTINE_FALLBACK_ROOT_PASS" "$out" "$err"; then
            procedure_deploy_emit_query_out "$mode" "$out"
            rm -f "$out" "$err"
            return 0
        fi
        cat "$err" >&2
    fi
    echo "1227 재시도: root 와 앱 계정" >&2
    if procedure_deploy_attempt "$mode" "$payload" "root" "$DB_HOST" "${DB_PASS:-}" "$out" "$err"; then
        procedure_deploy_emit_query_out "$mode" "$out"
        rm -f "$out" "$err"
        return 0
    fi
    cat "$err" >&2
    rm -f "$out" "$err"
    return 1
}

procedure_deploy_capture_restore() {
    local proc="$1"
    local dest="$2"
    local raw stmt row
    if ! raw=$(procedure_deploy_mysql_dispatch query "SHOW CREATE PROCEDURE \`${proc}\`"); then
        return 1
    fi
    row=$(printf '%s\n' "$raw" | awk -F '\t' 'NF >= 3 { print; exit }')
    if [ -z "$row" ]; then
        echo "SHOW CREATE 결과가 비어 있습니다: $proc" >&2
        return 1
    fi
    stmt=$(procedure_deploy_show_create_statement "$row")
    if [ -z "$stmt" ]; then
        echo "SHOW CREATE 정의를 읽지 못했습니다: $proc" >&2
        return 1
    fi
    procedure_deploy_write_restore_sql "$stmt" "$dest"
}

procedure_deploy_exists_sql() {
    local proc="$1"
    printf '%s\n' "SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_NAME = '${proc}'"
}

procedure_deploy_resolve_sql() {
    local proc="$1"
    local repo file standardized tmp
    repo=$(procedure_deploy_repo_root) || return 1
    if [ -n "${PROCEDURE_DEPLOY_SQL_ROOT:-}" ]; then
        file="${PROCEDURE_DEPLOY_SQL_ROOT}/${proc}_deploy.sql"
    else
        file="${repo}/database/schema/procedures_standardized/deployment/${proc}_deploy.sql"
    fi
    if [ -f "$file" ]; then
        printf '%s\n' "$file"
        return 0
    fi
    standardized="${repo}/database/schema/procedures_standardized/${proc}_standardized.sql"
    if [ -f "$standardized" ]; then
        tmp=$(mktemp "${TMPDIR:-/tmp}/mg-proc.XXXXXX")
        cp "$standardized" "$tmp"
        printf '%s\n' "$tmp"
        return 0
    fi
    return 1
}

procedure_deploy_safe_replace() {
    local proc="$1"
    local src="$2"
    local stage stage_sql restore_sql cnt existed drop_stage_sql
    procedure_deploy_is_ident "$proc" || return 1
    [ -f "$src" ] || return 1
    stage=$(procedure_deploy_staging_name "$proc") || return 1
    if ! procedure_deploy_assert_drop_targets "$proc" "$src"; then
        echo "SQL 이 다른 프로시저를 DROP 하므로 중단합니다: $proc" >&2
        return 1
    fi
    stage_sql=$(mktemp "${TMPDIR:-/tmp}/mg-stage.XXXXXX")
    restore_sql=$(mktemp "${TMPDIR:-/tmp}/mg-restore.XXXXXX")
    if ! procedure_deploy_write_staging_sql "$proc" "$src" "$stage_sql"; then
        rm -f "$stage_sql" "$restore_sql"
        return 1
    fi
    if ! procedure_deploy_assert_drop_targets "$stage" "$stage_sql"; then
        echo "스테이징 SQL 의 DROP 대상이 잘못되었습니다. 실제 프로시저는 바꾸지 않습니다: $proc" >&2
        rm -f "$stage_sql" "$restore_sql"
        return 1
    fi
    echo "스테이징 CREATE 확인: $proc" >&2
    if ! procedure_deploy_mysql_dispatch file "$stage_sql"; then
        echo "스테이징 CREATE 실패. 기존 프로시저는 그대로 둡니다: $proc" >&2
        rm -f "$stage_sql" "$restore_sql"
        return 1
    fi
    drop_stage_sql="DROP PROCEDURE IF EXISTS \`${stage}\`"
    if ! procedure_deploy_mysql_dispatch query "$drop_stage_sql"; then
        echo "스테이징 정리 실패. 실제 프로시저는 바꾸지 않습니다: $proc" >&2
        rm -f "$stage_sql" "$restore_sql"
        return 1
    fi
    if ! cnt=$(procedure_deploy_mysql_dispatch query "$(procedure_deploy_exists_sql "$proc")"); then
        echo "존재 확인 실패. 실제 프로시저는 DROP 하지 않습니다: $proc" >&2
        rm -f "$stage_sql" "$restore_sql"
        return 1
    fi
    cnt=$(printf '%s' "$cnt" | tr -d '[:space:]')
    case "$cnt" in
        0) existed=0 ;;
        *[!0-9]*|"")
            echo "존재 확인 결과가 잘못되었습니다. 실제 프로시저는 DROP 하지 않습니다: $proc" >&2
            rm -f "$stage_sql" "$restore_sql"
            return 1
            ;;
        *) existed=1 ;;
    esac
    if [ "$existed" -eq 1 ]; then
        if ! procedure_deploy_capture_restore "$proc" "$restore_sql"; then
            echo "SHOW CREATE 저장 실패. 실제 프로시저는 DROP 하지 않습니다: $proc" >&2
            rm -f "$stage_sql" "$restore_sql"
            return 1
        fi
    fi
    echo "실제 프로시저 교체: $proc" >&2
    if ! procedure_deploy_mysql_dispatch file "$src"; then
        if [ "$existed" -eq 1 ]; then
            echo "최종 CREATE 실패. 저장해 둔 정의로 되돌립니다: $proc" >&2
            if ! procedure_deploy_mysql_dispatch file "$restore_sql"; then
                echo "되돌리기 실패. 저장해 둔 정의: $restore_sql" >&2
                rm -f "$stage_sql"
                return 1
            fi
            echo "이전 정의로 되돌렸습니다: $proc" >&2
        else
            echo "최종 CREATE 실패. 기존 프로시저가 없어 되돌릴 정의가 없습니다: $proc" >&2
        fi
        rm -f "$stage_sql" "$restore_sql"
        return 1
    fi
    if ! cnt=$(procedure_deploy_mysql_dispatch query "$(procedure_deploy_exists_sql "$proc")"); then
        echo "교체 후 확인 실패: $proc" >&2
        rm -f "$stage_sql" "$restore_sql"
        return 1
    fi
    cnt=$(printf '%s' "$cnt" | tr -d '[:space:]')
    case "$cnt" in
        0|""|*[!0-9]*)
            echo "교체 후 프로시저가 없습니다: $proc" >&2
            rm -f "$stage_sql" "$restore_sql"
            return 1
            ;;
    esac
    rm -f "$stage_sql" "$restore_sql"
    echo "safe-replace 완료: $proc" >&2
    return 0
}

procedure_deploy_main() {
    local cmd="${1:-}"
    local name names_file rc
    case "$cmd" in
        plan)
            names_file=$(mktemp "${TMPDIR:-/tmp}/mg-proc-plan.XXXXXX")
            rc=0
            procedure_deploy_list_names >"$names_file" || rc=$?
            if [ "$rc" -ne 0 ]; then
                rm -f "$names_file"
                return "$rc"
            fi
            while IFS= read -r name; do
                [ -n "$name" ] || continue
                printf 'PLAN safe-replace %s\n' "$name"
            done <"$names_file"
            rm -f "$names_file"
            ;;
        apply-one)
            [ -n "${2:-}" ] && [ -n "${3:-}" ] || return 1
            printf 'PLAN safe-replace %s\n' "$2"
            procedure_deploy_safe_replace "$2" "$3"
            return $?
            ;;
        *)
            echo "usage: plan | apply-one NAME SQL" >&2
            return 1
            ;;
    esac
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
    procedure_deploy_main "$@"
    exit $?
fi
