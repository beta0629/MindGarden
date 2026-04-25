# 화면설계서 — ERP 재무관리 · 거래 목록 필터·검색·월·페이지 (v1)

**문서 ID**: `SCREEN_SPEC_ERP_FINANCIAL_TRANSACTIONS_FILTERS_v1`  
**대상 화면**: Admin → ERP 재무관리(FinancialManagement) → **거래(transactions)** 탭  
**레이아웃 상위**: `AdminCommonLayout` → `ContentHeader` / `ContentArea` → `ErpPageShell` (기획 스킬 `core-solution-planning` §0.2.1, §0.4 정합)  
**비주얼 기준**: B0KlA 어드민 (`mindgarden-design-system.pen`, 어드민 대시보드 샘플), `docs/design-system/PENCIL_DESIGN_GUIDE.md`  
**구현 참고(코드 수정 없음)**: `frontend/src/styles/unified-design-tokens.css`, `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css`의 `var(--mg-*)`, `mg-v2-ad-b0kla__*`, `mg-v2-erp-filter-toolbar*`

---

## 1. 화면 개요

| 항목 | 내용 |
|------|------|
| **목적** | 기간·유형·카테고리·검색어·페이지를 조합해 재무 거래를 조회한다. |
| **권한** | 관리자(Admin) 세션, 지점 코드가 있으면 해당 지점 데이터. |
| **핵심 위험(기획 가설)** | (1) API가 검색을 서버에서 처리하지 않고 클라이언트만 필터할 때, 사용자는 “전체에서 검색”으로 오해한다. (2) 페이지 크기(예: 20건)와 검색·필터 조합 시 **현재 페이지에만** 검색이 적용되면 결과가 비어 “필터가 안 된다”로 인지된다. (3) 필터 변경용 `useEffect`와 페이지·초기 로드용 `useEffect`가 겹치면 **레이스**로 목록이 잠깐 엇갈리거나 이전 페이지 데이터가 보일 수 있다. |

본 스펙은 **코드 변경 없이** UI/UX·정보 노출·접근성·레이아웃만 규정한다.

---

## 2. 사용성 (기획 §0.4 — “편하게 쓰는 흐름”)

### 2.1 검색 범위의 사용자 인지

검색이 **서버 전체(또는 선택 기간 전체)** 인지, **현재 응답에 포함된 목록(또는 현재 페이지)** 에만 적용되는지에 따라 문구·배지를 **반드시 구분**한다.

| 모드 (제품 상태) | 사용자에게 보여줄 요약 | UI 요소 |
|------------------|-------------------------|---------|
| **A. 클라이언트만 / 현재 로드분만** (기획 가설에 가까운 경우) | “지금 불러온 목록 안에서만 찾습니다.” | 검색 라벨 옆 **보조 배지** (아래 토큰) + 짧은 **보조문구** 한 줄 |
| **B. 서버 검색 지원** | “선택한 기간·조건 전체에서 찾습니다.” | 배지 문구 교체 + (선택) “전체 N건 중 표시 M건” 형태의 **메타 한 줄** |
| **C. 혼합** (API는 search 전달하나 실질은 페이지 단위) | “검색은 API 응답 기준이며, 다음 페이지에도 동일 검색이 적용됩니다.” 등 사실에 맞게 | 배지 + 툴팁(아이콘 `?` 또는 `Info`)으로 상세 |

**배지 (Molecule)**  
- 컴포넌트: 기존 `Badge` 또는 `mg-v2-ad-b0kla__pill` 스타일의 **비토글** 칩(선택만 표시, 클릭 불필요).  
- 색: 배경 `var(--mg-color-surface-main)`, 테두리 `var(--mg-color-border-main)`, 텍스트 `var(--mg-color-text-secondary)`, 강조 키워드만 `var(--mg-color-text-main)`.  
- 위치: 검색 `<label>`과 검색 `<input>` 사이 **또는** 라벨 행 우측 정렬(데스크톱), 모바일에서는 라벨 아래 한 줄.  
- 문구 예 (A안): `이 목록에서만 검색` / (B안): `기간 전체 검색`

**보조문구**  
- `var(--mg-color-text-secondary)`, 12px (`PENCIL_DESIGN_GUIDE` 라벨 규격).  
- 예 (A): “다른 페이지에 있을 수 있는 거래는 **다음 페이지**를 눌러 확인하세요.”  
- 검색창 `placeholder`는 **필드 예시**만 담고, 범위 설명은 placeholder에 넣지 않는다(접근성·가독성).

**툴팁**  
- 배지 또는 `Info` 아이콘 버튼에 `title` + 키보드 포커스 시 동일 설명 노출 가능 영역(향후 `Tooltip` 공통 모듈 시 스펙만 연동).  
- 내용: 검색 대상 필드(상담사명, 내담자명, 설명 등)와 **범위 한 문장**을 묶어 설명.

### 2.2 필터·월·검색·적용 버튼의 인지적 순서

1. **기간**(select: 전체/오늘/주/월/직접) → 월이면 **월 피커**를 같은 시각 그룹에 둔다.  
2. **거래 유형·카테고리** (뱃지 그룹).  
3. **검색** + 범위 배지 + 보조문구.  
4. **적용(새로고침)** — “필터를 바꾼 뒤 확실히 반영”하려는 사용자를 위해 유지하되, 자동 디바운스 적용 시에는 버튼 라벨을 “다시 불러오기” 등으로 구분할 수 있음(카피는 `financialManagementStrings` 정책에 따름).

---

## 3. 정보 노출 범위 (기획 §0.4)

### 3.1 빈 결과(0건)

| 상황 | 노출 |
|------|------|
| 필터·검색 조합으로 **표시 행 0건** | 목록 영역 중앙 **빈 상태 블록**: 아이콘(선택) + 제목 “조건에 맞는 거래가 없습니다” + 본문 14px로 **현재 조건 요약**(기간, 유형, 카테고리, 검색어 유무). |
| **서버에는 더 있을 수 있음**(페이지네이션 상 `totalPages > 1`인데 클라 검색으로 0건이 된 경우) | 빈 상태 본문에 **추가 한 줄**: “검색은 현재 페이지/불러온 목록에만 적용될 수 있습니다. **다음 페이지**를 확인하거나 검색어를 줄여 보세요.” (실제 동작에 맞게 문구 조정) |

### 3.2 2페이지 이상일 때 “다음 페이지” 유도

- **페이지네이션 바** 상시 표시 영역에 `총 N페이지` 또는 `전체 M건`이 있으면, 검색 모드 A일 때 **보조 텍스트**를 페이지네이션 위 또는 옆에 배치: “검색은 이 화면에 표시된 목록 기준입니다.”  
- `다음 페이지` / `이전 페이지` 버튼은 기존 `FM_PAGINATION` 톤에 맞추되, **시각적 위계**: 주 액션은 주조 버튼 토큰, 페이지 이동은 outline(`mg-v2-ad-b0kla` 보조 버튼 규격).

### 3.3 Silent 새로고침·초기 로딩 (ERP 패턴 정합)

다음은 **기존 ERP 화면과 동일한 패턴**을 재무 거래에도 유지한다.

| 상태 | DOM / ARIA | 시각 |
|------|------------|------|
| 초기 로드 또는 명시적 로딩 | 목록 래퍼 `aria-busy={true}` (또는 전체 `erp-content`에 `loading \|\| silentListRefreshing`) | `UnifiedLoading` 등 기존 전면 로더 |
| **Silent** 목록 갱신 (`silentListRefreshing`) | 동일 래퍼에 `aria-busy={true}` | 전면 스피너 대신 **저채도 오버레이** 또는 행 투명도 0.6 + **스켈레톤 없이** 짧은 시간이면 버튼 `loading`만으로도 가능. `RefundFilterBlock`, `PurchaseManagement`의 `erp-content` + `silentListRefreshing` 패턴과 맞출 것. |
| 갱신 완료 | `aria-busy={false}` | — |

**스크린 리더**: 갱신 시작/종료 시 **짧은 polite 알림**이 필요하면 `aria-live="polite"` 영역에 “목록을 불러왔습니다” 한 번(중복 방지는 구현 세부). 필터 적용 직후 레이스로 인한 중복 알림은 피하기 위해 디바운스 종료 후 한 번만 발화하도록 기획·코더 협의.

---

## 4. 레이아웃 (배치) — B0KlA · 토큰

### 4.1 블록 구조

- **섹션 블록** 하나에 필터 + 목록을 넣지 말고, **필터는 독립 툴바 블록**, 목록은 `ContentSection` / `ContentCard` 또는 기존 `mg-v2-ad-b0kla__card` 하위로 구분한다.  
- 필터 블록: 배경 `var(--mg-color-surface-main)`, 테두리 `1px solid var(--mg-color-border-main)`, `border-radius: 16px`, 패딩 `24px`, 내부 gap `16px` (`PENCIL_DESIGN_GUIDE` 섹션 블록).  
- 섹션 제목이 있다면 좌측 **악센트 바** 4px `var(--mg-color-primary-main)`.

### 4.2 `ErpFilterToolbar` 내부 배치 (데스크톱 ≥1280px)

| 영역 | 클래스(참고) | 배치 |
|------|----------------|------|
| 래퍼 | `mg-v2-erp-filter-toolbar` | `section`, `aria-label` = 거래 필터(문자열 상수) |
| 1행 | `mg-v2-erp-filter-toolbar__primary` → `mg-v2-filter-grid mg-v2-filter-grid--row1` | 좌→우: **기간 그룹**(label `mg-v2-form-label` + `select.mg-v2-form-select.mg-v2-erp-filter-toolbar__period-select`) → 월 피커(`mg-financial-month-picker`, `role="group"`) → (ALL/CUSTOM 부가 UI) → **거래 유형 뱃지** → **카테고리 뱃지** |
| 2행 | `mg-v2-erp-filter-toolbar__secondary` → `mg-v2-filter-grid mg-v2-filter-grid--row2` | 좌: 검색 그룹(라벨 + **범위 배지** + input `mg-v2-form-select` 너비 확장) / 우: 적용 버튼 `buildErpMgButtonClassName` primary sm |

### 4.3 반응형 (모바일 375~767px)

- `mg-v2-filter-grid--row1`: 기간+월을 **한 열 스택**, 뱃지 그룹은 다음 행으로 줄바꿈.  
- 뱃지 그룹: 가로 스크롤 허용 시 `gap` 8px, 최소 터치 44px (`RESPONSIVE_LAYOUT_SPEC` 정합).  
- 검색 행: input **전폭**, 적용 버튼은 input **아래** 전폭 또는 우측 정렬(한 손 엄지 존 고려).

### 4.4 월 피커

- `ChevronLeft` / `ChevronRight` 네비: `mg-financial-month-picker__nav`, `type="month"` 입력: `mg-financial-month-picker__input`.  
- 기간 select이 “월”이 아닐 때는 월 피커 숨김(현행과 동일).

---

## 5. 접근성

| 요소 | 요구사항 |
|------|----------|
| 기간 select | `<label for="financial-filter-date-range">` + 고유 `id` (현행 유지). |
| 월 입력 | `id="financial-filter-month-ym"`, `aria-label`은 월 조회 문구(문자열 상수). 그룹 `aria-label`로 네비+입력 묶음. |
| 월 이전/다음 버튼 | `aria-label` + `title` 동일(현행). 아이콘만 있을 때 `aria-hidden` on 아이콘. |
| 검색 input | `<label for="financial-filter-search">`, placeholder는 예시만. |
| 거래 유형·카테고리 | 시각적 뱃지이나 **버튼**이면 이름이 상태를 읽을 수 있게; 선택됨은 `aria-pressed` 또는 별도 `aria-current` 정책을 ERP 뱃지 필터 공통에 맞출 것. |
| 툴바 | `ErpFilterToolbar`의 `aria-label`로 region 구분. |
| 로딩 | `aria-busy` on `erp-content` (또는 목록 카드 루트) — `FinancialManagement` / `PurchaseManagement` 와 동일 계열. |

---

## 6. 색·타이포 토큰 요약

| 용도 | 토큰 |
|------|------|
| 페이지 배경 | `var(--mg-color-background-main)` |
| 필터 블록 카드 | `var(--mg-color-surface-main)`, 테두리 `var(--mg-color-border-main)` |
| 제목·본문 | `var(--mg-color-text-main)` / 보조 `var(--mg-color-text-secondary)` |
| 주조 버튼 | `var(--mg-color-primary-main)` 배경, 본문 대비 텍스트는 B0KlA 규칙 |
| 어드민 카드·툴바 세부 | 필요 시 `mg-v2-ad-b0kla__card`, `mg-v2-ad-b0kla__pill` (비활성/활성) |

---

## 7. 완료 기준 (코더·QA)

- [ ] 검색 범위가 A/B/C 중 무엇인지 **배지 + 보조문구**로 사용자가 3초 안에 이해할 수 있다.  
- [ ] 빈 결과 시 조건 요약 + (해당 시) 다음 페이지 유도 문구가 있다.  
- [ ] `totalPages > 1`일 때 검색이 페이지 한정이면 그 제약이 UI에 드러난다.  
- [ ] `silentListRefreshing` 중 `aria-busy` 및 시각적 피드백이 Refund/Purchase ERP 패턴과 어긋나지 않는다.  
- [ ] 필터 툴바가 B0KlA 섹션 블록·`mg-v2-erp-filter-toolbar` 그리드에 맞고, 모바일에서 터치 타겟이 확보된다.  
- [ ] 모든 필터 컨트롤에 프로그램적 라벨·그룹이 연결된다.

---

## 8. 참조 파일 (읽기 전용)

- 기획: `.cursor/skills/core-solution-planning/SKILL.md` §0.4  
- 펜슬: `docs/design-system/PENCIL_DESIGN_GUIDE.md`  
- 토큰: `frontend/src/styles/unified-design-tokens.css`  
- 유사 패턴: `frontend/src/components/erp/PurchaseManagement.js`, `frontend/src/components/erp/refund-management/RefundFilterBlock.js`, `frontend/src/components/erp/FinancialManagement.js`

---

**변경 이력**

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1 | 2026-04-25 | 초안 — 필터·검색·월·페이지 사용성·정보 노출·레이아웃·접근성 |
