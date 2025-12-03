# 테스트 스크립트 수정 요약

**작성일**: 2025-12-03  
**목적**: 어제 통과한 테스트 스크립트를 참고하여 오늘 스크립트 수정

---

## 🔍 문제점

오늘 새로 작성한 `test-phase1-4-integration.sh` 스크립트가 어제 통과한 `test-widget-grouping-system.sh`와 다른 방식으로 작성되어 실패했습니다.

---

## ✅ 해결 방안

어제 통과한 테스트 스크립트(`test-widget-grouping-system.sh`)의 방식 그대로 사용:

### 1. 온보딩 요청 생성

**어제 스크립트 방식**:
```bash
REQUEST_PAYLOAD=$(cat <<EOF
{
  "tenantName": "위젯 테스트 상담소",
  "requestedBy": "${TENANT_EMAIL}",
  "riskLevel": "LOW",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"${ADMIN_PASSWORD}\", \"contactPhone\": \"010-1234-5678\", \"address\": \"서울특별시 강남구\"}"
}
EOF
)

REQUEST_RESPONSE=$(curl -s -X POST "${API_URL}/api/v1/onboarding/requests" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_PAYLOAD")

# UUID 형식의 ID 추출
REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
```

**오늘 스크립트 수정**:
- ✅ 동일한 엔드포인트: `/api/v1/onboarding/requests` (복수)
- ✅ 동일한 요청 필드 구조
- ✅ 동일한 ID 추출 방식

### 2. 관리자 로그인

**어제 스크립트 방식**:
```bash
ADMIN_COOKIE_FILE="/tmp/admin_cookies.txt"
rm -f "$ADMIN_COOKIE_FILE"

ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -c "$ADMIN_COOKIE_FILE" \
    -d '{"email":"superadmin@mindgarden.com","password":"admin123"}')
```

**오늘 스크립트 수정**:
- ✅ 별도 쿠키 파일 사용
- ✅ curl 직접 사용 (api_call 함수 사용 안 함)

### 3. 온보딩 승인

**어제 스크립트 방식**:
```bash
APPROVE_PAYLOAD=$(cat <<EOF
{
  "status": "APPROVED",
  "actorId": "superadmin@mindgarden.com",
  "note": "위젯 시스템 테스트용"
}
EOF
)

APPROVE_RESPONSE=$(curl -s -X POST "${API_URL}/api/v1/onboarding/requests/${REQUEST_ID}/decision" \
    -H "Content-Type: application/json" \
    -b "$ADMIN_COOKIE_FILE" \
    -d "$APPROVE_PAYLOAD")

# APPROVED 또는 ON_HOLD 상태 모두 허용
if ! echo "$APPROVE_RESPONSE" | grep -qE '"status":"(APPROVED|ON_HOLD)"'; then
    fail "온보딩 승인 실패"
fi
```

**오늘 스크립트 수정**:
- ✅ 동일한 승인 엔드포인트: `/api/v1/onboarding/requests/${ONBOARDING_ID}/decision`
- ✅ 동일한 검증 방식: APPROVED 또는 ON_HOLD 상태 허용
- ✅ curl 직접 사용

### 4. 프로시저 실행 대기

**어제 스크립트 방식**:
```bash
log "1.4 프로시저 실행 대기 중... (5초)"
sleep 5
```

**오늘 스크립트 수정**:
- ✅ 5초 대기 추가

### 5. 테넌트 ID 추출

**어제 스크립트 방식**:
```bash
TENANT_ID=$(echo "$APPROVE_RESPONSE" | grep -o '"tenantId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TENANT_ID" ] || [ "$TENANT_ID" = "null" ]; then
    # data 객체 안의 tenantId 추출 시도
    TENANT_ID=$(echo "$APPROVE_RESPONSE" | grep -o '"data":{[^}]*"tenantId":"[^"]*"' | grep -o '"tenantId":"[^"]*"' | cut -d'"' -f4)
fi
```

**오늘 스크립트 수정**:
- ✅ 동일한 추출 방식

---

## 📝 주요 변경사항

1. **온보딩 요청**: 어제 스크립트와 동일한 요청 형식 사용
2. **관리자 로그인**: 별도 쿠키 파일 사용, curl 직접 사용
3. **온보딩 승인**: 동일한 검증 방식 사용
4. **프로시저 대기**: 5초 대기 추가
5. **테넌트 ID 추출**: 동일한 추출 방식

---

## 🎯 교훈

1. ✅ **검증된 스크립트 재사용**: 통과한 테스트 스크립트를 참고
2. ✅ **실제 코드 확인**: 문서만 믿지 말고 실제 스크립트 확인
3. ✅ **일관성 유지**: 동일한 방식으로 통일

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025-12-03

