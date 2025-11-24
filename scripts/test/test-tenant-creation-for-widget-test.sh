#!/bin/bash
# 상담소 및 학원 테넌트 생성 후 위젯 테스트용 스크립트

BASE_URL="${1:-http://beta0629.cafe24.com:8080}"
TIMESTAMP=$(date +%s)
ADMIN_PASSWORD="Test1234!@#"

echo "=========================================="
echo "🧪 테넌트 생성 및 위젯 테스트 준비"
echo "=========================================="
echo "서버: $BASE_URL"
echo "시간: $(date)"
echo ""

# 함수: 테넌트 생성
create_tenant() {
    local BUSINESS_TYPE=$1
    local TENANT_NAME=$2
    local EMAIL=$3
    local TENANT_ID_PREFIX=$4
    
    echo "=========================================="
    echo "📋 ${TENANT_NAME} 테넌트 생성"
    echo "=========================================="
    
    # 온보딩 요청 생성
    echo "1. 온보딩 요청 생성 중..."
    REQUEST_PAYLOAD=$(cat <<EOF
{
  "tenantName": "${TENANT_NAME}",
  "requestedBy": "${EMAIL}",
  "businessType": "${BUSINESS_TYPE}",
  "checklistJson": "{\"adminPassword\": \"${ADMIN_PASSWORD}\", \"contactPhone\": \"010-1234-5678\", \"address\": \"서울특별시 강남구\"}"
}
EOF
    )
    
    REQUEST_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/onboarding/requests" \
        -H "Content-Type: application/json" \
        -d "$REQUEST_PAYLOAD")
    
    REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    
    if [ -z "$REQUEST_ID" ] || [ "$REQUEST_ID" = "null" ]; then
        echo "❌ 온보딩 요청 생성 실패"
        echo "$REQUEST_RESPONSE"
        return 1
    fi
    
    echo "✅ 온보딩 요청 생성 완료: ID=$REQUEST_ID"
    
    # 온보딩 승인
    echo "2. 온보딩 승인 중..."
    APPROVE_PAYLOAD=$(cat <<EOF
{
  "status": "APPROVED",
  "actorId": "superadmin@mindgarden.com",
  "note": "위젯 테스트용 테넌트 생성"
}
EOF
    )
    
    APPROVE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/onboarding/requests/${REQUEST_ID}/decision" \
        -H "Content-Type: application/json" \
        -d "$APPROVE_PAYLOAD")
    
    if ! echo "$APPROVE_RESPONSE" | grep -q '"status":"APPROVED"'; then
        echo "❌ 온보딩 승인 실패"
        echo "$APPROVE_RESPONSE"
        return 1
    fi
    
    echo "✅ 온보딩 승인 완료"
    
    # 프로시저 실행 대기
    echo "3. 프로시저 실행 대기 중... (5초)"
    sleep 5
    
    # 테넌트 ID 확인
    echo "4. 테넌트 ID 확인 중..."
    ssh root@beta0629.cafe24.com << EOF
        if [ -f /etc/mindgarden/dev.env ]; then
            source /etc/mindgarden/dev.env
        fi
        
        DB_USER="\${DB_USERNAME:-mindgarden_dev}"
        DB_PASS="\${DB_PASSWORD}"
        DB_NAME="\${DB_NAME:-core_solution}"
        
        TENANT_ID=\$(mysql -u "\$DB_USER" -p"\$DB_PASS" "\$DB_NAME" -N -e "
            SELECT tenant_id 
            FROM onboarding_requests 
            WHERE id = ${REQUEST_ID} 
            AND status = 'APPROVED'
            LIMIT 1;
        " 2>/dev/null)
        
        if [ -n "\$TENANT_ID" ]; then
            echo "\$TENANT_ID"
        else
            echo ""
        fi
EOF
    
    echo ""
    echo "✅ ${TENANT_NAME} 테넌트 생성 완료"
    echo "   - 이메일: ${EMAIL}"
    echo "   - 비밀번호: ${ADMIN_PASSWORD}"
    echo "   - 요청 ID: ${REQUEST_ID}"
    echo ""
    
    return 0
}

# 상담소 테넌트 생성
CONSULTATION_EMAIL="test-consultation-${TIMESTAMP}@example.com"
create_tenant "CONSULTATION" "테스트 상담소" "$CONSULTATION_EMAIL" "consultation"
CONSULTATION_REQUEST_ID=$REQUEST_ID

# 학원 테넌트 생성
ACADEMY_EMAIL="test-academy-${TIMESTAMP}@example.com"
create_tenant "ACADEMY" "테스트 학원" "$ACADEMY_EMAIL" "academy"
ACADEMY_REQUEST_ID=$REQUEST_ID

# 최종 요약
echo "=========================================="
echo "✅ 테넌트 생성 완료"
echo "=========================================="
echo ""
echo "📋 상담소 테넌트:"
echo "   - 이메일: $CONSULTATION_EMAIL"
echo "   - 비밀번호: $ADMIN_PASSWORD"
echo "   - 요청 ID: $CONSULTATION_REQUEST_ID"
echo ""
echo "📋 학원 테넌트:"
echo "   - 이메일: $ACADEMY_EMAIL"
echo "   - 비밀번호: $ADMIN_PASSWORD"
echo "   - 요청 ID: $ACADEMY_REQUEST_ID"
echo ""
echo "🧪 다음 단계:"
echo "1. 각 테넌트로 로그인"
echo "   - URL: ${BASE_URL}/login"
echo ""
echo "2. 위젯 편집 UI 접속"
echo "   - URL: ${BASE_URL}/admin/dashboards"
echo ""
echo "3. 위젯 테스트 진행"
echo "   - 대시보드 생성/수정"
echo "   - 위젯 추가/삭제"
echo "   - 드래그 앤 드롭 레이아웃 편집"
echo "   - 위젯 설정 변경"
echo ""
echo "=========================================="

