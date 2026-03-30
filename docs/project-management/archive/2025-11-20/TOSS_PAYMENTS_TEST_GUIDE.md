# 토스페이먼츠 SDK 테스트 실행 가이드

**작성일**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 테스트 진행 중

---

## 🚀 빠른 시작 가이드

### 1. 환경 변수 설정

#### 백엔드
```bash
# 프로젝트 루트에 .env.local 파일 생성
cat > .env.local << 'EOF'
PAYMENT_TOSS_SECRET_KEY=test_sk_ORzdMaqN3w59ZLadepPbr5AkYXQG
PAYMENT_TOSS_WEBHOOK_SECRET=09fb9726652b997b8b7f4fe44782cd08f8cda6bb8ed8af243ebe9248d967ba2c
PAYMENT_TOSS_SIMULATION_MODE=true
EOF
```

#### Trinity (Next.js)
```bash
cd frontend-trinity
cat > .env.local << 'EOF'
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_jExPeJWYVQ56w5kKdmpqV49R5gvN
NEXT_PUBLIC_TOSS_TEST_MODE=true
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_FRONTEND_BASE_URL=http://localhost:3000
EOF
```

#### 웹앱 (React)
```bash
cd frontend
cat > .env.local << 'EOF'
REACT_APP_TOSS_CLIENT_KEY=test_ck_jExPeJWYVQ56w5kKdmpqV49R5gvN
REACT_APP_TOSS_TEST_MODE=true
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_FRONTEND_BASE_URL=http://localhost:3000
EOF
```

---

## 🧪 테스트 시나리오

### Phase 1.1: 웹앱 자동결제 등록 테스트 (우선 진행)

**현재 상태**: ✅ 구현 완료
- `PaymentMethodRegistration` 컴포넌트 ✅
- `BillingCallback` 페이지 ✅
- `requestBillingAuth` 구현 ✅

#### 테스트 단계

1. **서버 실행**
   ```bash
   # 백엔드 실행 (포트 8080)
   # 프론트엔드 실행 (포트 3000)
   cd frontend
   npm start
   ```

2. **웹앱 접속**
   - 브라우저에서 `http://localhost:3000` 접속
   - 로그인 (테스트 계정 사용)

3. **결제 수단 등록 페이지 이동**
   - URL: `http://localhost:3000/billing/payment-method`
   - 또는 메뉴에서 "결제 수단 등록" 클릭

4. **결제 수단 등록 버튼 클릭**
   - "결제 수단 등록" 버튼 클릭
   - 토스페이먼츠 결제 창이 열리는지 확인

5. **테스트 카드 정보 입력**
   - 카드번호: `1234-5678-9012-3456`
   - 유효기간: `12/25`
   - CVC: `123`
   - 비밀번호: `123456`

6. **결제 완료 확인**
   - 결제 완료 후 콜백 페이지로 이동 확인
   - 성공 메시지 표시 확인
   - 브라우저 콘솔에서 에러 확인

7. **백엔드 확인**
   - 빌링키가 정상 저장되었는지 확인
   - 데이터베이스에서 `payment_methods` 테이블 확인

#### 예상 결과
- ✅ 토스페이먼츠 결제 창 정상 표시
- ✅ 결제 완료 후 콜백 페이지 정상 이동 (`/billing/callback?status=success&...`)
- ✅ 빌링키가 백엔드에 정상 저장됨
- ✅ 성공 메시지 표시

#### 문제 해결

**문제 1**: `window.TossPayments is not defined`
- **원인**: SDK 스크립트가 로드되지 않음
- **해결**: `frontend/public/index.html`에 스크립트 태그 확인
  ```html
  <script src="https://js.tosspayments.com/v2" async></script>
  ```

**문제 2**: 클라이언트 키가 `undefined`
- **원인**: 환경 변수가 설정되지 않음
- **해결**: `frontend/.env.local` 파일 확인 및 서버 재시작

**문제 3**: 콜백 페이지에서 에러 발생
- **원인**: URL 파라미터 누락 또는 백엔드 API 오류
- **해결**: 브라우저 콘솔 및 네트워크 탭에서 에러 확인

---

### Phase 1.2: Trinity 홈페이지 테스트 (추후 진행)

**현재 상태**: ⚠️ 테스트 모드만 구현됨
- 실제 `requestBillingAuth` 미사용
- 콜백 페이지 없음

**필요 작업**:
1. Trinity에 콜백 페이지 추가 (`/onboarding/callback`)
2. 온보딩 페이지에서 `requestBillingAuth` 사용하도록 수정

**임시 테스트**:
- 현재 테스트 모드로 카드 토큰 생성 테스트 가능
- 실제 빌링키 등록은 웹앱에서 테스트

---

### Phase 1.3: 구독 관리 테스트

#### API 테스트

**1. 구독 목록 조회**
```bash
curl -X GET "http://localhost:8080/api/v1/billing/subscriptions?tenantId=YOUR_TENANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**2. 구독 생성**
```bash
curl -X POST "http://localhost:8080/api/v1/billing/subscriptions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "planId": "plan-1",
    "paymentMethodId": "pm-123",
    "billingCycle": "MONTHLY",
    "autoRenewal": true
  }'
```

**3. 구독 취소**
```bash
curl -X DELETE "http://localhost:8080/api/v1/billing/subscriptions/sub-123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 테스트 체크리스트

테스트 진행 시 `TOSS_PAYMENTS_TEST_CHECKLIST.md` 파일을 사용하여 단계별로 체크하세요.

---

## 🐛 알려진 이슈

### 이슈 1: Trinity 콜백 페이지 없음
- **상태**: 대기 중
- **해결**: Trinity에 콜백 페이지 추가 필요

### 이슈 2: 공통 코드 미등록
- **상태**: 확인 필요
- **해결**: 데이터베이스에 공통 코드 등록 확인

---

## 🎯 다음 단계

1. ✅ 웹앱 자동결제 등록 테스트 (우선 진행)
2. ⏳ Trinity 콜백 페이지 추가
3. ⏳ Trinity 실제 SDK 연동
4. ⏳ 구독 관리 테스트
5. ⏳ 전체 플로우 통합 테스트

---

**마지막 업데이트**: 2025-11-20

