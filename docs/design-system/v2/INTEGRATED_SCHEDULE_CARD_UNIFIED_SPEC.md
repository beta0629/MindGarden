# 통합 스케줄 매칭 카드 — 통합 시각 스펙 (Unified Card Spec)

## 1. 개요 및 목적

- **대상 화면**: `/admin/integrated-schedule` (통합 스케줄링 센터) 좌측 **매칭 카드**
- **목적**: 결제 단계별로 달랐던 카드 높이·버튼 구성·비주얼을 **동일한 높이·레이아웃**으로 통일하고, 아토믹 컴포넌트별 B0KlA 토큰 기반 시각 스펙을 명시한다.
- **산출물**: 코더가 추측 없이 구현할 수 있는 **높이·패딩·토큰·클래스** 명세. **코드 작성 없음.**

---

## 2. 디자인 기준

- **단일 소스**: `mindgarden-design-system.pen`, `pencil-new.pen`, `frontend/src/styles/unified-design-tokens.css`
- **참조**: 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample
- **필수 문서**: `docs/design-system/PENCIL_DESIGN_GUIDE.md`, `docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_BUTTON_SPEC.md`

---

## 3. 카드 높이 통일

### 3.1 전체 카드 (`.integrated-schedule__card` 또는 `MappingScheduleCard`)

| 규칙 | 값 | 설명 |
|------|-----|------|
| **min-height** | `140px` | 결제 단계와 관계없이 모든 카드 동일 최소 높이. 콘텐츠·버튼 개수와 무관. |
| **padding** | `var(--mg-spacing-16)` (16px) | 카드 내부 패딩 |
| **gap** (body ↔ actions) | `var(--mg-spacing-12)` (12px) | card-body와 card-actions 사이 간격 |
| **display** | `flex` | |
| **flex-direction** | `column` | |

### 3.2 카드 내부 영역별 높이·구조

| 영역 | min-height | 역할 |
|------|------------|------|
| **card-body** | `64px` | 상담사→내담자, StatusBadge, RemainingSessionsBadge 영역 |
| **card-actions** | `44px` | 버튼 영역 고정 (버튼 1개/2개 모두 동일) |

**권장 CSS 예시 (구현용)**:
```css
.integrated-schedule__card {
  min-height: 140px;
  padding: var(--mg-spacing-16);
  display: flex;
  flex-direction: column;
  gap: var(--mg-spacing-12);
}

.integrated-schedule__card-body {
  min-height: 64px;
}

.integrated-schedule__card-actions {
  min-height: 44px;
}
```

---

## 4. 액션 영역 (CardActionGroup)

### 4.1 높이·레이아웃

| 규칙 | 값 | 설명 |
|------|-----|------|
| **min-height** | `44px` | 터치·접근성 기준 고정 |
| **display** | `flex` | |
| **flex-wrap** | `wrap` | 2개 이상 버튼 시 줄바꿈 허용 |
| **align-items** | `center` | |
| **gap** | `var(--mg-spacing-8)` (8px) | 버튼 간 간격 |
| **justify-content** | `flex-start` | 1개일 때 좌측 정렬 |

### 4.2 버튼 개수별 정책

| 버튼 수 | 동작 |
|---------|------|
| 1개 | 동일 44px 높이 유지, 좌측 정렬 |
| 2개 | 가로 배치, gap 8px. 좁은 너비 시 wrap 허용 |

### 4.3 버튼 공통 치수

- **height**: `36px` (MGButton small 기준, 카드 내부에서는 시각적 균형을 위해 36px 권장. 44px도 허용)
- **padding**: `8px 12px`
- **font-size**: `13px`, **font-weight**: `600`
- **border-radius**: `var(--mg-radius-sm)` (8px)

---

## 5. 아토믹 컴포넌트별 시각 스펙 (B0KlA 토큰)

### 5.1 StatusBadge (상태 배지)

| 속성 | 토큰/값 |
|------|---------|
| display | `inline-flex` |
| align-items | `center` |
| padding | `var(--mg-spacing-2) var(--mg-spacing-8)` (2px 8px) |
| font-size | `12px` |
| font-weight | `600` |
| border-radius | `var(--mg-radius-full)` (pill) |
| font-family | Noto Sans KR |

**상태별 색상 매핑**:

| 상태 | 배경 토큰 | 텍스트 토큰 |
|------|-----------|-------------|
| active, payment_confirmed, deposit_pending | `var(--mg-success-100)` | `var(--mg-success-700)` |
| pending_payment | `var(--mg-warning-100)` | `var(--mg-warning-700)` |
| inactive, terminated, sessions_exhausted, suspended | `var(--mg-gray-100)` | `var(--mg-gray-600)` |
| 기본 | `var(--mg-color-surface-sub)` | `var(--mg-color-text-main)` |

**클래스명**: `.integrated-schedule__card-status`, `.integrated-schedule__card-status--{status}` (소문자, 언더스코어)

---

### 5.2 RemainingSessionsBadge (남은 회기 배지)

| 속성 | 토큰/값 |
|------|---------|
| display | `inline-flex` |
| align-items | `center` |
| padding | `var(--mg-spacing-2) var(--mg-spacing-6)` (2px 6px) |
| font-size | `11px` |
| font-weight | `500` |
| border-radius | `var(--mg-radius-sm)` (6px) |
| background | `var(--mg-primary-100)` 또는 `var(--mg-color-primary-light)` |
| color | `var(--mg-primary-700)` 또는 `var(--mg-color-primary-main)` |

**클래스명**: `.integrated-schedule__card-remaining-badge` 또는 `mg-v2-mapping-remaining-badge`

---

### 5.3 MappingPartiesRow (상담사 → 내담자 행)

| 속성 | 토큰/값 |
|------|---------|
| font-size | `14px` |
| color | `var(--mg-color-text-main)` |
| font-weight (이름) | `600` |

**구성 요소**:
- **상담사명**: `.integrated-schedule__card-consultant`
- **화살표**: `→` 문자, `color: var(--mg-color-text-secondary)`, `margin: 0 var(--mg-spacing-4)`
- **내담자명**: `.integrated-schedule__card-client`

**클래스명**: `.integrated-schedule__card-parties`

---

### 5.4 CardActionGroup (액션 버튼 그룹)

| 속성 | 토큰/값 |
|------|---------|
| min-height | `44px` |
| display | `flex` |
| flex-wrap | `wrap` |
| align-items | `center` |
| gap | `var(--mg-spacing-8)` |
| margin-top | `0` (gap으로 card-body와 분리) |

**클래스명**: `.integrated-schedule__card-actions` 또는 `mg-v2-mapping-card-actions`

**버튼 시맨틱 색상** (INTEGRATED_SCHEDULE_CARD_BUTTON_SPEC.md와 동일):

| 버튼 | 배경 | 텍스트 | hover |
|------|------|--------|-------|
| 결제 확인 | `var(--mg-success-600)` | `var(--mg-color-white)` | `var(--mg-success-700)` |
| 입금 확인 | `var(--mg-color-primary-main)` | `var(--mg-color-primary-inverse)` | `var(--mg-color-primary-dark)` |
| 승인 | `var(--mg-success-600)` | `var(--mg-color-white)` | `var(--mg-success-700)` |
| 스케줄 등록 | `var(--mg-color-primary-main)` | `var(--mg-color-primary-inverse)` | `var(--mg-color-primary-dark)` |
| 스케줄 등록 (disabled) | `var(--mg-color-border-main)` | — | `opacity: 0.6` |

---

## 6. 카드 전체 레이아웃 토큰

### 6.1 카드 컨테이너

| 속성 | 토큰/값 |
|------|---------|
| background | `var(--mg-bg-card)` 또는 `var(--mg-color-surface-main)` |
| border | `1px solid var(--mg-color-border-main)` |
| border-radius | `var(--mg-radius-lg)` (12px) |
| box-shadow | `var(--mg-shadow-sm)` |
| hover box-shadow | `var(--mg-card-hover-shadow)` |
| 좌측 악센트 바 | `width: 4px`, `background: var(--mg-color-primary-main)`, `border-radius: 12px 0 0 12px` |

### 6.2 card-meta (StatusBadge + RemainingSessionsBadge 컨테이너)

| 속성 | 토큰/값 |
|------|---------|
| display | `flex` |
| flex-wrap | `wrap` |
| align-items | `center` |
| gap | `var(--mg-spacing-8)` |

---

## 7. 토큰·클래스 요약 (코더용)

| 컴포넌트 | CSS 클래스 | 핵심 토큰 |
|----------|------------|-----------|
| 카드 | `.integrated-schedule__card` | min-height 140px, padding 16px, gap 12px |
| card-body | `.integrated-schedule__card-body` | min-height 64px |
| card-actions | `.integrated-schedule__card-actions` | min-height 44px, gap 8px |
| StatusBadge | `.integrated-schedule__card-status` | 12px, 600, pill radius |
| RemainingSessionsBadge | `.integrated-schedule__card-remaining-badge` | 11px, primary 계열 |
| MappingPartiesRow | `.integrated-schedule__card-parties` | 14px, text-main |
| CardActionGroup | `.integrated-schedule__card-actions` | flex, wrap, 44px min-height |

---

## 8. 구현 시 체크리스트

- [ ] `.integrated-schedule__card`에 `min-height: 140px` 적용
- [ ] `.integrated-schedule__card-body`에 `min-height: 64px` 적용
- [ ] `.integrated-schedule__card-actions`에 `min-height: 44px`, `height: 44px` (선택) 적용
- [ ] 버튼 1개·2개 모두 동일한 액션 영역 높이 유지
- [ ] 버튼 2개 시 가로 배치, `gap: var(--mg-spacing-8)`, `flex-wrap: wrap`
- [ ] StatusBadge·RemainingSessionsBadge·MappingPartiesRow B0KlA 토큰 적용
- [ ] 카드 좌측 악센트 바(4px, primary) 유지
- [ ] `INTEGRATED_SCHEDULE_CARD_BUTTON_SPEC.md`의 버튼 스타일·MGButton 적용과 일치

---

**문서 버전**: 1.0  
**작성일**: 2025-03-14  
**참조**: `PENCIL_DESIGN_GUIDE.md`, `INTEGRATED_SCHEDULE_CARD_BUTTON_SPEC.md`, `MATCHING_SCHEDULE_INTEGRATION_SPEC.md`  
**적용 화면**: `/admin/integrated-schedule` (통합 스케줄링 센터 좌측 매칭 카드)
