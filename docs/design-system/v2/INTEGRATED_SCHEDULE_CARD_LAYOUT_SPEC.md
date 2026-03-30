# 통합 스케줄 사이드바 카드 레이아웃 스펙 — 최소·고정 크기 통일

**작성일**: 2025-03-14  
**목적**: 상태별 카드/버튼/배지 영역 크기 불일치 해소 — `min-height`, `min-width`, `gap`, `flex-basis` 등으로 고정 레이아웃 확보  
**참조**: `INTEGRATED_SCHEDULE_CARD_FINAL_SPEC.md`, `INTEGRATED_SCHEDULE_CARD_BUTTON_SPEC.md`, `PENCIL_DESIGN_GUIDE.md`, `unified-design-tokens.css`

---

## 1. 문제 정의

### 1.1 현재 불일치 요약

| 영역 | 현상 | 원인 |
|------|------|------|
| **버튼** | 결제 확인(83px) vs 입금 확인(72px) — 너비 불일치 | 텍스트 길이 차이로 인한 auto width |
| **card-meta** | 30px vs 28px 높이, 282px vs 270px 너비 불일치 | 배지 구성·텍스트 길이에 따른 변동 |
| **card-container** | 158px 등 — 카드 높이가 상태별로 상이 | card-body / card-meta / card-actions 영역 높이 변동 |

### 1.2 목표

- **mg-v2-card-container**, **integrated-schedule__card-meta**, **mg-v2-card-actions** 내 버튼의 **최소 크기·고정 레이아웃** 확보
- 상태(결제 대기/입금 대기/승인 대기/활성 등)에 관계없이 **동일한 비주얼 높이·너비** 유지

---

## 2. mg-v2-card-container 스펙

### 2.1 대상 셀렉터

```css
.integrated-schedule__sidebar .integrated-schedule__list > li.integrated-schedule__card .mg-v2-card-container
```

또는 공통 컴포넌트:

```css
.mg-v2-card-container
```

### 2.2 고정·최소 레이아웃 속성

| 속성 | 값 | 토큰 / 비고 |
|------|-----|-------------|
| **min-height** | `172px` | 고정 (카드 전체 높이 통일) |
| **padding** | `var(--mg-spacing-16)` (16px) | 기존 유지 |
| **display** | `flex` | 내부 영역 배치 |
| **flex-direction** | `column` | card-body → card-actions 순 |
| **gap** | `var(--mg-spacing-12)` (12px) | card-body ↔ card-actions |
| **border** | `1px solid var(--mg-color-border-main)` | 기존 |
| **border-radius** | `var(--mg-radius-lg)` | 12px |
| **box-shadow** | `var(--mg-shadow-sm)` | 기본 |
| **box-shadow (hover)** | `var(--mg-card-hover-shadow)` | hover 시 |
| **transition** | `box-shadow 0.2s ease` | box-shadow만 |
| **background** | `var(--mg-bg-card, var(--mg-color-surface-main))` | 기존 |

### 2.3 min-height 산정 근거

- **card-body**: parties(≈22px) + gap(12px) + card-meta(32px) ≈ 66px  
- **card-actions**: min-height 44px  
- **패딩**: 16px × 2 = 32px  
- **gap**: 12px  
- **합계**: 66 + 12 + 44 + 32 = **154px** → 여유를 두어 **172px** 권장 (또는 168px)

---

## 3. integrated-schedule__card-body 스펙

### 3.1 레이아웃 속성

| 속성 | 값 | 토큰 / 비고 |
|------|-----|-------------|
| **display** | `flex` | |
| **flex-direction** | `column` | parties → meta 순 |
| **gap** | `var(--mg-spacing-8)` (8px) | parties ↔ meta |
| **min-height** | `64px` | `var(--mg-spacing-3xl)` 또는 64px 고정 |

---

## 4. integrated-schedule__card-meta 스펙

### 4.1 고정·최소 레이아웃

| 속성 | 값 | 토큰 / 비고 |
|------|-----|-------------|
| **display** | `flex` | |
| **flex-wrap** | `wrap` | 긴 텍스트 시 줄바꿈 허용 |
| **align-items** | `center` | 수직 정렬 |
| **gap** | `var(--mg-spacing-8)` (8px) | StatusBadge ↔ RemainingSessionsBadge |
| **min-height** | `32px` | 배지 높이 통일 (line-height ≈ 20px + padding) |
| **min-width** | `120px` | 최소 너비로 상태별 변동 완화 (선택) |

### 4.2 배지 (StatusBadge, RemainingSessionsBadge)

| 요소 | min-height | padding | font-size | 비고 |
|------|------------|---------|-----------|------|
| StatusBadge (`.mg-v2-status-badge`) | `24px` | `var(--mg-spacing-2) var(--mg-spacing-8)` | `var(--mg-font-xs)` | line-height 20px 가정 |
| RemainingSessionsBadge (`.mg-v2-count-badge`) | `24px` | `var(--mg-spacing-2) var(--mg-spacing-6)` | `var(--mg-font-xs)` | 동일 |

- 두 배지 모두 **min-height: 24px**로 통일 시 card-meta min-height 32px 유지 가능.

---

## 5. mg-v2-card-actions 내 버튼 스펙

### 5.1 card-actions 영역

| 속성 | 값 | 토큰 / 비고 |
|------|-----|-------------|
| **display** | `flex` | |
| **flex-wrap** | `wrap` | 버튼 2개 시 wrap 허용 |
| **align-items** | `center` | |
| **justify-content** | `center` | **중앙 정렬** (기존 `flex-end` → 변경) |
| **gap** | `var(--mg-spacing-8)` (8px) | 버튼 간격 |
| **min-height** | `44px` | `var(--touch-target-min)` (터치·접근성) |
| **margin-top** | `var(--mg-spacing-4)` (4px) | card-body와 시각적 구분 (선택, 또는 gap으로 처리) |

### 5.2 액션 버튼 (결제 확인·입금 확인·승인·스케줄 등록)

**문제**: 텍스트 길이("결제 확인" 4자 vs "입금 확인" 4자 vs "승인" 2자)에 따라 버튼 너비 72px ~ 83px 등으로 불일치.

**해결**: **min-width**, **min-height**로 고정 (small → medium 사이 적용).

| 속성 | 값 | 토큰 / 비고 |
|------|-----|-------------|
| **min-width** | `100px` | 모든 액션 버튼 공통 — 기존 88px → 확대 (104px도 가능, 8px 그리드) |
| **min-height** | `40px` | `var(--button-height-default)` — medium 사이즈 |
| **padding** | `var(--mg-spacing-6) var(--mg-spacing-12)` | 6px 12px |
| **font-size** | `var(--mg-font-sm)` | 13~14px |
| **font-weight** | `600` | |
| **border-radius** | `var(--mg-radius-sm)` | 8px |
| **white-space** | `nowrap` | 텍스트 줄바꿈 방지 |

### 5.3 버튼별 적용 대상

| 버튼 | 클래스 | min-width / min-height |
|------|--------|------------------------|
| 결제 확인 | `.mg-v2-button--success`, `integrated-schedule__btn-action--payment` | `100px` / `40px` |
| 입금 확인 | `.mg-v2-button--primary`, `integrated-schedule__btn-action--deposit` | `100px` / `40px` |
| 승인 | `.mg-v2-button--success`, `integrated-schedule__btn-action--approve` | `100px` / `40px` |
| 스케줄 등록 | `.mg-v2-button--primary`, `integrated-schedule__btn-schedule` | `100px` / `40px` |

### 5.4 셀렉터 (core-coder 적용용)

```css
/* 통합 스케줄 사이드바 카드 card-actions — 중앙 정렬 */
.integrated-schedule__sidebar .mg-v2-card-actions,
.mg-v2-card-actions.mg-v2-card-actions--integrated-schedule {
  justify-content: center;
}

/* 통합 스케줄 사이드바 카드 액션 버튼 — min-width/min-height 통일 (medium) */
.integrated-schedule__sidebar .mg-v2-card-actions .mg-v2-button,
.mg-v2-card-actions.mg-v2-card-actions--integrated-schedule .mg-v2-button {
  min-width: 100px;
  min-height: 40px;
  white-space: nowrap;
}
```

또는 ActionButton / CardActionGroup에 `integrated-schedule__btn-action` 등 통일 클래스가 있다면:

```css
.integrated-schedule__sidebar .integrated-schedule__btn-action,
.integrated-schedule__sidebar .integrated-schedule__btn-schedule {
  min-width: 100px;
  min-height: 40px;
  white-space: nowrap;
}
```

---

## 6. 통합 수치 요약표

| 대상 | 속성 | 값 | 토큰 |
|------|------|-----|------|
| **mg-v2-card-container** | min-height | 172px | — |
| | gap | 12px | `var(--mg-spacing-12)` |
| | padding | 16px | `var(--mg-spacing-16)` |
| **integrated-schedule__card-body** | gap | 8px | `var(--mg-spacing-8)` |
| | min-height | 64px | `var(--mg-spacing-3xl)` |
| **integrated-schedule__card-meta** | min-height | 32px | — |
| | gap | 8px | `var(--mg-spacing-8)` |
| **mg-v2-card-actions** | justify-content | center | 중앙 정렬 |
| | min-height | 44px | `var(--touch-target-min)` |
| | gap | 8px | `var(--mg-spacing-8)` |
| **액션 버튼** | min-width | 100px | medium 확대 |
| | min-height | 40px | `var(--button-height-default)` |
| **배지 (StatusBadge, RemainingSessionsBadge)** | min-height | 24px | — |

---

## 7. flex-basis 대안 (버튼 통일)

min-width 대신 **flex-basis**로 버튼 영역을 고정할 수 있다:

```css
.integrated-schedule__sidebar .mg-v2-card-actions .mg-v2-button {
  flex: 0 0 100px;  /* flex-grow: 0, flex-shrink: 0, flex-basis: 100px */
  min-width: 100px;
  min-height: 40px;
  white-space: nowrap;
}
```

- **min-width 100px**, **min-height 40px**로 충분. flex-basis는 2개 버튼이 나란히 있을 때 동일 너비를 강제하고 싶을 때 보조로 사용.

---

## 8. 구현 체크리스트

- [ ] `.mg-v2-card-container`에 `min-height: 172px`, `display: flex`, `flex-direction: column`, `gap: var(--mg-spacing-12)` 적용
- [ ] `.integrated-schedule__card-body`에 `gap: var(--mg-spacing-8)`, `min-height: 64px` 적용
- [ ] `.integrated-schedule__card-meta`에 `min-height: 32px`, `gap: var(--mg-spacing-8)` 적용
- [ ] `.mg-v2-card-actions`에 `justify-content: center`, `min-height: 44px` (`var(--touch-target-min)`), `gap: var(--mg-spacing-8)` 적용
- [ ] 액션 버튼(결제 확인·입금 확인·승인·스케줄 등록)에 `min-width: 100px`, `min-height: 40px`, `white-space: nowrap` 적용
- [ ] StatusBadge·RemainingSessionsBadge에 `min-height: 24px` 적용 (선택)
- [ ] 상태별(PENDING_PAYMENT, PAYMENT_CONFIRMED, DEPOSIT_PENDING, ACTIVE 등) 카드 높이 동일 확인

---

## 9. 참조 문서

| 문서 | 용도 |
|------|------|
| `INTEGRATED_SCHEDULE_CARD_FINAL_SPEC.md` | 카드 시각·마크업 최종 스펙 |
| `INTEGRATED_SCHEDULE_CARD_BUTTON_SPEC.md` | 버튼 색상·variant·토큰 |
| `PENCIL_DESIGN_GUIDE.md` | 디자인 단일 소스·토큰 |
| `unified-design-tokens.css` | `--mg-spacing-*`, `--touch-target-min` 등 |

---

**문서 버전**: 1.0  
**다음 담당**: core-coder (CSS 구현) — CardContainer.css, CardActionGroup.css, CardMeta.css, ActionButton.css, IntegratedMatchingSchedule.css 등에 적용
