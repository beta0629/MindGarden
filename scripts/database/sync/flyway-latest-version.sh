#!/usr/bin/env bash
# 저장소 Flyway 마이그레이션 중 가장 높은 버전 (V20261015_003__desc.sql → 20261015.003).
# prod-to-dev-daily.sh(복원 뒤 확인)와 publish-dev-sync-bundle.sh(번들에 기대 버전 기록)가 함께 쓴다.
#
# 사용: source 후 flyway_latest_version <마이그레이션 디렉터리>
#       또는 직접 실행: flyway-latest-version.sh <디렉터리>

flyway_latest_version() {
  local dir="$1"
  [[ -d "$dir" ]] || return 1
  find "$dir" -maxdepth 1 -type f -name 'V*__*.sql' -printf '%f\n' \
    | sed -E 's/^V(.+)__.*$/\1/; s/_/./g' \
    | sort -V | tail -1
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  set -euo pipefail
  flyway_latest_version "${1:?마이그레이션 디렉터리 필요}"
fi
