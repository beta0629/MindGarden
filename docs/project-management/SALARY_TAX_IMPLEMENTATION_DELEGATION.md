# 급여·세금 고도화 — 구현 위임 분배실행 표

**작성일**: 2026-03-16  
**담당**: core-planner  
**목적**: 급여·세금 고도화 구현을 서브에이전트에 위임하기 위한 Phase별 담당·전달 프롬프트 정리. 기획은 분배만 하며 직접 코드·설계 작성하지 않음.

**참조**:
- 회의 결과: `docs/project-management/SALARY_TAX_VERIFICATION_MEETING_RESULT.md` (§4 다음 액션)
- 로직 검증: `docs/debug/SALARY_TAX_LOGIC_VERIFICATION_REPORT.md` (P0~P3)
- 컴포넌트 검토: `docs/project-management/SALARY_TAX_COMPONENT_MODULE_REVIEW.md`
- 화면 설계: `docs/design-system/SCREEN_SPEC_SALARY_TAX_ENHANCEMENT.md`
- 마크업: `docs/design-system/SALARY_TAX_ENHANCEMENT_MARKUP.md`
- 기획 스킬: `.cursor/skills/core-solution-planning/SKILL.md` §3.1

---

## 1. 목표·범위

| 항목 | 내용 |
|------|------|
| **목표** | 급여·세금 영역의 P0 보안·버그 수정, 백엔드/프론트 표준 준수, 라우트·페이지 통일, 화면 고도화(디자이너·퍼블리셔 스펙 반영), 테스트 도입, P1 로직·데이터 개선을 단계별로 수행. |
| **범위** | 포함: SalaryManagementController·ServiceImpl·Repository, PlSqlSalaryManagementServiceImpl, SalaryManagement·TaxManagement·ImprovedTaxManagement·ConsultantProfileModal·SalaryProfileFormModal, salaryConstants, /erp/salary·/erp/tax 라우트, ProcessIntegratedSalaryCalculation 프로시저·Java 호출부. 제외: 정규직 누진 소득세(요구사항 확정 후 별도), 감사 로그 확장. |
| **의존성** | P0 완료 후 표준·API 통일 → 프론트 표준 → 라우트·페이지 통일 → 화면 고도화 → 테스트 도입. P1 로직은 테스트 도입과 병렬 가능(의존성 없음). |

---

## 2. Phase 순서 및 담당 요약

| Phase | 명칭 | 담당 서브에이전트 | 병렬 |
|-------|------|-------------------|------|
| 1 | P0 보안·버그 | core-coder | — |
| 2 | 표준·API 통일 | core-coder | — |
| 3 | 프론트 표준 | core-coder | — |
| 4 | 라우트·페이지 통일 | core-coder | — |
| 5 | 화면 고도화(디자이너·퍼블리셔 스펙) | core-coder | — |
| 6 | 테스트 도입 | core-tester → core-coder | Phase 7과 병렬 가능 |
| 7 | P1 로직·데이터 | core-coder | Phase 6과 병렬 가능 |

---

## 3. 분배실행 표 (Phase별 담당·프롬프트 요약)

| Phase | subagent_type | 프롬프트 요약 |
|-------|----------------|---------------|
| 1 | core-coder | tenantId 필터 적용(getSalaryCalculations consultantId/기간, getConsultantSalarySummary), 세금 상세/추가 세금 calculation 소유 테넌트 검증, ProcessIntegratedSalaryCalculation placeholder 12개로 수정. |
| 2 | core-coder | SalaryManagementController BaseApiController 상속·success/created·예외 위임, 공통코드 조회 전환, Repository tenantId 필수 메서드·비테넌트 퇴출. |
| 3 | core-coder | SalaryManagement·ConsultantProfileModal·SalaryProfileFormModal·TaxManagement에서 apiGet/apiPost → StandardizedApi, SALARY_API_ENDPOINTS 전면 사용, 세금 breakdown 구조 일치. |
| 4 | core-coder | /erp/tax 단일 컴포넌트(ImprovedTaxManagement 또는 TaxManagement 중 하나), 실데이터 /api/v1/admin/salary/tax/* 연동, 미사용 페이지 제거·deprecated. App.js 라우트 단일화. |
| 5 | core-coder | SCREEN_SPEC_SALARY_TAX_ENHANCEMENT·SALARY_TAX_ENHANCEMENT_MARKUP 반영: 블록 순서·토큰·BEM·breakdown 키·라벨, AdminCommonLayout·B0KlA, 반응형. |
| 6 | core-tester | TaxCalculationUtil·SalaryScheduleServiceImpl 단위, SalaryManagementController 핵심 API 통합(인증·tenant·권한·200/400/404) 시나리오·검증 기준 작성. |
| 6b | core-coder | core-tester가 작성한 테스트 시나리오·검증 기준에 따라 단위·통합 테스트 코드 구현. |
| 7 | core-coder | 지방소득세 INSERT(프로시저·breakdown), getBatchStatus 기간 정의 통일, period 검증·NPE 방지, 예외 메시지 완화. |

---

## 4. Phase별 호출 시 전달할 프롬프트 전문

아래 각 블록을 **해당 Phase 호출 시 복사하여** 해당 서브에이전트에 전달하면 됨.

---

### Phase 1 — P0 보안·버그 (core-coder)

```
급여·세금 P0 보안·버그 수정을 구현해 주세요. 코드만 작성·수정하고, 원인 분석·제안은 이미 문서화되어 있으므로 해당 문서를 따르면 됩니다.

참조 문서 (반드시 확인):
- docs/debug/SALARY_TAX_LOGIC_VERIFICATION_REPORT.md — §1 문제점 목록, §2 개선 제안 P0
- docs/project-management/SALARY_TAX_VERIFICATION_MEETING_RESULT.md — §4 다음 액션 Phase 1

수정 사항:
1. 테넌트 격리
   - getSalaryCalculations(Long consultantId): findAll() 제거, tenantId + consultantId 조건으로 조회하는 Repository 메서드 추가 후 사용.
   - getSalaryCalculations(startDate, endDate): tenantId + status + 기간 조건의 Repository 메서드 추가 후 사용(예: findByTenantIdAndStatusAndCalculationPeriodStartBetween).
   - getConsultantSalarySummary: tenantId가 반드시 적용되도록 조회 경로 수정(현재 테넌트만 조회).
2. 세금 상세/추가 세금 소유 검증
   - getTaxDetails(calculationId), calculateAdditionalTax(request)에서 salaryCalculation 조회 후 calculation.getTenantId()와 TenantContextHolder.getRequiredTenantId() 비교; 불일치 시 403 또는 404 반환.
3. ProcessIntegratedSalaryCalculation 호출
   - PlSqlSalaryManagementServiceImpl.processIntegratedSalaryCalculation()에서 placeholder 12개로 수정(?, ?, …, ? 12개), OUT 파라미터 인덱스 6~12가 프로시저 시그니처와 일치하는지 확인. 참조: docs/debug/SALARY_TAX_LOGIC_VERIFICATION_REPORT.md §1.3 #14.

적용 스킬: core-solution-backend, core-solution-multi-tenant. 수정 후 docs/debug/SALARY_TAX_LOGIC_VERIFICATION_REPORT.md §4 체크리스트 중 P0 항목이 만족되는지 확인해 주세요.
```

---

### Phase 2 — 표준·API 통일 (core-coder)

```
급여·세금 백엔드 표준·API 통일을 구현해 주세요.

참조 문서:
- docs/project-management/SALARY_TAX_VERIFICATION_MEETING_RESULT.md — §4 Phase 2
- docs/project-management/SALARY_TAX_COMPONENT_MODULE_REVIEW.md — §2.4 백엔드
- 프로젝트 내 BaseApiController·공통 예외 처리 표준

수정 사항:
1. SalaryManagementController
   - BaseApiController 상속(또는 프로젝트 공통 API 베이스 상속).
   - 성공 응답: success/created 등 프로젝트 표준 응답 포맷 사용.
   - 예외: 컨트롤러에서 catch (Exception e) 후 e.getMessage() 노출하지 말고, 공통 예외 핸들러 또는 표준 에러 응답 위임. docs/standards/ERROR_HANDLING_STANDARD.md 참조.
2. 공통코드·설정 조회
   - getOptionTypes, getGrades, getSalaryConfigs 등 공통코드/설정 조회를 기존 하드코딩에서 공통 서비스 또는 코드 테이블 조회로 전환.
3. Repository
   - Phase 1에서 추가한 tenantId 필수 메서드 유지. 기존 비테넌트 조회 메서드(findAll 등으로 급여/세금 조회하던 부분)는 제거하거나 퇴출하고, tenantId 조건 메서드만 사용.

적용 스킬: core-solution-backend, core-solution-code-style. 멀티테넌트 격리는 유지합니다.
```

---

### Phase 3 — 프론트 표준 (core-coder)

```
급여·세금 프론트엔드 API 호출 표준 통일을 구현해 주세요.

참조 문서:
- docs/project-management/SALARY_TAX_VERIFICATION_MEETING_RESULT.md — §4 Phase 3
- docs/project-management/SALARY_TAX_COMPONENT_MODULE_REVIEW.md — §2.2 API 경로, §2.3 SALARY_API_ENDPOINTS, §3.1 P0/P1
- frontend/src/constants/salaryConstants.js (SALARY_API_ENDPOINTS)

수정 사항:
1. SalaryManagement.js
   - 모든 급여·세금 API 호출을 apiGet/apiPost 대신 StandardizedApi 사용으로 전환.
   - 호출 URL을 SALARY_API_ENDPOINTS 상수로 통일(문자열 하드코딩 제거).
2. ConsultantProfileModal.js, SalaryProfileFormModal.js
   - apiGet/apiPost → StandardizedApi. SalaryProfileFormModal의 등급 변경 API는 /api/v1/admin/... 표준 경로로 변경(salaryConstants 또는 공통 엔드포인트 사용).
3. TaxManagement.js (사용처가 있으면)
   - 동일하게 StandardizedApi, SALARY_API_ENDPOINTS 사용.
4. 세금 통계 breakdown
   - 백엔드 getTaxStatistics 응답의 breakdown·taxByType 구조와 프론트 표시 필드(키·순서) 일치시키기. docs/design-system/SCREEN_SPEC_SALARY_TAX_ENHANCEMENT.md §4.2 breakdown 키·라벨 참조.

적용 스킬: core-solution-frontend, core-solution-api. StandardizedApi 사용 규칙을 준수해 주세요.
```

---

### Phase 4 — 라우트·페이지 통일 (core-coder)

```
급여·세금 라우트·페이지 단일화 및 실데이터 연동을 구현해 주세요.

참조 문서:
- docs/project-management/SALARY_TAX_VERIFICATION_MEETING_RESULT.md — §4 Phase 4
- docs/project-management/SALARY_TAX_COMPONENT_MODULE_REVIEW.md — §2.1 중복 페이지·세금 API 이원화, §3.1 P0
- docs/design-system/SCREEN_SPEC_SALARY_TAX_ENHANCEMENT.md — §2.1 #4, §5.2 단일화

수정 사항:
1. /erp/tax 단일 컴포넌트
   - App.js에서 /erp/tax 라우트를 한 번만 정의. TaxManagement와 ImprovedTaxManagement 중 하나만 사용하도록 결정 후, 사용하지 않는 컴포넌트는 제거하거나 deprecated 표시.
   - 권장: ImprovedTaxManagement를 유지하고, 이 컴포넌트가 실데이터 API(/api/v1/admin/salary/tax/*)만 사용하도록 연동. AdminController의 /api/v1/admin/tax/calculations(목업) 호출 제거.
2. 실데이터 연동
   - 세무 관리 페이지에서 GET/POST 등 모든 세금 관련 요청을 SalaryManagementController의 /api/v1/admin/salary/tax/* 엔드포인트와 연동(통계, type별, calculate). salaryConstants.SALARY_API_ENDPOINTS 사용.
3. ImprovedTaxManagement 내 API 경로
   - apiPut/apiDelete를 /api/v1/admin/... 로 통일. 백엔드에 PUT/DELETE가 없으면 해당 기능은 비활성화하거나, 기획에 따라 나중에 추가할 수 있도록 주석 처리.
4. menuItems.js·ErpDashboard 등
   - /erp/salary, /erp/tax 링크가 단일화된 구조와 맞는지 확인. 필요 시 /erp/tax → /erp/salary?tab=tax 리다이렉트 정책 반영(화면 설계서 옵션 A 권장 시).

적용 스킬: core-solution-frontend, core-solution-atomic-design. AdminCommonLayout은 유지합니다.
```

---

### Phase 5 — 화면 고도화(디자이너·퍼블리셔 스펙) (core-coder)

```
급여·세금 화면을 디자이너·퍼블리셔 스펙에 맞게 고도화해 주세요. 기존 라우트·단일화(Phase 4) 결과 위에 스펙을 적용합니다.

참조 문서 (필수):
- docs/design-system/SCREEN_SPEC_SALARY_TAX_ENHANCEMENT.md — 전체(블록 순서 0~5, 사용성·정보 노출·레이아웃·토큰·클래스)
- docs/design-system/SALARY_TAX_ENHANCEMENT_MARKUP.md — BEM·블록별 HTML 구조·클래스명·breakdown 일치

수정 사항:
1. 블록 순서·구성
   - ContentHeader(0) → 계산 대상 선택(1) → 급여 미리보기·확정(2) → 상담사 목록·프로필(3) → 세금 통계·breakdown(4) → 설정(5) 순서 준수. 단일 페이지·탭 구조 시 탭 [급여 계산 | 프로필 | 세금 통계]와 매핑.
2. 토큰·클래스
   - unified-design-tokens.css, B0KlA(mg-v2-ad-b0kla__*), 스펙의 var(--mg-color-*) 사용. 섹션 블록: 배경 surface, 테두리 1px, radius 16px, 좌측 세로 악센트 4px primary. salary-filter-block, salary-profile-block, salary-calc-block, salary-tax-block 등 마크업 스펙의 클래스 적용.
3. breakdown·통계
   - §4.2 순서(원천징수세, 지방소득세, 부가가치세, 소득세, 국민연금, 4대보험) 및 백엔드 breakdown 키와 1:1 매핑. 표시 라벨은 스펙 테이블 준수.
4. 실제 계산 기간(기산일 기준)
   - 계산 대상 선택 블록에 "실제 계산 기간: YYYY-MM-DD ~ YYYY-MM-DD (기산일 기준)" 표시. 기산일 설정 링크/툴팁 제공.
5. 반응형
   - docs/design-system/RESPONSIVE_LAYOUT_SPEC.md §1~4. 필터·카드 데스크톱 가로, 태블릿 2열, 모바일 1열.
6. 본문 레이아웃
   - AdminCommonLayout children, title/loading 등만 페이지별 지정. 메인 aria-label, role="tablist"/tabpanel 등 접근성 마크업 반영.

적용 스킬: core-solution-frontend, core-solution-atomic-design, core-solution-standardization. 코드만 작성하고, 설계 문서는 수정하지 마세요.
```

---

### Phase 6 — 테스트 도입 시나리오·검증 기준 (core-tester)

```
급여·세금 영역에 대한 테스트 시나리오와 검증 기준을 작성해 주세요. 테스트 코드 구현은 하지 않고, core-coder가 구현할 수 있도록 시나리오·기준만 산출합니다.

참조 문서:
- docs/project-management/SALARY_TAX_VERIFICATION_MEETING_RESULT.md — §4 Phase 5, §3 core-tester 보고
- docs/debug/SALARY_TAX_LOGIC_VERIFICATION_REPORT.md — §4 체크리스트
- .cursor/skills/core-solution-testing/SKILL.md

산출 요청:
1. 단위 테스트
   - TaxCalculationUtil: 부가세 포함/제외 변환 등 주요 메서드에 대한 단위 테스트 시나리오·입력/기대값.
   - SalaryScheduleServiceImpl(또는 동일 역할 서비스): getCalculationPeriod, getBaseDate 등 기산일·기간 계산 시나리오·경계값.
2. 통합 테스트(API)
   - SalaryManagementController 핵심 API: GET/POST /api/v1/admin/salary/* 관련 엔드포인트에 대해 (1) 인증 없음 시 401, (2) 다른 테넌트 리소스 접근 시 403/404, (3) 정상 요청 시 200, (4) 잘못된 period·startDate>endDate 등 시 400, (5) 존재하지 않는 ID 시 404 — 시나리오와 기대 HTTP 상태·응답 필드.
   - getSalaryCalculations(consultantId), getSalaryCalculations(start,end): 현재 테넌트만 반환하는지 검증 시나리오.
   - getTaxDetails, calculateAdditionalTax: 다른 테넌트 calculationId 요청 시 403/404 검증 시나리오.
3. 문서 형태
   - docs/project-management/ 또는 docs/testing/ 아래에 "SALARY_TAX_TEST_SCENARIOS.md" 등으로 저장. 각 시나리오에 대상 클래스/API, 입력, 기대 결과, 우선순위(P0 권장)를 명시해 core-coder가 테스트 코드로 옮기기 쉽게 작성해 주세요.

적용 스킬: core-solution-testing.
```

---

### Phase 6b — 테스트 구현 (core-coder)

```
급여·세금 테스트 시나리오에 따라 단위·통합 테스트 코드를 구현해 주세요.

참조 문서:
- core-tester가 Phase 6에서 산출한 테스트 시나리오·검증 기준 문서(예: docs/project-management/SALARY_TAX_TEST_SCENARIOS.md 또는 docs/testing/ 내 해당 문서)
- .cursor/skills/core-solution-testing/SKILL.md
- 프로젝트 기존 테스트 구조(JUnit·MockMvc·디렉터리 규칙)

수정 사항:
1. 단위 테스트
   - TaxCalculationUtil, SalaryScheduleServiceImpl(또는 해당 서비스)에 대한 단위 테스트 클래스 작성. 시나리오 문서의 입력/기대값을 그대로 테스트 케이스로 구현.
2. 통합 테스트
   - SalaryManagementController API: 인증·tenant·권한·200/400/404 시나리오를 MockMvc(또는 프로젝트 표준)로 구현. 테넌트 격리 검증 포함.
3. 표준 준수
   - 프로젝트 테스트 네이밍·패키지 구조·given-when-then 등 기존 컨벤션 준수.

적용 스킬: core-solution-testing, core-solution-backend. 테스트만 추가하고 비즈니스 로직 변경은 하지 마세요.
```

---

### Phase 7 — P1 로직·데이터 (core-coder)

```
급여·세금 P1 로직·데이터 개선을 구현해 주세요.

참조 문서:
- docs/debug/SALARY_TAX_LOGIC_VERIFICATION_REPORT.md — §2 개선 제안 P1, §4 체크리스트
- docs/project-management/SALARY_TAX_VERIFICATION_MEETING_RESULT.md — §4 Phase 6

수정 사항:
1. 지방소득세
   - 프로시저(ProcessIntegratedSalaryCalculation_standardized.sql): 원천징수의 10%로 지방소득세 계산 후 salary_tax_calculations에 LOCAL_INCOME_TAX로 INSERT.
   - getTaxStatistics breakdown에 localIncomeTax 값이 채워지도록 이미 키가 있다면 데이터만 연동되면 됨.
2. getBatchStatus 기간 정의
   - getBatchStatus()에서 "해당 월" 급여 계산 조회 시 기산일 기준 기간을 salaryScheduleService.getCalculationPeriod(targetYear, targetMonth)로 통일하거나, 배치 실행 기간과 상태 조회 기간이 다름을 주석/문서화하고 필요 시 UI에 표시.
3. period 검증
   - getTaxStatistics(period): period 형식(YYYY-MM) 및 월 1~12 검증 추가. 잘못된 형식 시 400과 명확한 메시지.
4. NPE·예외 완화
   - getTaxDetails: consultant 접근 전 consultant 로딩 보장(fetch join 또는 DTO에 id/name만 담기).
   - getSalaryStatistics: getGrossSalary(), getNetSalary() null-safe 처리(Optional.ofNullable(…).orElse(BigDecimal.ZERO)).
   - getConsultantSalarySummary: consultantId에 해당하는 User 없으면 빈 목록 또는 404 처리.
   - getTopPerformers: consultant 접근 시 NPE 방지(로딩 보장 또는 null 체크).
   - 컨트롤러 catch에서 클라이언트에는 일반 메시지, 상세는 로그만 출력(ERROR_HANDLING_STANDARD.md 참조).

적용 스킬: core-solution-backend, core-solution-database-first. 프로시저 수정 시 기존 INSERT 블록과 스타일을 맞추고, 지방소득세만 추가해 주세요.
```

---

## 5. 리스크·제약

| 항목 | 내용 |
|------|------|
| **DB·프로시저** | ProcessIntegratedSalaryCalculation 수정 시 배포·롤백 절차 확인. 지방소득세 INSERT는 기존 세목과 동일 테이블·형식. |
| **기존 API 소비처** | /api/v1/admin/tax/calculations를 쓰는 다른 클라이언트가 있으면 Phase 4에서 deprecated 또는 리다이렉트 정책 명시 필요. |
| **병렬 실행** | Phase 6(테스트 도입)과 Phase 7(P1 로직)은 의존성 없이 병렬 호출 가능. |

---

## 6. 단계별 완료 기준·체크리스트

| Phase | 완료 기준 |
|-------|-----------|
| 1 | 상담사별/기간별 급여 조회가 현재 테넌트만 반환; 세금 상세/추가 세금에서 타 테넌트 calculationId 시 403/404; ProcessIntegratedSalaryCalculation 12개 placeholder·정상 완료. |
| 2 | Controller가 BaseApiController 상속·표준 응답·예외 위임; 공통코드 조회 전환 완료; 비테넌트 Repository 사용 제거. |
| 3 | SalaryManagement·모달·TaxManagement가 StandardizedApi·SALARY_API_ENDPOINTS 사용; breakdown 키·순서 백엔드와 일치. |
| 4 | /erp/tax 라우트 단일 컴포넌트; 실데이터 /api/v1/admin/salary/tax/* 연동; 미사용 페이지 정리. |
| 5 | 블록 순서·토큰·BEM·breakdown 라벨이 스펙·마크업 문서와 일치; AdminCommonLayout·반응형 적용. |
| 6 | 테스트 시나리오·검증 기준 문서가 저장되어 core-coder가 구현 가능한 수준으로 기술됨. |
| 6b | TaxCalculationUtil·SalaryScheduleServiceImpl 단위 테스트 및 Controller API 통합 테스트가 시나리오 문서 기준으로 통과. |
| 7 | 지방소득세 INSERT·breakdown 반영; getBatchStatus 기간 통일 또는 문서화; period 400 검증; NPE 지점 제거; 예외 메시지 완화. |

---

## 7. 실행 요청문

**호출 주체(부모 에이전트 또는 사용자)**는 아래 순서로 서브에이전트를 호출해 주세요.

1. **Phase 1** — `core-coder` 호출, §4 "Phase 1 — P0 보안·버그" 프롬프트 전문 복사 전달.
2. **Phase 2** — Phase 1 완료 후 `core-coder` 호출, §4 "Phase 2 — 표준·API 통일" 프롬프트 전문 복사 전달.
3. **Phase 3** — Phase 2 완료 후 `core-coder` 호출, §4 "Phase 3 — 프론트 표준" 프롬프트 전문 복사 전달.
4. **Phase 4** — Phase 3 완료 후 `core-coder` 호출, §4 "Phase 4 — 라우트·페이지 통일" 프롬프트 전문 복사 전달.
5. **Phase 5** — Phase 4 완료 후 `core-coder` 호출, §4 "Phase 5 — 화면 고도화" 프롬프트 전문 복사 전달.
6. **Phase 6** — `core-tester` 호출, §4 "Phase 6 — 테스트 도입 시나리오·검증 기준" 프롬프트 전문 복사 전달. (Phase 5와 병렬 가능)
7. **Phase 6b** — Phase 6 산출물(테스트 시나리오 문서) 확보 후 `core-coder` 호출, §4 "Phase 6b — 테스트 구현" 프롬프트 전문 복사 전달.
8. **Phase 7** — Phase 1 완료 후 언제든 가능. `core-coder` 호출, §4 "Phase 7 — P1 로직·데이터" 프롬프트 전문 복사 전달. (Phase 6/6b와 병렬 가능)

각 Phase 완료 후 **결과를 기획(core-planner)에게 보고**해 주시면, 기획이 취합해 사용자에게 최종 보고합니다.
