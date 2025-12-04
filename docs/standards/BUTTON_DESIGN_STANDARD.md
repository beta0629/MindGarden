# 버튼 디자인 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 버튼 디자인 표준입니다.  
모든 버튼은 통일된 디자인, 호버 효과, 색상을 사용해야 합니다.

### 참조 문서
- [프론트엔드 개발 표준](./FRONTEND_DEVELOPMENT_STANDARD.md)
- [디자인 중앙화 표준](./DESIGN_CENTRALIZATION_STANDARD.md)
- [반응형 레이아웃 표준](./RESPONSIVE_LAYOUT_STANDARD.md)

### 구현 위치
- **표준 버튼 컴포넌트**: `frontend/src/components/ui/Button/Button.js`
- **버튼 스타일**: `frontend/src/components/ui/Button/Button.css`
- **디자인 토큰**: `frontend/src/styles/unified-design-tokens.css`

---

## 🎯 버튼 디자인 원칙

### 1. 통일된 버튼 컴포넌트 사용
```
모든 버튼은 표준 버튼 컴포넌트 사용
```

**원칙**:
- ✅ `Button` 컴포넌트 사용 (ui/Button)
- ✅ 표준 variant 및 size 사용
- ✅ 일관된 호버 효과
- ✅ 일관된 색상 체계
- ❌ 커스텀 버튼 컴포넌트 금지
- ❌ 인라인 스타일 버튼 금지

### 2. 일관된 호버 효과
```
모든 버튼은 동일한 호버 효과 사용
```

**원칙**:
- ✅ 배경색 어둡게 (darken)
- ✅ 약간 위로 이동 (translateY)
- ✅ 그림자 증가
- ✅ 부드러운 전환 (transition)
- ❌ 각기 다른 호버 효과 금지

### 3. 표준 색상 체계
```
모든 버튼은 표준 색상 변수 사용
```

**원칙**:
- ✅ CSS 변수로 색상 관리
- ✅ Primary, Secondary, Success, Danger 등 표준 variant
- ✅ 일관된 색상 톤
- ❌ 하드코딩된 색상 값 금지

---

## 🎨 버튼 Variant (변형)

### 1. 표준 Variant

| Variant | 색상 | 사용 용도 |
|---------|------|----------|
| `primary` | Primary 색상 | 주요 액션 (저장, 확인, 제출) |
| `secondary` | Secondary 색상 | 보조 액션 |
| `success` | Success 색상 | 성공 관련 액션 |
| `danger` | Error 색상 | 삭제, 취소 등 위험한 액션 |
| `warning` | Warning 색상 | 경고 관련 액션 |
| `info` | Info 색상 | 정보 제공 액션 |
| `outline` | 투명 배경 + 테두리 | 부드러운 액션 |
| `ghost` | 투명 배경 | 최소한의 액션 |

### 2. Variant 구현

#### 기본 구조
```javascript
import { Button } from '../ui/Button/Button';

// Primary 버튼
<Button variant="primary">저장</Button>

// Secondary 버튼
<Button variant="secondary">취소</Button>

// Danger 버튼
<Button variant="danger">삭제</Button>

// Outline 버튼
<Button variant="outline">보기</Button>

// Ghost 버튼
<Button variant="ghost">더보기</Button>
```

#### CSS 구현
```css
/* Primary 버튼 */
.mg-button--primary {
    background-color: var(--mg-primary-500);
    color: var(--mg-white);
    border: 1px solid var(--mg-primary-500);
}

.mg-button--primary:hover:not(.mg-button--disabled) {
    background-color: var(--mg-primary-600);
    border-color: var(--mg-primary-600);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.mg-button--primary:active:not(.mg-button--disabled) {
    background-color: var(--mg-primary-700);
    transform: translateY(0);
}

/* Secondary 버튼 */
.mg-button--secondary {
    background-color: var(--mg-gray-100);
    color: var(--mg-gray-900);
    border: 1px solid var(--mg-gray-300);
}

.mg-button--secondary:hover:not(.mg-button--disabled) {
    background-color: var(--mg-gray-200);
    border-color: var(--mg-gray-400);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Danger 버튼 */
.mg-button--danger {
    background-color: var(--mg-error-500);
    color: var(--mg-white);
    border: 1px solid var(--mg-error-500);
}

.mg-button--danger:hover:not(.mg-button--disabled) {
    background-color: var(--mg-error-600);
    border-color: var(--mg-error-600);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* Outline 버튼 */
.mg-button--outline {
    background-color: transparent;
    color: var(--mg-primary-500);
    border: 1px solid var(--mg-primary-500);
}

.mg-button--outline:hover:not(.mg-button--disabled) {
    background-color: var(--mg-primary-50);
    color: var(--mg-primary-600);
    border-color: var(--mg-primary-600);
    transform: translateY(-1px);
}

/* Ghost 버튼 */
.mg-button--ghost {
    background-color: transparent;
    color: var(--mg-gray-700);
    border: 1px solid transparent;
}

.mg-button--ghost:hover:not(.mg-button--disabled) {
    background-color: var(--mg-gray-100);
    color: var(--mg-gray-900);
}
```

---

## 📏 버튼 Size (크기)

### 1. 표준 Size

| Size | 높이 | 패딩 | 폰트 크기 | 사용 용도 |
|------|------|------|----------|----------|
| `small` | 32px | 8px 16px | 14px | 컴팩트한 공간 |
| `medium` | 40px | 12px 20px | 16px | 기본 크기 (기본값) |
| `large` | 48px | 16px 24px | 18px | 강조가 필요한 액션 |

### 2. Size 구현

#### 기본 구조
```javascript
<Button size="small">작은 버튼</Button>
<Button size="medium">기본 버튼</Button>
<Button size="large">큰 버튼</Button>
```

#### CSS 구현
```css
/* Small 버튼 */
.mg-button--small {
    padding: var(--mg-spacing-xs) var(--mg-spacing-md);
    font-size: var(--mg-font-size-sm);
    min-height: 32px;
    line-height: 1.4;
}

/* Medium 버튼 (기본) */
.mg-button--medium {
    padding: var(--mg-spacing-sm) var(--mg-spacing-lg);
    font-size: var(--mg-font-size-base);
    min-height: 40px;
    line-height: 1.5;
}

/* Large 버튼 */
.mg-button--large {
    padding: var(--mg-spacing-md) var(--mg-spacing-xl);
    font-size: var(--mg-font-size-lg);
    min-height: 48px;
    line-height: 1.5;
}
```

---

## 🎯 호버 효과 표준

### 1. 공통 호버 효과

모든 버튼은 다음 호버 효과를 적용합니다:

```css
.mg-button {
    transition: all 0.2s ease-in-out;
}

.mg-button:hover:not(.mg-button--disabled) {
    /* 1. 배경색 어둡게 */
    background-color: var(--variant-color-dark);
    
    /* 2. 약간 위로 이동 */
    transform: translateY(-1px);
    
    /* 3. 그림자 증가 */
    box-shadow: 0 4px 12px rgba(var(--variant-color-rgb), 0.3);
}

.mg-button:active:not(.mg-button--disabled) {
    /* 클릭 시 원래 위치로 */
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(var(--variant-color-rgb), 0.2);
}

.mg-button:focus-visible {
    /* 포커스 링 */
    outline: 2px solid var(--mg-primary-500);
    outline-offset: 2px;
}
```

### 2. 호버 효과 변형별 적용

#### Primary 버튼
```css
.mg-button--primary:hover:not(.mg-button--disabled) {
    background-color: var(--mg-primary-600);
    border-color: var(--mg-primary-600);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
```

#### Danger 버튼
```css
.mg-button--danger:hover:not(.mg-button--disabled) {
    background-color: var(--mg-error-600);
    border-color: var(--mg-error-600);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
```

#### Outline 버튼
```css
.mg-button--outline:hover:not(.mg-button--disabled) {
    background-color: var(--mg-primary-50);
    color: var(--mg-primary-600);
    border-color: var(--mg-primary-600);
    transform: translateY(-1px);
}
```

---

## 🎨 색상 체계

### 1. 표준 색상 변수

```css
:root {
    /* Primary */
    --mg-primary-500: #3b82f6;
    --mg-primary-600: #2563eb;
    --mg-primary-700: #1d4ed8;
    --mg-primary-50: #eff6ff;
    
    /* Error/Danger */
    --mg-error-500: #ef4444;
    --mg-error-600: #dc2626;
    --mg-error-50: #fef2f2;
    
    /* Success */
    --mg-success-500: #10b981;
    --mg-success-600: #059669;
    --mg-success-50: #ecfdf5;
    
    /* Warning */
    --mg-warning-500: #f59e0b;
    --mg-warning-600: #d97706;
    --mg-warning-50: #fffbeb;
    
    /* Info */
    --mg-info-500: #3b82f6;
    --mg-info-600: #2563eb;
    --mg-info-50: #eff6ff;
    
    /* Neutral */
    --mg-gray-50: #f9fafb;
    --mg-gray-100: #f3f4f6;
    --mg-gray-200: #e5e7eb;
    --mg-gray-300: #d1d5db;
    --mg-gray-700: #374151;
    --mg-gray-900: #111827;
    
    /* Base */
    --mg-white: #ffffff;
    --mg-black: #000000;
}
```

### 2. 색상 사용 규칙

```css
/* ✅ 권장: CSS 변수 사용 */
.mg-button--primary {
    background-color: var(--mg-primary-500);
}

/* ❌ 금지: 하드코딩된 색상 */
.mg-button--primary {
    background-color: #3b82f6; /* 금지 */
}
```

---

## 📦 버튼 컴포넌트 사용법

### 1. 기본 사용법

```javascript
import { Button } from '../ui/Button/Button';

// 기본 버튼 (primary, medium)
<Button>저장</Button>

// Variant 지정
<Button variant="primary">저장</Button>
<Button variant="danger">삭제</Button>
<Button variant="outline">취소</Button>

// Size 지정
<Button size="small">작은 버튼</Button>
<Button size="large">큰 버튼</Button>

// 비활성화
<Button disabled>비활성</Button>

// 로딩 상태
<Button loading>처리 중...</Button>

// 전체 너비
<Button fullWidth>전체 너비</Button>
```

### 2. 아이콘 버튼

```javascript
import { Button } from '../ui/Button/Button';
import { Save, Trash, Edit } from 'lucide-react';

// 텍스트 + 아이콘
<Button>
    <Save className="mg-button-icon" />
    저장
</Button>

// 아이콘만
<Button variant="ghost" size="small">
    <Edit className="mg-button-icon" />
</Button>
```

### 3. 버튼 그룹

```javascript
<div className="button-group">
    <Button variant="primary">저장</Button>
    <Button variant="outline">취소</Button>
    <Button variant="danger">삭제</Button>
</div>
```

```css
.button-group {
    display: flex;
    gap: 12px;
    align-items: center;
}

/* 반응형: 모바일에서 세로 배치 */
@media (max-width: 768px) {
    .button-group {
        flex-direction: column;
        width: 100%;
    }
    
    .button-group .mg-button {
        width: 100%;
    }
}
```

---

## 🚫 금지 사항

### 1. 커스텀 버튼 컴포넌트 금지
```javascript
// ❌ 금지: 새로운 버튼 컴포넌트 생성
const MyCustomButton = () => {
    return <button style={{ /* 커스텀 스타일 */ }}>버튼</button>;
};

// ✅ 권장: 표준 버튼 컴포넌트 사용
import { Button } from '../ui/Button/Button';
<Button variant="primary">버튼</Button>
```

### 2. 인라인 스타일 버튼 금지
```javascript
// ❌ 금지: 인라인 스타일
<button style={{ backgroundColor: '#3b82f6', color: 'white' }}>
    버튼
</button>

// ✅ 권장: 표준 컴포넌트
<Button variant="primary">버튼</Button>
```

### 3. 하드코딩된 색상 금지
```css
/* ❌ 금지: 하드코딩된 색상 */
.my-button {
    background-color: #3b82f6;
    color: #ffffff;
}

/* ✅ 권장: CSS 변수 사용 */
.my-button {
    background-color: var(--mg-primary-500);
    color: var(--mg-white);
}
```

### 4. 일관되지 않은 호버 효과 금지
```css
/* ❌ 금지: 각기 다른 호버 효과 */
.button1:hover {
    transform: scale(1.1);
}

.button2:hover {
    background-color: red;
}

.button3:hover {
    opacity: 0.5;
}

/* ✅ 권장: 표준 호버 효과 */
.mg-button:hover:not(.mg-button--disabled) {
    background-color: var(--variant-color-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--variant-color-rgb), 0.3);
}
```

---

## ✅ 체크리스트

### 버튼 구현 시
- [ ] 표준 Button 컴포넌트 사용
- [ ] 표준 variant 사용 (primary, secondary, danger 등)
- [ ] 표준 size 사용 (small, medium, large)
- [ ] 표준 호버 효과 적용
- [ ] CSS 변수로 색상 관리
- [ ] 비활성화 상태 처리
- [ ] 접근성 고려 (키보드 네비게이션, 포커스)

### 버튼 디자인 검토 시
- [ ] 모든 버튼이 동일한 스타일
- [ ] 호버 효과 일관성
- [ ] 색상 체계 일관성
- [ ] 크기 일관성
- [ ] 간격 일관성

---

## 💡 베스트 프랙티스

### 1. 버튼 그룹 레이아웃
```javascript
// 기본: 가로 배치
<div className="button-group">
    <Button variant="primary">저장</Button>
    <Button variant="outline">취소</Button>
</div>

// 반응형: 모바일에서 세로 배치
<div className="button-group button-group--responsive">
    <Button variant="primary" fullWidth>저장</Button>
    <Button variant="outline" fullWidth>취소</Button>
</div>
```

### 2. 버튼 상태 관리
```javascript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
    setLoading(true);
    try {
        await submitForm();
    } finally {
        setLoading(false);
    }
};

<Button 
    variant="primary" 
    loading={loading}
    onClick={handleSubmit}
>
    저장
</Button>
```

### 3. 버튼 접근성
```javascript
<Button
    variant="primary"
    aria-label="저장하기"
    aria-busy={loading}
>
    {loading ? '저장 중...' : '저장'}
</Button>
```

---

---

## 🔌 API 연동 시 버튼 사용

API 연동 시 반드시 표준 버튼 컴포넌트를 사용하고 2중 클릭 방지를 활성화해야 합니다.

### 관련 표준 문서
자세한 내용은 [API 연동 표준](./API_INTEGRATION_STANDARD.md)을 참조하세요.

### 핵심 원칙
1. **표준 버튼 사용**: API 연동 시 반드시 `Button` 컴포넌트 사용
2. **2중 클릭 방지**: `preventDoubleClick={true}` (기본값)
3. **로딩 상태 표시**: `loading` prop으로 API 호출 상태 표시

### 빠른 예시
```javascript
import { Button } from '../ui/Button/Button';

const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
    try {
        setLoading(true);
        await apiPost('/api/v1/data', formData);
    } finally {
        setLoading(false);
    }
};

// ✅ 권장: 표준 버튼 + 2중 클릭 방지 + 로딩 상태
<Button
    variant="primary"
    loading={loading}
    loadingText="저장 중..."
    onClick={handleSubmit}
    preventDoubleClick={true}
>
    저장
</Button>
```

---

## 📞 문의

버튼 디자인 표준 관련 문의:
- 프론트엔드 팀
- UX 팀

**최종 업데이트**: 2025-12-03

