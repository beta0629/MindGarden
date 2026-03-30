# 급여·세금 로직 검증 및 고도화 회의 결과

**일자**: 2026-02-12  
**참여**: explore, core-debugger, core-component-manager, core-coder, core-tester  
**기획 취합**: core-planner

---

## 1. 급여·세금 로직 검증 결과

| 항목 | 결과 | 비고 |
|------|------|------|
| **계산식** | **수정 필요** | ProcessIntegratedSalaryCalculation placeholder 11개 vs 프로시저 12개 불일치. 지방소득세 INSERT 없음. 4대보험·반올림 등 일부 경계 검증 필요. |
| **기산일** | **추가 확인 필요** | 배치 상태 조회(달력월) vs 배치 실행(기산일) 불일치. getCalculationPeriod·getBaseDate 로직은 구현됨. |
| **원천징수·세목별 저장** | **부분적 맞음** | POST /tax/calculate 구현됨. 원천/부가/소득/4대보험 INSERT 있음. **지방소득세 INSERT만 없음.** |
| **API 일관성** | **수정 필요** | /erp/tax 라우트 중복(ImprovedTaxManagement vs TaxManagement). ImprovedTaxManagement는 /api/v1/admin/tax/calculations(목업) 사용, 실데이터는 /api/v1/admin/salary/tax/*. 프론트 apiGet/apiPost vs StandardizedApi 미통일. |
| **테넌트/권한** | **수정 필요** | 상담사별·기간별 급여 조회에 tenantId 미필터(findAll 후 메모리 필터). 세금 상세/추가 세금에서 calculation 소유 테넌트 미검증. P0 수준 보안 이슈. |

**종합**: **일부 수정 필요.** 로직·API·테넌트 격리에서 P0 이슈가 있어 고도화 전에 수정 권장.

---

## 2. 고도화 필요 여부

| 구분 | 결론 | 우선순위별 개선 항목 |
|------|------|----------------------|
| **정확도** | **필요** | 1. ProcessIntegratedSalaryCalculation 파라미터 12개로 수정 2. 지방소득세 INSERT 추가 3. period/기간 역전 검증, NPE 방지 |
| **성능** | **부분적** | 1. findAll() 제거, tenantId 조건 Repository 메서드로 조회 |
| **UX** | **부분적** | 1. TaxManagement/ImprovedTaxManagement 단일화, 실데이터 API 연동 2. 세금 breakdown 표시와 백엔드 구조 일치 |
| **감사/이력** | **부분적** | 변경 이력·감사 로그는 회의에서 별도 요구 전까지 유지보수 범위로만 검토 |
| **리포트** | **부분적** | 세금 통계·항목별 breakdown 정합성 확보 후 리포트 확장 검토 |

**종합**: 고도화 **필요**. 우선순위: (1) **P0 테넌트 격리·파라미터 불일치 수정** (2) **표준 준수·API/라우트 통일** (3) **테스트 도입** (4) 지방소득세·기간 정의·UX 통일.

---

## 3. 서브에이전트별 보고 요약

- **explore**: 백엔드 Controller/Service/Repository/Entity/PL/SQL, 프론트 SalaryManagement·TaxManagement·ImprovedTaxManagement·모달·상수, API 목록(/api/v1/admin/salary/*, salary-config, salary-batch) 정리. /erp/tax 라우트 중복·세금 API 이원화 가능성 명시.
- **core-debugger**: 문제 20건(높음 4·중 12·낮음 4). tenantId 미필터, calculation 소유 미검증, ProcessIntegratedSalaryCalculation 11 vs 12 파라미터, 기간 불일치, 지방소득세 INSERT 부재 등. P0~P3 개선 제안. `docs/debug/SALARY_TAX_LOGIC_VERIFICATION_REPORT.md`에 상세.
- **core-component-manager**: TaxManagement vs ImprovedTaxManagement 중복, ImprovedTaxManagement가 실데이터(/api/v1/admin/salary/tax/*)와 미연동. API 경로 혼용(/api/admin vs /api/v1/admin). SALARY_API_ENDPOINTS 미전면 사용. `docs/project-management/SALARY_TAX_COMPONENT_MODULE_REVIEW.md`에 제안.
- **core-coder**: 표준 이탈 23건. BaseApiController 미상속, Map 직접 조립, try-catch 예외 처리, 옵션/등급/설정 하드코딩, findAll+메모리 필터(테넌트 격리 위반), apiGet/apiPost→StandardizedApi 미전환, 세금 통계 breakdown 접근 불일치 등. Phase 1~3 수정 방향 제안.
- **core-tester**: 단위·통합·E2E **전무**. TaxCalculationUtil, SalaryScheduleService, SalaryManagementServiceImpl, Controller API, 테넌트 격리·권한·에러 응답 검증 필요. P0→TaxCalculationUtil·기산일 단위+API 통합, P1 서비스·breakdown, P2 PL/SQL·E2E. `고도화 시 반드시 추가할 검증 기준` 정리.

---

## 4. 다음 액션

| 순서 | Phase | 담당 | 작업 내용 |
|------|-------|------|-----------|
| 1 | **P0 보안·버그** | core-coder | tenantId 필터: getSalaryCalculations(consultantId), getSalaryCalculations(start,end), getConsultantSalarySummary, 세금 상세/추가 세금 소유 검증. ProcessIntegratedSalaryCalculation placeholder 12개로 수정. |
| 2 | **표준·API 통일** | core-coder | SalaryManagementController BaseApiController 상속·success/created·예외 위임. getOptionTypes/getGrades/getSalaryConfigs 등 공통코드 조회 전환. Repository tenantId 필수 메서드 추가·기존 비테넌트 퇴출. |
| 3 | **프론트 표준** | core-coder | SalaryManagement, ConsultantProfileModal, SalaryProfileFormModal, TaxManagement → apiGet/apiPost를 StandardizedApi로 전환. SALARY_API_ENDPOINTS 전면 사용. 세금 통계 breakdown 구조 일치. |
| 4 | **라우트·페이지 통일** | core-coder + 기획 | /erp/tax 단일 컴포넌트로 통일(ImprovedTaxManagement 또는 TaxManagement 중 하나), 실데이터 /api/v1/admin/salary/tax/* 연동. 미사용 페이지 제거 또는 deprecated. |
| 5 | **테스트 도입** | core-tester → core-coder | TaxCalculationUtil·SalaryScheduleServiceImpl 단위 테스트. SalaryManagementController 핵심 API 통합 테스트(인증·tenant·권한·200/400/404). |
| 6 | **P1 로직·데이터** | core-coder | 지방소득세 INSERT, getBatchStatus 기간 정의 통일, period 검증, NPE 방지, 예외 메시지 완화. |

---

## 5. 참조 문서

- 회의 설계: `docs/project-management/SALARY_TAX_VERIFICATION_MEETING_PLAN.md`
- 구조 요약: (explore 산출 — 회의 채팅 내 요약)
- 로직·예외 검토: `docs/debug/SALARY_TAX_LOGIC_VERIFICATION_REPORT.md`
- 컴포넌트·모듈 검토: `docs/project-management/SALARY_TAX_COMPONENT_MODULE_REVIEW.md`
- 기존 회의 결과: `docs/project-management/SALARY_TAX_INTEGRATION_MEETING_RESULT.md`
- 구현 위치: `docs/planning/SALARY_TAX_INTEGRATION_LOCATION.md`
- 로직 분석: `docs/debug/SALARY_TAX_LOGIC_ANALYSIS.md`
