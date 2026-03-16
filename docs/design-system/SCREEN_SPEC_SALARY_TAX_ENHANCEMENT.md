# 급여·세금 고도화 — 화면 UX·정보 구성·레이아웃 설계

**버전**: 1.0.0  
**작성일**: 2026-03-16  
**담당**: core-designer  
**참조**:  
- `docs/project-management/SALARY_TAX_VERIFICATION_MEETING_RESULT.md`  
- `docs/project-management/SALARY_TAX_COMPONENT_MODULE_REVIEW.md`  
- `docs/design-system/PENCIL_DESIGN_GUIDE.md`  
- `docs/design-system/SALARY_TAX_AUTO_CALC_UX_PROPOSAL.md`  
- `docs/design-system/SALARY_MANAGEMENT_LAYOUT_DESIGN.md`  
- `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md`  
- 어드민 대시보드 샘플: https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample  

**범위**: 설계·화면설계서(스펙)만 산출. 코드 작성 없음.

---

## 1. 개요 및 배경

### 1.1 목적

- 급여·세금 **고도화**를 위한 **화면 UX·정보 구성·레이아웃**을 단일 스펙으로 정의한다.
- TaxManagement / ImprovedTaxManagement 단일화, 실데이터 API 연동, 세금 breakdown 표시와 백엔드 구조 일치를 전제로, **사용성·역할별 노출·블록 구성**을 명확히 한다.

### 1.2 검증 회의·컴포넌트 검토 요약

| 구분 | 핵심 이슈 |
|------|-----------|
| **UX** | TaxManagement vs ImprovedTaxManagement 중복; ImprovedTaxManagement는 `/api/v1/admin/tax/calculations`(목업) 사용, 실데이터는 `/api/v1/admin/salary/tax/*`. 단일화·실데이터 연동 필요. |
| **정보** | 세금 breakdown 표시와 백엔드 구조(breakdown.withholdingTax, localIncomeTax, vat, incomeTax, nationalPension, fourInsurance 등) 일치 필요. |
| **라우트** | `/erp/salary`, `/erp/tax` 두 페이지가 별도 존재. 단일화 시 페이지 구조·섹션 블록 통일 제안. |

---

## 2. 현재 UX에서 개선이 필요한 점 목록

### 2.1 플로우·사용성

| 번호 | 현상 | 개선 방향 |
|------|------|-----------|
| 1 | "한 번에 계산" 플로우가 문서(SALARY_TAX_AUTO_CALC_UX_PROPOSAL)에만 있고, 실제 화면에서 진입점·순서가 불명확할 수 있음 | 진입(CTA) → 기간·대상 선택 → 계산 → 미리보기 → 확정을 **한 페이지·고정 블록 순서**로 명시 |
| 2 | 기간 선택이 "달력월" vs "기산일 기준 기간" 불일치(회의 결과) | 기간 선택 블록에 **실제 계산 기간(기산일 기준)** 을 항상 표시하고, 기산일 설정 링크/툴팁 제공 |
| 3 | 미리보기·세금 항목별(breakdown) 표시가 화면별로 상이하거나 백엔드 키와 불일치 | breakdown 필드명·우선순위를 백엔드 응답(breakdown, taxByType)과 1:1 매핑하여 스펙에 고정 |
| 4 | 세무 관리(/erp/tax)가 실데이터와 미연동·목업 사용 | 세무 영역을 급여 실데이터 API(`/api/v1/admin/salary/tax/*`)와만 연동하도록 단일 컴포넌트·단일 라우트 정책 |

### 2.2 정보 노출·권한

| 번호 | 현상 | 개선 방향 |
|------|------|-----------|
| 5 | SALARY_MANAGE / TAX_MANAGE 역할별 노출 범위가 스펙에 명시되어 있지 않음 | 역할별 노출 범위·우선순위를 본 문서에 정의 |
| 6 | 세금 통계·breakdown 항목 우선순위가 화면마다 다를 수 있음 | 표시 항목·순서를 백엔드 breakdown 키 순으로 고정 제안 |

### 2.3 레이아웃·구조

| 번호 | 현상 | 개선 방향 |
|------|------|-----------|
| 7 | `/erp/salary`와 `/erp/tax`가 별도 페이지로 같은 레이아웃 언어를 쓰지 않을 수 있음 | B0KlA·AdminCommonLayout·unified-design-tokens 기준으로 **동일한 페이지 구조·섹션 블록 규칙** 적용 |
| 8 | 섹션 블록 순서가 문서 간(LAYOUT_DESIGN vs AUTO_CALC_PROPOSAL) 다름 | 고도화 시 **단일 블록 순서**를 정의하고, 급여 관리·세무 관리를 "탭/뷰"로 나누든 "단일 스크롤"이든 동일 순서 원칙 적용 |

### 2.4 API·상수

| 번호 | 현상 | 개선 방향 |
|------|------|-----------|
| 9 | SalaryManagement에서 SALARY_API_ENDPOINTS 미전면 사용, ImprovedTaxManagement는 다른 API 사용 | 스펙에서 "급여·세금 화면은 SALARY_API_ENDPOINTS 기반 실데이터만 사용"으로 명시(구현은 core-coder) |
| 10 | 세금 breakdown 한글 라벨·타입 코드 매핑이 상수/스펙에 없음 | 스펙에 breakdown 키 → 표시 라벨 매핑 테이블 포함(코더 구현 시 참고) |

---

## 3. 사용성 — 개선 플로우·블록 순서 제안

### 3.1 한 번에 계산 플로우 (유지·강화)

기존 `SALARY_TAX_AUTO_CALC_UX_PROPOSAL.md`의 5단계를 유지하되, **같은 페이지 내 고정 블록 순서**로 배치한다.

| 단계 | 사용자 동작 | 블록 위치 |
|------|-------------|-----------|
| 1. 진입 | "한 번에 계산" 또는 "급여 계산 실행" CTA 클릭 | ContentHeader 우측 또는 필터 블록 내 1차 버튼 |
| 2. 기간·대상 선택 | 월(또는 기간) + 상담사(1명/전체) 선택 | 본문 **섹션 블록 1: 계산 대상 선택** |
| 3. 자동 계산 | "계산하기" 1회 클릭 | 동일 블록 내 버튼 |
| 4. 미리보기 | 총급여·공제·세금·실지급액·세금 항목별·적용 기간 확인 | **섹션 블록 2: 계산 결과 미리보기** |
| 5. 확정 | "확정" 클릭 → 저장·상태 변경 | 미리보기 블록 하단 또는 ContentHeader 우측 |

- **1페이지 완결**: 탭 전환 없이, 위 순서대로 스크롤로 진행. 모달은 "기산일이란?" 등 보조 정보만 사용 권장.

### 3.2 고도화 시 권장 블록 순서 (단일 페이지 구조)

급여 관리(/erp/salary)와 세무 관리(/erp/tax)를 **단일화**할 때 아래 순서를 기준으로 한다.  
(단일화 방식: "한 페이지 + 탭" 또는 "한 페이지 + 스크롤 섹션"은 기획 결정; 여기서는 **블록 순서**만 정의.)

| 순서 | 블록 이름 | 역할 |
|------|-----------|------|
| 0 | **ContentHeader** | 브레드크럼, 페이지 제목, 기간 선택(공통), [급여 기산일 설정], [한 번에 계산] 또는 [급여 계산 실행] |
| 1 | **계산 대상 선택** (필터·제어) | 기간(월), 상담사(단일/전체), **실제 계산 기간(기산일 기준)** 표시, [계산하기] |
| 2 | **급여 미리보기·확정** | 계산 실행 후: 요약 카드(총급여·공제·세금·실지급액), 세금 breakdown, 적용 기간, [확정] / [다시 계산] |
| 3 | **상담사 목록·프로필** | 급여 프로필 카드/테이블, 프로필 등록·수정 진입 |
| 4 | **세금 통계·breakdown** | 기간별 세금 통계(합계·건수·평균), **세목별 breakdown** 표(또는 카드) |
| 5 | **설정 영역** (선택) | 급여 기산일 설정 모달 진입, 기타 설정 링크 |

- **탭으로 나눌 경우**: "급여 계산"(블록 1+2) | "프로필"(블록 3) | "세금"(블록 4) 식으로 같은 블록을 탭별로 그룹핑 가능. 이때도 블록 내부 스타일·토큰은 동일하게 적용.

---

## 4. 정보 노출 — 역할별 범위·세금 breakdown 항목

### 4.1 역할별(SALARY_MANAGE, TAX_MANAGE) 노출 범위

| 권한 | 노출 영역 | 비노출·제한 |
|------|-----------|-------------|
| **SALARY_MANAGE** | 급여 프로필 조회·등록·수정, 급여 계산 실행·미리보기·확정, 상담사별 급여 내역, 기산일 설정(권한 있으면) | 세금 통계·breakdown은 TAX_MANAGE와 동일 노출 권장(급여와 세금이 한 플로우이므로). 단, "세금만 단독 관리" 메뉴 진입은 TAX_MANAGE만 가능하도록 설정 가능. |
| **TAX_MANAGE** | 세금 통계·세목별 breakdown, 기간별 세금 조회, 추가 세금 계산(해당 API 사용 시) | 급여 프로필 수정·급여 확정은 SALARY_MANAGE 필요. |
| **둘 다 없음** | 급여·세금 메뉴 비노출(메뉴 항목 숨김) | — |

- **단일화된 페이지**에서: 메뉴는 "급여 관리" 하나로 두고, 내부에 "급여 계산·프로필·세금" 블록을 두는 안이 권장. 이 경우 SALARY_MANAGE 있으면 전체 페이지 진입, TAX_MANAGE만 있으면 "세금 통계·breakdown" 블록만 활성화하거나 읽기 전용으로 진입하는 식으로 구현 가능(기획 결정).

### 4.2 세금 breakdown·통계 표시 항목·우선순위

백엔드 `getTaxStatistics` 응답의 `breakdown` 키와 일치시키며, 표시 순서와 라벨을 고정한다.

| 순서 | breakdown 키 (백엔드) | 표시 라벨 (한글) | 비고 |
|------|------------------------|------------------|------|
| 1 | withholdingTax | 원천징수세 | |
| 2 | localIncomeTax | 지방소득세 | |
| 3 | vat | 부가가치세 | |
| 4 | incomeTax | 소득세 | |
| 5 | nationalPension | 국민연금 | 4대보험 세부일 경우 하위 표시 |
| 6 | fourInsurance | 4대보험 | 국민연금·건강·장기요양·고용 통합 또는 세부 항목 나열 |

- **통계 블록**에 표시할 요약: 기간(period), 총 계산 건수(totalCalculations), 총 급여(totalGrossSalary), 총 실지급액(totalNetSalary), 총 세금(totalTaxAmount), 평균 급여(averageGrossSalary)·평균 실지급(averageNetSalary). 그 다음 **breakdown 테이블/카드**를 위 순서로 표시.
- **미리보기 블록**의 세금 항목별: 동일 breakdown 키·라벨 사용. 백엔드가 항목별로 내려주지 않으면 "세금 합계"만 표시하고 항목별은 "—" 또는 "준비 중" 처리.

---

## 5. 레이아웃 — B0KlA·AdminCommonLayout·단일화 페이지 구조

### 5.1 공통 레이아웃 기준

- **레이아웃**: `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md`, `PENCIL_DESIGN_GUIDE.md` 준수.
- **사이드바**: 260px 고정, 배경 #2C2C2C. 메뉴: "급여 관리" 단일 진입 또는 "급여 관리" / "세무 관리" 분리(기획에 따라 하나로 통합 권장).
- **메인**: AdminCommonLayout 내 ContentHeader + ContentArea. 배경 `var(--mg-color-background-main)` ~ 그라데이션.
- **상단 바**: 높이 56~64px, 배경 `var(--mg-color-background-main)`, 하단 1px `var(--mg-color-border-main)`. 브레드크럼, 제목, 우측 액션.
- **본문 패딩**: 24~32px(데스크톱), 브레이크포인트별 `RESPONSIVE_LAYOUT_SPEC` §2.2 참조.
- **섹션 블록**: 배경 `var(--mg-color-surface-main)`, 테두리 1px `var(--mg-color-border-main)`, border-radius 16px, 패딩 24px, 내부 gap 16px. 섹션 제목: **좌측 세로 악센트 바** 4px `var(--mg-color-primary-main)`, radius 2px + 제목 텍스트 16px fontWeight 600 `var(--mg-color-text-main)`.

### 5.2 단일화 시 페이지 구조 제안

- **옵션 A — 한 라우트·탭 분리**  
  - 라우트: `/erp/salary` 단일.  
  - ContentHeader 제목: "급여·세금 관리".  
  - 본문: 탭 [급여 계산 | 프로필 | 세금 통계]. 탭별로 위 블록 1+2, 3, 4 배치.  
  - 세무 전용 진입이 필요하면 메뉴에 "세무 관리"를 두고 `/erp/tax` → `/erp/salary?tab=tax` 리다이렉트로 통일.

- **옵션 B — 두 라우트·동일 레이아웃**  
  - `/erp/salary`: ContentHeader "급여 관리", 블록 순서 0→1→2→3→(4 생략 또는 요약만).  
  - `/erp/tax`: ContentHeader "세무 관리", 블록 순서 0→1(기간만)→4→(2,3 요약 또는 링크).  
  - 두 페이지가 **동일한 ContentHeader 구조·동일한 섹션 블록 스타일·동일 토큰**을 사용하도록 스펙 통일.

- **권장**: 옵션 A로 단일 페이지·탭 구조 시 UX 일관성·실데이터 API 단일 연동이 유리함.

### 5.3 반응형

- `RESPONSIVE_LAYOUT_SPEC.md` §1~4 준수. 모바일 375px~4K 3840px, 터치 영역 44px 이상, 4K에서 본문 max-width 1920px.
- 필터·카드: 데스크톱 가로 배치, 태블릿 2열, 모바일 1열 스택.

---

## 6. 고도화 화면 설계 — 블록 단위 스펙

### 6.1 ContentHeader

| 항목 | 스펙 |
|------|------|
| **위치** | 메인 영역 최상단. |
| **구성** | 좌: 브레드크럼(예: ERP > 급여·세금 관리). 중/좌: 제목 "급여·세금 관리"(또는 "급여 관리" / "세무 관리" 분리 시 각각). 부제(선택): "상담사 급여 및 세금 계산·통계". 우: [급여 기산일 설정](아웃라인 또는 주조), 기간 선택 `<select>`(월, 예: 2025-03), **「한 번에 계산」** 또는 **「급여 계산 실행」** (주조 버튼). |
| **토큰** | 배경 `var(--mg-color-background-main)`, 하단 1px `var(--mg-color-border-main)`. 제목 20~24px fontWeight 600 `var(--mg-color-text-main)`. 부제 14px `var(--mg-color-text-secondary)`. 버튼: `mg-v2-button`, `mg-v2-btn--primary`, `mg-v2-button-outline`. |
| **클래스** | `mg-v2-content-header`, `mg-v2-content-header__title`, `mg-v2-content-header__subtitle`, `mg-v2-content-header__right`. |

### 6.2 기간 선택·계산 대상 선택 (섹션 블록 1)

| 항목 | 스펙 |
|------|------|
| **역할** | 기간(월), 상담사(단일/전체) 선택, **실제 계산 기간(기산일 기준)** 표시, [계산하기]. |
| **블록 스타일** | 섹션 블록 공통: 배경 `var(--mg-color-surface-main)`, 테두리 1px `var(--mg-color-border-main)`, border-radius 16px, 패딩 24px, gap 16px. 제목: 세로 악센트 4px `var(--mg-color-primary-main)` + "계산 대상 선택". |
| **컨트롤** | 기간: 월 단위 드롭다운(API/공통코드 기반). 대상: 상담사 드롭다운 또는 "전체". **실제 계산 기간** 라벨 12px `var(--mg-color-text-secondary)`, 값 예) "2025-02-26 ~ 2025-03-25 (기산일 기준)". [계산하기] 주조 버튼, height 40px, radius 10px. |
| **클래스** | `salary-filter-block`, `salary-filter-block__group`, `mg-v2-ad-b0kla__section-title`. |

### 6.3 상담사 목록·프로필 (섹션 블록 3)

| 항목 | 스펙 |
|------|------|
| **역할** | 급여 프로필 카드/테이블, 프로필 등록·수정 모달 진입. |
| **블록 스타일** | 동일 섹션 블록. 제목: 세로 악센트 + "상담사 급여 프로필". |
| **내용** | 카드 그리드 또는 테이블. 카드: 등급, 기본급, 옵션 요약, [수정] 버튼. 상단 [프로필 등록]. |
| **토큰** | 카드 배경 `var(--mg-color-surface-main)`, 테두리 `var(--mg-color-border-main)`. 숫자 24px/600, 라벨 12px. 좌측 세로 악센트 4px(주조/보조/포인트)로 카드 구분 가능. |
| **클래스** | `salary-profile-block`, `mg-v2-ad-b0kla__card`, `mg-v2-ad-b0kla__kpi-value`, `mg-v2-ad-b0kla__kpi-label`. |

### 6.4 급여 미리보기·확정 (섹션 블록 2)

| 항목 | 스펙 |
|------|------|
| **표시 조건** | "계산하기" 실행 후 결과가 있을 때만 표시. |
| **블록 스타일** | 동일 섹션 블록. 제목: 세로 악센트 + "계산 결과 미리보기". |
| **요약 카드** | 4열(데스크톱) 또는 2×2: 총 급여, 공제 합계, 세금 합계, 실지급액. 숫자 24px fontWeight 600 `var(--mg-color-text-main)`, 라벨 12px `var(--mg-color-text-secondary)`. 카드 좌측 세로 악센트 4px(주조/보조/포인트). |
| **세금 항목별** | §4.2 breakdown 순서대로 테이블 또는 정의 리스트. 헤더/라벨 12px, 값 14~16px. 백엔드 breakdown 미제공 시 "세금 합계"만 표시. |
| **적용 기간** | "적용 기간: YYYY-MM-DD ~ YYYY-MM-DD (기산일 기준)" 라벨 12px. |
| **버튼** | 블록 하단 우측: [확정](주조), [다시 계산](아웃라인 또는 텍스트). |
| **클래스** | `salary-preview-block`, `mg-v2-ad-b0kla__card`, `mg-v2-ad-b0kla__kpi-value`, `mg-v2-ad-b0kla__kpi-label`. |

### 6.5 세금 통계·breakdown (섹션 블록 4)

| 항목 | 스펙 |
|------|------|
| **역할** | 기간별 세금 통계(총 건수, 총 급여, 총 실지급액, 총 세금, 평균 급여·실지급), **세목별 breakdown** 표. |
| **블록 스타일** | 동일 섹션 블록. 제목: 세로 악센트 + "세금 통계". |
| **통계 요약** | period, totalCalculations, totalGrossSalary, totalNetSalary, totalTaxAmount, averageGrossSalary, averageNetSalary. 숫자·라벨 토큰 동일. |
| **breakdown 표** | §4.2 순서(원천징수세, 지방소득세, 부가가치세, 소득세, 국민연금, 4대보험). 테이블 헤더 12px, 셀 14~16px. 백엔드 `getTaxStatistics` 응답의 `breakdown`·`taxByType`과 1:1 매핑. |
| **API** | `GET /api/v1/admin/salary/tax/statistics?period={period}`. SALARY_API_ENDPOINTS.TAX_STATISTICS 사용. |
| **클래스** | `tax-stats-block`, `mg-v2-ad-b0kla__section-title`, 테이블은 `mg-v2-table` 또는 동일 스타일. |

### 6.6 설정 영역

| 항목 | 스펙 |
|------|------|
| **역할** | 급여 기산일 설정 모달 진입(ContentHeader 버튼으로도 가능). 필요 시 "기타 설정" 링크. |
| **노출** | 설정 전용 블록을 두거나, ContentHeader의 [급여 기산일 설정]으로만 진입. 모달: UnifiedModal + B0KlA, 배경 `var(--mg-color-surface-main)`, radius 16px. |

### 6.7 모달 (보조)

| 항목 | 스펙 |
|------|------|
| **용도** | "기산일이란?", 기간 설명 등 도움말. 급여 프로필 등록·수정, 기산일 설정. |
| **스타일** | UnifiedModal. 배경 `var(--mg-color-surface-main)`, 테두리 `var(--mg-color-border-main)`, radius 16px. 제목 20px fontWeight 600. |

---

## 7. 기존 문서와의 차이·보완

### 7.1 SALARY_TAX_AUTO_CALC_UX_PROPOSAL.md와의 관계

| 항목 | AUTO_CALC_PROPOSAL | 본 고도화 스펙 |
|------|--------------------|----------------|
| 플로우 | 진입→기간·대상→계산→미리보기→확정, 1페이지 완결 | 동일 유지. **블록 순서**를 0~5로 고정하여 "계산 대상 선택" "미리보기·확정" "프로필" "세금 통계" 순서 명시. |
| 기간 | 실제 계산 기간(기산일 기준) 노출 | 동일 + "기간 선택" 블록에 항상 표시하도록 보완. |
| breakdown | 항목별 표시, 백엔드 제공 시 | **breakdown 키·라벨·표시 순서**를 §4.2로 고정. 백엔드 키와 1:1 매핑 명시. |
| 세무 페이지 | 미언급 | **단일화**(/erp/salary 단일 또는 /erp/salary·/erp/tax 동일 레이아웃), **역할별 노출**(SALARY_MANAGE, TAX_MANAGE) 추가. |

### 7.2 SALARY_MANAGEMENT_LAYOUT_DESIGN.md와의 관계

| 항목 | LAYOUT_DESIGN | 본 고도화 스펙 |
|------|----------------|----------------|
| 구조 | ContentHeader, KPI(선택), 필터, 탭(프로필\|계산\|세금), 탭별 콘텐츠 | 동일 뼈대. 고도화에서 **블록 번호 0~5**로 순서 통일, "세금 통계·breakdown" 블록을 독립 섹션으로 명시. |
| 토큰·클래스 | B0KlA, mg-v2-*, var(--mg-*) | 동일. 모든 블록에 토큰·클래스 명시 유지. |
| API | 미명시 | **실데이터만** 사용(SALARY_API_ENDPOINTS, /api/v1/admin/salary/tax/*). ImprovedTaxManagement의 목업 API 사용 금지로 보완. |

---

## 8. 사용 토큰·참조 정리

- **색상**: `var(--mg-color-background-main)`, `var(--mg-color-primary-main)`, `var(--mg-color-text-main)`, `var(--mg-color-text-secondary)`, `var(--mg-color-surface-main)`, `var(--mg-color-border-main)` (PENCIL_DESIGN_GUIDE §2.1).
- **레이아웃**: 사이드바 260px, 상단 바 56~64px, 본문 패딩 24~32px. 섹션 블록: 배경 surface, 테두리 1px, radius 16px, 좌측 세로 악센트 4px.
- **타이포**: Noto Sans KR. 제목 20~24px/600, 본문 14~16px, 라벨/캡션 12px.
- **버튼**: 주조 `mg-v2-button` / `mg-v2-btn--primary` (height 40px, radius 10px), 아웃라인 `mg-v2-button-outline`.
- **참조**: `mindgarden-design-system.pen`, `pencil-new.pen`, `unified-design-tokens.css`, AdminCommonLayout, `RESPONSIVE_LAYOUT_SPEC.md`.

---

## 9. 적용 체크리스트 (PENCIL_DESIGN_GUIDE·Design Handoff)

- [x] 현재 UX 개선 필요 항목 목록 (§2) 정리.
- [x] 사용성: 한 번에 계산 플로우·블록 순서 제안 (§3).
- [x] 정보 노출: 역할별(SALARY_MANAGE, TAX_MANAGE) 범위·세금 breakdown 항목·우선순위 (§4).
- [x] 레이아웃: B0KlA·AdminCommonLayout·단일화 페이지 구조·반응형 (§5).
- [x] 블록 단위 스펙: ContentHeader, 기간·대상 선택, 상담사 프로필, 급여 미리보기·확정, 세금 통계·breakdown, 설정·모달 (§6).
- [x] 기존 SALARY_TAX_AUTO_CALC_UX_PROPOSAL·SALARY_MANAGEMENT_LAYOUT_DESIGN과의 차이·보완 (§7).
- [x] 토큰·클래스 명시로 코더가 추측 없이 구현 가능하도록 작성.
- [x] 코드 작성 없음.

---

**요약**: 급여·세금 고도화를 위해 (1) 현재 UX 개선 항목 10개, (2) 한 번에 계산 플로우와 고정 블록 순서(ContentHeader → 계산 대상 선택 → 미리보기·확정 → 프로필 → 세금 통계·breakdown → 설정), (3) SALARY_MANAGE/TAX_MANAGE 역할별 노출과 breakdown 키·라벨·순서, (4) B0KlA·단일화 페이지 구조(옵션 A 권장), (5) 블록 단위 스펙(토큰·클래스 명시)을 정의했다. 기존 AUTO_CALC_PROPOSAL·LAYOUT_DESIGN과의 차이를 명시해 보완 반영.
