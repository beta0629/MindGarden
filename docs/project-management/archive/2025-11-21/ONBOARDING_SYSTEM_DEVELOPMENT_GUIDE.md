# 온보딩 시스템 개발 가이드

**작성일**: 2025-11-21  
**버전**: 1.0.0  
**상태**: 활성

---

## 📋 목차

1. [개요](#개요)
2. [핵심 원칙](#핵심-원칙)
3. [백엔드 개발 규칙](#백엔드-개발-규칙)
4. [프론트엔드 개발 규칙](#프론트엔드-개발-규칙)
5. [공통 코드 사용 가이드](#공통-코드-사용-가이드)
6. [체크리스트](#체크리스트)

---

## 개요

온보딩 시스템은 CoreSolution 플랫폼의 핵심 기능 중 하나입니다. 이 문서는 온보딩 시스템 개발 시 반드시 준수해야 할 규칙과 가이드라인을 정의합니다.

### 주요 목표

1. **하드코딩 완전 제거**: 모든 값은 동적으로 관리
2. **CSS 변수 상수화**: 인라인 스타일 금지, CSS 변수 사용
3. **비즈니스 로직 분리**: UI 컴포넌트와 비즈니스 로직 분리
4. **공통 코드 연동**: 백엔드는 무조건 동적 DB 코드 연동

---

## 핵심 원칙

### 1. 하드코딩 금지 원칙

**절대 하드코딩하지 말 것:**

- ❌ 문자열 하드코딩: `"CONSULTATION"`, `"PENDING"`, `"APPROVED"` 등
- ❌ 숫자 하드코딩: `1`, `2`, `3` (매직 넘버)
- ❌ 색상 하드코딩: `"#ff0000"`, `"#28a745"` 등
- ❌ URL 하드코딩: `"/api/v1/onboarding"` 등
- ❌ 에러 메시지 하드코딩: `"오류가 발생했습니다"` 등

**대신 사용할 것:**

- ✅ 공통 코드 (CommonCode) 사용
- ✅ 상수 파일에 정의
- ✅ CSS 변수 사용
- ✅ 환경 변수 사용
- ✅ 상수 클래스/파일 사용

### 2. CSS 변수 상수화 원칙

**절대 인라인 스타일 사용 금지:**

```tsx
// ❌ 잘못된 예시
<div style={{ color: '#ff0000', marginTop: '8px' }}>
  에러 메시지
</div>

// ✅ 올바른 예시
<div className={COMPONENT_CSS.ONBOARDING.ERROR}>
  에러 메시지
</div>
```

**CSS 변수는 상수 파일에 정의:**

```typescript
// constants/css-variables.ts
export const CSS_VARIABLES = {
  COLORS: {
    ERROR: '#ff0000',
    SUCCESS: '#28a745',
    // ...
  },
  SPACING: {
    XS: '0.25rem',
    SM: '0.5rem',
    // ...
  },
};
```

### 3. 비즈니스 로직 분리 원칙

**컴포넌트는 UI만 담당:**

```tsx
// ❌ 잘못된 예시 (비즈니스 로직이 컴포넌트에 포함)
const OnboardingPage = () => {
  const handleSubmit = async () => {
    // 복잡한 비즈니스 로직이 컴포넌트에 포함됨
    const validation = validateEmail(email);
    if (!validation.valid) {
      // ...
    }
    // ...
  };
};

// ✅ 올바른 예시 (비즈니스 로직 분리)
// hooks/useOnboarding.ts
export const useOnboarding = () => {
  const validateEmail = (email: string) => {
    // 비즈니스 로직
  };
  
  const submitOnboarding = async (data: OnboardingData) => {
    // 비즈니스 로직
  };
  
  return { validateEmail, submitOnboarding };
};

// components/OnboardingPage.tsx
const OnboardingPage = () => {
  const { validateEmail, submitOnboarding } = useOnboarding();
  // UI만 담당
};
```

---

## 백엔드 개발 규칙

### 1. 공통 코드 사용 필수

**모든 코드 값은 공통 코드에서 동적으로 조회:**

```java
// ❌ 잘못된 예시
String businessType = "CONSULTATION"; // 하드코딩
if (status == OnboardingStatus.APPROVED) { // Enum 하드코딩
    // ...
}

// ✅ 올바른 예시
@Service
@RequiredArgsConstructor
public class OnboardingServiceImpl implements OnboardingService {
    private final CommonCodeService commonCodeService;
    
    private String getDefaultBusinessType() {
        // 공통 코드에서 기본 업종 조회
        CommonCode defaultBusinessType = commonCodeService
            .getCommonCodeByGroupAndValue("BUSINESS_TYPE", "DEFAULT");
        return defaultBusinessType != null 
            ? defaultBusinessType.getCodeValue() 
            : null;
    }
    
    private boolean isApprovedStatus(String statusCode) {
        // 공통 코드에서 승인 상태 확인
        CommonCode approvedCode = commonCodeService
            .getCommonCodeByGroupAndValue("ONBOARDING_STATUS", "APPROVED");
        return approvedCode != null && statusCode.equals(approvedCode.getCodeValue());
    }
}
```

### 2. 에러 메시지 상수화

**에러 메시지는 상수 파일에 정의:**

```java
// constants/OnboardingConstants.java
public class OnboardingConstants {
    public static final String ERROR_TENANT_NOT_FOUND = "온보딩 요청을 찾을 수 없습니다: {0}";
    public static final String ERROR_EMAIL_DUPLICATE = "이미 해당 이메일로 테넌트가 생성되어 있습니다.";
    // ...
}

// 사용
throw new IllegalArgumentException(
    MessageFormat.format(OnboardingConstants.ERROR_TENANT_NOT_FOUND, id)
);
```

### 3. 코드 그룹 상수화

**공통 코드 그룹은 상수로 정의:**

```java
// constants/CommonCodeGroups.java
public class CommonCodeGroups {
    public static final String ONBOARDING_STATUS = "ONBOARDING_STATUS";
    public static final String RISK_LEVEL = "RISK_LEVEL";
    public static final String BUSINESS_TYPE = "BUSINESS_TYPE";
    // ...
}

// 사용
List<CommonCode> statusCodes = commonCodeService
    .getActiveCommonCodesByGroup(CommonCodeGroups.ONBOARDING_STATUS);
```

---

## 프론트엔드 개발 규칙

### 1. CSS 변수 상수화

**모든 스타일은 CSS 변수로 정의:**

```typescript
// constants/css-variables.ts
export const CSS_VARIABLES = {
  COLORS: {
    ERROR: '#dc3545',
    SUCCESS: '#28a745',
    WARNING: '#ffc107',
    INFO: '#17a2b8',
    TEXT_PRIMARY: '#212529',
    TEXT_SECONDARY: '#6c757d',
    BG_ERROR: '#fee2e2',
    BORDER_ERROR: '#fecaca',
  },
  SPACING: {
    XS: '0.25rem',
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
    XL: '2rem',
  },
  FONT_SIZES: {
    XS: '0.75rem',
    SM: '0.875rem',
    MD: '1rem',
    LG: '1.125rem',
  },
};

// 컴포넌트 CSS 클래스
export const COMPONENT_CSS = {
  ONBOARDING: {
    ERROR: 'trinity-onboarding__error',
    SUCCESS: 'trinity-onboarding__success',
    FIELD: 'trinity-onboarding__field',
    // ...
  },
};
```

**CSS 파일에서 변수 사용:**

```css
/* styles/onboarding.css */
.trinity-onboarding__error {
  padding: var(--spacing-md);
  background-color: var(--color-bg-error);
  border: 1px solid var(--color-border-error);
  border-radius: var(--border-radius-md);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}
```

### 2. 인라인 스타일 금지

**인라인 스타일은 절대 사용하지 않음:**

```tsx
// ❌ 잘못된 예시
<div style={{ 
  marginTop: '8px', 
  padding: '8px', 
  backgroundColor: '#fee2e2',
  border: '1px solid #fecaca',
  borderRadius: '4px'
}}>
  에러 메시지
</div>

// ✅ 올바른 예시
<div className={COMPONENT_CSS.ONBOARDING.ERROR}>
  에러 메시지
</div>
```

### 3. 비즈니스 로직 분리

**커스텀 훅 또는 유틸리티 함수로 분리:**

```typescript
// hooks/useOnboarding.ts
export const useOnboarding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const validateEmail = (email: string): ValidationResult => {
    // 이메일 검증 로직
  };
  
  const checkEmailDuplicate = async (email: string): Promise<boolean> => {
    // 이메일 중복 확인 로직
  };
  
  const submitOnboarding = async (data: OnboardingData): Promise<void> => {
    // 온보딩 제출 로직
  };
  
  return {
    loading,
    error,
    validateEmail,
    checkEmailDuplicate,
    submitOnboarding,
  };
};

// components/OnboardingPage.tsx
const OnboardingPage = () => {
  const { 
    loading, 
    error, 
    validateEmail, 
    checkEmailDuplicate, 
    submitOnboarding 
  } = useOnboarding();
  
  // UI만 담당
  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
};
```

### 4. 공통 코드 동적 로드

**모든 드롭다운 옵션은 공통 코드에서 가져옴:**

```typescript
// hooks/useCommonCodes.ts
export const useCommonCodes = (codeGroup: string) => {
  const [codes, setCodes] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadCodes = async () => {
      try {
        const response = await fetch(`/api/v1/common-codes/${codeGroup}`);
        const data = await response.json();
        setCodes(data);
      } catch (err) {
        console.error('공통 코드 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadCodes();
  }, [codeGroup]);
  
  return { codes, loading };
};

// 사용
const OnboardingPage = () => {
  const { codes: statusCodes, loading } = useCommonCodes('ONBOARDING_STATUS');
  
  return (
    <select>
      {statusCodes.map(code => (
        <option key={code.codeValue} value={code.codeValue}>
          {code.koreanName}
        </option>
      ))}
    </select>
  );
};
```

---

## 공통 코드 사용 가이드

### 백엔드

```java
@Service
@RequiredArgsConstructor
public class OnboardingServiceImpl implements OnboardingService {
    private final CommonCodeService commonCodeService;
    
    // 공통 코드 그룹 상수
    private static final String CODE_GROUP_ONBOARDING_STATUS = "ONBOARDING_STATUS";
    private static final String CODE_GROUP_RISK_LEVEL = "RISK_LEVEL";
    private static final String CODE_GROUP_BUSINESS_TYPE = "BUSINESS_TYPE";
    
    // 공통 코드 값 상수
    private static final String CODE_VALUE_PENDING = "PENDING";
    private static final String CODE_VALUE_APPROVED = "APPROVED";
    private static final String CODE_VALUE_LOW = "LOW";
    
    private boolean isApprovedStatus(String statusCode) {
        CommonCode approvedCode = commonCodeService
            .getCommonCodeByGroupAndValue(CODE_GROUP_ONBOARDING_STATUS, CODE_VALUE_APPROVED);
        return approvedCode != null && statusCode.equals(approvedCode.getCodeValue());
    }
    
    private String getDefaultBusinessType() {
        List<CommonCode> businessTypes = commonCodeService
            .getActiveCommonCodesByGroup(CODE_GROUP_BUSINESS_TYPE);
        return businessTypes.isEmpty() 
            ? null 
            : businessTypes.get(0).getCodeValue();
    }
}
```

### 프론트엔드

```typescript
// utils/commonCodeUtils.ts
export const getCommonCodes = async (codeGroup: string): Promise<CommonCode[]> => {
  const response = await fetch(`/api/v1/common-codes/${codeGroup}`);
  if (!response.ok) {
    throw new Error(`공통 코드 로드 실패: ${codeGroup}`);
  }
  return response.json();
};

// constants/commonCodeGroups.ts
export const COMMON_CODE_GROUPS = {
  ONBOARDING_STATUS: 'ONBOARDING_STATUS',
  RISK_LEVEL: 'RISK_LEVEL',
  BUSINESS_TYPE: 'BUSINESS_TYPE',
} as const;

// 사용
const OnboardingPage = () => {
  const [statusCodes, setStatusCodes] = useState<CommonCode[]>([]);
  
  useEffect(() => {
    getCommonCodes(COMMON_CODE_GROUPS.ONBOARDING_STATUS)
      .then(setStatusCodes)
      .catch(console.error);
  }, []);
  
  return (
    <select>
      {statusCodes.map(code => (
        <option key={code.codeValue} value={code.codeValue}>
          {code.koreanName}
        </option>
      ))}
    </select>
  );
};
```

---

## 체크리스트

### 백엔드 개발 시

- [ ] 모든 코드 값이 공통 코드에서 동적으로 조회되는가?
- [ ] 하드코딩된 문자열이 없는가? (`"CONSULTATION"`, `"PENDING"` 등)
- [ ] 에러 메시지가 상수 파일에 정의되어 있는가?
- [ ] 공통 코드 그룹이 상수로 정의되어 있는가?
- [ ] `CommonCodeService`를 주입받아 사용하는가?

### 프론트엔드 개발 시

- [ ] 인라인 스타일(`style={{}}`)이 없는가?
- [ ] 모든 스타일이 CSS 변수 또는 CSS 클래스로 정의되어 있는가?
- [ ] 비즈니스 로직이 커스텀 훅 또는 유틸리티 함수로 분리되어 있는가?
- [ ] 드롭다운 옵션이 공통 코드에서 동적으로 로드되는가?
- [ ] 하드코딩된 색상 값이 없는가? (`"#ff0000"` 등)
- [ ] 하드코딩된 문자열이 없는가? (`"에러가 발생했습니다"` 등)

### 코드 리뷰 시

- [ ] `grep -r "style={{}}"` 결과가 비어있는가?
- [ ] `grep -r "CONSULTATION"` 결과가 상수 파일에만 있는가?
- [ ] `grep -r "#[0-9a-fA-F]{3,6}"` 결과가 CSS 변수 파일에만 있는가?
- [ ] 모든 공통 코드 조회가 `CommonCodeService`를 통해 이루어지는가?

---

## 예시: 올바른 구현

### 백엔드

```java
@Service
@RequiredArgsConstructor
public class OnboardingServiceImpl implements OnboardingService {
    private final CommonCodeService commonCodeService;
    private final OnboardingRequestRepository repository;
    
    private static final String CODE_GROUP_ONBOARDING_STATUS = "ONBOARDING_STATUS";
    private static final String CODE_GROUP_BUSINESS_TYPE = "BUSINESS_TYPE";
    private static final String CODE_VALUE_APPROVED = "APPROVED";
    private static final String CODE_VALUE_DEFAULT_BUSINESS_TYPE = "DEFAULT";
    
    @Override
    public OnboardingRequest decide(Long requestId, String statusCode, String actorId, String note) {
        OnboardingRequest request = repository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException(
                MessageFormat.format(OnboardingConstants.ERROR_TENANT_NOT_FOUND, requestId)
            ));
        
        // 공통 코드에서 상태 확인
        CommonCode statusCodeObj = commonCodeService
            .getCommonCodeByGroupAndValue(CODE_GROUP_ONBOARDING_STATUS, statusCode);
        
        if (statusCodeObj == null) {
            throw new IllegalArgumentException(
                MessageFormat.format(OnboardingConstants.ERROR_INVALID_STATUS, statusCode)
            );
        }
        
        // 승인 상태 확인
        CommonCode approvedCode = commonCodeService
            .getCommonCodeByGroupAndValue(CODE_GROUP_ONBOARDING_STATUS, CODE_VALUE_APPROVED);
        
        if (statusCode.equals(approvedCode.getCodeValue())) {
            // 승인 처리
            processApproval(request);
        }
        
        return repository.save(request);
    }
    
    private String getDefaultBusinessType() {
        List<CommonCode> businessTypes = commonCodeService
            .getActiveCommonCodesByGroup(CODE_GROUP_BUSINESS_TYPE);
        
        // 기본 업종 찾기
        Optional<CommonCode> defaultType = businessTypes.stream()
            .filter(code -> CODE_VALUE_DEFAULT_BUSINESS_TYPE.equals(code.getCodeValue()))
            .findFirst();
        
        return defaultType
            .map(CommonCode::getCodeValue)
            .orElse(businessTypes.isEmpty() ? null : businessTypes.get(0).getCodeValue());
    }
}
```

### 프론트엔드

```typescript
// hooks/useOnboarding.ts
export const useOnboarding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const validateEmail = (email: string): ValidationResult => {
    if (!email || !email.includes('@')) {
      return { valid: false, error: TRINITY_CONSTANTS.MESSAGES.ERROR_EMAIL_INVALID };
    }
    return { valid: true };
  };
  
  const submitOnboarding = async (data: OnboardingData): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await createOnboardingRequest(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : TRINITY_CONSTANTS.MESSAGES.ONBOARDING_ERROR);
    } finally {
      setLoading(false);
    }
  };
  
  return { loading, error, validateEmail, submitOnboarding };
};

// components/OnboardingPage.tsx
const OnboardingPage = () => {
  const { loading, error, validateEmail, submitOnboarding } = useOnboarding();
  const { codes: statusCodes } = useCommonCodes(COMMON_CODE_GROUPS.ONBOARDING_STATUS);
  
  return (
    <div className={COMPONENT_CSS.ONBOARDING.CONTAINER}>
      {error && (
        <div className={COMPONENT_CSS.ONBOARDING.ERROR}>
          {error}
        </div>
      )}
      {/* ... */}
    </div>
  );
};
```

---

## 관련 문서

- [공통 코드 사용 원칙](../2025-01/COMMON_CODE_USAGE_PRINCIPLES.md)
- [하드코딩 분석 리포트](../../HARDCODING_ANALYSIS_REPORT.md)
- [표준화 계획](../2025-11-20/CORESOLUTION_STANDARDIZATION_PLAN.md)

---

**마지막 업데이트**: 2025-11-21  
**작성자**: CoreSolution Development Team

