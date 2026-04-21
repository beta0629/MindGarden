# 사용자 대면 문자열·하드코딩 정리 — 잔여 배치 핸드오프

**작성일**: 2026-04-21  
**목적**: 이미 반영된 배치와 **다음 세션에서 이어갈 작업**을 한곳에 고정한다. 구현은 `core-coder` 위임, 검증은 `core-tester`·로컬 `mvn`/`npm run lint:check`를 전제로 한다.

**관련 위임·게이트**: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`, `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md`(하드코딩 검사·완료 조건), `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`

---

## 1. 이미 반영된 범위 (기준 커밋)

**커밋**: `de1f410a7` — `develop`·`main` 푸시 완료 (2026-04-21 전후).

| 영역 | 요약 |
|------|------|
| 백엔드 상수 클래스 | `AdminServiceUserFacingMessages`, `ErpServiceUserFacingMessages`, `ConsultationServiceUserFacingMessages`, `UserProfileServiceUserFacingMessages`, `OAuth2UserFacingMessages`, `ComplianceDashboardSampleContent` / `ComplianceServiceErrorMessages`, `TenantOnboardingSalaryAndFinancialSeedStrings`, `FinancialCommonCodeSeedStrings` 등 |
| 서비스·시드 | `AdminServiceImpl`(1·2차), `ErpServiceImpl`, `ConsultationServiceImpl`, `UserProfileServiceImpl`, `EmailServiceImpl`, `ComplianceService`, `OAuth2Controller`, `FinancialCommonCodeInitializer`, `TenantOnboardingSalaryAndFinancialSeedDefinitions` |
| 프론트 | `StaffManagement`, `DashboardFormModal`, `MenuPermissionManagement` → 각 `frontend/src/constants/*Strings.js` |

**원칙(다음 배치에도 동일)**: `log.*` 한글은 운영 관측용으로 **기본 유지**. 사용자·API 응답·예외 메시지·시드 표시문은 상수·모듈로 이전.

---

## 2. 다음 세션에서 할 일 (우선순위 권장)

### 2-1. 백엔드 — `AdminServiceImpl` 3차 이후

- **남음**(서브에이전트 보고 기준): 전문분야 맵, 기타 `result.put` 표시값, `log` 외 한글 리터럴 등.
- **방법**: 기존 `AdminServiceUserFacingMessages` 확장 또는 주제별 분할 클래스(파일 비대 시만). 동작·문자열 동일성 유지.
- **검증**: `mvn -q -DskipTests compile` (필요 시 타깃 테스트).

### 2-2. 프론트 — 관리자·공통 문자열

- `MenuPermissionManagement.js`는 1차만 반영. **`MenuPermissionManagementUI`** 등 분리 컴포넌트에 남은 한글이 있으면 동일 패턴으로 `*Strings.js` 분리.
- 하드코딩 스캔 상위 파일부터 **파일 단위**로 병렬 위임(한 PR에 과다 파일 금지).

### 2-3. 스캔·산출물

- 저장소 루트 `test-reports/hardcoding/hardcoding-report-*.json`, Playwright `tests/e2e/test-results/**`는 **커밋 제외**가 기본. 팀 정책으로 보관이 필요하면 `.gitignore`·문서를 `core-planner`와 합의 후 조정.
- 배치 후: `./scripts/check-hardcode.sh`(또는 저장소 표준 래퍼) 재실행해 경고 추이만 기록해도 됨(숫자 SSOT는 리포트 JSON).

### 2-4. 보안·온보딩 (별도 트랙)

- 마스터 TODO: **공개 온보딩 API 보강 (SEC-01 잔여)** — `TODO_ONBOARDING_PUBLIC_API_HARDENING`·`docs/deployment/` 시리즈와 정합. 구현은 백엔드 위임, 문서만 갱신할 때는 `core-planner`·문서 스킬.

### 2-5. 배포

- `main` 푸시만으로 운영 풀스택이 자동이 아닐 수 있음. 실제 트리거는 `.github/workflows/deploy-*.yml`의 `on:` 기준 — `core-deployer` 요약 또는 `docs/deployment/GITHUB_ACTIONS_WORKFLOW_INDEX.md` 참고.

---

## 3. 다음 병렬 위임 예시 (프롬프트에 넣을 경로)

| 트랙 | 대상(예시) | 비고 |
|------|-------------|------|
| BE-A | `AdminServiceImpl.java` 잔여 한글 | `AdminServiceUserFacingMessages` |
| BE-B | 다른 ServiceImpl 상위 스캔 결과 1파일 | 동일 constant 패키지 규칙 |
| FE-A | 관리자 컴포넌트 1파일 + `constants/*Strings.js` | `build` + `lint:check` |
| QA | `core-tester`: 변경 모듈 회귀·스모크 문서 한 줄 갱신 | ERP 허브 스모크 등 기존 SSOT |

---

## 4. 완료 조건(세션 종료 시)

- [ ] 위 2절에서 선택한 항목에 대해 **컴파일·프론트 lint(quiet)** 통과.
- [ ] 운영 반영 전에는 **하드코딩 게이트 문서**와 `PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` 재확인.
- [ ] `ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md` 이력 한 줄·최종 갱신일 반영.

---

**문서 위치 SSOT**: 본 파일을 잔여 배치의 진입점으로 두고, 세부 설계는 기존 표준·화면설계서를 따른다.
