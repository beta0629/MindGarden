# 표준화 마이그레이션 가이드

**작성일**: 2025-12-05  
**최종 업데이트**: 2025-12-05

---

## 📋 개요

표준화 작업이 95% 완료되었으며, 주석으로 변경 제안이 추가된 파일들이 있습니다. 이 가이드는 실제 코드 변경을 위한 마이그레이션 가이드입니다.

---

## 🎨 색상 하드코딩 제거 가이드

### 현재 상태
- 76개 파일에 CSS 변수 변경 제안 주석이 추가되었습니다.
- 주석 형식: `// ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #hex -> var(--mg-custom-hex)`

### 변경 방법

#### 1. CSS 변수 사용
```javascript
// ❌ 이전 (하드코딩)
style={{ color: '#6b7280' }}

// ✅ 이후 (CSS 변수)
style={{ color: 'var(--mg-gray-500)' }}
```

#### 2. CSS_VARIABLES 상수 사용
```javascript
import { CSS_VARIABLES } from '../../constants/css-variables';

// ✅ CSS_VARIABLES 상수 사용
style={{ color: CSS_VARIABLES.COLORS.GRAY_MEDIUM }}
```

#### 3. 일반적인 색상 매핑
- `#ffffff` / `#fff` → `var(--mg-white)`
- `#000000` / `#000` → `var(--mg-black)`
- `#6b7280` → `var(--mg-gray-500)`
- `#495057` → `var(--mg-gray-600)`
- `#e9ecef` → `var(--mg-gray-200)`

---

## 📊 상태값 하드코딩 제거 가이드

### 현재 상태
- 159개 파일에 공통코드 시스템 사용 제안 주석이 추가되었습니다.
- 주석 형식: `// ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용`

### 변경 방법

#### 1. Frontend에서 공통코드 사용
```javascript
import { getCommonCodes } from '../../utils/commonCodeApi';

// ❌ 이전 (하드코딩)
const status = 'PENDING';

// ✅ 이후 (공통코드)
const [statusCodes, setStatusCodes] = useState([]);

useEffect(() => {
  const loadStatusCodes = async () => {
    const codes = await getCommonCodes('STATUS_GROUP');
    setStatusCodes(codes);
  };
  loadStatusCodes();
}, []);

// 사용
const status = statusCodes.find(code => code.codeValue === 'PENDING');
```

#### 2. Backend에서 공통코드 사용
```java
// ❌ 이전 (하드코딩)
if ("PENDING".equals(status)) {
    // ...
}

// ✅ 이후 (공통코드)
List<CommonCode> statusCodes = commonCodeService.getActiveCodesByGroup("STATUS_GROUP");
boolean isPending = statusCodes.stream()
    .anyMatch(code -> "PENDING".equals(code.getCodeValue()));
```

---

## 🏢 브랜치 코드 제거 가이드

### 현재 상태
- 34개 파일에 Deprecated 주석이 추가되었습니다.
- 브랜치 유틸리티 함수들이 Deprecated 처리되었습니다.

### 변경 방법

#### 1. 브랜치 유틸리티 함수 사용 금지
```javascript
// ❌ 이전 (Deprecated)
import { getBranchNameByCode } from '../../utils/branchUtils';
const branchName = getBranchNameByCode(branchCode);

// ✅ 이후 (테넌트 기반)
// 브랜치 개념이 제거되었으므로 테넌트 기반으로 변경
// 필요시 테넌트 정보를 사용
```

#### 2. 브랜치 코드 파라미터 제거
```javascript
// ❌ 이전
const loadData = async (branchCode) => {
  const response = await apiGet(`/api/data?branchCode=${branchCode}`);
};

// ✅ 이후
const loadData = async () => {
  // 테넌트는 자동으로 TenantContext에서 추출됨
  const response = await apiGet('/api/v1/data');
};
```

---

## 🧩 표준 컴포넌트 사용 가이드

### 표준 컴포넌트 목록

#### UI 컴포넌트 (`components/ui/`)
- `Button` - 표준 버튼 컴포넌트
- `Card` - 카드 컴포넌트
- `Modal` - 모달 컴포넌트
- `Table` - 테이블 컴포넌트
- `Form` - 폼 컴포넌트 (Input, Select, Textarea, Checkbox)
- `Loading` - 로딩 컴포넌트

#### 공통 컴포넌트 (`components/common/`)
- `CommonPageTemplate` - 공통 페이지 템플릿
- `UnifiedHeader` - 통합 헤더
- `UnifiedLoading` - 통합 로딩

### 마이그레이션 예시

#### 버튼 컴포넌트
```javascript
// ❌ 이전 (커스텀 버튼)
<button className="custom-btn" onClick={handleClick}>
  클릭
</button>

// ✅ 이후 (표준 버튼)
import Button from '../ui/Button/Button';

<Button variant="primary" onClick={handleClick}>
  클릭
</Button>
```

#### 카드 컴포넌트
```javascript
// ❌ 이전 (커스텀 카드)
<div className="custom-card">
  <h3>제목</h3>
  <p>내용</p>
</div>

// ✅ 이후 (표준 카드)
import Card from '../ui/Card/Card';

<Card>
  <Card.Header>
    <h3>제목</h3>
  </Card.Header>
  <Card.Content>
    <p>내용</p>
  </Card.Content>
</Card>
```

---

## 📝 마이그레이션 체크리스트

### 색상 하드코딩 제거
- [ ] 주석으로 제안된 색상값을 CSS 변수로 변경
- [ ] CSS_VARIABLES 상수 활용
- [ ] 인라인 스타일 색상값 제거

### 상태값 하드코딩 제거
- [ ] 주석으로 제안된 상태값을 공통코드 시스템으로 변경
- [ ] getCommonCodes() 함수 활용
- [ ] 하드코딩된 상태값 enum 제거

### 브랜치 코드 제거
- [ ] 브랜치 유틸리티 함수 사용 중단
- [ ] 브랜치 코드 파라미터 제거
- [ ] 테넌트 기반 시스템으로 전환

### 표준 컴포넌트 사용
- [ ] 커스텀 버튼을 표준 Button 컴포넌트로 교체
- [ ] 커스텀 카드를 표준 Card 컴포넌트로 교체
- [ ] 커스텀 모달을 표준 Modal 컴포넌트로 교체

---

## 🚀 자동화 스크립트

표준화 작업을 위해 다음 Python 스크립트들이 생성되었습니다:

1. `scripts/standardization/frontend_branch_removal.py` - 브랜치 코드 제거
2. `scripts/standardization/color_hardcoding_removal.py` - 색상 하드코딩 제거
3. `scripts/standardization/status_hardcoding_removal.py` - 상태값 하드코딩 제거

이 스크립트들은 주석을 추가하는 작업을 수행했습니다. 실제 코드 변경은 수동으로 또는 추가 스크립트로 진행할 수 있습니다.

---

## 📚 참조 문서

- [표준화 작업 완료 요약](./STANDARDIZATION_COMPLETE_SUMMARY.md)
- [프론트엔드 표준화 요약](./FRONTEND_STANDARDIZATION_SUMMARY.md)
- [버튼 디자인 표준](../../standards/BUTTON_DESIGN_STANDARD.md)
- [공통코드 시스템 표준](../../standards/COMMON_CODE_SYSTEM_STANDARD.md)

---

**최종 업데이트**: 2025-12-05

