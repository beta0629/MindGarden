# 온보딩 로그인 기능 추가 계획

**작성일**: 2025-11-24  
**목적**: 온보딩 플로우에 로그인 기능 통합

---

## 📋 개요

온보딩 플로우에 로그인 기능을 추가하여 사용자가 온보딩 요청 상태를 확인하고, 진행 중인 온보딩을 이어서 완료할 수 있도록 합니다.

**핵심 목표**:
- 온보딩 요청 상태 자동 조회
- 온보딩 진행 중 세션 유지
- 온보딩 완료 후 바로 테넌트 관리 페이지로 이동
- 온보딩 요청 수정 (승인 전까지)

---

## 🎯 사용자 시나리오

### 시나리오 1: 로그인 후 온보딩 시작
```
1. 사용자가 Trinity 홈페이지 접속
2. "온보딩 신청" 클릭
3. 로그인 화면 표시 (선택적)
   - "로그인하고 시작하기" 버튼
   - "로그인 없이 시작하기" 버튼
4. 로그인 선택 시:
   - 이메일/비밀번호 입력
   - 로그인 성공
   - 기존 온보딩 요청이 있으면 상태 표시
   - 새 온보딩 요청 시작 또는 기존 요청 이어서 진행
```

### 시나리오 2: 온보딩 진행 중 로그인
```
1. 사용자가 로그인 없이 온보딩 시작
2. Step 3 (요금제 선택)까지 진행
3. 브라우저를 닫거나 세션 만료
4. 나중에 다시 접속
5. 로그인 화면 표시
6. 로그인 후:
   - 진행 중인 온보딩 요청 자동 조회
   - 마지막 진행 단계부터 이어서 진행 가능
```

### 시나리오 3: 온보딩 완료 후 상태 확인
```
1. 사용자가 온보딩 요청 제출
2. 승인 대기 중
3. 나중에 로그인하여 상태 확인
4. 승인 완료 시:
   - "테넌트 관리 페이지로 이동" 버튼 표시
   - 클릭 시 바로 테넌트 관리 페이지로 이동
```

### 시나리오 4: 온보딩 요청 수정
```
1. 사용자가 온보딩 요청 제출 (PENDING 상태)
2. 로그인하여 온보딩 상태 확인
3. "요청 수정" 버튼 클릭
4. 온보딩 플로우로 돌아가서 수정 가능
```

---

## 🏗️ 구현 계획

### Phase 1: 온보딩 시작 전 로그인 옵션 (2일)

#### 1.1 온보딩 진입점에 로그인 옵션 추가

**위치**: `frontend-trinity/app/onboarding/page.tsx`

**기능**:
- 온보딩 페이지 진입 시 로그인 상태 확인
- 로그인되지 않은 경우 로그인 옵션 제공
- 로그인한 경우 기존 온보딩 요청 상태 확인

**UI 구조**:
```
┌─────────────────────────────────────┐
│  서비스 신청                          │
├─────────────────────────────────────┤
│  💡 안내: 로그인하면 진행 중인 신청을   │
│     확인하고 이어서 진행할 수 있습니다 │
│                                      │
│  [로그인하고 시작하기]                │
│  [로그인 없이 시작하기]               │
└─────────────────────────────────────┘
```

**구현**:
```typescript
// 온보딩 페이지 진입 시
const [showLoginOption, setShowLoginOption] = useState(false);
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [existingRequest, setExistingRequest] = useState<OnboardingRequest | null>(null);

useEffect(() => {
  checkAuthStatus();
}, []);

const checkAuthStatus = async () => {
  try {
    const response = await apiGet('/api/auth/current-user');
    if (response.success && response.data) {
      setIsLoggedIn(true);
      // 기존 온보딩 요청 조회
      await loadExistingOnboardingRequest(response.data.email);
    } else {
      setShowLoginOption(true);
    }
  } catch (err) {
    setShowLoginOption(true);
  }
};
```

#### 1.2 로그인 컴포넌트 생성

**파일**: `frontend-trinity/components/onboarding/OnboardingLogin.tsx`

**기능**:
- 이메일/비밀번호 로그인
- 로그인 성공 후 온보딩 요청 상태 확인
- 기존 요청이 있으면 상태 표시 및 선택 옵션

**구조**:
```typescript
interface OnboardingLoginProps {
  onLoginSuccess: (user: User) => void;
  onSkipLogin: () => void;
}

const OnboardingLogin: React.FC<OnboardingLoginProps> = ({
  onLoginSuccess,
  onSkipLogin
}) => {
  // 로그인 처리
  // 기존 온보딩 요청 조회
  // 상태 표시 및 선택 옵션
};
```

---

### Phase 2: 온보딩 진행 중 로그인 (2일)

#### 2.1 온보딩 진행 상태 저장

**기능**:
- 각 단계 완료 시 진행 상태 저장
- 로그인하지 않은 경우 임시 저장 (localStorage)
- 로그인한 경우 서버에 저장

**구현**:
```typescript
// 온보딩 진행 상태 저장
const saveOnboardingProgress = async (step: number, formData: OnboardingFormData) => {
  if (isLoggedIn) {
    // 서버에 저장
    await apiPost('/api/onboarding/progress', {
      step,
      formData
    });
  } else {
    // localStorage에 임시 저장
    localStorage.setItem('onboarding_progress', JSON.stringify({
      step,
      formData,
      timestamp: Date.now()
    }));
  }
};
```

#### 2.2 온보딩 진행 상태 복원

**기능**:
- 로그인 후 진행 상태 자동 복원
- 마지막 진행 단계부터 이어서 진행

**구현**:
```typescript
// 온보딩 진행 상태 복원
const restoreOnboardingProgress = async () => {
  if (isLoggedIn) {
    // 서버에서 진행 상태 조회
    const progress = await apiGet('/api/onboarding/progress');
    if (progress.success && progress.data) {
      setStep(progress.data.step);
      setFormData(progress.data.formData);
    }
  } else {
    // localStorage에서 임시 저장된 진행 상태 복원
    const savedProgress = localStorage.getItem('onboarding_progress');
    if (savedProgress) {
      const { step, formData, timestamp } = JSON.parse(savedProgress);
      // 24시간 이내인 경우만 복원
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        setStep(step);
        setFormData(formData);
      }
    }
  }
};
```

---

### Phase 3: 온보딩 상태 확인 및 수정 (2일)

#### 3.1 온보딩 상태 확인 UI

**위치**: `frontend-trinity/app/onboarding/status/page.tsx` (확장)

**기능**:
- 로그인한 사용자의 온보딩 요청 자동 조회
- 상태별 표시 (PENDING, APPROVED, REJECTED, ON_HOLD)
- 승인 완료 시 "테넌트 관리 페이지로 이동" 버튼
- PENDING 상태일 때 "요청 수정" 버튼

**UI 구조**:
```
┌─────────────────────────────────────┐
│  온보딩 상태 확인                     │
├─────────────────────────────────────┤
│  📋 내 온보딩 요청                    │
│                                      │
│  [요청 1]                            │
│  상태: 승인 대기 중                   │
│  요청일: 2025-11-24                  │
│  [요청 수정] [상세 보기]              │
│                                      │
│  [요청 2]                            │
│  상태: 승인 완료 ✅                   │
│  승인일: 2025-11-25                  │
│  [테넌트 관리 페이지로 이동]          │
└─────────────────────────────────────┘
```

#### 3.2 온보딩 요청 수정 기능

**기능**:
- PENDING 상태인 온보딩 요청만 수정 가능
- 온보딩 플로우로 돌아가서 수정
- 기존 입력값 자동 채우기

**구현**:
```typescript
const handleEditRequest = (requestId: number) => {
  // 온보딩 요청 상세 조회
  const request = await getOnboardingRequest(requestId);
  
  // 폼 데이터 복원
  setFormData({
    tenantName: request.tenantName,
    businessType: request.businessType,
    contactEmail: request.contactEmail,
    // ... 기타 필드
  });
  
  // 온보딩 플로우로 이동 (마지막 단계부터)
  setStep(getLastCompletedStep(request));
  router.push('/onboarding');
};
```

---

### Phase 4: 온보딩 완료 후 자동 이동 (1일)

#### 4.1 승인 완료 시 자동 이동

**기능**:
- 온보딩 승인 완료 시 알림 표시
- "테넌트 관리 페이지로 이동" 버튼
- 클릭 시 테넌트 관리 페이지로 자동 이동

**구현**:
```typescript
const handleGoToTenantDashboard = async () => {
  // 테넌트 관리 페이지로 이동
  // 로그인 상태 확인
  // 테넌트 정보 조회
  // 대시보드로 리다이렉트
  router.push(`/tenant/dashboard?tenantId=${tenantId}`);
};
```

---

## 📝 API 엔드포인트

### 1. 온보딩 진행 상태 저장
```
POST /api/onboarding/progress
Body: {
  step: number,
  formData: OnboardingFormData
}
```

### 2. 온보딩 진행 상태 조회
```
GET /api/onboarding/progress
Response: {
  success: boolean,
  data: {
    step: number,
    formData: OnboardingFormData,
    lastUpdated: string
  }
}
```

### 3. 사용자별 온보딩 요청 목록 조회
```
GET /api/onboarding/requests/my
Response: {
  success: boolean,
  data: OnboardingRequest[]
}
```

### 4. 온보딩 요청 수정
```
PUT /api/onboarding/requests/{id}
Body: {
  tenantName: string,
  businessType: string,
  // ... 기타 필드
}
```

---

## 🎨 UI/UX 설계

### 1. 로그인 옵션 화면

**디자인**:
- 부드러운 파스텔 톤 (사용자 선호도 반영)
- 명확한 안내 메시지
- 애니메이션 효과 (페이드 인)

**레이아웃**:
```
┌─────────────────────────────────────┐
│  서비스 신청                          │
├─────────────────────────────────────┤
│  💡 로그인하면 진행 중인 신청을        │
│     확인하고 이어서 진행할 수 있습니다 │
│                                      │
│  ┌─────────────────────────────┐   │
│  │  이메일                      │   │
│  │  [________________]         │   │
│  │                              │   │
│  │  비밀번호                    │   │
│  │  [________________]         │   │
│  │                              │   │
│  │  [로그인하고 시작하기]        │   │
│  └─────────────────────────────┘   │
│                                      │
│  [로그인 없이 시작하기]               │
└─────────────────────────────────────┘
```

### 2. 온보딩 상태 확인 화면

**디자인**:
- 상태별 색상 구분
- 진행 상태 표시 (프로그레스 바)
- 명확한 액션 버튼

**레이아웃**:
```
┌─────────────────────────────────────┐
│  내 온보딩 요청                       │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │  테넌트명: ABC 상담소         │   │
│  │  상태: 승인 대기 중 ⏳        │   │
│  │  요청일: 2025-11-24          │   │
│  │                              │   │
│  │  [요청 수정] [상세 보기]      │   │
│  └─────────────────────────────┘   │
│                                      │
│  ┌─────────────────────────────┐   │
│  │  테넌트명: XYZ 학원           │   │
│  │  상태: 승인 완료 ✅           │   │
│  │  승인일: 2025-11-25          │   │
│  │                              │   │
│  │  [테넌트 관리 페이지로 이동]  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## 📋 구현 TODO

### Phase 1: 로그인 옵션 추가 (2일)
- [ ] `OnboardingLogin.tsx` 컴포넌트 생성
- [ ] 온보딩 페이지 진입 시 로그인 상태 확인
- [ ] 로그인 옵션 UI 구현
- [ ] 기존 온보딩 요청 조회 기능

### Phase 2: 진행 상태 저장/복원 (2일)
- [ ] 온보딩 진행 상태 저장 기능
- [ ] localStorage 임시 저장 기능
- [ ] 서버 진행 상태 저장 API
- [ ] 진행 상태 복원 기능

### Phase 3: 상태 확인 및 수정 (2일)
- [ ] 온보딩 상태 확인 UI 확장
- [ ] 사용자별 온보딩 요청 목록 조회
- [ ] 온보딩 요청 수정 기능
- [ ] 승인 완료 시 자동 이동 기능

### Phase 4: 통합 및 테스트 (1일)
- [ ] 전체 플로우 통합
- [ ] 테스트 및 버그 수정
- [ ] 문서화

---

## 🎯 사용자 플로우

### 플로우 1: 로그인 후 온보딩
```
1. Trinity 홈페이지 접속
2. "온보딩 신청" 클릭
3. 로그인 화면 표시
4. 로그인 성공
5. 기존 온보딩 요청 확인
   - 있으면: 상태 표시 및 선택
   - 없으면: 새 온보딩 시작
6. 온보딩 진행 (세션 유지)
7. 온보딩 완료
8. 승인 대기
9. 승인 완료 시 테넌트 관리 페이지로 이동
```

### 플로우 2: 로그인 없이 온보딩
```
1. Trinity 홈페이지 접속
2. "온보딩 신청" 클릭
3. "로그인 없이 시작하기" 선택
4. 온보딩 진행 (localStorage 임시 저장)
5. 온보딩 완료
6. 나중에 로그인하여 상태 확인
7. 승인 완료 시 테넌트 관리 페이지로 이동
```

### 플로우 3: 온보딩 요청 수정
```
1. 로그인하여 온보딩 상태 확인
2. PENDING 상태인 요청 선택
3. "요청 수정" 클릭
4. 온보딩 플로우로 돌아가서 수정
5. 수정 완료 후 재제출
```

---

## 🔐 보안 고려사항

### 1. 인증 및 권한
- 로그인한 사용자만 자신의 온보딩 요청 조회 가능
- 온보딩 요청 수정은 PENDING 상태일 때만 가능
- 승인 완료 후에는 수정 불가

### 2. 세션 관리
- 온보딩 진행 상태는 세션 기반으로 저장
- localStorage 임시 저장은 24시간 제한
- 로그인 후 서버 저장으로 전환

### 3. 데이터 보호
- 온보딩 요청 정보는 암호화하여 전송
- 개인정보는 최소화하여 저장

---

## 📚 참고 문서

- `ONBOARDING_VS_CORE_SOLUTION_ROLES.md`
- `ONBOARDING_DASHBOARD_SETUP_PLAN.md`
- `ONBOARDING_REGISTRATION_PLAN.md`

---

**작성자**: 개발팀  
**예상 완료일**: 2025-11-30 (7일)  
**우선순위**: 높음 (온보딩 UX 개선)

