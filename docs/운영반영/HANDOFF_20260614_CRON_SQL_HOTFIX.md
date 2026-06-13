# 운영 인계 — Cron SQL P0 Hotfix (PR-A · PR-C) 머지 후 액션

**작성일**: 2026-06-14 (KST)  
**대상**: 운영팀 / DBA  
**근거**: PR #304 (PR-A `withSchemaName` 제거) · PR #305 (PR-C mind_garden 4종 OBSOLETE RENAME) main 반영 직후  
**관련 문서**: `CRON_SQL_ERROR_TRIAGE_20260614.md`, `MIND_GARDEN_LEGACY_CLEANUP_GUIDE.md`, `POST_2026_06_11_DEPLOYMENT_OPERATIONS_GUIDE.md`

---

## 1. 인계 목적

PR-A·PR-C 가 `main` 에 반영되었다. **운영 BE 재기동 후 06-15 자정 배치가 정상 종료되는지** 와 **백필 5일치(06-09 ~ 06-13) 통계가 채워졌는지** 를 운영팀이 검증한다. 본 문서는 그 절차만 짧게 정리한다.

## 2. 사전 조건 (확인 후 진행)

- [ ] PR #304, PR #305 가 `main` 에 머지되어 있다.
- [ ] `core-deployer` 가 운영 BE blue/green 슬롯에 신 빌드를 배포·재기동했다.
- [ ] 배포 직후 `/actuator/health` 가 `UP` 이다.

## 3. 운영 액션 (자정 검증 — 06-15 00:00 KST 이후)

```bash
# Step 1. 자정 직후 자정 통계 배치 로그 확인 (3종)
ssh PRODUCTION '
  sudo journalctl -u mindgarden-core-blue.service --since "today 00:00" --until "today 00:30" | \
    grep -iE "UpdateAllBranchDailyStatistics|UpdateAllConsultantPerformance|DailyPerformanceMonitoring|bad SQL grammar|Unable to determine"
'

# Step 2. 3단계 prefix SQL 회귀 없음 확인 (있으면 P0 재발)
ssh PRODUCTION '
  sudo journalctl -u mindgarden-core-blue.service --since "today 00:00" | \
    grep -E "core_solution\.core_solution\." || echo "OK: no 3-prefix"
'
```

기대값: **3종 모두 정상 종료 INFO 로그 1건 이상**, `bad SQL grammar` / `Unable to determine` / 3단계 prefix 0건.

## 4. 운영 액션 (백필 5일치 검증 — 06-09 ~ 06-13)

운영 DBA 가 5일치 누락 통계가 자정 배치 또는 별도 보정 후 채워졌는지 확인한다 (SELECT 만).

```sql
-- branch daily statistics 5일치 row 존재 확인
SELECT statistics_date, COUNT(*) AS row_cnt
  FROM core_solution.branch_daily_statistics
 WHERE statistics_date BETWEEN '2026-06-09' AND '2026-06-13'
 GROUP BY statistics_date
 ORDER BY statistics_date;

-- consultant performance 5일치
SELECT performance_date, COUNT(*) AS row_cnt
  FROM core_solution.consultant_performance
 WHERE performance_date BETWEEN '2026-06-09' AND '2026-06-13'
 GROUP BY performance_date
 ORDER BY performance_date;
```

기대값: **5일 각각 row > 0**. 누락 일자는 영향 분석 문서(`HANDOFF_20260614_CRON_SQL_4DAY_GAP.md`) §3 백필 절차로 처리.

## 5. 롤백 절차 (재발 시)

| 증상 | 액션 |
|---|---|
| 3단계 prefix SQL 재출현 | `core-deployer` 가 직전 빌드로 blue/green 슬롯 즉시 롤백, P0 채널 통보 |
| mind_garden PROC stub `SIGNAL 45000` 발생 | 호출 측 PROC 명이 core_solution SSOT 인지 확인. 잘못된 catalog 사용이면 코드 수정 (별도 PR) |
| 자정 배치 5분 이상 무응답 | `journalctl -u mindgarden-core-*` 로 stack 확인, P0 채널 통보 |

롤백은 **운영팀 단독 판단 금지** — `core-deployer` + 사용자 승인 동시 필요.

## 6. 담당자 · 완료 조건

| 항목 | 담당 | 완료 시각 (KST) |
|---|---|---|
| 자정 배치 정상 종료 (§3) | 운영팀 | 2026-06-15 00:30 |
| 백필 5일치 SELECT (§4) | 운영 DBA | 2026-06-15 09:00 |
| 결과 P0 채널 보고 | 운영팀 리드 | 2026-06-15 10:00 |

3개 항목 전부 GREEN 이면 본 P0 chain 종료. 1건이라도 RED 면 `core-debugger` 위임.
