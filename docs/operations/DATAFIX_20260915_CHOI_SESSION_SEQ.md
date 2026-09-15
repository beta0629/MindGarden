# DATAFIX_20260915_CHOI_SESSION_SEQ

최가을(client_id=78) schedule **378**(2026-09-07, mapping 245) `session_sequence` NULL → **1** 복원.

## 근거 (lifetime SSOT)

`ScheduleRepository.countSequenceUpToSchedule` — `session_sequence IS NOT NULL` 이고 `status <> CANCELLED` 인 일정 건수.
스탬프 값 자체보다 **NULL 여부**가 lifetime 포함을 결정한다. 매핑 내 회차는 별도(`sessionSequence` 라벨).

| schedule | date | stamped | lifetime BEFORE | lifetime AFTER |
|----------|------|---------|-----------------|----------------|
| 373 | 2026-08-31 | 1 | 1 | 1 |
| 378 | 2026-09-07 | NULL→1 | 1 (자기 제외) | **2** |
| 436 | 2026-09-14 | 1 | 2 | **3** |

결정: **436 lifetime 2→3이 맞음**. 이전 「2회기」는 378 누락으로 과소 집계.

범위 밖: mapping 245/265 이중 ACTIVE (복원에 불필요).

## PROD 적용 SQL (이미 적용됨)

```sql
-- TAG: DATAFIX_20260915_CHOI_SESSION_SEQ
UPDATE schedules
SET session_sequence = 1,
    notes = CONCAT(IFNULL(notes, ''), IF(notes IS NULL OR notes='', '', '\n'),
                   '[DATAFIX_20260915_CHOI_SESSION_SEQ] session_sequence NULL→1 (lifetime include 2026-09-07)'),
    updated_at = NOW(6),
    updated_by = 'DATAFIX_20260915_CHOI_SESSION_SEQ'
WHERE id = 378
  AND client_id = 78
  AND tenant_id = 'tenant-incheon-counseling-001'
  AND status = 'COMPLETED'
  AND mapping_id = 245
  AND session_sequence IS NULL
  AND (is_deleted = 0 OR is_deleted IS NULL);
```

OPEN `session_recovery_alerts`(schedule 373/378/436) 는 `session_sequence` 존재 확인 후 `resolved_at` 종결.

## 롤백 SQL

```sql
UPDATE schedules
SET session_sequence = NULL,
    notes = NULL,
    updated_at = NOW(6),
    updated_by = 'ROLLBACK_DATAFIX_20260915_CHOI_SESSION_SEQ'
WHERE id = 378
  AND client_id = 78
  AND tenant_id = 'tenant-incheon-counseling-001'
  AND session_sequence = 1
  AND updated_by = 'DATAFIX_20260915_CHOI_SESSION_SEQ';
```

## 재발 방지 (코드 — 제안, 본 브랜치 미포함)

`deploy/dev-991-998-999-1000` 베이스에는 `PaymentTimingConstants` / IL 방문 스탬프 경로가 없어 가드를 넣지 않았다.
IL SSOT 가 있는 브랜치에서 `SessionDeductionRecoveryBatch.recoverOne` 최소 가드:

1. `schedule.mappingId` 있으면 해당 매핑 우선 로드 (이중 ACTIVE 오탐 완화).
2. `payment_timing=INSTITUTION_LINK` 이면 `remaining<=0` 스킵 후 `useSessionForSpecificMapping` → `persistInstitutionLinkVisitSequence`.
3. 회기권은 기존처럼 `remaining<=0` → `REMAINING_SESSIONS_ZERO` alert.

PROD 알림 이력: schedule 378 → `ACTIVE_MAPPING_NOT_FOUND`(2026-09-07). 매핑이 APPROVED ACTIVE IL 이 된 뒤에도 remaining=0 이면 동일 배치가 스탬프를 못 함.
