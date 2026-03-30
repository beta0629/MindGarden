# 마이페이지 테넌트 관리 기능 추가 계획

**작성일**: 2025-11-24  
**목적**: 마이페이지에서 테넌트 관리 (결제, 위젯, 와일드카드 도메인) 기능 추가

---

## 📋 개요

마이페이지에 "테넌트 관리" 섹션을 추가하여 테넌트 관리자가 자신의 테넌트를 관리할 수 있도록 합니다.

**핵심 기능**:
1. **결제 관리**: 결제 수단, PG 설정, 구독 관리
2. **위젯 설정**: 대시보드 위젯 편집
3. **도메인 설정**: 와일드카드 도메인 입력 및 관리

---

## 🎯 사용자 시나리오

### 시나리오 1: 결제 관리
```
1. 마이페이지 접속
2. "테넌트 관리" 탭 선택
3. "결제 관리" 섹션
4. 결제 수단 추가/변경/삭제
5. PG 사 설정 추가/변경/삭제
6. 구독 정보 확인 및 변경
```

### 시나리오 2: 위젯 설정
```
1. 마이페이지 접속
2. "테넌트 관리" 탭 선택
3. "위젯 설정" 섹션
4. 대시보드 위젯 추가/제거/배치
5. 드래그 앤 드롭으로 레이아웃 변경
6. 위젯 설정 저장
```

### 시나리오 3: 와일드카드 도메인 설정
```
1. 마이페이지 접속
2. "테넌트 관리" 탭 선택
3. "도메인 설정" 섹션
4. 와일드카드 도메인 입력 (예: m-garden.co.kr)
5. 서브도메인 확인 (예: {tenant}.m-garden.co.kr)
6. 도메인 설정 저장
7. DNS 설정 안내 표시
```

---

## 🏗️ 구현 계획

### Phase 1: 마이페이지에 테넌트 관리 탭 추가 (1일)

#### 1.1 마이페이지 탭 구조 확장

**파일**: `frontend/src/components/mypage/MyPage.js`

**현재 탭**:
- 프로필 정보
- 설정
- 보안
- 소셜 계정
- 개인정보 동의

**추가 탭**:
- **테넌트 관리** (신규) - 테넌트 관리자만 표시

**구현**:
```javascript
// 테넌트 관리자 여부 확인
const isTenantAdmin = user?.role === 'ADMIN' && user?.tenantId;

// 탭 추가
{isTenantAdmin && (
  <button
    className={`nav-item ${activeTab === 'tenant' ? 'active' : ''}`}
    onClick={() => {
      // 테넌트 관리 접근 시 인증 확인
      if (!isVerified) {
        setShowVerificationModal(true);
      } else {
        setActiveTab('tenant');
      }
    }}
  >
    <Building size={18} />
    테넌트 관리
  </button>
)}
```

#### 1.2 추가 인증 모달 컴포넌트 생성

**파일**: `frontend/src/components/mypage/components/TenantManagementVerificationModal.js`

**기능**:
- 인증 방법 선택 (이메일/휴대폰)
- 인증 코드 발송
- 인증 코드 입력 및 검증
- 인증 성공 시 접근 허용

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
│  [인증하기] [취소]                    │
└─────────────────────────────────────┘
```

#### 1.2 테넌트 관리 섹션 컴포넌트 생성

**파일**: `frontend/src/components/mypage/components/TenantManagementSection.js`

**구조**:
```javascript
const TenantManagementSection = ({ user, tenant }) => {
  const [activeSubTab, setActiveSubTab] = useState('payment');
  
  return (
    <div className="tenant-management-section">
      <div className="tenant-management-tabs">
        <button onClick={() => setActiveSubTab('payment')}>
          결제 관리
        </button>
        <button onClick={() => setActiveSubTab('widgets')}>
          위젯 설정
        </button>
        <button onClick={() => setActiveSubTab('domain')}>
          도메인 설정
        </button>
      </div>
      
      {activeSubTab === 'payment' && <PaymentManagement tenant={tenant} />}
      {activeSubTab === 'widgets' && <WidgetManagement tenant={tenant} />}
      {activeSubTab === 'domain' && <DomainManagement tenant={tenant} />}
    </div>
  );
};
```

---

### Phase 2: 결제 관리 기능 (2일)

#### 2.1 결제 관리 컴포넌트

**파일**: `frontend/src/components/mypage/components/PaymentManagement.js`

**기능**:
- 결제 수단 목록 표시
- 결제 수단 추가/변경/삭제
- PG 사 설정 목록 표시
- PG 사 설정 추가/변경/삭제
- 구독 정보 표시
- 요금제 변경

**UI 구조**:
```
┌─────────────────────────────────────┐
│  결제 관리                            │
├─────────────────────────────────────┤
│  📋 결제 수단                         │
│  ┌─────────────────────────────┐   │
│  │ 카드 ****1234               │   │
│  │ [변경] [삭제]               │   │
│  └─────────────────────────────┘   │
│  [결제 수단 추가]                    │
│                                      │
│  💳 PG 사 설정                        │
│  ┌─────────────────────────────┐   │
│  │ TOSS Payments               │   │
│  │ [변경] [삭제]               │   │
│  └─────────────────────────────┘   │
│  [PG 사 추가]                        │
│                                      │
│  📊 구독 정보                        │
│  현재 요금제: Basic Plan             │
│  [요금제 변경]                       │
└─────────────────────────────────────┘
```

---

### Phase 3: 위젯 설정 기능 (2일)

#### 3.1 위젯 관리 컴포넌트

**파일**: `frontend/src/components/mypage/components/WidgetManagement.js`

**기능**:
- 현재 대시보드 위젯 목록 표시
- 위젯 추가/제거
- 드래그 앤 드롭으로 레이아웃 변경
- 위젯 설정 저장

**UI 구조**:
```
┌─────────────────────────────────────┐
│  위젯 설정                            │
├─────────────────────────────────────┤
│  💡 안내: 위젯을 드래그하여 배치를    │
│     변경할 수 있습니다                 │
│                                      │
│  [사용 가능한 위젯]                   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │통계│ │일정│ │알림│ │결제│      │
│  └────┘ └────┘ └────┘ └────┘      │
│                                      │
│  [현재 대시보드]                      │
│  ┌─────────┐ ┌─────────┐           │
│  │ 환영    │ │ 통계    │           │
│  └─────────┘ └─────────┘           │
│  ┌─────────┐                       │
│  │ 일정    │                       │
│  └─────────┘                       │
│                                      │
│  [저장]                              │
└─────────────────────────────────────┘
```

**참고**: 기존 `DashboardFormModal.js` 재사용 또는 통합

---

### Phase 4: 와일드카드 도메인 설정 기능 (2일)

#### 4.1 도메인 관리 컴포넌트

**파일**: `frontend/src/components/mypage/components/DomainManagement.js`

**기능**:
- 와일드카드 도메인 입력
- 서브도메인 미리보기
- 도메인 유효성 검증
- DNS 설정 안내
- 도메인 설정 저장

**UI 구조**:
```
┌─────────────────────────────────────┐
│  도메인 설정                          │
├─────────────────────────────────────┤
│  💡 안내: 와일드카드 도메인을 입력하면 │
│     {tenant}.도메인 형태로 사용됩니다 │
│                                      │
│  와일드카드 도메인                    │
│  [m-garden.co.kr____________]        │
│                                      │
│  서브도메인 미리보기                  │
│  {tenant}.m-garden.co.kr            │
│  예: abc-consultation.m-garden.co.kr│
│                                      │
│  DNS 설정 안내                        │
│  ┌─────────────────────────────┐   │
│  │ 1. DNS 관리 페이지 접속      │   │
│  │ 2. CNAME 레코드 추가         │   │
│  │    이름: *                   │   │
│  │    값: app.m-garden.co.kr   │   │
│  └─────────────────────────────┘   │
│                                      │
│  [저장]                              │
└─────────────────────────────────────┘
```

#### 4.2 도메인 유효성 검증

**검증 규칙**:
- 도메인 형식 검증 (정규식)
- 중복 도메인 체크
- DNS 설정 가능 여부 확인 (선택적)

**구현**:
```javascript
const validateDomain = (domain) => {
  // 도메인 형식 검증
  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
  if (!domainRegex.test(domain)) {
    return { valid: false, message: '올바른 도메인 형식이 아닙니다.' };
  }
  
  // 중복 체크
  // API 호출하여 중복 확인
  
  return { valid: true };
};
```

#### 4.3 온보딩에도 와일드카드 도메인 입력 추가

**파일**: `frontend-trinity/components/onboarding/Step1BasicInfo.tsx` 또는 새 스텝

**위치**: 기본 정보 입력 단계 또는 별도 스텝

**구현**:
```typescript
// Step 1 또는 새 스텝에 추가
<div className="form-group">
  <label>와일드카드 도메인 (선택사항)</label>
  <input
    type="text"
    value={formData.wildcardDomain}
    onChange={(e) => setFormData({
      ...formData,
      wildcardDomain: e.target.value
    })}
    placeholder="m-garden.co.kr"
  />
  <p className="help-text">
    와일드카드 도메인을 입력하면 {tenant}.도메인 형태로 사용됩니다.
    입력하지 않으면 기본 도메인을 사용합니다.
  </p>
</div>
```

---

## 📝 API 엔드포인트

### 1. 테넌트 정보 조회
```
GET /api/tenant/info
Response: {
  success: boolean,
  data: {
    tenantId: string,
    tenantName: string,
    subdomain: string,
    domain: string,
    wildcardDomain: string | null,
    settings: object
  }
}
```

### 2. 와일드카드 도메인 설정
```
PUT /api/tenant/domain
Body: {
  wildcardDomain: string
}
Response: {
  success: boolean,
  data: {
    wildcardDomain: string,
    fullDomain: string
  }
}
```

### 3. 도메인 중복 체크
```
GET /api/tenant/domain/check?domain={domain}
Response: {
  success: boolean,
  data: {
    available: boolean,
    message: string
  }
}
```

### 4. 결제 수단 관리
```
GET /api/tenant/payment-methods
POST /api/tenant/payment-methods
PUT /api/tenant/payment-methods/{id}
DELETE /api/tenant/payment-methods/{id}
```

### 5. PG 설정 관리
```
GET /api/tenant/pg-configurations
POST /api/tenant/pg-configurations
PUT /api/tenant/pg-configurations/{id}
DELETE /api/tenant/pg-configurations/{id}
```

### 6. 대시보드 위젯 설정
```
GET /api/tenant/dashboards/{role}
PUT /api/tenant/dashboards/{role}
Body: {
  dashboardConfig: object
}
```

---

## 🎨 UI/UX 설계

### 1. 테넌트 관리 탭 디자인

**스타일**:
- 부드러운 파스텔 톤 (사용자 선호도 반영)
- 명확한 섹션 구분
- 직관적인 아이콘 사용

**레이아웃**:
```
┌─────────────────────────────────────┐
│  마이페이지                          │
├─────────────────────────────────────┤
│  [프로필] [설정] [보안] [테넌트 관리] │
├─────────────────────────────────────┤
│  테넌트 관리                          │
│  ┌─────────┬─────────┬─────────┐  │
│  │ 결제관리 │ 위젯설정 │ 도메인설정│  │
│  └─────────┴─────────┴─────────┘  │
│                                      │
│  [컨텐츠 영역]                        │
└─────────────────────────────────────┘
```

### 2. 애니메이션 효과

**효과**:
- 탭 전환 시 페이드 애니메이션
- 위젯 드래그 앤 드롭 시 부드러운 이동
- 저장 시 성공 애니메이션

---

## 📋 구현 TODO

### Phase 1: 마이페이지 탭 추가 및 추가 인증 (2일)
- [ ] `TenantManagementSection.js` 컴포넌트 생성
- [ ] 마이페이지에 "테넌트 관리" 탭 추가
- [ ] 테넌트 관리자 여부 확인 로직
- [ ] `TenantManagementVerificationModal.js` 컴포넌트 생성
- [ ] 이메일 인증 기능 통합
- [ ] 휴대폰 인증 기능 통합
- [ ] 인증 상태 관리 (30분 유지)
- [ ] 인증 실패 처리 (최대 5회)

### Phase 2: 결제 관리 (2일)
- [ ] `PaymentManagement.js` 컴포넌트 생성
- [ ] 결제 수단 목록 표시
- [ ] 결제 수단 추가/변경/삭제
- [ ] PG 사 설정 관리
- [ ] 구독 정보 표시

### Phase 3: 위젯 설정 (2일)
- [ ] `WidgetManagement.js` 컴포넌트 생성
- [ ] 대시보드 위젯 목록 표시
- [ ] 드래그 앤 드롭 레이아웃 편집
- [ ] 위젯 설정 저장

### Phase 4: 와일드카드 도메인 설정 (2일)
- [ ] `DomainManagement.js` 컴포넌트 생성
- [ ] 와일드카드 도메인 입력 UI
- [ ] 도메인 유효성 검증
- [ ] 서브도메인 미리보기
- [ ] DNS 설정 안내
- [ ] 온보딩에 와일드카드 도메인 입력 추가

### Phase 5: 백엔드 API (2일)
- [ ] 테넌트 정보 조회 API
- [ ] 와일드카드 도메인 설정 API
- [ ] 도메인 중복 체크 API
- [ ] 결제/PG/위젯 관리 API

### Phase 6: 통합 및 테스트 (1일)
- [ ] 전체 플로우 통합
- [ ] 테스트 및 버그 수정
- [ ] 문서화

---

## 🔐 보안 고려사항

### 1. 추가 인증 (2단계 인증) ⭐⭐⭐

**목적**: 민감한 정보(결제, PG 설정, 도메인) 접근 시 보안 강화

**인증 방법**:
- **휴대폰 인증** (SMS 인증 코드)
- **이메일 인증** (이메일 인증 코드)

**인증 시점**:
- 테넌트 관리 탭 접근 시
- 결제 관리, 위젯 설정, 도메인 설정 각 섹션 접근 시
- 인증 후 일정 시간(예: 30분) 동안 유지

**구현**:
```javascript
// 테넌트 관리 접근 시 인증 모달 표시
const [showVerificationModal, setShowVerificationModal] = useState(false);
const [verificationMethod, setVerificationMethod] = useState('email'); // 'email' | 'phone'
const [isVerified, setIsVerified] = useState(false);
const [verificationExpiry, setVerificationExpiry] = useState(null);

// 인증 만료 시간 체크 (30분)
useEffect(() => {
  if (verificationExpiry && Date.now() > verificationExpiry) {
    setIsVerified(false);
    setShowVerificationModal(true);
  }
}, [verificationExpiry]);
```

**인증 플로우**:
```
1. 테넌트 관리 탭 클릭
2. 인증 방법 선택 (이메일/휴대폰)
3. 인증 코드 발송
4. 인증 코드 입력
5. 인증 성공 시 접근 허용 (30분 유지)
6. 인증 실패 시 재시도 (최대 5회)
```

### 2. 권한 체크
- 테넌트 관리자만 접근 가능
- 다른 테넌트 정보 접근 불가
- 세션 기반 인증
- **추가 인증 필수** (2단계 인증)

### 3. 데이터 검증
- 도메인 형식 검증
- PG 설정 정보 암호화 저장
- 결제 정보 보안 처리
- 인증 코드 유효성 검증

### 4. DNS 설정 안내
- 사용자가 직접 DNS 설정하도록 안내
- 자동 설정은 운영팀 승인 후 진행

### 5. 보안 로깅
- 테넌트 관리 접근 로그
- 인증 시도 로그 (성공/실패)
- 민감한 정보 변경 로그

---

## 📚 참고 문서

- `ONBOARDING_VS_CORE_SOLUTION_ROLES.md`
- `ONBOARDING_DASHBOARD_SETUP_PLAN.md`
- `DASHBOARD_WIDGET_EDITOR_PLAN.md`
- `WIDGET_CONFIGURATION_GUIDE.md`

---

---

## 🔒 추가 인증 상세 설계

### 인증 모달 컴포넌트

**파일**: `frontend/src/components/mypage/components/TenantManagementVerificationModal.js`

**상태 관리**:
```javascript
const [verificationMethod, setVerificationMethod] = useState('email');
const [phoneNumber, setPhoneNumber] = useState('');
const [email, setEmail] = useState('');
const [verificationCode, setVerificationCode] = useState('');
const [codeSent, setCodeSent] = useState(false);
const [codeSending, setCodeSending] = useState(false);
const [verifying, setVerifying] = useState(false);
const [verificationAttempts, setVerificationAttempts] = useState(0);
const [timeLeft, setTimeLeft] = useState(null);
```

**인증 코드 발송**:
```javascript
const handleSendCode = async () => {
  try {
    setCodeSending(true);
    if (verificationMethod === 'email') {
      await sendEmailVerificationCode(email);
    } else {
      await sendSmsVerificationCode(phoneNumber);
    }
    setCodeSent(true);
    setTimeLeft(600); // 10분
  } catch (err) {
    notificationManager.error('인증 코드 발송에 실패했습니다.');
  } finally {
    setCodeSending(false);
  }
};
```

**인증 코드 검증**:
```javascript
const handleVerifyCode = async () => {
  try {
    setVerifying(true);
    let verified = false;
    
    if (verificationMethod === 'email') {
      verified = await verifyEmailCode(email, verificationCode);
    } else {
      verified = await verifySmsCode(phoneNumber, verificationCode);
    }
    
    if (verified) {
      setIsVerified(true);
      setVerificationExpiry(Date.now() + 30 * 60 * 1000); // 30분
      setShowVerificationModal(false);
      onVerificationSuccess();
    } else {
      setVerificationAttempts(prev => prev + 1);
      if (verificationAttempts >= 4) {
        notificationManager.error('인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.');
        setShowVerificationModal(false);
      } else {
        notificationManager.error('인증 코드가 올바르지 않습니다.');
      }
    }
  } catch (err) {
    notificationManager.error('인증에 실패했습니다.');
  } finally {
    setVerifying(false);
  }
};
```

### 인증 상태 관리

**파일**: `frontend/src/components/mypage/MyPage.js`

**인증 상태 저장**:
```javascript
// 세션 스토리지에 인증 상태 저장 (페이지 새로고침 시 유지)
const saveVerificationState = (expiry) => {
  sessionStorage.setItem('tenant_management_verified', expiry.toString());
};

const loadVerificationState = () => {
  const saved = sessionStorage.getItem('tenant_management_verified');
  if (saved) {
    const expiry = parseInt(saved);
    if (Date.now() < expiry) {
      setIsVerified(true);
      setVerificationExpiry(expiry);
      return true;
    }
  }
  return false;
};
```

### API 엔드포인트

#### 1. 이메일 인증 코드 발송
```
POST /api/auth/email/verification-code
Body: {
  email: string
}
```

#### 2. 이메일 인증 코드 검증
```
POST /api/auth/email/verify-code
Body: {
  email: string,
  code: string
}
```

#### 3. SMS 인증 코드 발송
```
POST /api/auth/sms/send-code
Body: {
  phoneNumber: string
}
```

#### 4. SMS 인증 코드 검증
```
POST /api/auth/sms/verify-code
Body: {
  phoneNumber: string,
  code: string
}
```

### 보안 로깅

**백엔드에서 로깅**:
- 테넌트 관리 접근 시도
- 인증 코드 발송
- 인증 성공/실패
- 민감한 정보 변경 (결제, PG, 도메인)

**로그 항목**:
```java
log.info("테넌트 관리 접근 시도: userId={}, tenantId={}, method={}", 
    userId, tenantId, verificationMethod);
log.info("인증 코드 발송: userId={}, method={}, target={}", 
    userId, verificationMethod, target);
log.info("인증 성공: userId={}, tenantId={}, method={}", 
    userId, tenantId, verificationMethod);
log.warn("인증 실패: userId={}, tenantId={}, attempts={}", 
    userId, tenantId, attempts);
```

---

**작성자**: 개발팀  
**예상 완료일**: 2025-12-07 (12일, 추가 인증 포함)  
**우선순위**: 높음 (테넌트 관리 기능 강화 + 보안 강화)

