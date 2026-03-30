# 토스페이먼츠 SDK v2 연동 계획

**작성일**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 계획 수립 완료

---

## 📋 개요

토스페이먼츠 SDK v2는 JavaScript SDK이므로 **모든 웹 애플리케이션에서 동일하게 사용**할 수 있습니다.

### 지원 대상
- ✅ **Trinity 홈페이지** (`frontend-trinity` - Next.js)
- ✅ **웹앱** (`frontend` - React)
- ✅ **Ops 포털** (`frontend-ops` - React/Next.js)

---

## 🔧 SDK 설치 방법

### 1. HTML 스크립트 태그 방식 (권장)

토스페이먼츠 SDK v2는 HTML 스크립트 태그로 로드됩니다.

#### Next.js (Trinity)
```tsx
// frontend-trinity/app/layout.tsx
<head>
  <script src="https://js.tosspayments.com/v2" async></script>
</head>
```

#### React (웹앱)
```html
<!-- frontend/public/index.html -->
<head>
  <script src="https://js.tosspayments.com/v2" async></script>
</head>
```

### 2. 환경 변수 설정

#### 백엔드 (Spring Boot)
```bash
# .env.local 또는 시스템 환경 변수
# 테스트 키 (현재 설정됨)
PAYMENT_TOSS_SECRET_KEY=test_sk_ORzdMaqN3w59ZLadepPbr5AkYXQG
PAYMENT_TOSS_WEBHOOK_SECRET=09fb9726652b997b8b7f4fe44782cd08f8cda6bb8ed8af243ebe9248d967ba2c
PAYMENT_TOSS_BASE_URL=https://api.tosspayments.com
PAYMENT_TOSS_SIMULATION_MODE=true

# 운영 키 (상용 오픈 전에 제공 예정)
# PAYMENT_TOSS_SECRET_KEY=live_sk_...
# PAYMENT_TOSS_WEBHOOK_SECRET=...
# PAYMENT_TOSS_SIMULATION_MODE=false
```

#### Trinity (Next.js)
```bash
# frontend-trinity/.env.local
# 테스트 키 (현재 설정됨)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_jExPeJWYVQ56w5kKdmpqV49R5gvN
NEXT_PUBLIC_TOSS_TEST_MODE=true

# 운영 키 (상용 오픈 전에 제공 예정)
# NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_...
# NEXT_PUBLIC_TOSS_TEST_MODE=false
```

#### 웹앱 (React)
```bash
# frontend/.env.local
# 테스트 키 (현재 설정됨)
REACT_APP_TOSS_CLIENT_KEY=test_ck_jExPeJWYVQ56w5kKdmpqV49R5gvN
REACT_APP_TOSS_TEST_MODE=true

# 운영 키 (상용 오픈 전에 제공 예정)
# REACT_APP_TOSS_CLIENT_KEY=live_ck_...
# REACT_APP_TOSS_TEST_MODE=false
```

**참고**: 
- `.env.local.example` 파일을 참고하여 `.env.local` 파일을 생성하세요.
- `.env.local` 파일은 Git에 커밋되지 않습니다 (보안).
- **운영 키는 상용 서비스 오픈 전에 제공됩니다.**

### 3. SDK 초기화

```javascript
// 전역 객체(window)에 TossPayments 함수가 생성됨
const tossPayments = window.TossPayments(clientKey);
```

---

## 📁 공통 유틸리티 구조

### 현재 상태
- ✅ `frontend-trinity/utils/paymentGateway.ts` (TypeScript) - 구현 완료
- ❌ `frontend/src/utils/paymentGateway.js` (JavaScript) - 미구현

### 권장 구조

#### 옵션 1: 공통 패키지 생성 (권장)
```
packages/
  payment-gateway/
    src/
      index.ts          # TypeScript 버전
      index.js          # JavaScript 버전 (컴파일된 결과)
    package.json
```

#### 옵션 2: 각 프로젝트에 복사 (간단)
- `frontend-trinity/utils/paymentGateway.ts` (TypeScript)
- `frontend/src/utils/paymentGateway.js` (JavaScript 변환)
- `frontend-ops/utils/paymentGateway.ts` (TypeScript)

---

## 🔄 웹앱 연동 계획

### Phase 1: SDK 로드 및 초기화 (1일)

1. **HTML에 스크립트 태그 추가**
   ```html
   <!-- frontend/public/index.html -->
   <script src="https://js.tosspayments.com/v2" async></script>
   ```

2. **환경 변수 설정**
   ```env
   # frontend/.env
   REACT_APP_TOSS_CLIENT_KEY=test_ck_...
   ```

3. **유틸리티 파일 생성**
   - `frontend/src/utils/paymentGateway.js` 생성
   - TypeScript 버전을 JavaScript로 변환

### Phase 2: 자동결제(빌링) 등록 구현 (2일)

1. **결제 수단 등록 페이지/컴포넌트**
   - `frontend/src/components/billing/PaymentMethodRegistration.js`
   - `requestBillingAuth()` 사용

2. **콜백 처리**
   - `frontend/src/pages/billing/callback.js`
   - `successUrl`, `failUrl` 처리

3. **기존 결제 컴포넌트 통합**
   - `PaymentConfirmationModal.js` 업데이트
   - `PaymentManagement.js` 업데이트

### Phase 3: 구독 관리 (2일)

1. **구독 생성/수정/취소**
   - `frontend/src/components/billing/SubscriptionManagement.js`

2. **결제 내역 조회**
   - `frontend/src/components/billing/PaymentHistory.js`

---

## 📝 코드 예시

### 웹앱 (React) - JavaScript 버전

```javascript
// frontend/src/utils/paymentGateway.js

/**
 * 토스페이먼츠 SDK 초기화
 */
export function initTossPayments(clientKey) {
  if (typeof window === 'undefined' || !window.TossPayments) {
    throw new Error('TossPayments SDK가 로드되지 않았습니다.');
  }
  return window.TossPayments(clientKey);
}

/**
 * 자동결제(빌링) 등록창 열기
 */
export async function requestBillingAuth({
  clientKey,
  customerKey,
  customerName,
  customerEmail,
  successUrl,
  failUrl,
}) {
  const tossPayments = initTossPayments(clientKey);
  const payment = tossPayments.payment();
  
  await payment.requestBillingAuth({
    method: 'CARD',
    customerKey,
    customerName,
    customerEmail,
    successUrl,
    failUrl,
    windowTarget: 'self',
  });
}
```

### 사용 예시

```javascript
// frontend/src/components/billing/PaymentMethodRegistration.js
import { requestBillingAuth } from '../../utils/paymentGateway';

const handleRegisterPayment = async () => {
  const clientKey = process.env.REACT_APP_TOSS_CLIENT_KEY;
  const customerKey = generateUUID(); // 고객 고유 ID
  
  await requestBillingAuth({
    clientKey,
    customerKey,
    customerName: user.name,
    customerEmail: user.email,
    successUrl: `${window.location.origin}/billing/callback?status=success`,
    failUrl: `${window.location.origin}/billing/callback?status=fail`,
  });
};
```

---

## 🔐 보안 고려사항

1. **클라이언트 키 관리**
   - 테스트 키: 환경 변수에 저장 (현재 설정됨)
   - **운영 키: 상용 서비스 오픈 전에 제공 예정**
   - 프로덕션 키: 환경 변수 또는 설정 서버에서 로드

2. **customerKey 생성**
   - UUID 사용 (예: `uuidv4()`)
   - 이메일, 전화번호 등 유추 가능한 값 사용 금지

3. **콜백 URL 검증**
   - 백엔드에서 `authKey`, `customerKey` 검증
   - 빌링키 발급 API 호출

4. **테스트/운영 환경 전환**
   - 현재: 테스트 키 사용 (`test_ck_...`, `test_sk_...`)
   - 상용 오픈 전: 운영 키로 전환 (`live_ck_...`, `live_sk_...`)
   - `SIMULATION_MODE`를 `false`로 변경 필요

---

## ✅ 체크리스트

### Phase 1: SDK 로드 및 초기화
- [ ] `frontend/public/index.html`에 스크립트 태그 추가
- [ ] 환경 변수 설정 (`REACT_APP_TOSS_CLIENT_KEY`)
- [ ] `frontend/src/utils/paymentGateway.js` 생성
- [ ] SDK 초기화 함수 구현

### Phase 2: 자동결제 등록
- [ ] `PaymentMethodRegistration` 컴포넌트 생성
- [ ] `requestBillingAuth()` 구현
- [ ] 콜백 페이지 생성 (`/billing/callback`)
- [ ] 기존 결제 컴포넌트 통합

### Phase 3: 구독 관리
- [ ] 구독 생성/수정/취소 기능
- [ ] 결제 내역 조회 기능
- [ ] 테스트 및 검증

---

## 📚 참고 자료

- [토스페이먼츠 SDK v2 문서](https://docs.tosspayments.com/sdk/v2/js)
- [자동결제(빌링) 가이드](https://docs.tosspayments.com/guides/v2/billing)
- [API 레퍼런스](https://docs.tosspayments.com/reference)

---

## 🎯 결론

**네, 웹앱에서도 동일한 토스페이먼츠 SDK v2를 사용할 수 있습니다.**

1. **SDK 로드**: HTML 스크립트 태그로 모든 웹앱에 추가
2. **공통 유틸리티**: JavaScript 버전으로 변환하여 웹앱에 적용
3. **동일한 API**: 모든 프로젝트에서 동일한 SDK 메서드 사용

다만, 프로젝트별로 언어가 다를 수 있으므로:
- **TypeScript 프로젝트**: `paymentGateway.ts` 사용
- **JavaScript 프로젝트**: `paymentGateway.js` 사용 (TypeScript에서 변환)

---

**마지막 업데이트**: 2025-11-20

