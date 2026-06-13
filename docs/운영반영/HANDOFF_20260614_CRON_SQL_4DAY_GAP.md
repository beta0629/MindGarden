# 운영 인계 — 자정 Cron 4일 누적 실패 (06-09 ~ 06-13) 영향 · 백필 검증

**작성일**: 2026-06-14 (KST)  
**대상**: 운영팀 / DBA / BI · 정산 담당  
**근거**: PR #304 (PR-A withSchemaName 제거) · PR #305 (PR-C mind_garden RENAME) 적용 전 4일치(06-09 ~ 06-13) 자정 통계 배치 100% 실패 누적  
**관련 문서**: `CRON_SQL_ERROR_TRIAGE_20260614.md`, `HANDOFF_20260614_CRON_SQL_HOTFIX.md`, `POST_2026_06_11_DEPLOYMENT_OPERATIONS_GUIDE.md` §1

---

## 1. 영향 범위

| 영향 대상 | 영향 시기 | 비고 |
|---|---|---|
| `branch_daily_statistics` | 06-09 ~ 06-13 row 5일치 누락 추정 | 자정 배치 `UpdateAllBranchDailyStatistics` 실패 |
| `consultant_performance` | 06-09 ~ 06-13 row 5일치 누락 추정 | 자정 배치 `UpdateAllConsultantPerformance` 실패 |
| `daily_performance_monitoring` | 06-09 ~ 06-13 5일치 누락 추정 | `DailyPerformanceMonitoring` 실패 |
| 운영 BI 대시보드 (5일치) | 06-09 ~ 06-13 빈 값 노출 | 백필 완료 시 자동 복구 |
| 정산·KPI 리포트 | 5일치 부정확 | 백필 완료 후 재집계 필요 |

**범위 외**: 예약·세션·CRM·결제 등 트랜잭션 데이터는 영향 없음 (자정 통계 집계만 실패).

## 2. 영향 평가 SELECT (운영 DBA, 읽기 전용)

```sql
-- 누락 일자 확인 (5일 전부 0이면 100% 누락)
SELECT statistics_date, COUNT(*) AS row_cnt
  FROM core_solution.branch_daily_statistics
 WHERE statistics_date BETWEEN '2026-06-09' AND '2026-06-13'
 GROUP BY statistics_date ORDER BY statistics_date;

SELECT performance_date, COUNT(*) AS row_cnt
  FROM core_solution.consultant_performance
 WHERE performance_date BETWEEN '2026-06-09' AND '2026-06-13'
 GROUP BY performance_date ORDER BY performance_date;

SELECT monitor_date, COUNT(*) AS row_cnt
  FROM core_solution.daily_performance_monitoring
 WHERE monitor_date BETWEEN '2026-06-09' AND '2026-06-13'
 GROUP BY monitor_date ORDER BY monitor_date;
```

## 3. 백필 절차 (운영 DBA · BE 재기동 후)

PR-A·PR-C 적용 후 BE 가 정상 기동 상태에서 다음 절차로 5일치 백필을 수행한다. **SELECT 외 INSERT/UPDATE 는 가이드만 제시하며 자동 실행은 본 문서 범위 밖**이다.

```sql
-- 5일치 PROC 호출 (운영 DBA 가 SQL 클라이언트에서 1일씩 수동 실행)
-- 0) 백필 시작 전 행 카운트 스냅샷 저장 (롤백 비교용)
-- 1) 06-09 부터 1일 단위 호출:
CALL core_solution.UpdateAllBranchDailyStatistics('2026-06-09');
CALL core_solution.UpdateAllConsultantPerformance('2026-06-09');
CALL core_solution.DailyPerformanceMonitoring('2026-06-09');
-- 2) 06-10 ~ 06-13 동일 패턴 반복
-- 3) 각 호출 후 §2 SELECT 로 row_cnt > 0 확인
```

> **주의**: 운영 시간대(09:00 ~ 22:00 KST) 회피 권장 — 통계 집계 시 일시적 DB load 상승 가능.

## 4. 검증 절차 (백필 직후)

```sql
-- 5일치 전부 row > 0 확인 (1건이라도 0이면 재실행)
SELECT
    SUM(CASE WHEN statistics_date='2026-06-09' THEN 1 ELSE 0 END) AS d09,
    SUM(CASE WHEN statistics_date='2026-06-10' THEN 1 ELSE 0 END) AS d10,
    SUM(CASE WHEN statistics_date='2026-06-11' THEN 1 ELSE 0 END) AS d11,
    SUM(CASE WHEN statistics_date='2026-06-12' THEN 1 ELSE 0 END) AS d12,
    SUM(CASE WHEN statistics_date='2026-06-13' THEN 1 ELSE 0 END) AS d13
  FROM core_solution.branch_daily_statistics
 WHERE statistics_date BETWEEN '2026-06-09' AND '2026-06-13';

-- BI 대시보드 5일치 표시 회복 확인 (운영 BI 담당)
```

기대값: 5일 각 컬럼 row > 0, BI 대시보드 빈 값 복구.

## 5. 롤백 절차

| 증상 | 액션 |
|---|---|
| 백필 후 row 중복 (멱등성 미보장 PROC) | `monitor_date` / `statistics_date` 별 row 중복 제거 (DBA 별도 SQL, 본 문서 범위 밖) |
| BI 대시보드 값 비정상 (음수·NULL 등) | 해당 일자 PROC 재호출. 그래도 비정상이면 `core-debugger` 위임 |
| 운영 DB load 급등 | 백필 중단, 운영 시간대 외 (23:00 ~ 06:00 KST) 재개 |

## 6. 담당자 · 완료 조건

| 항목 | 담당 | 완료 시각 (KST) |
|---|---|---|
| §2 영향 평가 SELECT | 운영 DBA | 2026-06-15 09:00 |
| §3 백필 5일치 호출 | 운영 DBA | 2026-06-15 12:00 (운영 시간대 외 권장) |
| §4 검증 SELECT + BI 확인 | 운영 DBA + BI 담당 | 2026-06-15 14:00 |
| P0 채널 최종 보고 | 운영팀 리드 | 2026-06-15 15:00 |

4개 항목 GREEN 시 4일 갭 종료. RED 시 `core-debugger` 위임 후 재시도.

## 7. 절대 금지

- 운영 DB 직접 `INSERT`/`UPDATE`/`DELETE` 로 row 삽입 금지 — PROC 호출만.
- 같은 일자 PROC 2회 이상 호출은 row 중복 위험 — 1회 호출 후 §2 SELECT 검증.
- 운영 시간대 백필 강행 금지 (BI 담당과 시간대 합의 필수).
