# MindGarden 디자인 시스템 v2.0 - 마스터 가이드

> **이 문서만 읽으면 전체 디자인 시스템을 파악할 수 있습니다.**

## 📋 목차

1. [개요](#개요)
2. [핵심 원칙](#핵심-원칙)
3. [시스템 구조](#시스템-구조)
4. [빠른 시작](#빠른-시작)
5. [Phase별 실행 계획](#phase별-실행-계획)
6. [주요 컴포넌트](#주요-컴포넌트)
7. [참고 문서](#참고-문서)

---

## 개요

MindGarden 디자인 시스템 v2.0은 **완전한 중앙화**, **동적 테마**, **모바일 최적화**, **앱 호환성**을 목표로 하는 통합 디자인 시스템입니다.

### 현재 상황
- 55개 파일에서 아이콘 직접 import (분산)
- 132개 파일에서 mg- 클래스 사용 (2568개 인스턴스)
- 카드 컴포넌트 분산 (StatCard, ClientCard 등)
- MGButton 5개 파일에서만 사용

### 목표
- ✅ 모든 아이콘을 `constants/icons.js`에서 중앙 관리
- ✅ 모든 레이아웃 클래스를 `constants/layout.js`에서 중앙 관리
- ✅ 역할별 동적 테마 시스템 (내담자/상담사/관리자)
- ✅ 통일된 카드 레이아웃 구조
- ✅ MGButton 전체 시스템 적용
- ✅ 모바일 우선 반응형 디자인
- ✅ PWA 및 React Native 준비

---

## 핵심 원칙

### 1. 완전한 중앙화
```javascript
// ❌ 잘못된 방법
import { Users } from 'lucide-react';
<div className="custom-card">

// ✅ 올바른 방법
import { ICONS } from '../../constants/icons';
import { LAYOUT_SYSTEM } from '../../constants/layout';
<div className={LAYOUT_SYSTEM.CARD.CONTAINER}>
  <ICONS.USERS size={ICON_SIZES.LG} />
</div>
```

### 2. 통일된 레이아웃 구조
**모든 카드는 동일한 3단 구조**:
```
┌─────────────────────────┐
│ [Header]  (선택)        │
├─────────────────────────┤
│ [Content] (필수)        │
├─────────────────────────┤
│ [Footer]  (선택)        │
└─────────────────────────┘
```

### 3. 모바일 우선
- 모바일 기본 → 태블릿 → 데스크탑 순서
- 터치 영역 최소 44x44px
- 레이아웃 구조는 동일, 크기만 조정

### 4. 테마 자동 적용
```javascript
// 사용자 역할에 따라 자동으로 테마 적용
const theme = getThemeByRole(userRole);
// CLIENT → 화사한 핑크
// CONSULTANT → 활력 민트그린
// ADMIN → 깔끔한 블루
```

---

## 시스템 구조

### 📁 디렉토리 구조
```
frontend/src/
├── constants/
│   ├── icons.js           ← 아이콘 중앙 관리
│   ├── layout.js          ← 레이아웃 클래스 중앙 관리
│   ├── colorThemes.js     ← 역할별 테마 정의
│   ├── cardTypes.js       ← 카드 타입 정의
│   └── breakpoints.js     ← 반응형 브레이크포인트
│
├── components/ui/
│   ├── cards/
│   │   ├── BaseCard.js           ← 핵심 카드 컨테이너
│   │   ├── CardHeader.js
│   │   ├── CardContent.js
│   │   ├── CardFooter.js
│   │   ├── contents/             ← 내용 컴포넌트
│   │   │   ├── StatContent.js
│   │   │   ├── UserContent.js
│   │   │   ├── ClientContent.js
│   │   │   └── ...
│   │   └── index.js
│   │
│   ├── Icon.js            ← 통합 아이콘 컴포넌트
│   ├── SectionHeader.js   ← 섹션 헤더
│   └── TabNavigation.js   ← 탭 네비게이션
│
├── common/
│   └── MGButton.js        ← 통합 버튼 컴포넌트
│
├── contexts/
│   └── ThemeContext.js    ← 전역 테마 상태 관리
│
├── utils/
│   ├── themeUtils.js      ← 테마 적용 함수
│   ├── responsiveUtils.js ← 반응형 유틸리티
│   └── iconUtils.js       ← 아이콘 헬퍼
│
└── styles/
    └── mindgarden-design-system.css  ← 중앙 CSS Variables
```

### 🎨 CSS Variables 계층
```css
/* Level 1: 역할별 기본 색상 */
:root {
  --client-primary: #FFB6C1;        /* 내담자 - 화사한 핑크 */
  --consultant-primary: #98FB98;    /* 상담사 - 활력 민트 */
  --admin-primary: #87CEEB;         /* 관리자 - 깔끔한 블루 */
}

/* Level 2: 동적 테마 적용 */
[data-theme="client"] { --primary: var(--client-primary); }
[data-theme="consultant"] { --primary: var(--consultant-primary); }
[data-theme="admin"] { --primary: var(--admin-primary); }

/* Level 3: 반응형 변수 */
:root {
  --card-padding: 12px;  /* 모바일 기본 */
}
@media (min-width: 768px) {
  :root { --card-padding: 16px; }  /* 태블릿 */
}
@media (min-width: 1024px) {
  :root { --card-padding: 20px; }  /* 데스크탑 */
}
```

---

## 빠른 시작

### 1. 아이콘 사용
```jsx
import { ICONS, ICON_SIZES } from '../../constants/icons';

// 기본 사용
<ICONS.USERS size={ICON_SIZES.LG} />

// 스타일과 함께
<div className="mg-icon mg-icon--primary">
  <ICONS.USERS size={20} />
</div>
```

### 2. 카드 사용
```jsx
import { BaseCard, StatContent } from '../../components/ui/cards';

// 통계 카드
<BaseCard
  content={
    <StatContent 
      icon="USERS" 
      value={100} 
      label="총 사용자" 
    />
  }
/>

// 사용자 카드
<BaseCard
  header={<CardHeader title="내담자 정보" />}
  content={<ClientContent name="홍길동" sessions={10} />}
  footer={<CardFooter actions={actions} />}
/>
```

### 3. 버튼 사용
```jsx
import MGButton from '../../components/common/MGButton';

<MGButton
  variant="primary"
  size="medium"
  onClick={handleClick}
  loading={loading}
  preventDoubleClick={true}
>
  저장
</MGButton>
```

### 4. 테마 사용
```jsx
import { useTheme } from '../../contexts/ThemeContext';

const MyComponent = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <div data-theme={theme}>
      {/* 자동으로 테마 색상 적용 */}
    </div>
  );
};
```

---

## Phase별 실행 계획

### Phase 1: 기반 구축 (3-4시간)
- [ ] User 엔티티에 `themePreference` 필드 추가
- [ ] CSS Variables 확장 (역할별 색상, 반응형)
- [ ] JavaScript Constants 생성 (layout, colorThemes, cardTypes, breakpoints)
- [ ] 유틸리티 함수 생성 (themeUtils, responsiveUtils)
- [ ] 백엔드 테마 API 구축

### Phase 2: 테마 설정 UI (3-4시간)
- [ ] ThemeContext 생성
- [ ] ThemeSettingsSection 컴포넌트 생성
- [ ] MyPage에 테마 설정 통합

### Phase 3: 통일된 카드 시스템 (8-10시간)
- [ ] BaseCard 컴포넌트 생성
- [ ] CardHeader, CardContent, CardFooter 생성
- [ ] 10개 Content 컴포넌트 생성
  - StatContent, TrendStatContent, ComparisonStatContent
  - UserContent, ClientContent, ConsultantContent
  - MessageContent, NotificationContent
  - ActionContent, ListItemContent

### Phase 4: 모바일 최적화 (4-6시간)
- [ ] 터치 제스처 지원
- [ ] 반응형 레이아웃 최적화
- [ ] 성능 최적화 (가상 스크롤, 레이지 로딩)
- [ ] PWA 준비 (Service Worker, 매니페스트)
- [ ] React Native 호환성 준비

### Phase 5: MGButton 전체 적용 (2-3시간)
- [ ] Admin Dashboard 버튼 교체
- [ ] Consultant Dashboard 버튼 교체
- [ ] Client Dashboard 버튼 교체
- [ ] 공통 컴포넌트 버튼 교체
- [ ] 기타 페이지 버튼 교체

### Phase 6: Admin Dashboard 적용 (4-6시간)
- [ ] SessionManagement.js 리팩토링
- [ ] AdminDashboard.js 적용
- [ ] MappingManagement.js 적용
- [ ] UserManagement.js 적용
- [ ] SystemNotificationManagement.js 적용

### Phase 7: 전체 시스템 확장 (8-12시간)
- [ ] Consultant Dashboard 적용
- [ ] Client Dashboard 적용
- [ ] HQ Dashboard 적용
- [ ] ERP Dashboard 적용
- [ ] Branch Dashboard 적용

### Phase 8: 정리 및 최적화 (3-4시간)
- [ ] 레거시 코드 제거
- [ ] 중복 상수 파일 통합
- [ ] 문서화 완료
- [ ] 성능 테스트 (Lighthouse 90+)

**총 예상 시간: 35-49시간**

---

## 주요 컴포넌트

### BaseCard (핵심)
```jsx
<BaseCard
  header={<CardHeader icon="USERS" title="통계" />}
  content={<CardContent>{children}</CardContent>}
  footer={<CardFooter actions={actions} />}
  variant="default|elevated|outlined|glass|gradient"
  theme="client|consultant|admin"
/>
```

**Props**:
- `header`: 헤더 컴포넌트 (선택)
- `content`: 내용 컴포넌트 (필수)
- `footer`: 푸터 컴포넌트 (선택)
- `variant`: 스타일 변형
- `theme`: 테마 (자동 감지)

### MGButton
```jsx
<MGButton
  variant="primary|secondary|success|danger|warning|info|outline"
  size="small|medium|large"
  disabled={false}
  loading={false}
  loadingText="처리 중..."
  preventDoubleClick={true}
  clickDelay={1000}
  onClick={handleClick}
  fullWidth={false}
>
  버튼 텍스트
</MGButton>
```

**특징**:
- 중복 클릭 방지
- 로딩 상태 표시
- 접근성 지원
- 다양한 스타일

### Icon
```jsx
<Icon 
  name="USERS" 
  size="sm|md|lg|xl|xxl" 
  variant="primary|secondary|success"
  className=""
/>
```

### SectionHeader
```jsx
<SectionHeader
  icon="CALENDAR"
  title="회기 관리"
  subtitle="내담자의 상담 회기를 관리합니다"
  actions={<MGButton>추가</MGButton>}
/>
```

---

## 참고 문서

### 필수 문서 (순서대로 읽기)
1. **[MASTER_GUIDE.md](./MASTER_GUIDE.md)** ← 현재 문서
2. **[ICON_LAYOUT_CENTRALIZATION_GUIDE.md](./ICON_LAYOUT_CENTRALIZATION_GUIDE.md)** - 아이콘/레이아웃 중앙화
3. **[DESIGN_VARIABLES_GUIDE.md](./DESIGN_VARIABLES_GUIDE.md)** - 변수 설정 가이드
4. **[CARD_SYSTEM_GUIDE.md](./CARD_SYSTEM_GUIDE.md)** - 카드 시스템 상세
5. **[MGBUTTON_MIGRATION_GUIDE.md](./MGBUTTON_MIGRATION_GUIDE.md)** - MGButton 마이그레이션

### 상세 문서
- **[MINDGARDEN_DESIGN_SYSTEM_GUIDE.md](./MINDGARDEN_DESIGN_SYSTEM_GUIDE.md)** - 전체 디자인 시스템
- **[DESIGN_SYSTEM_ARCHITECTURE.md](./DESIGN_SYSTEM_ARCHITECTURE.md)** - 아키텍처
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - 구현 계획
- **[MOBILE_OPTIMIZATION_GUIDE.md](./MOBILE_OPTIMIZATION_GUIDE.md)** - 모바일 최적화
- **[PROGRESS_REPORT.md](./PROGRESS_REPORT.md)** - 진행 상황

### 실행 계획
- **[design-system-centralization.plan.md](../../design-system-centralization.plan.md)** - 상세 실행 계획

---

## 성공 지표

### 단기 목표 (Phase 1-4)
- [ ] CSS Variables 200+ 개 정의
- [ ] JavaScript Constants 5개 파일 생성
- [ ] BaseCard + 10개 Content 컴포넌트 생성
- [ ] ThemeContext 구현 및 동작 확인

### 중기 목표 (Phase 5-6)
- [ ] MGButton 200+ 버튼 교체
- [ ] Admin Dashboard 5개 컴포넌트 적용
- [ ] 아이콘 직접 import 0개 (55개 → 0개)

### 장기 목표 (Phase 7-8)
- [ ] 전체 Dashboard 적용 완료
- [ ] Lighthouse 모바일 점수 90+
- [ ] 코드 중복 60% 감소
- [ ] PWA 설치 가능
- [ ] React Native 전환 준비 완료

---

## 빠른 체크리스트

### 새 컴포넌트 작성 시
- [ ] `ICONS` 사용 (직접 import 금지)
- [ ] `LAYOUT_SYSTEM` 사용 (하드코딩 금지)
- [ ] `BaseCard` 사용 (커스텀 카드 금지)
- [ ] `MGButton` 사용 (`<button>` 금지)
- [ ] CSS Variables 사용 (하드코딩 금지)
- [ ] 모바일 우선 반응형
- [ ] 테마 자동 적용 확인

### 기존 컴포넌트 수정 시
- [ ] 아이콘 → `ICONS`로 교체
- [ ] 버튼 → `MGButton`으로 교체
- [ ] 카드 → `BaseCard`로 교체
- [ ] 클래스 → `LAYOUT_SYSTEM`으로 교체
- [ ] 인라인 스타일 → CSS Variables로 교체
- [ ] 모바일 테스트 완료
- [ ] 테마 변경 테스트 완료

---

## 문의 및 지원

- 문서 위치: `/docs/design-system-v2/`
- 실행 계획: `/design-system-centralization.plan.md`
- 컴포넌트 쇼케이스: `http://localhost:3000/design-system`

## 🔧 컴포넌트 중앙화

### Presentational/Container 분리 패턴

**UI 컴포넌트 (components/ui/)**: 순수 UI, 재사용 가능
```jsx
// Card.js - UI만 담당
const Card = ({ children, variant = 'default' }) => {
  return <div className={`mg-v2-card mg-v2-card--${variant}`}>{children}</div>;
};
```

**비즈니스 컴포넌트 (components/admin/)**: 로직만 담당
```jsx
// SessionManagement.js - 로직만 담당
const SessionManagement = () => {
  const [sessions, setSessions] = useState([]); // 복잡한 로직
  return (
    <Card variant="stat">  {/* UI는 공통 컴포넌트 사용 */}
      <CardHeader title="회기 관리" />
      <CardContent>{sessions.length}</CardContent>
    </Card>
  );
};
```

### CSS 네이밍 규칙
- **새 클래스**: `.mg-v2-{component}-{variant}`
- **예시**: `.mg-v2-card`, `.mg-v2-button-primary`
- **금지**: `.card`, `.mg-card` (레거시와 충돌)

### 상세 가이드
- [COMPONENT_CENTRALIZATION_GUIDE.md](./COMPONENT_CENTRALIZATION_GUIDE.md) - 상세 사용법

---

**마지막 업데이트**: 2025-01-23
