# MindGarden 모바일 최적화 가이드

## 📋 개요

MindGarden 디자인 시스템 v2.0은 **모바일 우선** 접근법을 사용하여 모든 디바이스에서 최적의 사용자 경험을 제공합니다.

## 🎯 핵심 원칙

### 1. 모바일 우선 (Mobile First)
- 모바일 디자인을 기본으로 설계
- 태블릿, 데스크탑으로 점진적 향상
- 터치 인터페이스 최적화

### 2. 반응형 디자인
- 단일 코드베이스로 모든 디바이스 지원
- CSS Variables를 활용한 동적 크기 조정
- 유연한 그리드 시스템

### 3. 성능 최적화
- 빠른 로딩 속도
- 부드러운 애니메이션
- 배터리 효율성

## 📱 브레이크포인트

### CSS Variables 기반
```css
:root {
  /* 모바일 기본값 */
  --card-padding: 12px;
  --card-gap: 12px;
  --font-size-base: 14px;
  --touch-target: 44px;
}

/* 태블릿 (768px+) */
@media (min-width: 768px) {
  :root {
    --card-padding: 16px;
    --card-gap: 16px;
    --font-size-base: 16px;
  }
}

/* 데스크탑 (1024px+) */
@media (min-width: 1024px) {
  :root {
    --card-padding: 20px;
    --card-gap: 20px;
  }
}
```

### JavaScript Constants
```javascript
// constants/breakpoints.js
export const BREAKPOINTS = {
  MOBILE: 0,
  TABLET: 768,
  DESKTOP: 1024,
  LARGE: 1280
};

export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
};
```

## 🎨 레이아웃 시스템

### 카드 레이아웃
```css
/* 모바일: 단일 컬럼 */
.mg-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--card-gap);
}

/* 태블릿: 2-3 컬럼 */
@media (min-width: 768px) {
  .mg-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 데스크탑: 3-4 컬럼 */
@media (min-width: 1024px) {
  .mg-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 타이포그래피
```css
/* 모바일 우선 폰트 크기 */
.mg-h1 { font-size: 1.5rem; }    /* 24px */
.mg-h2 { font-size: 1.25rem; }   /* 20px */
.mg-h3 { font-size: 1.125rem; }  /* 18px */
.mg-body { font-size: 0.875rem; } /* 14px */

/* 태블릿 */
@media (min-width: 768px) {
  .mg-h1 { font-size: 2rem; }     /* 32px */
  .mg-h2 { font-size: 1.5rem; }   /* 24px */
  .mg-h3 { font-size: 1.25rem; }  /* 20px */
  .mg-body { font-size: 1rem; }   /* 16px */
}
```

## 👆 터치 최적화

### 터치 영역
```css
/* 최소 터치 영역 44x44px */
.mg-button,
.mg-card,
.mg-touch-target {
  min-height: var(--touch-target);
  min-width: var(--touch-target);
  padding: 12px;
}
```

### 터치 피드백
```css
/* 터치 시 시각적 피드백 */
.mg-button:active,
.mg-card:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}

/* 호버 효과 (터치 디바이스에서도 작동) */
@media (hover: hover) {
  .mg-button:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
}
```

### 스와이프 제스처
```javascript
// utils/touchUtils.js
export const addSwipeGestures = (element, callbacks) => {
  let startX, startY, endX, endY;
  
  element.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  });
  
  element.addEventListener('touchend', (e) => {
    endX = e.changedTouches[0].clientX;
    endY = e.changedTouches[0].clientY;
    
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    
    // 좌우 스와이프
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        callbacks.onSwipeRight?.();
      } else {
        callbacks.onSwipeLeft?.();
      }
    }
    
    // 상하 스와이프
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        callbacks.onSwipeDown?.();
      } else {
        callbacks.onSwipeUp?.();
      }
    }
  });
};
```

## ⚡ 성능 최적화

### 가상 스크롤링
```jsx
// 긴 리스트에 가상 스크롤 적용
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items, renderItem }) => (
  <List
    height={400}
    itemCount={items.length}
    itemSize={60}
    itemData={items}
  >
    {({ index, style, data }) => (
      <div style={style}>
        {renderItem(data[index], index)}
      </div>
    )}
  </List>
);
```

### 이미지 최적화
```jsx
// 레이지 로딩 이미지
const LazyImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef} {...props}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          style={{ 
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}
    </div>
  );
};
```

### 메모이제이션
```jsx
// React.memo로 불필요한 리렌더링 방지
const Card = React.memo(({ title, content, onClick }) => {
  return (
    <div className="mg-card" onClick={onClick}>
      <h3>{title}</h3>
      <p>{content}</p>
    </div>
  );
});

// useMemo로 계산 비용이 큰 값 메모이제이션
const ExpensiveComponent = ({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: heavyCalculation(item)
    }));
  }, [data]);
  
  return <div>{/* 렌더링 */}</div>;
};
```

## 📱 PWA 준비

### Service Worker
```javascript
// public/sw.js
const CACHE_NAME = 'mindgarden-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
```

### 앱 매니페스트
```json
// public/manifest.json
{
  "name": "MindGarden",
  "short_name": "MindGarden",
  "description": "마음의 정원 상담 플랫폼",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F5F5DC",
  "theme_color": "#98FB98",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🔄 React Native 준비

### 스타일 구조 분리
```javascript
// styles/platformStyles.js
import { Platform } from 'react-native';

const createStyles = (webStyles, nativeStyles) => {
  if (Platform.OS === 'web') {
    return webStyles;
  }
  return nativeStyles;
};

// 웹용 스타일
const webStyles = {
  card: {
    padding: 'var(--card-padding)',
    background: 'var(--card-bg)',
    borderRadius: 'var(--radius-lg)'
  }
};

// 네이티브용 스타일
const nativeStyles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12
  }
});

export const cardStyles = createStyles(webStyles, nativeStyles);
```

### 컴포넌트 분기
```jsx
// components/ResponsiveComponent.js
import { Platform } from 'react-native';

const ResponsiveComponent = ({ children }) => {
  if (Platform.OS === 'web') {
    return <div className="mg-card">{children}</div>;
  }
  
  return (
    <View style={cardStyles.card}>
      {children}
    </View>
  );
};
```

## 🧪 테스트 전략

### 디바이스 테스트
```javascript
// utils/deviceDetection.js
export const getDeviceType = () => {
  const width = window.innerWidth;
  
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};
```

### 성능 테스트
```javascript
// utils/performanceTest.js
export const measurePerformance = (componentName, renderFn) => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  
  console.log(`${componentName} 렌더링 시간: ${end - start}ms`);
  
  // Lighthouse 점수 목표: 90+
  return end - start;
};
```

## 📊 성능 지표

### 목표 지표
- **Lighthouse 모바일 점수**: 90+
- **First Contentful Paint**: < 1.5초
- **Largest Contentful Paint**: < 2.5초
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### 모니터링
```javascript
// utils/performanceMonitoring.js
export const initPerformanceMonitoring = () => {
  // Core Web Vitals 모니터링
  if ('web-vitals' in window) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }
};
```

## 🚀 구현 체크리스트

### Phase 1: 기본 최적화
- [ ] CSS Variables 반응형 설정
- [ ] 터치 영역 최적화
- [ ] 기본 애니메이션 최적화

### Phase 2: 고급 최적화
- [ ] 가상 스크롤링 구현
- [ ] 이미지 레이지 로딩
- [ ] 메모이제이션 적용

### Phase 3: PWA 준비
- [ ] Service Worker 구현
- [ ] 앱 매니페스트 설정
- [ ] 오프라인 지원

### Phase 4: 앱 준비
- [ ] React Native 호환성 준비
- [ ] 플랫폼별 스타일 분리
- [ ] 공통 로직 추출

## 📚 참고 문서

- [MASTER_GUIDE.md](./MASTER_GUIDE.md) - 전체 디자인 시스템
- [CARD_SYSTEM_GUIDE.md](./CARD_SYSTEM_GUIDE.md) - 카드 시스템
- [MGBUTTON_MIGRATION_GUIDE.md](./MGBUTTON_MIGRATION_GUIDE.md) - MGButton 마이그레이션

## 🔗 외부 리소스

- [Web.dev - Responsive Design](https://web.dev/responsive-web-design-basics/)
- [MDN - Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [React Native - Platform Specific Code](https://reactnative.dev/docs/platform-specific-code)

---

**마지막 업데이트**: 2025-01-23
