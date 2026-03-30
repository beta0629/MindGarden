# 급여·세금 검증 회의 — 컴포넌트·모듈 관점 검토 결과

**일자**: 2025-03-16  
**담당**: core-component-manager  
**참조**: core-solution-encapsulation-modularization, core-solution-atomic-design

---

## 1. 급여·세금 관련 프론트 컴포넌트·백엔드 모듈 목록

### 1.1 프론트엔드 컴포넌트 (경로·역할)

| 경로 | 역할 | 계층(권장) | 비고 |
|------|------|------------|------|
| `frontend/src/components/erp/SalaryManagement.js` | 급여 관리 페이지 (프로필·계산·기간) | Page | 라우트 `/erp/salary` |
| `frontend/src/components/erp/SalaryManagement.css` | 급여 관리 전용 스타일 | — | |
| `frontend/src/components/erp/SalaryProfileFormModal.js` | 급여 프로필 생성 모달 | Organism (Modal) | |
| `frontend/src/components/erp/SalaryProfileFormModal.css` | 프로필 모달 스타일 | — | |
| `frontend/src/components/erp/SalaryConfigModal.js` | 급여 기산일 설정 모달 | Organism (Modal) | |
| `frontend/src/components/erp/SalaryConfigModal.css` | 기산일 모달 스타일 | — | |
| `frontend/src/components/erp/TaxManagement.js` | 세무 관리 페이지 (구 버전) | Page | **현재 라우트에서 미사용** |
| `frontend/src/components/erp/TaxManagement.css` | 세무 관리 스타일 | — | |
| `frontend/src/components/erp/ImprovedTaxManagement.js` | 세무 관리 페이지 (개선 버전) | Page | 라우트 `/erp/tax` 실제 렌더 |
| `frontend/src/components/common/SalaryPrintComponent.js` | 급여 명세 인쇄용 컴포넌트 | Molecule/Organism | |
| `frontend/src/components/common/SalaryPrintComponent.css` | 인쇄 컴포넌트 스타일 | — | |
| `frontend/src/components/common/SalaryExportModal.js` | 급여 내보내기 모달 | Organism (Modal) | salaryConstants 사용 |
| `frontend/src/components/common/TaxDetailsModal.js` | 세금 상세 모달 | Organism (Modal) | salaryConstants 사용 |
| `frontend/src/constants/salaryConstants.js` | 급여·세금 상수(SALARY_STATUS, TAX_TYPE, SALARY_API_ENDPOINTS 등) | — | **일부만 재사용됨** |
| `frontend/src/components/dashboard-v2/constants/menuItems.js` | LNB 메뉴(급여 관리·세무 관리 링크) | — | `/erp/salary`, `/erp/tax` |
| `frontend/src/components/dashboard/widgets/erp/ErpManagementGridWidget.js` | ERP 위젯(세무 관리 카드 → `/erp/tax`) | — | |
| `frontend/src/components/erp/ErpDashboard.js` | ERP 대시(급여·세무 카드 네비게이션) | — | |
| `frontend/src/utils/commonCodeUtils.js` | `getGradeSalaryMap` 등 급여 관련 유틸 | — | |
| `frontend/src/utils/permissionUtils.js` | `SALARY_MANAGE`, `TAX_MANAGE`, `canManageSalary`, `canManageTax` | — | |
| `frontend/src/styles/unified-design-tokens.css` | `.tax-type-indicator`, `.tax-type-badge` 등 세금 스타일 | — | 디자인 토큰 |

### 1.2 백엔드 모듈 (경로·역할)

| 경로 | 역할 |
|------|------|
| `controller/SalaryManagementController.java` | `@RequestMapping("/api/v1/admin/salary")` — 프로필·계산·세금 상세·통계·PL/SQL 연동 |
| `controller/SalaryConfigController.java` | `@RequestMapping("/api/v1/admin/salary-config")` — 기산일·배치 설정 |
| `controller/SalaryBatchController.java` | `@RequestMapping("/api/v1/admin/salary-batch")` — 월별 급여 배치 실행·상태 |
| `controller/AdminController.java` | `@RequestMapping("/api/v1/admin")` — **GET/POST `/tax/calculations`** (목록·생성만, PUT/DELETE 없음) |
| `service/SalaryManagementService.java` | 급여 프로필·계산·세금 상세·통계·추가 세금 계산 |
| `service/impl/SalaryManagementServiceImpl.java` | 위 구현체 |
| `service/SalaryBatchService.java` | 월별 급여 배치 실행·상태 |
| `service/impl/SalaryBatchServiceImpl.java` | 위 구현체 |
| `service/SalaryScheduleService.java` | 기산일·급여일·배치 실행 가능 시간 |
| `service/impl/SalaryScheduleServiceImpl.java` | 위 구현체 |
| `service/PlSqlSalaryManagementService.java` | PL/SQL 통합 급여 계산·승인·지급·통계·미리보기 |
| `service/impl/PlSqlSalaryManagementServiceImpl.java` | 위 구현체 |
| `entity/ConsultantSalaryProfile.java` | 상담사 급여 프로필 |
| `entity/ConsultantSalaryOption.java` | 급여 옵션 |
| `entity/SalaryCalculation.java` | 급여 계산 결과 |
| `entity/SalaryTaxCalculation.java` | 세목별 세금 계산 |
| `entity/SalaryProfile.java` | (레거시?) 급여 프로필 |
| `repository/ConsultantSalaryProfileRepository.java` | |
| `repository/ConsultantSalaryOptionRepository.java` | |
| `repository/SalaryCalculationRepository.java` | |
| `repository/SalaryTaxCalculationRepository.java` | |
| `repository/SalaryProfileRepository.java` | |
| `dto/TaxCalculateRequest.java` | 추가 세금 계산 요청 DTO |
| `util/TaxCalculationUtil.java` | 부가세 등 세금 계산 유틸(ERP 지출/수입에도 사용) |
| `scheduler/SalaryBatchScheduler.java` | 급여 배치 스케줄러 |

---

## 2. 중복·불일치 항목 목록

### 2.1 중복 페이지·라우트

| 항목 | 설명 | 심각도 |
|------|------|--------|
| **TaxManagement vs ImprovedTaxManagement** | 동일 라우트 `/erp/tax`가 App.js에 **두 번** 정의됨. 411라인 `ImprovedTaxManagement`가 먼저 매칭되어 **TaxManagement는 절대 렌더되지 않음**. TaxManagement.js는 사실상 데드 코드. | 높음 |
| **세금 API 이원화** | **실제 급여·세금 비즈니스 로직**: `SalaryManagementController` — `/api/v1/admin/salary/tax/*` (통계, type별, calculate). **ImprovedTaxManagement가 호출하는 API**: `AdminController` — `/api/v1/admin/tax/calculations` (목록·생성만, 빈/목업 수준). 즉 “세무 관리” 화면은 **Salary 쪽 실데이터와 연결되지 않고**, Admin의 tax/calculations(빈 리스트)만 사용. | 높음 |

### 2.2 API 경로 불일치 (/api/admin vs /api/v1/admin)

| 위치 | 사용 경로 | 표준 | 비고 |
|------|-----------|------|------|
| `SalaryProfileFormModal.js` | `apiPut('/api/admin/consultants/${id}/grade')` | `/api/v1/admin/...` | 레거시 경로 |
| `SalaryProfileFormModal.js` | `apiPost('/api/v1/admin/salary/profiles')` | 일치 | |
| `ImprovedTaxManagement.js` | `apiGet('/api/v1/admin/tax/calculations')` | 일치 | |
| `ImprovedTaxManagement.js` | `apiPost('/api/v1/admin/tax/calculations')` | 일치 | |
| `ImprovedTaxManagement.js` | `apiPut('/api/admin/tax/calculations/${id}')` | `/api/v1/admin/...` | **레거시** + 백엔드에 PUT 없음 |
| `ImprovedTaxManagement.js` | `apiDelete('/api/admin/tax/calculations/${id}')` | `/api/v1/admin/...` | **레거시** + 백엔드에 DELETE 없음 |

### 2.3 상수·엔드포인트 미재사용

| 항목 | 설명 |
|------|------|
| **SALARY_API_ENDPOINTS** | `salaryConstants.js`에 `/api/v1/admin/salary/*` 엔드포인트가 정의되어 있으나, **SalaryManagement.js**는 이를 import하지 않고 문자열 하드코딩으로 API 호출. TaxDetailsModal, SalaryExportModal만 salaryConstants 사용. |
| **SALARY_CSS_CLASSES** | salaryConstants에 정의돼 있으나, 급여 페이지/모달에서 일부만 사용·일관 적용되지 않음. |

### 2.4 백엔드 세금 API 분리

| API | Controller | 비고 |
|-----|------------|------|
| `/api/v1/admin/salary/tax/statistics` | SalaryManagementController | 실데이터(급여 연동 세금 통계) |
| `/api/v1/admin/salary/tax/type/{type}` | SalaryManagementController | 실데이터 |
| `/api/v1/admin/salary/tax/calculate` | SalaryManagementController | 실데이터(추가 세금 계산) |
| `/api/v1/admin/tax/calculations` (GET/POST) | AdminController | 빈 목록/목업 수준, PUT/DELETE 없음 |

ImprovedTaxManagement는 후자(AdminController)만 사용하므로 **실제 급여·세금 데이터와 연동되지 않음**.

---

## 3. 재사용·적재적소 배치 제안

### 3.1 공통 모듈 재사용 (우선순위)

| 우선순위 | 제안 | core-coder 참고 |
|----------|------|-----------------|
| P0 | **salaryConstants.SALARY_API_ENDPOINTS**를 SalaryManagement.js에서 전면 사용하도록 변경. 모든 `/api/v1/admin/salary/*` 호출을 상수 참조로 교체. | `SalaryManagement.js` 내 apiGet/apiPost 호출부를 `SALARY_API_ENDPOINTS`로 치환. |
| P0 | **TaxManagement vs ImprovedTaxManagement 정리**: (1) 실제 서비스는 Salary 쪽 세금 API와 연동할지, Admin tax/calculations를 확장할지 기획 결정. (2) 결정 후 한쪽 페이지만 유지하고, 사용하지 않는 컴포넌트는 제거 또는 deprecated 표시. (3) App.js에서 `/erp/tax` 라우트를 **한 번만** 정의. | App.js 411라인·568–569라인 중복 제거. TaxManagement 제거 시 import 및 569라인 삭제. |
| P1 | **ImprovedTaxManagement** 내 API 경로 통일: `apiPut`/`apiDelete`를 `/api/v1/admin/tax/calculations/{id}`로 변경. 단, 백엔드에 PUT/DELETE가 없으면 AdminController 또는 SalaryManagementController 쪽에 해당 API 추가 후 연동. | ImprovedTaxManagement.js 168, 193라인. 백엔드 API 설계와 동시 진행. |
| P1 | **SalaryProfileFormModal**의 상담사 등급 변경 API를 `/api/v1/admin/...` 표준 경로로 변경. (기존 `/api/admin/consultants/${id}/grade`가 있다면 v1으로 마이그레이션 또는 프록시) | SalaryProfileFormModal.js 227라인. |

### 3.2 적재적소 배치 (아토믹·패키지 구조)

| 구분 | 현재 | 제안 |
|------|------|------|
| **프론트 – 공통 컴포넌트** | SalaryPrintComponent, SalaryExportModal, TaxDetailsModal이 `common/`에 있음. | 유지. common은 재사용 가능한 Molecules/Organisms에 적합. 다만 **UnifiedModal** 사용 여부는 core-solution-unified-modal 스킬에 따라 점검 권장. |
| **프론트 – ERP 도메인** | SalaryManagement, TaxManagement, ImprovedTaxManagement, SalaryConfigModal, SalaryProfileFormModal이 `erp/`에 있음. | ERP 도메인 유지 적절. 세무 페이지가 1개로 정리되면 `erp/` 내 “세무” 관련 파일만 정리. |
| **프론트 – 상수** | `constants/salaryConstants.js`에 급여·세금 상수 일괄 정의. | 유지. 다만 **실제 사용처(SalaryManagement)**에서 import하여 재사용하도록 수정. |
| **백엔드** | 급여·세금이 `consultation` 패키지 내 Controller/Service/Entity/Repository로 일괄 있음. | 구조 유지. 세금 “목록/CRUD”가 확장될 경우 **SalaryManagementController**에 두고, AdminController의 `/tax/calculations`는 제거하거나 Salary 쪽으로 리다이렉트/위임하는 방안 검토. |

### 3.3 중복 제거·일관성 정리 요약

| 항목 | 제안 |
|------|------|
| **페이지 중복** | `/erp/tax`는 **한 컴포넌트만** 노출. ImprovedTaxManagement를 유지할 경우 TaxManagement는 제거 또는 deprecated. 반대로 Salary 연동 세금 UI를 쓰려면 TaxManagement 로직을 ImprovedTaxManagement에 이전하거나, ImprovedTaxManagement를 Salary API(`/api/v1/admin/salary/tax/*`)에 연동. |
| **API 경로** | 프론트 전역 `/api/admin` → `/api/v1/admin` 통일. SalaryProfileFormModal, ImprovedTaxManagement의 PUT/DELETE 경로 및 백엔드 존재 여부 점검. |
| **상수 재사용** | SalaryManagement에서 `salaryConstants`의 SALARY_API_ENDPOINTS, 필요 시 SALARY_CSS_CLASSES/SALARY_MESSAGES 재사용. |

---

## 4. core-coder 전달 시 체크리스트

- [ ] App.js: `/erp/tax` 라우트 단일화, 미사용 TaxManagement import/라우트 제거 여부 결정 반영
- [ ] SalaryManagement.js: `SALARY_API_ENDPOINTS` 등 salaryConstants 사용으로 API 호출 경로 상수화
- [ ] SalaryProfileFormModal.js: 등급 변경 API를 `/api/v1/admin/...`로 변경
- [ ] ImprovedTaxManagement.js: PUT/DELETE 경로를 `/api/v1/admin/tax/calculations/{id}`로 통일; 백엔드 PUT/DELETE 구현 여부 확인
- [ ] 세금 “실데이터” 연동: ImprovedTaxManagement를 `/api/v1/admin/salary/tax/*`와 연동할지, AdminController tax/calculations를 확장할지 기획 결정 후 반영
- [ ] (선택) 급여·세금 모달의 UnifiedModal 사용 여부 점검 (core-solution-unified-modal)

---

## 5. 참조 문서

- 회의 설계: `docs/project-management/SALARY_TAX_VERIFICATION_MEETING_PLAN.md`
- 캡슐화·모듈화: `.cursor/skills/core-solution-encapsulation-modularization/SKILL.md`
- 아토믹 디자인: `.cursor/skills/core-solution-atomic-design/SKILL.md`
- 컴포넌트 구조 표준: `docs/standards/COMPONENT_STRUCTURE_STANDARD.md`
