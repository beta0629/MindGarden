# 공통코드 사용 원칙

## 📋 개요

**CoreSolution 플랫폼**에서 공통코드를 사용하는 원칙을 정의합니다. 이 원칙은 CoreSolution의 모든 프로젝트(마인드가든 포함)에 적용됩니다.

### CoreSolution과 MindGarden의 관계
- **CoreSolution**: 멀티테넌트 SaaS 플랫폼 (코어 시스템)
- **MindGarden**: CoreSolution 플랫폼을 사용하는 하나의 프로젝트/테넌트
- **하드코딩 금지 원칙**: CoreSolution 플랫폼 전체에 적용되는 원칙

백엔드와 프론트엔드에서의 사용 방식이 다르므로 명확히 구분합니다.

## 🔑 핵심 원칙

### CoreSolution 백엔드 원칙 (절대 준수)

**이 원칙은 CoreSolution 플랫폼의 모든 백엔드 코드에 적용됩니다.**

#### ❌ 금지 사항
1. **하드코딩 절대 금지**
   ```java
   // ❌ 금지: 코드 그룹명 하드코딩
   if (codeGroup.equals("USER_STATUS")) { ... }
   
   // ❌ 금지: 코드값 하드코딩
   if (codeValue.equals("ACTIVE")) { ... }
   
   // ❌ 금지: 열거형으로 코드 정의
   public enum UserStatus {
       ACTIVE, INACTIVE, SUSPENDED
   }
   
   // ❌ 금지: 상수 클래스에 코드값 정의
   public class CommonCodeConstants {
       public static final String USER_STATUS_ACTIVE = "ACTIVE";
   }
   ```

2. **상수 클래스 사용 금지**
   - `CommonCodeConstants.java` 같은 상수 클래스는 백엔드에서 사용 금지
   - 프론트엔드용으로만 사용 가능

#### ✅ 허용 사항
1. **공통코드에서 동적 조회**
   ```java
   // ✅ 올바른 방법: 공통코드에서 조회
   CommonCode code = commonCodeService.getCodeByGroupAndValue("USER_STATUS", "ACTIVE");
   if (code != null && code.getIsActive()) {
       // 처리
   }
   
   // ✅ 올바른 방법: 코드 그룹 타입도 공통코드에서 조회
   boolean isCore = codeGroupMetadataService.isCoreCodeGroup(codeGroup);
   
   // ✅ 올바른 방법: 코드 목록 조회
   List<CommonCode> codes = commonCodeService.getActiveCodesByGroup("USER_STATUS");
   ```

2. **시스템 최소 코드만 허용**
   ```java
   // ✅ 최소한의 시스템 코드는 허용 (예: CODE_GROUP_TYPE 그룹명)
   // 하지만 가능하면 이것도 공통코드에서 관리
   ```

### 프론트엔드 원칙

#### ✅ 허용 사항
1. **상수 사용 가능**
   ```javascript
   // ✅ 허용: 코드 그룹명 상수
   const CODE_GROUP = {
       USER_STATUS: 'USER_STATUS',
       PAYMENT_METHOD: 'PAYMENT_METHOD',
       CONSULTATION_STATUS: 'CONSULTATION_STATUS'
   };
   
   // ✅ 허용: 코드값 상수
   const USER_STATUS = {
       ACTIVE: 'ACTIVE',
       INACTIVE: 'INACTIVE',
       SUSPENDED: 'SUSPENDED'
   };
   
   // ✅ 허용: 상수 사용
   if (codeGroup === CODE_GROUP.USER_STATUS) {
       // 처리
   }
   ```

2. **API 기반 동작**
   ```javascript
   // ✅ 허용: API로 공통코드 조회
   const codes = await apiGet('/api/common-codes/groups/USER_STATUS');
   
   // ✅ 허용: API 응답을 상수로 매핑
   const statusMap = codes.reduce((map, code) => {
       map[code.codeValue] = code.codeLabel;
       return map;
   }, {});
   ```

## 📊 사용 예시

### CoreSolution 백엔드 예시

#### ❌ 잘못된 예시 (CoreSolution 플랫폼에서 금지)
```java
@Service
public class UserService {
    
    // ❌ 금지: 하드코딩 (CoreSolution 플랫폼 원칙 위반)
    public void updateUserStatus(Long userId, String status) {
        if (!status.equals("ACTIVE") && !status.equals("INACTIVE")) {
            throw new IllegalArgumentException("Invalid status");
        }
        // ...
    }
    
    // ❌ 금지: 상수 클래스 사용 (CoreSolution 플랫폼 원칙 위반)
    public void updateUserStatus(Long userId, String status) {
        if (!status.equals(CommonCodeConstants.USER_STATUS_ACTIVE)) {
            // ...
        }
    }
}
```

#### ✅ 올바른 예시 (CoreSolution 플랫폼 원칙 준수)
```java
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final CommonCodeService commonCodeService;
    
    // ✅ 올바른 방법: 공통코드에서 조회 (CoreSolution 플랫폼 원칙)
    public void updateUserStatus(Long userId, String status) {
        // 공통코드에서 유효한 상태값인지 확인
        Optional<CommonCode> statusCode = commonCodeService.getCodeByGroupAndValue(
            "USER_STATUS", 
            status
        );
        
        if (statusCode.isEmpty() || !statusCode.get().getIsActive()) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
        
        // 상태 업데이트
        // ...
    }
    
    // ✅ 올바른 방법: 코드 그룹 타입도 공통코드에서 조회 (CoreSolution 플랫폼 원칙)
    public List<CommonCode> getCodesByGroup(String codeGroup) {
        // 코드 그룹 타입 확인 (공통코드에서)
        CodeGroupMetadata metadata = codeGroupMetadataRepository
            .findByGroupName(codeGroup)
            .orElse(null);
        
        if (metadata == null) {
            throw new IllegalArgumentException("Unknown code group: " + codeGroup);
        }
        
        // 코어 코드인지 테넌트 코드인지 확인 (공통코드에서)
        boolean isCore = codeGroupMetadataService.isCoreCodeGroup(codeGroup);
        
        if (isCore) {
            return commonCodeService.getCoreCodesByGroup(codeGroup);
        } else {
            String tenantId = tenantContextHolder.getTenantId();
            return commonCodeService.getTenantCodesByGroup(tenantId, codeGroup);
        }
    }
}
```

### 프론트엔드 예시

#### ✅ 올바른 예시
```javascript
// constants/commonCode.js
export const CODE_GROUP = {
    USER_STATUS: 'USER_STATUS',
    PAYMENT_METHOD: 'PAYMENT_METHOD',
    CONSULTATION_STATUS: 'CONSULTATION_STATUS'
};

export const USER_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED'
};

// components/UserStatusSelect.js
import { CODE_GROUP, USER_STATUS } from '../../constants/commonCode';
import { apiGet } from '../../utils/ajax';

const UserStatusSelect = () => {
    const [statuses, setStatuses] = useState([]);
    
    useEffect(() => {
        // API로 공통코드 조회
        const loadStatuses = async () => {
            const response = await apiGet(`/api/common-codes/groups/${CODE_GROUP.USER_STATUS}`);
            if (response.success) {
                setStatuses(response.data);
            }
        };
        loadStatuses();
    }, []);
    
    return (
        <select>
            {statuses.map(status => (
                <option key={status.codeValue} value={status.codeValue}>
                    {status.codeLabel}
                </option>
            ))}
        </select>
    );
};
```

## 🔧 마이그레이션 가이드

### CoreSolution 백엔드 하드코딩 제거

**이 가이드는 CoreSolution 플랫폼의 모든 백엔드 코드에 적용됩니다.**

#### Step 1: 상수 클래스 제거
```java
// ❌ 제거 대상
public class CommonCodeConstants {
    public static final String USER_STATUS_ACTIVE = "ACTIVE";
    public static final String USER_STATUS_INACTIVE = "INACTIVE";
}

// ✅ 대체: CommonCodeService 사용
@Service
public class UserService {
    private final CommonCodeService commonCodeService;
    
    public void checkStatus(String status) {
        Optional<CommonCode> code = commonCodeService.getCodeByGroupAndValue(
            "USER_STATUS", 
            status
        );
        // ...
    }
}
```

#### Step 2: 열거형 제거
```java
// ❌ 제거 대상
public enum UserStatus {
    ACTIVE, INACTIVE, SUSPENDED
}

// ✅ 대체: 공통코드에서 조회
List<CommonCode> statuses = commonCodeService.getActiveCodesByGroup("USER_STATUS");
```

#### Step 3: 하드코딩된 문자열 제거
```java
// ❌ 제거 대상
if (codeGroup.equals("USER_STATUS")) { ... }

// ✅ 대체: 공통코드에서 조회
Optional<CommonCode> codeGroup = commonCodeService.getCodeByGroupAndValue(
    "CODE_GROUP_TYPE",
    codeGroup
);
```

## 📝 체크리스트

### CoreSolution 백엔드 (플랫폼 전체)
- [ ] 모든 하드코딩된 코드 그룹명 제거
- [ ] 모든 하드코딩된 코드값 제거
- [ ] 상수 클래스 제거 또는 deprecated 처리
- [ ] 열거형으로 정의된 코드 제거
- [ ] 모든 코드 조회를 `CommonCodeService`로 변경
- [ ] 코드 그룹 타입도 공통코드에서 조회
- [ ] **CoreSolution 플랫폼의 모든 프로젝트에 적용 확인**

### 프론트엔드
- [ ] 상수 파일 생성 (`constants/commonCode.js`)
- [ ] API 기반 공통코드 조회 구현
- [ ] 상수와 API 응답 매핑 로직 구현

## 🚨 주의사항

1. **CoreSolution 백엔드는 절대 하드코딩 금지**
   - 코드 그룹명, 코드값, 코드 타입 모두 공통코드에서 조회
   - 상수 클래스, 열거형 사용 금지
   - **이 원칙은 CoreSolution 플랫폼 전체에 적용**
   - **MindGarden을 포함한 모든 프로젝트에 적용**

2. **한글명 필수 (한국 사용 필수)**
   - 모든 공통코드는 `koreanName` 필드가 필수
   - 한글명이 없으면 `codeLabel`을 한글명으로 사용
   - 한국에서 사용되므로 한글명은 반드시 포함되어야 함

3. **프론트엔드는 상수 사용 허용**
   - 성능 및 타입 안정성을 위해 상수 사용 가능
   - API 응답을 상수로 매핑하여 사용 가능

4. **점진적 마이그레이션**
   - 기존 하드코딩된 코드를 한 번에 제거하지 말고 점진적으로 마이그레이션
   - 각 마이그레이션 단계마다 테스트 필수

5. **공통코드 관리**
   - 모든 코드 그룹과 코드값은 관리자 UI에서 관리
   - 코드 그룹 타입도 공통코드로 관리
   - 한글명은 필수로 입력하도록 UI에서 검증

## 📚 관련 문서

- [테넌트별 공통 코드 분리 방안](./TENANT_COMMON_CODE_SEPARATION_PLAN.md)
- [공통 코드 시스템 설계](./DYNAMIC_CODE_SYSTEM_IMPLEMENTATION.md)

