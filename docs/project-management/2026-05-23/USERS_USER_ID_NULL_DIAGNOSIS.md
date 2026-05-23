# users.user_id NULL 어드민 계정 진단 (운영, 2026-05-23)

- **역할**: core-debugger (읽기 전용 진단)
- **대상 환경**: 운영 (`beta74.cafe24.com`, DB `core_solution`, host `localhost:3306`)
- **운영 main HEAD**: `e88a264a9 fix(admin-notification): sent_by_username NOT NULL 위반 핫픽스 (Logger 단일 지점 fallback)`
- **점검 시각**: 2026-05-23 19:00 KST
- **모든 SQL 읽기 전용 (SELECT)** — UPDATE/DELETE/INSERT **0건**
- 자격증명·시크릿은 본 보고서에 평문 노출하지 않음 (운영 systemd `Environment=DB_PASSWORD=***` 마스킹)

## 0. 요약 (TL;DR)

| 항목 | 결과 |
| --- | --- |
| 운영 DB `users.user_id` IS NULL 또는 `''` (active) | **0건** |
| 운영 DB `users` 전체 (deleted 포함) `user_id` NULL/empty | **0건** |
| `users.user_id` DDL 제약 (운영) | `varchar(50) NOT NULL UNIQUE` — 엔티티와 일치 |
| `admin_test_notification_logs` 누적 | 2건 (정상 1 / fallback `user-N` **1**) |
| fallback 발화 로그파일 grep | **0건** (운영 root logger ERROR — `log.warn` 미기록) |
| Flyway 표준화(`username → user_id`) 적용 | ✅ `installed_rank=97`, version `20251208.002`, success=1, `installed_on=2026-04-01 10:39:07` |

**핵심 발견**: 운영 DB `users` 27건 모두 `user_id` 가 채워져 있음에도 fallback 이 1회 실제 발화했다 (`sent_by_username = "user-2"`, `sent_by_user_id = 2`). DB id=2 의 실제 `user_id` 는 `agisunny`. **NULL 의 출처는 DB 가 아니라 caller 측 메모리 객체** (세션·SecurityContext 의 `User` 인스턴스에서 `userId` 필드가 비어 있던 케이스) 로 강하게 의심된다.

→ **핫픽스 (`AdminTestNotificationLogger#resolveSentByUsername`)는 정확한 단일 보호 지점이며, 데이터 보강만으로는 회귀 차단이 불가능**하다 (DB 는 이미 정상). 추가 대응은 **호출부의 User 인스턴스 식별 안정성** 보강이 옳다 (§6 권고).

---

## 1. 영향 카운트 (진단 SQL #1 / 보강)

### 1.1 user_id NULL/empty 카운트 (active + 전체)

```text
+--------------+--------------+---------------+-----------------------+
| total_active | user_id_null | user_id_empty | user_id_null_or_empty |
+--------------+--------------+---------------+-----------------------+
|           27 |            0 |             0 |                     0 |
+--------------+--------------+---------------+-----------------------+
+-------------------------+--------------+---------------+-----------------------+
| total_including_deleted | user_id_null | user_id_empty | user_id_null_or_empty |
+-------------------------+--------------+---------------+-----------------------+
|                      27 |            0 |             0 |                     0 |
+-------------------------+--------------+---------------+-----------------------+
```

- 운영 `users` 테이블 전체 27건. `deleted_at` 처리된 행 자체가 0건.
- `user_id IS NULL` / `user_id = ''` / 공백·whitespace-only / 좌우 공백 — **전부 0건**.

### 1.2 role 분포 (전체 active)

```text
+------------+-----+
| role       | cnt |
+------------+-----+
| CLIENT     |  24 |
| CONSULTANT |   2 |
| ADMIN      |   1 |
+------------+-----+
```

- 운영 어드민 권한 계정은 **단 1건** (id=2, user_id=`agisunny`, tenant=`tenant-incheon-counseling-001`).
- 진단 SQL #2 (영향 계정 샘플 LIMIT 20) — `WHERE (user_id IS NULL OR user_id = '')` → **빈 결과셋** (대상 0건).
- 컬럼명 비고: 실제 운영 DDL 은 `role` (varchar(20))이며 기획서 SQL 의 `role_code` 는 존재하지 않음 (mysql 1054 에러). `role` 컬럼으로 치환해 실행.

## 2. NOT NULL 제약 실제 상태 (진단 SQL #3)

```text
+-------------+-------------+----------------+-------------+------------+
| COLUMN_NAME | IS_NULLABLE | COLUMN_DEFAULT | COLUMN_TYPE | COLUMN_KEY |
+-------------+-------------+----------------+-------------+------------+
| user_id     | NO          | NULL           | varchar(50) | UNI        |
+-------------+-------------+----------------+-------------+------------+
```

- 운영 DDL: `user_id varchar(50) NOT NULL UNIQUE` (PRIMARY 가 아니라 UNI).
- 엔티티 (`com.coresolution.consultation.entity.User`, line 47 / 59):
  - `@UniqueConstraint(name = "UK_users_user_id", columnNames = {"user_id"})`
  - `@Column(name = "user_id", nullable = false, unique = true, length = 50)`
- **엔티티 ↔ DDL 정합**. 표준화 V20251208_002 이후 어긋남 없음.

## 3. social_provider 분포 (진단 SQL #4)

- `WHERE (user_id IS NULL OR user_id = '')` — **빈 결과셋** (영향 계정 0건이므로 분포 자체가 존재하지 않음).
- 참고: 운영 유일 어드민(`agisunny`) 의 `social_provider` 는 NULL (자체 로그인).

## 4. Flyway 이력 (진단 SQL #5, `users`/표준화 관련)

```text
+----------------+--------------+------------------------------------------------------------------+---------+---------------------+
| installed_rank | version      | description                                                      | success | installed_on        |
+----------------+--------------+------------------------------------------------------------------+---------+---------------------+
|            183 | 20260513.001 | ensure users counseling enabled and professional type idempotent |       1 | 2026-05-11 04:26:01 |
|            177 | 20260510.005 | repair users professional provider after out of order            |       1 | 2026-05-11 04:04:00 |
|            168 | 20260424.005 | users notification channel preference                            |       1 | 2026-04-27 12:06:10 |
|            139 | 20260329.001 | align clients tenant id with users for client role               |       1 | 2026-04-01 11:18:18 |
|            124 | 20260227.001 | extend users profile image url to longtext                       |       1 | 2026-04-01 11:03:53 |
|            108 | 20251223.001 | fix create tenant admin account user id                          |       1 | 2026-04-01 10:55:13 |
|             97 | 20251208.002 | rename username to user id                                       |       1 | 2026-04-01 10:39:07 |
|             68 | 67           | add is password changed to users                                 |       1 | 2026-04-01 09:42:58 |
|             63 | 62           | fix user id generation in tenant procedure                       |       1 | 2026-04-01 09:22:50 |
+----------------+--------------+------------------------------------------------------------------+---------+---------------------+
```

핵심 추적:

- `V20251208_002__rename_username_to_user_id` — **표준화 적용 ✅**. `ALTER TABLE users CHANGE COLUMN username user_id VARCHAR(50) NOT NULL` + `UK_users_user_id` UNIQUE. 운영 적용 완료.
- `V20251223_001__fix_create_tenant_admin_account_user_id` — 테넌트 어드민 생성 프로시저에서 `user_id` 생성 로직 수정(`email local-part` → 충돌 시 `<email>1,2,...`, 최종 fallback `admin-<UUID>-<tenant>`). 운영 적용 완료.
- `V62__fix_user_id_generation_in_tenant_procedure` — 동일 계열 프로시저 보강. 운영 적용 완료.
- **결론**: 마이그레이션 이력상 `user_id` 컬럼은 표준화 직후부터 일관되게 NOT NULL 로 유지되었고, 신규 어드민 생성 경로도 항상 `user_id` 를 채워 INSERT 한다. 운영 DB 0건 결과와 정합.

## 5. fallback 발화 실측

### 5.1 application 로그 grep (예상 안 잡힘)

```text
$ grep -aiE "sentByUsername null/blank|fallback 사용" \
    /var/www/mindgarden/releases/{blue,green}/logs/coresolution.log
(empty)
```

이유:

- `src/main/resources/logback-spring.xml` — **운영(prod) root logger 가 `ERROR`** (Line 140~142). 핫픽스의 `log.warn("sentByUsername null/blank → fallback 사용: ...")` 는 운영 로그 파일에 **기록되지 않음**.
- `coresolution.log` rolling file appender 도 `ThresholdFilter ERROR` 적용 (Line 32 / 53 / 101 / 108~135). WARN 이하 모두 차단.

### 5.2 sql-error.log — 핫픽스 직전 회귀 흔적 (2건)

```text
/var/www/mindgarden/releases/blue/logs/sql-error.log:
  2026-05-23 18:28:41.665 [http-nio-8080-exec-7]  ERROR o.h.e.jdbc.spi.SqlExceptionHelper - Column 'sent_by_username' cannot be null
  2026-05-23 18:29:31.014 [http-nio-8080-exec-21] ERROR o.h.e.jdbc.spi.SqlExceptionHelper - Column 'sent_by_username' cannot be null
```

- 핫픽스 jar 배포 시각: `/var/www/mindgarden/releases/{blue,green}/app.jar` mtime `2026-05-23 18:50~18:51 KST`.
- 에러 2건 시각 (18:28 / 18:29) 은 **핫픽스 적용 직전 회귀**. 동일 admin (`agisunny`, id=2) 의 발송 시도로 추정.
- 핫픽스 적용 후 sql-error.log 에 동일 패턴 **0건**.

### 5.3 DB 기반 fallback 실측 (admin_test_notification_logs)

`log.warn` 이 운영에 안 남으므로, DB 의 `sent_by_username` 패턴 (`^user-[0-9]+$` 또는 `system`) 으로 누적 fallback 발화를 실측.

```text
+------------+-----------------+-----------------+--------+
| total_logs | fallback_user_n | fallback_system | normal |
+------------+-----------------+-----------------+--------+
|          2 |               1 |               0 |      1 |
+------------+-----------------+-----------------+--------+
+-----------------+--------------+
| sent_by_user_id | fallback_cnt |
+-----------------+--------------+
|               2 |            1 |
+-----------------+--------------+
```

상세 row 덤프:

```text
+----+-------------------------------+-----------------+------------------+----------+---------+---------------------+
| id | tenant_id                     | sent_by_user_id | sent_by_username | channel  | success | sent_at             |
+----+-------------------------------+-----------------+------------------+----------+---------+---------------------+
|  1 | tenant-incheon-counseling-001 |               2 | agisunny         | ALIMTALK |       1 | 2026-05-23 00:14:36 |  ← 정상
|  2 | tenant-incheon-counseling-001 |               2 | user-2           | SMS      |       1 | 2026-05-23 18:56:54 |  ← fallback
+----+-------------------------------+-----------------+------------------+----------+---------+---------------------+
```

- **fallback 실측 = 1건**, 영향 어드민 = `sent_by_user_id=2` 단일 계정.
- 진단 SQL 결과(영향 계정 0건) 와 **표면적 불일치**처럼 보이지만:
  - 동일 `id=2` 행의 DB 값 `user_id="agisunny"` 는 정상(NOT NULL).
  - 같은 어드민이 같은 날 00:14 에 보낸 ALIMTALK 로그 (id=1) 는 `sent_by_username="agisunny"` 로 정상 기록.
  - 즉 **caller 측 메모리 `User` 인스턴스가 18:28~18:56 사이에 `userId=null`** 인 상태였다는 결론. (자세한 가설은 §6)

## 6. 원인 가설 (caller 측 User 인스턴스에서 userId 누락)

DB 는 정상인데 caller 가 NULL 을 넘기는 경로:

1. **세션 캐시 stale 가설** — `SessionUtils.getCurrentUser(HttpSession)` 는 `session.getAttribute(SessionConstants.USER_OBJECT)` 를 먼저 반환한다 (`src/main/java/com/coresolution/consultation/utils/SessionUtils.java#L58~85`). 세션 저장 시점에 만든 `User` 직렬화본의 `userId` 필드가 빈 경우 (예: 표준화 V20251208_002 이전 로그인 → Redis/세션 store 잔존 직렬화본의 `username` 필드만 가지고 있고 신규 `userId` 필드는 default null → DB 재조회 없이 그대로 반환), `currentUser.getUserId()` 가 null 이 된다.
2. **SecurityContext fallback 경로** — 세션이 없을 때 `authentication.getDetails()` 가 `instanceof User` 이면 그대로 반환 (`SessionUtils.java#L72~74`). `SessionBasedAuthenticationFilter` 가 만드는 User 가 PK·email 만 채우고 `userId` 를 비워둘 가능성. (해당 필터 추가 점검 권장)
3. **소셜 로그인 가설** — V62/V20251223 가 신규 어드민 생성 시 `user_id` 를 채우지만, 소셜 로그인 콜백 경로에서 in-memory `User` 만들 때 `userId` 를 set 하지 않고 logger 까지 전달할 가능성. 다만 운영 유일 admin(`agisunny`) 의 `social_provider` 는 NULL → 본 케이스에는 적용되지 않음.
4. **부분 프로젝션 가설** — `User` 를 일부 컬럼만 select 하는 native query/projection 으로 새로 만들고 세션에 다시 넣었을 가능성. 운영 18:28 직전 어떤 코드 경로가 User 를 갱신했는지 추적 필요.

세 가설 모두 “DB 는 정상, in-memory User 만 null” 패턴과 정합. **DB 데이터 보강(UPDATE)** 으로는 해결되지 않는다 — 핫픽스의 Logger 단일 sanitize 가 정확한 방어 지점.

## 7. 권고

### 7.1 (확정) 핫픽스 유지

- `AdminTestNotificationLogger#resolveSentByUsername` 의 `null/blank → "user-<id>" → "system"` 단계적 sanitize 는 **유지**. NOT NULL 컬럼 보호의 단일 책임 지점.
- 향후 동일 패턴이 다른 `*Logger` 로 번질 가능성을 줄이기 위해 **`NotificationActorResolver` 같은 공통 유틸로 추출**해 logger·dispatcher·audit 가 같은 sanitize 를 공유하도록 캡슐화 가능 (core-component-manager 협업, core-coder 위임).

### 7.2 (권장) caller 측 User 인스턴스 식별 안정성 보강

근본 차단을 위해 다음 중 1~2 항 채택:

- **(a) Session/SecurityContext User refresh 가드**: `SessionUtils.getCurrentUser` 에 “`userId` 가 null/blank 이면 PK 로 DB 재조회 후 세션 갱신” fallback 을 단일 지점에 추가. **세션 stale 가설 차단**.
- **(b) 세션 schema bump**: `SessionConstants.USER_OBJECT` 키를 v2 로 바꾸고, 신 키에 user_id 가 채워진 경우만 신뢰 — 기존 직렬화본 invalidate.
- **(c) login/social-callback 경로 audit**: 모든 진입 경로 (`AuthController`, OAuth2 콜백, SessionBasedAuthenticationFilter) 에서 세션에 넣기 직전 User.userId 가 채워졌는지 assertion (`Objects.requireNonNull` 또는 명시 로그) 추가.

### 7.3 (선택) 로그 가시성 보강

- 운영 root level=ERROR 이지만 `AdminTestNotificationLogger` 만 namespace 단위로 `WARN` 노출 권장 (logback-spring.xml `<springProfile name="prod">` 안에 `<logger name="com.coresolution.consultation.service.impl.AdminTestNotificationLogger" level="WARN" additivity="true"/>` 추가). fallback 발화를 운영 로그에서 직접 카운트 가능.

### 7.4 (불필요) DB 데이터 보강

- 운영 DB `users.user_id` 0건 NULL → **데이터 UPDATE 불필요**. Flyway 데이터 fix PR 생성하지 말 것. (잘못된 진단으로 RW 패치가 들어가면 멀티테넌트 unique 충돌 위험.)

### 7.5 작업 분리 가이드

- 본 진단은 **문서 only** 로 마무리 (no-code-change).
- §7.1·§7.2 코드 변경 시 별도 PR 로 분리, **core-coder** 위임 + **core-tester** 게이트.
- §7.3 logback 변경은 deploy 워크플로 영향 없음 (config 재기동만 필요).

## 8. 사용한 SSH·SQL 명령 (재현용)

> 자격증명은 운영 systemd `Environment=` 에서만 읽으며, `MYSQL_PWD` 로 전달해 process listing 노출 최소화.

```bash
ssh root@beta74.cafe24.com \
  'export $(systemctl show mindgarden.service -p Environment --value \
       | tr " " "\n" | grep -E "^DB_") && \
   MYSQL_PWD="$DB_PASSWORD" mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" \
     -u "$DB_USERNAME" "$DB_NAME" -t -e "<진단 SQL>"'
```

본 보고서에 인용한 SQL:

- §1.1 합산 카운트, §1.2 role 분포 (컬럼명 `role` 로 치환)
- §2 `INFORMATION_SCHEMA.COLUMNS` 제약 조회
- §4 `flyway_schema_history` 표준화/users 필터
- §5.3 `admin_test_notification_logs` 의 `^user-[0-9]+$` / `system` 정규식 카운트 및 sent_by_user_id 분포

**UPDATE/DELETE/INSERT/ALTER 등 쓰기 쿼리 0건.**

## 9. 참고 코드/파일

- 핫픽스: `src/main/java/com/coresolution/consultation/service/impl/AdminTestNotificationLogger.java` (`resolveSentByUsername` L127~135)
- 호출부: `AdminTestNotificationServiceImpl#sendSms` / `#sendAlimtalk` L363, L414, L434 — `currentUser.getUserId()` 전달
- 호출부: `AdminManualNotificationServiceImpl` L114, L225 — `currentUser.getUserId()` 전달
- 컨트롤러: `AdminTestNotificationController#sendSms` / `#sendAlimtalk` (L139, L171) — `SessionUtils.getCurrentUser(session)` 결과를 그대로 전달
- 세션 조회: `src/main/java/com/coresolution/consultation/utils/SessionUtils.java#L58~85`
- 엔티티: `src/main/java/com/coresolution/consultation/entity/User.java#L47, L59`
- 표준화 마이그레이션: `src/main/resources/db/migration/V20251208_002__rename_username_to_user_id.sql`
- 로깅 설정: `src/main/resources/logback-spring.xml` (prod root=ERROR, L140~142)

## 10. 변경 이력

| 일시 | 변경 | 작성자 |
| --- | --- | --- |
| 2026-05-23 19:00 KST | 최초 작성 (core-debugger 진단) | MindGarden core-debugger |
