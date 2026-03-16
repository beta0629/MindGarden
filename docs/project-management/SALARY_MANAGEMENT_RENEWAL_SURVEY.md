# 급여 관리·급여 프로필 리뉴얼 조사

**목적**: 급여 관리(Salary Management)와 급여 프로필(Salary Profile) 페이지의 현재 구조를 조사하여 리뉴얼 기획에 활용할 산출 문서를 제공한다.  
**범위**: 라우트, 컴포넌트 구조, 섹션 구성, 아토믹 디자인 적용 여부, 공통 컴포넌트·클래스 사용 현황, 개선 포인트.  
**산출**: 조사·분석·문서화만 수행(코드 수정 없음).

---

## 1. 라우트

프론트엔드에서 급여 관리·급여 프로필에 해당하는 라우트는 **단일 경로**이다.

| 경로 | 컴포넌트 | 비고 |
|------|----------|------|
| `/erp/salary` | `SalaryManagement` | `frontend/src/App.js` 568행에서 `Route path="/erp/salary"` 로 등록 |

- 급여 프로필은 별도 라우트가 없으며, **급여 관리 페이지 내 탭 "급여 프로필"** 로만 진입한다.
- 메뉴/사이드바에서 "급여 관리"로 진입 시 동일하게 `/erp/salary` → `SalaryManagement` 한 페이지에서 탭으로 구분된다.

---

## 2. 컴포넌트 구조

### 2.1 급여 관리 메인 페이지

- **파일**: `frontend/src/components/erp/SalaryManagement.js`
- **역할**: 급여 관리 메인 페이지. 탭(급여 프로필 / 급여 계산 / 세금 관리)과 각 탭 콘텐츠, 모달 트리거를 담당.

### 2.2 SalaryManagement가 사용하는 자식·공통 컴포넌트

| 컴포넌트 | 파일 경로 | 역할(한 줄 요약) |
|----------|-----------|------------------|
| AdminCommonLayout | `frontend/src/components/layout/AdminCommonLayout` | 어드민 공통 레이아웃(제목 "급여 관리" 등) |
| UnifiedLoading | `frontend/src/components/common/UnifiedLoading` | 페이지/인라인 로딩 표시 |
| StatCard | `frontend/src/components/ui/Card/StatCard` | **import만 있고 JSX에서 미사용** |
| DashboardSection | `frontend/src/components/layout/DashboardSection` | 탭별 섹션 래퍼(제목, 아이콘, actions, children) |
| MGButton | `frontend/src/components/common/MGButton` | 버튼(primary/secondary/outline 등) — 주석에 "임시 비활성화" 있으나 실제 사용 중 |
| ConsultantProfileModal | `frontend/src/components/erp/ConsultantProfileModal` | 상담사 프로필·급여 프로필 조회/편집 모달 |
| SalaryProfileFormModal | `frontend/src/components/erp/SalaryProfileFormModal` | 급여 프로필 생성/편집 폼 모달 |
| TaxDetailsModal | `frontend/src/components/common/TaxDetailsModal` | 세금 내역 상세 모달 |
| SalaryExportModal | `frontend/src/components/common/SalaryExportModal` | 급여 출력(엑셀/PDF 등) 모달 |
| SalaryPrintComponent | `frontend/src/components/common/SalaryPrintComponent` | 급여 계산서 인쇄용 컴포넌트(모달 내부 또는 인라인 출력) |
| SalaryConfigModal | `frontend/src/components/erp/SalaryConfigModal` | 급여 기산일·지급일 등 설정 모달 |

- **급여 프로필** 노출 위치:
  - **메인**: `SalaryManagement` 내 탭 "급여 프로필" → `DashboardSection` + 프로필 카드 그리드 + 빈 상태 메시지 + "새 프로필 생성" 버튼.
  - **모달**: `SalaryProfileFormModal`(새 프로필 생성/편집), `ConsultantProfileModal`(프로필 조회 및 내부 급여 폼·카드).

---

## 3. 섹션 구성

### 3.1 페이지 전체 구조

1. **헤더 영역** (`mg-dashboard-header`)
   - 왼쪽: 아이콘(DollarSign), 제목 "급여 관리", 부제 "상담사 급여 프로필 및 계산 관리"
   - 오른쪽: 급여 기산일 설정 버튼(설정 아이콘), 기간 선택 `<select>` (2025-01 ~ 2025-09 하드코딩)

2. **메인 콘텐츠** (`mg-dashboard-content` > `mg-v2-card`)
   - **탭 메뉴** (`mg-tabs`): "급여 프로필" | "급여 계산" | "세금 관리"
   - 탭별로 `DashboardSection` 하나씩 감싸서 콘텐츠 표시

### 3.2 급여 프로필 탭

| 요소 | 설명 |
|------|------|
| 섹션 | `DashboardSection` 제목 "상담사 급여 프로필", 액션 "새 프로필 생성" 버튼 |
| 빈 상태 | `salaryProfiles.length === 0` 시 `no-profiles-message` (제목, 설명, "지금 프로필 작성하기" 버튼) |
| 프로필 그리드 | `profiles-grid` → 상담사별 `profile-card` (이름, 이메일, 등급, "프로필 조회" 버튼) |
| 데이터 없음 | 상담사 없음 시 "상담사 데이터가 없습니다." 메시지 |

### 3.3 급여 계산 탭

| 요소 | 설명 |
|------|------|
| 섹션 | `DashboardSection` 제목 "급여 계산", 액션에 급여 프로필 미작성 시 "지금 작성하기" 링크 |
| 컨트롤 | `calculation-controls`: 상담사 선택, 계산 기간(month), 급여 지급일, "급여 계산 실행" 버튼 |
| 미리보기 | `previewResult` 있을 때 `preview-result` (상담사, 기간, 상담 건수, 총 급여, 세금, 실지급액) |
| 계산 내역 | `calculations-list` → `calculation-card` 목록(기간, 상태, 기본/옵션/총 급여, 세금, 실지급액, 상담 건수, "세금 내역 보기", "출력") |

### 3.4 세금 관리 탭

| 요소 | 설명 |
|------|------|
| 섹션 | `DashboardSection` 제목 "세금 관리", 액션 "세금 통계 조회" 버튼 |
| 통계 | `taxStatistics` 있을 때 `tax-calculation-card` (총 세금액, 세금 건수, 원천징수/지방소득세/부가세/국민연금/건강보험/장기요양/고용보험, 총 공제액, "세금 상세 내역 보기", "출력") |
| 빈 상태 | 통계 없을 때 "세금 통계를 조회하려면 …" 안내 |

---

## 4. 아토믹 디자인 적용 여부

- **현재**: **단일 페이지에 인라인 구조**이다. 급여 전용 **Atoms/Molecules/Organisms/Templates** 폴더 분리는 되어 있지 않다.
- **공통 UI 사용**:
  - **Organism**: `DashboardSection` (`layout/`)
  - **Atom/공통**: `MGButton` (`common/`)
  - **로딩**: `UnifiedLoading` (`common/`)
- **미사용**: `StatCard`는 import만 있고 JSX에서 사용되지 않음.
- **급여 전용**: `SalaryManagement.js` 한 파일에 헤더·탭·세 탭 콘텐츠(프로필 그리드, 계산 컨트롤·미리보기·리스트, 세금 통계)가 모두 인라인으로 작성되어 있으며, `refund-management/`처럼 **블록 단위 Organism 분리(예: SalaryProfileBlock, SalaryCalculationBlock)** 는 되어 있지 않다.

---

## 5. 사용 중인 공통 컴포넌트·클래스

### 5.1 컴포넌트

| 사용 여부 | 컴포넌트 | 사용 위치 |
|-----------|----------|-----------|
| 사용 | AdminCommonLayout | 페이지 최상위 래퍼 |
| 사용 | DashboardSection | 탭별 섹션(급여 프로필 / 급여 계산 / 세금 관리) |
| 사용 | MGButton | 헤더 설정 버튼, 새 프로필 생성, 프로필 조회, 계산 실행, 세금 통계 조회, 세금 내역/출력 등 |
| 사용 | UnifiedLoading | 초기 로딩, 계산 중 오버레이 |
| 사용(내부) | ErpModal | SalaryProfileFormModal에서 래퍼로 사용 |
| 미사용 | StatCard | import만 존재 |
| 미사용 | ErpCard, ErpButton | SalaryManagement에서는 사용하지 않음 (erp/common에 존재) |

### 5.2 CSS 클래스

| 유형 | 클래스 예시 | 정의 위치 |
|------|-------------|-----------|
| 레이아웃·공통 | `mg-dashboard-layout`, `mg-dashboard-header`, `mg-dashboard-header-content`, `mg-dashboard-header-left/right`, `mg-dashboard-title`, `mg-dashboard-subtitle`, `mg-dashboard-content`, `mg-dashboard-icon-btn` | `dashboard-common-v3.css`, `unified-design-tokens.css`, `mindgarden-design-system.css` |
| 카드·탭 | `mg-v2-card`, `mg-tabs`, `mg-tab`, `mg-tab-active` | 전역/디자인 시스템 |
| 폼·선택 | `mg-v2-select` | 헤더 기간 선택 |
| 버튼 | `mg-button` | JSX에서 사용(실제 스타일은 MGButton 또는 전역 .mg-button) |
| 로컬(급여 전용) | `profiles-grid`, `profile-card`, `profile-info`, `profile-actions`, `no-profiles-message`, `salary-no-profiles-title`, `salary-no-profiles-description`, `salary-management-create-btn`, `calculation-controls`, `control-group`, `consultant-select`, `period-input`, `payday-select`, `calculations-history`, `calculations-list`, `calculation-card`, `calculation-header`, `calculation-details`, `detail-row`, `calculation-actions`, `preview-result`, `salary-preview-*`, `tax-calculation-card`, `salary-management-*` (세금/공제 관련), `salary-management-loading-overlay`, `no-data`, `profile-warning` 등 | `SalaryManagement.css` |

### 5.3 상수 (salaryConstants)

- **SALARY_CSS_CLASSES**: `salaryConstants.js`에 정의되어 있으나 **SalaryManagement.js에서는 import만 하고 JSX의 className에 전혀 사용하지 않음.** (실제 마크업은 `mg-*` 및 SalaryManagement.css 로컬 클래스 사용)
- **SALARY_MESSAGES**: 알림 문구 등에 활용 가능하나, 현재 코드에서는 `showNotification` 등에 하드코딩 문자열도 다수 사용.

---

## 6. 개선 포인트

### 6.1 아토믹 계층 미적용 구간

- 급여 관리 전용 **Organisms/Molecules** 가 없어, 탭 콘텐츠가 모두 `SalaryManagement.js` 안에 인라인으로 작성되어 있음.
- **제안**: 환불 관리(`RefundManagement` + `refund-management/RefundKpiBlock`, `RefundFilterBlock`, `RefundHistoryTableBlock` 등)처럼 **블록 단위로 분리** (예: `SalaryProfileBlock`, `SalaryCalculationBlock`, `SalaryTaxBlock`, 필요 시 `SalaryKpiBlock`)하여 재사용·테스트·유지보수 용이하게 할 수 있음.

### 6.2 반복 마크업·스타일

- `profile-card` / `calculation-card` / `tax-calculation-card` 등 **카드형 블록**이 구조·스타일이 유사하나 각각 로컬 클래스로 정의됨. 공통 카드 컴포넌트(예: ErpCard 또는 공통 Card)로 통일하면 BEM·디자인 토큰 적용이 수월함.
- `detail-row`, `calculation-header`, `calculation-details` 등 **리스트/디테일 패턴**이 급여 계산·세금 관리에서 반복됨. Molecules로 묶어 재사용 가능.

### 6.3 B0KlA·unified-design-tokens 미적용 가능성

- 헤더는 `mg-dashboard-*` 를 쓰나, **ContentHeader / ContentArea** (환불 관리에서 사용하는 `dashboard-v2/content` 패턴)는 사용하지 않음. B0KlA·v2 레이아웃으로 통일하려면 ContentHeader + ContentArea 도입 검토 가능.
- 기간 선택 옵션(2025-01 ~ 2025-09)이 **하드코딩**되어 있음. 공통코드 또는 API 기반 동적 기간 목록으로 변경 권장.
- 색·간격은 `SalaryManagement.css`에서 `var(--spacing-*)`, `var(--font-size-*)` 등 디자인 토큰을 사용하고 있어 부분 적용은 되어 있으나, **SALARY_CSS_CLASSES** 와의 정합성은 없음(정의만 하고 미사용).

### 6.4 환불 관리 리뉴얼과의 비교·구조적 개선 제안

| 항목 | 환불 관리(RefundManagement) | 급여 관리(SalaryManagement) | 제안 |
|------|-----------------------------|-----------------------------|------|
| 레이아웃 | ContentHeader + ContentArea, AdminCommonLayout | AdminCommonLayout + mg-dashboard-* 직접 사용 | ContentHeader/ContentArea 도입 시 헤더·본문 구조 통일 |
| 블록 분리 | RefundKpiBlock, RefundFilterBlock, RefundHistoryTableBlock, RefundReasonStatsBlock, RefundErpSyncBlock, RefundAccountingBlock | 없음(단일 파일 인라인) | SalaryKpiBlock, SalaryProfileBlock, SalaryCalculationBlock, SalaryTaxBlock 등 블록 분리 |
| API | StandardizedApi 사용 | apiGet/apiPost(ajax) 혼용 | StandardizedApi로 통일 권장 (core-solution-api 스킬) |
| 상태·로딩 | loading, 페이지 단위 로딩 | loading + 다수 useState | 블록별 로딩/에러 캡슐화 고려 |
| 알림 | notificationManager | showNotification | 프로젝트 표준 하나로 통일 |

- **리뉴얼 시**: 환불 관리와 동일하게 **블록 단위 Organism** 으로 나누고, **ContentHeader/ContentArea** 로 감싼 뒤, **공통 카드·버튼·폼** 은 common/ui 및 디자인 토큰을 사용하도록 정리하면, 유지보수성과 B0KlA·unified-design-tokens 적용도가 함께 올라갈 수 있음.

---

## 리뉴얼 시 참고 사항

- **라우트**: `/erp/salary` 단일 경로 유지해도 되며, 급여 프로필은 계속 탭으로 두거나, 필요 시 서브 라우트(`/erp/salary/profiles` 등) 검토.
- **컴포넌트**: StatCard 미사용 import 제거, ErpCard/공통 Card 활용 검토, 모달(ConsultantProfileModal, SalaryProfileFormModal 등)은 유지하되 UnifiedModal 규칙 적용 여부 확인.
- **스타일**: SALARY_CSS_CLASSES 를 실제 마크업에 반영할지, 아니면 제거하고 `mg-*` + 공통 토큰만 사용할지 결정 필요.
- **API·알림**: apiGet/apiPost → StandardizedApi, showNotification → 프로젝트 표준 알림으로 통일 권장.
- **문서·표준**: `core-solution-atomic-design`, `core-solution-encapsulation-modularization`, `core-solution-documentation` 스킬 및 `docs/standards/`, `docs/design-system/` 참고하여 리뉴얼 스펙·체크리스트 정리.
