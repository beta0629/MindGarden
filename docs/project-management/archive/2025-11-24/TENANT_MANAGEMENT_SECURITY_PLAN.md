# 테넌트 관리 보안 강화 계획

**작성일**: 2025-11-24  
**목적**: 마이페이지 테넌트 관리 기능에 추가 인증(2단계 인증) 적용

---

## 📋 개요

마이페이지의 테넌트 관리 기능(결제, 위젯, 도메인 설정)은 민감한 정보를 다루므로, 기본 로그인 외에 **추가 인증(2단계 인증)**을 필수로 적용합니다.

**보안 목표**:
- 무단 접근 방지
- 민감한 정보 보호
- 보안 사고 대응 강화

---

## 🔒 보안 요구사항

### 1. 추가 인증 필수

**대상 기능**:
- 결제 관리 (결제 수단, PG 설정)
- 위젯 설정 (대시보드 위젯 편집)
- 도메인 설정 (와일드카드 도메인)

**인증 방법**:
- ✅ **이메일 인증** (이메일 인증 코드)
- ✅ **휴대폰 인증** (SMS 인증 코드)

**인증 시점**:
- 테넌트 관리 탭 접근 시
- 각 섹션(결제/위젯/도메인) 접근 시
- 인증 만료 후 재접근 시

**인증 유지 시간**:
- 인증 성공 후 **30분** 동안 유지
- 페이지 새로고침 시에도 유지 (세션 스토리지 사용)

---

## 🏗️ 구현 계획

### Phase 1: 추가 인증 모달 컴포넌트 (2일)

#### 1.1 인증 모달 컴포넌트 생성

**파일**: `frontend/src/components/mypage/components/TenantManagementVerificationModal.js`

**기능**:
- 인증 방법 선택 (이메일/휴대폰)
- 인증 코드 발송
- 인증 코드 입력 및 검증
- 인증 성공/실패 처리

**UI 구조**:
```
┌─────────────────────────────────────┐
│  테넌트 관리 접근 인증                │
├─────────────────────────────────────┤
│  🔒 보안을 위해 추가 인증이 필요합니다 │
│                                      │
│  인증 방법 선택                       │
│  ○ 이메일 인증                       │
│  ● 휴대폰 인증                       │
│                                      │
│  휴대폰 번호                          │
│  [010-1234-5678____________]        │
│  [인증 코드 발송]                     │
│                                      │
│  인증 코드                            │
│  [______]                            │
│                                      │
│  ⏱️ 남은 시간: 9:45                  │
│                                      │
│  [인증하기] [취소]                    │
└─────────────────────────────────────┘
```

#### 1.2 인증 상태 관리

**파일**: `frontend/src/components/mypage/MyPage.js`

**상태 관리**:
```javascript
const [isVerified, setIsVerified] = useState(false);
const [verificationExpiry, setVerificationExpiry] = useState(null);
const [showVerificationModal, setShowVerificationModal] = useState(false);

// 세션 스토리지에서 인증 상태 복원
useEffect(() => {
  const saved = sessionStorage.getItem('tenant_management_verified');
  if (saved) {
    const expiry = parseInt(saved);
    if (Date.now() < expiry) {
      setIsVerified(true);
      setVerificationExpiry(expiry);
    }
  }
}, []);

// 인증 만료 체크
useEffect(() => {
  if (verificationExpiry && Date.now() > verificationExpiry) {
    setIsVerified(false);
    setVerificationExpiry(null);
    sessionStorage.removeItem('tenant_management_verified');
  }
}, [verificationExpiry]);
```

---

### Phase 2: 이메일 인증 통합 (1일)

#### 2.1 이메일 인증 API 연동

**기존 API 활용**:
- `POST /api/auth/email/verification-code` (인증 코드 발송)
- `POST /api/auth/email/verify-code` (인증 코드 검증)

**구현**:
```javascript
const sendEmailVerificationCode = async (email) => {
  const response = await fetch('/api/auth/email/verification-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('인증 코드 발송에 실패했습니다.');
  }
  
  return await response.json();
};

const verifyEmailCode = async (email, code) => {
  const response = await fetch('/api/auth/email/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('인증 코드가 올바르지 않습니다.');
  }
  
  const data = await response.json();
  return data.success;
};
```

---

### Phase 3: 휴대폰 인증 통합 (1일)

#### 3.1 SMS 인증 API 연동

**기존 API 활용**:
- `POST /api/auth/sms/send-code` (인증 코드 발송)
- `POST /api/auth/sms/verify-code` (인증 코드 검증)

**구현**:
```javascript
const sendSmsVerificationCode = async (phoneNumber) => {
  const response = await fetch('/api/auth/sms/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('인증 코드 발송에 실패했습니다.');
  }
  
  return await response.json();
};

const verifySmsCode = async (phoneNumber, code) => {
  const response = await fetch('/api/auth/sms/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, code }),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('인증 코드가 올바르지 않습니다.');
  }
  
  const data = await response.json();
  return data.success;
};
```

---

### Phase 4: 인증 실패 처리 (1일)

#### 4.1 시도 횟수 제한

**규칙**:
- 최대 5회 시도
- 5회 실패 시 잠시 후 재시도 안내
- 1시간 후 재시도 가능

**구현**:
```javascript
const [verificationAttempts, setVerificationAttempts] = useState(0);
const [isBlocked, setIsBlocked] = useState(false);
const [blockUntil, setBlockUntil] = useState(null);

const handleVerifyCode = async () => {
  if (isBlocked) {
    const remaining = Math.ceil((blockUntil - Date.now()) / 1000 / 60);
    notificationManager.error(`인증 시도가 제한되었습니다. ${remaining}분 후 다시 시도해주세요.`);
    return;
  }
  
  try {
    const verified = await verifyCode();
    
    if (verified) {
      // 인증 성공
      setIsVerified(true);
      setVerificationExpiry(Date.now() + 30 * 60 * 1000);
      sessionStorage.setItem('tenant_management_verified', 
        (Date.now() + 30 * 60 * 1000).toString());
      setShowVerificationModal(false);
      setVerificationAttempts(0);
    } else {
      // 인증 실패
      const newAttempts = verificationAttempts + 1;
      setVerificationAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        setIsBlocked(true);
        setBlockUntil(Date.now() + 60 * 60 * 1000); // 1시간
        notificationManager.error('인증 시도 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.');
      } else {
        notificationManager.error(`인증 코드가 올바르지 않습니다. (${newAttempts}/5)`);
      }
    }
  } catch (err) {
    notificationManager.error('인증에 실패했습니다.');
  }
};
```

---

### Phase 5: 보안 로깅 (1일)

#### 5.1 접근 로그

**백엔드에서 로깅**:
- 테넌트 관리 접근 시도
- 인증 코드 발송
- 인증 성공/실패
- 인증 시도 횟수

**구현**:
```java
@PostMapping("/tenant/management/verify")
public ResponseEntity<ApiResponse<Map<String, Object>>> verifyAccess(
    @RequestBody VerificationRequest request) {
    
    String userId = getCurrentUserId();
    String tenantId = getCurrentTenantId();
    String method = request.getMethod(); // 'email' or 'phone'
    
    // 접근 시도 로그
    log.info("테넌트 관리 접근 시도: userId={}, tenantId={}, method={}", 
        userId, tenantId, method);
    
    // 인증 코드 발송
    if (request.isSendCode()) {
        log.info("인증 코드 발송: userId={}, method={}, target={}", 
            userId, method, request.getTarget());
        // ... 인증 코드 발송 로직
    }
    
    // 인증 코드 검증
    if (request.isVerifyCode()) {
        boolean verified = verifyCode(request);
        if (verified) {
            log.info("인증 성공: userId={}, tenantId={}, method={}", 
                userId, tenantId, method);
        } else {
            log.warn("인증 실패: userId={}, tenantId={}, method={}, attempts={}", 
                userId, tenantId, method, getAttemptCount(userId));
        }
    }
    
    // ...
}
```

---

## 📝 API 엔드포인트

### 1. 테넌트 관리 접근 인증

```
POST /api/tenant/management/verify
Body: {
  method: 'email' | 'phone',
  target: string, // 이메일 또는 휴대폰 번호
  action: 'send-code' | 'verify-code',
  code?: string // verify-code일 때만
}
Response: {
  success: boolean,
  data: {
    verified: boolean,
    expiresAt: number, // 인증 만료 시간 (timestamp)
    attemptsRemaining: number
  }
}
```

### 2. 인증 상태 확인

```
GET /api/tenant/management/verification-status
Response: {
  success: boolean,
  data: {
    isVerified: boolean,
    expiresAt: number | null,
    method: 'email' | 'phone' | null
  }
}
```

---

## 🎨 UI/UX 설계

### 1. 인증 모달 디자인

**스타일**:
- 부드러운 파스텔 톤
- 명확한 안내 메시지
- 직관적인 입력 필드

**애니메이션**:
- 모달 등장 시 페이드 인
- 인증 성공 시 체크 애니메이션
- 인증 실패 시 경고 애니메이션

### 2. 인증 상태 표시

**인증 완료 시**:
- 테넌트 관리 탭에 "인증됨" 표시
- 인증 만료 시간 표시 (선택적)

**인증 만료 시**:
- 자동으로 인증 모달 표시
- "인증이 만료되었습니다" 메시지

---

## 📋 구현 TODO

### Phase 1: 추가 인증 모달 (2일)
- [ ] `TenantManagementVerificationModal.js` 컴포넌트 생성
- [ ] 인증 방법 선택 UI
- [ ] 인증 코드 입력 UI
- [ ] 타이머 표시 (10분)

### Phase 2: 이메일 인증 통합 (1일)
- [ ] 이메일 인증 API 연동
- [ ] 이메일 인증 코드 발송
- [ ] 이메일 인증 코드 검증

### Phase 3: 휴대폰 인증 통합 (1일)
- [ ] SMS 인증 API 연동
- [ ] SMS 인증 코드 발송
- [ ] SMS 인증 코드 검증

### Phase 4: 인증 실패 처리 (1일)
- [ ] 시도 횟수 제한 (5회)
- [ ] 차단 시간 설정 (1시간)
- [ ] 재시도 안내 메시지

### Phase 5: 보안 로깅 (1일)
- [ ] 접근 시도 로그
- [ ] 인증 성공/실패 로그
- [ ] 시도 횟수 로그

### Phase 6: 통합 및 테스트 (1일)
- [ ] 전체 플로우 통합
- [ ] 테스트 및 버그 수정
- [ ] 문서화

---

## 🔐 보안 체크리스트

- [ ] 추가 인증 필수 적용
- [ ] 인증 코드 유효 시간 제한 (10분)
- [ ] 인증 성공 후 유지 시간 제한 (30분)
- [ ] 시도 횟수 제한 (5회)
- [ ] 차단 시간 설정 (1시간)
- [ ] 세션 스토리지 사용 (페이지 새로고침 시 유지)
- [ ] 보안 로깅 적용
- [ ] 민감한 정보 암호화 저장
- [ ] HTTPS 필수
- [ ] CSRF 토큰 검증

---

**작성자**: 개발팀  
**예상 완료일**: 2025-12-01 (7일)  
**우선순위**: 높음 (보안 강화)

