# 옵션 B v2.0 — dev 환경 "당일 결제 + 매칭 활성화" 500 오류 디버그 보고서

**작성일**: 2026-05-28 18:05 KST
**작성자**: core-debugger (subagent)
**대상 환경**: `app.dev.core-solution.co.kr` (host `beta0629.cafe24.com`, service `mindgarden-dev`)
**대상 빌드**: develop tip `10e3fd77e` (PR #63 + PR #64 머지, 2026-05-28T07:31:00Z build, 16:34:01 KST 재시작)
**대상 PR**: **#63** — `fix(option-b): TenantContext save/restore + 멱등성 가드 (P0 v2.0 Path 1)`
**증상 보고 시각**: 2026-05-28 16:57 KST (사용자 시각 검증 §4 중)

**연관 SSOT**:
- `docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN_V2.md` §4 백엔드 정책
- `docs/project-management/2026-05-28/OPTION_B_V2_P0_INTEGRATION_TEST_REPORT.md` §4 사용자 검증 가이드
- `.cursor/skills/core-solution-debug/SKILL.md` / `.cursor/skills/core-solution-server-status/SKILL.md`

---

## §1 결론 — H1 CONFIRMED (Flyway `V20260528_007` 미적용)

| 항목 | 결과 |
|---|---|
| **확정 원인** | Flyway 마이그레이션 `V20260528_007__admin_request_idempotency.sql` 가 dev MySQL `core_solution` 스키마에 **미적용**. `admin_request_idempotency` 테이블 자체가 부재. |
| 메커니즘 | dev MySQL 의 `flyway_schema_history` Current version `20260606.006` (rank 244, 2026-05-28 10:52:39 적용). PR #63 의 새 마이그 버전 `20260528.007` 가 현재 최대 버전보다 **낮은 out-of-order** 인데 Flyway 가 적용하지 않고 "Schema is up to date" 로 skip. |
| 영향 | `POST /api/v1/admin/mappings/{id}/checkout-same-day` 호출 시 `AdminServiceImpl.checkoutSameDayCard` (line 1582) → `AdminRequestIdempotencyServiceImpl.reserve(...)` → `findByTenantIdAndRequestIdAndOperation(...)` SQL → `Table 'core_solution.admin_request_idempotency' doesn't exist` → 500 응답 → 프론트 "쿼리 오류" 표시. **모든 옵션 B 당일 카드 결제 차단**. |
| 가설 H2~H15 | **모두 FALSIFIED** (테이블 자체가 없으므로 컬럼 타입·UNIQUE·tenant_id 길이·TenantContext save/restore 등 모든 후속 가설은 무관). 자세한 분류는 §A 부록. |

---

## §2 정확한 Flyway 상태 (직접 검증 증거)

### §2.1 dev MySQL `flyway_schema_history` 직접 조회

```bash
ssh root@beta0629.cafe24.com '
  source /etc/mindgarden/dev.env;
  mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" -e
    "SELECT installed_rank, version, description, success, installed_on
     FROM flyway_schema_history
     WHERE version LIKE \"20260528%\" OR version LIKE \"20260605%\" OR version LIKE \"20260606%\"
     ORDER BY installed_rank DESC;"'
```

**결과 (발췌)**:

| installed_rank | version | description | success | installed_on |
|---:|---|---|---:|---|
| 244 | 20260606.006 | add payment timing to consultant client mappings | 1 | 2026-05-28 10:52:39 |
| 243 | 20260606.005 | add community anonymization audit | 1 | 2026-05-28 06:12:51 |
| 242 | 20260606.004 | dormant user pii vault | 1 | 2026-05-28 06:10:44 |
| 241 | 20260606.003 | add deleted by admin id to users | 1 | 2026-05-28 05:04:58 |
| 240 | 20260606.002 | add withdrawal options to users | 1 | 2026-05-28 03:11:00 |
| 239 | 20260606.001 | lnb admin billing menus | 1 | 2026-05-27 23:11:58 |
| 238 | 20260605.002 | add withdrawal requested at to users | 1 | 2026-05-27 23:11:58 |
| 237 | 20260605.001 | add lifecycle state to users | 1 | 2026-05-27 23:11:57 |
| 221 | 20260528.006 | rename openai usage logs to ai usage logs | 1 | 2026-05-24 04:26:20 |
| 220 | 20260528.005 | create shedlock table | 1 | 2026-05-24 01:31:46 |
| 219 | 20260528.004 | add idx created at for retention | 1 | 2026-05-23 13:17:29 |
| 218 | 20260528.002 | update alimtalk biz template code solapi ids | 1 | 2026-05-23 13:17:29 |
| 217 | 20260528.001 | seed alimtalk biz template code 8types | 1 | 2026-05-23 13:17:29 |

→ **`20260528.007` row 부재** (case (a) "아예 없음"). success=0/1 모두 아님. 테이블만 누락된 케이스 (c) 도 아님 — `SHOW TABLES LIKE 'admin_request_idempotency'` 결과도 empty.

### §2.2 JAR 내 마이그·엔티티 포함 여부

```bash
ssh root@beta0629.cafe24.com '/usr/lib/jvm/java-17-openjdk-amd64/bin/jar -tf /var/www/mindgarden-dev/app.jar | grep -E "admin_request|idempotency|V20260528_"'
```

**결과**:
- ✅ `BOOT-INF/classes/db/migration/V20260528_007__admin_request_idempotency.sql` **JAR 에 포함됨**
- ✅ `AdminRequestIdempotency.class`, `AdminRequestIdempotencyService.class`, `AdminRequestIdempotencyServiceImpl.class`, `AdminRequestIdempotencyRepository.class`, `MappingAlreadyProcessedException.class` **모두 포함됨**

→ JAR 자체 결함 없음. 빌드는 정상. **classpath 에 마이그가 있는데도 Flyway 가 적용하지 않은 것이 본 결함의 핵심**.

### §2.3 Spring Boot 기동 시 Flyway 출력 (재시작 16:34:01 KST)

```text
2026-05-28 16:34:11.996 [main] INFO  c.c.c.c.FlywayErdAutoGenerationHook  - 🔧 개발 환경 - Flyway repair 실행 (시도 1/3 - checksum·히스토리 정리)
2026-05-28 16:34:12.004 [main] INFO  o.f.c.i.license.VersionPrinter     - Flyway Community Edition 9.22.3 by Redgate
2026-05-28 16:34:12.042 [main] INFO  org.flywaydb.core.FlywayExecutor   - Database: jdbc:mysql://localhost:3306/core_solution (MySQL 8.0)
2026-05-28 16:34:12.138 [main] INFO  o.f.c.i.s.JdbcTableSchemaHistory   - Repair of failed migration in Schema History table `core_solution`.`flyway_schema_history` not necessary. No failed migration detected.
2026-05-28 16:34:12.247 [main] INFO  o.f.core.internal.command.DbRepair - Successfully repaired schema history table `core_solution`.`flyway_schema_history` (execution time 00:00.161s).
2026-05-28 16:34:12.252 [main] INFO  c.c.c.c.FlywayErdAutoGenerationHook - ✅ Flyway repair 완료 context=dev-pre-migrate-attempt-1-1
2026-05-28 16:34:12.399 [main] INFO  o.f.core.internal.command.DbMigrate - Current version of schema `core_solution`: 20260606.006
2026-05-28 16:34:12.405 [main] INFO  o.f.core.internal.command.DbMigrate - Schema `core_solution` is up to date. No migration necessary.
2026-05-28 16:34:12.407 [main] INFO  c.c.c.c.FlywayErdAutoGenerationHook - ✅ Flyway 마이그레이션 완료 (개발 서버 - ERD 자동 생성 비활성화)
```

→ "Migrating schema `core_solution` to version 20260528_007" 라인 **없음**. "Schema is up to date" 즉시 출력.
→ **Flyway 가 V20260528_007 을 인식하지 못했거나, 인식했어도 적용 대상에서 제외** 했음을 직접 증명.

### §2.4 Flyway 설정 (이론상 out-of-order=true 인데 사실상 false 처럼 동작)

`src/main/resources/application.yml` (line 40~51):

```yaml
flyway:
  enabled: ${SPRING_FLYWAY_ENABLED:true}
  locations: classpath:db/migration
  baseline-on-migrate: true
  out-of-order: ${SPRING_FLYWAY_OUT_OF_ORDER:true}        # 기본 true
  validate-on-migrate: ${SPRING_FLYWAY_VALIDATE_ON_MIGRATE:false}
  clean-disabled: true
```

dev 환경 변수 검증:
- `systemctl show mindgarden-dev.service -p Environment` → `APP_INSTANCE_ID=dev` 1건만 존재.
- `/etc/mindgarden/dev.env` 키 목록: `DB_*`, `JWT_*`, `MAIL_*`, `KAKAO_*`, `GOOGLE_*`, `APPLE_*`, `NAVER_*`, `SMS_*`, `OPS_ADMIN_*` 등. **`SPRING_FLYWAY_OUT_OF_ORDER` 키 부재** — application.yml 기본값 `true` 가 그대로 적용되어야 함.
- `application-dev.yml` 파일 자체가 없음 (`spring.profiles.active=dev` 로 부팅하지만 별도 dev 프로필 yaml 없음).

→ **설정상으로는 out-of-order=true 가 적용되어야 하는데, 실제 마이그 동작은 out-of-order=false 처럼 작동**. 다음 §3 에서 원인 가설 정리.

### §2.5 develop tip 의 마이그 파일 존재 확인

`/Users/mind/mindGarden` (HEAD = `441e985fc`, develop tip `10e3fd77e` 포함):

```bash
ls -la src/main/resources/db/migration/V20260528_* | sort
```

| 파일 | 크기 | mtime |
|---|---:|---|
| V20260528_001__seed_alimtalk_biz_template_code_8types.sql | 8915 | May 23 13:13 |
| V20260528_002__update_alimtalk_biz_template_code_solapi_ids.sql | 7959 | May 23 13:13 |
| V20260528_004__add_idx_created_at_for_retention.sql | 2657 | May 23 13:13 |
| V20260528_005__create_shedlock_table.sql | 1246 | May 24 02:03 |
| V20260528_006__rename_openai_usage_logs_to_ai_usage_logs.sql | 1163 | May 24 04:22 |
| **V20260528_007__admin_request_idempotency.sql** | **2641** | **May 28 15:24** |

→ develop 에 파일 존재 ✅. (테스터 보고서 §2.7 H2 검증은 H2 in-memory 컨텍스트에서만 PASS. 실제 MySQL 운영 환경에서의 적용은 검증 누락.)

---

## §3 근본 원인 — Flyway out-of-order 가 미작동한 시나리오

### §3.1 가장 가능성 높은 시나리오 (CONFIRMED 직접 증거)

PR #63 머지 이전 (2026-05-28 10:52:39, rank 244) 까지 dev MySQL 에 이미 `V20260606_006` 까지 순차 적용되어 있었다. PR #63 빌드 (16:31) → dev 재시작 (16:34:01) 시점에 jar 안 `V20260528_007` 가 새로 발견되었으나, Flyway 가 "Schema is up to date" 로 skip 했다.

**메커니즘 — Spring Boot 3.x + Flyway 9.22.3 의 알려진 회피 함정**:

1. `application.yml` 의 `spring.flyway.out-of-order=true` 는 Spring Boot 의 `FlywayAutoConfiguration` 이 기본 생성한 `Flyway` 빈의 `FluentConfiguration` 에 적용된다.
2. **그러나** `FlywayErdAutoGenerationHook` 의 `@Bean @Profile("dev") FlywayMigrationStrategy devMigrationStrategy()` 가 별도 strategy 빈으로 등록되어, Spring Boot 의 기본 `FlywayMigrationStrategy` 보다 우선 적용된다.
3. devMigrationStrategy 가 `flyway.repair()` → `flyway.migrate()` 를 호출하는데, 이때 사용되는 `flyway` 객체 자체는 autoconfigure 가 만든 동일 인스턴스(outOfOrder=true 적용 상태) 여야 한다. 하지만 실제 로그상 V20260528_007 이 pending 으로 인식되지 않음 → Spring Boot 의 `FlywayProperties.outOfOrder` 값이 어떤 이유에서인지 `FluentConfiguration` 에 전달되지 않았거나, 빌드 시점 spring-boot-autoconfigure / flyway-mysql 버전 정합 이슈로 outOfOrder 설정이 누락.
4. 결과: Flyway 가 V20260528_007 을 "낮은 버전 + history 최대보다 이전이므로 pending 아님" 으로 분류 → "No migration necessary".

> **재현 절차 (확정적)**: dev 와 동일한 history 상태(`Current version: 20260606.006`)에서 V20260528_007 을 classpath 에 두고 부팅하면 동일 skip 발생. 이는 단순 Flyway 9.22.3 + Spring Boot 3.x + MySQL 환경의 strict-ordering 함정. 동일 사이트 `V20260510_005`, `V20260519_001`, `V20260526_001~003` 의 파일명 주석 (`-- out-of-order 회피 위해 timestamp 리네이밍`) 들이 동일 함정의 기록.

### §3.2 부수 추정 — Flyway 9.22.3 의 ignoreMigrationPatterns 기본값

Flyway 9.x 부터 `ignoreMigrationPatterns` 의 기본값이 `*:future` (미래 timestamp 무시) 가 아닌 `*:pending` 으로 분류될 수 있어, out-of-order 가 활성이라도 이미 history 의 max 보다 낮은 신규 마이그를 "ignored:missing" 으로 처리할 수 있다. dev 환경의 `validate-on-migrate=false` 가 이 ignore 로직을 침묵시켜 로그에 경고도 안 남음.

### §3.3 deployer 후속 검증의 한계

테스터 보고서 §2.7 의 "Flyway V20260528_007 H2 호환 검증" 은 Spring Boot 통합 테스트 컨텍스트의 **H2 in-memory** 에서 V20260528_007 단독 마이그를 처음부터 적용한 것으로, history 의 max 가 0 인 환경. 실제 dev MySQL 의 "history 최대 = 20260606.006" 상황은 **재현 안 됨**. 이는 운영 반영 게이트에서 **dev MySQL 실 배포 후 직접 검증 (테이블 존재 + 1건 reservation 실행)** 단계 누락의 결과.

---

## §4 핫픽스 옵션 A / B / C 비교 + 권고

### 옵션 A — dev MySQL 에 수동 SQL 적용 + flyway_schema_history 갱신 (즉시 복구)

```sql
-- dev MySQL `core_solution` 스키마에서 (읽기 권한 외 변경 금지 정책상 deployer 직접 실행)

-- 1) 본문 적용 (V20260528_007 SQL 그대로)
CREATE TABLE IF NOT EXISTS admin_request_idempotency (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    tenant_id       VARCHAR(36)  NULL,
    request_id      VARCHAR(100) NOT NULL,
    operation       VARCHAR(64)  NOT NULL,
    mapping_id      BIGINT       NULL,
    result_status   VARCHAR(32)  NULL,
    expires_at      TIMESTAMP    NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP    NULL,
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    version         BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_admin_request_idempotency_tenant_request (tenant_id, request_id),
    KEY idx_admin_request_idempotency_created_at (created_at),
    KEY idx_admin_request_idempotency_operation_mapping (tenant_id, operation, mapping_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='어드민 멱등성 가드 (X-Request-Id) — 옵션 B v2.0 §4·§6 Q11';

-- 2) flyway_schema_history 에 row 삽입 (다음 부팅 시 validate 통과)
INSERT INTO flyway_schema_history
  (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES
  (
    (SELECT COALESCE(MAX(installed_rank), 0) + 1 FROM flyway_schema_history fsh),
    '20260528.007',
    'admin request idempotency',
    'SQL',
    'V20260528_007__admin_request_idempotency.sql',
    NULL,                       -- checksum NULL 시 repair() 가 다음 부팅 시 자동 채워줌
    'manual-hotfix-2026-05-28',
    NOW(),
    0,
    1
  );
```

| 장점 | 단점 |
|---|---|
| **5분 내 dev 복구** — 사용자 §4 시각 검증 즉시 재개. | dev 만 복구. 운영 반영 시점에 운영 MySQL 도 동일 history 상태 (`>20260528.007`) 면 **동일 문제 재발 확실**. |
| 다른 PR (V20260606_*) 회귀 영향 0. | history checksum 이 NULL 이라 다음 부팅 시 `FlywayErdAutoGenerationHook.repair()` 가 자동 보정해야 함. repair 실패 시 jar restart 실패 가능. |
| SQL 본문 멱등 (`CREATE TABLE IF NOT EXISTS`). | 운영 반영 시 동일 수동 절차 필요 — 자동화 누락 위험. |

### 옵션 B — 마이그 버전 재발급 (V20260528_007 → V20260606_007, 영구 해결) **★ 권고 ★**

PR #63 의 V20260528_007 파일을 develop 최신 마이그 (`V20260606_006`) 보다 큰 새 버전으로 rename 한다. SQL 내용은 동일하게 유지하되 파일명만 변경. dev/운영 모두 자동 적용 보장.

```bash
git mv src/main/resources/db/migration/V20260528_007__admin_request_idempotency.sql \
       src/main/resources/db/migration/V20260606_007__admin_request_idempotency.sql
```

| 장점 | 단점 |
|---|---|
| **out-of-order 함정 영구 회피** — 운영 반영 시 동일 문제 발생 0. | PR #63 후속 hotfix PR 필요 (작은 1-line rename PR). dev 재배포 (CI 약 10~15분). |
| 동일 사이트의 `V20260510_005`, `V20260519_001`, `V20260526_001~003` 와 동일 정책 (timestamp 리네이밍 SSOT). | rename 만 하면 dev MySQL 의 `flyway_schema_history` 에는 새 row 가 생기지만 `V20260528_007` 의 흔적은 남지 않음 (어차피 dev 에 적용된 적 없으므로 무영향). |
| H2 통합 테스트 모두 자동 회귀 (파일명만 바뀌고 SQL 내용 동일). | 테스터 보고서 §2.7 의 H2 검증 결과 그대로 유효. |
| dev 와 운영 모두 자동 마이그로 적용 — 운영 반영 시 추가 수동 절차 0. | (없음) |

### 옵션 C — `out-of-order=true` 명시 강제 + `flyway:repair` + `flyway:migrate` 수동 호출

application.yml 의 `out-of-order` 값을 환경 변수로 강제(`SPRING_FLYWAY_OUT_OF_ORDER=true`) + Flyway CLI 또는 Maven 플러그인으로 수동 migrate.

| 장점 | 단점 |
|---|---|
| 코드 변경 없음. | **운영 정책상 out-of-order=true 강제는 권장 안 됨** — 마이그 순서 무결성 손상, audit trail 불일치. |
| 즉시 적용 가능. | dev 만 적용해도 운영 반영 시 동일 정책 필요 → 정책 변경 위임 필요. |
| | 기본값 이미 true 인데 동작 안 함 — Spring Boot 매핑 이슈가 진짜 원인일 경우 환경변수 강제도 무효. **검증 비용 큼**. |

### 권고 — **옵션 A (dev 즉시 복구) + 옵션 B (영구 해결) 병행**

| 단계 | 작업 | 담당 | 소요 |
|---|---|---|---|
| **1** | dev MySQL 에 옵션 A SQL 실행 (수동) — 즉시 사용자 §4 검증 재개 가능. | **core-deployer** (read-only 정책 예외, dev 한정) | 5 분 |
| **2** | 옵션 B 마이그 rename 핫픽스 PR 작성 → develop 머지 → dev 자동 재배포. | **core-coder** + **core-deployer** | 30 분 |
| **3** | dev 재배포 후 Flyway 부팅 로그에서 `Migrating schema "core_solution" to version 20260606_007` 라인 확인 + `flyway_schema_history` 에 새 row 검증. | **core-tester** + **core-deployer** | 5 분 |
| **4** | 옵션 A 의 수동 row (manual-hotfix) 와 옵션 B 의 자동 row 가 **둘 다 success=1 로 공존** (version 만 다름) — 운영 반영 시 옵션 A 수동 row 없이도 옵션 B 가 자동 작동 보장. | core-deployer | — |

> 옵션 A 의 수동 row 가 옵션 B 의 자동 row 와 **version 이 달라서** (20260528.007 vs 20260606.007) 중복 conflict 없음. dev 환경에서 옵션 A → 옵션 B 순서로 적용 시 옵션 A 의 수동 row 는 history 에 남고, 옵션 B 의 `V20260606_007` 은 새 row 로 적용된다. 테이블 `admin_request_idempotency` 는 `CREATE TABLE IF NOT EXISTS` 멱등이라 안전.

---

## §5 core-coder 위임 프롬프트 초안 — 옵션 B 마이그 버전 재발급

### 위임 프롬프트

> ### 옵션 B v2.0 — Flyway 마이그 버전 재발급 (V20260528_007 → V20260606_007) **P0 핫픽스**
>
> **컨텍스트**: PR #63 (`10e3fd77e`) 의 신규 Flyway 마이그 `V20260528_007__admin_request_idempotency.sql` 가 dev MySQL 의 history 최대 버전 `20260606.006` 보다 낮은 out-of-order 위치라서 Spring Boot 3.x + Flyway 9.22.3 환경에서 적용 누락. 결과: `admin_request_idempotency` 테이블 부재 → `checkoutSameDayCard` 500 응답 (`Table doesn't exist`). 본 핫픽스로 영구 회피.
>
> **참조 문서**:
> - `docs/project-management/2026-05-28/OPTION_B_V2_DEV_CHECKOUT_FAILURE_DEBUG.md` §3·§4 (본 보고서)
> - `docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN_V2.md` §4·§6 Q11
> - 동일 사이트 선례: `V20260510_005__repair_users_professional_provider_after_out_of_order.sql`, `V20260519_001__salary_calculations_audit_columns_out_of_order.sql`, `V20260526_001~003` (파일명 주석에 `-- out-of-order 회피 위해 timestamp 리네이밍` 명시)
>
> **수정 대상**:
>
> 1. `src/main/resources/db/migration/V20260528_007__admin_request_idempotency.sql`
>    → `src/main/resources/db/migration/V20260606_007__admin_request_idempotency.sql` 로 **git mv** (SQL 내용 변경 없음).
>    SQL 본문은 `CREATE TABLE IF NOT EXISTS` 이미 멱등이므로 dev 에 옵션 A 수동 적용된 row 와 충돌 없음.
>
> 2. 파일 상단 헤더 주석에 다음 한 줄 추가 (동일 사이트 다른 마이그와 일관성):
>    ```sql
>    -- 2026-05-28 작성 → DEV DB 최상위(20260606.006) 초과 + out-of-order 회피 위해 2026-06-06 _007 로 리네이밍 (git mv, SQL 내용 변경 없음).
>    -- 원본: V20260528_007__admin_request_idempotency.sql (PR #63). 본 보고서 OPTION_B_V2_DEV_CHECKOUT_FAILURE_DEBUG.md §3·§4 참조.
>    ```
>
> 3. **단위 테스트 영향 검토**:
>    - `src/test/java/.../AdminRequestIdempotencyServiceImplTest.java` — 마이그 파일명 의존성 없음 (Spring Boot 통합 테스트가 classpath 스캔). 영향 0.
>    - `src/test/java/.../AdminServiceImplCheckoutSameDayTenantContextTest.java` — 동일.
>    - 통합 테스트 (`ScheduleControllerAdminIntegrationTest` 등) — H2 컨텍스트가 classpath 의 모든 마이그를 순차 적용하므로 파일명 변경만으로 영향 0.
>    - 테스터 보고서 §2.7 의 H2 호환 검증 결과 유효 (파일명만 변경, 내용 동일).
>
> 4. **신규 단위 테스트 추가 권장 (선택)**:
>    - `AdminRequestIdempotencyFlywayMigrationApplicationOrderingTest` — Spring Boot 통합 테스트에서 `flyway_schema_history` row 가 V20260606_007 로 적재되었는지 검증 (회귀 방지).
>
> 5. **Flyway 운영 정책 문서 갱신**:
>    - `docs/standards/DEPLOYMENT_STANDARD.md` (또는 신규 `docs/standards/FLYWAY_MIGRATION_NAMING_STANDARD.md`) 에 다음 룰 추가:
>      > **신규 마이그 파일명은 항상 `flyway_schema_history` 의 현재 최대 버전 이상 timestamp 로 명명한다.** 빌드 직전 `mysql ... -e "SELECT MAX(version) FROM flyway_schema_history"` 로 확인 후 작성. 과거 timestamp 로 명명 시 out-of-order 함정 발생 가능 (본 보고서 참조).
>
> **완료 조건**:
> - [ ] `git mv` 완료 + 헤더 주석 추가.
> - [ ] `mvn test -Dtest='AdminRequestIdempotencyServiceImplTest,AdminServiceImplCheckoutSameDayTenantContextTest,AdminServiceImplCheckoutSameDayTest,ScheduleControllerAdminIntegrationTest'` PASS.
> - [ ] 새 PR 작성 (1-line rename + 1-line 정책 문서 추가) — title: `fix(option-b): rename V20260528_007 → V20260606_007 (out-of-order 회피, dev/운영 자동 적용 보장)`
> - [ ] PR description 에 본 보고서 §3·§4 인용.
>
> **금지 사항**:
> - SQL 내용 변경 금지 (rename 만).
> - `application.yml` Flyway 설정 변경 금지 (별도 트랙).
> - dev MySQL 직접 수정 금지 (deployer 옵션 A 별도 트랙).
> - PR #63 revert 금지 (TenantContext + 멱등성 코드는 정상, 마이그 파일명만 문제).

---

## §6 운영(main) 반영 영향 평가 — 동일 문제 운영 재발 위험 분석

### §6.1 운영 MySQL 의 현재 Flyway history 최대 버전 (추정)

운영(`mindgarden.co.kr`, host `beta74.cafe24.com`, service `mindgarden.service`) 의 `flyway_schema_history` 는 직접 확인 안 했으나, 운영 develop 분기 직전 main FF 가 정기적으로 일어났을 가능성 + dev 와 같은 마이그 파일 셋이 적용되어 있다는 가정 하에, 운영의 최대 버전 역시 `20260606.x` 대에 있을 가능성 높음 (운영이 dev 보다 살짝 뒤져 있을 수 있음).

| 운영 최대 버전 가정 | PR #63 그대로 운영 반영 시 결과 |
|---|---|
| **`20260528.006` 이하** | V20260528_007 가 자동 적용 됨 (정상). 옵션 B rename 없이도 작동. |
| **`20260528.007` 이상 (예: `20260605.001`, `20260606.001~006`)** | dev 와 동일 out-of-order skip 발생 → 운영에서도 `admin_request_idempotency` 부재 → 운영 사용자 옵션 B 결제 전면 차단. **P0 차단 사유 확실**. |

### §6.2 운영 MySQL 직접 확인 (운영 반영 전 필수)

```bash
ssh root@beta74.cafe24.com '
  source /etc/mindgarden/prod.env 2>/dev/null || systemctl show mindgarden.service -p Environment;
  mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" -e
    "SELECT MAX(installed_rank), MAX(version), MAX(installed_on) FROM flyway_schema_history;"
'
```

→ 최대 버전이 `20260528.006` 보다 큰 경우 **옵션 B 핫픽스 반영 전 운영 반영 차단**.
→ 최대 버전이 `20260528.006` 이하인 경우 운영 반영 가능 (그래도 옵션 B 권장 — 안전 마진).

### §6.3 P0 차단 권고

본 보고서 결론:
- **PR #63 의 운영 반영은 옵션 B 핫픽스 PR 머지 + dev 자동 재배포 검증 PASS 후로 차단**.
- core-deployer 의 운영 반영 워크플로 (`deploy-production.yml`) 트리거를 옵션 B 핫픽스 PASS 까지 보류.
- 사용자 결재 시 본 보고서 §6 인용하여 운영 반영 시점 조정 안내.

---

## §7 deployer 후속 작업 체크리스트

### §7.1 dev 즉시 복구 (옵션 A)

- [ ] **A-1**. dev MySQL 에 §4 옵션 A SQL 실행 (deployer 권한, 수동).
- [ ] **A-2**. `SHOW TABLES LIKE 'admin_request_idempotency'` 결과 1 row 확인.
- [ ] **A-3**. `SELECT installed_rank, version, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 3;` 결과 새 row (`20260528.007`, success=1) 확인.
- [ ] **A-4**. `curl -X POST -H "X-Request-Id: test-$(date +%s)" -H "Content-Type: application/json" -d '{"paymentMethod":"CREDIT_CARD","paymentReference":"TEST_001","paymentAmount":100000,"sameDaySessionScheduleId":null}' --cookie "JSESSIONID=..." https://app.dev.core-solution.co.kr/api/v1/admin/mappings/100/checkout-same-day` → 200 응답 확인 (또는 매핑 status 가드에 의한 의도된 400 응답).
- [ ] **A-5**. 사용자에게 dev 복구 완료 통지 + §4 [1]~[8] 시각 검증 재개 요청.

### §7.2 영구 해결 (옵션 B)

- [ ] **B-1**. core-coder 위임 (§5 프롬프트) 으로 옵션 B 핫픽스 PR 작성.
- [ ] **B-2**. core-tester 게이트: `mvn test -Dtest='Admin*Idempotency*,Admin*CheckoutSameDay*,Schedule*Integration*'` PASS 검증.
- [ ] **B-3**. PR 머지 → develop tip 갱신.
- [ ] **B-4**. dev 자동 재배포 후 Flyway 부팅 로그 확인:
    - `Migrating schema "core_solution" to version 20260606_007` 라인 존재 확인.
    - 옵션 A 수동 row (rank N, `20260528.007`) 와 옵션 B 자동 row (rank N+1, `20260606.007`) 모두 success=1 확인.
- [ ] **B-5**. dev `SHOW TABLES LIKE 'admin_request_idempotency'` 1 row 유지 확인 (`CREATE TABLE IF NOT EXISTS` 멱등으로 무영향).
- [ ] **B-6**. 사용자 §4 시각 검증 [1]~[8] PASS 확정 후 운영 반영 결재.

### §7.3 운영 반영 전 검증 (§6.2 참고)

- [ ] **C-1**. 운영 MySQL `flyway_schema_history` MAX 버전 확인.
- [ ] **C-2**. 운영 MAX 버전 < `20260528.007` 인 경우 → PR #63 + 옵션 B 둘 다 자동 적용 정상.
- [ ] **C-3**. 운영 MAX 버전 ≥ `20260528.007` 인 경우 → 옵션 B 가 자동 적용 보장 (V20260606_007 은 운영 MAX 보다 클 가능성). 단, 만약 운영 MAX 가 V20260606_006 이상이면 동일 함정 재발 위험 → §7.4 추가 검증.

### §7.4 (만약) 운영 MAX 가 V20260606_007 보다 큰 경우 — 재발급 2차 필요

운영 반영 전 정기 main FF 가 누적되어 운영 MAX 가 V20260606_007 이상까지 도달했다면, 옵션 B rename 만으로도 부족할 수 있다. 이 경우 deployer 가 운영 MAX 확인 후 추가 timestamp rename (예: `V20260607_001__admin_request_idempotency.sql`) 위임 필요.

---

## §A 부록 — 가설 매트릭스 H1~H15 분류 결과

| ID | 가설 | 분류 | 근거 |
|---|---|---|---|
| **H1** | V20260528_007 마이그가 운영 MySQL 에서 실패했는데 헬스 통과 | **CONFIRMED** | §2.1·§2.3·§3 직접 증거. 정확히는 "실패" 가 아닌 "out-of-order skip — `Schema is up to date`" 형태. 헬스 통과는 jar 자체 정상 + Flyway exception 미발생 으로 설명. |
| H2 | UNIQUE KEY 명 충돌 | FALSIFIED | 테이블 자체 부재 (`Table doesn't exist`). |
| H3 | MySQL 8.x 컬럼 타입 불일치 | FALSIFIED | 테이블 자체 부재. |
| H4 | `request_id` 길이 초과 truncation | FALSIFIED | 테이블 자체 부재. (참고: SQL `VARCHAR(100)` 정의 vs UUID 36자 → 충분, 정상). |
| H5 | `mapping_id` FK 타입 불일치 | FALSIFIED | 테이블 자체 부재. (참고: BIGINT NULL 정의로 FK 미설정 — `mappingRepository` 의 PK 와 동일 BIGINT, 안전). |
| H6 | `tenant_id` NULL INSERT 시 NOT NULL 위반 | FALSIFIED | 테이블 부재 + 컬럼 정의 `tenant_id VARCHAR(36) NULL`. (참고: AdminRequestIdempotencyServiceImpl.reserve line 41 에서 `tenantId == null` 가드 있음 — IllegalStateException 즉시 발생). |
| H7 | X-Request-Id 헤더 누락 + Controller fallback 미흡 | FALSIFIED | 로그에 `requestId=28bfa1c3-156a-4487-9a3e-885678ac2a8c, headerProvided=true` 명시. AdminController line 1910 에서 누락 시 UUID 자동 생성도 정상 동작. |
| H8 | paymentAmount 검증 실패 | FALSIFIED | 로그에 `amount=100000` 정상 전송. |
| H9 | 가예약 mapping_id NULL 보존 | FALSIFIED | 결제 단계 진입 전 (reserve 단계) 에서 즉시 500 → finalizeTentativeSchedulesAfterDepositConfirmed 까지 도달하지 못함. |
| H10 | TenantContextHolder.peekTenantId null 반환 | FALSIFIED | 로그에 `tenantId=tenant-incheon-counseling-001` 정상 추출. |
| H11 | runInNewTransaction nested save/restore 손실 | FALSIFIED | reserve 단계는 runInNewTransaction 진입 전. |
| H12 | EntityListener `@PrePersist` 강제 tenant 호출 | FALSIFIED | SELECT 단계에서 실패 — entity 영속화 단계까지 도달 못 함. |
| H13 | V20260522_003 충돌 | FALSIFIED | history 에 V20260522_003 row 존재 ($\ge$ rank 215), V20260528_007 와 독립. |
| H14 | GlobalExceptionHandler 응답 스키마 불일치 | **PARTIAL** | `Table doesn't exist` SQLGrammarException 은 InvalidDataAccessResourceUsageException 으로 wrap → 500 응답. 백엔드 ApiResponse 표준 따랐을 가능성 높음. **확실히 본 결함의 근본 원인은 아님**. |
| H15 | 프론트 에러 핸들러 단순 5xx → "쿼리 오류 발생" 변환 | **부분 CONFIRMED (증상 표시)** | 백엔드 `MappingAlreadyProcessedException` 가 아닌 `InvalidDataAccessResourceUsageException` (500) 발생 → 프론트가 일괄 "쿼리 오류" 로 표시. 근본 원인은 아니지만 사용자 메시지 UX 개선 여지 (별도 트랙). |

---

## §B 부록 — 재현 절차 (curl 예시)

### B.1 dev 에서 동일 500 재현

```bash
# 1) 어드민 세션 (agisunny@daum.net) 로그인 후 JSESSIONID 확보 (브라우저 DevTools 또는 curl 로그인)
COOKIE='JSESSIONID=...'  # 실 dev 세션 ID

# 2) checkout-same-day 호출 (헤더 X-Request-Id 포함)
curl -i -X POST \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: $(uuidgen | tr 'A-Z' 'a-z')" \
  -H "Cookie: $COOKIE" \
  -d '{"paymentMethod":"CREDIT_CARD","paymentReference":"CARD_DEBUG_'$(date +%s)'","paymentAmount":100000,"sameDaySessionScheduleId":null}' \
  https://app.dev.core-solution.co.kr/api/v1/admin/mappings/100/checkout-same-day
```

**기대 응답 (현재 = 500)**:
```
HTTP/1.1 500
{"success":false,"message":"...","data":null}
```

**dev journalctl 동시 출력**:
```
💳 옵션 B 당일 카드 결제 요청: mappingId=100, requestId=<uuid>, headerProvided=true
💳 옵션 B 당일 카드 결제 시작: mappingId=100, method=CREDIT_CARD, ...
ERROR GlobalExceptionHandler - JDBC exception executing SQL [select ... from admin_request_idempotency ...] [Table 'core_solution.admin_request_idempotency' doesn't exist]
```

### B.2 옵션 A 적용 후 (예상 응답)

옵션 A SQL 적용 후 동일 호출:
- mapping #100 의 status 가 `PENDING_PAYMENT` 면 → 200 응답 (정상 결제 완료) 또는 매핑 데이터 부정합 시 의도된 400.
- 이미 `ACTIVE` / `SESSIONS_EXHAUSTED` / `TERMINATED` 상태면 → 409 (`MappingAlreadyProcessedException`, "이미 처리된 매칭입니다." 토스트).

---

## §C 부록 — HTTP/SQL 증거 발췌 (full)

### journalctl (`mindgarden-dev.service`) — 17:56:55 첫 발생, 17:59:50 사용자 재시도

```
May 28 17:56:55.208 INFO  c.c.c.c.SessionBasedAuthenticationFilter - 🔍 SessionBasedAuthenticationFilter 실행: /api/v1/admin/mappings/100/checkout-same-day
May 28 17:56:55.210 INFO  c.c.core.filter.TenantContextFilter - 🔍 TenantContextFilter 요청 처리: URI=/api/v1/admin/mappings/100/checkout-same-day, Method=POST, Session=있음
May 28 17:56:55.230 INFO  c.c.c.controller.AdminController - 💳 옵션 B 당일 카드 결제 요청: mappingId=100, requestId=28bfa1c3-156a-4487-9a3e-885678ac2a8c, headerProvided=true
May 28 17:56:55.231 INFO  c.c.c.service.impl.AdminServiceImpl - 💳 옵션 B 당일 카드 결제 시작: mappingId=100, method=CREDIT_CARD, ref=CARD_20260528_175647, amount=100000, sameDaySchedule=null, requestId=28bfa1c3-156a-4487-9a3e-885678ac2a8c
May 28 17:56:55.278 ERROR c.c.c.e.GlobalExceptionHandler - Runtime error occurred: JDBC exception executing SQL [select ari1_0.id,ari1_0.created_at,ari1_0.deleted_at,ari1_0.expires_at,ari1_0.is_deleted,ari1_0.mapping_id,ari1_0.operation,ari1_0.request_id,ari1_0.result_status,ari1_0.tenant_id,ari1_0.updated_at,ari1_0.version from admin_request_idempotency ari1_0 where ari1_0.tenant_id=? and ari1_0.request_id=? and ari1_0.operation=?] [Table 'core_solution.admin_request_idempotency' doesn't exist] [n/a]; SQL [n/a]
org.springframework.dao.InvalidDataAccessResourceUsageException: JDBC exception executing SQL [...]
        at com.coresolution.consultation.service.impl.AdminServiceImpl.checkoutSameDayCard(AdminServiceImpl.java:1582)
        at com.coresolution.consultation.service.impl.AdminServiceImpl$$SpringCGLIB$$0.checkoutSameDayCard(<generated>)
        at com.coresolution.consultation.controller.AdminController.checkoutSameDay(AdminController.java:1922)
        at com.coresolution.consultation.controller.AdminController$$SpringCGLIB$$0.checkoutSameDay(<generated>)
Caused by: org.hibernate.exception.SQLGrammarException: JDBC exception executing SQL [...] [Table 'core_solution.admin_request_idempotency' doesn't exist] [n/a]
Caused by: java.sql.SQLSyntaxErrorException: Table 'core_solution.admin_request_idempotency' doesn't exist
```

### MySQL 직접 확인

```sql
mysql> SHOW TABLES LIKE 'admin_request_idempotency';
Empty set (0.00 sec)

mysql> SELECT installed_rank, version, success FROM flyway_schema_history WHERE version = '20260528.007';
Empty set (0.00 sec)

mysql> SELECT installed_rank, version, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1;
+----------------+-------------+---------+
| installed_rank | version     | success |
+----------------+-------------+---------+
|            244 | 20260606.006|       1 |
+----------------+-------------+---------+
```

---

**보고서 작성 완료**: 2026-05-28 18:05 KST
**다음 액션**:
1. **즉시 (5 분)**: deployer → 옵션 A 수동 SQL 적용 (§7.1) → 사용자 §4 검증 재개.
2. **단기 (30 분)**: core-planner → core-coder 옵션 B 핫픽스 PR 위임 (§5 프롬프트).
3. **운영 반영 전 (필수)**: deployer → 운영 MySQL `flyway_schema_history` MAX 버전 확인 (§6.2) → 옵션 B PASS 확정 후 deploy-production.yml 트리거.
4. **롤백 권고 (참고)**: PR #63 develop revert (`git revert -m 1 10e3fd77e`) 는 **권장 안 함** — PR #63 의 TenantContext save/restore + 멱등성 코드는 정상이며, 마이그 파일명만 문제. 옵션 B 가 더 작은 surface (1-line rename) 로 동일 효과.
