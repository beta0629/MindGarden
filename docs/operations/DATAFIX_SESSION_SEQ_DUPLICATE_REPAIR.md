# DATAFIX — session_sequence 중복 보정 (정책 A)

운영 수동 보정. **Flyway / CI 자동 실행 금지.**

## 정책 (SSOT)

**정책 A (회기 재사용 · A-lite + gap-fill)**

- `CANCELLED` → 해당 행만 `session_sequence=null` + rem 복원 (본 스크립트는 CANCELLED 미변경)
- 재예약 → 비-CANCELLED 점유 집합에서 **최저 빈 순번** 재사용
- 활성(`BOOKED` / `TENTATIVE_PENDING_PAYMENT` / `CONFIRMED` / `IN_PROGRESS` / `COMPLETED`) 2건이 같은 `session_sequence`면 데이터 오류 → 본 DATAFIX 대상
- **정책 B(항상 seq+1) 아님**

코드 SSOT: `ScheduleServiceImpl#computeSessionSequenceBeforeDeduction` / `#resolveNextAvailableSessionSequence`

## 스크립트

| 단계 | 파일 | 역할 |
|------|------|------|
| 1 | `scripts/ops/schedule_session_seq_duplicate_repair_dry_run.sql` | 중복 그룹·승자/패자·제안 `next_seq` 조회 (읽기+TEMP) |
| 2 | `scripts/ops/schedule_session_seq_duplicate_repair_apply.sql` | 승인 후 패자만 `session_sequence` UPDATE |

## 파라미터 (세션 변수)

하드코딩 금지. 테넌트·매핑·사람이름을 SQL 리터럴로 넣지 말 것.

```sql
SET @tenant_id = 'YOUR_TENANT_ID';  -- 필수
SET @mapping_id = 0;                 -- 0=tenant 전체; >0이면 해당 mapping만 (예: mapping_id=255)
SET @dry_run = 1;                    -- apply 실행 시 0
-- apply 전용:
SET @confirm = 'CONFIRM';
```

## 실행 절차

1. **백업**: 대상 tenant(및 mapping) `schedules` 스냅샷 확보. apply는 `schedules_session_seq_dup_repair_bak`에도 before/after를 남긴다.
2. **승인**: dry-run 결과(승자/패자/`READY` 건)를 운영 승인 티켓·일지에 첨부.
3. **Dry-run**

```sql
SET @tenant_id = 'YOUR_TENANT_ID';
SET @mapping_id = 0;   -- 또는 특정 mapping_id
SET @dry_run = 1;
SOURCE scripts/ops/schedule_session_seq_duplicate_repair_dry_run.sql;
```

4. **Apply** (승인 후 1회)

```sql
SET @tenant_id = 'YOUR_TENANT_ID';
SET @mapping_id = 0;
SET @dry_run = 0;
SET @confirm = 'CONFIRM';
SOURCE scripts/ops/schedule_session_seq_duplicate_repair_apply.sql;
```

5. **검증**: apply 섹션 3 — 동일 필터 `HAVING COUNT(*)>1` 가 0건인지 확인.
6. **후속 일지 링크** (본 스크립트는 `consultation_records`를 강제 rewrite하지 않음):
   - `scripts/ops/consultation_session_link_repair_dry_run.sql`
   - `scripts/ops/consultation_session_link_repair_apply.sql`
7. **rem/used**: 본 DATAFIX 범위 밖. 잔여 불일치는 별도 leftover/회기 보정 절차.

## 승자 / 패자 규칙

- **승자**: 상태 우선 `COMPLETED` > `IN_PROGRESS` > `CONFIRMED` > `BOOKED` > `TENTATIVE_PENDING_PAYMENT`, 동률이면 `date` / `start_time` / `id` ASC
- **패자**: 그 외 → 제안 `next_seq` = 동일 mapping 활성 점유(패자 제외)에 없는 `1..total_sessions` 최소값 (매핑 내 패자 순차 배정)
- `MANUAL_NO_TOTAL` / `MANUAL_NO_FREE_SEQ` → apply 대상 제외, 수동 검토

## 금지

- silent 전면 `ROW_NUMBER` 재부여
- `CANCELLED` 행의 seq 변경
- rem / used / mapping status 변경
- 일지(`consultation_records`) 링크 강제 rewrite
- Flyway migration / CI 파이프라인 편입
