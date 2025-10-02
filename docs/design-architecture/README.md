# MindGarden 디자인 아키텍처 문서 📚

## 📁 폴더 구조

```
docs/design-architecture/
├── README.md                              # 메인 인덱스 (현재 파일)
├── plans/                                 # 디자인 계획서
│   ├── CSS_ARCHITECTURE_IMPROVEMENT_PLAN.md
│   ├── CARD_DESIGN_IMPROVEMENT.md
│   └── RESPONSIVE_DESIGN_IMPROVEMENT_PLAN.md
├── implementation/                        # 실행 계획서 및 진행 상황
│   └── DESIGN_IMPLEMENTATION_PLAN.md
└── references/                           # 참조 자료 (향후 추가)
```

## 🎯 목적

이 폴더는 MindGarden의 디자인 시스템과 CSS 아키텍처 구축에 관한 모든 문서를 체계적으로 관리합니다.

## 📋 문서 목록

### 계획서 (plans/)
- **CSS_ARCHITECTURE_IMPROVEMENT_PLAN.md** - CSS 아키텍처 개선 계획
- **CARD_DESIGN_IMPROVEMENT.md** - 카드 디자인 개선 계획  
- **RESPONSIVE_DESIGN_IMPROVEMENT_PLAN.md** - 반응형 디자인 개선 계획
- **MODAL_DESIGN_GUIDE.md** - 모달 디자인 가이드 및 통합 시스템
- **COMMON_COMPONENTS_UNIFICATION_GUIDE.md** - 공통 컴포넌트 통합 가이드
- **LOGO_INTEGRATION_GUIDE.md** - 로고 통합 및 확장성 가이드

### 실행 계획서 (implementation/)
- **DESIGN_IMPLEMENTATION_PLAN.md** - 디자인 개선 실행 계획서 및 진행 상황

## 🚀 현재 진행 상황

### ✅ 완료된 작업
- **Phase 1: CSS 아키텍처 구축**
  - ITCSS 폴더 구조 생성
  - CSS 변수 시스템 분할 (01-settings/)
  - BEM 네이밍 적용 (06-components/)
  - main.css 엔트리 포인트 생성

- **Phase 2.1: Base 컴포넌트 생성**
  - BaseCard, BaseButton, BaseModal 생성
  - CSS Modules 적용

- **Phase 2.2: 공통 컴포넌트 생성**
  - StatCard, ManagementCard, DashboardHeader 생성
  - DashboardStats, DashboardManagement, DashboardModals 생성

### 🔄 진행 중인 작업
- **Phase 2.3: 커스텀 훅 생성**
  - useAdminDashboard 훅 생성 중
- **Phase 2.4: 모달 디자인 시스템 통합**
  - 모달 디자인 가이드 작성 완료
  - 기존 모달 컴포넌트 표준화 진행 중
- **Phase 2.5: 공통 컴포넌트 통합**
  - 공통 컴포넌트 통합 가이드 작성 완료
  - 알림, 로딩, 헤더, 모달 시스템 통합 계획 수립

### 📋 대기 중인 작업
- **Phase 2.3: useTheme, useResponsive 훅 생성**
- **Phase 2.4: 기존 컴포넌트와 새 아키텍처 통합**

## 🏗️ 아키텍처 구조

### CSS 아키텍처 (ITCSS)
```
frontend/src/styles/
├── 01-settings/          # CSS 변수, 색상, 폰트
├── 02-tools/             # 믹신, 함수
├── 03-generic/           # 리셋, normalize
├── 04-elements/          # 기본 HTML 요소
├── 05-objects/           # 레이아웃, 그리드
├── 06-components/        # 재사용 가능한 컴포넌트
├── 07-utilities/         # 유틸리티 클래스
├── 08-themes/            # 테마별 스타일
└── main.css              # 메인 엔트리 포인트
```

### 컴포넌트 아키텍처
```
frontend/src/components/
├── base/                 # 기본 컴포넌트
│   ├── BaseCard/
│   ├── BaseButton/
│   └── BaseModal/
├── common/               # 공통 컴포넌트
│   ├── StatCard/
│   ├── ManagementCard/
│   └── DashboardHeader/
└── admin/                # 관리자 컴포넌트
    └── components/
        ├── DashboardStats.js
        ├── DashboardManagement.js
        └── DashboardModals.js
```

### 훅 아키텍처
```
frontend/src/hooks/
├── useAdminDashboard.js  # AdminDashboard 로직
├── useTheme.js           # 테마 관리 (예정)
└── useResponsive.js      # 반응형 로직 (예정)
```

## 🎨 디자인 시스템

### BEM 네이밍 컨벤션
- **Block**: `.mg-card`, `.mg-btn`, `.mg-modal`
- **Element**: `.mg-card__header`, `.mg-btn__icon`
- **Modifier**: `.mg-card--large`, `.mg-btn--primary`

### 아이폰/아이패드 스타일
- **색상**: iOS 시스템 색상 적용
- **폰트**: SF Pro Display/Text 폰트 패밀리
- **간격**: 4px 기준 간격 시스템
- **반응형**: 모바일 우선 설계

## 📊 성공 지표

### 정량적 지표
- [ ] CSS 충돌 0건
- [ ] 컴포넌트 평균 크기 200라인 이하
- [ ] CSS 파일 모듈화율 100%
- [ ] BEM 네이밍 적용률 100%

### 정성적 지표
- [ ] 일관된 디자인 시스템
- [ ] 명확한 파일 구조
- [ ] 유지보수 용이성
- [ ] 개발자 경험 향상

---

**작성일**: 2025-01-30  
**버전**: 1.0  
**상태**: 진행 중

**업데이트**: 2025-01-30 - 디자인 아키텍처 문서 구조 생성 및 진행 상황 정리
