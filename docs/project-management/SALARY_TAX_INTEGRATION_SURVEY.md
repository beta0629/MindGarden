# 급여·세금 통합 조사 (급여 계산·프로필·세금 관리)

**목적**: 급여 계산·급여 프로필·세금 관리 관련 컴포넌트·API·상태 흐름을 조사하고, 수동 입력 구간·자동 계산 구간·세금 연동 위치를 정리한다.  
**범위**: 프론트엔드(화면·상태), 백엔드(Controller·Service·Entity), DB(테이블·프로시저), 세금(계산·공제·신고).  
**산출**: 조사·정리·제안만 수행(코드 수정 없음).  
**참조**: `core-solution-encapsulation-modularization`, `core-solution-atomic-design`, MindGarden 멀티테넌트, AdminCommonLayout 전제.

---

## 1. 급여·세금 관련 컴포넌트·API·엔티티·화면 목록 (역할별)

### 1.1 프론트엔드 컴포넌트

| 컴포넌트 | 경로 | 역할 |
|----------|------|------|
| **SalaryManagement** | `frontend/src/components/erp/SalaryManagement.js` | 급여 관리 메인 페이지. 라우트 `/erp/salary`. 탭: 급여 프로필 / 급여 계산 / 세금 관리. 기간·상담사·급여지급일 선택, 급여 계산 실행, 프로필 그리드, 계산 내역, 세금 통계 표시. |
| **SalaryConfigModal** | `frontend/src/components/erp/SalaryConfigModal.js` | 급여 기산일·지급일·마감일·배치주기·계산방식 설정 모달. `/api/v1/admin/salary/configs`, `/config-options`, POST `/config` 호출. |
| **SalaryProfileFormModal** | `frontend/src/components/erp/SalaryProfileFormModal.js` | 급여 프로필 생성/편집 모달. 등급·급여유형·기본급·사업자등록·옵션(타입·금액·이름) 입력. 등급 변경 시 기본급·옵션 자동 반영. POST `/api/v1/admin/salary/profiles`. |
| **SalaryPrintComponent** | `frontend/src/components/common/SalaryPrintComponent.js` | 급여 계산서 인쇄용 뷰. PrintComponent 래핑, 기본급·옵션·총급여·원천징수·실지급액·계산상세 표시. |
| **SalaryExportModal** | `frontend/src/components/common/SalaryExportModal.js` | 급여 출력 모달. PDF/Excel/CSV 선택, 세금·계산상세 포함 여부, 이메일 발송 옵션. POST `/api/admin/salary/export/{format}`. |
| **TaxDetailsModal** | `frontend/src/components/common/TaxDetailsModal.js` | 세금 내역 상세 모달. GET `/api/admin/salary/tax/{calculationId}` → taxDetails 테이블(세금유형·세율·과세표준·세액·설명). |
| **TaxManagement** | `frontend/src/components/erp/TaxManagement.js` | 세금 관리 전용 페이지. 탭: 세금 통계 / 세금 내역 / 추가 세금. GET `/api/admin/salary/tax/statistics`, `/api/admin/salary/tax/type/{taxType}`, POST `/api/v1/admin/salary/tax/calculate`. |
| **ConsultantProfileModal** | `frontend/src/components/erp/ConsultantProfileModal.js` | 상담사 프로필·급여 프로필 조회/편집. GET `/api/admin/salary/profiles/{consultantId}`, `/api/v1/admin/salary/option-types`, `/grades`, `/codes`, POST `/api/v1/admin/salary/profiles`. |

- **상수**: `frontend/src/constants/salaryConstants.js` — SALARY_STATUS, TAX_TYPE, SALARY_API_ENDPOINTS 등 (엔드포인트는 `/api/admin/salary/*` 기준으로 정의됨).

### 1.2 백엔드 API·컨트롤러

| 컨트롤러 | 베이스 경로 | 주요 API (메서드·경로) | 비고 |
|----------|-------------|------------------------|------|
| **SalaryManagementController** | `/api/v1/admin/salary` | GET `/profiles`, `/profiles/{consultantId}`, `/consultants`, `/calculations/{consultantId}`, `/tax/{calculationId}`, `/tax/statistics`, `/statistics`, `/calculations`, `/option-types`, `/grades`, `/codes`, `/configs`, `/config-options`; POST `/calculate`, `/approve/{id}`, `/pay/{id}`, `/config` | 세션·권한 체크, PL/SQL 서비스 호출(calculate·approve·pay·statistics). |
| **SalaryConfigController** | `/api/v1/admin/salary-config` | GET `/settings`; PUT `/base-date`, `/calculation-method`, `/execute-batch` | 기산일·계산방식·배치 실행. SalaryConfigModal은 **salary** 쪽 `/configs`, `/config` 사용. |

- **급여 계산 미리보기**: POST `/api/v1/admin/salary/calculate` (consultantId, periodStart, periodEnd) → `PlSqlSalaryManagementService.calculateSalaryPreview()` → DB `CalculateSalaryPreview` 프로시저.
- **세금 상세**: GET `/api/v1/admin/salary/tax/{calculationId}` → `SalaryManagementService.getTaxDetails()` → `SalaryTaxCalculationRepository.findByCalculationIdOrderByCreatedAtDesc` → taxDetails.
- **세금 통계**: GET `/api/v1/admin/salary/tax/statistics?period=YYYY-MM` → `SalaryManagementService.getTaxStatistics(period)` → 기간 내 SalaryCalculation 집계(totalGrossSalary, totalNetSalary, totalTaxAmount 등). **원천징수/지방소득세/부가세/4대보험 항목별 집계는 미제공**(갭).

### 1.3 백엔드 서비스·유틸

| 서비스/유틸 | 경로 | 역할 |
|-------------|------|------|
| **SalaryManagementService** | `service/SalaryManagementService.java` + `impl/SalaryManagementServiceImpl` | 프로필 CRUD, 상담사 목록, 급여 계산 목록, 세금 상세/통계. 실제 급여 계산은 `UnsupportedOperationException` → PL/SQL 사용. |
| **PlSqlSalaryManagementService** | `service/PlSqlSalaryManagementService.java` + `impl/PlSqlSalaryManagementServiceImpl` | `processIntegratedSalaryCalculation`, `approveSalaryWithErpSync`, `processSalaryPaymentWithErpSync`, `getIntegratedSalaryStatistics`, `calculateSalaryPreview`. DB 프로시저 호출. |
| **TaxCalculationUtil** | `util/TaxCalculationUtil.java` | **부가세(VAT) 전용**. 10% 부가세 포함/제외 금액 계산, 결제/지출용 TaxCalculationResult. 원천징수·소득세 계산 없음. |
| **SalaryBatchService** | `service/SalaryBatchService.java` + `impl/SalaryBatchServiceImpl` | 월별 급여 배치 실행. |
| **SalaryScheduleService** | `service/SalaryScheduleService.java` + `impl/SalaryScheduleServiceImpl` | 기산일·지급일·마감일 조회, 배치 실행 가능 시간 판단. |

### 1.4 엔티티

| 엔티티 | 테이블 | 역할 |
|--------|--------|------|
| **ConsultantSalaryProfile** | `consultant_salary_profiles` | 상담사별 급여 프로필. consultantId, salaryType, baseSalary, hourlyRate, 사업자등록·사업자번호·사업자명, contractTerms, paymentCycle, tenantId. |
| **SalaryProfile** | `salary_profiles` | 레거시용 급여 프로필(profileName, baseSalary, hourlyRate, commissionRate, bonusRate 등). 현재 상담사 단위는 ConsultantSalaryProfile 사용. |
| **ConsultantSalaryOption** | (옵션 테이블) | 상담사별 급여 옵션(타입·금액 등). |
| **SalaryCalculation** | `salary_calculations` | 급여 계산 결과. consultant, salaryProfile, calculationPeriodStart/End, baseSalary, totalHoursWorked, hourlyEarnings, completedConsultations, commissionEarnings, bonusEarnings, deductions, grossSalary, netSalary, totalSalary, status(PENDING/CALCULATED/APPROVED/PAID/CANCELLED), calculatedAt, approvedAt, paidAt. |
| **SalaryTaxCalculation** | `salary_tax_calculations` | 급여별 세금 내역. calculationId, taxType, taxName, taxRate, baseAmount, taxableAmount, taxAmount, description, calculationDetails. |

### 1.5 DB·프로시저

| 프로시저/파일 | 위치 | 역할 |
|---------------|------|------|
| **CalculateSalaryPreview** | `database/schema/procedures_standardized/CalculateSalaryPreview_standardized.sql` | 급여 미리보기(저장 없음). IN: consultant_id, period_start, period_end, tenant_id. OUT: success, message, gross_salary, net_salary, tax_amount, consultation_count. 원천징수 3.3%, 부가세 10%, 4대보험 변수 정의. |
| **ProcessIntegratedSalaryCalculation** | `ProcessIntegratedSalaryCalculation_standardized.sql` | 통합 급여 계산(저장). IN: consultant_id, period_start, period_end, tenant_id, triggered_by. OUT: calculation_id, gross_salary, net_salary, tax_amount, erp_sync_id, success, message. |
| **ApproveSalaryWithErpSync** | `ApproveSalaryWithErpSync_standardized.sql` | 급여 승인 + ERP 동기화. |
| **ProcessSalaryPaymentWithErpSync** | `ProcessSalaryPaymentWithErpSync_standardized.sql` | 급여 지급 처리 + ERP 동기화. |
| **GetIntegratedSalaryStatistics** | `GetIntegratedSalaryStatistics_standardized.sql` | 기간별 급여 통계. IN: tenant_id, start_date, end_date. OUT: success, message, total_calculations, total_gross/net_salary, total_tax_amount, average_salary, erp_sync_success_rate. |
| **ProcessMonthlySalaryBatch** | `ProcessMonthlySalaryBatch_standardized.sql` | 월별 급여 배치. |
| **salary_management_procedures.sql** | `src/main/resources/sql/procedures/salary_management_procedures.sql` | 레거시 CalculateConsultantSalary 등. 세금 변수: 원천징수 3.3%, 지방소득세 0.33%, 부가세 10%, 4대보험 비율 정의. |

---

## 2. 데이터/상태 흐름 요약

### 2.1 사용자 입력 → API → 계산 → 저장/표시 (급여)

1. **프로필 작성**  
   사용자: SalaryProfileFormModal에서 상담사 선택·등급·급여유형·기본급·사업자등록·옵션 입력 → POST `/api/v1/admin/salary/profiles` → `SalaryManagementServiceImpl.createSalaryProfile()` → DB `consultant_salary_profiles` 저장.
2. **급여 계산 실행(미리보기)**  
   사용자: SalaryManagement에서 기간·상담사 선택 후 "급여 계산 실행" → POST `/api/admin/salary/calculate` (참고: 상수/일부 호출은 `/api/admin/` 사용) → Controller는 `/api/v1/admin/salary`에 매핑되어 있으므로 **프록시/rewrite가 /api/admin → /api/v1/admin 매핑이 아니면 경로 불일치 가능** → `PlSqlSalaryManagementServiceImpl.calculateSalaryPreview()` → DB `CalculateSalaryPreview` → grossSalary, netSalary, taxAmount, consultationCount 반환 → 화면에 미리보기 카드 표시.
3. **실제 급여 계산(저장)**  
   배치: `SalaryBatchScheduler` 또는 수동 배치 실행 시 `ProcessIntegratedSalaryCalculation` 등 프로시저 호출 → `salary_calculations` 저장, 필요 시 `salary_tax_calculations` 생성.
4. **급여 계산 내역 조회**  
   GET `/api/admin/salary/calculations/{consultantId}` → `SalaryManagementServiceImpl.getSalaryCalculations(consultantId)` → SalaryCalculation 리스트를 DTO로 변환(optionSalary, taxAmount 등) → 화면 카드 목록.
5. **세금 통계 조회**  
   GET `/api/admin/salary/tax/statistics?period=YYYY-MM` → `SalaryManagementServiceImpl.getTaxStatistics(period)` → 해당 월 SalaryCalculation 집계(totalTaxAmount = totalGrossSalary - totalNetSalary 등). **항목별(원천징수/지방소득세/부가세/4대보험) 집계는 없음** → 프론트는 taxStatistics.withholdingTax, localIncomeTax, vat, nationalPension 등이 있으면 표시하는데, 현재 백엔드는 이 필드들을 채우지 않음(갭).

### 2.2 세금 관련 흐름

- **세금 상세(건별)**  
  GET `/api/admin/salary/tax/{calculationId}` → `getTaxDetails()` → `salary_tax_calculations` 목록 → TaxDetailsModal에 테이블 표시.
- **세금 통계(기간)**  
  위와 동일. 항목별 breakdown 없음.
- **추가 세금 계산**  
  TaxManagement "추가 세금" 탭에서 calculationId, grossAmount, taxType, taxRate 입력 → POST `/api/v1/admin/salary/tax/calculate`. **해당 엔드포인트는 SalaryManagementController에 없음** → 미구현 또는 별도 컨트롤러 존재 여부 확인 필요(갭).
- **자동 세금 계산**  
  DB 프로시저(CalculateSalaryPreview, CalculateConsultantSalary 등) 내부에서 원천징수 3.3%, 부가세(사업자 등록 시) 10% 등 적용. 4대보험 비율은 프로시저에 변수로 있으나, 실제 적용 로직은 프로시저 구현에 따름.

---

## 3. 수동 입력이 많은 구간 vs 자동 계산(이미/가능) 구간

### 3.1 수동 입력이 많은 구간

| 구간 | 설명 |
|------|------|
| **급여 프로필** | 등급·급여유형·기본급·계약조건·사업자등록여부·사업자번호·사업자명·옵션(타입·금액·이름) 전부 사용자 입력. 등급 변경 시 기본급·옵션은 **자동 보정**되나, 나머지는 수동. |
| **기간·상담사·급여지급일** | 매번 기간 선택(현재 2025-01~2025-09 하드코딩), 상담사 선택, 급여 지급일 선택. |
| **급여 설정** | SalaryConfigModal: 월급여 기산일·지급일·마감일·배치주기·계산방식 사용자 선택. |
| **세금 통계** | 기간 선택 후 "세금 통계 조회" 버튼 클릭 필요. |
| **추가 세금(TaxManagement)** | 급여 계산 ID·총 급여액·세금 유형·세율 직접 입력. (API 미구현 시 화면만 있음.) |
| **출력/이메일** | SalaryExportModal: 형식·세금/계산상세 포함 여부·이메일 발송·주소 입력. |

### 3.2 자동 계산이 이미 되거나 가능한 구간

| 구간 | 설명 |
|------|------|
| **등급별 기본급·옵션** | SalaryProfileFormModal: 등급 변경 시 `getGradeBaseSalary`, `getGradeOptions`로 기본급·옵션 금액 자동 반영. 공통코드 CONSULTANT_GRADE, extraData 기반. |
| **급여 미리보기** | 상담사·기간 선택 후 "급여 계산 실행" → DB `CalculateSalaryPreview`가 상담 완료 건수·프로필 기반으로 총급여·세금·실지급액 계산. (저장 안 함.) |
| **실제 급여 계산** | 배치/프로시저가 상담 실적·프로필 기반으로 계산 후 저장. |
| **세금(원천징수·부가세)** | 프로시저 내부에서 3.3% 원천징수, 사업자 등록 시 10% 부가세 적용. TaxCalculationUtil은 부가세 전용 유틸. |
| **세금 상세(건별)** | SalaryTaxCalculation 테이블에 이미 저장된 건은 getTaxDetails()로 조회 가능. |
| **기간 목록** | 현재 연/월이 하드코딩. **자동화 가능**: 최근 12개월 등 동적 생성. |

### 3.3 자동화 권장(단순 제안)

- 기간 선택: 최근 N개월/당월 기준 동적 옵션.
- 세금 통계: 기간 선택 시 자동 조회(탭 전환 시 한 번만)로 버튼 클릭 감소.
- 프로필 기본값: 급여유형·계약조건 등 템플릿 또는 이전 프로필 복사.

---

## 4. 세금 관련 API·화면·DB 위치와 연동 여부

### 4.1 세금 관련 위치 정리

| 구분 | 위치 | 비고 |
|------|------|------|
| **API** | GET `/api/v1/admin/salary/tax/{calculationId}` (세금 상세), GET `/api/v1/admin/salary/tax/statistics?period=` (세금 통계). POST `/api/v1/admin/salary/tax/calculate` (추가 세금) — **컨트롤러에 없음**. | |
| **화면** | SalaryManagement "세금 관리" 탭: 세금 통계 카드(총 세금액, 건수, 원천징수/지방소득세/부가세/4대보험 breakdown). TaxDetailsModal: 건별 세금 테이블. TaxManagement: 통계·내역·추가 세금 탭. (실제 라우트 `/erp/tax`는 ImprovedTaxManagement 사용 중일 수 있음.) | |
| **DB** | `salary_tax_calculations`: 건별 세금 내역. 프로시저 내: 원천징수 3.3%, 지방소득세 0.33%, 부가세 10%, 4대보험 비율 변수. | |
| **백엔드 로직** | TaxCalculationUtil: 부가세 10% 계산만. 원천징수·소득세·4대보험 계산은 프로시저 또는 별도 서비스. getTaxStatistics: totalTaxAmount 등만 반환, 항목별 미제공. | |

### 4.2 연동 여부

| 항목 | 있음/없음 | 설명 |
|------|-----------|------|
| **내부 세금 계산** | 있음 | DB 프로시저에서 원천징수·부가세(사업자 시) 적용. SalaryTaxCalculation 저장은 프로시저/배치 구현에 따름. |
| **세금 통계 항목별** | 없음(갭) | getTaxStatistics가 withholdingTax, localIncomeTax, vat, nationalPension 등 breakdown 미반환. 화면은 해당 필드 있으면 표시하는 구조. |
| **추가 세금 계산 API** | 없음(갭) | POST `/api/v1/admin/salary/tax/calculate` 호출부는 있으나, SalaryManagementController에 해당 메서드 없음. |
| **외부 세금/신고 연동** | 없음 | 국세청·지방세·4대보험 신고 API 연동 코드 없음. ERP 동기화(급여 승인/지급)는 ApproveSalaryWithErpSync, ProcessSalaryPaymentWithErpSync로 존재. |

---

## 5. API 경로 불일치 정리

- **프론트**: 일부 `/api/v1/admin/salary/*` (consultants, profiles, configs, config, config-options, profiles POST), 일부 `/api/admin/salary/*` (calculate, calculations/{id}, tax/statistics, tax/{id}, export/{format}).
- **백엔드**: SalaryManagementController 기준 모두 `/api/v1/admin/salary` 하위.
- **상수**: `salaryConstants.js`의 SALARY_API_ENDPOINTS는 `/api/admin/salary` 기준.
- **제안**: 프론트 전역을 `/api/v1/admin/salary`로 통일하거나, 리버스 프록시에서 `/api/admin` → `/api/v1/admin` 매핑 여부 확인 후 문서화. 통일 시 상수·각 컴포넌트 호출 경로 일치시키는 것이 좋음.

---

## 6. 컴포넌트 중복·적재적소 배치 관점 제안 (선택)

- **모달**  
  SalaryConfigModal, SalaryProfileFormModal, SalaryExportModal, TaxDetailsModal: 모두 ERP/급여 맥락에서 사용. `common/`에 있는 TaxDetailsModal, SalaryExportModal, SalaryPrintComponent는 급여·세금 전용이므로 `erp/` 하위로 옮기면 도메인 응집도 상승. 단, 다른 메뉴에서도 재사용할 계획이면 common 유지.
- **세금 화면**  
  TaxManagement와 SalaryManagement "세금 관리" 탭이 유사(세금 통계 조회). ImprovedTaxManagement가 실제 `/erp/tax`에 배정된 경우, TaxManagement와의 역할 중복·통합 여부 검토.
- **상수·엔드포인트**  
  salaryConstants.js의 API 경로를 `/api/v1/admin/salary` 기준으로 맞추고, ajax 래퍼나 env 기반 baseURL과 함께 한 곳에서만 관리하면 유지보수에 유리.
- **아토믹 계층**  
  SalaryManagement는 페이지; 필터 블록·탭·카드 그리드를 molecules/organisms로 쪼개면 재사용·테스트에 유리. (현재는 한 파일 내 섹션 단위.)

---

## 7. 참조 문서·스킬

- `.cursor/skills/core-solution-encapsulation-modularization/SKILL.md`
- `.cursor/skills/core-solution-atomic-design/SKILL.md`
- `docs/project-management/SALARY_MANAGEMENT_RENEWAL_SURVEY.md`
- `docs/project-management/SALARY_MANAGEMENT_RENEWAL_SPEC.md`
- `docs/design-system/SALARY_MANAGEMENT_LAYOUT_DESIGN.md`, `SALARY_MANAGEMENT_ATOMIC_MARKUP.md`
