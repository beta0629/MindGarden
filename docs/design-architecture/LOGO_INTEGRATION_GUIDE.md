# 로고 통합 가이드 (Logo Integration Guide)

## 개요

이 문서는 향후 커스텀 로고가 제작될 때 `UnifiedHeader` 컴포넌트에 쉽게 적용할 수 있도록 하는 확장성 가이드입니다.

## 로고 타입별 적용 방법

### 1. 텍스트 로고 (기본)

```jsx
<UnifiedHeader
  title="MindGarden"
  logoType="text"
/>
```

**특징:**
- 기본 브랜드명 표시
- 반응형 폰트 크기 조정
- 부제목 "마음의 정원" 자동 표시

### 2. 이미지 로고

```jsx
<UnifiedHeader
  logoType="image"
  logoImage="/assets/logo.png"
  logoAlt="MindGarden 로고"
/>
```

**요구사항:**
- 권장 크기: 200px × 40px (최대)
- 지원 형식: PNG, JPG, SVG
- 투명 배경 권장
- 고해상도 대응 (2x, 3x)

**파일 구조:**
```
public/
├── assets/
│   ├── logo.png          (기본 로고)
│   ├── logo@2x.png       (고해상도)
│   ├── logo-dark.png     (다크 모드용)
│   └── logo-dark@2x.png  (다크 모드 고해상도)
```

### 3. 커스텀 로고 (SVG/HTML)

```jsx
const customLogo = `
  <svg width="120" height="40" viewBox="0 0 120 40">
    <!-- SVG 내용 -->
  </svg>
`;

<UnifiedHeader
  logoType="custom"
  logoImage={customLogo}
  logoAlt="MindGarden 커스텀 로고"
/>
```

**장점:**
- 벡터 기반으로 모든 해상도에서 선명
- CSS로 색상 변경 가능
- 애니메이션 효과 추가 가능
- 파일 크기 최적화

## 반응형 디자인

### 브레이크포인트별 로고 크기

| 화면 크기 | 로고 높이 | 폰트 크기 |
|-----------|-----------|-----------|
| 데스크톱 (1200px+) | 40px | 20px |
| 태블릿 (768px-1199px) | 32px | 18px |
| 모바일 (480px-767px) | 32px | 16px |
| 소형 모바일 (<480px) | 28px | 14px |

### 자동 조정 기능

- 화면 크기에 따른 자동 크기 조정
- 모바일에서 부제목 자동 숨김
- 터치 친화적 클릭 영역 확보

## 다크 모드 지원

### 자동 다크 모드 감지

```css
@media (prefers-color-scheme: dark) {
  .mg-header__logo-text {
    color: var(--color-primary-light);
  }
}
```

### 다크 모드용 로고

```jsx
<UnifiedHeader
  logoType="image"
  logoImage={isDarkMode ? '/assets/logo-dark.png' : '/assets/logo-light.png'}
/>
```

## 애니메이션 효과

### 호버 효과

```css
.mg-header__logo--animated:hover .mg-header__logo-text {
  animation: logoGlow 0.6s ease-in-out;
}
```

### 커스텀 애니메이션

```jsx
<UnifiedHeader
  logoType="custom"
  logoImage={`
    <svg>
      <g className="logo-animation">
        <!-- 애니메이션 가능한 SVG 요소 -->
      </g>
    </svg>
  `}
  className="mg-header--animated"
/>
```

## 접근성 고려사항

### 스크린 리더 지원

```jsx
<UnifiedHeader
  logoImage="/logo.png"
  logoAlt="MindGarden - 마음의 정원 상담센터"
/>
```

### 키보드 네비게이션

- Tab 키로 로고 포커스 가능
- Enter/Space로 클릭 동작
- 포커스 시 시각적 표시

### 색상 대비

- WCAG 2.1 AA 기준 준수
- 최소 4.5:1 대비율 유지
- 색맹 사용자 고려

## 성능 최적화

### 이미지 최적화

```jsx
// WebP 형식 우선 사용
const logoImage = isWebPSupported 
  ? '/assets/logo.webp' 
  : '/assets/logo.png';

<UnifiedHeader
  logoType="image"
  logoImage={logoImage}
/>
```

### 지연 로딩

```jsx
// 큰 로고 파일의 경우 지연 로딩
const [logoLoaded, setLogoLoaded] = useState(false);

useEffect(() => {
  const img = new Image();
  img.onload = () => setLogoLoaded(true);
  img.src = '/assets/logo-large.png';
}, []);
```

## 브랜딩 가이드라인

### 색상 팔레트

```css
:root {
  /* 기본 브랜드 색상 */
  --color-primary: #3B82F6;
  --color-primary-light: #60A5FA;
  --color-primary-dark: #1D4ED8;
  
  /* 보조 색상 */
  --color-accent: #8B5CF6;
  --color-secondary: #10B981;
}
```

### 타이포그래피

```css
.mg-header__logo-text {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
}
```

### 간격 및 크기

- 로고와 텍스트 간 최소 간격: 16px
- 로고 최대 너비: 200px
- 로고 최대 높이: 40px (컴팩트: 32px)

## 구현 예시

### 기본 사용법

```jsx
import UnifiedHeader from '../common/UnifiedHeader';

function App() {
  return (
    <div>
      <UnifiedHeader
        title="MindGarden"
        logoType="text"
        showUserMenu={true}
        showHamburger={true}
      />
      {/* 페이지 콘텐츠 */}
    </div>
  );
}
```

### 커스텀 로고 적용

```jsx
import UnifiedHeader from '../common/UnifiedHeader';

function App() {
  const customLogo = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="
        width: 32px; 
        height: 32px; 
        background: linear-gradient(135deg, #3B82F6, #8B5CF6);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">M</div>
      <span style="font-weight: 700; color: #1f2937;">MindGarden</span>
    </div>
  `;

  return (
    <div>
      <UnifiedHeader
        logoType="custom"
        logoImage={customLogo}
        logoAlt="MindGarden 로고"
      />
    </div>
  );
}
```

### 조건부 로고 표시

```jsx
import UnifiedHeader from '../common/UnifiedHeader';

function App() {
  const [logoConfig, setLogoConfig] = useState({
    type: 'text',
    image: '',
    title: 'MindGarden'
  });

  // 로고 설정 로드
  useEffect(() => {
    const config = localStorage.getItem('logoConfig');
    if (config) {
      setLogoConfig(JSON.parse(config));
    }
  }, []);

  return (
    <div>
      <UnifiedHeader
        logoType={logoConfig.type}
        logoImage={logoConfig.image}
        title={logoConfig.title}
        onLogoClick={() => {
          // 로고 클릭 시 특별 동작
          console.log('Logo clicked!');
        }}
      />
    </div>
  );
}
```

## 마이그레이션 가이드

### 기존 헤더에서 UnifiedHeader로 전환

1. **기존 헤더 컴포넌트 확인**
   ```jsx
   // 기존: SimpleHeader, ErpHeader, DashboardHeader 등
   import SimpleHeader from '../layout/SimpleHeader';
   ```

2. **UnifiedHeader로 교체**
   ```jsx
   // 새로운: UnifiedHeader
   import UnifiedHeader from '../common/UnifiedHeader';
   ```

3. **Props 매핑**
   ```jsx
   // 기존
   <SimpleHeader title="대시보드" />
   
   // 새로운
   <UnifiedHeader 
     title="대시보드"
     logoType="text"
     variant="default"
   />
   ```

## 테스트 방법

### 로고 테스트 페이지

```
http://localhost:3000/test/header
```

**테스트 항목:**
- 로고 타입별 표시 확인
- 반응형 크기 조정 테스트
- 다크 모드 전환 테스트
- 접근성 기능 테스트
- 성능 최적화 확인

### 자동화 테스트

```javascript
// Jest 테스트 예시
describe('UnifiedHeader Logo', () => {
  test('renders text logo correctly', () => {
    render(<UnifiedHeader logoType="text" title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('renders image logo correctly', () => {
    render(<UnifiedHeader logoType="image" logoImage="/test-logo.png" />);
    expect(screen.getByAltText('MindGarden')).toBeInTheDocument();
  });
});
```

## 향후 확장 계획

### 계획된 기능

1. **로고 관리 시스템**
   - 관리자 페이지에서 로고 업로드/변경
   - A/B 테스트를 위한 로고 버전 관리
   - 로고 사용 통계 및 분석

2. **고급 애니메이션**
   - 페이지 전환 시 로고 애니메이션
   - 로딩 상태 표시
   - 인터랙티브 효과

3. **다국어 지원**
   - 언어별 다른 로고 표시
   - 지역별 브랜딩 적용
   - RTL 언어 지원

## 문제 해결

### 자주 발생하는 문제

1. **로고가 표시되지 않는 경우**
   ```jsx
   // 해결책: 이미지 경로 확인
   <UnifiedHeader 
     logoType="image" 
     logoImage="/assets/logo.png" // 올바른 경로인지 확인
   />
   ```

2. **로고 크기가 맞지 않는 경우**
   ```css
   /* 해결책: CSS 오버라이드 */
   .mg-header__logo--image {
     height: 48px !important; /* 원하는 크기로 조정 */
   }
   ```

3. **모바일에서 로고가 잘리는 경우**
   ```css
   /* 해결책: 모바일 전용 스타일 */
   @media (max-width: 768px) {
     .mg-header__logo--image {
       max-width: 150px;
       height: 28px;
     }
   }
   ```

## 참고 자료

- [UnifiedHeader 컴포넌트 소스](../frontend/src/components/common/UnifiedHeader.js)
- [헤더 스타일 정의](../frontend/src/styles/06-components/_header.css)
- [테스트 페이지](../frontend/src/components/test/UnifiedHeaderTest.js)
- [공통 컴포넌트 통합 가이드](./COMMON_COMPONENTS_UNIFICATION_GUIDE.md)

---

**작성자:** MindGarden Development Team  
**최종 수정:** 2025-01-02  
**버전:** 1.0.0
