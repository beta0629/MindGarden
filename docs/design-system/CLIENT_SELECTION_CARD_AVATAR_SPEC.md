# ClientSelectionStep 모달 내담자 카드·아바타 디자인 스펙

**버전**: 1.0.0  
**최종 업데이트**: 2026-03-14  
**목적**: ClientSelectionStep 모달 내 `.mg-client-card.mg-client-card--detailed` 및 아바타(`mg-client-card__avatar`, `mg-client-card__avatar--large`)의 디자인·레이아웃·사용성 기준을 정의한다.  
**적용 범위**: 스케줄 모달 → 내담자 선택 단계 → ClientSelector → ClientCard (variant: detailed)  
**참조**: PENCIL_DESIGN_GUIDE.md, AVATAR_COMPONENT_DESIGN_SPEC.md, AVATAR_IMAGE_OR_INITIAL_SPEC.md, B0KlA 토큰

---

## 1. 개요

### 1.1 맥락

- **컨텍스트**: 관리자가 스케줄 등록 시 상담사를 선택한 뒤, **내담자를 선택**하는 모달 단계.
- **사용자**: 어드민(관리자).
- **목표**: 내담자를 한눈에 구분하고 **최소 클릭으로 선택**할 수 있도록 가독성과 클릭 영역을 확보한다.

### 1.2 관련 경로

| 항목 | 경로 |
|------|------|
| ClientSelectionStep | `frontend/src/components/schedule/steps/ClientSelectionStep.js` |
| ClientSelector | `frontend/src/components/schedule/ClientSelector.js` |
| ClientCard | `frontend/src/components/ui/Card/ClientCard.js` |
| B0KlA 오버라이드 | `frontend/src/components/schedule/ScheduleB0KlA.css` (201~317행) |
| DOM 경로 | `mg-v2-ad-b0kla` > `mg-v2-ad-client-step` > `client-selector` > `mg-client-cards-grid--schedule-client` > `.mg-client-card.mg-client-card--detailed` |

---

## 2. 사용성 (Useability)

### 2.1 최소 클릭·가독성

- **카드 전체 클릭**: 카드 영역 전체를 클릭 가능 영역으로 두고, 클릭 시 해당 내담자를 선택한다.
- **역할**: `role="button"`, `tabIndex={0}`, `aria-label="${client.name} 내담자 선택"`으로 스크린 리더 접근성 확보.
- **선택 피드백**: 선택된 카드는 시각적으로 명확히 구분한다 (테두리·배경 강조).
- **호버 피드백**: 마우스 호버 시 선택 가능함을 시각적으로 표현한다.

### 2.2 터치·접근성

- **터치 영역**: 모바일 시 44px 이상 권장 (PENCIL_DESIGN_GUIDE 반응형 기준).
- **포커스 링**: 키보드 포커스 시 `outline` 또는 `box-shadow`로 포커스 표시.
- **Enter/Space**: 카드 포커스 상태에서 Enter 또는 Space로 선택 가능.

---

## 3. 정보 노출 (Information Hierarchy)

### 3.1 노출 항목

| 우선순위 | 항목 | 클래스 | 표시 형식 |
|----------|------|--------|-----------|
| 1 | **상태 배지** | `mg-client-card__status-badge` | 진행중 / 예약됨 / 완료 / 일시정지 / 대기중 |
| 2 | **아바타** | `mg-client-card__avatar mg-client-card__avatar--large` | 프로필 이미지 또는 이니셜 (80×80px) |
| 3 | **이름** | `mg-client-card__name mg-client-card__name--large` | 내담자 이름 |
| 4 | **최근 상담** | `mg-client-card__detail-item` | 최근 상담: YYYY-MM-DD |
| 5 | **총 세션** | `mg-client-card__detail-item` | 총 N회 진행 |
| 6 | **다음 상담** | `mg-client-card__detail-item` | 다음 상담: YYYY-MM-DD HH:mm (있을 경우) |
| 7 | **진행률** | `mg-client-card__progress-section` | 진행률 N% (프로그레스 바) |
| 8 | **담당 상담사** | `mg-client-card__consultant-info` | 담당 상담사: 이름 (있을 경우) |
| 9 | **액션** | `mg-client-card__actions` | 선택하기 / 선택됨 버튼 등 |

### 3.2 상태 배지 색상 (B0KlA 토큰)

| 상태 | 클래스 modifier | 배경 | 텍스트 |
|------|-----------------|------|--------|
| 진행중 (active) | `--active` | `var(--ad-b0kla-green-bg)` | `var(--ad-b0kla-green)` |
| 예약됨 (scheduled) | `--scheduled` | `var(--ad-b0kla-orange-bg)` | `var(--ad-b0kla-orange)` |
| 완료 (completed) | `--completed` | 기본 (회색 계열) | `var(--ad-b0kla-text-secondary)` |
| 대기중 (default) | `--default` | `var(--ad-b0kla-blue-bg)` | `var(--ad-b0kla-blue)` |

---

## 4. 레이아웃

### 4.1 카드 그리드

- **컨테이너**: `mg-client-cards-grid--schedule-client` (또는 `mg-client-cards-grid`)
- **그리드**:
  - `display: grid`
  - `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`
  - `gap: var(--ad-b0kla-radius-sm, 12px)`
- **스크롤**: 내담자 수가 많을 때 `overflow-y: auto`, `align-content: start`
- **최소 높이**: `min-height: 200px` (빈 상태 대비)

### 4.2 카드 본체 (`.mg-client-card.mg-client-card--detailed`)

#### 4.2.1 B0KlA 토큰 적용

| 속성 | 토큰/값 |
|------|---------|
| 배경 | `var(--ad-b0kla-card-bg)` |
| 테두리 | `1px solid var(--ad-b0kla-border)` |
| border-radius | `var(--ad-b0kla-radius-sm)` (12px) |
| box-shadow | `var(--ad-b0kla-shadow)` |
| 좌측 악센트 | `border-left: 4px solid transparent` (호버/선택 시 주조색) |

#### 4.2.2 상태별 테두리·배경

- **기본**: 좌측 4px 투명.
- **호버**: `border-color: var(--ad-b0kla-green)`.
- **선택됨 (`.mg-client-card--selected`)**:  
  `border-left-color: var(--ad-b0kla-green)`,  
  `border-color: var(--ad-b0kla-green)`,  
  `background: var(--ad-b0kla-green-bg, rgba(72, 187, 120, 0.08))`.
- **비활성 (.mg-client-card--unavailable)**: `opacity: 0.6`, 호버 시 테두리 변화 없음.

#### 4.2.3 카드 내부 구조 (레이아웃)

```
┌─────────────────────────────────────┐
│ [상태 배지]              (우측 상단) │
│                                     │
│           [아바타 80×80]             │
│                                     │
│           [이름]                     │
│                                     │
│  [최근 상담] [총 N회] [다음 상담]    │
│                                     │
│  진행률 ───────────── N%             │
│                                     │
│  담당 상담사: 이름 (선택)            │
│                                     │
│  [선택하기 / 선택됨] [액션...]       │
└─────────────────────────────────────┘
```

- **정렬**: 상단 정렬, 아바타·이름은 중앙 또는 좌측 정렬 (현행 유지).
- **패딩**: `var(--spacing-xl)` 또는 24px 수준.
- **텍스트 정렬**: 센터 정렬 유지 가능 (기존 `.mg-client-card--detailed` 스타일).

---

## 5. 아바타 스펙

### 5.1 클래스·컴포넌트

- **컴포넌트**: `Avatar` (`frontend/src/components/common/Avatar.js`)
- **클래스**: `mg-client-card__avatar mg-client-card__avatar--large`
- **내부 클래스**: `mg-v2-avatar`, `mg-v2-avatar-img`, `mg-v2-avatar-fallback` (AVATAR_IMAGE_OR_INITIAL_SPEC, emergency-design-fix.css 준수)

### 5.2 크기·형태

| 속성 | 값 |
|------|-----|
| **width** | 80px |
| **height** | 80px |
| **border-radius** | 50% (원형) |
| **overflow** | hidden |

### 5.3 이미지 vs 이니셜

- **1순위**: `profileImageUrl` 있음 → `<img>` with `mg-v2-avatar-img` (object-fit: cover, 원형)
- **2순위**: `profileImageUrl` 없음 또는 로드 실패 → 이니셜(`mg-v2-avatar-fallback`)
- **이니셜 규칙**: 한글은 성+이름 첫 글자, 영문은 첫 글자, 없으면 `'?'`

### 5.4 img 스타일 (AVATAR_IMAGE_OR_INITIAL_SPEC)

| 속성 | 값 |
|------|-----|
| width / height | 100% (부모 영역 채움) |
| border-radius | 50% |
| object-fit | cover |
| display | block |

### 5.5 폴백(이니셜) 스타일

- **배경**: 부모 컨텍스트에서 정의 (B0KlA: `var(--ad-b0kla-green-bg)` 또는 주조 그라데이션 등)
- **폰트**: font-weight 600, 크기 부모 80px 기준으로 적절히 (예: 2rem)
- **색상**: `var(--ad-b0kla-title-color)` 또는 `var(--ad-b0kla-text-secondary)`

### 5.6 emergency-design-fix.css 적용

- `.mg-client-card__avatar`에 `overflow: hidden`, `position: relative`, `border-radius: 50%` 적용.
- `.mg-client-card__avatar .mg-v2-avatar-img`에 width/height 100%, object-fit cover, border-radius 50%.
- `.mg-client-card__avatar .mg-v2-avatar-fallback`에 position absolute, inset 0, flex 정렬.

---

## 6. 타이포그래피

| 요소 | 토큰/값 |
|------|---------|
| 이름 | `var(--ad-b0kla-title-color)`, 1rem, font-weight 600 |
| 상세/라벨 | `var(--ad-b0kla-text-secondary)`, `var(--font-size-sm)` |
| 진행률 값 | `var(--ad-b0kla-title-color)`, font-weight 600 |
| 상태 배지 | font-size 0.75rem, font-weight 500 |
| 폰트 | Noto Sans KR (PENCIL_DESIGN_GUIDE) |

---

## 7. 액션·버튼

- **선택 버튼**: 주조 스타일 `var(--ad-b0kla-green)`, 텍스트 `var(--ad-b0kla-card-bg)`, border none.
- **호버**: `opacity: 0.9`.
- **선택됨 상태**: 버튼 텍스트 "선택됨" 등으로 피드백.

---

## 8. 반응형

- **데스크톱 (1280px~)**: `minmax(300px, 1fr)` 그리드, 80×80 아바타.
- **태블릿 (768px~)**: 동일 그리드, 카드 최소 300px 유지.
- **모바일 (<768px)**: `mg-client-card--mobile-simple` 등 variant로 전환 가능. 이 스펙은 `detailed` variant에 한정.
- **터치**: 터치 영역 44px 이상 권장.

---

## 9. 토큰·클래스 요약표

| 용도 | 토큰/클래스 |
|------|-------------|
| 카드 배경 | `var(--ad-b0kla-card-bg)` |
| 테두리 | `var(--ad-b0kla-border)` |
| radius | `var(--ad-b0kla-radius-sm)` |
| 주조/선택 | `var(--ad-b0kla-green)`, `var(--ad-b0kla-green-bg)` |
| 제목 색 | `var(--ad-b0kla-title-color)` |
| 보조 텍스트 | `var(--ad-b0kla-text-secondary)` |
| 카드 블록 | `.mg-client-card.mg-client-card--detailed` |
| 아바타 | `.mg-client-card__avatar.mg-client-card__avatar--large` |
| 그리드 | `.mg-client-cards-grid--schedule-client` |

---

## 10. 참조 문서

| 문서 | 용도 |
|------|------|
| `docs/design-system/PENCIL_DESIGN_GUIDE.md` | B0KlA 팔레트·레이아웃·타이포·반응형 |
| `docs/design-system/AVATAR_COMPONENT_DESIGN_SPEC.md` | Avatar Atom, className 규칙 |
| `docs/design-system/v2/AVATAR_IMAGE_OR_INITIAL_SPEC.md` | 이미지 vs 이니셜, mg-v2-avatar-img/fallback |
| `frontend/src/styles/dashboard-tokens-extension.css` | B0KlA 토큰 정의 |
| `frontend/src/components/schedule/ScheduleB0KlA.css` | .mg-client-card B0KlA 오버라이드 |
| `frontend/src/styles/emergency-design-fix.css` | .mg-client-card__avatar img/fallback 스타일 |

---

이 스펙은 **디자인/비주얼 기준**이며, 구현은 core-coder가 수행한다.
