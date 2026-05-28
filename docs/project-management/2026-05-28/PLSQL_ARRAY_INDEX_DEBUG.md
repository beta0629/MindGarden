# PR-E P1 디버그 보고: PlSqlFinancialServiceImpl ArrayIndexOutOfBoundsException (매일 04:00)

**위임 트랙**: ERP 5 PR 일괄 위임 — PR-E
**브랜치**: `hotfix/erp-p1-plsql-array-index-out-of-bounds`
**우선순위**: P1 (DB 측정 보고서 §M8)
**작성일**: 2026-05-28
**작성자**: core-coder + core-debugger 복합 서브에이전트

---

## 1. 운영 로그 스택트레이스 (DB §M8 인용)

```
04:00:00 ERROR PlSqlFinancialServiceImpl - 지점별 재무 상세 조회 실패: Index 3 out of bounds for length 3
```

- **발생 빈도**: 매일 1회 (04:00 정각)
- **발생 시점**: 2026-05-26 운영 main `c759f97a8` 배포 이후에도 잔존
- **이전 변종 (~2026-05-25)**: `Parameter index of 4 is out of range (1, 2)` — 동일 근원이나 procedure signature 가 2 IN 이던 시점의 메시지 변종
- **출처 라인**: `PlSqlFinancialServiceImpl.java:114` (`getBranchFinancialBreakdown` 의 `catch` 블록)

```114:115:src/main/java/com/coresolution/consultation/service/impl/PlSqlFinancialServiceImpl.java
        } catch (Exception e) {
            log.error("❌ 지점별 재무 상세 조회 실패: {}", e.getMessage(), e);
```

---

## 2. 호출 경로 (04:00 스케줄러 → 실패)

```217:230:src/main/java/com/coresolution/consultation/scheduler/ErpAutomationScheduler.java
    @Scheduled(cron = "${scheduler.erp-consolidated-refresh.cron:0 0 4 * * *}")
    public void scheduleConsolidatedFinancialRefresh() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        runPerTenant("ConsolidatedFinancialRefresh", yesterday.toString(), () -> {
            try {
                plSqlFinancialService.getConsolidatedFinancialData(yesterday, yesterday);
                plSqlFinancialService.getBranchFinancialBreakdown(yesterday, yesterday);
                log.debug("[ErpAutomation] 통합 재무 갱신 완료: tenantId={}", TenantContextHolder.getTenantId());
            } catch (Exception e) {
                log.warn("[ErpAutomation] 통합 재무 갱신 실패: tenantId={}, error={}",
                    TenantContextHolder.getTenantId(), e.getMessage());
            }
        });
    }
```

- **04:00 스케줄러**: `ErpAutomationScheduler.scheduleConsolidatedFinancialRefresh()`
- **호출 1 (정상)**: `getConsolidatedFinancialData()` — pure SQL `queryForMap`, CallableStatement 없음
- **호출 2 (실패)**: `getBranchFinancialBreakdown()` — CallableStatement 사용, `prepareCall` 패턴 결함

---

## 3. 가설 5건 + H-check 결과

| # | 가설 | 결과 | 근거 |
|---|------|------|------|
| **H1** | `prepareCall` OUT 파라미터 인덱스 오기재 | **✅ CONFIRMED** | (3-1 절 참조) — `?` placeholder 와 `@session_variable` 혼합. MySQL Connector/J 8.0.33 은 `?` 만 카운트 → 내부 배열 길이 3, OUT 등록 idx 4-6 → `Index 3 out of bounds for length 3` |
| H2 | ResultSet 컬럼 인덱스 (1-based vs 0-based) | ❌ REJECTED | 실패 메서드들은 ResultSet 사용 0건. 모두 OUT 파라미터로만 결과 반환. ResultSet 사용처(`generateMonthlyFinancialReport` 등)는 컬럼 이름 기반 (numeric idx 미사용) |
| H3 | 프로시저 RESULT SET 컬럼 수 ↔ 코드 가정 불일치 | ❌ REJECTED | SSOT (`database/schema/procedures_standardized/GetBranchFinancialBreakdown_standardized.sql`) = 3 IN + 3 OUT. `registerOutParameter(4=BOOLEAN, 5=VARCHAR, 6=LONGVARCHAR)` 매칭 정확 |
| H4 | List/Array.get(idx) NPE 가드 부재 | ❌ REJECTED | 예외 타입 = `ArrayIndexOutOfBoundsException` (RuntimeException), NPE 아님. 실패 메서드에 `List.get(idx)` 호출 0건 |
| **H5** | 04:00 스케줄러 호출 프로시저 중 어느 것이 원인 | **✅ CONFIRMED — `getBranchFinancialBreakdown`** | (2 절 참조) — 04:00 스케줄러는 2개 메서드를 직렬 호출. 첫 호출은 pure SQL 로 정상, 두 번째 (`getBranchFinancialBreakdown`) 가 `prepareCall` 결함으로 실패. ERROR 메시지 본문 "지점별 재무 상세 조회 실패" 가 정확히 일치 |

### 3-1. H1 — 핵심 근원 분석

**문제 패턴 (E2/E3 표준화 후 잔존)**:
```java
connection.prepareCall("{CALL GetBranchFinancialBreakdown(?, ?, ?, @p_success, @p_message, @p_breakdown_data)}")
// 이후
callableStatement.registerOutParameter(4, Types.BOOLEAN);
callableStatement.registerOutParameter(5, Types.VARCHAR);
callableStatement.registerOutParameter(6, Types.LONGVARCHAR);
```

**MySQL Connector/J 8.0.33 동작**:
- `prepareCall` 파서는 SQL 의 `?` placeholder 만 카운트하여 파라미터 메타 배열을 할당. 본 SQL = `?` 3개 → 길이 3
- `@p_success` 등은 MySQL **server-side session variable** 로 JDBC 파라미터가 아님 (드라이버는 무시)
- `registerOutParameter(4, ...)` 호출 시 내부적으로 `paramInfo[4-1] = ...` 시도 → 배열 길이 3 인데 idx 3 접근 → **`ArrayIndexOutOfBoundsException: Index 3 out of bounds for length 3`**
- ~5-25 시점의 메시지 `Parameter index of 4 is out of range (1, 2)` 는 동일 근원의 다른 변종 메시지 (procedure 가 2 IN 이었던 시점)

**SSOT 정합 패턴 (동일 코드베이스 `StoredProcedureServiceImpl.java:125` 등)**:
```java
connection.prepareCall("{CALL CheckTimeConflict(?, ?, ?, ?, ?, ?, ?, ?)}")  // 모든 파라미터 ? 사용
cs.registerOutParameter(7, Types.BOOLEAN);
cs.registerOutParameter(8, Types.VARCHAR);
```
이 패턴은 운영 로그상 0건 ERROR 로 안정 동작 중.

---

## 4. 이전 트랙(E2/E3) 와의 차이 — 시나리오 C 표준화 후 잔존 이유

| 트랙 | 대상 | 효과 | PR-E 와의 관계 |
|------|------|------|----------------|
| E2 | `@Modifying long→int` | 영속성 시그니처 정합 | 무관 — PR-E 는 JDBC `prepareCall` SQL 파싱 결함 |
| E3 | procedure signature drift (`tenant_id` 추가, IN 2→3) | DB 측 시그니처 SSOT 통일 | 부분 — Java 코드 측 IN 파라미터 (`?, ?, ?`) 는 정합되었으나 OUT 파라미터를 `@session_variable` 로 남겨둔 패턴이 commit `60773fb01` (프로시저 표준화 완료 및 테스트 코드 작성) 에서 도입됨. 단위 테스트도 동일하게 잘못된 패턴을 codify 하여 PR 리뷰에서 미감지 |
| **PR-E** | **`prepareCall` 파라미터 표기 (`@p_xxx` → `?`) 통일** | **MySQL Connector/J ArrayIndex 제거** | E2/E3 잔존 ERROR 5-26 이후에도 매일 1건 `04:00:00 ERROR` (§M8 §287) — PR-E 가 본 트랙 |

---

## 5. 핫픽스 (최소 침습 fix)

### 5-1. 변경 대상 (5개 prepareCall 문자열)
| # | 메서드 | 라인 | Before | After |
|---|--------|------|--------|-------|
| 1 | `getBranchFinancialBreakdown` | 87 | `?, ?, ?, @p_success, @p_message, @p_breakdown_data` | `?, ?, ?, ?, ?, ?` |
| 2 | `getMonthlyFinancialTrend` | 130 | `?, ?, ?, @p_success, @p_message, @p_trend_data` | `?, ?, ?, ?, ?, ?` |
| 3 | `getCategoryFinancialBreakdown` | 173 | `?, ?, ?, @p_success, @p_message, @p_breakdown_data` | `?, ?, ?, ?, ?, ?` |
| 4 | `generateQuarterlyFinancialReport` | 283 | `?, ?, ?, @p_success, @p_message, @p_report_data` | `?, ?, ?, ?, ?, ?` |
| 5 | `calculateFinancialKPIs` | 385 | `?, ?, ?, @p_success, @p_message, @p_total_revenue, @p_total_expenses, @p_net_profit, @p_total_transactions, @p_profit_margin, @p_avg_transaction_value` | `?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?` |

- **변경 LOC**: 5 라인 (1 라인/메서드)
- **`registerOutParameter(idx, ...)` / `getX(idx)` 변경 없음** — 인덱스가 이미 SSOT 정합
- **운영 즉시 안전**: 04:00 스케줄러는 즉시 정상 데이터 갱신 가능

### 5-2. 회귀 가드
- **기존 try/catch (line 113-116)**: `Exception` 범용 catch → ERROR 로그 + RuntimeException rethrow
- **외곽 스케줄러 (`ErpAutomationScheduler:225-228`)**: RuntimeException 캐치 → WARN 로그 + 다음 tenant 진행
- **추가 가드 불필요**: 5-1 의 5라인 fix 가 근본 fix 이며, 만에 하나 회귀 발생 시에도 외곽 try/catch 가 스케줄러를 정상 종료

### 5-3. 회귀 테스트 (신규)
`PlSqlFinancialServicePrepareCallRegressionTest.java` — 5개 메서드 각각:
- `prepareCall` SQL 에 `@p_` / `@P_` 패턴이 **없어야 함** 검증
- `?` placeholder 개수가 SSOT 시그니처 (3 IN + N OUT) 와 일치 검증

### 5-4. 기존 테스트 동기화
`PlSqlFinancialServiceImplCallableTest.java` — 5개 `EXPECTED_CALL` 상수가 잘못된 패턴 (`@p_xxx`) 을 codify 하던 것을 SSOT 정합 패턴 (`?, ?, ?, ?, ?, ?`) 로 갱신. 기존 4-11 idx 의 `registerOutParameter`/`getX` 검증은 그대로 유지.

---

## 6. 게이트 결과
- **mvn test `-Dtest='PlSqlFinancialService*Test'`**: PASS (별도 절에 결과)
- **`check-hardcode.sh` 신규 0건**: 본 PR 은 코드 패턴 (`@var` → `?`) + 테스트만 변경, 하드코드 추가 없음
- **회귀 가드**: ArrayIndexOutOfBoundsException 발생 시 ERROR 로그 + 스케줄러 정상 종료 (기존 try/catch 가드 그대로 유효)

---

## 7. 다른 PR 와의 충돌 검증
- `PR #70` (admin LNB IA): 다른 영역 (frontend) — 충돌 0
- `PR #71` (payment timing): 다른 영역 (mapping/payment) — 충돌 0
- `PR #72` (deprecate session PL/SQL): 동일 도메인이나 대상 procedure 다름 (`UpdateAllConsultantPerformance` vs `GetBranchFinancialBreakdown`) — 충돌 0
- PR-A/C/D (병렬 ERP 트랙): 본 트랙은 `PlSqlFinancialServiceImpl.java` + 테스트 2개 + 본 보고서만 변경 → 파일 단위 충돌 0

---

## 8. 후속 PR 권고 (out of scope)
1. `PlSqlAccountingServiceImpl` / `PlSqlStatisticsServiceImpl` 등 다른 PL/SQL 서비스도 동일 패턴 점검 (전수 audit)
2. `StoredProcedureStandardizationIntegrationTest` 의 `@Disabled` 두 건을 testcontainers + MySQL 로 활성화하여 실 JDBC 동작 회귀 가드 강화
3. nginx access log 에 `$request_time` 추가 (DB §M9 후속)

---

## 9. 참조
- DB 측정 보고서: `docs/project-management/2026-05-28/ERP_AUTOMATION_DB_MEASUREMENT.md` §M8 + §M10 (브랜치 `docs/erp-automation-db-measurement` commit `5a4c10049`)
- 이전 E3 트랙: 브랜치 `docs/scheduler-error-e3-plan`
- SSOT 프로시저: `database/schema/procedures_standardized/{GetBranchFinancialBreakdown,CalculateFinancialKPIs,GetMonthlyFinancialTrend,GetCategoryFinancialBreakdown,GenerateQuarterlyFinancialReport}_standardized.sql`
- MySQL Connector/J 버전: `pom.xml` `<mysql.version>8.0.33</mysql.version>`
