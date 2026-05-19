#!/usr/bin/env bash
# dev Shop·Reward 배포 후 read-only 검증 헬퍼 (OPS/QA).
#
# Usage:
#   TENANT_ID=<uuid> bash scripts/ops/verify-shop-reward-dev.sh
#   TENANT_ID=<uuid> API_BASE=https://dev.core-solution.co.kr bash scripts/ops/verify-shop-reward-dev.sh
#
# Environment:
#   TENANT_ID              (required) 검증 대상 tenant UUID — 저장소·스크립트에 하드코딩 금지
#   API_BASE               (optional) dev API apex URL. Default: https://dev.core-solution.co.kr
#   SKIP_HEALTH            (optional) 1이면 GET $API_BASE/actuator/health 생략
#   HEALTH_CONNECT_TIMEOUT (optional) curl 연결 타임아웃(초). Default: 10
#   VERIFY_STRICT          (optional) 1이면 health check 실패 시 exit 1 (기본은 exit 0)
#
# Exit codes:
#   0 — 체크리스트 출력 완료 (기본: health 실패해도 0)
#   1 — VERIFY_STRICT=1 이고 health check 수행·실패
#   2 — TENANT_ID 미설정
#
# Secret·tenant UUID 하드코딩 금지. DB 검증은 수동 SQL(런북 §1.2) 참고.
set -euo pipefail

API_BASE="${API_BASE:-https://dev.core-solution.co.kr}"
HEALTH_CONNECT_TIMEOUT="${HEALTH_CONNECT_TIMEOUT:-10}"
SKIP_HEALTH="${SKIP_HEALTH:-0}"
VERIFY_STRICT="${VERIFY_STRICT:-0}"

if [[ -z "${TENANT_ID:-}" ]]; then
    echo "ERROR: TENANT_ID 환경 변수가 필요합니다 (tenant UUID 하드코딩 금지)." >&2
    echo "Usage: TENANT_ID=<uuid> bash scripts/ops/verify-shop-reward-dev.sh" >&2
    exit 2
fi

_health_failed=0

echo "=== Shop·Reward dev verification helper (read-only) ==="
echo "Time (UTC): $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "API_BASE: ${API_BASE}"
echo "TENANT_ID: ${TENANT_ID}"
echo ""

if [[ "${SKIP_HEALTH}" == "1" ]]; then
    echo "--- actuator/health — skipped (SKIP_HEALTH=1) ---"
    echo ""
else
    _health_url="${API_BASE%/}/actuator/health"
    echo "--- actuator/health (optional) ---"
    echo "URL: ${_health_url}"
    set +e
    _http_code=$(curl -sS -o /dev/null -w '%{http_code}' \
        --connect-timeout "${HEALTH_CONNECT_TIMEOUT}" \
        "${_health_url}" 2>/dev/null)
    _curl_exit=$?
    set -e
    if [[ ${_curl_exit} -ne 0 ]]; then
        echo "FAIL: curl exit ${_curl_exit}"
        _health_failed=1
    elif [[ "${_http_code}" == "200" ]]; then
        echo "OK: HTTP ${_http_code}"
    else
        echo "WARN: HTTP ${_http_code} (기대 200)"
        _health_failed=1
    fi
    echo ""
fi

echo "--- Flyway 수동 DB 확인 (flyway_schema_history) ---"
echo "대상 DB에 접속 후 아래 버전이 SUCCESS 인지 확인하세요 (런북 §1.2 검증 SQL 참고):"
echo "  - V20260519_002  point_tenant_policies"
echo "  - V20260519_003  shop_reward component_catalog seed"
echo "  - V20260519_004  shop_order_refunded_status"
echo "  - V20260519_005  shop_order_fulfillment_events"
echo "  - V20260519_006  shop_order_line_mapping_link"
echo "  - V20260519_007  shop_catalog_category_column"
echo "  - V20260520_001  shop_catalog_sku_price_history"
echo "  - V20260521_001  lnb_admin_shop_reward_menus"
echo ""
echo "예시 SQL:"
echo "  SELECT version, description, success, installed_on"
echo "  FROM flyway_schema_history"
echo "  WHERE version IN ("
echo "    '20260519.002','20260519.003','20260519.004','20260519.005',"
echo "    '20260519.006','20260519.007','20260520.001','20260521.001'"
echo "  ) ORDER BY installed_rank;"
echo ""

echo "--- OPS SQL 실행 순서 (tenant_id = TENANT_ID env 값으로 치환) ---"
echo "  1) scripts/ops/activate-shop-reward-tenant-components.sql"
echo "     - Flyway V20260519_003(component_catalog 시드) 이후"
echo "     - CLIENT_SHOP, CLIENT_REWARD, ADMIN_SHOP_CATALOG 활성화"
echo "  2) scripts/ops/seed-shop-demo-catalog.sql"
echo "     - §1 Flyway 002~007 + V20260520_001 적용 및 §2 TenantComponent 활성화 이후"
echo "     - dev QA용 CONSULTATION SKU 1건 (catalog_visible=1)"
echo ""
echo "실행 예 (mysql, \$DB_* 는 환경 Secret — 저장소에 하드코딩 금지):"
echo "  mysql -h \"\$DB_HOST\" -u \"\$DB_USER\" -p\"\$DB_PASS\" \"\$DB_NAME\" \\"
echo "    -e \"SET @tenant_id='${TENANT_ID}'; SOURCE scripts/ops/activate-shop-reward-tenant-components.sql;\""
echo "  mysql -h \"\$DB_HOST\" -u \"\$DB_USER\" -p\"\$DB_PASS\" \"\$DB_NAME\" \\"
echo "    -e \"SET @tenant_id='${TENANT_ID}'; SOURCE scripts/ops/seed-shop-demo-catalog.sql;\""
echo ""

echo "--- 후속 수동 QA ---"
echo "  - 런북 §4 P2 수동 QA (SHOP_P2_INTEGRATION_TEST_REPORT.md §5·§6)"
echo "  - 런북 §5 Playwright: tests/e2e/tests/client/client-shop-catalog-to-cart.spec.ts"
echo ""

echo "=== verification helper end ==="

if [[ "${VERIFY_STRICT}" == "1" && "${_health_failed}" -eq 1 ]]; then
    exit 1
fi

exit 0
