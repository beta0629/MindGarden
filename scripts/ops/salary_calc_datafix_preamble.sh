#!/usr/bin/env bash
# 급여 calc 1회성 정정(20261005) — params(key=value;…) → MySQL 세션 변수 preamble.
# 사용: printf '%s' "$PARAMS" | scripts/ops/salary_calc_datafix_preamble.sh <out.sql>
# - 값은 저장소·로그에 남기지 않는다. GitHub Actions 에서는 테넌트·금액 값을 ::add-mask:: 한다.
# - 오류 메시지에는 키 이름만 쓴다(값 미출력). 모든 키 필수, 모르는 키·중복 키는 거부.
# - payout_mode 는 승인된 NEUTRALIZE 로 고정(입력 불가).
set -euo pipefail
out="${1:?output file required}"
raw="$(cat)"

ids=(calc_id consultant_id map_a client_a prev_map_a map_b client_b prev_map_b)
amts=(commission old_bonus new_bonus old_gross new_gross old_tax new_tax old_net new_net old_nat new_nat old_loc new_loc ss_unit)
strs=(tenant_id period period_start period_end)

declare -A val=()
# 구분자: ; , 줄바꿈, 공백
while IFS= read -r pair; do
  [ -z "$pair" ] && continue
  key="${pair%%=*}"; v="${pair#*=}"
  if [ "$key" = "$pair" ]; then echo "::error::params: '=' 없는 항목" >&2; exit 1; fi
  if [ -n "${val[$key]+x}" ]; then echo "::error::params: 중복 키 $key" >&2; exit 1; fi
  val[$key]="$v"
done < <(printf '%s\n' "$raw" | tr ';, \t\r' '\n\n\n\n\n')

is_known() { local k="$1" x; for x in "${ids[@]}" "${amts[@]}" "${strs[@]}"; do [ "$x" = "$k" ] && return 0; done; return 1; }
for k in "${!val[@]}"; do
  if ! is_known "$k"; then echo "::error::params: 알 수 없는 키 $k" >&2; exit 1; fi
done

# 마스킹 먼저(이후 어떤 출력에도 값이 보이지 않게)
if [ "${GITHUB_ACTIONS:-}" = "true" ]; then
  [ -n "${val[tenant_id]:-}" ] && echo "::add-mask::${val[tenant_id]}"
  for k in "${amts[@]}"; do
    v="${val[$k]:-}"; v="${v%.00}"
    if [ "${#v}" -ge 4 ]; then echo "::add-mask::$v"; fi
  done
fi

for k in "${ids[@]}" "${amts[@]}" "${strs[@]}"; do
  if [ -z "${val[$k]:-}" ]; then echo "::error::params: 필수 키 누락 $k" >&2; exit 1; fi
done
for k in "${ids[@]}"; do
  [[ "${val[$k]}" =~ ^[1-9][0-9]{0,18}$ ]] || { echo "::error::params: $k 형식 오류(양의 정수)" >&2; exit 1; }
done
for k in "${amts[@]}"; do
  [[ "${val[$k]}" =~ ^[0-9]{1,12}(\.[0-9]{1,2})?$ ]] || { echo "::error::params: $k 형식 오류(금액)" >&2; exit 1; }
done
[[ "${val[tenant_id]}" =~ ^[A-Za-z0-9_-]{1,100}$ ]] || { echo "::error::params: tenant_id 형식 오류" >&2; exit 1; }
[[ "${val[period]}" =~ ^[0-9]{4}-[0-9]{2}$ ]] || { echo "::error::params: period 형식 오류(YYYY-MM)" >&2; exit 1; }
for k in period_start period_end; do
  [[ "${val[$k]}" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { echo "::error::params: $k 형식 오류(YYYY-MM-DD)" >&2; exit 1; }
done

{
  echo "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;"
  echo "SET @payout_mode = 'NEUTRALIZE';"
  for k in "${strs[@]}"; do echo "SET @$k = '${val[$k]}';"; done
  for k in "${ids[@]}"; do echo "SET @$k = ${val[$k]};"; done
  for k in "${amts[@]}"; do echo "SET @$k = ${val[$k]};"; done
} > "$out"
echo "preamble ready: $(grep -c '^SET @' "$out") vars (values masked)"
