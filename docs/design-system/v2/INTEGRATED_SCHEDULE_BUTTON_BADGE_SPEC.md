# 통합 스케줄 사이드바 카드 — 버튼·배지 통일 디자인 스펙

**버전**: 1.0.0  
**작성일**: 2025-03-14  
**목적**: 통합 스케줄 사이드바 카드의 버튼·배지를 마인드가든 어드민 대시보드 샘플 스타일로 통일  
**참조**: `INTEGRATED_SCHEDULE_BUTTON_BADGE_UNIFICATION_PLAN.md`, `PENCIL_DESIGN_GUIDE.md`, `CARD_VISUAL_UNIFIED_SPEC.md`, 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample

---

## 1. 디자인 기준

- **단일 소스**: `mindgarden-design-system.pen`, `pencil-new.pen`, `unified-design-tokens.css`, `dashboard-tokens-extension.css`
- **필수 문서**: `docs/design-system/PENCIL_DESIGN_GUIDE.md` 디자이너 숙지 체크리스트 적용
- **마인드가든 어드민 샘플 스타일 준수**: 주조색 #3D5246, 성공 #059669 계열, 서페이스 #F5F3EF, 테두리 #D4CFC8

---

## 2. 버튼 스펙 (CardActionGroup)

### 2.1 원칙: 텍스트 전용 (아이콘 제거)

| 항목 | 값 |
|------|-----|
| **아이콘** | 없음 (Lucide `CreditCard`, `DollarSign`, `CheckCircle`, `CalendarPlus` 제거) |
| **표시** | 텍스트만 |
| **접근성** | `aria-label` 유지 |

### 2.2 MGButton variant·size 매핑

| 버튼 | variant | size | 노출 조건 |
|------|---------|------|----------|
| 결제 확인 | `success` | `small` | PENDING_PAYMENT 상태 |
| 입금 확인 | `primary` | `small` | PAYMENT_CONFIRMED 상태 |
| 승인 | `success` | `small` | DEPOSIT_PENDING 상태 |
| 스케줄 등록 | `primary` | `small` | 항상 (disabled 조건부) |

### 2.3 variant별 색상·크기 토큰

#### success (결제 확인, 승인)

| 속성 | 토큰 | fallback |
|------|------|----------|
| 배경 | `var(--mg-success-600)` | `var(--mg-success-500)` |
| 텍스트 | `var(--mg-color-white)` 또는 `var(--mg-white)` | #ffffff |
| hover 배경 | `var(--mg-success-700)` | `var(--mg-success-600)` |

#### primary (입금 확인, 스케줄 등록)

| 속성 | 토큰 | fallback |
|------|------|----------|
| 배경 | `var(--mg-color-primary-main)` | `var(--ad-b0kla-green)` 또는 #3D5246 |
| 텍스트 | `var(--mg-color-primary-inverse)` | `var(--mg-white)` |
| hover 배경 | `var(--mg-color-primary-dark)` | #2d3d34 |

#### small 크기 (공통)

| 속성 | 토큰 | 값 |
|------|------|-----|
| padding | `var(--mg-spacing-8)` `var(--mg-spacing-12)` | 8px 12px |
| font-size | `var(--mg-font-sm)` | 14px (0.875rem) |
| font-weight | 600 | `var(--mg-font-semibold)` |
| border-radius | `var(--mg-radius-sm)` | 8px |
| min-height | — | 36px (small 기준) |

### 2.4 카드 액션 영역 레이아웃 (card-actions)

| 속성 | 토큰 | 값 |
|------|------|-----|
| display | — | flex |
| flex-wrap | — | wrap |
| align-items | — | center |
| gap | `var(--mg-spacing-8)` | 8px |
| margin-top | `var(--mg-spacing-4)` | 4px |
| min-height | `var(--touch-target-min)` | 44px (터치 최소 영역) |

### 2.5 스케줄 등록 버튼 disabled

| 속성 | 값 |
|------|-----|
| background | `var(--mg-color-border-main)` |
| opacity | 0.6 |
| cursor | not-allowed |

---

## 3. 배지 스펙 (StatusBadge, RemainingSessionsBadge)

### 3.1 StatusBadge (상태 배지)

**클래스**: `.integrated-schedule__card-status`

#### 공통 레이아웃

| 속성 | 토큰 | 값 |
|------|------|-----|
| display | — | inline-flex |
| align-items | — | center |
| padding | `var(--mg-spacing-2)` `var(--mg-spacing-8)` | 2px 8px (세로·가로) |
| font-size | `var(--mg-font-xs)` 또는 `var(--mg-font-size-xs)` | 12px |
| font-weight | 600 | `var(--mg-font-semibold)` |
| border-radius | `var(--mg-radius-full)` | 9999px (pill 형태) |

#### 상태별 배경·텍스트 토큰

| 상태 클래스 | 배경 | 텍스트 |
|-------------|------|--------|
| `--active`, `--payment_confirmed`, `--deposit_pending` | `var(--mg-success-100)` | `var(--mg-success-700)` |
| `--pending_payment` | `var(--mg-warning-100)` | `var(--mg-warning-700)` |
| `--inactive`, `--terminated`, `--sessions_exhausted`, `--suspended` | `var(--mg-gray-100)` | `var(--mg-gray-600)` |
| 기본 | `var(--mg-color-surface-sub)` 또는 `var(--mg-gray-100)` | `var(--mg-color-text-main)` 또는 `var(--mg-gray-700)` |

### 3.2 RemainingSessionsBadge (회기 배지)

**클래스**: `.integrated-schedule__card-remaining-badge`

| 속성 | 토큰 | 값 |
|------|------|-----|
| display | — | inline-flex |
| align-items | — | center |
| padding | `var(--mg-spacing-2)` `var(--mg-spacing-6)` | 2px 6px (세로·가로) |
| font-size | `var(--mg-font-xs)` 또는 `var(--mg-font-size-xs)` | 12px |
| font-weight | 500 | `var(--mg-font-medium)` |
| border-radius | `var(--mg-radius-sm)` | 6~8px (box 형태, pill 아님) |
| background | `var(--mg-primary-100)` | `var(--mg-primary-50)` fallback |
| color | `var(--mg-primary-700)` | `var(--mg-primary-600)` fallback |

### 3.3 배지 형태 구분

| 배지 | 형태 | border-radius |
|------|------|---------------|
| StatusBadge | pill | `var(--mg-radius-full)` (9999px) |
| RemainingSessionsBadge | box | `var(--mg-radius-sm)` (6~8px) |

---

## 4. 마인드가든 어드민 대시보드 샘플 준수 요약

| 항목 | 샘플 기준 |
|------|----------|
| **주조색** | #3D5246 (`var(--mg-color-primary-main)`) |
| **성공/진행** | #059669 계열 (`var(--mg-success-600)`, `var(--mg-success-700)`) |
| **경고** | 결제 대기 등 `var(--mg-warning-100)` / `var(--mg-warning-700)` |
| **비활성** | `var(--mg-gray-100)` / `var(--mg-gray-600)` |
| **카드/서페이스** | #F5F3EF (`var(--mg-color-surface-main)`) |
| **테두리** | #D4CFC8 (`var(--mg-color-border-main)`) |
| **타이포** | Noto Sans KR, 라벨/캡션 12px |
| **버튼 radius** | 8~10px (`var(--mg-radius-sm)`) |
| **터치 영역** | 최소 44px 높이 |

---

## 5. 구현 시 토큰·클래스 체크리스트 (core-coder용)

### 버튼

- [ ] Lucide 아이콘 제거, 텍스트만 표시
- [ ] MGButton `variant="success"` / `variant="primary"`, `size="small"` 적용
- [ ] `var(--mg-success-600)`, `var(--mg-color-primary-main)` 등 토큰 사용
- [ ] `aria-label` 유지

### 배지

- [ ] StatusBadge: `font-size`, `padding`, `border-radius: var(--mg-radius-full)`, 상태별 토큰
- [ ] RemainingSessionsBadge: `font-size`, `padding`, `border-radius: var(--mg-radius-sm)`, `--mg-primary-100`/`--mg-primary-700`
- [ ] 다른 카드(MappingListSection, ClientMappingTab) 배지와 시각 일관성

### 카드 액션 영역

- [ ] `.integrated-schedule__card-actions`: `gap: var(--mg-spacing-8)`, `min-height: 44px`

---

## 6. 참조 파일

| 구분 | 경로 |
|------|------|
| 기획 | `docs/project-management/INTEGRATED_SCHEDULE_BUTTON_BADGE_UNIFICATION_PLAN.md` |
| 버튼 컴포넌트 | `frontend/.../molecules/CardActionGroup.js`, `CardActionGroup.css` |
| 배지 | `frontend/.../atoms/StatusBadge.css`, `RemainingSessionsBadge.css` |
| 토큰 | `frontend/src/styles/unified-design-tokens.css`, `dashboard-tokens-extension.css` |
| 디자인 가이드 | `docs/design-system/PENCIL_DESIGN_GUIDE.md` |

---

**문서 버전**: 1.0
