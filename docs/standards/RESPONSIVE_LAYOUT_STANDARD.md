# 반응형 레이아웃 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 반응형 레이아웃 표준입니다.  
모든 페이지와 컴포넌트는 다양한 화면 크기에 대응하는 반응형 레이아웃을 구현해야 합니다.

### 참조 문서
- [프론트엔드 개발 표준](./FRONTEND_DEVELOPMENT_STANDARD.md)
- [디자인 중앙화 표준](./DESIGN_CENTRALIZATION_STANDARD.md)
- [리스트 UI 카드 형태 표준](./LIST_UI_CARD_STANDARD.md)

### 구현 위치
- **반응형 훅**: `frontend/src/hooks/useResponsive.js`
- **브레이크포인트**: `frontend/src/constants/breakpoints.js`
- **반응형 유틸리티**: `frontend/src/styles/08-utilities/_responsive.css`

---

## 🎯 반응형 레이아웃 원칙

### 1. 모바일 우선 (Mobile First)
```
모바일 화면을 기준으로 디자인하고, 큰 화면으로 확장
```

**원칙**:
- ✅ 모바일 화면을 기본으로 설계
- ✅ 작은 화면에서 큰 화면으로 확장
- ✅ 점진적 향상 (Progressive Enhancement)
- ❌ 데스크톱 중심 설계 금지

### 2. 모든 페이지 반응형 필수
```
모든 페이지와 컴포넌트는 반응형으로 구현
```

**원칙**:
- ✅ 모든 페이지 반응형 구현
- ✅ 모든 컴포넌트 반응형 지원
- ✅ 모든 레이아웃 반응형 적용
- ❌ 고정 너비 레이아웃 금지

### 3. 일관된 브레이크포인트
```
프로젝트 전체에서 동일한 브레이크포인트 사용
```

**원칙**:
- ✅ 표준 브레이크포인트 사용
- ✅ 브레이크포인트 상수화
- ✅ 일관된 미디어 쿼리

---

## 📱 브레이크포인트

### 1. 표준 브레이크포인트

| 디바이스 | 너비 | 클래스 접두사 | 설명 |
|---------|------|--------------|------|
| 모바일 | ~767px | `mobile` | 스마트폰 |
| 태블릿 | 768px~1023px | `tablet` | 태블릿 |
| 데스크톱 | 1024px~1439px | `desktop` | 일반 데스크톱 |
| 대형 데스크톱 | 1440px~ | `large` | 대형 모니터 |

### 2. 브레이크포인트 상수

```javascript
// constants/breakpoints.js
export const BREAKPOINTS = {
    MOBILE: 0,
    TABLET: 768,
    DESKTOP: 1024,
    LARGE: 1440,
    XLARGE: 1920
};

export const DEVICE_TYPES = {
    MOBILE: 'mobile',
    TABLET: 'tablet',
    DESKTOP: 'desktop',
    LARGE: 'large',
    XLARGE: 'xlarge'
};
```

### 3. 미디어 쿼리

```css
/* 모바일 (기본) */
.element {
    width: 100%;
}

/* 태블릿 이상 */
@media (min-width: 768px) {
    .element {
        width: 50%;
    }
}

/* 데스크톱 이상 */
@media (min-width: 1024px) {
    .element {
        width: 33.333%;
    }
}

/* 대형 데스크톱 이상 */
@media (min-width: 1440px) {
    .element {
        width: 25%;
    }
}
```

---

## 📐 레이아웃 패턴

### 1. 그리드 레이아웃

#### 카드 그리드
```css
.card-grid {
    display: grid;
    grid-template-columns: 1fr; /* 모바일: 1열 */
    gap: 16px;
}

/* 태블릿: 2열 */
@media (min-width: 768px) {
    .card-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
    }
}

/* 데스크톱: 3열 */
@media (min-width: 1024px) {
    .card-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
    }
}

/* 대형 데스크톱: 4열 */
@media (min-width: 1440px) {
    .card-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}
```

#### 컬럼 레이아웃
```css
.two-column-layout {
    display: flex;
    flex-direction: column; /* 모바일: 세로 */
    gap: 16px;
}

/* 태블릿 이상: 가로 */
@media (min-width: 768px) {
    .two-column-layout {
        flex-direction: row;
        gap: 24px;
    }
    
    .two-column-layout__main {
        flex: 2;
    }
    
    .two-column-layout__sidebar {
        flex: 1;
        min-width: 300px;
    }
}
```

### 2. 플렉스 레이아웃

#### 반응형 플렉스
```css
.flex-layout {
    display: flex;
    flex-direction: column; /* 모바일: 세로 */
    gap: 12px;
}

/* 태블릿 이상: 가로 */
@media (min-width: 768px) {
    .flex-layout {
        flex-direction: row;
        gap: 16px;
    }
}

/* 데스크톱: 간격 증가 */
@media (min-width: 1024px) {
    .flex-layout {
        gap: 24px;
    }
}
```

### 3. 사이드바 레이아웃

#### 반응형 사이드바
```css
.sidebar-layout {
    display: flex;
    flex-direction: column; /* 모바일: 세로 */
}

.sidebar-layout__sidebar {
    order: 2; /* 모바일: 하단 */
    width: 100%;
}

.sidebar-layout__main {
    order: 1; /* 모바일: 상단 */
    width: 100%;
}

/* 태블릿 이상: 사이드바 우측 */
@media (min-width: 768px) {
    .sidebar-layout {
        flex-direction: row;
    }
    
    .sidebar-layout__sidebar {
        order: 2;
        width: 300px;
        flex-shrink: 0;
    }
    
    .sidebar-layout__main {
        order: 1;
        flex: 1;
    }
}
```

---

## 🎨 반응형 컴포넌트

### 1. 반응형 훅 사용

```javascript
import { useResponsive } from '../../hooks/useResponsive';

const ResponsiveComponent = () => {
    const { 
        isMobile, 
        isTablet, 
        isDesktop,
        breakpoint,
        windowSize
    } = useResponsive();
    
    return (
        <div className={`component ${isMobile ? 'component--mobile' : ''}`}>
            {isMobile && <MobileView />}
            {isTablet && <TabletView />}
            {isDesktop && <DesktopView />}
        </div>
    );
};
```

### 2. 반응형 그리드 컴포넌트

```javascript
const ResponsiveGrid = ({ children, columns = { mobile: 1, tablet: 2, desktop: 3 } }) => {
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns.mobile}, 1fr)`,
        gap: '16px'
    };
    
    return (
        <div 
            className="responsive-grid"
            style={gridStyle}
            data-tablet-columns={columns.tablet}
            data-desktop-columns={columns.desktop}
        >
            {children}
        </div>
    );
};
```

```css
.responsive-grid {
    display: grid;
    grid-template-columns: repeat(var(--mobile-columns, 1), 1fr);
    gap: 16px;
}

@media (min-width: 768px) {
    .responsive-grid {
        grid-template-columns: repeat(var(--tablet-columns, 2), 1fr);
        gap: 20px;
    }
}

@media (min-width: 1024px) {
    .responsive-grid {
        grid-template-columns: repeat(var(--desktop-columns, 3), 1fr);
        gap: 24px;
    }
}
```

---

## 📐 반응형 타이포그래피

### 1. 반응형 폰트 크기

```css
/* 모바일 */
.title {
    font-size: 24px;
    line-height: 1.4;
}

/* 태블릿 */
@media (min-width: 768px) {
    .title {
        font-size: 32px;
        line-height: 1.3;
    }
}

/* 데스크톱 */
@media (min-width: 1024px) {
    .title {
        font-size: 40px;
        line-height: 1.2;
    }
}
```

### 2. 반응형 간격

```css
/* 모바일 */
.section {
    padding: 16px;
    margin-bottom: 24px;
}

/* 태블릿 */
@media (min-width: 768px) {
    .section {
        padding: 24px;
        margin-bottom: 32px;
    }
}

/* 데스크톱 */
@media (min-width: 1024px) {
    .section {
        padding: 32px;
        margin-bottom: 48px;
    }
}
```

---

## 🚫 금지 사항

### 1. 고정 너비 금지
```css
/* ❌ 금지: 고정 너비 */
.container {
    width: 1200px;
}

/* ✅ 권장: 최대 너비와 반응형 */
.container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
}
```

### 2. 절대 위치 고정 금지
```css
/* ❌ 금지: 절대 위치 고정 */
.element {
    position: absolute;
    top: 100px;
    left: 200px;
}

/* ✅ 권장: 상대 위치 또는 플렉스/그리드 */
.element {
    position: relative;
    margin-top: 16px;
}
```

### 3. 모바일 미지원 금지
```javascript
// ❌ 금지: 데스크톱만 지원
<div style={{ width: '1200px' }}>
    {/* 내용 */}
</div>

// ✅ 권장: 모든 디바이스 지원
<div className="responsive-container">
    {/* 내용 */}
</div>
```

---

## ✅ 체크리스트

### 반응형 레이아웃 구현 시
- [ ] 모바일 우선 설계
- [ ] 표준 브레이크포인트 사용
- [ ] 모든 페이지 반응형 적용
- [ ] 그리드/플렉스 레이아웃 사용
- [ ] 반응형 타이포그래피 적용
- [ ] 반응형 간격 적용
- [ ] 테스트 (모바일/태블릿/데스크톱)

### 반응형 컴포넌트 구현 시
- [ ] useResponsive 훅 사용
- [ ] 조건부 렌더링 구현
- [ ] 반응형 CSS 클래스 적용
- [ ] 터치 타겟 크기 고려 (최소 44px)

---

## 💡 베스트 프랙티스

### 1. 반응형 유틸리티 클래스
```css
/* 반응형 숨김/표시 */
.hide-mobile {
    display: none;
}

@media (min-width: 768px) {
    .hide-mobile {
        display: block;
    }
    
    .hide-desktop {
        display: none;
    }
}
```

### 2. 반응형 이미지
```javascript
const ResponsiveImage = ({ src, alt, mobileSrc, tabletSrc }) => {
    return (
        <picture>
            <source media="(min-width: 1024px)" srcSet={src} />
            <source media="(min-width: 768px)" srcSet={tabletSrc || src} />
            <img src={mobileSrc || src} alt={alt} />
        </picture>
    );
};
```

### 3. 반응형 네비게이션
```javascript
const ResponsiveNavigation = () => {
    const { isMobile } = useResponsive();
    
    return (
        <nav className="navigation">
            {isMobile ? (
                <MobileMenu />
            ) : (
                <DesktopMenu />
            )}
        </nav>
    );
};
```

---

## 📞 문의

반응형 레이아웃 표준 관련 문의:
- 프론트엔드 팀
- UX 팀

**최종 업데이트**: 2025-12-03

