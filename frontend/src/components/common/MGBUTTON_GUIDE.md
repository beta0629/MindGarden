# 🚀 MGButton 사용법 가이드

## 📋 개요
`MGButton`은 MindGarden 디자인 시스템의 공통 버튼 컴포넌트로, **중복 클릭 방지**와 **로딩 상태 표시** 기능을 제공합니다.

## 🎯 주요 기능
- ✅ **중복 클릭 방지** - 버튼 연속 클릭 방지
- ✅ **로딩 상태 표시** - 처리 중일 때 로딩 스피너 표시
- ✅ **다양한 스타일** - primary, secondary, success, danger, warning, info, outline
- ✅ **다양한 크기** - small, medium, large
- ✅ **접근성 지원** - 키보드 네비게이션 및 스크린 리더 지원
- ✅ **반응형 디자인** - 모바일/태블릿/데스크탑 대응

## 📦 Import 방법

```javascript
// 방법 1: 직접 import
import MGButton from '../common/MGButton';

// 방법 2: UI 라이브러리에서 import
import { MGButton } from '../ui';
```

## 🎨 기본 사용법

### 1. 기본 버튼
```javascript
<MGButton onClick={() => console.log('클릭!')}>
  기본 버튼
</MGButton>
```

### 2. 다양한 스타일
```javascript
<MGButton variant="primary">Primary</MGButton>
<MGButton variant="secondary">Secondary</MGButton>
<MGButton variant="success">Success</MGButton>
<MGButton variant="danger">Danger</MGButton>
<MGButton variant="warning">Warning</MGButton>
<MGButton variant="info">Info</MGButton>
<MGButton variant="outline">Outline</MGButton>
```

### 3. 다양한 크기
```javascript
<MGButton size="small">Small</MGButton>
<MGButton size="medium">Medium</MGButton>
<MGButton size="large">Large</MGButton>
```

## 🔒 중복 클릭 방지

### 기본 설정 (권장)
```javascript
<MGButton 
  onClick={handleSubmit}
  preventDoubleClick={true}  // 기본값: true
  clickDelay={1000}          // 기본값: 1000ms
>
  제출하기
</MGButton>
```

### 커스텀 대기 시간
```javascript
<MGButton 
  onClick={handleQuickAction}
  preventDoubleClick={true}
  clickDelay={500}  // 0.5초 대기
>
  빠른 실행
</MGButton>
```

### 중복 클릭 방지 비활성화
```javascript
<MGButton 
  onClick={handleMultipleClicks}
  preventDoubleClick={false}
>
  연속 클릭 허용
</MGButton>
```

## ⏳ 로딩 상태 표시

### 기본 로딩 상태
```javascript
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await submitData();
  } finally {
    setIsLoading(false);
  }
};

<MGButton 
  loading={isLoading}
  loadingText="저장 중..."
  onClick={handleSubmit}
>
  저장하기
</MGButton>
```

### 커스텀 로딩 텍스트
```javascript
<MGButton 
  loading={isLoading}
  loadingText="데이터 처리 중..."
  onClick={handleProcess}
>
  처리하기
</MGButton>
```

## 🎯 실제 사용 예시

### 1. 폼 제출 버튼
```javascript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleFormSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    await apiPost('/api/submit', formData);
    notificationManager.success('저장되었습니다.');
  } catch (error) {
    notificationManager.error('저장에 실패했습니다.');
  } finally {
    setIsSubmitting(false);
  }
};

<MGButton 
  type="submit"
  variant="primary"
  size="large"
  loading={isSubmitting}
  loadingText="저장 중..."
  onClick={handleFormSubmit}
  preventDoubleClick={true}
  clickDelay={2000}
>
  저장하기
</MGButton>
```

### 2. 삭제 확인 버튼
```javascript
const [isDeleting, setIsDeleting] = useState(false);

const handleDelete = async () => {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  
  setIsDeleting(true);
  try {
    await apiDelete(`/api/items/${itemId}`);
    notificationManager.success('삭제되었습니다.');
  } catch (error) {
    notificationManager.error('삭제에 실패했습니다.');
  } finally {
    setIsDeleting(false);
  }
};

<MGButton 
  variant="danger"
  size="small"
  loading={isDeleting}
  loadingText="삭제 중..."
  onClick={handleDelete}
  preventDoubleClick={true}
  clickDelay={3000}
>
  삭제
</MGButton>
```

### 3. 검색 버튼
```javascript
const [isSearching, setIsSearching] = useState(false);

const handleSearch = async () => {
  setIsSearching(true);
  try {
    const results = await apiGet(`/api/search?q=${searchTerm}`);
    setSearchResults(results);
  } finally {
    setIsSearching(false);
  }
};

<MGButton 
  variant="primary"
  size="medium"
  loading={isSearching}
  loadingText="검색 중..."
  onClick={handleSearch}
  preventDoubleClick={true}
  clickDelay={1000}
>
  <Search size={16} />
  검색
</MGButton>
```

## 🔧 Props 전체 목록

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | 'primary' | 버튼 스타일 (primary, secondary, success, danger, warning, info, outline) |
| `size` | string | 'medium' | 버튼 크기 (small, medium, large) |
| `disabled` | boolean | false | 비활성화 상태 |
| `loading` | boolean | false | 로딩 상태 |
| `loadingText` | string | '처리 중...' | 로딩 중 표시 텍스트 |
| `preventDoubleClick` | boolean | true | 중복 클릭 방지 여부 |
| `clickDelay` | number | 1000 | 클릭 후 대기 시간 (ms) |
| `onClick` | function | - | 클릭 핸들러 |
| `className` | string | '' | 추가 CSS 클래스 |
| `type` | string | 'button' | 버튼 타입 (button, submit, reset) |
| `children` | ReactNode | - | 버튼 내용 |
| `style` | object | {} | 인라인 스타일 |
| `title` | string | '' | 툴팁 텍스트 |
| `fullWidth` | boolean | false | 전체 너비 사용 여부 |

## 🎨 CSS 클래스

### 기본 클래스
- `.mg-button` - 기본 버튼 클래스
- `.mg-button--disabled` - 비활성화 상태
- `.mg-button--full-width` - 전체 너비

### 크기 클래스
- `.mg-button--small`
- `.mg-button--medium`
- `.mg-button--large`

### 스타일 클래스
- `.mg-button--primary`
- `.mg-button--secondary`
- `.mg-button--success`
- `.mg-button--danger`
- `.mg-button--warning`
- `.mg-button--info`
- `.mg-button--outline`

## 🌙 다크 테마 지원
MGButton은 자동으로 다크 테마를 감지하고 적절한 스타일을 적용합니다.

## 📱 반응형 디자인
모바일, 태블릿, 데스크탑에서 최적화된 크기와 스타일을 제공합니다.

## ⚠️ 주의사항
1. **비동기 함수**: `onClick` 핸들러가 비동기 함수인 경우 `async/await` 사용
2. **에러 처리**: try-catch로 에러 처리 권장
3. **로딩 상태**: 로딩 상태는 반드시 `finally` 블록에서 해제
4. **접근성**: 중요한 버튼에는 `title` prop으로 툴팁 제공

## 🔄 기존 버튼에서 마이그레이션

### Before (기존 방식)
```javascript
<button 
  className="mg-button mg-button-primary"
  onClick={handleClick}
  disabled={isLoading}
>
  {isLoading ? '처리 중...' : '제출하기'}
</button>
```

### After (MGButton 사용)
```javascript
<MGButton 
  variant="primary"
  loading={isLoading}
  loadingText="처리 중..."
  onClick={handleClick}
  preventDoubleClick={true}
>
  제출하기
</MGButton>
```

## 🚀 마이그레이션 체크리스트
- [ ] 기존 `button` 태그를 `MGButton`으로 교체
- [ ] `className`을 `variant`와 `size`로 변경
- [ ] 로딩 상태 로직을 `loading` prop으로 변경
- [ ] `preventDoubleClick` 설정 확인
- [ ] `clickDelay` 적절히 설정
- [ ] 접근성을 위한 `title` 추가
- [ ] 테스트 및 검증
