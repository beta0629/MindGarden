# 입력 필드 최소화 가이드 (UX 우선)

**작성일**: 2025-12-09  
**상태**: 최우선 적용  
**대상**: 모든 사용자 대면 화면, 특히 내담자/사용자 화면

---

## 🚨 핵심 원칙

**"요즘 누가 입력을 해? 특히 내담자, 사용자 관점에서"**

### 사용자 경험(UX) 우선 원칙

**금지 사항**:
- ❌ 내담자/사용자 대면 화면에서 불필요한 입력 필드
- ❌ 선택 가능한 값인데 입력 필드로 제공
- ❌ 자동 생성 가능한데 수동 입력 요구
- ❌ 기본값 설정 가능한데 빈 값 요구

**필수 사항**:
- ✅ 자동 생성 (ID, 비밀번호 등)
- ✅ 드롭다운 우선 (선택 가능한 모든 값)
- ✅ 기본값 설정 (가장 일반적인 값)
- ✅ 자동완성 (이전 입력값, 검색 결과)
- ✅ 스마트 기본값 (사용자 정보 기반)

---

## 📝 입력 필드 사용 규칙

### 1. 드롭다운 우선 원칙

**드롭다운 사용 대상** (필수):
- ✅ 상태 (활성/비활성, 진행중/완료 등) → 공통코드 드롭다운
- ✅ 카테고리 (상담 유형, 결제 방법 등) → 공통코드 드롭다운
- ✅ 역할 (관리자, 상담사, 내담자 등) → 공통코드 드롭다운
- ✅ 옵션 (예/아니오, 동의/비동의 등) → 공통코드 드롭다운
- ✅ 공통코드 값 (모든 공통코드) → 공통코드 드롭다운
- ✅ 날짜 범위 (미리 정의된 옵션) → 드롭다운
- ✅ 숫자 범위 (미리 정의된 옵션) → 드롭다운
- ✅ 전화번호 형식 (010, 011 등) → 드롭다운 + 입력
- ✅ 주소 (시/도, 시/군/구) → 드롭다운

**입력 필드 사용 대상** (극히 제한적):
- ✅ 이메일 주소 (검증 필요, 자동완성 권장)
- ✅ 이름 (자유 입력, 자동완성 권장)
- ✅ 메모/설명 (textarea, 선택적)
- ✅ 검색어 (자동완성 필수)
- ✅ 사용자 정의 값 (드롭다운에 없는 경우, 최후의 수단)

### 2. 내담자/사용자 대면 화면 특별 규칙

#### 내담자 등록/수정 화면

**현재 문제점**:
```jsx
// ❌ 나쁜 예: 전화번호 입력 필드
<input type="tel" value={phone} onChange={...} placeholder="010-1234-5678" />

// ❌ 나쁜 예: 상태 입력 필드 (드롭다운이어야 함)
<input type="text" value={status} onChange={...} />
```

**개선 방안**:
```jsx
// ✅ 좋은 예: 전화번호 드롭다운 + 입력
<div className="mg-phone-input">
  <select 
    value={phonePrefix} 
    onChange={(e) => setPhonePrefix(e.target.value)}
    className="mg-select mg-select--phone-prefix"
  >
    <option value="010">010</option>
    <option value="011">011</option>
    <option value="016">016</option>
    <option value="017">017</option>
    <option value="018">018</option>
    <option value="019">019</option>
  </select>
  <input 
    type="tel" 
    value={phoneNumber} 
    onChange={(e) => setPhoneNumber(e.target.value)}
    placeholder="1234-5678"
    className="mg-input mg-input--phone-number"
  />
</div>

// ✅ 좋은 예: 상태 드롭다운 (공통코드)
<CommonCodeSelect
  codeGroup="USER_STATUS"
  value={status}
  onChange={setStatus}
  placeholder="상태 선택"
  defaultValue="ACTIVE" // 기본값: 활성
/>
```

**내담자 등록 화면 필수 사항**:
- ✅ 이메일만 입력 (ID, 비밀번호 자동 생성)
- ✅ 이름 입력 (자동완성 가능하면 제공)
- ✅ 전화번호는 드롭다운 + 입력 (010, 011 등 선택 후 입력)
- ✅ 상태는 드롭다운 (공통코드, 기본값: ACTIVE)
- ✅ 모든 카테고리는 드롭다운

#### 사용자 프로필 화면

**규칙**:
- ✅ 대부분 읽기 전용 (수정은 관리자만)
- ✅ 수정 가능한 필드는 드롭다운 우선
- ✅ 입력 필드는 자동완성 필수

#### 일반 사용자 폼

**규칙**:
- ✅ 최소한의 입력만 요구
- ✅ 자동 채우기 (브라우저 저장값, 세션 정보)
- ✅ 기본값 자동 설정

---

## 🔧 자동 생성 및 기본값 설정

### 자동 생성 대상

**자동 생성**:
- ✅ 사용자 ID (이메일 기반)
- ✅ 비밀번호 (임시 비밀번호 자동 생성)
- ✅ 고유 번호 (UUID, 시퀀스 등)
- ✅ 등록일시 (현재 시간)
- ✅ 수정일시 (현재 시간)

**예시**:
```jsx
// 내담자 등록 시 자동 생성
const handleCreateClient = async (formData) => {
  const clientData = {
    email: formData.email, // 사용자 입력
    name: formData.name, // 사용자 입력
    phone: `${formData.phonePrefix}-${formData.phoneNumber}`, // 드롭다운 + 입력
    status: formData.status || 'ACTIVE', // 기본값: 활성
    role: 'CLIENT', // 자동: 내담자 역할
    tenantId: getCurrentTenantId(), // 자동: 현재 테넌트
    userId: generateUserId(formData.email), // 자동: 이메일 기반
    password: generateTempPassword(), // 자동: 임시 비밀번호
    createdAt: new Date(), // 자동: 현재 시간
  };
  
  await createClient(clientData);
};
```

### 기본값 설정 대상

**기본값 설정**:
- ✅ 상태: "ACTIVE" (활성)
- ✅ 역할: 사용자 유형에 따라 자동 설정
- ✅ 테넌트 ID: 현재 세션의 테넌트
- ✅ 브랜치 코드: 현재 세션의 브랜치
- ✅ 날짜: 오늘 날짜
- ✅ 시간: 현재 시간

**예시**:
```jsx
// 기본값이 포함된 폼 초기화
const initialFormData = {
  email: '',
  name: '',
  phonePrefix: '010', // 기본값: 010
  phoneNumber: '',
  status: 'ACTIVE', // 기본값: 활성
  role: 'CLIENT', // 기본값: 내담자
};
```

---

## 📋 마이그레이션 체크리스트

### 우선순위 1: 내담자/사용자 대면 화면 (최우선)

**내담자 등록 화면**:
- [ ] 전화번호 입력 → 드롭다운 + 입력 (010, 011 등 선택 후 입력)
- [ ] 상태 입력 → 드롭다운 (공통코드, 기본값: ACTIVE)
- [ ] 모든 카테고리 입력 → 드롭다운 (공통코드)

**상담사 등록 화면**:
- [ ] 전화번호 입력 → 드롭다운 + 입력
- [ ] 상태 입력 → 드롭다운 (공통코드)
- [ ] 모든 카테고리 입력 → 드롭다운 (공통코드)

**사용자 프로필 화면**:
- [ ] 모든 선택 필드 → 드롭다운
- [ ] 입력 필드 자동완성 추가

### 우선순위 2: 관리자 화면

- [ ] 상태 입력 → 드롭다운 (공통코드)
- [ ] 카테고리 입력 → 드롭다운 (공통코드)
- [ ] 역할 입력 → 드롭다운 (공통코드)
- [ ] 숫자 입력 → 드롭다운 (범위 옵션)
- [ ] 날짜 입력 → 드롭다운 (미리 정의된 옵션)

---

## 🎯 표준 컴포넌트

### 1. 공통코드 드롭다운

```jsx
import { useCommonCodes } from '@/hooks/useCommonCodes';

const CommonCodeSelect = ({ codeGroup, value, onChange, placeholder, defaultValue }) => {
  const { codes, loading } = useCommonCodes(codeGroup);
  
  return (
    <select
      value={value || defaultValue || ''}
      onChange={(e) => onChange(e.target.value)}
      className="mg-select"
      disabled={loading}
    >
      <option value="">{placeholder || '선택하세요'}</option>
      {codes.map(code => (
        <option key={code.codeValue} value={code.codeValue}>
          {code.codeName}
        </option>
      ))}
    </select>
  );
};
```

### 2. 전화번호 입력 (드롭다운 + 입력)

```jsx
const PhoneInput = ({ value, onChange, className }) => {
  const [prefix, setPrefix] = useState('010');
  const [number, setNumber] = useState('');
  
  useEffect(() => {
    if (value) {
      const [p, n] = value.split('-');
      setPrefix(p || '010');
      setNumber(n || '');
    }
  }, [value]);
  
  const handleChange = (newPrefix, newNumber) => {
    setPrefix(newPrefix);
    setNumber(newNumber);
    onChange(`${newPrefix}-${newNumber}`);
  };
  
  return (
    <div className={`mg-phone-input ${className || ''}`}>
      <select
        value={prefix}
        onChange={(e) => handleChange(e.target.value, number)}
        className="mg-select mg-select--phone-prefix"
      >
        <option value="010">010</option>
        <option value="011">011</option>
        <option value="016">016</option>
        <option value="017">017</option>
        <option value="018">018</option>
        <option value="019">019</option>
      </select>
      <input
        type="tel"
        value={number}
        onChange={(e) => handleChange(prefix, e.target.value)}
        placeholder="1234-5678"
        className="mg-input mg-input--phone-number"
      />
    </div>
  );
};
```

---

## ✅ 검증 체크리스트

### 내담자/사용자 대면 화면 검증

- [ ] 입력 필드가 최소한인가? (이메일, 이름만)
- [ ] 전화번호가 드롭다운 + 입력인가?
- [ ] 상태가 드롭다운인가?
- [ ] 모든 카테고리가 드롭다운인가?
- [ ] ID, 비밀번호가 자동 생성되는가?
- [ ] 기본값이 설정되어 있는가?
- [ ] 자동완성이 제공되는가?

### 관리자 화면 검증

- [ ] 선택 가능한 값이 드롭다운인가?
- [ ] 입력 필드가 정말 필요한가?
- [ ] 기본값이 설정되어 있는가?

---

## 📊 성공 지표

1. ✅ 내담자 등록 시 입력 필드 2개 이하 (이메일, 이름)
2. ✅ 모든 선택 필드가 드롭다운
3. ✅ 전화번호가 드롭다운 + 입력
4. ✅ ID, 비밀번호 자동 생성
5. ✅ 기본값 자동 설정
6. ✅ 사용자 만족도 향상

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-09

