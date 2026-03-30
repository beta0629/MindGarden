# 급여·세금 통합 개선 회의 결과

**목표**: 급여 로직 자동화, 세금 처리 연동, 급여·세금·(선택) ERP를 하나의 통합 시스템으로 설계·개선  
**참여**: core-component-manager(조사), core-debugger(로직 분석), core-designer(UX 제안), core-planner(취합·체크리스트)  
**산출 참조**: `SALARY_TAX_INTEGRATION_SURVEY.md`, `SALARY_TAX_LOGIC_ANALYSIS.md`, `docs/design-system/SALARY_TAX_AUTO_CALC_UX_PROPOSAL.md`

---

## 1. 회의 요약

- **component-manager**: 급여·세금 관련 컴포넌트·API·상태 흐름 조사 → 수동 구간(프로필·기간·상담사·세금 통계 버튼·추가 세금)·자동 가능 구간(등급별 기본급·미리보기·기간 동적 생성) 정리. API 경로 불일치(`/api/admin/` vs `/api/v1/admin/`), 세금 통계 항목별 breakdown 미제공, POST `/tax/calculate` 미구현 등 갭 정리.
- **core-debugger**: 급여 계산 로직(기산일·기간·등급·회기·옵션·공제) 추적 → 기간 정의 불일치(기산일 vs 달력월), 등급별 요율 미사용(30,000원 고정), 보너스/공제 미반영, 세목별 `salary_tax_calculations` INSERT 없음, 미리보기 `p_tenant_id` 미전달 버그, 추가 세금 API 없음 등 수정 포인트 정리.
- **core-designer**: "한 번에 계산" 플로우 1페이지 UX 제안(진입 → 기간·대상 선택 → 자동 계산 → 미리보기(요약+세금 항목별) → 확정), B0KlA·토큰 기준 배치·필드 명시.

---

## 2. 자동화 개선안

| 개선 항목 | 현재 | 개선 방향 | 담당 |
|-----------|------|-----------|------|
| **기간 선택** | YYYY-MM 하드코딩, 기산일 기준 기간 미노출 | 최근 N개월/당월 동적 옵션, **기산일 기준 실제 계산 기간** API 조회 후 화면 노출 | 백엔드 API + 프론트 |
| **급여 미리보기** | 상담사·기간 선택 후 실행, tenant_id 미전달 버그 | `calculateSalaryPreview` 호출 시 **tenant_id IN 파라미터 전달** 수정, 동일 프로시저 로직 유지 | core-coder |
| **등급별 요율** | 프로시저에서 30,000원 고정, FREELANCE_BASE_RATE 미사용 | 프로시저에서 `common_codes` FREELANCE_BASE_RATE(등급별) 조회 후 적용, 없을 때만 30,000 기본값 | core-coder(프로시저) |
| **한 번에 계산 플로우** | 탭·버튼 분산, 미리보기 후 별도 확정 경로 | 상단 "한 번에 계산" 진입 → 기간·대상 선택 → [계산하기] 1회 → 미리보기(요약+세금 항목별) → [확정] (디자이너 UX 제안 반영) | core-coder(프론트) |
| **옵션(보너스·초과근무·공제)** | API 유형만 있고 계산 반영 없음 | 요구사항 확정 후 프로시저/엔티티에 필드 추가, 미리보기·실제 계산에 반영 | 2차 Phase |
| **기간 정의 통일** | Java 배치는 기산일 기준, ProcessMonthlySalaryBatch는 달력월 | 배치/프로시저 모두 **기산일 기준 기간** 사용하도록 통일(Java에서 기간 계산 후 전달 또는 프로시저 내부 로직 변경) | core-coder |

---

## 3. 세금 연동 개선안

| 개선 항목 | 현재 | 개선 방향 | 담당 |
|-----------|------|-----------|------|
| **세목별 저장** | `salary_tax_calculations` INSERT 없음, 세금 상세 항상 빈 목록 | 프로시저(ProcessIntegratedSalaryCalculation) 또는 프로시저 반환 후 Java에서 **원천징수/지방소득세/부가세/4대보험** 등 세목별 INSERT | core-coder |
| **세금 통계 항목별** | getTaxStatistics가 total만 반환, breakdown 없음 | `getTaxStatistics`에서 세목별(withholdingTax, localIncomeTax, vat, nationalPension 등) 집계 반환, 프론트 미리보기·세금 탭에 표시 | core-coder(백엔드+프론트) |
| **추가 세금 계산 API** | POST `/api/v1/admin/salary/tax/calculate` 미구현(404) | Controller에 POST `/tax/calculate` 추가, Request body(calculationId, grossAmount, taxType, taxRate 등) 처리, SalaryTaxCalculation 생성·저장 | core-coder |
| **외부 연동(연말정산·국세청)** | 없음 | 현 회의 범위 외. 추후 별도 기획·연동 검토 | — |

---

## 4. 통합 시스템 비전

- **단일 플로우**: 급여 프로필(등급·기본급·옵션) → **기간·대상 선택** → **한 번에 자동 계산** → **미리보기(총급여·공제·세금 항목별·실지급액)** → **확정** → (기존) 승인·지급·ERP 동기화.
- **일관된 기간**: 모든 계산·배치·통계가 **기산일 기준 기간** 하나로 통일되어, 사용자에게도 "실제 계산 기간"이 명확히 노출.
- **세금 가시성**: 계산 시점부터 세목별(원천징수/지방소득세/부가세/4대보험) 저장·집계·표시로, 세금 관리 탭·통계·연말정산 대비 데이터 일원화.
- **API·경로 통일**: 프론트 전역 `/api/v1/admin/salary/*` 사용, 상수(salaryConstants.js) 및 각 컴포넌트 호출 경로 일치.

---

## 5. core-coder용 구현 체크리스트

구현 시 아래 순서·범위를 권장한다. 범위가 크면 **1차(급여 자동화·버그 수정)** → **2차(세금 연동·항목별)** 로 나누어 진행 가능.

### 5.1 1차: 급여 자동화·버그·경로

- [ ] **미리보기 tenant_id**: `PlSqlSalaryManagementServiceImpl.calculateSalaryPreview()`에서 4번째 IN 파라미터에 `TenantContextHolder.getRequiredTenantId()` 설정, OUT 인덱스 5~ 이후로 조정.
- [ ] **기산일 기준 기간 노출**: API 추가 또는 기존 `SalaryScheduleService.getCalculationPeriod` 활용해 "선택 월 → 실제 계산 기간(기산일 기준)" 반환. 급여 관리 화면에 해당 기간 문구 표시.
- [ ] **기간 선택 동적화**: 기간 목록 하드코딩 제거, 최근 12개월 등 동적 생성.
- [ ] **등급별 요율**: `ProcessIntegratedSalaryCalculation`, `CalculateSalaryPreview` 프로시저에서 `users.grade`로 `common_codes` FREELANCE_BASE_RATE(또는 `{grade}_RATE`) 조회 후 `v_grade_rate` 설정, 없을 때만 30000.
- [ ] **기간 정의 통일**: `ProcessMonthlySalaryBatch` 호출 시 Java에서 기산일 기준 기간 계산 후 전달하거나, 프로시저 내부를 기산일 기준으로 통일.
- [ ] **프론트 API 경로 통일**: `salaryConstants.js`, SalaryManagement.js, TaxManagement.js, TaxDetailsModal.js, ConsultantProfileModal.js, SalaryExportModal 등에서 `/api/admin/salary/*` → `/api/v1/admin/salary/*` 통일.
- [ ] **한 번에 계산 UX**: 디자이너 제안(`SALARY_TAX_AUTO_CALC_UX_PROPOSAL.md`) 반영 — 상단 "한 번에 계산" 진입, 기간·대상 선택, [계산하기] 1회, 미리보기 블록(요약 카드 + 세금 항목별 행), [확정] 버튼. 기존 탭 구조와 통합.

### 5.2 2차: 세금 연동·항목별

- [ ] **세목별 세금 저장**: ProcessIntegratedSalaryCalculation 실행 후 원천징수/지방소득세/부가세/4대보험 등 세목별 금액을 `salary_tax_calculations`에 INSERT(프로시저 내부 또는 Java에서 프로시저 OUT 확장 후 저장).
- [ ] **세금 통계 항목별**: `SalaryManagementService.getTaxStatistics(period)`에서 세목별 집계 반환, 프론트 세금 관리 탭·미리보기에서 breakdown 표시.
- [ ] **POST /api/v1/admin/salary/tax/calculate**: Controller에 추가, Request body 처리, SalaryTaxCalculation 생성·저장 및 필요 시 salary_calculations.deductions 반영.

### 5.3 검증 체크리스트(수정 후)

- [ ] 급여 미리보기 호출 시 해당 테넌트로 정상 계산되는지(tenant_id 전달).
- [ ] 선택 월과 "실제 계산 기간"(기산일 기준)이 화면/배치/프로시저에서 일치하는지.
- [ ] 등급별 요율 변경 시 프리랜서 급여에 반영되는지.
- [ ] 세금 상세 조회 시 `salary_tax_calculations`에 데이터가 쌓이는지.
- [ ] POST `/api/v1/admin/salary/tax/calculate` 호출 시 200 및 세금 반영 여부.
- [ ] `/api/v1/admin/salary/*` 호출이 모든 급여·세금 화면에서 일관되게 동작하는지.

---

## 6. 참조 문서

| 문서 | 설명 |
|------|------|
| `docs/project-management/SALARY_TAX_INTEGRATION_SURVEY.md` | 컴포넌트·API·흐름·수동/자동 구간·세금 위치 |
| `docs/debug/SALARY_TAX_LOGIC_ANALYSIS.md` | 로직 추적·갭·수정 포인트·파일·메서드 |
| `docs/design-system/SALARY_TAX_AUTO_CALC_UX_PROPOSAL.md` | 한 번에 계산 플로우·배치·필드·토큰 제안 |

---

**회의 제한**: 회의 단계에서는 디버거/디자이너/컴포넌트매니저는 분석·제안만 수행했으며, 코드 수정은 core-coder가 체크리스트 기준으로 수행한다.
