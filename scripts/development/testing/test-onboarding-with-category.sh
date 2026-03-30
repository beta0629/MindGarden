#!/bin/bash
# 온보딩 프로세스 테스트 (카테고리 매핑 포함)

BASE_URL="http://localhost:8080"
TIMESTAMP=$(date +%s)
TENANT_ID="test-tenant-category-${TIMESTAMP}"
TENANT_NAME="카테고리 테스트 테넌트 ${TIMESTAMP}"
EMAIL="test-category${TIMESTAMP}@example.com"
ADMIN_PASSWORD="Test1234!@#"
ADMIN_EMAIL="superadmin@mindgarden.com"
ADMIN_PASS="admin123"

echo "=========================================="
echo "🧪 온보딩 프로세스 테스트 (카테고리 매핑)"
echo "=========================================="
echo "서버: $BASE_URL"
echo "시간: $(date)"
echo "테넌트 ID: $TENANT_ID"
echo ""

# 1. 관리자 로그인
echo "📋 1단계: 관리자 로그인"
echo "----------------------------------------"
LOGIN_RESPONSE=$(curl -s -c /tmp/admin_cookies.txt -X POST "${BASE_URL}/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASS}\"}")

if ! echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "❌ 관리자 로그인 실패"
    exit 1
fi

echo "✅ 관리자 로그인 성공"
echo ""

# 2. 온보딩 요청 생성
echo "📋 2단계: 온보딩 요청 생성"
echo "----------------------------------------"
REQUEST_PAYLOAD=$(cat <<EOF
{
  "tenantId": "${TENANT_ID}",
  "tenantName": "${TENANT_NAME}",
  "requestedBy": "${EMAIL}",
  "riskLevel": "LOW",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"${ADMIN_PASSWORD}\"}"
}
EOF
)

REQUEST_RESPONSE=$(curl -s -b /tmp/admin_cookies.txt -X POST "${BASE_URL}/api/v1/onboarding/requests" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_PAYLOAD")

REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$REQUEST_ID" ]; then
    echo "❌ 온보딩 요청 생성 실패"
    echo "$REQUEST_RESPONSE"
    exit 1
fi

echo "✅ 온보딩 요청 생성: ID=$REQUEST_ID"
echo ""

# 3. 온보딩 승인
echo "📋 3단계: 온보딩 승인"
echo "----------------------------------------"
APPROVE_PAYLOAD=$(cat <<EOF
{
  "status": "APPROVED",
  "actorId": "${ADMIN_EMAIL}",
  "note": "카테고리 매핑 테스트"
}
EOF
)

APPROVE_RESPONSE=$(curl -s -b /tmp/admin_cookies.txt -X POST "${BASE_URL}/api/v1/onboarding/requests/${REQUEST_ID}/decision" \
    -H "Content-Type: application/json" \
    -d "$APPROVE_PAYLOAD")

if ! echo "$APPROVE_RESPONSE" | grep -q '"status":"APPROVED"'; then
    echo "❌ 온보딩 승인 실패"
    echo "$APPROVE_RESPONSE"
    exit 1
fi

echo "✅ 온보딩 승인 완료"
echo ""

# 프로시저 실행 대기
echo "⏳ 프로시저 실행 대기 중... (5초)"
sleep 5
echo ""

# 4. 테넌트 생성 확인
echo "📋 4단계: 테넌트 생성 확인"
echo "----------------------------------------"
TENANT_CHECK=$(mysql -u mindgarden_dev -p"MindGardenDev2025!@#" core_solution -N -e \
    "SELECT COUNT(*) FROM tenants WHERE tenant_id = '${TENANT_ID}' AND is_deleted = FALSE;" 2>/dev/null)

if [ "$TENANT_CHECK" = "1" ]; then
    echo "✅ 테넌트 생성 확인"
else
    echo "❌ 테넌트 생성 실패"
    exit 1
fi
echo ""

# 5. 카테고리 매핑 확인
echo "📋 5단계: 카테고리 매핑 확인"
echo "----------------------------------------"
CATEGORY_CHECK=$(mysql -u mindgarden_dev -p"MindGardenDev2025!@#" core_solution -N -e \
    "SELECT COUNT(*) FROM tenant_category_mappings 
     WHERE tenant_id = '${TENANT_ID}' 
     AND is_deleted = FALSE 
     AND is_primary = TRUE;" 2>/dev/null)

if [ "$CATEGORY_CHECK" = "1" ]; then
    echo "✅ 카테고리 매핑 생성 확인"
    
    # 카테고리 정보 조회
    CATEGORY_INFO=$(mysql -u mindgarden_dev -p"MindGardenDev2025!@#" core_solution -N -e \
        "SELECT 
            tcm.tenant_id,
            t.name AS tenant_name,
            bci.name_ko AS category_name,
            bci.business_type,
            bci.item_code,
            tcm.is_primary
         FROM tenant_category_mappings tcm
         INNER JOIN tenants t ON tcm.tenant_id = t.tenant_id
         INNER JOIN business_category_items bci ON tcm.category_item_id = bci.item_id
         WHERE tcm.tenant_id = '${TENANT_ID}'
         AND tcm.is_deleted = FALSE
         LIMIT 1;" 2>/dev/null)
    
    if [ -n "$CATEGORY_INFO" ]; then
        echo "카테고리 정보:"
        echo "$CATEGORY_INFO" | awk -F'\t' '{print "  - 테넌트: " $2; print "  - 카테고리: " $3; print "  - 업종: " $4; print "  - 아이템 코드: " $5; print "  - 기본 카테고리: " $6}'
    fi
else
    echo "❌ 카테고리 매핑 생성 실패"
    echo "카테고리 매핑이 생성되지 않았습니다."
    exit 1
fi
echo ""

# 6. 관리자 계정 생성 확인
echo "📋 6단계: 관리자 계정 생성 확인"
echo "----------------------------------------"
ADMIN_CHECK=$(mysql -u mindgarden_dev -p"MindGardenDev2025!@#" core_solution -N -e \
    "SELECT COUNT(*) FROM users 
     WHERE tenant_id = '${TENANT_ID}' 
     AND email = '${EMAIL}' 
     AND is_deleted = FALSE;" 2>/dev/null)

if [ "$ADMIN_CHECK" = "1" ]; then
    echo "✅ 관리자 계정 생성 확인"
    
    # 역할 할당 확인
    ROLE_CHECK=$(mysql -u mindgarden_dev -p"MindGardenDev2025!@#" core_solution -N -e \
        "SELECT COUNT(*) FROM user_role_assignments ura
         INNER JOIN users u ON ura.user_id = u.id
         WHERE u.tenant_id = '${TENANT_ID}'
         AND u.email = '${EMAIL}'
         AND u.is_deleted = FALSE;" 2>/dev/null)
    
    if [ "$ROLE_CHECK" = "1" ]; then
        echo "✅ 역할 할당 확인"
    else
        echo "⚠️  역할 할당 없음"
    fi
else
    echo "❌ 관리자 계정 생성 실패"
fi
echo ""

# 7. 최종 요약
echo "=========================================="
echo "✅ 온보딩 프로세스 테스트 완료"
echo "=========================================="
echo "테넌트 ID: $TENANT_ID"
echo "테넌트 이름: $TENANT_NAME"
echo "관리자 이메일: $EMAIL"
echo "관리자 비밀번호: $ADMIN_PASSWORD"
echo ""
echo "✅ 테넌트 생성: 성공"
echo "✅ 카테고리 매핑: 성공"
echo "✅ 관리자 계정: $([ "$ADMIN_CHECK" = "1" ] && echo '성공' || echo '실패')"
echo ""

