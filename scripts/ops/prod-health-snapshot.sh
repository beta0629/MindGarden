#!/usr/bin/env bash
# P0 read-only traffic facts for mindgarden.core-solution.co.kr / core.
# NO restart, NO deploy, NO kill, NO cleanup, NO secret print.
set -euo pipefail

TODAY_KST="${TODAY_KST:-$(TZ=Asia/Seoul date +%Y-%m-%d)}"
COMPARE_KST="${COMPARE_KST:-2026-09-15}"
BOT_RE='bot|crawl|spider|sqlmap|nikto|python-requests|curl/|Go-http'

echo "=== P0 TRAFFIC FACTS (readonly) ==="
echo "TODAY_KST=${TODAY_KST}"
echo "COMPARE_KST=${COMPARE_KST}"
echo ""

echo "=== HOST ==="
date
echo "--- uptime ---"
uptime
echo "--- free -h ---"
free -h
echo "--- nproc ---"
nproc
echo "--- vmstat 1 3 ---"
if command -v vmstat >/dev/null 2>&1; then
  vmstat 1 3
else
  top -bn1 | head -20
fi
echo ""

echo "=== TCP (ss -s) ==="
ss -s 2>/dev/null || echo "ss 막힘"
echo ""

echo "=== ACTIVE BACKEND ==="
if [[ -f /etc/mindgarden/active-backend ]]; then
  cat /etc/mindgarden/active-backend
else
  echo "active-backend file missing"
fi
echo ""

# Prefer live + rotated .1; include small recent gz only (cap for 120s SSH timeout)
mapfile -t NGINX_LOGS < <(
  {
    ls -1 /var/log/nginx/access.log /var/log/nginx/access.log.1 2>/dev/null || true
    ls -1 /var/log/nginx/*.access.log /var/log/nginx/*.access.log.1 2>/dev/null || true
    ls -1 /var/log/nginx/*mindgarden*access* /var/log/nginx/*core-solution*access* 2>/dev/null || true
    # dated rotate names for compare weekday
    ls -1 /var/log/nginx/access.log-20260915* /var/log/nginx/access.log-20260916* 2>/dev/null || true
    ls -1 /var/log/nginx/*2026-09-15* /var/log/nginx/*2026-09-16* 2>/dev/null || true
  } | sort -u
)
# Drop huge archives (>200MB) to stay under Actions SSH timeout
_filtered=()
for _f in "${NGINX_LOGS[@]+"${NGINX_LOGS[@]}"}"; do
  [[ -f "$_f" ]] || continue
  _sz=$(stat -c%s "$_f" 2>/dev/null || echo 0)
  if [[ "$_sz" -gt 209715200 ]]; then
    echo "skip large log (>200MB): $_f size=$_sz"
    continue
  fi
  _filtered+=("$_f")
done
NGINX_LOGS=("${_filtered[@]+"${_filtered[@]}"}")

echo "=== NGINX LOG CANDIDATES ==="
if [[ ${#NGINX_LOGS[@]} -eq 0 ]]; then
  echo "no nginx access logs found"
else
  printf '%s\n' "${NGINX_LOGS[@]}"
fi
echo ""

date_filter_pattern() {
  local ymd="$1"
  local y="${ymd:0:4}"
  local m="${ymd:5:2}"
  local d="${ymd:8:2}"
  local mon
  case "$m" in
    01) mon=Jan ;; 02) mon=Feb ;; 03) mon=Mar ;; 04) mon=Apr ;;
    05) mon=May ;; 06) mon=Jun ;; 07) mon=Jul ;; 08) mon=Aug ;;
    09) mon=Sep ;; 10) mon=Oct ;; 11) mon=Nov ;; 12) mon=Dec ;;
    *) mon=??? ;;
  esac
  echo "${d}/${mon}/${y}|${ymd}"
}

analyze_day() {
  local label="$1"
  local ymd="$2"
  local pat
  pat=$(date_filter_pattern "$ymd")

  echo "=== NGINX ${label} (${ymd}) ==="

  if [[ ${#NGINX_LOGS[@]} -eq 0 ]]; then
    echo "막힘 (no logs)"
    echo ""
    return 0
  fi

  local tmp
  tmp=$(mktemp)
  local f
  for f in "${NGINX_LOGS[@]}"; do
    [[ -f "$f" ]] || continue
    case "$f" in
      *error*) continue ;;
    esac
    if [[ "$f" == *.gz ]]; then
      zgrep -E "$pat" "$f" 2>/dev/null >>"$tmp" || true
    else
      grep -E "$pat" "$f" 2>/dev/null >>"$tmp" || true
    fi
  done

  local total
  total=$(wc -l <"$tmp" | tr -d ' ')
  echo "total_req=${total}"

  if [[ "$total" -eq 0 ]]; then
    echo "req/hour: (empty)"
    echo "5xx_count=0 5xx_rate=0"
    echo "unique_ips: (empty)"
    echo "bot_ua: (empty)"
    rm -f "$tmp"
    echo ""
    return 0
  fi

  echo "--- req/hour histogram (all hours present; peak noted) ---"
  # hour from combined [dd/Mon/yyyy:HH
  grep -oE '\[[0-9]{2}/[A-Za-z]{3}/[0-9]{4}:[0-9]{2}' "$tmp" \
    | cut -d: -f2 \
    | sort | uniq -c | sort -k2 \
    | awk '{printf "  %s: %s\n", $2, $1}'
  peak_line=$(grep -oE '\[[0-9]{2}/[A-Za-z]{3}/[0-9]{4}:[0-9]{2}' "$tmp" \
    | cut -d: -f2 \
    | sort | uniq -c | sort -rn | head -1)
  peak_req=$(echo "$peak_line" | awk '{print $1+0}')
  peak_hour=$(echo "$peak_line" | awk '{print $2}')
  echo "peak_hour=${peak_hour:-?} peak_hour_req=${peak_req:-0}"
  if [[ "${peak_req:-0}" -gt 0 ]]; then
    awk -v p="$peak_req" 'BEGIN{printf "peak_hour_req_per_s=%.4f\n", p/3600.0}'
  fi

  echo "--- req/hour last 6h window (from latest hour in log) ---"
  hours_file=$(mktemp)
  grep -oE '\[[0-9]{2}/[A-Za-z]{3}/[0-9]{4}:[0-9]{2}' "$tmp" \
    | cut -d: -f2 >"$hours_file" || true
  if [[ ! -s "$hours_file" ]]; then
    echo "  (empty)"
  else
    maxh=$(sort -n "$hours_file" | tail -1 | sed 's/^0*//')
    maxh=${maxh:-0}
    start=$((maxh - 5))
    if [[ "$start" -lt 0 ]]; then start=0; fi
    h=$start
    while [[ "$h" -le "$maxh" ]]; do
      hh=$(printf '%02d' "$h")
      c=$(grep -c "^${hh}$" "$hours_file" || true)
      echo "  ${hh}: ${c}"
      h=$((h + 1))
    done
  fi
  rm -f "$hours_file"

  local five
  five=$(grep -cE '" 5[0-9]{2} ' "$tmp" 2>/dev/null || true)
  five=${five:-0}
  if [[ "$five" -eq 0 ]]; then
    five=$(awk 'BEGIN{c=0} / 5[0-9][0-9] / {c++} END{print c+0}' "$tmp")
  fi
  local rate
  rate=$(awk -v t="$total" -v f="$five" 'BEGIN{ if (t>0) printf "%.4f", (f*100.0)/t; else print "0"}')
  echo "5xx_count=${five} 5xx_rate_pct=${rate}"

  echo "--- unique IPs top 15 ---"
  awk '{print $1}' "$tmp" | sort | uniq -c | sort -rn | head -15

  echo "--- UA bot/scan heuristics top ---"
  if grep -qiE "$BOT_RE" "$tmp" 2>/dev/null; then
    grep -iE "$BOT_RE" "$tmp" \
      | sed -nE 's/.*"([^"]+)"$/\1/p' \
      | awk '{print $1}' \
      | sort | uniq -c | sort -rn | head -20
  else
    echo "(none)"
  fi
  local botc
  botc=$(grep -ciE "$BOT_RE" "$tmp" 2>/dev/null || true)
  botc=${botc:-0}
  echo "bot_heuristic_lines=${botc}"

  rm -f "$tmp"
  echo ""
}

analyze_day "TODAY" "$TODAY_KST"
analyze_day "WEEKDAY_COMPARE" "$COMPARE_KST"

if [[ "$COMPARE_KST" == "2026-09-15" ]]; then
  echo "=== FALLBACK COMPARE 2026-09-16 ==="
  analyze_day "WEEKDAY_FALLBACK_TUE" "2026-09-16"
fi

echo "=== JVM ACTUATOR ==="
for port in 8080 8081; do
  echo "--- :${port}/actuator/health ---"
  code=$(curl -sS -o "/tmp/mg-tf-health-${port}.txt" -w '%{http_code}' --connect-timeout 5 \
    "http://127.0.0.1:${port}/actuator/health" 2>/dev/null || echo "000")
  echo "HTTP ${code}"
  head -c 400 "/tmp/mg-tf-health-${port}.txt" 2>/dev/null || true
  echo ""
done

echo "=== HIKARI (metrics, unauth only) ==="
HIKARI_OUT="막힘"
for port in 8080 8081; do
  for metric in hikaricp.connections.active hikaricp.connections.max hikaricp.connections; do
    path="http://127.0.0.1:${port}/actuator/metrics/${metric}"
    code=$(curl -sS -o /tmp/mg-tf-m.txt -w '%{http_code}' --connect-timeout 5 "$path" 2>/dev/null || echo "000")
    if [[ "$code" == "200" ]]; then
      echo "OK ${path}"
      head -c 500 /tmp/mg-tf-m.txt
      echo ""
      HIKARI_OUT="partial_ok_on_${port}"
    else
      echo "HTTP ${code} ${path}"
    fi
  done
done
echo "HIKARI_SUMMARY=${HIKARI_OUT}"
echo ""

echo "=== MYSQL (local socket/creds only; no password print) ==="
MYSQL_OUT="막힘"
if command -v mysql >/dev/null 2>&1; then
  if mysql --protocol=SOCKET -e "SELECT 1" >/dev/null 2>&1; then
    echo "Threads_connected:"
    mysql --protocol=SOCKET -N -e "SHOW GLOBAL STATUS LIKE 'Threads_connected';" 2>/dev/null || true
    echo "Questions:"
    mysql --protocol=SOCKET -N -e "SHOW GLOBAL STATUS LIKE 'Questions';" 2>/dev/null || true
    MYSQL_OUT="ok_socket"
  elif [[ -f /etc/mindgarden/my.cnf ]] || [[ -f "${HOME}/.my.cnf" ]]; then
    CFG=()
    if [[ -f /etc/mindgarden/my.cnf ]]; then
      CFG=(--defaults-extra-file=/etc/mindgarden/my.cnf)
    elif [[ -f "${HOME}/.my.cnf" ]]; then
      CFG=(--defaults-extra-file="${HOME}/.my.cnf")
    fi
    if mysql "${CFG[@]}" -e "SELECT 1" >/dev/null 2>&1; then
      mysql "${CFG[@]}" -N -e "SHOW GLOBAL STATUS LIKE 'Threads_connected';" 2>/dev/null || true
      mysql "${CFG[@]}" -N -e "SHOW GLOBAL STATUS LIKE 'Questions';" 2>/dev/null || true
      MYSQL_OUT="ok_cnf"
    else
      echo "막힘 (cnf present but connect failed — details omitted)"
    fi
  else
    echo "막힘 (no local socket auth / no defaults file)"
  fi
else
  echo "막힘 (mysql client absent)"
fi
echo "MYSQL_SUMMARY=${MYSQL_OUT}"
echo ""

echo "=== CF ==="
echo "CF=막힘 (no API token in this workflow)"
echo ""
echo "=== END P0 TRAFFIC FACTS ==="
