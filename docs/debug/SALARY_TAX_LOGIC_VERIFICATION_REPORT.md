# 급여·세금 로직 검증 회의 — 문제점·개선점 보고서

**목적**: 급여(salary)·세금(tax) 로직을 **로직 오류·엣지 케이스·예외 처리·500 가능성** 관점에서 검토한 결과를 정리한다.  
**역할**: core-debugger — 코드 수정 없이 분석·제안만 수행.  
**참조**: `docs/debug/SALARY_TAX_LOGIC_ANALYSIS.md`, `docs/standards/ERROR_HANDLING_STANDARD.md`, core-solution-debug 스킬.

---

## 1. 문제점 목록 (증상·위치·심각도)

### 1.1 계산 로직·기간 불일치

| # | 증상 | 위치 | 심각도 |
|---|------|------|--------|
| 1 | **기간 정의 이원화**: Java 배치는 `SalaryScheduleService.getCalculationPeriod()`(기산일 기준), `getBatchStatus()`는 당월 1일~말일(달력월)로 기간 조회. 동일 “월”이라도 배치 실행 기간과 상태 조회 기간이 다를 수 있음. | `SalaryBatchServiceImpl.getBatchStatus()` (periodStart/End = 당월 1~말일), `executeMonthlySalaryBatch()` (getCalculationPeriod 사용) | 중 |
| 2 | **지방소득세 미반영**: 프로시저는 원천징수·부가세·소득세·4대보험만 INSERT. 지방소득세(원천징수의 10%) 계산·저장 없음. 세금 통계 breakdown의 `localIncomeTax`는 항상 0. | `ProcessIntegratedSalaryCalculation_standardized.sql` (세목 INSERT 블록), `getTaxStatistics` breakdown | 중 |
| 3 | **정규직 소득세 단순 비례 적용**: 프로시저는 `p_gross_salary * v_income_tax_rate` 단순 곱. 실제 소득세는 구간별 누진 공제가 필요한데, 현재는 구간 세율을 총액에 그대로 곱함. | `ProcessIntegratedSalaryCalculation_standardized.sql` (v_income_tax_amount 계산) | 중 |
| 4 | **4대보험 기준 “월급×12”**: 정규직 4대보험 적용 조건이 `p_gross_salary * 12 >= 12000000`. 월 단위 계산에서 “연봉”을 월급×12로만 추정하므로, 보너스·변동급이 있는 경우 연간 기준과 불일치 가능. | `ProcessIntegratedSalaryCalculation_standardized.sql` (4대보험 IF 조건) | 낮음 |

### 1.2 엣지 케이스·null/검증

| # | 증상 | 위치 | 심각도 |
|---|------|------|--------|
| 5 | **상담사별 급여 조회 시 tenantId 미필터**: `getSalaryCalculations(Long consultantId)`가 `salaryCalculationRepository.findAll()` 후 consultantId로만 필터. **다른 테넌트 급여 데이터 노출 가능.** | `SalaryManagementServiceImpl.getSalaryCalculations(Long consultantId)` (248행 근처) | 높음 |
| 6 | **기간별 급여 목록 조회 시 tenantId 미필터**: `findByStatusAndCalculationPeriodStartBetween(status, startDate, endDate)`에 tenantId 조건 없음. **다른 테넌트의 같은 기간 급여가 섞여 나올 수 있음.** | `SalaryManagementServiceImpl.getSalaryCalculations(startDate, endDate)`, `SalaryCalculationRepository` | 높음 |
| 7 | **세금 상세/추가 세금 시 소유 테넌트 미검증**: `getTaxDetails(calculationId)`, `calculateAdditionalTax(request)`에서 calculation만 조회하고 `calculation.getTenantId()`와 현재 테넌트 일치 여부를 검사하지 않음. **타 테넌트 calculationId로 조회·수정 가능.** | `SalaryManagementServiceImpl.getTaxDetails()`, `calculateAdditionalTax()` | 높음 |
| 8 | **period 형식·월 검증 부족**: `getTaxStatistics(period)`에서 `period.split("-")` 후 `Integer.parseInt(periodParts[1])`만 수행. `"2025-13"`, `"2025-00"`, `"invalid"` 등에 대해 예외 또는 잘못된 날짜 생성 가능. | `SalaryManagementServiceImpl.getTaxStatistics()` (295–302행) | 중 |
| 9 | **기간 역전 미검증(컨트롤러)**: `getSalaryCalculations(startDate, endDate)`, `getSalaryStatistics(startDate, endDate)` 등에 `startDate > endDate` 검증 없음. | `SalaryManagementController` (GET /calculations, GET /statistics) | 낮음 |
| 10 | **getConsultantSalarySummary에서 consultantId null**: `userRepository.findById(consultantId).orElse(null)`로 null일 때 `findByConsultantAndCalculationPeriodStartBetween(null, ...)` 호출 가능. NPE 또는 비정상 조회. | `SalaryManagementServiceImpl.getConsultantSalarySummary()` (106행) | 중 |
| 11 | **getTopPerformers에서 getConsultant() NPE 가능**: `calc.getConsultant()`가 lazy 미로딩 구간에서 사용될 경우 NPE. | `SalaryManagementServiceImpl.getTopPerformers()` (219행) | 중 |

### 1.3 예외 처리·500 노출

| # | 증상 | 위치 | 심각도 |
|---|------|------|--------|
| 12 | **컨트롤러에서 Exception 시 메시지 그대로 노출**: 다수 메서드가 `catch (Exception e)` 후 `e.getMessage()`를 응답 body에 포함. 내부 경로·DB 메시지가 클라이언트에 노출될 수 있음. | `SalaryManagementController` (getSalaryProfile, getSalaryCalculations, getTaxDetails, getTaxStatistics 등) | 중 |
| 13 | **PL/SQL 호출 실패 시 200 + success:false**: `processIntegratedSalaryCalculation`, `calculateSalaryPreview` 등은 SQLException 시 result에 success=false만 넣고 200 반환. 컨트롤러는 result.success로 분기하므로 500은 안 나가지만, **일관된 에러 응답 형식(HTTP 4xx/5xx)과 불일치.** | `PlSqlSalaryManagementServiceImpl`, `SalaryManagementController.calculateSalaryPreview`, `confirmSalaryCalculation` 등 | 낮음 |
| 14 | **ProcessIntegratedSalaryCalculation 프로시저 호출 파라미터 개수 불일치**: 프로시저는 IN 5개 + OUT 7개 = **12개** 파라미터. Java `prepareCall`은 `?, ?, ..., ?` **11개**만 사용. 7번째 OUT(p_message) 인덱스(12) 접근 시 바인딩 불일치·오동작 가능. | `PlSqlSalaryManagementServiceImpl.processIntegratedSalaryCalculation()` (47행: 11개 placeholder) | 높음 |
| 15 | **getTaxDetails에서 calculation.getConsultant() NPE**: consultant가 lazy이고 트랜잭션 밖에서 접근 시 NPE. `consultantName`, `calculationPeriodStart/End` 접근 시 발생 가능. | `SalaryManagementServiceImpl.getTaxDetails()` (277–278행) | 중 |
| 16 | **getSalaryStatistics에서 calculations가 빈 목록일 때 reduce**: `getGrossSalary()`, `getNetSalary()`가 null일 수 있는데, `reduce(BigDecimal.ZERO, BigDecimal::add)`는 null을 넣으면 NPE. | `SalaryManagementServiceImpl.getSalaryStatistics()` (181–191행) | 중 |

### 1.4 세목별 저장·통계

| # | 증상 | 위치 | 심각도 |
|---|------|------|--------|
| 17 | **지방소득세 INSERT 없음**: 프로시저가 `salary_tax_calculations`에 WITHHOLDING_TAX, VAT, INCOME_TAX, FOUR_INSURANCE만 INSERT. 지방소득세(LOCAL_INCOME_TAX)는 넣지 않음. 통계 breakdown의 `localIncomeTax`는 항상 0. | `ProcessIntegratedSalaryCalculation_standardized.sql`, `getTaxStatistics` breakdown | 중 |
| 18 | **세금 통계 totalTaxAmount = gross - net**: `getTaxStatistics`에서 `totalTaxAmount = totalGrossSalary.subtract(totalNetSalary)`로만 산출. 세목별 합계(taxByType 합)와 일치하지 않을 수 있음(반올림·추가 세금 등). breakdown과 총액 불일치 가능. | `SalaryManagementServiceImpl.getTaxStatistics()` (318행) | 낮음 |

### 1.5 기타

| # | 증상 | 위치 | 심각도 |
|---|------|------|--------|
| 19 | **TaxCalculateRequest.grossAmount 0 허용**: `@DecimalMin("0.0")`로 0 허용. `calculateAdditionalTax`에서 `baseAmount * taxRate`는 0이 되지만, deductions에 0을 더하고 net을 다시 계산하는 것은 논리적으로는 문제 없으나, “0원 기준 추가 세금”이 비즈니스상 의미 있는지 검토 필요. | `TaxCalculateRequest`, `SalaryManagementServiceImpl.calculateAdditionalTax()` | 낮음 |
| 20 | **TaxCalculationUtil과 급여 프로시저 부가세 정의 불일치 가능성**: Util은 “부가세 포함/제외” 변환 로직. 프로시저는 프리랜서 사업자에 대해 `p_gross_salary * 0.10`으로 부가세 산출. 급여 금액이 “공급가”인지 “세 포함”인지에 따라 혼선 가능. | `TaxCalculationUtil`, `ProcessIntegratedSalaryCalculation_standardized.sql` (부가세 블록) | 낮음 |

---

## 2. 개선 제안 목록 (우선순위·core-coder 전달용)

### P0 (보안·데이터 누출·즉시 수정)

- **5, 6**: `getSalaryCalculations(consultantId)`는 `findAll()` 제거하고, **tenantId + consultantId** 조건으로 조회하는 쿼리 추가 후 사용. `getSalaryCalculations(startDate, endDate)`는 **tenantId + status + 기간** 조건의 메서드로 변경(Repository에 `findByTenantIdAndStatusAndCalculationPeriodStartBetween` 등 추가).
- **7**: `getTaxDetails`, `calculateAdditionalTax`에서 `salaryCalculationRepository.findById()` 후 **`calculation.getTenantId()`와 `TenantContextHolder.getRequiredTenantId()` 비교**; 불일치 시 403 또는 404 반환.
- **14**: `ProcessIntegratedSalaryCalculation` 호출 시 **placeholder 12개**로 수정 (`?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?`), OUT 파라미터 인덱스 6~12 일치 확인.

### P1 (로직·일관성·예외)

- **1**: `getBatchStatus()`에서 “해당 월” 급여 계산 조회 시 **기산일 기준 기간**을 `salaryScheduleService.getCalculationPeriod(targetYear, targetMonth)`로 통일하거나, 배치 실행 기간과 상태 조회 기간이 다름을 문서화하고 UI에 표시.
- **2, 17**: 지방소득세(원천징수의 10%)를 프로시저에서 계산 후 `salary_tax_calculations`에 LOCAL_INCOME_TAX로 INSERT; `getTaxStatistics` breakdown은 이미 키 존재하므로 데이터만 채워지면 됨.
- **8**: `getTaxStatistics(period)`에서 `period` 형식(YYYY-MM) 및 월 1~12 검증 추가; 잘못된 형식은 400 + 명확한 메시지.
- **12**: 급여·세금 API의 `catch (Exception e)`에서 **클라이언트에는 일반 메시지**, 상세는 **로그만** 출력하도록 변경. 필요 시 `ERROR_HANDLING_STANDARD.md`의 표준 에러 응답 적용.
- **15**: `getTaxDetails`에서 consultant 접근 전 **consultant 로딩 보장**(fetch join 또는 DTO에 id/name만 담기).
- **16**: `getSalaryStatistics`에서 `getGrossSalary()`, `getNetSalary()` **null-safe** 처리(예: `Optional.ofNullable(calc.getGrossSalary()).orElse(BigDecimal.ZERO)`).

### P2 (엣지·정확도)

- **3**: 정규직 소득세는 구간별 누진 공제 공식 적용 검토(요구사항 확정 후).
- **9**: `startDate > endDate` 시 400 반환.
- **10**: `getConsultantSalarySummary`에서 `consultantId`에 해당하는 User 없으면 빈 목록 또는 404 처리.
- **11**: `getTopPerformers`에서 consultant 접근 시 NPE 방지(로딩 보장 또는 null 체크).
- **18**: 세금 통계에서 totalTaxAmount와 세목별 합계 불일치 시 로깅 또는 별도 필드로 “breakdown 합계” 노출 검토.
- **19, 20**: 비즈니스 정책에 따라 0원 추가 세금 허용 여부, 급여 공급가/세 포함 정의 정리.

### P3 (문서·배치)

- **4**: 4대보험 “연봉” 기준을 월×12로 두는 것을 문서화하고, 필요 시 연간 집계 기반 정책 검토.
- **13**: PL/SQL 실패 시 HTTP 상태 코드를 4xx/5xx로 통일할지 정책 결정 후 반영.

---

## 3. docs/debug/SALARY_TAX_LOGIC_ANALYSIS.md와의 차이·추가 발견

- **세목별 저장**: 분석 문서에는 “표준화 프로시저에 `salary_tax_calculations` INSERT 없음”으로 되어 있으나, **현재 `ProcessIntegratedSalaryCalculation_standardized.sql`에는 WITHHOLDING_TAX, VAT, INCOME_TAX, FOUR_INSURANCE에 대한 INSERT가 구현되어 있음.**  
  - **추가 갭**: 지방소득세(LOCAL_INCOME_TAX) INSERT만 없음.
- **미리보기 tenant_id**: 분석 문서의 “CalculateSalaryPreview 호출 시 tenant_id 미전달” 이슈는 **현재 코드에서 해결됨.** `PlSqlSalaryManagementServiceImpl.calculateSalaryPreview()`에서 4번째 파라미터에 `tenantId` 설정함.
- **POST /api/v1/admin/salary/tax/calculate**: 분석 문서의 “미구현 → 404”는 **현재 구현됨.** `SalaryManagementController.calculateTax()`에서 `TaxCalculateRequest` 받아 `calculateAdditionalTax` 호출.
- **추가 발견(이번 검증)**  
  - **ProcessIntegratedSalaryCalculation** Java 호출의 **placeholder 11개 vs 프로시저 12개** 불일치.  
  - **테넌트 격리 누락**: 상담사별/기간별 급여 조회, 세금 상세·추가 세금에서 tenantId 검증 또는 쿼리 필터 누락.  
  - **getBatchStatus**의 기간 정의(달력월)와 배치 실행 기간(기산일 기준) 불일치.  
  - **getTaxStatistics** period 검증 부족, **getTaxDetails/getSalaryStatistics** NPE 가능 지점.  
  - **정규직 소득세** 단순 비례 적용(누진 미반영), **지방소득세** 미계산·미저장.

---

## 4. 체크리스트 (수정 후 검증)

- [x] 상담사별 급여 조회·기간별 급여 목록이 **현재 테넌트만** 반환하는지. (P0 반영: Repository tenantId 조건 메서드 사용, getConsultantSalarySummary tenantId+consultant 검증)
- [x] 세금 상세·추가 세금 API에서 **다른 테넌트 calculationId** 요청 시 403/404 처리되는지. (P0 반영: getTaxDetails/calculateAdditionalTax에서 tenantId 불일치 시 EntityNotFoundException → 404)
- [x] `ProcessIntegratedSalaryCalculation` 호출 시 placeholder 12개·OUT 인덱스 일치로 **정상 완료·메시지 반환**되는지. (P0 반영: prepareCall 12개 placeholder로 수정)
- [ ] `getTaxStatistics("2025-13")`, `"invalid"` 등 **잘못된 period** 시 400과 명확한 메시지 반환하는지.
- [ ] `getTaxDetails`에서 **consultant null** 없이 조회·응답되는지.
- [ ] `getSalaryStatistics`에서 **gross/net null**인 계산이 있어도 NPE 없이 집계되는지.
- [ ] 배치 상태 조회 기간과 실제 배치 실행 기간이 **문서/UI상 명확**한지(또는 기산일 기준으로 통일).
- [ ] (선택) 지방소득세 프로시저 반영 후 세금 통계 breakdown에 **localIncomeTax** 값이 채워지는지.
