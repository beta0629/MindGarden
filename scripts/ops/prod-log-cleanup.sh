#!/usr/bin/env bash
# MG_LOG_ROOT 하위에서 합의된 패턴만 오래된 파일 정리. 기본은 DRY_RUN(삭제 없음).
# rm -rf 금지. nginx/mysql 등 다른 트리는 대상 아님.
set -euo pipefail

MG_LOG_ROOT="${MG_LOG_ROOT:-/var/log/mindgarden}"
MG_MAX_AGE_DAYS="${MG_MAX_AGE_DAYS:-14}"
MG_LIST_MAX_LINES="${MG_LIST_MAX_LINES:-200}"
EXECUTE="${EXECUTE:-0}"

for _arg in "$@"; do
    case "$_arg" in
        --execute)
            EXECUTE=1
            ;;
        --dry-run)
            EXECUTE=0
            ;;
        -h|--help)
            echo "Usage: $0 [--dry-run] [--execute]"
            echo "Env: MG_LOG_ROOT (default /var/log/mindgarden), MG_MAX_AGE_DAYS (default 14), EXECUTE=1 for real delete."
            exit 0
            ;;
    esac
done

if [[ "$MG_LOG_ROOT" != /* ]]; then
    echo "MG_LOG_ROOT must be an absolute path." >&2
    exit 1
fi

case "$MG_LOG_ROOT" in
    "/"|"/var"|"/var/log"|"/etc"|"/usr"|"/home")
        echo "MG_LOG_ROOT is too broad; refusing." >&2
        exit 1
        ;;
esac

if [[ ! -d "$MG_LOG_ROOT" ]]; then
    echo "MG_LOG_ROOT is not a directory: $MG_LOG_ROOT" >&2
    exit 1
fi

if command -v readlink >/dev/null 2>&1; then
    _canon=$(readlink -f "$MG_LOG_ROOT" 2>/dev/null || true)
    if [[ -n "${_canon:-}" ]]; then
        MG_LOG_ROOT="$_canon"
    fi
fi

_tmp=$(mktemp)
trap 'rm -f "$_tmp"' EXIT

find "$MG_LOG_ROOT" \
    -mindepth 1 \
    -type f \
    \( \
        -name '*.log.*' \
        -o -name '*.gz' \
        -o -name '*.hprof' \
    \) \
    -mtime "+${MG_MAX_AGE_DAYS}" \
    -print0 2>/dev/null | sort -z > "$_tmp" || true

if [[ ! -s "$_tmp" ]]; then
    echo "=== MindGarden prod log cleanup ==="
    echo "MG_LOG_ROOT=${MG_LOG_ROOT}"
    echo "No matching files (patterns: *.log.*, *.gz, *.hprof; mtime +${MG_MAX_AGE_DAYS}d)."
    exit 0
fi

_count=0
_bytes=0
while IFS= read -r -d '' f; do
    [[ -z "$f" ]] && continue
    _count=$((_count + 1))
    if [[ -f "$f" ]]; then
        _s=$(stat -c '%s' "$f" 2>/dev/null || echo 0)
        _bytes=$((_bytes + _s))
    fi
done < "$_tmp"

echo "=== MindGarden prod log cleanup ==="
echo "MG_LOG_ROOT=${MG_LOG_ROOT}"
echo "MG_MAX_AGE_DAYS=${MG_MAX_AGE_DAYS} (find -mtime +N)"
if [[ "$EXECUTE" == "1" ]]; then
    echo "Mode: EXECUTE (files will be deleted)"
else
    echo "Mode: DRY_RUN (no deletion; set EXECUTE=1 or --execute to delete)"
fi
echo ""
echo "Candidates: count=${_count}, total_bytes=${_bytes}"
echo "--- paths (first ${MG_LIST_MAX_LINES} lines) ---"
_i=0
while IFS= read -r -d '' f; do
    [[ -z "$f" ]] && continue
    echo "$f"
    _i=$((_i + 1))
    if [[ "$_i" -ge "$MG_LIST_MAX_LINES" ]]; then
        _rest=$((_count - _i))
        if [[ "$_rest" -gt 0 ]]; then
            echo "... and ${_rest} more (set MG_LIST_MAX_LINES to raise limit)"
        fi
        break
    fi
done < "$_tmp"

if [[ "$EXECUTE" != "1" ]]; then
    echo ""
    echo "DRY_RUN complete. No files removed."
    exit 0
fi

echo ""
echo "Deleting ${_count} file(s)..."
while IFS= read -r -d '' f; do
    [[ -z "$f" ]] && continue
    case "$f" in
        "${MG_LOG_ROOT}"/*)
            rm -f -- "$f"
            ;;
        *)
            echo "Skip (outside root): $f" >&2
            ;;
    esac
done < "$_tmp"

echo "Execute complete."
echo "=== log cleanup end ==="
