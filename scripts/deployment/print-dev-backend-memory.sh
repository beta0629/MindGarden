#!/usr/bin/env bash
# Read-only snapshot after a dev backend restart.
# Prints free -m, the backend RSS/cmd, and OutOfMemoryError lines since this start.
# Does not read env files or print secret values. ps cmd redacts -D*password/secret/key/token*.
set +e

UNIT="${1:-mindgarden-dev.service}"

echo "===== dev backend memory (non-secret) ====="
free -m || true

MEM_PID="$(sudo systemctl show -p MainPID --value "$UNIT" 2>/dev/null || true)"
case "$MEM_PID" in
  ''|0|*[!0-9]*)
    echo "backend MainPID unavailable (${MEM_PID:-empty})"
    ;;
  *)
    echo "ps -o rss,cmd -p ${MEM_PID} (rss is KB)"
    sudo ps -o rss,cmd -p "$MEM_PID" \
      | sed -E 's/(-D[^[:space:]]*(password|secret|key|token|passwd)[^[:space:]]*)/-D[REDACTED]/Ig' \
      || true
    ;;
esac

SINCE="$(sudo systemctl show -p ActiveEnterTimestamp --value "$UNIT" 2>/dev/null || true)"
case "$SINCE" in
  ''|n/a|N/A) SINCE="" ;;
esac
echo "OOM scan since restart: ${SINCE:-unknown}"

if [ -n "$SINCE" ]; then
  JOURNAL_HITS="$(sudo journalctl -u "$UNIT" --since "$SINCE" --no-pager 2>/dev/null | grep -F 'OutOfMemoryError' || true)"
else
  echo "journal: restart time unknown; skipped (not scanning the full journal)"
  JOURNAL_HITS=""
fi
if [ -n "$JOURNAL_HITS" ]; then
  echo "journal OutOfMemoryError:"
  printf '%s\n' "$JOURNAL_HITS"
else
  echo "journal: no OutOfMemoryError since restart"
fi

SINCE_EPOCH=""
if [ -n "$SINCE" ]; then
  SINCE_EPOCH="$(date -d "$SINCE" +%s 2>/dev/null || true)"
fi

scan_log() {
  local file="$1"
  if ! sudo test -f "$file"; then
    echo "log missing: $file"
    return 0
  fi
  echo "---- $file OutOfMemoryError since restart ----"
  # Log lines use logback '%d{yyyy-MM-dd HH:mm:ss.SSS}'. Continuation stack lines have no timestamp.
  sudo awk -v since="${SINCE_EPOCH}" '
    BEGIN { in_window = (since == "" ? 0 : 0); follow = 0; hits = 0 }
    {
      if (match($0, /^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/)) {
        if (since == "") {
          in_window = 0
        } else {
          ts = substr($0, 1, 19)
          gsub(/[-:]/, " ", ts)
          in_window = (mktime(ts) >= since + 0)
        }
        if (follow > 0) follow = 0
      }
      if (in_window && index($0, "OutOfMemoryError") > 0) follow = 12
      if (follow > 0) { print; hits++; follow-- }
    }
    END { if (hits == 0) print "no OutOfMemoryError since restart" }
  ' "$file" || true
}

if [ -z "$SINCE_EPOCH" ]; then
  echo "log files: restart time unknown; skipped file scan"
else
  scan_log /var/log/mindgarden/dev-error.log
  scan_log /var/log/mindgarden/dev.log
fi

exit 0
