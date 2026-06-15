# PR #262 (`actions/checkout v4 → v6`) CI RED 원인 분석 보고서 (2026-06-15)

> 작성: 2026-06-15 KST · `core-debugger` (분석 전용 — 코드 수정 없음)
> 결정: 2026-06-15 13:40 KST · 사용자 — `investigate_async` → 본 보고서로 close/머지 결정 제출
> PR: <https://github.com/beta0629/MindGarden/pull/262> (head: `dependabot/github_actions/actions/checkout-6`, head SHA `df9960000e2229900c8d19d7ddb2b03a1316beb9`, base: `main`)
> 비교 기준: `main` HEAD `e15c40285` (2026-06-15 04:13 UTC 머지) + 직전 main 실패 run `27522905501` (HEAD `3f05528ec1`)

---

## TL;DR

| 항목 | 결론 |
|---|---|
| **원인 분류** | **환경 이슈 / 사전 존재 (PR #262 와 무관)** — `main` 브랜치에서도 동일 H2 스키마 부재로 단위·통합 테스트가 같은 형태로 실패 중. |
| **actions/checkout v4 → v6 관련성** | **없음** — 테스트 실패는 Spring `ApplicationContext` 로딩 단계의 H2 in-memory 인덱스 생성 SQL 실패 (`Column "grade"/"specialty"/"is_deleted" not found`) 에서 발생. checkout step 은 SUCCESS 로 마쳤고 source 체크아웃은 정상이다. v6 가 요구하는 Node 22 / Git 버전 이슈도 관측되지 않음. |
| **권장 액션** | (1) **PR #262 자체는 머지 가능** — 단, **`main` CI 가 그린이 될 때까지 보류 권장**. (2) `main` 의 H2 스키마 회귀(consultants 테이블 컬럼 부재) 를 우선 핫픽스해야 본 PR 의 CI 도 그린이 됨. (3) 또는 dependabot 차회 자동 재시도(rebase) 까지 잠시 대기. |
| **close vs 머지** | **close 비권장** — 본 PR 자체에는 결함 없음. main 정상화 후 재실행(`gh pr comment 262 --body "@dependabot recreate"` 또는 단순 push) 시 그린 예상. |

---

## §0. 분석 환경 / 입력

- GitHub 인증·도구: 로컬 `gh` CLI (resolve 가능)
- 비교 대상 run:
  - 본 PR run: `27522940969` ("🔍 코드 품질 검사", PR head `df99600`, 2026-06-15 03:55 UTC)
  - main 직전 RED run: `27522905501` ("🔍 코드 품질 검사", `3f05528ec1`, 2026-06-15 03:52 UTC)
- 검사한 워크플로 파일: 변경 없음 (Dependabot 가 모든 `actions/checkout` 호출의 `@v4` 를 `@v6` 으로 치환만 수행)

---

## §1. PR #262 statusCheckRollup 요약

| Check | Conclusion | 비고 |
|---|---|---|
| `🧪 단위 테스트` (job 81344702232) | **FAILURE** | 본 분석 핵심 대상 |
| `🧪 통합 테스트` (job 81344702239) | **FAILURE** | 본 분석 핵심 대상 |
| `📊 정적 검사` | SUCCESS | — |
| `📊 메트릭·리포트` | SUCCESS | — |
| `🚨 Discord 실패 알람` | SUCCESS | 실패 알림 정상 발화 |
| `trinity-build-smoke` | SUCCESS | — |
| `🔍 CI/BI 변경 대응 준비도 체크` | SUCCESS | — |
| `CodeQL 분석 (java-kotlin)` | SUCCESS | — |
| `CodeQL 분석 (javascript-typescript)` | SUCCESS | — |
| `CodeQL` | SUCCESS | — |

→ **체크아웃 단계 자체는 SUCCESS** (정적 검사·CodeQL·trinity 빌드 모두 통과). 실패는 Maven `test`/`failsafe` 단계로 좁혀진다.

---

## §2. 실패 스택트레이스 핵심 (단위 테스트, run 27522940969)

### 2.1 첫 실패 — Spring `ApplicationContext` 로딩 실패

가장 먼저 깨진 테스트는 `com.coresolution.core.context.SuperAdminBypassTest` (5/5 ERROR), 이후 `AsyncContextPropagationTest`, `SecurityTest`, `UserScenarioTest` 등이 동일한 메시지로 연쇄 실패:

```
java.lang.IllegalStateException: Failed to load ApplicationContext for
  [WebMergedContextConfiguration@4090ecf2 testClass = SuperAdminBypassTest, …]
…
java.lang.IllegalStateException: ApplicationContext failure threshold (1) exceeded:
  skipping repeated attempt to load context for …
```

### 2.2 근본 원인 — H2 인덱스 생성 DDL 실패

`ApplicationContext` 로딩 실패 직전 Hibernate 가 H2 in-memory DB 에 인덱스 생성 시 다음 DDL 이 줄줄이 실패한다 (`hibernate.tool.schema.spi.CommandAcceptanceException`):

```
Error executing DDL "
       on consultants (grade)" via JDBC [Column "grade" not found;]
Caused by: org.h2.jdbc.JdbcSQLSyntaxErrorException: Column "grade" not found;

Error executing DDL "
       on consultants (specialty)" via JDBC [Column "specialty" not found;]
Caused by: org.h2.jdbc.JdbcSQLSyntaxErrorException: Column "specialty" not found;

Error executing DDL "
       on consultants (is_deleted)" via JDBC [Column "is_deleted" not found;]
Caused by: org.h2.jdbc.JdbcSQLSyntaxErrorException: Column "is_deleted" not found;
```

→ `consultants` 테이블의 `grade`/`specialty`/`is_deleted` 컬럼이 **H2 test 스키마에 존재하지 않는데**, 엔티티/Flyway 가 해당 컬럼에 대한 인덱스 생성을 시도. 결과적으로 SessionFactory 가 RuntimeException 으로 종료되어 모든 `@SpringBootTest` 가 일괄 실패.

추가로 관찰된 후속 실패 (모두 같은 ApplicationContext 로딩 실패의 파급):
- `PaymentServicePerformanceTest` (3/3 ERROR)
- `LifecycleEntityRepositoryTest$*` (DestructionLog/MappingHistory/Notification/SatisfactionSurvey/CompensationHistory/AuditLog 각 1 ERROR)
- `ClientScheduleNoteRepositoryTest` (1/1 ERROR)
- `ScheduleRepositoryCumulativeConsultantCountsTest` (5/5 ERROR), `ScheduleRepositoryMonthlyConsultantCountsTest` (7/7), `ScheduleRepositoryCountSequenceTest` (6/6), `ScheduleRepositoryMonthlyMissingConsultationLogsTest` (11/11)
- `PersonalDataAccessLogRepositoryTest` (2/2 ERROR)
- `NotificationBatchSendLogPushMonitoringTest` (4/4 ERROR)
- `DormantUserPiiVaultRepositoryTest` (5/5 ERROR)
- `CommunityAnonymizationAuditRepositoryTest` (1/1 ERROR)

모든 케이스가 동일한 `IllegalStateException: ApplicationContext failure threshold (1) exceeded` 또는 그 초회 인스턴스의 H2 DDL 실패에서 파생.

### 2.3 통합 테스트 (job 81344702239) — 동일 패턴

`🧪 통합 테스트` 실패 로그에서도 동일한 `Column "grade"/"specialty"/"is_deleted" not found` 에 의한 SessionFactory 초기화 실패가 04:00:28 UTC 부근에 반복 출력되며, `ErdGenerationServiceIntegrationTest` 등 `*IntegrationTest` 들이 ApplicationContext 로딩 실패로 일괄 종료.

---

## §3. 결정적 대조군 — main 브랜치 실패 (run 27522905501, HEAD `3f05528ec1`)

본 PR 의 head 가 가리키는 base (`main`) 의 직전 push 트리거에서 동일한 워크플로(`code-quality-check.yml`) 가 같은 H2 DDL 실패로 RED:

```
2026-06-15T04:38:48.8618226Z  on consultants (grade)" via JDBC [Column "grade" not found;]
2026-06-15T04:38:48.8765555Z  Caused by: org.h2.jdbc.JdbcSQLSyntaxErrorException: Column "grade" not found
…
2026-06-15T04:38:48.8793442Z  on consultants (specialty)" via JDBC [Column "specialty" not found;]
…
2026-06-15T04:38:48.8923537Z  on consultants (is_deleted)" via JDBC [Column "is_deleted" not found;]
```

그리고 `SuperAdminBypassTest` 5/5 ERROR 가 동일 시점에 관측.

→ **결론: 본 H2 스키마 회귀는 PR #262 의 head 가 본 branch 자체에 도입한 변경이 아니라 base (`main`) 가 가져온 회귀** 이다. PR #262 의 변경 (`actions/checkout v4 → v6`) 과는 인과 없음.

또한 직전 main run 들(`27522903858`, `27522902264`, `27522861960`, `27522860281`, `27522858699`) 도 모두 `failure` — main 자체가 RED 상태이다.

---

## §4. 가능성 매트릭스

| # | 가설 | 증거 | 판정 |
|---|---|---|---|
| 1 | **actions/checkout v4 → v6 의 회귀 (코드 변경 측면)** — 체크아웃 동작 변화로 테스트 fixture 누락 | 체크아웃 step SUCCESS, 정적검사·CodeQL·trinity 모두 SUCCESS, `git.commit.id` 적재 정상 (`df99600...`), `dotGitDirectory` 정상 식별, `mvn test` 가 컴파일까지 정상 수행 후 H2 DDL 단계에서 실패. | **기각** |
| 2 | **v6 의 Node 20 → 22 마이그레이션 호환성 문제** | runner step `JAVA_HOME = …17.0.19-10`, Node 버전 변경은 `actions/checkout` 자체 런타임에만 영향 (Java/Maven 실행과는 분리). Maven 단계 stdout 에 Node 관련 경고 없음. | **기각** |
| 3 | **v6 가 요구하는 git 버전** | runner 의 git 버전은 `actions/checkout` 내부에서만 사용되고, checkout 이 성공한 이상 git 호환 이슈는 아님. dependabot 의 merge commit (`Merge 6ca0bf01… into 0e73d3fd…`) 도 정상 생성됨. | **기각** |
| 4 | **base (main) 의 H2 in-memory 스키마와 엔티티 불일치 회귀** | main HEAD `3f05528ec1` run 도 같은 `Column "grade" not found` 로 실패. PR #262 head merge 결과에서도 동일 메시지. | **확정** |
| 5 | **일시적 인프라 이슈 (네트워크/Maven Central)** | 컴파일 단계 의존성 다운로드 정상 종료, [`com.mysql:mysql-connector-j:8.0.33`] 등 정상 resolve. | **기각** |

→ **분류: 환경/사전 존재 회귀 (의존성 회귀 아님, 일시적 이슈 아님)**

---

## §5. 핵심 에러 stack (참고)

```
org.hibernate.tool.schema.spi.CommandAcceptanceException: Error executing DDL "
       on consultants (grade)" via JDBC [Column "grade" not found;]
  at org.hibernate.tool.schema.internal.exec.GenerationTargetToDatabase.accept(GenerationTargetToDatabase.java:94)
  at org.hibernate.tool.schema.internal.AbstractSchemaMigrator.applySqlString(AbstractSchemaMigrator.java:574)
  at org.hibernate.tool.schema.internal.AbstractSchemaMigrator.applySqlStrings(AbstractSchemaMigrator.java:514)
  at org.hibernate.tool.schema.internal.AbstractSchemaMigrator.applyIndexes(AbstractSchemaMigrator.java:360)
  at org.hibernate.tool.schema.internal.GroupedSchemaMigratorImpl.performTablesMigration(GroupedSchemaMigratorImpl.java:96)
  at org.hibernate.tool.schema.internal.AbstractSchemaMigrator.performMigration(AbstractSchemaMigrator.java:232)
  at org.hibernate.tool.schema.internal.AbstractSchemaMigrator.doMigration(AbstractSchemaMigrator.java:117)
  at org.hibernate.tool.schema.spi.SchemaManagementToolCoordinator.performDatabaseAction(SchemaManagementToolCoordinator.java:286)
  at org.hibernate.tool.schema.spi.SchemaManagementToolCoordinator.lambda$process$5(SchemaManagementToolCoordinator.java:145)
  at org.hibernate.boot.internal.SessionFactoryObserverForSchemaExport.sessionFactoryCreated(SessionFactoryObserverForSchemaExport.java:37)
  …
Caused by: org.h2.jdbc.JdbcSQLSyntaxErrorException: Column "grade" not found;
```

---

## §6. 권장 액션

### 6.1 PR #262 자체

- **close 비권장** — 본 PR 의 변경(`actions/checkout v4 → v6` 단순 치환) 자체는 결함 없음. dependabot 가 향후 v7 등으로 또 PR 발행해야 하므로 close 시 재작성 비용만 발생.
- **즉시 머지 불가** — base (main) 가 RED 인 동안 PR check 도 RED 로 유지됨. dependabot rebase 가 자동 머지를 막는다.
- **권장 순서**:
  1. (다른 워커) `main` 의 H2 스키마 회귀를 핫픽스 — `consultants` 테이블 H2 마이그레이션 누락 컬럼 (`grade`, `specialty`, `is_deleted`) 보강 또는 인덱스 생성 조건 정정.
  2. `main` CI 그린 확인 후 본 PR 에 `gh pr comment 262 --body "@dependabot rebase"` 또는 빈 commit push 로 CI 재실행.
  3. CI 그린 시 일반 squash 머지.

### 6.2 H2 스키마 회귀 후속 PR (별도 트랙)

본 보고서 범위 외이지만, 운영팀/메인 트랙 worker 에게 다음을 인계 권장:

- `src/main/resources/db/migration/V*__*.sql` 에서 `consultants` 테이블의 `grade`/`specialty`/`is_deleted` 컬럼 정의 변경 이력 추적
- 또는 엔티티 `@Index` 어노테이션이 deprecate 된 컬럼을 참조 중인지 확인 (PR #262 base SHA `0e73d3fd5` 대비 직전 머지 PR 의 변경 사항)
- H2 in-memory 테스트 스키마가 `spring.jpa.hibernate.ddl-auto=update`/`create-drop` 중 어느 모드인지, Flyway 가 prod 와 test 모두 적용되는지 확인
- 본 PR (#262) 와 무관한 회귀이므로 별도 핫픽스 PR 발행 필요

### 6.3 환경 정합 PR 발행 여부

- **불필요** — PR #262 자체에는 환경 정합 보강이 필요한 부분이 없다. `actions/checkout v6` 가 요구하는 Node/Git 버전은 GitHub-hosted runner (`ubuntu-latest`) 가 이미 충족. 본 PR diff 외 환경 변경 사항이 발견되지 않음.
- 만약 v6 가 self-hosted runner 에서 Node 22 미설치로 실패하는 케이스가 향후 발견되면 그때 별도 PR 검토.

### 6.4 re-trigger 권장 여부

- **즉시 re-trigger 비추천** — base 가 RED 인 동안에는 동일 결과 반복. main 핫픽스 완료 후 re-trigger.

---

## §7. 참조

- PR #262: <https://github.com/beta0629/MindGarden/pull/262>
- run 27522940969 (PR #262 단위·통합 테스트 실패): <https://github.com/beta0629/MindGarden/actions/runs/27522940969>
- run 27522905501 (main `3f05528ec1` 동일 실패 대조군): <https://github.com/beta0629/MindGarden/actions/runs/27522905501>
- `actions/checkout` v6 릴리스 노트: <https://github.com/actions/checkout/releases>
- `docs/standards/SCHEDULER_OPERATIONS_GUIDE.md`
- `docs/운영반영/POST_MERGE_OPS_HANDOFF_20260614.md`
- `/.cursor/skills/core-solution-debug/SKILL.md`

---

## 절대 금지 (본 보고서 범위)

- 코드 수정 (단위 테스트·H2 스키마 보강은 별도 워커/PR 영역)
- 운영 DB 변경 SQL 실행
- 메인 트랙 (Phase 5/6) 침범
- 디자인 v2 영역 침범
- PR #310 영역 침범
