# mind_garden 스키마 잔존 객체 정리 운영 가이드 (P0 hotfix 후속)

> 작성일: 2026-06-11
> 작성: core-coder (디버거 [운영 에러로그 진단](d678a0a4-fffb-4f4f-9925-0266d0e5fdfb) 보고서 §3.2 위임 + 운영 P0+P1 hotfix PR 후속)
> 분류: 운영(go-live) 데이터베이스 정리

---

## 1. 배경

### 1.1 운영 장애 요약

- **운영 매일 00:00 / 00:05**: `UpdateAllBranchDailyStatistics`, `DailyPerformanceMonitoring` 등 표준 통계 프로시저 호출이 100% 실패.
- **근본 원인**: 운영 MySQL 인스턴스에 `core_solution` 과 `mind_garden` 양쪽 DB(catalog) 에 동일 이름의 PROCEDURE 가 적재됨.
- **결과**: Spring `SimpleJdbcCall` 이 `INFORMATION_SCHEMA.ROUTINES` 에서 메타데이터를 추출할 때 `ROUTINE_SCHEMA` 가 두 곳 매칭되어 시그니처 결정 불가 → `MetaDataAccessException` 발생.
- 자세한 분석: `agent-transcripts/.../subagents/d678a0a4-fffb-4f4f-9925-0266d0e5fdfb.jsonl` §3.

### 1.2 코드 측 P0 hotfix (이 PR 포함)

- `PlSqlStatisticsServiceImpl` 의 5개 `SimpleJdbcCall` 호출 모두 `.withCatalogName(dbSchemaName)` 명시.
- `PlSqlFinancialServiceImpl` 의 5개 `prepareCall("{CALL X(...)}")` 호출 모두 `"{CALL " + dbSchemaName + ".X(...)}"` 로 catalog prefix.
- `deploy-procedures-*` 워크플로 및 `deploy-standardized-procedures.sh` 에서 `mind_garden` 스키마 재적재 차단.

### 1.3 본 가이드의 목적

코드 측 hotfix 로 충돌은 차단되었지만, 운영 DB 의 `mind_garden` 스키마에 남아있는 동명 프로시저·잔존 객체를 **운영 검수 후 수동 정리**한다. 본 가이드는 그 절차·SQL·롤백을 제공한다.

> **본 PR 에는 DROP / RENAME 자동 실행 워크플로를 포함하지 않는다.** 모두 운영 DBA 가 수동 실행하며, 본 가이드만 신규 추가한다.

---

## 2. 사전 확인 (정리 직전 필수)

### 2.1 mind_garden 잔존 객체 목록 확인

```sql
-- 프로시저 / 함수 목록
SELECT ROUTINE_TYPE, ROUTINE_NAME, CREATED, LAST_ALTERED, DEFINER
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'mind_garden'
ORDER BY ROUTINE_TYPE, ROUTINE_NAME;

-- 테이블 목록
SELECT TABLE_NAME, TABLE_ROWS, ENGINE, CREATE_TIME, UPDATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mind_garden'
ORDER BY TABLE_NAME;

-- 뷰 목록
SELECT TABLE_NAME, VIEW_DEFINITION
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = 'mind_garden';

-- 트리거 목록
SELECT TRIGGER_NAME, EVENT_OBJECT_TABLE, EVENT_MANIPULATION, ACTION_TIMING
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'mind_garden';

-- 이벤트 스케줄러 목록
SELECT EVENT_NAME, EVENT_TYPE, STATUS, EXECUTE_AT
FROM information_schema.EVENTS
WHERE EVENT_SCHEMA = 'mind_garden';
```

### 2.2 외부 참조(view / grant / FK) 점검 — DROP 안전성 확인

```sql
-- core_solution 등 다른 스키마의 VIEW 가 mind_garden 객체를 참조하는지
SELECT TABLE_SCHEMA, TABLE_NAME, VIEW_DEFINITION
FROM information_schema.VIEWS
WHERE VIEW_DEFINITION LIKE '%mind_garden.%'
   OR VIEW_DEFINITION LIKE '%`mind_garden`%';

-- core_solution 의 프로시저·함수 본문이 mind_garden 객체를 참조하는지
SELECT ROUTINE_SCHEMA, ROUTINE_NAME, ROUTINE_TYPE, ROUTINE_DEFINITION
FROM information_schema.ROUTINES
WHERE ROUTINE_DEFINITION LIKE '%mind_garden.%'
   OR ROUTINE_DEFINITION LIKE '%`mind_garden`%';

-- mind_garden 에 적재된 GRANT (다른 계정이 직접 사용 중인지)
SHOW GRANTS FOR 'mindgarden'@'%';
SHOW GRANTS FOR 'mindgarden_dev'@'%';
SELECT * FROM information_schema.USER_PRIVILEGES
WHERE GRANTEE LIKE '%mindgarden%';
SELECT * FROM information_schema.SCHEMA_PRIVILEGES
WHERE TABLE_SCHEMA = 'mind_garden';

-- 외래 키가 mind_garden 테이블을 참조하는지 (보통 없음, 확인용)
SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_SCHEMA, REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = 'mind_garden';
```

> 위 4개 쿼리 중 **하나라도 결과가 나오면 DROP 금지**. 의존 객체를 먼저 정리하거나 RENAME 으로 보류한다.

### 2.3 백엔드 애플리케이션 의존 검사

```bash
# 운영 서버에서: 애플리케이션 설정에 mind_garden 참조가 있는지
ssh <PROD_HOST>
sudo systemctl cat mindgarden.service | grep -i mind_garden || echo "OK: 서비스 환경변수에 mind_garden 없음"
sudo find /opt/mindgarden /etc/mindgarden /var/lib/mindgarden -type f \( -name '*.yml' -o -name '*.properties' -o -name '*.env*' \) 2>/dev/null \
  | xargs grep -l 'mind_garden' 2>/dev/null || echo "OK: 설정 파일에 mind_garden 없음"
```

`docs/standards/DEPLOYMENT_STANDARD.md` 의 환경변수 SSOT 도 함께 확인. `DB_NAME=core_solution` 이 일관되어야 한다.

---

## 3. 백업 (DROP / RENAME 전 필수)

운영 DBA 가 운영 호스트에서 수동 실행한다.

```bash
# 운영 MySQL 호스트에서 (백업 디렉토리는 환경에 맞게 조정)
BACKUP_DIR=/backup/mind_garden_cleanup_$(date +%Y%m%d)
sudo mkdir -p "$BACKUP_DIR"
sudo chown -R mysql:mysql "$BACKUP_DIR"

# 데이터 + 루틴 + 트리거 + 이벤트 모두 백업 (--single-transaction 으로 락 최소화)
mysqldump \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  --default-character-set=utf8mb4 \
  -u root -p \
  mind_garden \
  > "$BACKUP_DIR/mind_garden_legacy_full_$(date +%Y%m%d_%H%M%S).sql"

# 무결성 확인
ls -lah "$BACKUP_DIR"
head -50  "$BACKUP_DIR"/mind_garden_legacy_full_*.sql
tail -50  "$BACKUP_DIR"/mind_garden_legacy_full_*.sql
gzip "$BACKUP_DIR"/mind_garden_legacy_full_*.sql

# 30일 이상 보관 정책 권장
```

백업 파일은 운영 검수가 끝날 때까지 (롤백 윈도우, 최소 14일) 보관한다.

---

## 4. 정리 옵션

### 4.0 옵션 A 진행 기록 — 2026-06-14 Flyway migration 적용 (PR-C)

> **상태**: V20260614_001 Flyway migration 으로 채택·적용. 대상 4종은 DROP + `OBSOLETE_<원이름>_20260614` stub CREATE 패턴(§4.1.2 우회) 으로 정리.

| 항목 | 값 |
|---|---|
| Migration 파일 | `src/main/resources/db/migration/V20260614_001__rename_mind_garden_legacy_procedures.sql` |
| PR | `fix(db): PR-C mind_garden 잔존 PROC 4종 OBSOLETE RENAME (multiple signatures 회귀 차단)` |
| 적용 일자 | 2026-06-14 (Flyway migration baseline; 운영 적용은 PR-A 와 동시 배포) |
| 적용 방법 | MySQL 8 `RENAME PROCEDURE` 미지원 → **§4.1.2 DROP + stub CREATE** 패턴 |
| 접미사 형식 | `OBSOLETE_<원이름>_20260614` (선행 underscore 없음; 본 가이드 §4.1 의 `_OBSOLETE_..._20260611` 초기 안에서 일자·접미사 정리) |
| 정리 대상 4종 | `UpdateDailyStatistics`, `UpdateAllBranchDailyStatistics`, `UpdateConsultantPerformance`, `DailyPerformanceMonitoring` |
| 정리 외 1종 | `UpdateAllConsultantPerformance` — V20260606_009 에서 이미 DROP 완료 (재처리 불필요) |
| 재무 PROC 5종 | (§4.1 본문에 후보로 명시한 `GetBranchFinancialBreakdown` 외 4종) 운영 SSH 점검 결과 `mind_garden` 측 잔존 0건 — 본 PR 범위 밖 |
| stub 동작 | 호출 시 `SIGNAL SQLSTATE '45000'` 으로 차단 + SSOT 안내 메시지 (모니터링 마커) |
| 완전 DROP 일정 | **금지** 표시. 1주 모니터링 후 별도 PR `V20260621_001` 에서 stub 완전 DROP 예정 (§4.3 옵션 C) |
| 사전 가드 | `CREATE SCHEMA IF NOT EXISTS mind_garden` — H2(MODE=MySQL) 통합 테스트 호환 (V20260606_009 동일 패턴) |
| 표준 참조 | `docs/standards/DATABASE_MIGRATION_STANDARD.md`, `docs/운영반영/CRON_SQL_ERROR_TRIAGE_20260614.md` §6 PR-C, `docs/운영반영/DB_ENV_SSOT_PRECHECK_20260613.md` |

> 본 §4.0 항목은 PR-C 머지 후 사실 상태를 반영. **운영 검수 회의에서 추가 PROC 가 발견되면 별도 마이그 PR 로 추가**한다 (본 마이그 수정 금지 — 멱등 보존).

### 4.1 옵션 A — RENAME (권장, 즉시 롤백 가능)

MySQL 은 `RENAME DATABASE` 가 deprecated 되어 직접 지원하지 않지만, 새 스키마 생성 후 객체별 RENAME 으로 동등 효과를 낼 수 있다. 본 가이드에서는 **단순화·검수 편의를 위해 "스키마는 그대로 두되, 동명 프로시저만 OBSOLETE 접미사로 RENAME"** 하는 1단계 옵션을 권장한다.

> **2026-06-14 갱신**: MySQL 8 은 `RENAME PROCEDURE` 구문을 지원하지 않는 것으로 확정 (§4.1 의 RENAME 예시는 보존 — 가이드 의도 기록용). 운영 적용은 §4.1.2 패턴으로 V20260614_001 Flyway 마이그가 수행 (위 §4.0).

```sql
-- 4.1.1 mind_garden 의 동명 프로시저를 OBSOLETE 접미사로 변경
-- (DROP 대신 RENAME 으로 1단계 진행 → 1주일 모니터링 → 4.3 완전 DROP)

USE mind_garden;

-- 충돌 대상 프로시저 (운영 표준 5개)
RENAME PROCEDURE UpdateDailyStatistics              TO _OBSOLETE_UpdateDailyStatistics_20260611;
RENAME PROCEDURE UpdateAllBranchDailyStatistics     TO _OBSOLETE_UpdateAllBranchDailyStatistics_20260611;
RENAME PROCEDURE UpdateConsultantPerformance        TO _OBSOLETE_UpdateConsultantPerformance_20260611;
RENAME PROCEDURE UpdateAllConsultantPerformance     TO _OBSOLETE_UpdateAllConsultantPerformance_20260611;
RENAME PROCEDURE DailyPerformanceMonitoring         TO _OBSOLETE_DailyPerformanceMonitoring_20260611;

-- 재무 프로시저도 동명 충돌 가능성 있음 (확인 후 동일 패턴 적용)
RENAME PROCEDURE GetBranchFinancialBreakdown        TO _OBSOLETE_GetBranchFinancialBreakdown_20260611;
RENAME PROCEDURE GetMonthlyFinancialTrend           TO _OBSOLETE_GetMonthlyFinancialTrend_20260611;
RENAME PROCEDURE GetCategoryFinancialBreakdown      TO _OBSOLETE_GetCategoryFinancialBreakdown_20260611;
RENAME PROCEDURE GenerateQuarterlyFinancialReport   TO _OBSOLETE_GenerateQuarterlyFinancialReport_20260611;
RENAME PROCEDURE CalculateFinancialKPIs             TO _OBSOLETE_CalculateFinancialKPIs_20260611;

-- 변경 후 확인
SELECT ROUTINE_NAME
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'mind_garden'
  AND ROUTINE_TYPE = 'PROCEDURE'
ORDER BY ROUTINE_NAME;
```

> MySQL 8 에서 `RENAME PROCEDURE` 가 동작하지 않는 환경(서버 권한 / 버전 이슈) 이면, **4.1.2 DROP+CREATE 우회 절차**를 사용한다.

#### 4.1.2 RENAME 미지원 시 DROP + OBSOLETE stub CREATE (V20260614_001 채택 패턴)

> **2026-06-14 갱신**: MySQL 8 의 `RENAME PROCEDURE` 미지원이 확정됨에 따라 본 PR-C 가 채택한 패턴.

원본 본문을 보존하지 않고 **SIGNAL stub** 으로 치환한다. 이유:

- mind_garden 측 PROC 원본 본문은 이미 deprecated · core_solution SSOT 에 대체본 존재 → 보존 가치 없음.
- stub 는 (a) 호출 시 차단(SIGNAL SQLSTATE '45000'), (b) 정리 마커(접미사 일자) 로만 동작 → 1주 모니터링 후 §4.3 옵션 C 로 완전 DROP.
- 본문 보존이 필요한 경우(타 PROC 정리 시) `mysqldump --routines` 백업(§3) 으로부터 복원 가능.

```sql
-- 본 패턴은 V20260614_001 Flyway 마이그가 자동 수행 (운영 DBA 수기 실행 불필요).
-- 마이그 본문 예시 (4종 동일 패턴, 1종만 발췌):

CREATE SCHEMA IF NOT EXISTS mind_garden;  -- H2(MODE=MySQL) 호환

DELIMITER $$

DROP PROCEDURE IF EXISTS mind_garden.OBSOLETE_UpdateDailyStatistics_20260614$$
CREATE PROCEDURE mind_garden.OBSOLETE_UpdateDailyStatistics_20260614()
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'OBSOLETE 20260614: mind_garden.UpdateDailyStatistics 사용 중지. SSOT 는 core_solution.UpdateDailyStatistics.';
END$$

DROP PROCEDURE IF EXISTS mind_garden.UpdateDailyStatistics$$

DELIMITER ;
```

### 4.2 옵션 B — 스키마 전체 RENAME (강하게 보류, 운영 검수 후만)

MySQL 에서 안전한 스키마 전체 RENAME 절차:

```sql
-- 1) 새 스키마 생성
CREATE DATABASE mind_garden_legacy_20260611
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2) 테이블만 이동 (RENAME TABLE 은 스키마 간 이동 지원)
-- (테이블 목록은 2.1 쿼리 결과 사용)
RENAME TABLE mind_garden.<table1> TO mind_garden_legacy_20260611.<table1>;
RENAME TABLE mind_garden.<table2> TO mind_garden_legacy_20260611.<table2>;
-- ... 모든 테이블 반복 ...

-- 3) 프로시저·함수·트리거·이벤트·뷰는 SQL DEFINER 권한과 스키마 격리 이슈로
--    DROP+CREATE 가 안전. 4.1.2 와 동일 절차로 신 스키마에 재생성.

-- 4) 빈 mind_garden DROP
DROP DATABASE mind_garden;
```

### 4.3 옵션 C — 완전 DROP (옵션 A 1주일 모니터링 후 최종 단계)

옵션 A 적용 후 1주일간 운영 모니터링에서 다음을 확인:

- [ ] 일별 통계 배치(00:00 / 00:05) 7일 연속 성공
- [ ] 재무 프로시저 호출 에러 0건
- [ ] 백엔드 로그에 `mind_garden` 키워드 0건
- [ ] DBA 검수 회의 승인

위 모두 충족 시:

```sql
-- 옵션 A 의 OBSOLETE 객체 + 잔존 테이블 일괄 DROP
-- (옵션 B 를 거쳤다면 단순 DROP DATABASE mind_garden_legacy_20260611;)

DROP DATABASE mind_garden;
-- 또는
DROP DATABASE mind_garden_legacy_20260611;
```

---

## 5. 사후 검증

```sql
-- 1) mind_garden 스키마 존재 여부
SHOW DATABASES LIKE 'mind\_garden%';

-- 2) core_solution 표준 프로시저 13개 존재 확인
SELECT COUNT(*) AS procedure_count
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'core_solution'
  AND ROUTINE_TYPE = 'PROCEDURE'
  AND ROUTINE_NAME IN (
    'UpdateDailyStatistics',
    'UpdateAllBranchDailyStatistics',
    'UpdateConsultantPerformance',
    'UpdateAllConsultantPerformance',
    'DailyPerformanceMonitoring',
    'GetBranchFinancialBreakdown',
    'GetMonthlyFinancialTrend',
    'GetCategoryFinancialBreakdown',
    'GenerateQuarterlyFinancialReport',
    'CalculateFinancialKPIs',
    'CheckTimeConflict',
    'GetConsolidatedFinancialData',
    'ProcessIntegratedSalaryCalculation'
  );
-- 기대값: 13 (또는 운영 SSOT 기준 개수)

-- 3) 동명 프로시저가 다른 스키마에 잔존하지 않는지
SELECT ROUTINE_SCHEMA, ROUTINE_NAME
FROM information_schema.ROUTINES
WHERE ROUTINE_TYPE = 'PROCEDURE'
  AND ROUTINE_NAME IN (
    'UpdateAllBranchDailyStatistics',
    'DailyPerformanceMonitoring',
    'GetBranchFinancialBreakdown'
  )
GROUP BY ROUTINE_NAME, ROUTINE_SCHEMA
HAVING COUNT(*) > 0;
-- 기대값: 각 ROUTINE_NAME 당 ROUTINE_SCHEMA='core_solution' 1행만
```

### 5.1 애플리케이션 측 검증

```bash
# 운영 서버에서 통계 배치 수동 트리거 (관리자 권한 필요)
curl -X POST 'https://<운영 도메인>/api/v1/admin/statistics/trigger-daily' \
     -H 'Authorization: Bearer <ADMIN_TOKEN>' \
     -H 'X-Tenant-Id: <TENANT_ID>'

# 로그 확인
sudo journalctl -u mindgarden.service -n 200 | grep -E '(UpdateAllBranchDailyStatistics|DailyPerformanceMonitoring|getBranchFinancialBreakdown)'
# 기대값: "✅ ... 실행 완료" 로그만, "❌" 또는 "Connection is read-only" 0건
```

---

## 6. 롤백 절차

### 6.1 옵션 A 롤백 (OBSOLETE 접미사 → 원래 이름 복귀)

```sql
USE mind_garden;
RENAME PROCEDURE _OBSOLETE_UpdateDailyStatistics_20260611         TO UpdateDailyStatistics;
RENAME PROCEDURE _OBSOLETE_UpdateAllBranchDailyStatistics_20260611 TO UpdateAllBranchDailyStatistics;
-- ... 동일 패턴 ...
```

> 단, 코드 측 catalog 명시 hotfix 가 살아있으면 mind_garden 의 동명 프로시저가 다시 충돌하지 **않는다**. 롤백은 단순히 mind_garden 적재 객체를 복귀하는 의미.

### 6.2 옵션 B / C 롤백 (전체 복원)

```bash
# 운영 호스트에서, 3 절에서 백업한 SQL 로 복원
gunzip -k /backup/mind_garden_cleanup_<DATE>/mind_garden_legacy_full_*.sql.gz

mysql -u root -p < /backup/mind_garden_cleanup_<DATE>/mind_garden_legacy_full_*.sql
```

복원 후 5절 검증을 다시 수행한다.

---

## 7. 체크리스트 (운영 DBA / 검수자용)

- [x] 2.1 mind_garden 잔존 객체 목록 캡처 — deployer fb010938 점검 결과 4종 식별 (`UpdateDailyStatistics`, `UpdateAllBranchDailyStatistics`, `UpdateConsultantPerformance`, `DailyPerformanceMonitoring`)
- [ ] 2.2 외부 참조 점검 4쿼리 모두 0행 확인 (PR-C 머지 전 운영 SSH 재실측)
- [ ] 2.3 백엔드 설정·환경변수에 `mind_garden` 참조 0건 (`DB_ENV_SSOT_PRECHECK_20260613.md` 인용)
- [ ] 3 백업 완료 + 무결성 확인 + 보관 위치 기록 (PR-A + PR-C 동시 배포 직전)
- [x] 4.1 옵션 A 실행 — Flyway V20260614_001 으로 자동화 (§4.0 참조). 4종 DROP + `OBSOLETE_*_20260614` stub CREATE 패턴 (§4.1.2)
- [ ] 5 사후 검증 SQL 3건 + 애플리케이션 트리거 1건 통과 (PR-A 와 동시 배포 + cron 정상화 검증)
- [ ] 5일치 백필 (06-09 ~ 06-13): `daily_statistics`, `consultant_performance` 4일치 + 06-09 추가 1일치 트리거 호출
- [ ] **1주일 모니터링 윈도우** 동안 일별 배치 7일 연속 성공 (`erp_sync_logs.status=COMPLETED`)
- [ ] 4.3 옵션 C 완전 DROP — 별도 PR `V20260621_001` 로 stub 4종 DROP (모니터링 통과 후, 본 PR 범위 밖)
- [ ] 정리 완료 기록을 `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` 에 반영

---

## 8. 참고 문서

- 디버거 보고서: `agent-transcripts/.../subagents/d678a0a4-fffb-4f4f-9925-0266d0e5fdfb.jsonl` §3
- 코드 측 P0 hotfix PR (본 PR): `src/main/java/com/coresolution/consultation/service/impl/PlSqlStatisticsServiceImpl.java`, `PlSqlFinancialServiceImpl.java`
- 워크플로 차단: `.github/workflows/deploy-procedures-prod.yml`, `deploy-procedures-production-mysql.yml`, `deploy-procedures-dev.yml`, `scripts/automation/deployment/deploy-standardized-procedures.sh`
- 운영 게이트: `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`
- 표준: `docs/standards/ERROR_HANDLING_STANDARD.md`, `docs/standards/DEPLOYMENT_STANDARD.md`
