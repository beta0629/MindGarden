# 급여 관리·급여 프로필 아토믹 마크업 구조

**작성일**: 2025-03-16  
**담당**: core-publisher  
**참조**: `docs/project-management/SALARY_MANAGEMENT_RENEWAL_SURVEY.md`, `docs/design-system/REFUND_MANAGEMENT_ATOMIC_MARKUP.md`, `.cursor/skills/core-solution-publisher/SKILL.md`, `.cursor/skills/core-solution-atomic-design/SKILL.md`

---

## 1. 개요

- **목적**: 급여 관리 페이지(`/erp/salary`) 및 급여 프로필(탭·모달)의 HTML 마크업 구조를 아토믹 디자인 계층으로 제안.
- **규칙**: BEM(`mg-v2-*`, `salary-management__*`), 시맨틱 태그, 접근성(aria-*, role, label) 반영.
- **공통 컴포넌트**: 버튼·배지·카드는 `common/` 모듈 클래스만 사용. 신규 클래스·구조 금지.
- **계층**: Atoms → Molecules → Organisms → Templates → Pages.

---

## 2. 급여 관리 페이지 — 아토믹 계층 제안

### 2.1 Atoms (원자)

기존 디자인 토큰·BEM 적용. 환불 관리와 동일한 공통 클래스 사용.

| 용도 | 클래스 | 비고 |
|------|--------|------|
| 주 액션 버튼(급여 계산 실행, 새 프로필 생성 등) | `mg-v2-button mg-v2-button--primary` | |
| 보조 버튼(설정, 세금 내역 보기, 출력 등) | `mg-v2-button mg-v2-button--secondary` | |
| 링크형/아웃라인 | `mg-v2-button mg-v2-button--outline` | |
| 아이콘만 버튼(기산일 설정 등) | `mg-v2-button mg-v2-button--secondary` + `aria-label` 필수 | |
| 폼 라벨 | `mg-v2-form-label` | `<label for="...">` |
| KPI/카드 라벨 | `salary-management__stat-label` | 숫자 위 설명 텍스트 |
| 상태 배지(계산 완료/대기 등) | `mg-v2-status-badge` + `mg-v2-badge--success` / `--warning` / `--neutral` / `--danger` / `--info` | role="status" |
| 회기/건수 배지 | `mg-v2-count-badge` | |
| 기간/상담사/급여일 선택 | `mg-v2-select` | id + label for 연결 |
| 텍스트 입력 | `mg-v2-input` 등 디자인 스펙에 정의된 입력 클래스 | |
| 아이콘 컨테이너 | `salary-management__icon` | 아이콘만 버튼엔 aria-label 필수 |

---

### 2.2 Molecules (분자)

| 블록 | 역할 | BEM 클래스 예시 |
|------|------|-----------------|
| **KPI 카드 1장** | 급여 건수/금액/상담 건수/실지급액 등 한 개 지표 표시. 카드 래퍼 + 라벨 + 값. | `mg-v2-card-container salary-management__stat-card`, `salary-management__stat-label`, `salary-management__stat-value` |
| **필터 그룹** | 기간(select) + 상담사(select) + 급여 지급일(select) 한 줄. 폼 필드 묶음. | `salary-management__filter-group`, `salary-management__filter-fieldset`, `mg-v2-form-group salary-management__filter-field` |
| **테이블 행 — 헤더 한 줄** | 급여 계산 내역/세금 테이블 thead 한 줄. | `<tr>`, 셀: `salary-management__th`, 액션 열: `salary-management__th--action`, scope="col" |
| **테이블 행 — 데이터 한 줄** | 계산 내역 한 건 또는 세금 통계 행. 셀 + 필요 시 액션 버튼. | `salary-management__data-row`, `salary-management__td`, `salary-management__td--action` |
| **탭 버튼** | "급여 프로필" \| "급여 계산" \| "세금 관리" 중 하나. | `mg-tabs` 내 `mg-tab`, `mg-tab-active` (기존 탭 클래스) |
| **프로필 카드 1장** | 상담사 이름, 이메일, 등급, "프로필 조회" 버튼. 급여 프로필 탭 그리드 한 셀. | `mg-v2-card-container salary-management__profile-card`, `salary-management__profile-info`, `salary-management__profile-actions` |
| **계산 카드 1장** | 기간, 상태, 기본/옵션/총 급여, 세금, 실지급액, 상담 건수, "세금 내역 보기", "출력". 급여 계산 탭 리스트 한 건. | `mg-v2-card-container salary-management__calculation-card`, `salary-management__calculation-header`, `salary-management__calculation-details`, `salary-management__detail-row`, `salary-management__calculation-actions` |
| **세금 통계 카드 1장** | 총 세금액/세금 건수/원천징수/지방소득세/부가세/국민연금/건강보험/장기요양/고용보험, 총 공제액, 액션. | `mg-v2-card-container salary-management__tax-stat-card`, `salary-management__tax-stat-content`, `salary-management__tax-stat-actions` |
| **미리보기 행(디테일)** | 계산 실행 후 상담사, 기간, 상담 건수, 총 급여, 세금, 실지급액 등 한 줄 요약. | `salary-management__preview-result`, `salary-management__preview-detail` (또는 detail-row 재사용) |

---

### 2.3 Organisms (유기체)

| 블록 | 역할 | BEM 클래스 예시 |
|------|------|-----------------|
| **급여 KPI 블록** | 상단 4열(또는 설계에 따른 N열) — 급여 건수, 총 급여, 상담 건수, 실지급액 등. | `salary-management__kpi-block`, `salary-management__kpi-grid`, 내부 Molecule KPI 카드 반복 |
| **필터 + 액션 블록** | 필터 그룹(Molecule) + "급여 계산 실행" 또는 "세금 통계 조회" 등 버튼. 헤더 기간 선택·기산일 설정 포함 시 동일 블록 또는 헤더 영역으로. | `salary-management__filter-block`, `salary-management__filter-actions` 또는 `mg-v2-card-actions` |
| **급여 프로필 탭 콘텐츠** | 섹션 제목 "상담사 급여 프로필", 액션 "새 프로필 생성", 빈 상태 메시지, 프로필 카드 그리드. | `salary-management__profile-tab`, `salary-management__profiles-grid`, 빈 상태: `salary-management__empty-state`, `salary-management__no-profiles-message` |
| **급여 계산 탭 콘텐츠** | 컨트롤(상담사 선택, 계산 기간, 급여 지급일, 실행 버튼) + 미리보기(Molecule) + 계산 내역(계산 카드 목록 또는 테이블). | `salary-management__calculation-tab`, `salary-management__calculation-controls`, `salary-management__calculations-list` 또는 `salary-management__calculations-table` |
| **세금 관리 탭 콘텐츠** | 섹션 제목 "세금 관리", 액션 "세금 통계 조회", 통계 카드(또는 테이블). 빈 상태 안내. | `salary-management__tax-tab`, `salary-management__tax-stats-block`, `salary-management__tax-stats-content`, 빈 상태: `salary-management__empty-state` |

---

### 2.4 Template

| 요소 | 역할 | 비고 |
|------|------|------|
| **AdminCommonLayout** | 어드민 공통 레이아웃 래퍼. | 기존 레이아웃 사용 |
| **ContentHeader** | 제목 "급여 관리", 부제 "상담사 급여 프로필 및 계산 관리", 오른쪽 액션(기간 select, 기산일 설정 버튼). | B0KlA·환불 관리와 동일하게 ContentHeader + ContentArea 도입 시 통일 |
| **탭 네비게이션** | "급여 프로필" \| "급여 계산" \| "세금 관리". | `mg-tabs` 등 기존 탭 마크업 |
| **본문(ContentArea)** | 탭별 Organism 배치. 순서: (1) 급여 KPI 블록(선택), (2) 필터+액션 블록, (3) 활성 탭에 따른 콘텐츠 — 급여 프로필 탭 / 급여 계산 탭 / 세금 관리 탭 중 하나. | `<main>` 내 section 또는 div, `salary-management__main` |

---

### 2.5 Page

- **페이지**: SalaryManagement. 데이터·필터 상태·API·이벤트·탭 전환 로직은 core-coder 담당. 퍼블리셔는 마크업 구조만 제안.

---

## 3. 급여 프로필 (탭 내부 + 모달)

### 3.1 탭 내부

| 블록 | 계층 | 역할 | BEM 클래스 예시 |
|------|------|------|-----------------|
| **프로필 카드** | Molecule | 상담사별 카드 — 이름, 이메일, 등급, "프로필 조회" 버튼. | `salary-management__profile-card`, `salary-management__profile-info`, `salary-management__profile-actions` |
| **급여 테이블 행** | Molecule | 모달 내 또는 별도 테이블에서 급여 항목 한 줄(기본급, 옵션, 세금 등). | `salary-management__salary-row`, `salary-management__td`, `salary-management__td--action` |

### 3.2 모달 내부

| 블록 | 계층 | 역할 | BEM 클래스 예시 |
|------|------|------|-----------------|
| **급여 프로필 옵션 폼** | Organism | 프로필 생성/편집 폼 — 상담사 선택, 급여 유형, 기본급, 옵션, 세금 설정 등 필드 그룹 + 제출/취소 버튼. | `salary-management__profile-form`, `salary-management__profile-form-section`, `salary-management__profile-form-actions` |
| **프로필 조회 모달 본문** | Organism | ConsultantProfileModal 내부 — 프로필 요약 + 급여 카드/테이블 + 편집 진입 액션. | `salary-management__profile-view`, `salary-management__profile-view-details`, `salary-management__profile-view-salary` |

---

## 4. 시맨틱·접근성 권장 사항

- **섹션**: 각 Organism은 `<section>` 래퍼 + `aria-labelledby`로 제목(id)과 연결.
- **제목 레벨**: 페이지 제목 `h1`, 블록 제목 `h2`. 스크린 리더 전용 제목은 `class="sr-only"` 사용.
- **테이블**: `<table>` 사용 시 `<caption>` 또는 `aria-labelledby`로 제목 연결. `<th scope="col">` 명시. 액션 열 헤더는 `aria-label="액션"` 등으로 설명.
- **폼**: `<fieldset>` + `<legend>`(sr-only 가능). 모든 select/input에 `<label for="...">` 또는 `aria-label` 적용.
- **버튼**: 아이콘만 있는 버튼(기산일 설정 등)에는 `aria-label` 필수.
- **배지**: 상태 배지에 `role="status"` 적용.
- **탭**: 탭 목록에 `role="tablist"`, 탭 버튼에 `role="tab"`, 패널에 `role="tabpanel"`, `aria-selected`, `aria-controls` 등 디자인 스펙에 맞게 적용.

---

## 5. 환불 관리와의 대응 관계 (블록명 비교)

| 급여 관리 (Salary Management) | 환불 관리 (Refund Management) | 비고 |
|-------------------------------|-------------------------------|------|
| `salary-management__kpi-block` | `refund-management__kpi-block` | 상단 KPI 카드 4열 |
| `salary-management__filter-block` | `refund-management__filter-block` | 필터 그룹 + 액션 버튼 |
| `salary-management__stat-card` | `refund-management__stat-card` | KPI 카드 1장 (Molecule) |
| `salary-management__filter-group` / `filter-fieldset` | `refund-management__filter-fieldset` | 기간·상태(또는 상담사·급여일) 필터 |
| `salary-management__profile-tab` + `profiles-grid` | — | 탭별 콘텐츠(환불은 탭 없음) |
| `salary-management__calculation-tab` + `calculations-list` | `refund-management__table-block` | 계산 내역 vs 환불 이력 테이블 |
| `salary-management__tax-tab` + `tax-stats-block` | `refund-management__reason-stats-block` | 세금 통계 vs 환불 사유별 통계 |
| `salary-management__profile-card` | — | 프로필 카드(환불에는 없음) |
| `salary-management__calculation-card` | 테이블 행 반복 | 카드형 vs 테이블 행 |
| `salary-management__profile-form` (모달) | — | 프로필 폼 모달(환불에는 해당 없음) |

**한 줄 요약**: 급여 관리는 KPI·필터·테이블/카드 리스트 구조가 환불 관리와 동일한 패턴이며, 탭(급여 프로필/급여 계산/세금 관리)과 모달(프로필 폼·프로필 조회)이 추가된 형태로 동일 BEM·시맨틱·공통 컴포넌트 규칙을 적용하면 된다.

---

## 6. 클래스명 일람 (BEM) — 요약

| 클래스 | 계층 | 용도 |
|--------|------|------|
| `salary-management__main` | Template | 본문 컨테이너 |
| `salary-management__kpi-block` | Organism | KPI 섹션 |
| `salary-management__kpi-grid` | Organism | KPI 카드 그리드 |
| `salary-management__stat-card` | Molecule | KPI 카드 1장 |
| `salary-management__stat-label` | Atom | KPI 라벨 |
| `salary-management__stat-value` | Atom | KPI 값 |
| `salary-management__filter-block` | Organism | 필터+액션 섹션 |
| `salary-management__filter-group` / `filter-fieldset` | Molecule | 필터 fieldset |
| `salary-management__filter-field` | Molecule | 필터 필드 1개 |
| `salary-management__filter-actions` | Organism | 액션 버튼 그룹 |
| `salary-management__profile-tab` | Organism | 급여 프로필 탭 콘텐츠 |
| `salary-management__profiles-grid` | Organism | 프로필 카드 그리드 |
| `salary-management__profile-card` | Molecule | 프로필 카드 1장 |
| `salary-management__profile-info` | Molecule | 프로필 카드 정보 영역 |
| `salary-management__profile-actions` | Molecule | 프로필 카드 액션 |
| `salary-management__calculation-tab` | Organism | 급여 계산 탭 콘텐츠 |
| `salary-management__calculation-controls` | Organism | 계산 컨트롤 영역 |
| `salary-management__calculations-list` | Organism | 계산 내역 목록 |
| `salary-management__calculation-card` | Molecule | 계산 카드 1장 |
| `salary-management__calculation-header` | Molecule | 계산 카드 헤더 |
| `salary-management__calculation-details` | Molecule | 계산 카드 상세 |
| `salary-management__detail-row` | Molecule | 디테일 한 줄 |
| `salary-management__calculation-actions` | Molecule | 계산 카드 액션 |
| `salary-management__preview-result` | Molecule | 계산 미리보기 |
| `salary-management__tax-tab` | Organism | 세금 관리 탭 콘텐츠 |
| `salary-management__tax-stats-block` | Organism | 세금 통계 섹션 |
| `salary-management__tax-stat-card` | Molecule | 세금 통계 카드 1장 |
| `salary-management__th` / `salary-management__th--action` | Molecule | 테이블 헤더 셀 |
| `salary-management__data-row` | Molecule | 테이블 데이터 행 |
| `salary-management__td` / `salary-management__td--action` | Molecule | 테이블 본문 셀 |
| `salary-management__empty-state` | Organism | 빈 상태 영역 |
| `salary-management__no-profiles-message` | Organism | 프로필 없음 메시지 |
| `salary-management__profile-form` | Organism | 모달 내 프로필 옵션 폼 |
| `salary-management__profile-form-section` | Organism | 폼 섹션 |
| `salary-management__profile-form-actions` | Organism | 폼 제출/취소 버튼 그룹 |
| `salary-management__profile-view` | Organism | 프로필 조회 모달 본문 |
| `salary-management__section-title` | Organism | 섹션 제목(h2) |

---

## 7. 참조

- **조사 문서**: `docs/project-management/SALARY_MANAGEMENT_RENEWAL_SURVEY.md`
- **환불 아토믹 마크업**: `docs/design-system/REFUND_MANAGEMENT_ATOMIC_MARKUP.md`
- **공통 UI**: `docs/design-system/v2/COMMON_UI_IMPLEMENTATION_SPEC.md`
- **퍼블리셔 스킬**: `.cursor/skills/core-solution-publisher/SKILL.md`
- **아토믹 디자인**: `.cursor/skills/core-solution-atomic-design/SKILL.md`

**문서 끝.**
