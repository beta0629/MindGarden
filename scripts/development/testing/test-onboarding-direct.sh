#!/bin/bash
# 서버 내부에서 직접 온보딩 테스트

TIMESTAMP=$(date +%s)
TENANT_ID="test-tenant-${TIMESTAMP}"
TENANT_NAME="테스트테넌트${TIMESTAMP}"
EMAIL="test${TIMESTAMP}@test.com"
ADMIN_PASSWORD="Test1234!@#"

echo "=========================================="
echo "🧪 서버 내부 온보딩 테스트"
echo "=========================================="
echo ""

ssh root@beta0629.cafe24.com << EOF
    BASE_URL="http://localhost:8080"
    TIMESTAMP=${TIMESTAMP}
    TENANT_ID="${TENANT_ID}"
    TENANT_NAME="${TENANT_NAME}"
    EMAIL="${EMAIL}"
    ADMIN_PASSWORD="${ADMIN_PASSWORD}"
    
    echo "1. 서버 상태 확인..."
    curl -s "\${BASE_URL}/actuator/health" | head -5
    echo ""
    
    echo "2. 프로시저 헬스체크..."
    curl -s "\${BASE_URL}/api/health/procedures/create-or-activate-tenant" | head -10
    echo ""
    
    echo "3. 온보딩 요청 생성..."
    REQUEST_PAYLOAD="{\\\"tenantId\\\":\\\"\${TENANT_ID}\\\",\\\"tenantName\\\":\\\"\${TENANT_NAME}\\\",\\\"requestedBy\\\":\\\"\${EMAIL}\\\",\\\"businessType\\\":\\\"CONSULTATION\\\",\\\"checklistJson\\\":\\\"{\\\\\\\"adminPassword\\\\\\\":\\\\\\\"\${ADMIN_PASSWORD}\\\\\\\"}\\\"}"
    
    REQUEST_RESPONSE=\$(curl -s -X POST "\${BASE_URL}/api/v1/onboarding/requests" \
        -H "Content-Type: application/json" \
        -d "\${REQUEST_PAYLOAD}")
    
    echo "\${REQUEST_RESPONSE}" | head -20
    echo ""
    
    REQUEST_ID=\$(echo "\${REQUEST_RESPONSE}" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    
    if [ -n "\${REQUEST_ID}" ] && [ "\${REQUEST_ID}" != "null" ]; then
        echo "✅ 온보딩 요청 생성 완료: ID=\${REQUEST_ID}"
        echo ""
        
        echo "4. 온보딩 승인..."
        APPROVE_PAYLOAD="{\\\"status\\\":\\\"APPROVED\\\",\\\"actorId\\\":\\\"superadmin@mindgarden.com\\\",\\\"note\\\":\\\"테스트 승인\\\"}"
        
        APPROVE_RESPONSE=\$(curl -s -X POST "\${BASE_URL}/api/v1/onboarding/requests/\${REQUEST_ID}/decision" \
            -H "Content-Type: application/json" \
            -d "\${APPROVE_PAYLOAD}")
        
        echo "\${APPROVE_RESPONSE}" | head -20
        echo ""
        
        if echo "\${APPROVE_RESPONSE}" | grep -q '"status":"APPROVED"'; then
            echo "✅ 온보딩 승인 완료!"
            echo ""
            echo "=========================================="
            echo "✅ 테스트 완료!"
            echo "=========================================="
            echo "테넌트 ID: \${TENANT_ID}"
            echo "이메일: \${EMAIL}"
            echo "비밀번호: \${ADMIN_PASSWORD}"
        else
            echo "❌ 온보딩 승인 실패"
        fi
    else
        echo "❌ 온보딩 요청 생성 실패"
    fi
EOF

echo ""
echo "테스트 완료!"

