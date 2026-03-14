# 통합 스케줄 사이드바 카드 최종 스펙 (core-publisher 구현용)

**작성일**: 2025-03-14  
**목적**: 통합 스케줄 사이드바 카드(`integrated-schedule__card`, fc-event) 시각 통일 및 core-publisher HTML 마크업 기준  
**참조**: `INTEGRATED_SCHEDULE_CARD_DESIGN_PLAN.md`, `CARD_VISUAL_UNIFIED_SPEC.md`, `INTEGRATED_SCHEDULE_LAYOUT_AND_CARD_SPEC.md`, `PENCIL_DESIGN_GUIDE.md`

---

## 1. 카드 최종 시각 스펙

### 1.1 대상 요소

- **루트**: `li.integrated-schedule__card` (옵션: `.fc-event` 유지 시)
- **컨텍스트**: `.integrated-schedule__sidebar .integrated-schedule__list > li`

### 1.2 시각 속성 (토큰 우선)

| 속성 | 값 | 토큰 / 비고 |
|------|-----|-------------|
| **border** | 1px solid | `var(--mg-color-border-main)` |
| **border-radius** | 12px | `var(--mg-radius-lg)` 또는 `var(--mg-border-radius-lg)` |
| **padding** | 16px | `var(--mg-spacing-16)` |
| **min-height** | 140px | 고정 |
| **box-shadow** (기본) | `0 1px 2px rgba(0,0,0,0.05)` | `var(--mg-shadow-sm)` |
| **box-shadow** (hover) | `0 4px 12px rgba(0,0,0,0.08)` | `var(--mg-card-hover-shadow)` |
| **background** | — | `var(--mg-bg-card, var(--mg-color-surface-main))` |
| **transition** | 0.2s ease | `box-shadow`만 |
| **font-size** | inherit | fc-event 전역 `0.8rem`/`11px` 덮어쓰기 |

### 1.3 좌측 악센트 (::before)

| 속성 | 값 |
|------|-----|
| content | `''` |
| position | absolute |
| left | 0 |
| top | 0 |
| bottom | 0 |
| width | 4px |
| background-color | `var(--mg-color-primary-main)` |
| border-radius | `12px 0 0 12px` (좌상·좌하만 둥글게) |

### 1.4 Hover 스펙

| 상태 | 적용 |
|------|------|
| 기본 | `box-shadow: var(--mg-shadow-sm)` |
| hover | `box-shadow: var(--mg-card-hover-shadow)` |
| transition | `box-shadow 0.2s ease` |
| **금지** | `transform` 사용 금지 (fc-event 전역 scale 무시) |

---

## 2. fc-event 유지 시 셀렉터·Specificity

FullCalendar Draggable을 위해 `fc-event` 클래스를 유지하는 경우, 전역 `.fc-event`가 덮어쓰지 않도록 **적용할 셀렉터**와 **로드 순서**를 준수한다.

### 2.1 권장 셀렉터 (Specificity)

카드 시각 스펙을 적용하는 CSS는 다음 셀렉터로 선언한다.

```
.integrated-schedule__sidebar .integrated-schedule__list > li.integrated-schedule__card,
.integrated-schedule__sidebar .integrated-schedule__list > li.integrated-schedule__card.fc-event
```

- **Specificity**: (0, 3, 0) — 클래스 3개
- 전역 `.fc-event` (0, 1, 0)보다 우선 적용
- 동일 블록 내에서 **fc-event 유무 관계없이 동일 값**을 적용해 일관성 유지

### 2.2 CSS 로드 순서

- `IntegratedMatchingSchedule.css`는 다음 파일 **이후** 로드되어야 함:
  - `ScheduleCalendar.css`
  - `ConsultantSchedule.css`
  - `unified-design-tokens.css` (fc-event 규칙 포함 시)
  - `ScheduleB0KlA.css`

### 2.3 fc-event 무시할 전역 규칙 (덮어쓰기 대상)

| 전역 규칙 | 덮어쓸 값 |
|-----------|-----------|
| border: none / transparent | `1px solid var(--mg-color-border-main)` |
| border-radius: 4px | `var(--mg-radius-lg)` |
| padding: 2px 4px / 6px | `var(--mg-spacing-16)` |
| font-size: 0.8rem / 11px | `inherit` |
| background (캘린더용) | `var(--mg-bg-card, var(--mg-color-surface-main))` |
| transform (hover) | `transform: none` |

### 2.4 대안: fc-event 분리 (옵션 B)

- `fc-event` 대신 `integrated-schedule__card--draggable` 사용
- Draggable `itemSelector`: `.integrated-schedule__card--draggable`
- 이 경우 fc-event 전역 규칙과 완전 분리됨

---

## 3. 마크업 구조 (core-publisher용)

### 3.1 전체 구조

```
.integrated-schedule__list
  └ li.integrated-schedule__card [.fc-event?]
      ├ .integrated-schedule__card-body
      │   ├ .integrated-schedule__card-parties  (상담사→내담자)
      │   └ .integrated-schedule__card-meta     (상태배지 + 회기남음)
      └ .integrated-schedule__card-actions      (버튼 그룹)
```

### 3.2 상세 마크업 (HTML 조각)

```html
<!-- Organism: 통합 스케줄 사이드바 카드 -->
<!-- li는 .integrated-schedule__list의 직계 자식 -->
<li class="integrated-schedule__card" data-mapping-id="">
  <!-- card-body: 상담사→내담자 + 메타 -->
  <div class="integrated-schedule__card-body">
    <!-- 상담사→내담자 행 -->
    <div class="integrated-schedule__card-parties">
      <span class="integrated-schedule__card-consultant">김선희</span>
      <span class="integrated-schedule__card-arrow" aria-hidden="true">→</span>
      <span class="integrated-schedule__card-client">이재학</span>
    </div>
    <!-- 상태배지 + 회기남음 -->
    <div class="integrated-schedule__card-meta">
      <span class="integrated-schedule__card-status integrated-schedule__card-status--active">활성</span>
      <span class="integrated-schedule__card-remaining integrated-schedule__card-remaining-badge">1회 남음</span>
    </div>
  </div>
  <!-- card-actions: 결제/입금/승인/스케줄 등록 버튼 -->
  <div class="integrated-schedule__card-actions">
    <button type="button" class="mg-button integrated-schedule__btn-schedule" aria-label="스케줄 등록">
      스케줄 등록
    </button>
  </div>
</li>
```

### 3.3 배치 및 레이아웃

| 영역 | 배치 | 비고 |
|------|------|------|
| **card-body** | flex-direction: column, gap: `var(--mg-spacing-12)` | 상단. parties → meta 순 |
| **card-parties** | 상담사 → 화살표(→) → 내담자, 한 줄 | 14px, fontWeight 600, `var(--mg-color-text-main)` |
| **card-meta** | flex, gap: 8px | StatusBadge + RemainingSessionsBadge |
| **card-actions** | flex, gap: 8px, flex-wrap: wrap, justify: flex-end | 하단. 버튼은 `mg-button`, `integrated-schedule__btn-action`, `integrated-schedule__btn-schedule` 등 |

### 3.4 상태배지 클래스 매핑

| status | 클래스 |
|--------|--------|
| ACTIVE | `integrated-schedule__card-status--active` |
| PENDING_PAYMENT | `integrated-schedule__card-status--pending_payment` |
| PAYMENT_CONFIRMED | `integrated-schedule__card-status--payment_confirmed` |
| DEPOSIT_PENDING | `integrated-schedule__card-status--deposit_pending` |
| INACTIVE | `integrated-schedule__card-status--inactive` |
| TERMINATED | `integrated-schedule__card-status--terminated` |
| SESSIONS_EXHAUSTED | `integrated-schedule__card-status--sessions_exhausted` |
| SUSPENDED | `integrated-schedule__card-status--suspended` |

### 3.5 버튼 구성 (상태별)

| 상태 | card-actions 내 버튼 |
|------|----------------------|
| PENDING_PAYMENT | 결제 확인 + 스케줄 등록 |
| PAYMENT_CONFIRMED | 입금 확인 + 스케줄 등록 |
| DEPOSIT_PENDING | 승인 + 스케줄 등록 |
| ACTIVE 등 | 스케줄 등록만 |

---

## 4. HTML 템플릿 (퍼블리셔 복사용)

아래는 core-publisher가 JSX 없이 HTML 조각으로 바로 사용할 수 있는 템플릿이다. `class`는 JSX에서는 `className`으로 변환한다.

```html
<!-- 통합 스케줄 사이드바 카드 - 최종 마크업 템플릿 -->
<li class="integrated-schedule__card" data-mapping-id="{mappingId}">
  <div class="integrated-schedule__card-body">
    <div class="integrated-schedule__card-parties">
      <span class="integrated-schedule__card-consultant">{consultantName}</span>
      <span class="integrated-schedule__card-arrow" aria-hidden="true">→</span>
      <span class="integrated-schedule__card-client">{clientName}</span>
    </div>
    <div class="integrated-schedule__card-meta">
      <span class="integrated-schedule__card-status integrated-schedule__card-status--{status}">{statusLabel}</span>
      <span class="integrated-schedule__card-remaining integrated-schedule__card-remaining-badge">{remainingSessions}회 남음</span>
    </div>
  </div>
  <div class="integrated-schedule__card-actions">
    <!-- 상태별 버튼 조건부 표시 -->
    <button type="button" class="mg-button integrated-schedule__btn-action integrated-schedule__btn-action--payment" aria-label="결제 확인">결제 확인</button>
    <button type="button" class="mg-button integrated-schedule__btn-action integrated-schedule__btn-action--deposit" aria-label="입금 확인">입금 확인</button>
    <button type="button" class="mg-button integrated-schedule__btn-action integrated-schedule__btn-action--approve" aria-label="승인">승인</button>
    <button type="button" class="mg-button integrated-schedule__btn-schedule" aria-label="스케줄 등록">스케줄 등록</button>
  </div>
</li>
```

**동적 플레이스홀더**:
- `{mappingId}`: 매칭 ID
- `{consultantName}`, `{clientName}`: 상담사·내담자 이름
- `{status}`: 소문자·언더스코어 (예: `active`, `pending_payment`)
- `{statusLabel}`: 한글 라벨 (예: 활성, 결제 대기)
- `{remainingSessions}`: 남은 회기 수 (숫자)

---

## 5. 체크리스트

### 시각 스펙
- [ ] border, border-radius, padding, min-height, box-shadow, background가 CARD_VISUAL_UNIFIED_SPEC과 동일
- [ ] `::before` 좌측 악센트 4px, primary-main, radius 12px 0 0 12px
- [ ] hover 시 box-shadow만 변경, transform 미적용

### fc-event 유지 시
- [ ] `.integrated-schedule__sidebar .integrated-schedule__list > li.integrated-schedule__card` 및 `.fc-event` 동일 스타일 적용
- [ ] IntegratedMatchingSchedule.css 로드 순서가 fc-event 관련 파일 이후
- [ ] specificity (0, 3, 0)로 전역 .fc-event 덮어쓰기

### 마크업
- [ ] `li` > `card-body` + `card-actions` 구조
- [ ] `card-body` 내 `card-parties` → `card-meta` 순
- [ ] 클래스명 BEM 준수 (`integrated-schedule__*`)
- [ ] 시맨틱·접근성: `aria-label`, `aria-hidden` 반영

---

**문서 버전**: 1.0  
**다음 담당**: core-publisher (HTML 마크업) → core-coder (JSX·로직·CSS 연동)
