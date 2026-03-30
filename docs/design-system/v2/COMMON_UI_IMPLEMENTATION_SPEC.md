# 공통 UI 구현 스펙 (core-coder 구현용)

**작성일**: 2025-03-14  
**목적**: core-coder가 바로 구현할 수 있는 상세 구현 스펙  
**참조**: `COMMON_UI_ENCAPSULATION_PLAN.md`, `COMMON_UI_ENCAPSULATION_DESIGN_REVIEW.md`, `CARD_VISUAL_UNIFIED_SPEC.md`, `PENCIL_DESIGN_GUIDE.md`, `unified-design-tokens.css`

---

## 1. 파일 경로

| 컴포넌트 | JS | CSS |
|----------|-----|-----|
| StatusBadge | `frontend/src/components/common/StatusBadge.js` | `StatusBadge.css` |
| RemainingSessionsBadge | `frontend/src/components/common/RemainingSessionsBadge.js` | `RemainingSessionsBadge.css` |
| ActionButton | `frontend/src/components/common/ActionButton.js` | `ActionButton.css` |
| CardContainer | `frontend/src/components/common/CardContainer.js` | `CardContainer.css` |
| CardActionGroup | `frontend/src/components/common/CardActionGroup.js` | `CardActionGroup.css` |

모든 파일은 `frontend/src/components/common/` 디렉터리에 배치.

---

## 2. StatusBadge

### 2.1 Props

| Prop | Type | Required | Default | 설명 |
|------|------|----------|---------|------|
| `status` | string | 아니오 | `''` | 매칭 상태 코드 (ACTIVE, PENDING_PAYMENT 등). variant 매핑용으로 사용 |
| `variant` | string | 아니오 | (status 기반 자동) | 직접 지정 시: `success` \| `warning` \| `neutral` \| `danger` \| `info` |
| `children` | node | 아니오 | (status 기반 한글) | 표시 텍스트. 미지정 시 STATUS_KO 매핑 사용 |

### 2.2 status → variant 매핑

| status | variant |
|--------|---------|
| ACTIVE, PAYMENT_CONFIRMED, COMPLETED, DEPOSIT_PENDING | success |
| PENDING_PAYMENT, PENDING, SUSPENDED | warning |
| INACTIVE, TERMINATED, SESSIONS_EXHAUSTED | neutral |
| (에러·거부 등) | danger |
| (안내·정보) | info |

### 2.3 status → 한글 라벨 매핑 (children 미지정 시)

```js
const STATUS_KO = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  PENDING_PAYMENT: '결제 대기',
  PAYMENT_CONFIRMED: '결제 확인',
  DEPOSIT_PENDING: '승인 대기',
  TERMINATED: '종료됨',
  SESSIONS_EXHAUSTED: '회기 소진',
  SUSPENDED: '일시정지',
  COMPLETED: '완료',
  PENDING: '대기중'
};
```

### 2.4 클래스

- 기본: `mg-v2-status-badge`
- Modifier: `mg-v2-badge--success`, `mg-v2-badge--warning`, `mg-v2-badge--neutral`, `mg-v2-badge--danger`, `mg-v2-badge--info`

전체 클래스 예: `mg-v2-status-badge mg-v2-badge--success`

### 2.5 CSS 속성값 (토큰)

| 속성 | 값 |
|------|-----|
| display | inline-flex |
| align-items | center |
| padding | var(--mg-spacing-2) var(--mg-spacing-8) |
| font-size | var(--mg-font-xs) |
| font-weight | 600 |
| border-radius | var(--mg-radius-full) |
| role | status (접근성) |

**variant별 배경·텍스트 색상**

| variant | background-color | color |
|---------|------------------|-------|
| success | var(--mg-success-100) | var(--mg-success-700) |
| warning | var(--mg-warning-100) | var(--mg-warning-700) |
| neutral | var(--mg-gray-100) | var(--mg-gray-600) |
| danger | var(--mg-error-100) | var(--mg-error-700) |
| info | var(--mg-info-100) | var(--mg-info-700) |

---

## 3. RemainingSessionsBadge

### 3.1 Props

| Prop | Type | Required | Default | 설명 |
|------|------|----------|---------|------|
| `remainingSessions` | number | 아니오 | null | 남은 회기 수. null 또는 &lt; 0이면 렌더링하지 않음 |

### 3.2 클래스

- `mg-v2-count-badge`

### 3.3 CSS 속성값 (토큰)

| 속성 | 값 |
|------|-----|
| display | inline-flex |
| align-items | center |
| padding | var(--mg-spacing-2) var(--mg-spacing-6) |
| font-size | var(--mg-font-xs) |
| font-weight | 500 |
| border-radius | var(--mg-radius-sm) |
| background-color | var(--mg-primary-100) |
| color | var(--mg-primary-700) |

### 3.4 표시 형식

`{remainingSessions}회 남음` (예: `5회 남음`)

---

## 4. ActionButton

### 4.1 Props

| Prop | Type | Required | Default | 설명 |
|------|------|----------|---------|------|
| `variant` | string | 아니오 | `'primary'` | `primary` \| `success` \| `outline` \| `secondary` \| `danger` |
| `size` | string | 아니오 | `'medium'` | `small` \| `medium` \| `large` |
| `disabled` | boolean | 아니오 | false | 비활성화 |
| `type` | string | 아니오 | `'button'` | button \| submit \| reset |
| `onClick` | function | 아니오 | — | 클릭 핸들러 |
| `children` | node | 예 | — | 버튼 내부 내용 |
| `className` | string | 아니오 | '' | 추가 클래스 |
| `aria-label` | string | 아니오 | — | 접근성 라벨 |

### 4.2 클래스

- 기본: `mg-v2-button`
- Modifier: `mg-v2-button--primary`, `mg-v2-button--success`, `mg-v2-button--outline`, `mg-v2-button--secondary`, `mg-v2-button--danger`
- Size: `mg-v2-button--small`, `mg-v2-button--medium`, `mg-v2-button--large`
- disabled: `mg-v2-button--disabled` 또는 `:disabled` 선택자

예: `mg-v2-button mg-v2-button--primary mg-v2-button--medium`

### 4.3 CSS 속성값 (토큰)

**공통**

| 속성 | 값 |
|------|-----|
| display | inline-flex |
| align-items | center |
| justify-content | center |
| border-radius | var(--mg-radius-md, 10px) |
| font-weight | 600 |
| cursor | pointer |
| transition | box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease |
| border | (variant별) |
| **transform** | **사용 금지 (hover 포함)** |
| box-shadow | (variant별) |

**variant별**

| variant | background | color | border | hover: box-shadow |
|---------|------------|-------|--------|-------------------|
| primary | var(--mg-color-primary-main) | var(--mg-color-background-main) | none | var(--mg-button-hover-shadow) |
| success | var(--mg-success-500) | var(--mg-white) | none | var(--mg-button-hover-shadow) |
| outline | transparent | var(--mg-color-text-main) | 1px solid var(--mg-color-border-main) | var(--mg-shadow-sm) |
| secondary | var(--mg-color-surface-main) | var(--mg-color-text-main) | 1px solid var(--mg-color-border-main) | var(--mg-shadow-sm) |
| danger | var(--mg-error-500) | var(--mg-white) | none | var(--mg-button-hover-shadow) |

**size별**

| size | min-height | padding | font-size |
|------|------------|---------|-----------|
| small | 36px | var(--mg-spacing-6) var(--mg-spacing-12) | var(--mg-font-sm) |
| medium | 40px | var(--mg-spacing-8) var(--mg-spacing-16) | var(--mg-font-md) |
| large | 48px | var(--mg-spacing-10) var(--mg-spacing-20) | var(--mg-font-lg) |

**hover 시**: `transform` 사용 금지. `box-shadow`만 변경.

**disabled 시**: `opacity: 0.5`, `cursor: not-allowed`, pointer-events 제어.

---

## 5. CardContainer

### 5.1 Props

| Prop | Type | Required | Default | 설명 |
|------|------|----------|---------|------|
| `children` | node | 예 | — | 카드 내부 콘텐츠 |
| `className` | string | 아니오 | '' | 추가 클래스 (병합 적용) |

### 5.2 클래스

- 기본: `mg-v2-card-container`
- 추가 클래스: `className` prop으로 전달된 값을 병합

### 5.3 CSS 속성값 (토큰) — CARD_VISUAL_UNIFIED_SPEC 준수

| 속성 | 값 |
|------|-----|
| position | relative |
| min-height | 140px |
| padding | var(--mg-spacing-16) |
| border | 1px solid var(--mg-color-border-main) |
| border-radius | var(--mg-radius-lg) |
| box-shadow | var(--mg-shadow-sm) |
| background | var(--mg-bg-card, var(--mg-color-surface-main)) |
| transition | box-shadow 0.2s ease |
| **transform** | **hover 시 사용 금지** |

**hover 시**

| 속성 | 값 |
|------|-----|
| box-shadow | var(--mg-card-hover-shadow) |

**좌측 악센트 (::before)**

| 속성 | 값 |
|------|-----|
| content | '' |
| position | absolute |
| left | 0 |
| top | 0 |
| bottom | 0 |
| width | 4px |
| background-color | var(--mg-color-primary-main) |
| border-radius | 12px 0 0 12px |

---

## 6. CardActionGroup

### 6.1 Props

| Prop | Type | Required | Default | 설명 |
|------|------|----------|---------|------|
| `children` | node | 예 | — | ActionButton 등 자식 요소 |

### 6.2 클래스

- `mg-v2-card-actions`

### 6.3 CSS 속성값 (토큰)

| 속성 | 값 |
|------|-----|
| display | flex |
| flex-wrap | wrap |
| align-items | center |
| gap | var(--mg-spacing-8) |
| margin-top | var(--mg-spacing-4) |
| min-height | var(--touch-target-min, 44px) |

---

## 7. unified-design-tokens.css에 추가할 토큰 (없는 경우만)

기존 토큰을 최대한 재사용한다. 아래 토큰이 **없다면** 추가한다.

| 토큰 | 권장값 | 용도 |
|------|--------|------|
| --mg-spacing-2 | 2px (0.125rem) | 배지 padding 세로 |
| --mg-spacing-4 | 4px | CardActionGroup margin-top 등 |
| --mg-spacing-6 | 6px | 배지 padding 가로, small 버튼 |
| --mg-spacing-8 | 8px | 배지 padding 가로, CardActionGroup gap |
| --mg-spacing-10 | 10px | large 버튼 padding |
| --mg-spacing-12 | 12px | small 버튼 padding |
| --mg-spacing-16 | 16px | medium 버튼, CardContainer padding |
| --mg-spacing-20 | 20px | large 버튼 padding |
| --mg-shadow-sm | 0 1px 2px 0 rgba(0,0,0,0.05) 또는 기존 정의 | 카드 기본 shadow |
| --touch-target-min | 44px | 최소 터치 영역 (접근성) |

**참고**: `--mg-color-primary-main`, `--mg-color-border-main`, `--mg-color-surface-main`, `--mg-color-background-main`, `--mg-color-text-main` 등 B0KlA 역할별 토큰이 정의되어 있지 않다면, `unified-design-tokens.css` 또는 `dashboard-tokens-extension.css`의 기존 변수(`--mg-primary-500`, `--mg-gray-200` 등)로 폴백하거나, ` emergency-design-fix.css` / `IntegratedMatchingSchedule.css`에서 사용 중인 폴백 패턴(`var(--mg-color-primary-main, #3D5246)` 등)을 따른다.

---

## 8. 구현 체크리스트

- [ ] StatusBadge: props 처리, variant 매핑, mg-v2-status-badge + mg-v2-badge--* 클래스
- [ ] RemainingSessionsBadge: null/음수 시 미렌더링, mg-v2-count-badge
- [ ] ActionButton: variant/size/disabled, **hover transform 미사용**, shadow만 변경
- [ ] CardContainer: CARD_VISUAL_UNIFIED_SPEC (border, radius, padding, min-height, ::before 악센트, hover)
- [ ] CardActionGroup: flex, gap, min-height
- [ ] 모든 컴포넌트: `var(--mg-*)` 토큰만 사용, hex 하드코딩 금지
- [ ] common/index.js (또는 barrel)에 export 추가

---

**문서 버전**: 1.0
