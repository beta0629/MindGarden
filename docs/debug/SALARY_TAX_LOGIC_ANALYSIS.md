# 급여·세금 로직 추적 및 갭 분석

**목적**: 급여 계산 로직(기산일·기간·등급·회기·옵션·공제)과 세금 처리 관련 코드·API·DB·외부 연동을 추적하고, 갭·개선 포인트를 정리한다.  
**범위**: MindGarden 코드베이스(백엔드 Java/Spring, 프론트엔드 React, DB 프로시저).  
**역할**: core-debugger — 코드 수정 없이 추적·분석·수정 제안만 수행.

---

## 1. 급여 계산 로직 흐름

### 1.1 기산일·급여 기간

| 구분 | 위치 | 설명 |
|------|------|------|
| **기산일 정의** | `SalaryScheduleServiceImpl.getBaseDate(int year, int month)` | 공통코드 `SALARY_BASE_DATE` / `MONTHLY_BASE_DAY`의 `extra_data.default_day` 사용. `LAST_DAY`면 말일, 숫자면 해당일(초과 시 말일로 보정). 미설정 시 **매월 말일** 기본값. |
| **기산일 저장** | `SalaryConfigController.updateBaseDate()` | `commonCodeService.updateCodeExtraData("SALARY_BASE_DATE", "MONTHLY_BASE_DAY", ...)` 로 기산일 타입 저장. |
| **지급일/마감일** | `SalaryScheduleServiceImpl.getPaymentDate()`, `getCutoffDate()` | 각각 `PAYMENT_DAY`, `CUTOFF_DAY` 공통코드. 지급일은 익월 N일. |
| **계산 기간** | `SalaryScheduleServiceImpl.getCalculationPeriod(int year, int month)` | `[전월 기산일+1일, 당월 기산일]` 반환. 1월이면 전년 12월 기산일+1 ~ 당월 기산일. |

- **프론트**: 기간 선택은 `selectedPeriod`(YYYY-MM)로만 되어 있으며, **기산일 기준 기간**을 보여주거나 선택하는 UI/API는 없음. 사용자가 선택한 월의 1일~말일을 그대로 `periodStart`/`periodEnd`로 사용.
- **배치**: `SalaryBatchServiceImpl.executeMonthlySalaryBatch()` 는 `salaryScheduleService.getCalculationPeriod(targetYear, targetMonth)` 로 **기산일 기준 기간**을 사용.
- **프로시저(월 배치)**: `ProcessMonthlySalaryBatch_standardized.sql` 은 `STR_TO_DATE(CONCAT(p_target_month, '-01'), '%Y-%m-%d')` 와 `LAST_DAY()` 로 **당월 1일~말일(달력 기준)** 사용.  
→ **갭**: Java 배치는 기산일 기준, SQL 월배치 프로시저는 달력월 기준. 두 경로를 혼용하면 기간 불일치 가능.

**참조 파일**
- `src/main/java/com/coresolution/consultation/service/impl/SalaryScheduleServiceImpl.java` (getBaseDate, getCalculationPeriod, getPaymentDate, getCutoffDate)
- `src/main/java/com/coresolution/consultation/controller/SalaryConfigController.java` (updateBaseDate)
- `src/main/java/com/coresolution/consultation/service/impl/SalaryBatchServiceImpl.java` (getCalculationPeriod 사용)
- `database/schema/procedures_standardized/ProcessMonthlySalaryBatch_standardized.sql` (v_period_start, v_period_end)

---

### 1.2 등급(grade)·회기(session) 수 반영

| 구분 | 위치 | 설명 |
|------|------|------|
| **등급 저장** | `users.grade` | 상담사 등급. `ProcessIntegratedSalaryCalculation` 에서만 조회됨. |
| **등급별 요율** | 프로시저 내부 | **표준화 프로시저** (`CalculateSalaryPreview_standardized.sql`, `ProcessIntegratedSalaryCalculation_standardized.sql`): `v_grade_rate DECIMAL(10,2) DEFAULT 30000` 고정. **common_codes `FREELANCE_BASE_RATE` 미사용.** |
| **등급별 요율(레거시)** | `integrated_salary_erp_system.sql`, `salary_management_procedures.sql` | `FREELANCE_BASE_RATE` + `code_value = CONCAT(v_grade, '_RATE')` 로 등급별 요율 조회, 없으면 30000. |
| **회기 수** | 프로시저 | `schedules` 테이블에서 `DATE(s.start_time) BETWEEN p_period_start AND p_period_end` 로 기간 내 스케줄 건수·완료 건수·총 시간 조회. `completed_consultations`(완료 상담 건수)가 회기 수로 사용됨. |

- **프리랜서**: `v_consultation_earnings = v_completed_consultations * v_grade_rate`, `p_gross_salary = v_consultation_earnings`.
- **정규직**: `v_hourly_earnings = v_total_hours * v_hourly_rate`, `p_gross_salary = v_base_salary + v_hourly_earnings`.
- **갭**: 표준화 프로시저는 **등급(users.grade)을 요율에 반영하지 않고 항상 30,000원**. 등급별 단가를 쓰려면 프로시저에 `FREELANCE_BASE_RATE` 조회 로직 추가 필요.

**참조 파일**
- `database/schema/procedures_standardized/ProcessIntegratedSalaryCalculation_standardized.sql` (v_grade 조회, v_grade_rate 미조회)
- `database/schema/procedures_standardized/CalculateSalaryPreview_standardized.sql` (v_grade_rate DEFAULT 30000)
- `src/main/resources/sql/procedures/integrated_salary_erp_system.sql` (FREELANCE_BASE_RATE 조회)
- `src/main/java/com/coresolution/consultation/entity/ConsultantSalaryProfile.java` (grade 없음; users.grade 사용)

---

### 1.3 옵션(수당·공제) 반영

| 구분 | 위치 | 설명 |
|------|------|------|
| **급여 프로필** | `ConsultantSalaryProfile` | `salaryType`, `baseSalary`, `hourlyRate`, `isBusinessRegistered` 등. 수당/공제용 별도 옵션 필드는 없음. |
| **프로시저** | `ProcessIntegratedSalaryCalculation_standardized.sql` | `commission_earnings` = 프리랜서일 때 상담 수당, `bonus_earnings` = **0 고정**. 기타 수당·공제(초과근무, 휴일근무, 별도 공제 등) **미반영**. |
| **컨트롤러 옵션 유형** | `SalaryManagementController.getOptionTypes()` | CONSULTATION, BONUS, OVERTIME, HOLIDAY 반환만 하고, **계산/저장 로직과 연동되지 않음**. |

- **갭**: 옵션 유형은 API로만 제공되고, 실제 급여 계산(프로시저·엔티티)에는 **보너스·초과근무·휴일근무·기타 공제가 반영되지 않음**. 수동 입력 또는 별도 계산 레이어 없음.

**참조 파일**
- `src/main/java/com/coresolution/consultation/entity/ConsultantSalaryProfile.java`
- `database/schema/procedures_standardized/ProcessIntegratedSalaryCalculation_standardized.sql` (commission_earnings, bonus_earnings = 0)
- `src/main/java/com/coresolution/consultation/controller/SalaryManagementController.java` (getOptionTypes)

---

### 1.4 공제(세금·4대보험) 적용 순서 및 위치

- **위치**: 모두 **DB 프로시저 내부**에서만 계산. Java 서비스는 세금 금액을 계산하지 않고, 프로시저 OUT 또는 `salary_calculations.deductions` 만 사용.

**프리랜서**
1. 원천징수 3.3% (`v_withholding_tax`): `p_gross_salary * 0.033`
2. 부가세 10% (`v_vat`): 사업자 등록 시에만 `p_gross_salary * 0.10`

**정규직**
1. 소득세: 소득 구간별 세율(6%~42%) 적용
2. 4대보험: `p_gross_salary * 12 >= 12,000,000` 일 때만 (국민연금 4.5%, 건강 3.545%, 장기요양 0.545%, 고용 0.9%)

- **저장**: `salary_calculations.deductions` 에 **세금 합계만** 저장. 세목별 내역은 `salary_tax_calculations` 에 넣지 않음(아래 세금 섹션 참고).

**참조 파일**
- `database/schema/procedures_standardized/ProcessIntegratedSalaryCalculation_standardized.sql` (세금·공제 블록)
- `database/schema/procedures_standardized/CalculateSalaryPreview_standardized.sql` (동일 로직, 저장 없음)

---

### 1.5 백엔드/프론트/프로시저 역할 분리 현황

| 역할 | 담당 | 비고 |
|------|------|------|
| **기산일·기간** | 백엔드(공통코드 + SalaryScheduleService) | 프론트는 YYYY-MM만 선택, 기산일 기준 기간 미노출 |
| **등급·회기 기반 금액** | 프로시저 전담 | 프리랜서: 완료 건수×요율, 정규직: 기본급+시간당 |
| **세금·공제** | 프로시저 전담 | Java는 계산 없음 |
| **미리보기** | 프로시저 `CalculateSalaryPreview` | 저장 없음, OUT만 반환 |
| **실제 계산·저장** | 프로시저 `ProcessIntegratedSalaryCalculation` | `salary_calculations` INSERT |
| **통계/요약** | 백엔드 `SalaryManagementServiceImpl` | JPA로 `salary_calculations` 조회·집계 |
| **세금 통계/상세** | 백엔드 `getTaxStatistics`, `getTaxDetails` | `salary_calculations.deductions` 및 `salary_tax_calculations` 조회(후자는 미입력 갭 있음) |

- **중복 계산**: 프론트엔드는 급여·세금을 **직접 계산하지 않음**. 미리보기·목록 모두 백엔드/프로시저 결과만 표시. 단, **미리보기**와 **실제 배치 계산**이 동일 프로시저 로직을 쓰지만, 미리보기는 `CalculateSalaryPreview`, 배치는 `ProcessIntegratedSalaryCalculation` 로 **프로시저가 둘**이라, 한쪽만 수정 시 불일치 가능.

---

## 2. 세금 처리 관련 코드·API·DB·외부 연동

### 2.1 세금 계산·저장

- **계산**: 프로시저 내부에서만 수행. 원천징수/부가세/소득세/4대보험 금액을 합산해 `p_tax_amount` 로 반환하고, `salary_calculations.deductions` 에만 저장.
- **세목별 저장**: **현재 표준화 프로시저에는 `salary_tax_calculations` INSERT 가 없음.**  
  → `SalaryTaxCalculation` 엔티티·리포지토리는 존재하지만, **실제 계산 경로(ProcessIntegratedSalaryCalculation, CalculateSalaryPreview)에서 한 건도 INSERT 하지 않음.**  
  → 과거 백업 등에서 `salary_tax_calculations` 에 데이터가 있었던 흔적은 있으나, 현재 운영 코드에서는 **세목별 상세가 쌓이지 않음**.

### 2.2 SalaryTaxCalculation 엔티티·Repository 사용처

| 사용처 | 파일 | 용도 |
|--------|------|------|
| **조회** | `SalaryManagementServiceImpl.getTaxDetails(Long calculationId)` | `salaryTaxCalculationRepository.findByCalculationIdOrderByCreatedAtDesc(calculationId)` 로 세목별 목록 반환. **데이터가 없으면 빈 목록.** |
| **저장** | (없음) | 프로시저·Java 서비스 모두 INSERT 미구현. |

- **갭**: 세금 상세 화면/API는 `salary_tax_calculations` 를 읽지만, **어디서도 이 테이블에 쓰지 않아** 상세 내역이 항상 비어 있을 수 있음. 세금 통계는 `getTaxStatistics` 에서 `salary_calculations` 의 gross/net 차이로 총 세금만 산출.

### 2.3 세금 관련 API

| API | 메서드 | 컨트롤러/서비스 | 비고 |
|-----|--------|-----------------|------|
| `/api/v1/admin/salary/tax/{calculationId}` | GET | `SalaryManagementController.getTaxDetails` → `SalaryManagementService.getTaxDetails` | 세목별 상세. `salary_tax_calculations` 조회. |
| `/api/v1/admin/salary/tax/statistics?period=` | GET | `SalaryManagementController.getTaxStatistics` → `SalaryManagementService.getTaxStatistics` | 기간별 총 급여/세금 등. `salary_calculations` 기반. |
| `/api/v1/admin/salary/tax/calculate` | POST | **미구현** | TaxManagement.js 에서 호출하나, **백엔드에 해당 엔드포인트 없음** → 404. |

### 2.4 외부 연동

- **세금 신고·연말정산·국세청 등 외부 시스템 연동 코드 없음.**  
- ERP 연동: 급여 지급 시 `ApproveSalaryWithErpSync`, `ProcessSalaryPaymentWithErpSync` 등으로 거래 생성은 있으나, **세금 신고/원천징수 신고 전용 연동은 없음.**

---

## 3. 갭·개선 포인트 요약

### 3.1 수동 단계(사용자 직접 입력/선택)

- **기간 선택**: 사용자가 YYYY-MM만 선택. 기산일 기준 “실제 계산 기간”은 화면에 안 나오고, 배치와 불일치 가능.
- **등급별 요율**: 공통코드 `FREELANCE_BASE_RATE` 에 등급별 단가를 넣어도, **표준화 프로시저는 사용하지 않음** → 전부 30,000원으로만 계산.
- **보너스·초과근무·휴일·기타 공제**: 옵션 유형 API만 있고, 계산·저장 로직 없음 → 수동 반영 불가.
- **추가 세금 계산**: 프론트에서 `POST /api/v1/admin/salary/tax/calculate` 호출하지만 **엔드포인트 없음** → 수동 계산/입력 기능도 없음.

### 3.2 중복·불일치 가능 지점

- **미리보기 vs 실제 계산**: `CalculateSalaryPreview` vs `ProcessIntegratedSalaryCalculation` — 로직이 두 프로시저에 각각 있음. 세율·공제 정책 변경 시 둘 다 수정 필요.
- **기간 정의**: Java 배치는 `getCalculationPeriod()`(기산일 기준), `ProcessMonthlySalaryBatch` 프로시저는 달력월(1일~말일) → 동일 “월”이라도 기간이 다를 수 있음.
- **프론트 API 경로**: 일부는 `/api/v1/admin/salary/*`, 일부는 `/api/admin/salary/*`. 컨트롤러는 `@RequestMapping("/api/v1/admin/salary")` 이므로 `/api/admin/...` 호출은 404 가능.

### 3.3 세금 미연동·연말정산 갭

- **세목별 저장 미구현**: `salary_tax_calculations` 에 프로시저/서비스에서 INSERT 하지 않음 → 세금 상세 화면 항상 빈 목록 가능.
- **원천징수·연말정산**: 국세청/지방세 신고, 연말정산 산입 등 **외부 연동 없음**.
- **추가 세금 API 없음**: TaxManagement “추가 세금 계산” 버튼 → `POST /api/v1/admin/salary/tax/calculate` 404.

### 3.4 기타(버그·파라미터 불일치)

- **CalculateSalaryPreview 호출 시 tenant_id 미전달**:  
  - 프로시저: `IN p_tenant_id VARCHAR(100)` 가 4번째 파라미터.  
  - `PlSqlSalaryManagementServiceImpl.calculateSalaryPreview()`: 4번째 파라미터를 `registerOutParameter(4, ...)` 로 OUT으로만 등록하고, **IN으로 tenant_id를 set 하지 않음.**  
  → 프로시저는 `p_tenant_id` 가 NULL 이면 “테넌트 ID는 필수입니다.” 로 실패. **미리보기가 멀티테넌트 환경에서 실패할 수 있음.**

**참조**
- `src/main/java/com/coresolution/consultation/service/impl/PlSqlSalaryManagementServiceImpl.java` (calculateSalaryPreview: setLong(1), setDate(2), setDate(3) 까지만 설정, 4번째 IN 없음)
- `database/schema/procedures_standardized/CalculateSalaryPreview_standardized.sql` (시그니처 4번째 IN p_tenant_id)

---

## 4. core-coder 참고용 수정 포인트(파일·메서드·엔드포인트)

- **기산일 기준 기간 노출/일치**  
  - 프론트: 선택 월에 대한 “실제 계산 기간”을 `SalaryScheduleService.getCalculationPeriod` 또는 동일 로직 API로 조회해 표시.  
  - 배치/프로시저: `ProcessMonthlySalaryBatch` 호출 시 기간을 Java에서 기산일 기준으로 계산해 넘기거나, 프로시저 내부도 기산일 기준으로 통일 검토.

- **등급별 요율**  
  - `ProcessIntegratedSalaryCalculation_standardized.sql`, `CalculateSalaryPreview_standardized.sql` 에서 `users.grade` 로 `common_codes` (`FREELANCE_BASE_RATE`, code_value = `{grade}_RATE`) 조회 후 `v_grade_rate` 설정. 없을 때만 30000 기본값.

- **세목별 세금 저장**  
  - `ProcessIntegratedSalaryCalculation` 프로시저에서 `p_tax_amount` 계산 후, 원천징수/부가세/소득세/4대보험 등 세목별 금액을 `salary_tax_calculations` 에 INSERT.  
  - 또는 프로시저 반환 후 Java에서 `SalaryTaxCalculation` 엔티티로 저장(프로시저 OUT으로 세목별 금액 추가 필요).

- **미리보기 tenant_id**  
  - `PlSqlSalaryManagementServiceImpl.calculateSalaryPreview()`: 4번째 파라미터에 `TenantContextHolder.getRequiredTenantId()` 를 `stmt.setString(4, tenantId)` 로 설정. OUT 파라미터 인덱스를 5~10으로 밀어서 등록.

- **추가 세금 계산 API**  
  - `SalaryManagementController` 에 `POST /api/v1/admin/salary/tax/calculate` 추가.  
  - Request body: calculationId, grossAmount, taxType, taxRate 등.  
  - 서비스에서 `SalaryTaxCalculation` 생성·저장 및 필요 시 `salary_calculations.deductions` 반영 방식 정의.

- **프론트 API 경로 통일**  
  - `SalaryManagement.js`, `TaxManagement.js`, `TaxDetailsModal.js`, `ConsultantProfileModal.js`, `SalaryConstants.js` 등에서 `/api/admin/salary/*` → `/api/v1/admin/salary/*` 로 통일(또는 서버에서 리다이렉트/프록시).

- **옵션(보너스·초과근무 등)**  
  - 요구사항 확정 후, 프로시저/엔티티에 반영할 필드 추가 및 `ProcessIntegratedSalaryCalculation`/미리보기 로직에 가산/공제 반영.

---

## 5. 체크리스트(수정 후 검증)

- [ ] 급여 미리보기 호출 시 해당 테넌트로 정상 계산되는지(tenant_id 전달 여부).
- [ ] 선택 월과 “실제 계산 기간”(기산일 기준)이 화면/배치/프로시저에서 일치하는지.
- [ ] 등급별 요율 변경 시 프리랜서 급여에 반영되는지.
- [ ] 세금 상세 조회 시 `salary_tax_calculations` 에 데이터가 쌓이는지.
- [ ] `POST /api/v1/admin/salary/tax/calculate` 호출 시 200 및 세금 반영 여부.
- [ ] `/api/admin/salary/*` 호출이 의도한 대로 동작하는지(경로 통일 또는 라우팅 확인).
