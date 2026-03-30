# ERP 재무 관리(Financial Management) 페이지 개선 기획

**문서 버전**: 1.0.0  
**작성일**: 2025-03-04  
**담당**: core-planner (기획만 수행, 구현·디자인은 core-designer → core-coder 위임)

---

## 1. 제목·목표

- **제목**: ERP 재무 관리 페이지를 아토믹 디자인·디자인 시스템·UNIFIED_LAYOUT_SPEC에 맞게 개선한다.
- **목표**: (1) 레이아웃을 "우리 아토믹 스타일"로 정리하고, (2) 달력·전체에서 이모지를 제거하여 Lucide 아이콘만 사용하며, (3) 필터 UI를 **태그(tag)** 스타일로 변경한다. 기획 → core-designer(필요 시) → core-coder 순서로 서브에이전트를 활용한다.

---

## 2. 범위 정의

### 2.1 적용 대상 구간 (재무 관리 페이지 내)

| 구간 | 파일/위치 | 현재 상태 | 개선 방향 |
|------|-----------|-----------|-----------|
| **탭 영역** | `FinancialManagement.js` → `erp-tabs` | Bootstrap 아이콘(`bi bi-list-ul`, `bi-calendar3`, `bi-speedometer2`) | Lucide + B0KlA Pill 또는 동일 스타일. `mg-v2-ad-b0kla__pill-toggle` / `mg-v2-ad-b0kla__pill` 적용 |
| **필터 영역** | 동일 → `mg-v2-filter-section` | `<select>` 3개 + 검색 input + 버튼 2개 | **태그 형태**로 변경: 거래 유형/카테고리/연동 유형을 **클릭 가능한 태그**로 배치, 선택된 태그 시각적 구분(`mg-v2-tag` / `mg-v2-tag--selected`). 검색·초기화·검색 버튼 유지 |
| **거래 목록** | 동일 → `mg-financial-transaction-cards-grid` | MGCard 사용, 카드 내 버튼에 `bi` 아이콘(eye, pencil, trash) | Lucide(Eye, Pencil, Trash2) + 토큰·섹션 블록 정리. 빈 상태 아이콘 `bi-inbox` → Lucide `Inbox` |
| **달력 탭** | `FinancialCalendarView.js` | 제목·범례·날짜 셀·상세 패널·월 통계에 **이모지 다수**(📅💰💸🔗📊✕💎📋 등), 네비게이션 "◀ 이전" "다음 ▶" | 이모지 전부 제거, Lucide 아이콘으로 대체. 네비게이션은 ChevronLeft/ChevronRight. 색상은 토큰으로 |
| **대시보드 탭** | `FinancialManagement.js` → `erp-section` (dashboard) | `erp-card`, Bootstrap 아이콘(bi-arrow-up-circle, bi-arrow-down-circle 등) | B0KlA 카드(`mg-v2-ad-b0kla__card`)·토큰 적용, 아이콘 Lucide 통일 |
| **에러/로딩** | 동일 | `bi-exclamation-triangle-fill`, `bi-arrow-clockwise` | Lucide(AlertTriangle, RefreshCw) |
| **모달** | `TransactionDetailModal` | 일부 인라인 스타일, 토큰 미적용 | 토큰·공통 모달 스타일 정리(UnifiedModal 사용 여부는 디자이너 스펙에서 결정) |

### 2.2 제외 범위

- 재무 관리 **외** ERP 페이지(구매·예산·세무 등)는 본 기획 범위 아님.
- API·백엔드·권한 로직 변경 없음. 프론트 UI·스타일·아이콘·필터 표현만 대상.

---

## 3. 아토믹 스타일 적용 매핑

### 3.1 프로젝트에서 사용하는 아토믹/디자인 토큰 컴포넌트 목록

| 구분 | 클래스/컴포넌트 | 용도 | 참조 |
|------|-----------------|------|------|
| **템플릿** | AdminCommonLayout | GNB/LNB + children | 이미 적용됨 |
| **영역** | ContentHeader, ContentArea | 제목·부제목·메인 래퍼 | 이미 적용됨 |
| **탭/전환** | `mg-v2-ad-b0kla__pill-toggle`, `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active` | 탭 버튼(거래/달력/대시보드) | AdminDashboardB0KlA.css, ImprovedTaxManagement.js |
| **태그(선택)** | `mg-v2-tag-group`, `mg-v2-tag`, `mg-v2-tag--selected` | 필터 옵션 클릭 선택 | ConsultantRatingModal.js, unified-design-tokens.css |
| **카드** | `mg-v2-ad-b0kla__card`, MGCard | 목록 카드·대시보드 KPI 카드 | UNIFIED_LAYOUT_SPEC §3.5 |
| **버튼** | `mg-v2-button`, `mg-v2-button-primary`, `mg-v2-button-secondary`, Button | 주/보조 액션 | B0KlA·토큰 |
| **입력** | `mg-v2-form-label`, `mg-v2-form-select` 등 | 검색 input 등(필터에서 검색만 유지 시) | 기존 필터 섹션 |
| **아이콘** | Lucide React (DollarSign, Calendar, ClipboardList 등) | 전역, 이모지 대체 | iconUtils.js, UNIFIED_LAYOUT_SPEC §5 |
| **섹션 블록** | 배경 `var(--mg-layout-section-bg)`, 테두리·radius·악센트 바 | 거래 목록·달력·대시보드 래퍼 | UNIFIED_LAYOUT_SPEC §2.2 |

### 3.2 재무 관리 구간별 적용 매핑

| 구간 | 적용할 컴포넌트/클래스 |
|------|------------------------|
| **탭 영역** | `mg-v2-ad-b0kla__pill-toggle` + `mg-v2-ad-b0kla__pill` / `mg-v2-ad-b0kla__pill--active`. 아이콘: ClipboardList(거래), Calendar(달력), LayoutDashboard 또는 Gauge(대시보드) |
| **필터 영역** | **태그**: `mg-v2-tag-group` 래퍼, 거래 유형/카테고리/연동 유형별로 `mg-v2-tag` + 선택 시 `mg-v2-tag--selected`. 검색: 기존 input + Search 아이콘. 버튼: RefreshCw(초기화), Search(검색) + `mg-v2-button-*` |
| **거래 목록** | 섹션 블록 래퍼 + `mg-financial-transaction-cards-grid`(유지). 카드: MGCard. 카드 내 버튼: Lucide Eye, Pencil, Trash2. 빈 상태: Inbox 아이콘 + 텍스트 |
| **달력 뷰** | 섹션 블록 내부. 헤더: Calendar 아이콘 + "재무 달력". 범례: DollarSign(수입), TrendingDown 또는 Wallet(지출), Link2(매핑연동). 네비: ChevronLeft, ChevronRight. 날짜 셀·상세·월 통계: 이모지 제거, Lucide + 토큰 |
| **대시보드 탭** | `mg-v2-ad-b0kla__card` 또는 동일 스타일 카드. 아이콘: TrendingUp(수입), TrendingDown(지출), BarChart3(순이익), ClipboardList(거래 건수), Link2(매핑) 등. 빠른 액션 버튼: Lucide + `mg-v2-button-*` |
| **에러/로딩** | AlertTriangle, RefreshCw + 기존 UnifiedLoading |

---

## 4. 필터 → 태그 변경 요구사항

### 4.1 현재

- 거래 유형: `<select>` (전체/수입/지출)
- 카테고리: `<select>` (전체/상담료/급여/…)
- 연동 유형: `<select>` (전체/매핑연동/환불처리/…)
- 검색: `<input>` + "필터 초기화" / "검색" 버튼

### 4.2 변경 후 (태그 형태)

- **거래 유형**: "전체" | "수입" | "지출" 을 **태그**로 나열. 클릭 시 선택, 선택된 항목은 `mg-v2-tag--selected` 등으로 시각적 구분. 다중 선택이 아니라 **단일 선택**(전체 포함).
- **카테고리**: "전체" | "상담료" | "급여" | "임대료" | … 동일하게 태그 클릭 선택.
- **연동 유형**: "전체" | "매핑연동" | "환불처리" | "결제" | … 동일.
- **검색**: 텍스트 input + (선택) Search 아이콘 유지. "필터 초기화"·"검색" 버튼은 유지하되 Lucide 아이콘(RefreshCw, Search) 사용.
- **레이아웃**: 태그는 그룹별로 한 줄 또는 줄바꿈 가능한 flex/grid. 라벨(예: "거래 유형", "카테고리")은 스펙에 맞게 `mg-v2-form-label` 또는 B0KlA 캡션 스타일.

---

## 5. 이모지 제거 및 대체 아이콘 정리

### 5.1 원칙

- **UNIFIED_LAYOUT_SPEC §5**: 모든 UI에서 이모지 사용 금지. Lucide React(또는 프로젝트 표준) 아이콘 컴포넌트만 사용.

### 5.2 재무 관리·달력 뷰에서 사용처 및 대체

| 용도/문맥 | 현재 | Lucide 아이콘(이름) | 비고 |
|-----------|------|---------------------|------|
| 달력 제목 | 📅 | Calendar | FinancialCalendarView 헤더 |
| 네비게이션 | ◀ 이전 / 다음 ▶ | ChevronLeft, ChevronRight | |
| 범례·수입 | 💰 | DollarSign | |
| 범례·지출 | 💸 | TrendingDown 또는 Wallet | iconUtils에 💸 없으면 추가 권장 |
| 범례·매핑 | 🔗 | Link2 | |
| 날짜 셀 수입/지출 | 💰, 💸 | DollarSign, TrendingDown(또는 Wallet) | |
| 상세 패널 제목 | 📊 | BarChart3 | |
| 닫기 버튼 | ✕ | X | |
| 순이익 | 💎 | Gem 또는 CircleDollarSign | |
| 거래 내역 | 📋 | ClipboardList | |
| 월 통계·총 거래 | 📊 | BarChart3 또는 LayoutDashboard | |
| 매핑연동 뱃지 | 🔗 | Link2 | 이미 FinancialManagement.js에서 Link2 사용 중 |

### 5.3 FinancialManagement.js 기타

- 탭: `bi bi-list-ul` → ClipboardList, `bi bi-calendar3` → Calendar, `bi bi-speedometer2` → Gauge 또는 LayoutDashboard.
- 버튼: `bi bi-plus` → Plus, `bi bi-download` → Download, `bi bi-eye` → Eye, `bi bi-pencil` → Pencil, `bi bi-trash` → Trash2.
- 에러: `bi bi-exclamation-triangle-fill` → AlertTriangle. "다시 시도" `bi bi-arrow-clockwise` → RefreshCw.
- 빈 상태: `bi bi-inbox` → Inbox.
- 대시보드 카드: `bi bi-arrow-up-circle` → TrendingUp, `bi bi-arrow-down-circle` → TrendingDown, `bi bi-graph-up` → BarChart3, `bi bi-list-ul` → ClipboardList, `bi bi-link-45deg` → Link2, `bi bi-arrow-left-circle` → Undo2 또는 ArrowLeftCircle.

---

## 6. 단계(Phase) 및 담당 흐름

### Phase 1 (필수): 레이아웃·태그 필터·이모지 제거

| 순서 | 담당 | 목표 | 산출물 |
|------|------|------|--------|
| 1-1 | **core-designer** (선택) | 재무 관리 한정 UI 스펙 정리(태그 필터 레이아웃, 탭·카드·달력 영역 배치, 토큰·아이콘 매핑). 이미 UNIFIED_LAYOUT_SPEC·본 기획서로 충분하면 생략 가능. | 재무 관리 화면 스펙(필요 시) |
| 1-2 | **core-coder** | (1) 탭을 B0KlA Pill 스타일 + Lucide으로 변경. (2) 필터를 태그 형태(`mg-v2-tag-group`/`mg-v2-tag`/`mg-v2-tag--selected`)로 변경. (3) 재무 관리·달력 뷰·대시보드 탭 전역 이모지 제거 및 Lucide 대체. (4) 거래 목록·대시보드·에러/빈 상태 아이콘 Lucide 통일. (5) 섹션 블록·토큰 적용으로 "아토믹 스타일" 정리. | 코드 반영 |

### Phase 2 (선택): 추가 UX 개선

- 달력 셀·상세 패널 인라인 스타일 제거, CSS 모듈 또는 토큰 클래스로 이전.
- 대시보드 카드를 `mg-v2-ad-b0kla__card` 등으로 완전 통일.
- TransactionDetailModal을 UnifiedModal 기반으로 리팩터(디자이너 스펙에서 결정 시).

---

## 7. 리스크·제약

- **기존 동작 유지**: 필터 값(거래 유형/카테고리/연동 유형)과 API 호출 파라미터는 동일하게 유지. 변경은 UI 표현(select → tag)만.
- **반응형**: 태그 필터는 줄바꿈 가능한 배치로, 모바일에서도 사용 가능하도록 설계.
- **멀티테넌트·권한**: tenantId·API·역할 체크는 수정하지 않음.

---

## 8. 단계별 완료 기준·체크리스트

### Phase 1 (필수)

- [ ] 재무 관리 탭이 B0KlA Pill(또는 동일 스타일) + Lucide 아이콘만 사용하는가?
- [ ] 필터가 select가 아닌 **태그** 형태로 표시되고, 클릭 시 선택·시각적 구분이 되는가?
- [ ] 거래 목록·대시보드·에러/빈 상태에 이모지가 없고 Lucide만 사용하는가?
- [ ] 달력 뷰(FinancialCalendarView)에 이모지가 없고(📅💰💸🔗📊✕💎📋 등), Lucide 및 토큰으로 대체되었는가?
- [ ] 재무 관리 페이지가 ContentHeader + ContentArea + 섹션 블록 구조와 디자인 토큰을 따르는가?

### Phase 2 (선택)

- [ ] 달력·상세 패널 인라인 스타일이 제거되고 토큰/클래스로 정리되었는가?
- [ ] 대시보드 카드가 B0KlA 카드 스타일과 일치하는가?

---

## 9. 디자이너·코더 전달용 요약

### 9.1 core-designer에 넘길 UI/UX 스펙 요청문 (필요 시)

```text
[디자이너용] ERP 재무 관리 페이지 한정 UI 스펙 정리 요청

참조 문서:
- docs/planning/ERP_FINANCIAL_MANAGEMENT_IMPROVEMENT_PLAN.md (본 기획서)
- docs/design-system/UNIFIED_LAYOUT_SPEC.md
- docs/project-management/UNIFIED_LAYOUT_AND_PAGES_PLAN.md

요청 사항:
1. 사용성·정보 노출·레이아웃
   - 재무 관리 페이지는 AdminCommonLayout + ContentHeader + ContentArea 이미 적용됨. 탭(거래/달력/대시보드)·필터·거래 목록·달력 뷰·대시보드 블록의 배치를 UNIFIED_LAYOUT_SPEC 및 아토믹 계층에 맞게 정리해 주세요.
   - 필터는 **태그 형태**로 변경합니다. 거래 유형/카테고리/연동 유형을 각각 "전체" 포함 옵션을 태그로 나열하고, 클릭 시 단일 선택·시각적 구분이 되도록 스펙에 반영해 주세요. (프로젝트 기존: mg-v2-tag-group, mg-v2-tag, mg-v2-tag--selected)

2. 이모지 금지·아이콘
   - 달력 탭 및 재무 관리 전체에서 이모지를 제거하고, 본 기획서 §5.2·§5.3의 Lucide 매핑을 스펙에 명시해 주세요.

3. 산출물
   - 재무 관리 전용 화면 스펙(와이어프레임 수준 또는 블록·컴포넌트 목록)을 docs/design-system/ 또는 docs/planning/ 아래에 작성해 주세요. 코드 작성은 하지 마세요.
```

### 9.2 core-coder에 넘길 구현 태스크 목록 초안

```text
[코더용] ERP 재무 관리 페이지 개선 구현

참조:
- docs/planning/ERP_FINANCIAL_MANAGEMENT_IMPROVEMENT_PLAN.md
- docs/design-system/UNIFIED_LAYOUT_SPEC.md
- 스킬: /core-solution-frontend, /core-solution-atomic-design
- 기존 태그 스타일: mg-v2-tag-group, mg-v2-tag, mg-v2-tag--selected (ConsultantRatingModal 등)
- B0KlA Pill: mg-v2-ad-b0kla__pill-toggle, mg-v2-ad-b0kla__pill, mg-v2-ad-b0kla__pill--active

작업 목록:
1. 탭 영역 (FinancialManagement.js)
   - erp-tabs를 mg-v2-ad-b0kla__pill-toggle + mg-v2-ad-b0kla__pill 구조로 변경.
   - Bootstrap 아이콘 제거 → Lucide: ClipboardList(거래 내역), Calendar(달력 뷰), Gauge 또는 LayoutDashboard(대시보드).

2. 필터 영역 (FinancialManagement.js)
   - 거래 유형/카테고리/연동 유형을 select에서 **태그 그룹**으로 변경. 각 그룹에 mg-v2-tag-group, 옵션은 mg-v2-tag, 선택 시 mg-v2-tag--selected. 클릭 시 filters 상태 업데이트(기존과 동일한 값 전달).
   - 검색 input·필터 초기화·검색 버튼 유지. 버튼 아이콘: RefreshCw, Search (Lucide).

3. 이모지 제거 및 Lucide 통일
   - FinancialManagement.js: 탭·버튼·에러·빈 상태·대시보드 카드의 모든 bi/이모지 → Lucide (기획서 §5.3).
   - FinancialCalendarView.js: 제목·범례·날짜 셀·상세 패널·월 통계의 모든 이모지(📅💰💸🔗📊✕💎📋 등) 제거 → Lucide (기획서 §5.2). 네비게이션 "◀ 이전"/"다음 ▶" → ChevronLeft, ChevronRight.

4. 레이아웃·토큰
   - 거래 목록·달력·대시보드 영역을 섹션 블록 스타일(배경·테두리·radius·토큰)로 정리. 대시보드 카드는 mg-v2-ad-b0kla__card 또는 동일 스타일 적용.
   - 인라인 하드코딩 색상은 가능한 범위에서 var(--mg-*) 등 토큰으로 교체.

5. (선택) 달력 뷰 인라인 스타일을 CSS 클래스/토큰으로 이전. TransactionDetailModal 스타일 정리.

완료 기준: 기획서 §8 Phase 1 체크리스트 충족.
```

---

## 10. 실행 요청문

다음 순서로 서브에이전트를 호출해 주세요.

1. **Phase 1-1 (선택)**  
   - **서브에이전트**: **core-designer**  
   - **전달**: 위 §9.1 **디자이너용 UI/UX 스펙 요청문** 전체.  
   - **산출물**: 재무 관리 전용 화면 스펙(필요 시에만 수행; UNIFIED_LAYOUT_SPEC + 본 기획서로 코더가 바로 구현 가능하다고 판단되면 생략 가능).

2. **Phase 1-2 (필수)**  
   - **서브에이전트**: **core-coder**  
   - **전달**: 위 §9.2 **코더용 구현 태스크 목록** 전체 + 본 기획서 경로(`docs/planning/ERP_FINANCIAL_MANAGEMENT_IMPROVEMENT_PLAN.md`). Phase 1-1에서 스펙 문서가 있으면 해당 경로도 함께 전달.  
   - **작업**: 탭 Pill화, 필터 태그화, 이모지 제거·Lucide 통일, 레이아웃·토큰 정리.

기획은 여기까지이며, 실제 설계·구현은 core-designer와 core-coder가 수행합니다.
