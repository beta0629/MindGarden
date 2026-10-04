# MindGarden · Clinic-OS — 에이전트 프로젝트 맥락 (SSOT)

> 모든 에이전트가 매 대화 자동으로 읽는다. 80줄 이내 유지.
> 공통 가드레일 `.cursor/rules/00-guardrails.mdc` · 완료 전 검증 `.cursor/rules/guardrail-preflight.mdc`
> 팀 결정이 바뀌면 이 파일만 고친다. 다른 규칙·스킬·에이전트 문서에는 복사하지 않고 링크한다.

## 1. 제품·구성
- Clinic-OS: 상담센터 운영 멀티테넌트 SaaS. MindGarden은 테넌트 중 하나다. MindGarden 내용이 다른 테넌트에 나오면 FAIL.
- BE `src/main/java/com/coresolution/**`(Spring) · 웹 `frontend/` · 앱 `expo-app/` · 운영 콘솔 `frontend-ops/`, `backend-ops/`
- 역할: 관리자 · 상담사 · 내담자 (+ 플랫폼 운영자 = 운영 콘솔)

## 2. 브랜치·릴리스
- 개발 = `release/dev` (머지되면 .dev 자동 배포) · 운영 = `release/prod`
- 작업은 `release/dev` 에서 새 브랜치 → `release/dev` 로 PR 머지까지만. 직접 push·force push 금지.
- 운영 반영은 리드가 검증 PASS 후 `release/dev` → `release/prod` 머지 PR 하나로 한다. 에이전트는 운영 PR 생성·머지·운영 배포 워크플로 실행을 하지 않는다.
- 운영이 개발보다 앞서면 안 된다(핫픽스도 dev 먼저). 부분·분할 릴리스, 체리픽, 기능 브랜치 → prod PR 금지.
- 화면과 서버는 한 세트(같은 SHA)로 나간다.

## 3. 환경·DB
- .dev DB = 운영 데이터 D-1 복사본(DB만, FE 아님). 실고객 데이터다 → 쓰기·보정 금지. 테스트 계정은 새로 만들고 PR에 id만.
- 스키마: Flyway `src/main/resources/db/migration/` — 운영 적용된 파일 수정 금지, 새 버전만.
- 프로시저: `database/schema/procedures_standardized/` 가 원본. 배포는 별도 워크플로(`deploy-procedures-*.yml`, db-diff dry-run 먼저). 운영 순서는 프로시저 → BE.
- 스키마·프로시저를 .dev 서버에 손으로 깔지 않는다. 운영에도 가는 표준 배포 SQL/Flyway에 넣는다.
- 운영 시간 11:00–20:00 KST. 운영 BE는 blue-green(비활성 슬롯 헬스 통과 후 전환).

## 4. 금지 (예외 없음)
- 데이터 heal·강제 보정·수동 UPDATE/INSERT/DELETE(운영·.dev 모두). 결함은 코드로만 고친다.
- PortOne live 모드·testMode 변경·실결제. .dev는 테스트 모드만.
- .dev에서 실제 SMS 발송.
- Toss는 레거시: 삭제 대상이다. 이전·보강·새 호출 금지.
- 운영 도메인·운영 DB 호출(검증은 로컬과 .dev만). 공용 관리자 계정 로그아웃 호출.

## 5. 아키텍처
- 공통 모듈·캡슐화 우선. 화면별 하드코딩·복붙·땜질 패치 금지. 같은 문제는 공통 모듈에서 한 번 고친다.
- 관리자 목록 페이징은 공통 목록 모듈(page/size)만: FE `frontend/src/hooks/usePagedList.js`·`frontend/src/api/adminListFetch.js`·`MGPagination`, BE `AdminListPageResult`·`PaginationUtils`.
- FE API는 `StandardizedApi`, 모달은 `UnifiedModal`, 시각 값은 `--mg-v2-*` 토큰(`.cursor/rules/design.mdc`).
- 플랫폼 운영 항목은 운영 콘솔(`frontend-ops`/`backend-ops`), 테넌트 설정 화면은 Clinic-OS(`frontend/`).

## 6. 보안
- 상담 일지는 최고 민감 데이터: 기존 권한 정책을 넓히지 않는다. 본문을 로그·오류 응답·PR·스크린샷에 남기지 않는다.
- 테넌트 격리: 모든 조회·변경에 tenantId 조건. 다른 테넌트·타인 id 조회는 403.
- 가드는 서비스보다 먼저: `/api/v1/admin/**` 등 보호 API는 역할·테넌트·본인 id 검사를 컨트롤러/보안 설정에서 끝낸 뒤 서비스를 호출한다.
- 오류 응답은 표준 코드·사용자 문구만. 예외 메시지·스택·SQL은 서버 로그에만.
- `application-*.yml` 은 `${ENV}` 만. 비밀값 실값·기본값·기본 비밀번호 금지. `.dev` 등 도메인 하드코딩 금지(설정으로).

## 7. 돈
- 결제 → 회기 부여 → ERP INCOME 은 전부 성공 아니면 전부 롤백. 부분 반영 금지, 중복 요청은 1회만 반영(방어 코드).
- 환불: 사용 회기를 정가(단회 90,000원)로 차감한 뒤 나머지를 환불한다. 누적 환불 ≤ 결제액.
- 환불·취소는 그 주문의 회기만 정확히 복원한다(다른 주문·매핑 건드리지 않음).
- 금액·회기 상수 하드코딩 금지(공통코드·설정).

## 8. 완료 전 실행할 체크
- 검증 규칙 `.cursor/rules/guardrail-preflight.mdc` 순서대로. 상세 명령: `.cursor/skills/core-solution-self-verify/SKILL.md`
- 검사 스크립트: `mvn -o -q test -Dtest='AdminApiGuardCoverageTest,ProcedureSignatureGuardrailTest,ApplicationYmlSecretDefaultsTest,AdminApiRoleMatrixGuardrailMvcTest' -Dsurefire.failIfNoSpecifiedTests=false` · `scripts/ci/guardrail-gitleaks-diff.sh origin/release/dev` · `node scripts/verification/check-client-admin-own-id.js --changed <목록>` · `node scripts/verification/check-external-call-connection.js --changed <목록>` · `node scripts/design-system/css-tools/check-hardcoding-enhanced.js`
- BE 테스트는 CI에서 `-DskipTests` 라 로컬에서 직접 실행한다. 완료 시 stop 훅(`.cursor/hooks/guardrail-stop.sh`)이 변경 영역의 가드레일·관련 테스트를 자동 실행한다.

## 9. 어디를 보나 (필요할 때만)
- 역할: `.cursor/agents/*.md` · 절차: `.cursor/skills/core-solution-*/SKILL.md` · 영역 규칙(globs): `design.mdc`, `expo-app-metro-handoff.mdc` · 위임 규칙(on-demand): `mindgarden-subagents.mdc`
- 배포 사실은 `.github/workflows/*.yml` 의 `on:` 이 최종 근거다. 문서와 다르면 워크플로를 따른다.
