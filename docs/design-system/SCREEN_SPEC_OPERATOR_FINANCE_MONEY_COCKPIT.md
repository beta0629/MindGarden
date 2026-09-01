# `/erp/dashboard` 운영자 머니 콕핏 — UI/UX 스펙

**문서 버전**: 1.0.0  
**작성일**: 2026-08-27  
**담당**: core-designer (시각 스펙만 · 코드 작성 없음)  
**라우트**: `/erp/dashboard`  
**브랜드**: Core Solution Clinic-OS (MindGarden 로고/히어로 브랜딩 금지)  
**대상 사용자**: 센터장/원장 — 질문 = “이번 달에 돈이 어떻게 됐지?”

**참조**
- IA: `docs/design/OPERATOR_FINANCE_IA.md`
- 토큰: `frontend/src/styles/unified-design-tokens.css`, `frontend/src/styles/tokens/design-v2-tokens.css`
- 스킬: design-handoff · atomic-design · encapsulation · common-modules
- 공통: `AdminCommonLayout`, `ErpPageShell`, `MGButton`, `MGChart`, `KpiNumeral`, `BadgeSelect` / 세그먼트, `EmptyState`, `ListTableView`(선택)

---

## 1. 개요 및 배경

현재 ErpDashboard **stacked-widget / ContentKpiRow + B0KlA admin-card** 패치는 실패로 판정.  
메트릭 순서만 바꾸는 소폭 패치는 **금지**. 페이지 레이아웃을 **완전 재구축**한다.

첫 뷰포트에서 **들어온 돈 / 나간 돈 / 남은 돈**이 즉시 읽혀야 하고, **차트는 페이지에서 가장 큰 세로 공간**을 차지한다.  
새 CSS 모듈 허용 — 옛 B0KlA 그리드에 억지로 맞추지 말 것.

---

## 2. 사용성 · 정보 노출 · 레이아웃 계약 (§0.4)

### 2.1 사용성

- 센터장/원장 1인칭: 월간 현금 감각(들어옴·나감·남음).
- 차트 = 메인 스테이지(최대 세로).
- 보조 링크 최대 3: 장부 · 상담사 지급 · 센터 경비 (한글 라벨).

### 2.2 정보 노출

- **클리닉 언어 금액만** 노출.
- `(터넌트: …)` / 테넌트 서브타이틀 **금지**.
- 분개 · 차변/대변 · 계정과목 · 대차대조표 · 조달 KPI · 승인센터 **비노출**.
- 권한/데이터 없는 secondary 행·블록은 **생략**(빈 껍데기 금지).
- 히어로 라벨 **「순이익」금지** → 「남은 돈」만.

### 2.3 레이아웃 (desktop top → bottom 강제)

| # | 구역 | 역할 |
|---|------|------|
| 1 | Quiet page header | 제목 + 기간 1개 |
| 2 | Hero band | full-width · 3 huge amounts |
| 3 | Main stage | full-bleed chart · **최대 세로** |
| 4 | Two-column workbench | mix \| 손볼 일 |
| 5 | Ledger strip | 최근 돈 움직임 |

**Mobile (1 col)**: hero stack → chart → mix → 손볼 일 → ledger.

---

## 3. 섹션 순서

### 3.1 Desktop (≥1280)

```
[ Quiet page header ]
[ Hero band — 3 amounts, equal columns ]
[ Main stage — 12개월 grouped bars ]
[ Workbench: LEFT mix | RIGHT 손볼 일 ]
[ Ledger strip ]
```

섹션 간 세로 gap: `var(--mg-v2-space-6)` ~ `var(--mg-v2-space-8)` (24–32px).  
본문 좌우 패딩: ErpPageShell / ContentArea 기존 토큰 유지.

### 3.2 Mobile (<768)

```
[ Quiet page header ]
[ Hero — 세로 스택 3단 ]
[ Main stage chart ]
[ 이번 달 돈이 나간 곳 ]   ← 데이터 없으면 생략
[ 지금 손볼 일 ]           ← 유효 행 없으면 생략
[ 최근 돈 움직임 ]
```

태블릿(768–1279): hero는 3열 유지 가능, workbench는 1열 스택.

---

## 4. Quiet page header

| 항목 | 스펙 |
|------|------|
| 제목 | `이번 달 돈` — `var(--mg-v2-font-size-h1)`, weight 600–700, 색 `var(--mg-v2-color-text-primary)` / slate `#0F172A` 계열 토큰 |
| 기간 컨트롤 | **세그먼트/토글 1개만** — 옵션: `이번 달` · `지난달` · `올해` |
| 구현 힌트 | `BadgeSelect` 또는 quiet segmented control (기존 공통). `MGButton` variant로도 가능. **ErpFilterToolbar 크롬 금지** |
| 금지 | 「데이터 새로고침」secondary row, 테넌트 서브타이틀, 다중 필터 칩 줄 |
| 보조 링크(선택) | 헤더 우측 텍스트 링크 최대 3 — `장부` → `/erp/financial`, `상담사 지급` → `/erp/salary`, `센터 경비` → `/erp/purchase`. `MGButton` ghost/text 또는 plain link. 아이콘 그리드 아님 |

헤더는 **quiet**: 카드/섹션 블록 테두리로 감싸지 않음. 제목 + 컨트롤 한 줄(모바일: 제목 위 · 세그먼트 아래).

---

## 5. Hero band — 타이포 · 간격 · 숫자 스케일

### 5.1 구성

한 밴드(full width), **가로 3등분** (mobile: 세로 3스택).

| 슬롯 | 라벨 | 수치 | tiny caption 예 |
|------|------|------|-----------------|
| 1 | 들어온 돈 | 당월 수입 | 상담료 위주 |
| 2 | 나간 돈 | 당월 지출 | 급여·임대 |
| 3 | 남은 돈 | 수입 − 지출 | 지난달 대비 |

- 숫자 표기: **`KpiNumeral`** 필수 (`unit` = `원` 또는 포맷된 문자열 + 단위 정책).
- Package / Clock / ShoppingCart 등 **히어로 아이콘 금지**. 아이콘 없이 라벨·숫자·캡션만.
- 「순이익」라벨 **금지**.

### 5.2 타이포 (Clinic-OS 4-step · 축소 금지)

4-step SSOT만 사용. **새 폰트 스텝 추가·축소 금지.**

| 역할 | 토큰 | 참고값 | weight |
|------|------|--------|--------|
| 페이지 제목 | `--mg-v2-font-size-h1` | 1.75rem | 600–700 |
| **히어로 금액 (레이아웃 지배)** | `KpiNumeral` → **`--mg-v2-font-size-h1`** (hero modifier; 기본 h2가 아닌 **h1로 승격**) | 1.75rem | **700** |
| 히어로 라벨 | `--mg-v2-font-size-body-md` | 0.875rem | 500–600 |
| 히어로 tiny caption | `--mg-v2-font-size-caption` | 0.75rem | 400 |
| 섹션 제목 | `--mg-v2-font-size-h2` | 1.375rem | 600 |

**숫자 스케일 원칙**: 히어로는 h1 + bold + `tabular-nums` + 넓은 셀 패딩으로 “거대함”을 만든다. display 스텝을 새로 만들지 않는다. (4-step 축소·확장 금지)

### 5.3 간격 · 서페이스

| 항목 | 값 |
|------|-----|
| 밴드 패딩 | `var(--mg-v2-space-6)` ~ `var(--mg-v2-space-8)` (24–32px) |
| 셀 간 gap | `var(--mg-v2-space-6)` (24px) desktop; mobile `var(--mg-v2-space-4)` |
| 라벨 → 숫자 | `var(--mg-v2-space-2)` (8px) |
| 숫자 → caption | `var(--mg-v2-space-1)` ~ `var(--mg-v2-space-2)` (4–8px) |
| 배경 | quiet surface — `var(--mg-v2-color-surface-*)` / 페이지 배경과 구분되는 연한 서페이스. **좌측 컬러바·스프라이트 금지** |
| 구분 | 셀 사이 hairline 또는 gap만. 카드 그리드(B0KlA admin-card) 강제 금지 |
| 색 | 본문 slate `#0F172A` → `var(--mg-v2-color-text-primary)` / `--mg-color-text-main`. 강조(선택) dusty teal `#0E5F5A` / `#0F766E` → primary 토큰. **남은 돈**만 teal 톤 허용, 나머지 slate |

---

## 6. Main stage — 차트

### 6.1 내용

- 최근 **12개월** 들어옴 vs 나감 **grouped bars**.
- 컴포넌트: **`MGChart`**.
- 섹션 제목(선택 quiet): `최근 12개월` 또는 동등 클리닉 문구 — h2.
- Empty: `최근 12개월에 등록된 수입·지출이 없습니다.` (`EmptyState`, 이모지 없음).

### 6.2 높이 (핵심 수치)

| 규칙 | 값 |
|------|-----|
| **역할** | 페이지에서 **가장 큰 세로 공간** (hero·workbench·ledger보다 큼) |
| **권장 높이** | **`min(52vh, 560px)`** 또는 고정에 가깝게 **`min-height: 420px`**, 이상적 **`height: clamp(420px, 48vh, 560px)`** |
| **viewport 대비** | 데스크톱 본문에서 차트 영역 ≈ **40–52vh** |
| **금지** | **leftover `240px` 차트 금지**. min-height ≤ 280px 위젯 높이도 금지 |
| **모바일** | `min-height: 320px`, `height: clamp(320px, 42vh, 420px)` — 여전히 스택 중 가장 블록 |

차트 플롯 영역이 스테이지의 ≥85%를 쓰도록 레전드·툴바는 얇게(한 줄).

---

## 7. Two-column workbench

### 7.1 비율 · gap

| 항목 | Desktop | Mobile |
|------|---------|--------|
| **컬럼 비율** | **LEFT 7 : RIGHT 5** (`grid-template-columns: 7fr 5fr`) | 1열 스택 (mix → 손볼 일) |
| **gap** | `var(--mg-v2-space-6)` (24px) | `var(--mg-v2-space-6)` |
| 블록 패딩 | `var(--mg-v2-space-5)` ~ `var(--mg-v2-space-6)` | 동일 |

LEFT가 비고 RIGHT만 있으면 RIGHT full-width. 반대도 동일. **둘 다 없으면 workbench 전체 생략.**

### 7.2 LEFT — `이번 달 돈이 나간 곳`

- category mix (급여 / 임대·관리 / 환불 / 기타 등 — 페이로드에 있을 때만).
- 시각: 단순 가로 바·리스트 비율. B0KlA admin-card 메트릭 타일 금지.
- **데이터 없으면 블록 전체 생략.**

### 7.3 RIGHT — `지금 손볼 일`

최대 **3행**, 숫자 있는 행만:

1. 아직 안 들어온 상담료  
2. 상담사 지급 예정  
3. 이번 달 환불  

| 행 구성 | 라벨(body-md) + 금액(h2 또는 KpiNumeral body→h2) + 선택 링크 |
|---------|--------------------------------------------------------------|
| 생략 | 값 0·null·권한 없음 → **행 삭제** (플레이스홀더 금지) |
| 유효 행 0 | RIGHT 블록 **생략** |

워크벤치 하단/우측 보조 링크는 헤더와 중복하지 않게 **한곳만** (헤더 또는 워크벤치).

---

## 8. Ledger strip — `최근 돈 움직임`

### 8.1 컬럼 (기본 노출만)

| 컬럼 | 내용 | 정렬 |
|------|------|------|
| 일자 | YYYY-MM-DD 또는 `M/D` | left |
| 내용 | 거래 설명(클리닉 언어) | left, truncate |
| 들어온 금액 | 수입이면 금액, 아니면 `—` | right, tabular |
| 나간 금액 | 지출이면 금액, 아니면 `—` | right, tabular |

**기본 노출 금지 컬럼**: 매핑 · 카테고리 · 상태 · 작업(수정/삭제).

### 8.2 밀도

| 항목 | 값 |
|------|-----|
| 행 높이 | **compact** — 약 40–44px (터치 최소 44px 권장) |
| 폰트 | body-md 0.875rem / 금액 tabular |
| 표시 행수 | 최근 **5–8행** (페이지네이션 없음; “장부에서 더 보기” 링크 1개 허용) |
| 구분선 | hairline `var(--mg-v2-color-border-*)` |
| 구현 힌트 | `ListTableView` 또는 경량 table organism. 카드 리스트 남발 금지 |

Empty: `최근 돈 움직임이 없습니다.`

---

## 9. 기간 컨트롤 UI

- **형태**: 세그먼트 / 토글 **1개** (단일 선택).
- **옵션 (고정 3)**: `이번 달` | `지난달` | `올해`.
- **위치**: Quiet header 제목 우측(desktop) / 제목 아래 full-width(mobile).
- **공통 모듈**: `BadgeSelect` 우선 검토. 없으면 quiet segment molecule.
- **활성**: dusty teal solid (`#0F766E` / `--mg-v2-color-primary-solid`), 텍스트 대비 AA.
- **비활성**: slate 텍스트, 투명/연한 서페이스.
- **금지**: ErpFilterToolbar, 날짜 range picker 2필드, “새로고침” 별도 행.

기간 변경 시 hero · chart · mix · ledger가 동일 기간 계약에 맞게 갱신 (올해 = YTD 합·월별 차트는 연초~현재).

---

## 10. Clinic-OS 토큰 · 공통 모듈

### 10.1 색 (참고 hex → 토큰만 구현)

| 역할 | Hex 참고 | 토큰 |
|------|----------|------|
| Slate 본문 | `#0F172A` | `--mg-v2-color-text-primary` / `--mg-color-text-main` |
| Dusty teal | `#0E5F5A` | `--mg-v2-color-primary-main` / `--mg-color-primary-main` |
| Teal solid | `#0F766E` | `--mg-v2-color-primary-solid` |
| 보조 텍스트 | slate secondary | `--mg-v2-color-text-secondary` |
| 보더 | clinic slate border | `--mg-v2-color-border-*` / `--mg-color-border-main` |

**새 팔레트 금지.** B0KlA 크림/그린 악센트 바로 회귀하지 말 것.

### 10.2 필수 공통

- Shell: `AdminCommonLayout` → `ErpPageShell`
- 버튼: `MGButton`
- 차트: `MGChart`
- 숫자: `KpiNumeral`
- 빈 상태: `EmptyState`
- 기간: `BadgeSelect` 또는 동등 segment

**ContentKpiRow + B0KlA admin-card 그리드로 hero/메트릭을 다시 짜지 말 것.**

### 10.3 허용 링크 (최대 3)

| 한글 라벨 | 경로 |
|-----------|------|
| 장부 | `/erp/financial` |
| 상담사 지급 | `/erp/salary` |
| 센터 경비 | `/erp/purchase` |

---

## 11. 금지 요소 목록

스펙·구현 모두에서 **금지**:

1. 조달 히어로 KPI (총 아이템 / 승인 대기 / 총 주문 / 예산 사용률)
2. `ErpFinanceAdminSyncCard` / 분개 초기화 / 백필
3. 빠른 액션 **icon grid** (B0KlA admin-card 버튼들)
4. 대차대조표 · 차변/대변 · 계정과목 · 히어로 **순이익** 라벨
5. 옛 stacked order: summary → procurement KPI → 2-bar this-month → table → sync → quick actions → activity feed
6. ContentKpiRow + B0KlA admin-cards + ErpFilterToolbar + quick-action grid로 **메트릭/순서만 바꾸는 패치**
7. 스프라이트 · **좌측 컬러바** · 이모지 · **새 팔레트** · MindGarden 로고/히어로 브랜딩
8. opaque i18n hash 신규 (한글 상수 파일 스타일 — 클리닉 문구는 상수/카피로 명확히)
9. `(터넌트: …)` 서브타이틀 · 「데이터 새로고침」secondary row
10. 히어로에 Package/Clock/ShoppingCart 아이콘
11. 차트 **leftover 240px** (및 동급 소형 위젯 높이)
12. 레저 기본 컬럼: 매핑 / 카테고리 / 상태 / 작업
13. 4-step 타이포 축소·제5 스텝 신설

---

## 12. 원자 / 분자 / 유기체 제안 이름 (구현 힌트만 · 코드 없음)

| 계층 | 제안 이름 | 책임 |
|------|-----------|------|
| Atom | `KpiNumeral` (기존) | 금액 롤/표기 |
| Atom | (기존) `MGButton` | 링크·세그먼트 액션 |
| Molecule | `MoneyPeriodSegment` | 이번 달/지난달/올해 1컨트롤 |
| Molecule | `MoneyHeroCell` | 라벨 + KpiNumeral + tiny caption |
| Molecule | `MoneyActionLink` | 장부/지급/경비 텍스트 링크 |
| Molecule | `MoneyWorkbenchRow` | 손볼 일 1행 |
| Organism | `MoneyQuietHeader` | 제목 + period + (선택) 링크 |
| Organism | `MoneyHeroBand` | 3× MoneyHeroCell |
| Organism | `MoneyFlowStage` | MGChart 12개월 + empty |
| Organism | `MoneyOutflowMix` | LEFT category mix |
| Organism | `MoneyTodoList` | RIGHT 최대 3행 |
| Organism | `MoneyLedgerStrip` | 일자·내용·들어옴/나감 |
| Template/Page | `OperatorMoneyCockpitPage` | 5단 스켈레톤 조립 (`ErpPageShell` 내부) |

캡슐화: 각 organism은 props로 금액·시리즈·행만 받고, ERP sync/분개 API를 UI에 노출하지 않음.

---

## 13. 상태 · 예외

| 상태 | 표시 |
|------|------|
| 로딩 | shell/`UnifiedLoading` 또는 스테이지 skeleton — 조달 카드 스켈레톤 재사용 금지 |
| Hero 0원 | `0원` 표시 유지(슬롯은 항상 3) |
| Chart empty | 지정 문구 EmptyState |
| Mix empty | LEFT 생략 |
| Todo all empty | RIGHT 생략 → workbench 전체 생략 가능 |
| Ledger empty | strip 유지 + empty 문구 |
| 권한 없음 | 해당 행/링크만 제거 |

---

## 14. IA 문서용 — “이 PR 페이지 스켈레톤 5단” 문구 초안

> **이 PR 페이지 스켈레톤 5단**  
> 1) Quiet header — 제목 `이번 달 돈` + 기간 세그먼트(이번 달/지난달/올해) 1개  
> 2) Hero band — `들어온 돈` · `나간 돈` · `남은 돈` 거대 금액 3  
> 3) Main stage — 12개월 들어옴 vs 나감 그룹 바(최대 세로, min ≈ 420px / ~48vh)  
> 4) Workbench — 좌 `이번 달 돈이 나간 곳` · 우 `지금 손볼 일`(최대 3행, 빈 블록 생략)  
> 5) Ledger strip — `최근 돈 움직임`(일자·내용·들어온/나간).  
> 모바일: hero → chart → mix → 손볼 일 → ledger. 조달 KPI·sync·퀵액션 그리드·회계 용어 비노출.

---

## 15. 코더 전달 체크리스트

- [ ] 5단 순서 desktop/mobile 준수  
- [ ] Hero = KpiNumeral × 3, h1 스케일, 순이익 라벨 없음  
- [ ] Chart min-height ≥ 420px(desktop), **240px 금지**  
- [ ] Workbench 7:5, 빈 블록 생략  
- [ ] Ledger 4컬럼만  
- [ ] 기간 컨트롤 1개, ErpFilterToolbar 없음  
- [ ] 금지 목록 전부 미포함  
- [ ] Clinic-OS slate/teal · 4-step only  
- [ ] 새 CSS 모듈 OK, B0KlA admin-card 그리드 강제 핏 금지  

---

## 16. 핵심 수치 요약 (한눈에)

| 항목 | 수치 |
|------|------|
| 히어로 금액 타입 | **`--mg-v2-font-size-h1` = 1.75rem**, weight **700** (`KpiNumeral` hero) |
| 히어로 라벨 / caption | body-md **0.875rem** / caption **0.75rem** |
| 차트 높이 | **`clamp(420px, 48vh, 560px)`**, min **420px** · **240px leftover 금지** |
| Workbench 비율 | **7 : 5**, gap **24px** |
| Ledger 행 | **40–44px**, 컬럼 4개, 5–8행 |
| 기간 옵션 | **3** (이번 달 / 지난달 / 올해) |
| 허용 링크 | **최대 3** |
