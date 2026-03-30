#!/bin/bash
# 온보딩 승인 후 DB 상태 확인 스크립트
# 테넌트 생성 → 역할 생성 → 대시보드 생성 → 계정 생성 → 역할 할당

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# DB 연결 정보
DB_HOST="${DB_HOST:-114.202.247.246}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-core_solution}"
DB_USER="${DB_USERNAME:-mindgarden_dev}"
DB_PASS="${DB_PASSWORD:-MindGardenDev2025!@#}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}온보딩 승인 후 DB 상태 확인${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 테넌트 ID 입력
if [ -z "$1" ]; then
  echo -e "${YELLOW}사용법: $0 <TENANT_ID> [EMAIL]${NC}"
  echo ""
  echo "예시:"
  echo "  $0 test-tenant-1763942100 test1763942100@test.com"
  echo ""
  echo "또는 최근 생성된 테넌트 확인:"
  echo "  $0 --latest"
  echo ""
  exit 1
fi

if [ "$1" = "--latest" ]; then
  echo -e "${YELLOW}최근 생성된 테넌트 조회 중...${NC}"
  LATEST_TENANT=$(mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" \
    --default-character-set=utf8mb4 \
    -N -e "SELECT tenant_id FROM tenants WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT 1;" 2>/dev/null)
  
  if [ -z "${LATEST_TENANT}" ]; then
    echo -e "${RED}❌ 최근 생성된 테넌트를 찾을 수 없습니다.${NC}"
    exit 1
  fi
  
  TEST_TENANT_ID="${LATEST_TENANT}"
  echo -e "${GREEN}✅ 최근 테넌트: ${TEST_TENANT_ID}${NC}"
  echo ""
else
  TEST_TENANT_ID="$1"
fi

TEST_EMAIL="${2:-}"

echo -e "${YELLOW}검증 대상:${NC}"
echo "  - Tenant ID: ${TEST_TENANT_ID}"
if [ -n "${TEST_EMAIL}" ]; then
  echo "  - Email: ${TEST_EMAIL}"
fi
echo ""

# MySQL 쿼리 실행 함수
run_query() {
  mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" \
    --default-character-set=utf8mb4 \
    -N -e "$1" 2>/dev/null
}

# ============================================
# 1. 테넌트 확인
# ============================================
echo -e "${BLUE}[1] 테넌트 생성 확인${NC}"
TENANT_COUNT=$(run_query "SELECT COUNT(*) FROM tenants WHERE tenant_id = '${TEST_TENANT_ID}' AND is_deleted = 0;")
if [ "${TENANT_COUNT}" -eq 1 ]; then
  echo -e "${GREEN}✅ 테넌트 존재 확인${NC}"
  TENANT_INFO=$(run_query "SELECT name, business_type, status, created_at FROM tenants WHERE tenant_id = '${TEST_TENANT_ID}';")
  echo "  ${TENANT_INFO}"
else
  echo -e "${RED}❌ 테넌트를 찾을 수 없음: ${TENANT_COUNT}개${NC}"
  exit 1
fi
echo ""

# ============================================
# 2. 역할 생성 확인
# ============================================
echo -e "${BLUE}[2] 역할 생성 확인${NC}"
ROLE_COUNT=$(run_query "SELECT COUNT(*) FROM tenant_roles WHERE tenant_id = '${TEST_TENANT_ID}' AND (is_deleted IS NULL OR is_deleted = 0);")
if [ "${ROLE_COUNT}" -ge 1 ]; then
  echo -e "${GREEN}✅ 역할 생성 확인: ${ROLE_COUNT}개${NC}"
  echo "  역할 목록:"
  run_query "SELECT name_ko, name_en, display_order, is_active FROM tenant_roles WHERE tenant_id = '${TEST_TENANT_ID}' AND (is_deleted IS NULL OR is_deleted = 0) ORDER BY display_order;" | while IFS=$'\t' read -r name_ko name_en display_order is_active; do
    echo "    - ${name_ko} (${name_en}) [순서: ${display_order}, 활성: ${is_active}]"
  done
  
  # 역할별 권한 확인
  echo ""
  echo "  역할별 권한 수:"
  run_query "SELECT tr.name_ko, COUNT(rp.permission_code) AS permission_count FROM tenant_roles tr LEFT JOIN role_permissions rp ON tr.tenant_role_id = rp.tenant_role_id WHERE tr.tenant_id = '${TEST_TENANT_ID}' AND (tr.is_deleted IS NULL OR tr.is_deleted = 0) GROUP BY tr.tenant_role_id, tr.name_ko ORDER BY tr.display_order;" | while IFS=$'\t' read -r role_name permission_count; do
    echo "    - ${role_name}: ${permission_count}개 권한"
  done
else
  echo -e "${RED}❌ 역할 생성 실패: ${ROLE_COUNT}개${NC}"
  echo -e "${YELLOW}⚠️  ApplyDefaultRoleTemplates 프로시저가 실행되지 않았을 수 있습니다.${NC}"
  echo ""
  echo "  해결 방법:"
  echo "    1. ProcessOnboardingApproval 프로시저에서 ApplyDefaultRoleTemplates 호출 확인"
  echo "    2. role_template_mappings 테이블에 CONSULTATION 업종 매핑 확인"
  exit 1
fi
echo ""

# ============================================
# 3. 대시보드 생성 확인
# ============================================
echo -e "${BLUE}[3] 대시보드 생성 확인${NC}"
DASHBOARD_COUNT=$(run_query "SELECT COUNT(*) FROM tenant_dashboards WHERE tenant_id = '${TEST_TENANT_ID}' AND (is_deleted IS NULL OR is_deleted = 0);")
if [ "${DASHBOARD_COUNT}" -ge 1 ]; then
  echo -e "${GREEN}✅ 대시보드 생성 확인: ${DASHBOARD_COUNT}개${NC}"
  echo "  대시보드 목록:"
  run_query "SELECT dashboard_name, dashboard_type, is_default, display_order FROM tenant_dashboards WHERE tenant_id = '${TEST_TENANT_ID}' AND (is_deleted IS NULL OR is_deleted = 0) ORDER BY display_order;" | while IFS=$'\t' read -r name type is_default display_order; do
    echo "    - ${name} (${type}) [기본: ${is_default}, 순서: ${display_order}]"
  done
  
  # 대시보드별 위젯 수 확인
  echo ""
  echo "  대시보드별 위젯 수:"
  run_query "SELECT dashboard_name, JSON_LENGTH(COALESCE(JSON_EXTRACT(dashboard_config, '$.widgets'), '[]')) AS widget_count FROM tenant_dashboards WHERE tenant_id = '${TEST_TENANT_ID}' AND (is_deleted IS NULL OR is_deleted = 0);" | while IFS=$'\t' read -r dashboard_name widget_count; do
    echo "    - ${dashboard_name}: ${widget_count}개 위젯"
  done
else
  echo -e "${RED}❌ 대시보드 생성 실패: ${DASHBOARD_COUNT}개${NC}"
  echo -e "${YELLOW}⚠️  createDefaultDashboards() 메서드가 실행되지 않았을 수 있습니다.${NC}"
  echo ""
  echo "  해결 방법:"
  echo "    1. OnboardingServiceImpl.decideInternal() 메서드에서 createDefaultDashboards 호출 확인"
  echo "    2. TenantDashboardService.createDefaultDashboards() 로그 확인"
  exit 1
fi
echo ""

# ============================================
# 4. 관리자 계정 확인
# ============================================
echo -e "${BLUE}[4] 관리자 계정 생성 확인${NC}"
if [ -n "${TEST_EMAIL}" ]; then
  USER_COUNT=$(run_query "SELECT COUNT(*) FROM users WHERE email = '${TEST_EMAIL}' AND tenant_id = '${TEST_TENANT_ID}' AND (is_deleted IS NULL OR is_deleted = 0);")
  if [ "${USER_COUNT}" -eq 1 ]; then
    echo -e "${GREEN}✅ 관리자 계정 생성 확인${NC}"
    USER_INFO=$(run_query "SELECT id, email, username, role, is_active, is_email_verified, created_at FROM users WHERE email = '${TEST_EMAIL}' AND tenant_id = '${TEST_TENANT_ID}';")
    echo "  ${USER_INFO}"
  else
    echo -e "${RED}❌ 관리자 계정 생성 실패: ${USER_COUNT}개${NC}"
    echo -e "${YELLOW}⚠️  createTenantAdminAccount() 메서드가 실행되지 않았을 수 있습니다.${NC}"
    exit 1
  fi
else
  # 이메일이 없으면 테넌트의 모든 관리자 계정 확인
  ADMIN_COUNT=$(run_query "SELECT COUNT(*) FROM users WHERE tenant_id = '${TEST_TENANT_ID}' AND role = 'ADMIN' AND (is_deleted IS NULL OR is_deleted = 0);")
  if [ "${ADMIN_COUNT}" -ge 1 ]; then
    echo -e "${GREEN}✅ 관리자 계정 생성 확인: ${ADMIN_COUNT}개${NC}"
    echo "  관리자 계정 목록:"
    run_query "SELECT id, email, username, role, is_active, created_at FROM users WHERE tenant_id = '${TEST_TENANT_ID}' AND role = 'ADMIN' AND (is_deleted IS NULL OR is_deleted = 0);" | while IFS=$'\t' read -r id email username role is_active created_at; do
      echo "    - ${email} (${username}) [활성: ${is_active}]"
    done
  else
    echo -e "${RED}❌ 관리자 계정 생성 실패: ${ADMIN_COUNT}개${NC}"
    exit 1
  fi
fi
echo ""

# ============================================
# 5. 역할 할당 확인
# ============================================
echo -e "${BLUE}[5] 역할 할당 확인${NC}"
if [ -n "${TEST_EMAIL}" ]; then
  USER_ID=$(run_query "SELECT id FROM users WHERE email = '${TEST_EMAIL}' AND tenant_id = '${TEST_TENANT_ID}' LIMIT 1;")
  if [ -n "${USER_ID}" ]; then
    ASSIGNMENT_COUNT=$(run_query "SELECT COUNT(*) FROM user_role_assignments ura JOIN tenant_roles tr ON ura.tenant_role_id = tr.tenant_role_id WHERE ura.user_id = ${USER_ID} AND tr.tenant_id = '${TEST_TENANT_ID}' AND (ura.is_deleted IS NULL OR ura.is_deleted = 0) AND ura.is_active = b'1';")
    
    if [ "${ASSIGNMENT_COUNT}" -ge 1 ]; then
      echo -e "${GREEN}✅ 역할 할당 확인: ${ASSIGNMENT_COUNT}개${NC}"
      echo "  역할 할당 목록:"
      run_query "SELECT tr.name_ko, ura.effective_from, ura.effective_to, ura.assigned_by FROM user_role_assignments ura JOIN tenant_roles tr ON ura.tenant_role_id = tr.tenant_role_id WHERE ura.user_id = ${USER_ID} AND tr.tenant_id = '${TEST_TENANT_ID}' AND (ura.is_deleted IS NULL OR ura.is_deleted = 0) AND ura.is_active = b'1';" | while IFS=$'\t' read -r role_name effective_from effective_to assigned_by; do
        echo "    - ${role_name} (${effective_from} ~ ${effective_to:-무기한}) [할당자: ${assigned_by}]"
      done
    else
      echo -e "${RED}❌ 역할 할당 실패: ${ASSIGNMENT_COUNT}개${NC}"
      echo -e "${YELLOW}⚠️  assignAdminRoleToUser() 메서드가 실행되지 않았을 수 있습니다.${NC}"
      echo ""
      echo "  해결 방법:"
      echo "    1. OnboardingServiceImpl.createTenantAdminAccount() 메서드 확인"
      echo "    2. '관리자' 역할 이름으로 TenantRole 검색 로직 확인"
      exit 1
    fi
  else
    echo -e "${RED}❌ 사용자 ID 조회 실패${NC}"
    exit 1
  fi
else
  # 이메일이 없으면 테넌트의 모든 역할 할당 확인
  ASSIGNMENT_COUNT=$(run_query "SELECT COUNT(*) FROM user_role_assignments ura JOIN tenant_roles tr ON ura.tenant_role_id = tr.tenant_role_id JOIN users u ON ura.user_id = u.id WHERE u.tenant_id = '${TEST_TENANT_ID}' AND (ura.is_deleted IS NULL OR ura.is_deleted = 0) AND ura.is_active = b'1';")
  if [ "${ASSIGNMENT_COUNT}" -ge 1 ]; then
    echo -e "${GREEN}✅ 역할 할당 확인: ${ASSIGNMENT_COUNT}개${NC}"
    echo "  역할 할당 목록:"
    run_query "SELECT u.email, tr.name_ko, ura.effective_from, ura.effective_to FROM user_role_assignments ura JOIN tenant_roles tr ON ura.tenant_role_id = tr.tenant_role_id JOIN users u ON ura.user_id = u.id WHERE u.tenant_id = '${TEST_TENANT_ID}' AND (ura.is_deleted IS NULL OR ura.is_deleted = 0) AND ura.is_active = b'1';" | while IFS=$'\t' read -r email role_name effective_from effective_to; do
      echo "    - ${email} → ${role_name} (${effective_from} ~ ${effective_to:-무기한})"
    done
  else
    echo -e "${RED}❌ 역할 할당 실패: ${ASSIGNMENT_COUNT}개${NC}"
    exit 1
  fi
fi
echo ""

# ============================================
# 최종 결과
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 전체 사이클 검증 완료${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}검증 결과 요약:${NC}"
echo "  ✅ 테넌트 생성: 성공"
echo "  ✅ 역할 생성: ${ROLE_COUNT}개"
echo "  ✅ 대시보드 생성: ${DASHBOARD_COUNT}개"
echo "  ✅ 관리자 계정 생성: 성공"
echo "  ✅ 역할 할당: ${ASSIGNMENT_COUNT}개"
echo ""

