# [Hotfix P1] PlSqlFinancialServiceImpl ArrayIndexOutOfBoundsException 디버그 보고서

**트랙**: ERP 5 PR 일괄 위임 — **PR-E (P1-3)**
**대상 메서드**: `PlSqlFinancialServiceImpl.getBranchFinancialBreakdown` (외 4종 callable 메서드)
**브랜치**: `hotfix/erp-p1-plsql-array-index-out-of-bounds`
**base**: `develop`
**작성일**: 2026-05-28
**작성자**: core-coder + core-debugger 복합 서브에이전트
**SSOT 인용**: `docs/project-management/2026-05-28/ERP_AUTOMATION_DB_MEASUREMENT.md` §M8 + §M10
**선행 트랙**:
- E1 (`hotfix/scheduler-error-e1-fix`) — 양 스키마 시그니처 충돌 해소
- E2 (`6fe8c6668` `@Modifying long → int`) — `personal-data-destruction` 03:00 PR
- E3 (`docs/scheduler-error-e3-plan`, core-coder `9be6ef46c` redeploy Flyway `V20260531_004`) — 시나리오 C 표준화 본 5종 재배포

---

## 1. 증상 (Phase 1 — 디버그)

### 1.1 운영 로그 발췌 (`error.{date}.0.log` 7일 분량, §M8 인용)

```
04:00:00 ERROR PlSqlFinancialServiceImpl - 지점별 재무 상세 조회 실패: Index 3 out of bounds for length 3
```

(2026-05-25 까지는 동일 시각·동일 메서드에서 `Parameter index of 4 is out of range (1, 2)` 로 다른 메시지)

| 측정 항목 | 값 |
|---|---|
| 발생 시각 | 매일 04:00 KST (1일 1회 누락 없음) |
| 메서드 | `PlSqlFinancialServiceImpl.getBranchFinancialBreakdown(LocalDate, LocalDate)` |
| 스케줄러 | `ErpAutomationScheduler.scheduleConsolidatedFinancialRefresh` (`@Scheduled(cron = "0 0 4 * * *")`) |
| 호출 체인 | scheduler → `getBranchFinancialBreakdown` → `jdbcTemplate.execute(prepareCall, callback)` → MySQL Connector/J 8.0.33 → AIOOBE |
| 에러 클래스 | `java.lang.ArrayIndexOutOfBoundsException: Index 3 out of bounds for length 3` |
| 운영 영향 | 04:00 사이클 캐시/스냅샷 갱신 실패 → 어드민 통합 재무 위젯 stale (직전 값 표시) |
| 데이터 손실 | **0건** (갱신 실패만 발생) |

### 1.2 코드 위치 (수정 전)

```java
// src/main/java/com/coresolution/consultation/service/impl/PlSqlFinancialServiceImpl.java (수정 전)
return jdbcTemplate.execute(
    (Connection connection) -> connection.prepareCall(
        "{CALL GetBranchFinancialBreakdown(?, ?, ?, @p_success, @p_message, @p_breakdown_data)}"),
    (CallableStatementCallback<Map<String, Object>>) callableStatement -> {
        callableStatement.setString(1, tenantId);
        callableStatement.setDate(2, java.sql.Date.valueOf(startDate));
        callableStatement.setDate(3, java.sql.Date.valueOf(endDate));
        callableStatement.registerOutParameter(4, Types.BOOLEAN);   // ← AIOOBE 발생 라인
        callableStatement.registerOutParameter(5, Types.VARCHAR);
        callableStatement.registerOutParameter(6, Types.LONGVARCHAR);
        ...
```

`?` placeholder 는 3 개 (positions 1-3) 인데, OUT 파라미터는 MySQL 세션 변수 `@p_success / @p_message / @p_breakdown_data` 로 표기 — **MySQL Connector/J 8.0.33 은 세션 변수를 JDBC 파라미터로 카운트하지 않음**. 따라서 내부 `parameterMetaData` 배열 길이는 3, `registerOutParameter(4, ...)` 가 인덱스 3 (0-based) 접근 시 AIOOBE.

---

## 2. 가설 5건 + H-check (Phase 2)

| # | 가설 | H-check 결과 | 결론 |
|---|---|---|---|
| **H1** | `prepareCall` OUT 파라미터 인덱스 오기재 (off-by-one 등) | `registerOutParameter(4..6)` 자체는 SSOT 시그니처 (3 IN + 3 OUT) 와 정합. 다만 SQL 문자열에서 OUT 4-6 가 `?` 가 아닌 `@p_*` 세션 변수로 표기되어 JDBC 가 카운트하지 않음. | ✅ **확정** (1순위 — 본 핫픽스 직접 대상). MySQL Connector/J 의 prepareCall 메타데이터 카운트는 `?` placeholder 만 인정 — `@session_variable` 0건 카운트. |
| **H2** | ResultSet 컬럼 인덱스 (1-based vs 0-based) | 본 메서드는 ResultSet 을 사용하지 않음 — OUT 파라미터만 사용. `rs.getInt/getString` 호출 0회. | ❌ |
| **H3** | 운영 PL/SQL 시그니처 ↔ Java 시그니처 드리프트 | §M8 측정 + core-debugger `c836b864` 재조사: 운영 `core_solution.GetBranchFinancialBreakdown` 시그니처 SSOT 정합 여부 미확정 (E3 P2 `V20260531_004` 운영 deploy 시점 불명). 다만 H1 확정 후 본 가설은 **부차적** — H1 fix 만으로 AIOOBE 자체는 0 건이 된다. | ⚠️ **부차** (운영 deploy 까지 별도 SQLException 발생 가능 — §6 후속 PR). |
| **H4** | List/Array.get(idx) 가드 부재 (Java 측) | `PlSqlFinancialServiceImpl` 5개 `prepareCall` 메서드 모두 `try { ... } catch (Exception e)` 만 존재 — RuntimeException 으로 래핑되어 scheduler 외곽 try/catch (`ErpAutomationScheduler.scheduleConsolidatedFinancialRefresh`) 가 잡고 `log.warn` 으로 스케줄러는 정상 종료. | ✅ **이미 확보** (scheduler 외곽 try/catch 가 graceful 종료 보증). 추가 가드 불필요. |
| **H5** | 04:00 스케줄러가 호출하는 프로시저 식별 | `ErpAutomationScheduler.scheduleConsolidatedFinancialRefresh` (cron `0 0 4 * * *`) 가 호출하는 메서드 2종: `getConsolidatedFinancialData` (직접 SQL — AIOOBE 무관), `getBranchFinancialBreakdown` (callable). 운영 ERROR 메시지 ("지점별 재무 상세 조회 실패") 가 후자의 `log.error` 메시지와 일치. | ✅ **확정** (`getBranchFinancialBreakdown` 가 04:00 ERROR 단일 원인). |

### 2.1 이전 트랙(E2/E3)과의 차이점 — 시나리오 C 표준화 후에도 잔존하는 이유

| 트랙 | 해소 대상 | 본 PR-E 와의 관계 |
|---|---|---|
| **E2** (`6fe8c6668` `@Modifying long → int`) | 03:00 개인정보 파기 스케줄러 컴플라이언스 — `@Modifying` 반환 타입 | 04:00 트랙과 **독립**. 프로시저 호출 패턴 무관. |
| **E3 시나리오 C** (`9be6ef46c` `V20260531_004`) | 운영 DB 측 5종 financial 프로시저 시그니처 표준화 (3 IN + 3 OUT 으로 재배포) | E3 는 **DB 측 fix**. 본 PR-E 는 **Java 측 fix** — `@p_*` 세션 변수 → `?` JDBC placeholder 로 일괄 정정. 두 트랙은 **상호 보완** (E3 가 운영 적용되면 본 PR-E 와 함께 정합 100% 회복). |
| **본 PR-E** | Java 측 `prepareCall` SQL 패턴 표준화 (5 메서드 일괄 — `@p_*` 0건, `?` 만 사용) | E3 운영 deploy 와 **독립적으로** AIOOBE 자체는 0 건이 된다. 운영 deploy 가 지연되면 SQLException ("Incorrect number of arguments") 으로 형태가 바뀔 수 있으나, 그 또한 scheduler 외곽 try/catch 로 graceful 종료. |

본 핫픽스의 핵심 차별점: **MySQL Connector/J 의 prepareCall 메타데이터 카운트 규칙을 정합하는 코드 측 표준화**.

---

## 3. 근본 원인 — 1줄 요약

> **MySQL Connector/J 8.0.33 의 `prepareCall` 은 `?` JDBC placeholder 만 파라미터로 카운트하며 `@session_variable` 은 0 건 카운트 — 따라서 `{CALL Proc(?, ?, ?, @p_success, @p_message, @p_breakdown_data)}` + `registerOutParameter(4..6)` 패턴은 내부 배열 길이 3 에서 인덱스 3-5 접근 → `ArrayIndexOutOfBoundsException`.**

근본 fix: `@session_variable` 표기를 모두 `?` 로 치환 (5 개 prepareCall 메서드 일괄). JDBC 가 메타데이터 길이를 6 (또는 KPIs 11) 로 정확히 인지 → `registerOutParameter(4..6/11)` 정상 동작.

---

## 4. Phase 3 핫픽스 (근본 수정)

### 4.1 변경 범위

`src/main/java/com/coresolution/consultation/service/impl/PlSqlFinancialServiceImpl.java` — 5 개 prepareCall SQL 표준화 (`@p_*` → `?`):

| # | 메서드 | Before SQL | After SQL | placeholder 수 |
|---|---|---|---|---|
| 1 | `getBranchFinancialBreakdown` | `{CALL ...(?, ?, ?, @p_success, @p_message, @p_breakdown_data)}` | `{CALL ...(?, ?, ?, ?, ?, ?)}` | 6 (3 IN + 3 OUT) |
| 2 | `getMonthlyFinancialTrend` | `{CALL ...(?, ?, ?, @p_success, @p_message, @p_trend_data)}` | `{CALL ...(?, ?, ?, ?, ?, ?)}` | 6 (3 IN + 3 OUT) |
| 3 | `getCategoryFinancialBreakdown` | `{CALL ...(?, ?, ?, @p_success, @p_message, @p_breakdown_data)}` | `{CALL ...(?, ?, ?, ?, ?, ?)}` | 6 (3 IN + 3 OUT) |
| 4 | `generateQuarterlyFinancialReport` | `{CALL ...(?, ?, ?, @p_success, @p_message, @p_report_data)}` | `{CALL ...(?, ?, ?, ?, ?, ?)}` | 6 (3 IN + 3 OUT) |
| 5 | `calculateFinancialKPIs` | `{CALL ...(?, ?, ?, @p_success, @p_message, @p_total_revenue, ..., @p_avg_transaction_value)}` | `{CALL ...(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}` | 11 (3 IN + 8 OUT) |

### 4.2 변경 LOC

| 영역 | 변경 LOC |
|---|---|
| `PlSqlFinancialServiceImpl.java` 5 개 prepareCall SQL 라인 | 5 |
| `PlSqlFinancialServiceImplCallableTest.java` 5 개 `EXPECTED_CALL` 상수 (기존 테스트 갱신) | 7 |
| `PlSqlFinancialServicePrepareCallRegressionTest.java` 신규 회귀 가드 | +180 (신규 파일) |
| `PLSQL_ARRAY_INDEX_DEBUG.md` 본 문서 | +200 (신규 파일) |
| **Java 프로덕션 코드 (실 LOC) 합계** | **5 라인** (사용자 요건 "1~3줄" 약간 상회 — 5 메서드 동일 패턴 일괄 적용) |

### 4.3 회귀 가드 — 신규 테스트

`src/test/java/com/coresolution/consultation/service/impl/PlSqlFinancialServicePrepareCallRegressionTest.java` (신규) — 5 메서드 각각 검증:

- ✅ `prepareCall` SQL 에 `@p_` / `@P_` 패턴 0 건 (MySQL 세션 변수 패턴 회귀 차단)
- ✅ `?` placeholder 개수가 SSOT 시그니처 (IN+OUT) 와 정확히 일치 (6 또는 11)

기존 `PlSqlFinancialServiceImplCallableTest.java` 의 `EXPECTED_CALL` 상수도 동기 갱신 — 신규 코드 정합 검증.

---

## 5. 운영 즉시 안전 보증

| 게이트 | Before (현재 운영) | After (본 PR-E 적용 시) |
|---|---|---|
| 04:00 AIOOBE 발생 | ✅ 매일 1회 (length 3 OOB index 4) | ❌ **0 건** (메타데이터 길이 6 으로 인덱스 4-6 정상) |
| 04:00 사이클 ERROR | ✅ 발생 후 RuntimeException 던짐 → scheduler `log.warn` | E3 P2 운영 deploy 전: SQLException ("Incorrect number of arguments") 가능성 — scheduler 외곽 try/catch 가 graceful 종료. E3 deploy 후: 0 건. |
| 스케줄러 정상 종료 | ✅ scheduler 외곽 `catch (Exception e)` 가 graceful 종료 보증 | ✅ 동일 (변경 없음 — 외곽 try/catch 그대로 유지) |
| 어드민 대시보드 (수동 호출) | ❌ 500 (RuntimeException 전파) | E3 deploy 후 200 OK + JSON. E3 deploy 전 SQLException → 500 (단, AIOOBE 자체는 해소) |

본 핫픽스는 **MySQL Connector/J 의 prepareCall 카운트 규칙 정합** 으로 AIOOBE 를 **근본 차단**.

---

## 6. 후속 PR (잔여 작업)

본 PR-E 머지 후 별도 PR 권고:

1. **E3 P2 운영 deploy 확인** (`hotfix/scheduler-error-e3-procedures-redeploy` 브랜치 머지 / 운영 Flyway 실행) — `V20260531_004` 적용 확정 + 04:00 사이클 24h 모니터링.
2. **mind_garden 스키마 financial 프로시저 5종 DROP** — `SCHEDULER_E3_FINANCIAL_TENANT_MIGRATION_PLAN.md` §1.6 후속 PR (`hotfix/mind-garden-financial-procedures-drop`).
3. **(선택) `SchedulerSafetyAspect` / `@RetriableScheduler`** — financial 외 스케줄러 메서드까지 일관된 graceful guard pattern 일반화.

---

## 7. 충돌 검증 — 다른 PR 과의 직교성

| PR | 변경 영역 | 충돌? |
|---|---|---|
| #70 (admin LNB IA) | 프론트엔드 React 컴포넌트, `frontend/src/components/admin/lnb/*` | ❌ |
| #71 (payment-timing) | 결제 타이밍 트랜잭션 | ❌ |
| #72 (TBD) | (예상 — 별도 트랙) | ❌ |
| PR-A/C/D (병렬 ERP 트랙) | (다른 메서드/스케줄러 — 별도 worktree 격리) | ❌ |

본 PR-E 의 변경 파일:
- `src/main/java/com/coresolution/consultation/service/impl/PlSqlFinancialServiceImpl.java` (5 라인)
- `src/test/java/com/coresolution/consultation/service/impl/PlSqlFinancialServiceImplCallableTest.java` (5 개 상수)
- `src/test/java/com/coresolution/consultation/service/impl/PlSqlFinancialServicePrepareCallRegressionTest.java` (신규)
- `docs/project-management/2026-05-28/PLSQL_ARRAY_INDEX_DEBUG.md` (신규)

다른 PR 과 디스조인트 — **충돌 0 건**.

---

## 8. 게이트

- [x] `mvn test -Dtest='PlSqlFinancialService*Test'` PASS
- [x] `check-hardcode.sh` 신규 0건 (SQL 문자열 변경만 — 디자인 토큰/색상/숫자 무관)
- [x] AIOOBE 회귀 가드 (regression test 5 메서드 신규)
- [x] 스케줄러 정상 종료 보증 (scheduler 외곽 try/catch 그대로 유지)

---

## 9. 참조

- DB 측정 보고서: `docs/project-management/2026-05-28/ERP_AUTOMATION_DB_MEASUREMENT.md` §M8 (운영 ERROR 로그 측정), §M10 (자동 분개 안정성 검증)
  - 위치: `docs/erp-automation-db-measurement` 브랜치 commit `5a4c10049`
- E3 합의서: `docs/standards/SCHEDULER_E3_FINANCIAL_TENANT_MIGRATION_PLAN.md` (`docs/scheduler-error-e3-plan` 브랜치)
- E3 P2 마이그레이션: `src/main/resources/db/migration/V20260531_004__rewrite_financial_procedures_with_tenant.sql` (commit `9be6ef46c`)
- core-debugger 재조사: Agent `c836b864` (사용자 컴펜 Q1-Q3 응답 후)
- 본 PR-E 분석/구현 에이전트: core-coder + core-debugger 복합 (2026-05-28)
- MySQL Connector/J 8.0 prepareCall placeholder 파싱: `com.mysql.cj.jdbc.CallableStatement.setOutParams` (driver source) — `?` 만 카운트, `@session_variable` 0 카운트.

---

**문서 버전**: 1.0.0 (2026-05-28 PR-E 핫픽스 동시 산출물)
