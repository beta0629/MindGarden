# 급여 관리 상담사 목록 — 공통 모듈 전환 기획 (분배실행)

**작성**: core-planner  
**목표**: 급여 관리(SalaryManagement)가 전용 API `GET /api/v1/admin/salary/consultants` 대신 공통 모듈(consultantHelper 또는 admin/consultants API)을 사용하도록 전환하고, 500·데이터 미수신 이슈가 있으면 원인 파악 후 수정한다.

---

## 1. 요구·범위 (1~2문장)

- **요구**: 상담사 정보는 공통 모듈(consultantHelper.getAllConsultantsWithStats(), GET /api/v1/admin/consultants/with-stats)이 있는데, 급여 관리만 `/api/v1/admin/salary/consultants`를 따로 호출하고 있음. “있는 거 가져다 써라”에 따라 급여 관리에서 **공통 모듈을 쓰도록 정리**하고, 500 에러 등 이슈가 있으면 **원인 파악 후 수정**한다.
- **범위**: 포함 — SalaryManagement 프론트 상담사 목록 소스 전환(공통 API/헬퍼 사용), SalaryManagementController 등 백엔드에서 salary 전용 상담사 조회 제거·재사용 검토, 500/데이터 미수신 시 원인 분석·수정. 제외 — 급여 계산·세금·프로필 등 다른 API/화면 로직 변경(필요 시만 연동 부분만 수정).

---

## 2. 참조 문서 요약 (디버거/코더 전달용)

- **상담사 공통 모듈**
  - **프론트**: `frontend/src/utils/consultantHelper.js` — `getAllConsultantsWithStats()` → `StandardizedApi.get('/api/v1/admin/consultants/with-stats')`. 반환은 `consultants` 배열 또는 `data.consultants` 등 여러 형태를 처리해 배열로 반환. 다른 화면(대시보드, 상담사 관리 등)은 이 공통 API/헬퍼 사용.
  - **백엔드**: AdminController 등에서 `GET /api/v1/admin/consultants/with-stats` 제공, ConsultantStatsService·tenantId 기반 조회.
- **core-component-manager·재사용 제안**
  - `docs/planning/CONSULTANT_CLIENT_UNIFIED_MANAGEMENT_REVIEW.md`: 상담사·내담자 통합 검토, 공통 API(consultants/with-stats, clients/with-stats), 레이아웃·KPI·ProfileCard 재사용 권장.
  - `docs/design-system/v2/CONSULTANT_CLIENT_INTEGRATION_SUMMARY.md`: consultantHelper.js 중앙화, `getAllConsultantsWithStats` 등으로 중복 제거.
  - `docs/project-management/CORE_AGENTS_ENCAPSULATION_COMPONENT_MEETING.md`: 컴포넌트/모듈 중복 제안·적재적소 배치, 코더와 한 팀으로 실행.
- **기존 500/데이터 이슈 분석**
  - `docs/debug/SALARY_CONSULTANTS_DATA_ISSUE.md`: (1) **프론트**: apiGet이 `data`만 반환하는데 SalaryManagement.js가 `response.success`/`response.data`를 기대해 빈 목록. (2) **백엔드**: TenantContextHolder 미설정 시 `getRequiredTenantId()` 예외 → 500. 재현 절차·수정 제안·체크리스트 포함.

---

## 3. Phase 설계

| Phase | 담당 | 목표 |
|-------|------|------|
| **Phase 0 (선택)** | core-debugger | GET /api/v1/admin/salary/consultants 500 또는 상담사 데이터 미수신 원인 파악·보완 분석. (이미 SALARY_CONSULTANTS_DATA_ISSUE.md 있음 — 500 재현 시 추가 확인·문서 보완.) |
| **Phase 1** | core-coder | 급여 관리 상담사 목록을 **공통 모듈**(consultantHelper 또는 GET /api/v1/admin/consultants/with-stats)로 전환. 백엔드에서 salary 전용 상담사 조회 제거·재사용 검토 및 수정. |

**의존성**: Phase 0은 선택. 500이 발생하는 환경이 있으면 Phase 0 실행 후 Phase 1 진행 권장. 500이 없으면 Phase 1만 진행 가능.

---

## 4. 분배실행 표

| Phase | 담당 서브에이전트 | 전달 프롬프트 요약 | 적용 스킬 |
|-------|-------------------|---------------------|-----------|
| **Phase 0 (선택)** | core-debugger | GET /api/v1/admin/salary/consultants 500 또는 상담사 데이터 미수신 시, 증상·재현 절차·로그 확인 포인트를 정리하고 원인 분석·수정 제안(체크리스트) 산출. 기존 docs/debug/SALARY_CONSULTANTS_DATA_ISSUE.md 참고·보완. | /core-solution-debug |
| **Phase 1** | core-coder | 급여 관리 상담사 목록을 consultantHelper.getAllConsultantsWithStats() 또는 /api/v1/admin/consultants/with-stats 사용으로 전환. 프론트는 SalaryManagement.js에서 salary/consultants 호출 제거 후 공통 모듈 사용. 백엔드는 SalaryManagementController·Service에서 상담사 전용 조회 제거 또는 공통 서비스 재사용 검토. 참조: SALARY_CONSULTANTS_DATA_ISSUE.md, CONSULTANT_CLIENT_INTEGRATION_SUMMARY.md, API/표준. | /core-solution-frontend, /core-solution-backend, /core-solution-api |

---

## 5. Phase 0 (core-debugger) 호출 시 복사용 프롬프트 전문

```
GET /api/v1/admin/salary/consultants 가 500을 반환하거나, 급여 관리 페이지에서 상담사 데이터를 받지 못하는 이슈가 있을 때 원인을 파악해 주세요.

배경:
- 급여 관리(SalaryManagement)는 현재 이 API를 호출하고 있으며, 공통 모듈(consultantHelper.getAllConsultantsWithStats(), GET /api/v1/admin/consultants/with-stats)로 전환 예정이다.
- 전환 전에 500 또는 데이터 미수신이 발생하면 원인 분석이 필요하다.

참조 문서 (반드시 참고):
- docs/debug/SALARY_CONSULTANTS_DATA_ISSUE.md — 이미 정리된 증상·프론트 응답 처리 불일치(apiGet이 data만 반환하는데 response.success/data 기대), 백엔드 TenantContextHolder 미설정 시 getRequiredTenantId() 예외로 500 가능성, 재현 절차, 수정 제안·체크리스트.

요청 사항:
1. 500이 발생하는 경우: 서버 로그·스택트레이스·재현 절차를 확인하고, 위 문서의 원인(tenantId 미설정 등)과 일치하는지 검증한 뒤, 필요 시 문서에 보완하거나 추가 수정 제안(체크리스트)을 작성해 주세요. 코드 수정은 하지 말고, core-coder에게 전달할 수정 제안·체크리스트만 작성합니다.
2. 500은 없는데 목록이 비어 있는 경우: 프론트 응답 처리(apiGet 반환값 vs response.success/response.data 기대)와 문서 §2.1·§4를 대조해 원인을 명시하고, 수정 제안을 체크리스트로 정리해 주세요.
3. 산출물: 원인 요약, 확인한 로그/재현 절차, 수정 제안·체크리스트(core-coder 전달용). 기존 SALARY_CONSULTANTS_DATA_ISSUE.md를 보완해도 됩니다.

스킬: /core-solution-debug 적용. 직접 코드 수정 없음.
```

---

## 6. Phase 1 (core-coder) 호출 시 복사용 프롬프트 전문

```
급여 관리(SalaryManagement)에서 상담사 목록을 전용 API가 아닌 공통 모듈을 사용하도록 전환해 주세요.

배경:
- 상담사 정보는 공통 모듈이 이미 있음: consultantHelper.getAllConsultantsWithStats() 및 GET /api/v1/admin/consultants/with-stats.
- 급여 관리만 GET /api/v1/admin/salary/consultants 를 따로 호출하고 있어, “있는 거 가져다 써라”에 따라 공통 모듈로 통일해야 함.

참조 문서:
- docs/debug/SALARY_CONSULTANTS_DATA_ISSUE.md — 응답 처리 불일치·tenantId 관련 수정 제안 포함. 공통 모듈 전환 시 동일한 unwrap/응답 처리 원칙 적용.
- docs/design-system/v2/CONSULTANT_CLIENT_INTEGRATION_SUMMARY.md — consultantHelper.js, getAllConsultantsWithStats(), /api/v1/admin/consultants/with-stats 사용 방식.
- docs/planning/CONSULTANT_CLIENT_UNIFIED_MANAGEMENT_REVIEW.md — 상담사·내담자 공통 API·재사용 권장.
- docs/standards/API_CALL_STANDARD.md — StandardizedApi 사용, /api/v1/ 경로.

요청 사항:
1. 프론트엔드
   - frontend/src/components/erp/SalaryManagement.js: 상담사 목록 로딩 시 apiGet('/api/v1/admin/salary/consultants') 호출을 제거하고, consultantHelper.getAllConsultantsWithStats() 또는 StandardizedApi.get('/api/v1/admin/consultants/with-stats')를 사용하도록 수정.
   - consultantHelper 반환값은 이미 배열(consultants)로 정규화되어 있으므로, 기존 loadConsultants()에서 사용하던 상태(setConsultants)에 그대로 넣을 수 있게 처리. 응답 구조는 SALARY_CONSULTANTS_DATA_ISSUE.md의 unwrap 원칙에 맞게 처리(배열이면 그대로 setState).
   - 같은 파일 내 loadSalaryProfiles, loadCalculationPeriod 등 다른 apiGet/apiPost 호출부는 해당 문서의 수정 제안대로 unwrap 전제로 이미 수정되어 있으면 유지, 아니면 동일 원칙으로 통일.

2. 백엔드
   - SalaryManagementController에서 GET /api/v1/admin/salary/consultants (getConsultants) 엔드포인트를 제거하거나, 내부적으로 기존 Admin/ConsultantStats 쪽 공통 조회를 재사용하도록 변경. (프론트가 더 이상 이 URL을 호출하지 않으므로, 엔드포인트 제거 또는 deprecated 처리 후 공통 서비스 호출로 통일 중 선택.)
   - SalaryManagementService.getConsultantsForSalary() 등 급여 전용 상담사 조회 메서드: 다른 화면에서 사용하지 않으면 제거 검토, 사용 중이면 공통 서비스(예: ConsultantStatsService 또는 Admin 쪽 상담사 목록 조회) 재사용으로 리팩터.
   - 멀티테넌트: tenantId는 세션/필터 및 기존 공통 API와 동일하게 유지. 필요 시 SALARY_CONSULTANTS_DATA_ISSUE.md의 Controller 방어적 tenantId 설정 제안 참고.

3. 표준
   - API 호출은 StandardizedApi 또는 consultantHelper 기준. /api/v1/ prefix, 에러·tenantId 처리: docs/standards/API_CALL_STANDARD.md, .cursor/skills/core-solution-api/SKILL.md.

4. 검증
   - 관리자로 /erp/salary 접속 후 상담사 목록·급여 프로필 목록이 공통 API로 정상 표시되는지 확인.
   - GET /api/v1/admin/salary/consultants 제거 시 다른 호출처(있는지 검색)가 없음을 확인.

스킬: /core-solution-frontend, /core-solution-backend, /core-solution-api 적용.
```

---

## 7. 실행 요청문

다음 순서로 서브에이전트를 호출해 주세요.

1. **Phase 0 (선택)**  
   - 500 또는 상담사 데이터 미수신이 발생하는 경우에만 실행.  
   - **서브에이전트**: `core-debugger`  
   - **전달 프롬프트**: 위 §5의 "Phase 0 (core-debugger) 호출 시 복사용 프롬프트 전문" 전체를 복사해 전달.

2. **Phase 1**  
   - **서브에이전트**: `core-coder`  
   - **전달 프롬프트**: 위 §6의 "Phase 1 (core-coder) 호출 시 복사용 프롬프트 전문" 전체를 복사해 전달.  
   - Phase 0 실행 시, 디버거 산출물(수정 제안·체크리스트)을 코더 전달 시 함께 참조하도록 전달해 주세요.

---

**문서 위치**: docs/planning/SALARY_CONSULTANTS_COMMON_MODULE_PLAN.md
