# 통합일정 사이드바 매칭 카드 스타일 변경 — 기획서

**작성일**: 2026-06-30  
**담당**: core-planner  
**화면**: `/admin/integrated-schedule` — 좌측 `integrated-schedule__sidebar`  
**대상 컴포넌트**: `MappingScheduleCard`, `CardContainer`(`mg-v2-card-container`), `CardActionGroup`, `MappingMatchActions`  
**참조**: `ADMIN_UI_DENSITY_AUDIT_20260627.md`, `INTEGRATED_SCHEDULE_CARD_LAYOUT_SPEC.md`, `INTEGRATED_SCHEDULE_CARD_FINAL_SPEC.md`, B2B compact list item 벤치마크(Stripe Customer list · HubSpot record row)

---

## 1. 목표

통합일정 사이드바 매칭 카드의 **레이아웃·시각 계층·버튼 정렬**을 재설계하여, 380px 좁은 패널에서도 **스캔 가능·DnD affordance 유지·액션 일관성**을 확보한다. 기능·상태 분기·API는 변경하지 않고 **카드 스타일(마크업 구조·CSS·배치)** 만 변경한다.

---

## 2. 현재 문제 — UX 진단 (1페이지)

### 2.1 사용자·운영 맥락

| 항목 | 내용 |
|------|------|
| **사용자** | 어드민(스케줄 담당) — 매칭 목록을 훑으며 캘린더에 일정 배치 |
| **핵심 동작** | (1) 카드 스캔 (2) DnD 또는 «일정 등록» (3) 상태별 결제·승인·취소 |
| **패널** | 사이드바 고정 **380px** (`--integrated-schedule-sidebar-width`), 독립 스크롤 목록 |
| **밀도 기대** | 10~30건 목록을 빠르게 훑을 수 있어야 함 (`ADMIN_UI_DENSITY_AUDIT` P1 리스크 동일 계열) |

### 2.2 구조적 문제 (정보 계층)

```
[현재 카드 — 수직 스택, 시각 무게 불균형]

┌─────────────────────────────────────┐  ← mg-v2-card-container (min-height 140px 전역)
│ 김선희 선생님 → 이재학 내담자        │  ← parties: inline span, 좌측 몰림
│ [활성] [3 회기 남음]                 │  ← meta: 배지 2개, parties 바로 아래
│                                     │
│ ┌─────────────────────────────────┐ │
│ │      일정 등록 (secondary)       │ │  ← outline, full-width
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │   당일 결제 + 활성화 (primary)   │ │  ← 또는 결제/입금/승인
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │      매칭 취소 (danger solid)    │ │  ← full-width, 시각적으로 primary급
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

| # | 증상 | 근거 (코드·스펙) | UX 영향 |
|---|------|------------------|---------|
| **P1** | **상단 정보 좌측 몰림** | `MappingPartiesRow`가 flex/grid 없이 inline span; meta도 좌측 정렬만 | 이름·배지가 한 덩어리로 왼쪽에 쏠려 **카드 폭 활용·시선 흐름** 약함 |
| **P2** | **버튼 크기·정렬 불일치** | `MatchingScheduleList.css`에서 full-width column stack + `CardContainer` 전역 `min-height: 140px` vs 사이드바 override `min-height: 0` 혼재 | 상태·버튼 수에 따라 **카드 높이·버튼 티어**가 달라 **리스트 리듬** 깨짐 |
| **P3** | **액션 시각 계층 역전** | «일정 등록»(secondary outline)이 최상단 full-width → 상태 CTA(primary) → 취소(danger solid) | **주 동작(DnD·일정 등록)** vs **상태 처리** vs **파괴적 액션** 구분이 약함; 취소가 너무 강함 |
| **P4** | **B2C형 카드 잔재** | `mg-v2-card-container` 기본 패딩 16px·shadow·hover; 사이드바는 compact override만 적용 | `ADMIN_UI_DENSITY_AUDIT`의 **「카드 + 인라인 3~4버튼」** anti-pattern과 동일 계열 |
| **P5** | **DnD affordance 불명확** | `fc-event` + `cursor: grab`만; 카드 본문 vs 버튼 클릭 영역 구분 없음 | 드래그 핸들 없이 **버튼과 DnD 제스처 충돌** 우려 |
| **P6** | **스펙·구현 괴리** | `INTEGRATED_SCHEDULE_CARD_LAYOUT_SPEC`은 min-height 172px·버튼 min-width 100px·center 정렬 권장 vs 실제는 full-width column·xs 폰트 | patch-on-patch로 **「고정 레이아웃」 목표 달성 실패** |

### 2.3 Modify-first 판단

| 접근 | 설명 | 판단 |
|------|------|------|
| **A. `mg-v2-card-container` sidebar variant** | 공통 CardContainer에 `variant="sidebar-compact"` 등 추가 | ✅ **권장** — SSOT 유지, 전역 min-height 140px만 variant에서 해제 |
| **B. 사이드바 전용 래퍼** | `integrated-schedule__list-item` 신규, CardContainer 미사용 | ⚠️ 가능하나 카드 시각 SSOT(`CARD_VISUAL_UNIFIED_SPEC`) 이탈 |
| **C. `MappingCard` 공통화** | `ui/Card/MappingCard.js`와 합침 | ❌ **본 배치 제외** — 매칭 관리 목록은 table/overflow 방향(`ADMIN_UI_DENSITY_AUDIT` Batch B), DOM·액션 매트릭스 상이 |

### 2.4 벤치마크 gap (`ADMIN_UI_DENSITY_AUDIT` Option 2 = mapping list pattern)

| B2B 기준 | Stripe / HubSpot compact row | 현재 사이드바 카드 |
|----------|------------------------------|-------------------|
| Row 높이 | ~56–72px (정보 1~2줄) | ~120–180px (버튼 스택) |
| Primary action | 1개 inline 또는 trailing | 2~3개 full-width stacked |
| Secondary / destructive | overflow (⋯) 또는 text link | danger solid full-width |
| 정보 계층 | Title + meta chips, actions 우측 | parties + meta + actions 전부 세로 |
| 스캔 | 20+ row / viewport | ~6–8 row / viewport |

---

## 3. 카드 스타일 안 (2~3안)

### 안 1 — **Compact List Row** (B2B 벤치마크, 권장)

**컨셉**: 카드가 아닌 **「매칭 목록 행」** — Stripe customer row / HubSpot list item.

```
┌──────────────────────────────────────────────────┐
│ ⋮⋮  김선희 → 이재학          [활성][3회기]  [일정]│
│     선생님   내담자                                │
└──────────────────────────────────────────────────┘
  ↑ grip      ↑ primary text (1줄 truncate)  ↑ chips  ↑ icon/compact CTA

[PENDING_PAYMENT + same-day]
┌──────────────────────────────────────────────────┐
│ ⋮⋮  박상담 → 최내담    [결제대기]     [당일결제] ⋯│
└──────────────────────────────────────────────────┘
                                              ↑ overflow: 취소
```

| 영역 | 배치 | 비고 |
|------|------|------|
| Leading | `⋮⋮` drag grip (24px) | DnD 전용; 버튼과 분리 |
| Body | parties 1줄 (`이름→이름`, honorific은 xs subline 또는 생략) | `text-overflow: ellipsis` |
| Meta | status + remaining chips, body 우측 또는 subline | `StatusBadge`, `RemainingSessionsBadge` 유지 |
| Actions | **Primary 1** (일정 등록 / 결제·입금·승인) compact `sm` + **overflow ⋯** (취소·회기추가) | `MappingEntityRowActions` 패턴 참고 |

**장점**: 밀도·정렬·B2B 일관성 최고. **단점**: 마크업·CSS 변경 폭 중간.

---

### 안 2 — **Two-Zone Panel** (Modify-first, 현 구조 유지)

**컨셉**: `mg-v2-card-container` 유지하되 **헤더 존 / 툴바 존** 2분할.

```
┌─────────────────────────────────────┐
│ HEADER (space-between)              │
│  김선희→이재학          [활성][3회기]│  ← parties 좌, meta 우
├─────────────────────────────────────┤
│ TOOLBAR (equal columns)             │
│ [ 일정 등록 ]  [ 상태 CTA ]  [ ⋯ ]  │  ← 3열 grid, 동일 높이 36px
└─────────────────────────────────────┘
```

| 영역 | 배치 |
|------|------|
| Header | `display: flex; justify-content: space-between; align-items: flex-start` |
| Toolbar | `grid-template-columns: 1fr 1fr auto` — 취소는 overflow |
| Container | `mg-v2-card-container--sidebar` — `min-height: auto`, padding `12px`, shadow 약화 |

**장점**: 기존 컴포넌트 트리 대부분 유지, DnD 변경 최소. **단점**: 여전히 카드형 높이; full-width 스택보다 나으나 안 1보다 밀도 낮음.

---

### 안 3 — **Drag Card Lite** (정보 최소 + hover reveal)

**컨셉**: 평소 1줄 compact; hover/focus 시 액션 슬라이드인.

```
[default]
┌─────────────────────────────────────┐
│ ⋮⋮ 김선희→이재학  [활성] 3회기 남음  │
└─────────────────────────────────────┘

[hover / focus-within]
┌─────────────────────────────────────┐
│ ⋮⋮ 김선희→이재학  [활성] 3회기 남음  │
│ [일정 등록]  [상태 CTA]  [취소]      │
└─────────────────────────────────────┘
```

**장점**: 최고 밀도. **단점**: 터치·키보드 접근성·액션 discoverability 리스크; 어드민 운영 화면에는 **비권장**.

---

### 안 비교

| 기준 | 안 1 Compact Row | 안 2 Two-Zone | 안 3 Hover Reveal |
|------|------------------|---------------|-------------------|
| 정보 밀도 | ★★★ | ★★☆ | ★★★ |
| 버튼 정렬 일관성 | ★★★ | ★★☆ | ★☆☆ (hidden) |
| DnD 명확성 | ★★★ | ★★☆ | ★★☆ |
| 구현 리스크 | 중 | 낮 | 높 |
| Density Audit 정합 | ★★★ | ★★☆ | ★☆☆ |
| Modify-first | variant 추가 | variant + grid | 구조 변경 큼 |

---

## 4. 권장안 — **안 1 Compact List Row**

### 4.1 선택 이유

1. 사용자 불만(**좌측 몰림·버튼 불일치·안정감**)의 근본 원인인 **세로 full-width 버튼 스택**을 제거한다.  
2. `ADMIN_UI_DENSITY_AUDIT_20260627` **Option 2 mapping list pattern**(primary 1 + overflow, compact row)과 정합한다.  
3. DnD **grip 분리**로 «일정 등록» 클릭과 드래그 충돌을 줄인다.  
4. `MappingCard` table/overflow 방향과 **시각 언어를 맞추되**, 사이드바는 DnD·즉시 CTA가 필요해 **별도 variant**가 타당하다.

### 4.2 정보 계층 (우선순위)

| 순위 | 요소 | 표현 |
|------|------|------|
| 1 | 매칭 주체 | 상담사→내담자 (semibold, 1줄) |
| 2 | 스케줄 가능 여부 | draggable grip + subtle border-left accent (scheduleable 시) |
| 3 | 상태·회기 | chips (xs) |
| 4 | Primary action | 일정 등록 또는 상태 CTA 1개 |
| 5 | Secondary | overflow (회기 추가, 매칭 취소) |

### 4.3 상태별 UI (overflow 매트릭스)

| status | Primary (trailing) | Overflow (⋯) |
|--------|-------------------|--------------|
| ACTIVE (scheduleable) | 일정 등록 | 회기 추가 |
| PAYMENT_CONFIRMED | 일정 등록 | — |
| DEPOSIT_PENDING | 일정 등록 | 승인은 primary로 승격 가능* |
| PENDING_PAYMENT (advance) | 결제 확인 | 매칭 취소 |
| PENDING_PAYMENT (same-day) | 당일 결제 + 활성화 | 매칭 취소 |
| 기타 (non-scheduleable) | — | 상태에 맞는 CTA만 |

\* DEPOSIT_PENDING: Primary = «승인», 일정 등록은 scheduleable 아닐 수 있음 — **기존 `canScheduleForMapping` 로직 유지**, 디자이너가 버튼 라벨·노출만 재배치.

### 4.4 DnD affordance

| 항목 | 스펙 |
|------|------|
| Grip | leading 24×full-height, `cursor: grab`, `aria-label="캘린더로 끌어 일정 등록"` |
| Draggable class | `integrated-schedule__card--draggable` (fc-event 분리 권장, `FC_EVENT_CARD_BORDER_DEBUG.md`) |
| Non-draggable | grip hidden 또는 disabled 스타일 |
| Drag preview | FullCalendar 기존 `eventData` 유지 |

### 4.5 FE / 디자이너 핸드오프

#### 컴포넌트·파일 (예상)

| 레이어 | 파일 | 변경 |
|--------|------|------|
| Organism | `MappingScheduleCard.js` | 2-column row 레이아웃 래퍼 추가 |
| Molecule | `MappingPartiesRow.js` | compact 1-line variant prop (`layout="compact"`) |
| Molecule | `CardActionGroup.js` | inline primary + overflow slot |
| Molecule | `MappingMatchActions.js` | 로직 유지, presentation은 overflow로 위임 검토 |
| Common | `CardContainer.js` | `variant="sidebar-row"` — `min-height: auto`, padding 10–12px |
| CSS | `MatchingScheduleList.css`, `MappingScheduleCard.css` | row grid, grip, toolbar |
| CSS | `CardContainer.css` | `--sidebar-row` modifier |

#### 디자인 토큰 (core-designer 산출)

| 토큰 | 권장값 |
|------|--------|
| Row min-height | `56px` (meta subline 없을 때) / `68px` (subline 있을 때) |
| Row gap | `var(--mg-spacing-sm)` |
| Row padding | `var(--mg-spacing-sm) var(--mg-spacing-md)` |
| Border | `1px solid var(--mg-color-border-main)`, radius `var(--mg-radius-md)` |
| Grip width | `24px` |
| Primary btn | `size="sm"`, `min-width: 72px`, trailing |
| Overflow | `EntityRowActions` / `CardActionGroup` overflow 패턴 |

#### 화면설계서 저장 위치 (designer 산출)

`docs/design-system/v2/INTEGRATED_SCHEDULE_SIDEBAR_CARD_COMPACT_ROW_SPEC.md`

포함 항목: ASCII wireframe 확정, spacing 표, 상태별 mock 6종, dark mode, 1280px 사이드바 스크롤 스크린샷 와이어.

---

## 5. 범위 경계

### 5.1 포함 (In scope)

- `integrated-schedule__sidebar` 내 `li.integrated-schedule__card` / `MappingScheduleCard` **스타일·레이아웃·마크업**
- `CardContainer` **sidebar-row variant** (전역 카드에 영향 없도록 modifier)
- `CardActionGroup` / `MappingMatchActions` **표현층** (overflow 분리)
- DnD grip UI (`MatchingScheduleList.js` itemSelector 연동)
- 관련 CSS·단위 테스트(`MatchingScheduleList.test.js`, `CardActionGroup.test.js`) 시각/구조 assertion 갱신

### 5.2 제외 (Out of scope)

- `ui/Card/MappingCard.js` · `MappingListBlock` table 뷰 (별도 Batch B)
- API·상태 머신·`canScheduleForMapping` 비즈니스 로직
- 사이드바 필터 chips·380px·collapse (최근 반영분 유지)
- 캘린더 영역·모달 (`CheckoutSameDayModal`, 취소 확인 모달) — 스타일만 카드에서 트리거

### 5.3 MappingCard 공통화 결론

| 질문 | 결론 |
|------|------|
| MappingCard와 동일 컴포넌트? | **No** — 액션 매트릭스·DnD·레이아웃이 다름 |
| 공유 가능 단위 | `StatusBadge`, `RemainingSessionsBadge`, `MappingMatchActions`(로직), `MappingEntityRowActions`(overflow UI) |
| SSOT 방향 | **「매칭 행 표현」** 은 `MappingRow` 계열로 추출 검토는 **후속**; 본 배치는 sidebar 전용 variant로 완결 |

---

## 6. 리스크·제약

| 리스크 | 완화 |
|--------|------|
| `CardContainer` 전역 `min-height: 140px` | 반드시 `variant` modifier로 override, 공통 카드 회귀 테스트 |
| overflow로 취소 숨김 → 발견성 저하 | PENDING_PAYMENT만 ⋯ 첫 항목에 «매칭 취소» + danger 스타일 |
| DnD grip 추가 시 RTL | grip을 leading physical start에 고정 |
| 기존 스펙 문서 다수 충돌 | 본 문서 + designer 신규 스펙으로 **사이드바 row 전용 SSOT** 갱신 |
| 하드코딩 게이트 | 색·간격은 `unified-design-tokens.css`만 (`PRE_PRODUCTION_GO_LIVE_CHECKLIST`) |

---

## 7. 다음 배치 — 분배실행

### Phase 0 → 1 (순차)

| Phase | 서브에이전트 | 목표 | 전달 프롬프트 요약 |
|-------|-------------|------|-------------------|
| **P1** | **core-designer** (`model: gemini-3.1-pro`) | 안 1 Compact List Row 화면설계 | 본 문서 §3 안1·§4 핸드오프. `ADMIN_UI_DENSITY_AUDIT` Option 2·B0KlA 어드민 샘플. 산출: `INTEGRATED_SCHEDULE_SIDEBAR_CARD_COMPACT_ROW_SPEC.md` — wireframe, spacing, 6상태 mock, DnD grip, overflow 매트릭스, dark |
| **P2** | **core-coder** | 설계 반영 구현 | designer 스펙 필수. `CardContainer` variant, `MappingScheduleCard` row layout, `CardActionGroup` inline+overflow. 참조: `INTEGRATED_SCHEDULE_CARD_FINAL_SPEC`, `COMMON_DISPLAY_BOUNDARY_MEETING`, `core-solution-frontend`. fc-event→`--draggable` 검토. 하드코딩 0 |
| **P3** | **core-tester** | 회귀·접근성 | `MatchingScheduleList.test.js`, `CardActionGroup.test.js`, DnD selector, overflow 키보드, 6상태 스냅샷, `check-hardcode` |

**병렬 불가**: P1 완료 후 P2 → P3.

### 검수 체크리스트 (완료 조건)

- [ ] 사이드바 380px에서 카드 row 높이 **상태 간 ±8px 이내** (primary 1개 기준)
- [ ] parties·meta **좌우 분리**(몰림 해소); 긴 이름 ellipsis
- [ ] Primary CTA **1개** trailing 정렬; 취소·회기추가는 overflow
- [ ] DnD grip과 버튼 클릭 영역 **겹침 없음**
- [ ] `mg-v2-card-container` 일반 사용처 **회귀 없음**
- [ ] scheduleable / non-scheduleable 시각 구분 유지
- [ ] dark mode · focus-visible
- [ ] 기존 RTL testid (`mapping-match-actions`, `mapping-cancel-pending-trigger`) 유지 또는 migration 문서화

---

## 8. 실행 요청문 (부모 에이전트용)

1. **core-designer** 호출 — §7 P1 프롬프트, `model: gemini-3.1-pro`  
2. designer 산출물 확인 후 **core-coder** — §7 P2  
3. **core-tester** — §7 P3 게이트  

---

## 9. 변경 이력

| 날짜 | 작성 | 내용 |
|------|------|------|
| 2026-06-30 | core-planner | 초안 — UX 진단, 3안, 권장 안1, 범위·분배실행 |
