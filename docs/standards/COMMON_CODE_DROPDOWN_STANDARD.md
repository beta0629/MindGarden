# 공통코드 드롭다운 자동화 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 공통코드 드롭다운 자동화 표준입니다.  
**모든 코드값은 데이터베이스 공통코드에서 조회**하여 사용합니다.

### 핵심 원칙 ⭐⭐⭐⭐⭐

**절대 금지**:
- ❌ 하드코딩된 드롭다운 옵션
- ❌ 상수 클래스의 하드코딩된 값
- ❌ JavaScript/TypeScript의 하드코딩된 배열/객체
- ❌ 문자열 리터럴 직접 사용

**필수 사항**:
- ✅ 모든 코드값은 공통코드에서 조회
- ✅ 시스템 공통코드 또는 테넌트 공통코드 사용
- ✅ 공통코드 서비스/API를 통한 동적 조회

### 참조 문서
- [공통코드 시스템 표준](./COMMON_CODE_SYSTEM_STANDARD.md)
- [프론트엔드 개발 표준](./FRONTEND_DEVELOPMENT_STANDARD.md)
- [API 설계 표준](./API_DESIGN_STANDARD.md)

### 구현 위치
- **드롭다운 컴포넌트**: `frontend/src/components/common/CommonCodeSelect.js`
- **공통코드 API**: `frontend/src/utils/commonCodeApi.js`
- **공통코드 서비스**: `src/main/java/com/coresolution/consultation/service/CommonCodeService.java`

---

## 🎯 드롭다운 자동화 원칙

### 1. DB 코드 기반 원칙
```
모든 선택 옵션은 DB에서 조회 (하드코딩 절대 금지)
```

**원칙**:
- ✅ 모든 드롭다운은 공통코드 테이블에서 조회
- ✅ 하드코딩된 옵션 배열 금지
- ✅ DB 코드 값만 사용
- ❌ 프론트엔드에 옵션 배열 직접 정의 금지

### 2. 자동 로딩 원칙
```
사용자 입력 없이 자동으로 드롭다운 채우기
```

**원칙**:
- ✅ 컴포넌트 마운트 시 자동 로딩
- ✅ 코드 그룹만 지정하면 자동 조회
- ✅ 캐싱으로 성능 최적화
- ✅ 로딩 상태 표시

### 3. 일관된 컴포넌트 사용
```
모든 드롭다운은 공통 컴포넌트 사용
```

**원칙**:
- ✅ `CommonCodeSelect` 컴포넌트 사용
- ✅ 동일한 인터페이스 및 스타일
- ✅ 재사용 가능한 구조

---

## 🔧 공통 드롭다운 컴포넌트

### 1. CommonCodeSelect 컴포넌트

#### 컴포넌트 구조
```javascript
/**
 * 공통코드 드롭다운 컴포넌트
 * - DB 코드 기반 자동 로딩
 * - 캐싱 지원
 * - 일관된 UI/UX
 */
import React, { useState, useEffect } from 'react';
import { getCommonCodes } from '../../utils/commonCodeApi';
import CustomSelect from './CustomSelect';

const CommonCodeSelect = ({
    codeGroup,              // 필수: 코드 그룹 (예: "USER_STATUS")
    value,                  // 선택된 값
    onChange,               // 변경 핸들러
    placeholder = '선택하세요',
    disabled = false,
    allowClear = false,     // 빈 값 허용
    filterActive = true,    // 활성 코드만 조회
    className = ''
}) => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    // 자동 로딩
    useEffect(() => {
        if (codeGroup) {
            loadOptions();
        }
    }, [codeGroup]);

    const loadOptions = async () => {
        try {
            setLoading(true);
            
            // DB에서 공통코드 조회
            const codes = await getCommonCodes(codeGroup);
            
            // 드롭다운 옵션으로 변환
            const options = codes
                .filter(code => filterActive ? code.isActive !== false : true)
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                .map(code => ({
                    value: code.codeValue,
                    label: code.koreanName || code.codeLabel,
                    disabled: !code.isActive
                }));
            
            setOptions(options);
        } catch (error) {
            console.error(`공통코드 조회 실패: ${codeGroup}`, error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <CustomSelect
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled || loading}
            loading={loading}
            className={className}
        />
    );
};

export default CommonCodeSelect;
```

---

## 💻 사용 예시

### 1. 기본 사용법

#### 단순 드롭다운
```javascript
import CommonCodeSelect from '../common/CommonCodeSelect';

function UserForm() {
    const [status, setStatus] = useState('');

    return (
        <div>
            <label>사용자 상태</label>
            <CommonCodeSelect
                codeGroup="USER_STATUS"
                value={status}
                onChange={(value) => setStatus(value)}
                placeholder="상태를 선택하세요"
            />
        </div>
    );
}
```

#### 여러 드롭다운
```javascript
function ConsultationForm() {
    const [type, setType] = useState('');
    const [packageType, setPackageType] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');

    return (
        <form>
            <div>
                <label>상담 유형</label>
                <CommonCodeSelect
                    codeGroup="CONSULTATION_TYPE"
                    value={type}
                    onChange={setType}
                />
            </div>
            
            <div>
                <label>패키지 유형</label>
                <CommonCodeSelect
                    codeGroup="PACKAGE_TYPE"
                    value={packageType}
                    onChange={setPackageType}
                />
            </div>
            
            <div>
                <label>결제 방법</label>
                <CommonCodeSelect
                    codeGroup="PAYMENT_METHOD"
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                />
            </div>
        </form>
    );
}
```

### 2. 조건부 드롭다운

```javascript
function ConditionalDropdown() {
    const [businessType, setBusinessType] = useState('');
    const [showTenantCode, setShowTenantCode] = useState(false);

    useEffect(() => {
        // 비즈니스 타입에 따라 테넌트 코드 표시
        setShowTenantCode(businessType === 'CONSULTING');
    }, [businessType]);

    return (
        <div>
            <CommonCodeSelect
                codeGroup="BUSINESS_TYPE"
                value={businessType}
                onChange={setBusinessType}
            />
            
            {showTenantCode && (
                <CommonCodeSelect
                    codeGroup="CONSULTATION_PACKAGE"
                    value={packageType}
                    onChange={setPackageType}
                />
            )}
        </div>
    );
}
```

### 3. 다중 선택 드롭다운

```javascript
import MultiSelectCheckbox from '../ui/MultiSelectCheckbox';

function MultiSelectForm() {
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        const codes = await getCommonCodes('USER_ROLE');
        const options = codes.map(code => ({
            value: code.codeValue,
            label: code.koreanName
        }));
        setRoleOptions(options);
    };

    return (
        <MultiSelectCheckbox
            options={roleOptions}
            selectedValues={selectedRoles}
            onChange={setSelectedRoles}
            placeholder="역할을 선택하세요"
        />
    );
}
```

---

## 🚫 금지 사항

### 1. 하드코딩된 옵션 금지
```javascript
// ❌ 금지: 하드코딩된 옵션
const statusOptions = [
    { value: 'ACTIVE', label: '활성' },
    { value: 'INACTIVE', label: '비활성' }
];

<select>
    {statusOptions.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
</select>

// ✅ 권장: DB 코드 기반
<CommonCodeSelect
    codeGroup="USER_STATUS"
    value={status}
    onChange={setStatus}
/>
```

### 2. 직접 API 호출 금지
```javascript
// ❌ 금지: 컴포넌트 내에서 직접 API 호출
function MyForm() {
    const [options, setOptions] = useState([]);
    
    useEffect(() => {
        apiGet('/api/v1/common-codes?codeGroup=USER_STATUS')
            .then(response => setOptions(response.data));
    }, []);
    
    return <select>...</select>;
}

// ✅ 권장: 공통 컴포넌트 사용
<CommonCodeSelect codeGroup="USER_STATUS" />
```

### 3. 프론트엔드에 코드 값 정의 금지
```javascript
// ❌ 금지: 코드 값 상수 정의
const USER_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE'
};

// ✅ 권장: DB에서 조회한 값 사용
const codes = await getCommonCodes('USER_STATUS');
const status = codes.find(c => c.koreanName === '활성')?.codeValue;
```

---

## 🔄 캐싱 전략

### 1. 프론트엔드 캐싱

```javascript
// utils/commonCodeApi.js
const codeCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5분

export const getCommonCodes = async (codeGroup, useCache = true) => {
    const cacheKey = codeGroup || 'all';
    
    // 캐시 확인
    if (useCache && codeCache.has(cacheKey)) {
        const cached = codeCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }
    }
    
    // API 호출
    const codes = await fetchCommonCodes(codeGroup);
    
    // 캐시 저장
    if (useCache) {
        codeCache.set(cacheKey, {
            data: codes,
            timestamp: Date.now()
        });
    }
    
    return codes;
};

// 캐시 무효화
export const invalidateCommonCodeCache = (codeGroup = null) => {
    if (codeGroup) {
        codeCache.delete(codeGroup);
    } else {
        codeCache.clear();
    }
};
```

### 2. 백엔드 캐싱

```java
@Service
@RequiredArgsConstructor
public class CommonCodeServiceImpl implements CommonCodeService {
    
    @Cacheable(value = "commonCodes", key = "#codeGroup")
    public List<CommonCode> getActiveCommonCodesByGroup(String codeGroup) {
        return commonCodeRepository
            .findByTenantIdAndCodeGroupAndIsActiveOrderBySortOrder(
                TenantContextHolder.getTenantId(),
                codeGroup,
                true
            );
    }
    
    @CacheEvict(value = "commonCodes", key = "#codeGroup")
    public CommonCodeResponse update(Long id, CommonCodeUpdateRequest request) {
        // 수정 로직
    }
}
```

---

## 📋 코드 그룹 표준

### 1. 시스템 공통코드 (CORE)

| 코드 그룹 | 설명 | 예시 값 |
|----------|------|---------|
| USER_STATUS | 사용자 상태 | ACTIVE, INACTIVE, SUSPENDED |
| USER_ROLE | 사용자 역할 | ADMIN, CONSULTANT, CLIENT |
| GENDER | 성별 | MALE, FEMALE, OTHER |
| BANK | 은행 | KB, SHINHAN, WOORI |
| NOTIFICATION_TYPE | 알림 유형 | EMAIL, SMS, PUSH |
| SYSTEM_STATUS | 시스템 상태 | ACTIVE, MAINTENANCE |

### 2. 테넌트 공통코드 (TENANT)

| 코드 그룹 | 설명 | 예시 값 |
|----------|------|---------|
| CONSULTATION_TYPE | 상담 유형 | INDIVIDUAL, GROUP, ONLINE |
| CONSULTATION_PACKAGE | 상담 패키지 | BASIC, PREMIUM, VIP |
| PACKAGE_TYPE | 패키지 유형 | MONTHLY, QUARTERLY, YEARLY |
| PAYMENT_METHOD | 결제 방법 | CREDIT_CARD, BANK_TRANSFER, CASH |
| SPECIALTY | 전문 분야 | DEPRESSION, ANXIETY, ADDICTION |
| FINANCIAL_CATEGORY | 재무 카테고리 | INCOME, EXPENSE, ASSET |

---

## ✅ 체크리스트

### 드롭다운 구현 시
- [ ] 하드코딩된 옵션 배열 없음
- [ ] `CommonCodeSelect` 컴포넌트 사용
- [ ] 코드 그룹 정확히 지정
- [ ] 자동 로딩 구현
- [ ] 로딩 상태 표시
- [ ] 에러 처리 구현
- [ ] 캐싱 활용

### 코드 그룹 생성 시
- [ ] DB에 코드 그룹 등록
- [ ] 코드 값 및 한글명 입력
- [ ] 정렬 순서 설정
- [ ] 활성/비활성 상태 설정
- [ ] 시스템/테넌트 구분 명확히

### 공통코드 수정 시
- [ ] 캐시 무효화
- [ ] 프론트엔드 자동 갱신
- [ ] 기존 사용 중인 곳 확인

---

## 💡 베스트 프랙티스

### 1. 코드 그룹 네이밍
```
형식: {DOMAIN}_{TYPE}

예시:
- USER_STATUS (사용자 상태)
- PAYMENT_METHOD (결제 방법)
- CONSULTATION_TYPE (상담 유형)
```

### 2. 컴포넌트 재사용
```javascript
// ✅ 권장: 공통 컴포넌트 재사용
<CommonCodeSelect codeGroup="USER_STATUS" />

// ❌ 금지: 매번 새로 구현
function StatusSelect() {
    // 직접 구현...
}
```

### 3. 에러 처리
```javascript
const CommonCodeSelect = ({ codeGroup, ... }) => {
    const [error, setError] = useState(null);
    
    const loadOptions = async () => {
        try {
            // 로딩...
        } catch (error) {
            console.error(`공통코드 조회 실패: ${codeGroup}`, error);
            setError('옵션을 불러올 수 없습니다.');
            // 기본값 또는 빈 배열 반환
        }
    };
    
    if (error) {
        return <div className="error">{error}</div>;
    }
    
    // ...
};
```

---

## 📞 문의

공통코드 드롭다운 자동화 표준 관련 문의:
- 프론트엔드 팀
- 백엔드 팀

**최종 업데이트**: 2025-12-03

