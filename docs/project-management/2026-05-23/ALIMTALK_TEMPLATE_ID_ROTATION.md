# ALIMTALK_BIZ_TEMPLATE_CODE — 솔라피 Template ID 회전(rotation) 운영 문서

- **작성일**: 2026-05-23
- **관련 기획**: `docs/project-management/2026-05-23/NOTIFICATION_BATCH_MESSAGE_DESIGN.md` §2 / §11 / §12
- **관련 시드/UPDATE**:
  - `src/main/resources/db/migration/V20260528_001__seed_alimtalk_biz_template_code_8types.sql` (스켈레톤 시드, `code_label=''`)
  - `src/main/resources/db/migration/V20260528_002__update_alimtalk_biz_template_code_solapi_ids.sql` (실 templateId UPDATE, `is_active=false`)
  - `src/main/resources/db/migration/V20260528_003__activate_alimtalk_biz_template_code_8types.sql` (검수 통과 후 활성화 — **사전 작성**, 통과 통지 시 머지)
- **매핑 컴포넌트**: `AlimtalkTemplateMappingResolver` (`codeLabel = solapi templateId`)
- **호출자**: `BatchNotificationDispatchServiceImpl`, `AdminTestNotificationServiceImpl`, `AdminManualNotificationServiceImpl`, `NotificationServiceImpl`

---

## §1. 배경

알림톡 8종(예약 D-2, 즉시 단발, D-2 미달, 회기 종료 예고, 회기 갱신 유도, 신규 환영, 첫 상담 OFFLINE/ONLINE)은 솔라피 콘솔 검수를 거쳐 `KA01TP...` templateId 가 발급된다. 운영 코드 변경 없이 공통코드 `ALIMTALK_BIZ_TEMPLATE_CODE.code_label` 에 templateId 를 주입해 매핑 모드로 발화한다.

검수 결과를 사전에 예측할 수 없으므로 회전(rotation) 절차를 표준화하고, 검수진행중·통과·취하 상태를 단일 SQL 토글로 전환한다.

---

## §2. 회전 옵션 비교

| 옵션 | 시점 | is_active | 발송 영향 | 채택 여부 |
|---|---|---|---|---|
| A. 검수 통과 후 INSERT (지연) | 통과 직후 | TRUE | 즉시 매핑 발화 | △ (지연이 크다) |
| B. 검수 통과 시점에 UPDATE | 통과 직후 | TRUE | 즉시 매핑 발화 | △ (PR 대기 시간) |
| **C. 사전 UPDATE + 비활성** | **회수 직후** | **FALSE → TRUE** | **검수 통과 후 단일 SQL 활성화** | **✓ 채택** |

옵션 C 의 안전성 근거 (사전 검증 완료):

- `CommonCodeRepository.findCoreCodeByGroupAndValue` / `findTenantCodeByGroupAndValue` JPQL 에 `AND c.isActive = true` 명시
- `is_active=false` 일 때 resolver 는 row 미반환 → `null` 반환
- 호출자별 null 처리:
  - `BatchNotificationDispatchServiceImpl` — `solapiTemplateId == null` 분기에서 알림톡 스킵 → SMS 폴백 진입
  - `AdminTestNotificationServiceImpl` — `ERROR_CODE_TEMPLATE_NOT_MAPPED` 차단 (어드민 명시적 가드)
  - `AdminManualNotificationServiceImpl` — `ERROR_CODE_TEMPLATE_NOT_MAPPED` 배치 전체 차단

---

## §3. 실제 회수된 Template ID 8건 (2026-05-23)

공통 PFID: `KA01PF260521094243528iVcw1ocbfs8`

| # | code_value | Template ID | 카테고리 | 비고 |
|---|---|---|---|---|
| 1 | `RESERVATION_REMINDER_D2` | `KA01TP260522184308591IIbyy4H3E8U` | 정보성 | D-2 09:00 KST 배치 |
| 2 | `RESERVATION_IMMEDIATE_SINGLE` | `KA01TP260522184356741ccLBsS676ss` | 정보성 | 단발성(1회기) 결제 즉시 |
| 3 | `RESERVATION_IMMEDIATE_LATE` | `KA01TP260522184425486nliMfICjHKT` | 정보성 | D-2 미달 즉시 |
| 4 | `SESSION_ENDING_SOON` | `KA01TP2605221844555544EY1FTbnzPF` | 정보성 | 잔여 1회기 진입 예고 |
| 5 | `SESSION_RENEW_PROMPT` | `KA01TP260522184529370iMHGpu8lJx5` | 마케팅 | 갱신 유도, 수신동의 필수, F2 SMS 폴백 미수행 |
| 6 | `CLIENT_WELCOME_FIRST` | `KA01TP260522183559394LFIRKUfcteP` | 정보성 | 신규 매칭 환영 (user 영구 1회) |
| 7 | `INITIAL_GUIDE_OFFLINE` | `KA01TP2605221836359933KXmooGxUDh` | 정보성 | 첫 상담 안내(오프라인) |
| 8 | `INITIAL_GUIDE_ONLINE` | `KA01TP260522183954962WPnr2gZSzjL` | 정보성 | 첫 상담 안내(온라인) |

V20260528_002 가 위 8건을 `code_label` 에 주입 + `is_active = FALSE` 로 비활성 + `extra_data.approval_status = 'pending_verified'` + `template_id_received_at = '2026-05-23T03:47:00+09:00'` 로 갱신한다.

---

## §4. 검수 통과 후 활성화 (옵션 C 채택)

V20260528_002 가 `is_active=false` 로 8건 UPDATE 완료된 상태(검수진행중 동안 매핑 모드 발송 차단, SMS 폴백 정책 자동 우회).

검수 통과 통지 시 다음 SQL 1줄을 운영 DB 에 실행하거나 **신규 Flyway PR** 로 반영한다 (권장: 별도 PR — 멱등 가드 동봉).

### 4.1 단일 SQL (즉시 활성화)

```sql
UPDATE common_codes
   SET is_active = TRUE,
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value IN (
       'RESERVATION_REMINDER_D2',
       'RESERVATION_IMMEDIATE_SINGLE',
       'RESERVATION_IMMEDIATE_LATE',
       'SESSION_ENDING_SOON',
       'SESSION_RENEW_PROMPT',
       'CLIENT_WELCOME_FIRST',
       'INITIAL_GUIDE_OFFLINE',
       'INITIAL_GUIDE_ONLINE'
   )
   AND is_active = FALSE
   AND code_label LIKE 'KA01TP%';
```

- `AND is_active = FALSE` — 이미 활성화된 row 재실행 시 0 rows affected (멱등)
- `AND code_label LIKE 'KA01TP%'` — code_label 이 비어있거나 다른 값이면 활성화 차단 (안전망)

### 4.2 별도 Flyway PR (권장)

파일명: `src/main/resources/db/migration/V<YYYYMMDD>_NNN__activate_alimtalk_biz_template_code_8types.sql`

```sql
-- ============================================================================
-- ALIMTALK_BIZ_TEMPLATE_CODE 8종 활성화 (솔라피 검수 통과)
-- 시드: V20260528_001 / UPDATE: V20260528_002
-- 활성화 전제: code_label LIKE 'KA01TP%' (실 templateId 주입 완료)
-- 멱등성: is_active=TRUE 인 row 는 0 rows affected
-- ============================================================================
UPDATE common_codes
   SET is_active = TRUE,
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value IN (
       'RESERVATION_REMINDER_D2',
       'RESERVATION_IMMEDIATE_SINGLE',
       'RESERVATION_IMMEDIATE_LATE',
       'SESSION_ENDING_SOON',
       'SESSION_RENEW_PROMPT',
       'CLIENT_WELCOME_FIRST',
       'INITIAL_GUIDE_OFFLINE',
       'INITIAL_GUIDE_ONLINE'
   )
   AND is_active = FALSE
   AND code_label LIKE 'KA01TP%';
```

### 4.3 활성화 후 검증 체크리스트

- [ ] 어드민 매핑 모드 8종 발송 1건씩 테스트 (`/admin/system/test-notification`)
  - [ ] 정보성 7종: 알림톡 성공 응답 확인
  - [ ] `SESSION_RENEW_PROMPT` (마케팅): 수신동의 사용자 1건 + 미동의 사용자 1건 (미동의 시 차단 확인)
- [ ] 배치 D-2 09:00 KST 스케줄러 dry-run → 실 발송 1건 (소수 대상)
- [ ] `notification_batch_send_log` row 생성 확인 + UNIQUE 멱등 (`scheduleId × templateCode × bizDate`) 검증
- [ ] Solapi 콘솔 발송 이력에 8종 templateId 적용 확인
- [ ] SMS 폴백 미발화 확인 (정보성 7종, 알림톡 성공 시)
- [ ] CloudWatch / 로그: `알림톡 매핑 없음` WARN 미발생 확인

---

## §5. Rollback

### 5.1 활성화 직후 이상 발견 시 (즉시 차단)

```sql
UPDATE common_codes
   SET is_active = FALSE,
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value IN (
       'RESERVATION_REMINDER_D2',
       'RESERVATION_IMMEDIATE_SINGLE',
       'RESERVATION_IMMEDIATE_LATE',
       'SESSION_ENDING_SOON',
       'SESSION_RENEW_PROMPT',
       'CLIENT_WELCOME_FIRST',
       'INITIAL_GUIDE_OFFLINE',
       'INITIAL_GUIDE_ONLINE'
   );
```

효과:

- resolver → null 즉시 반환
- 정보성 7종: 알림톡 스킵 → SMS 폴백 자동 진입 (운영 영향 최소)
- 마케팅 `SESSION_RENEW_PROMPT`: 알림톡 스킵 + SMS 폴백 미수행 (`fallback="none (F2 skip_marketing)"`) → 발송 0건 (의도된 동작)
- 어드민 발송 도구: `ERROR_CODE_TEMPLATE_NOT_MAPPED` 명시적 차단 (사용자에게 즉시 노출)

### 5.2 개별 templateId 만 차단 (1~7건만 부분 롤백)

```sql
UPDATE common_codes
   SET is_active = FALSE,
       updated_at = CURRENT_TIMESTAMP
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = '<문제가 된 codeValue>';
```

### 5.3 시드 자체 폐기 (긴급 — 거의 사용 안 함)

V20260528_001 / V20260528_002 두 마이그레이션을 폐기하려면 별도 Flyway PR 로 DELETE 한다 (`tenant_id IS NULL AND code_group='ALIMTALK_BIZ_TEMPLATE_CODE'`). Flyway 히스토리 직접 삭제는 금지.

---

## §6. 운영 호출부 영향 매트릭스 (참조)

| 호출자 | `is_active=false` 시 동작 | 비고 |
|---|---|---|
| `BatchNotificationDispatchServiceImpl` | 알림톡 스킵 → SMS 폴백 (정보성) / 발송 0건 (마케팅) | `solapiTemplateId == null` 분기 + WARN 로그 |
| `AdminTestNotificationServiceImpl` | `ERROR_CODE_TEMPLATE_NOT_MAPPED` 차단 | 어드민 UI 에 즉시 노출 |
| `AdminManualNotificationServiceImpl` | `ERROR_CODE_TEMPLATE_NOT_MAPPED` 배치 전체 차단 | 발송 0건 보장 |
| `NotificationServiceImpl` | 매핑 미발견 처리 → 기존 폴백 정책 진입 | 운영 호출부, 코드 변경 없음 |

위 4 경로 모두 옵션 C 의 `is_active=false` 비활성 정책에 대해 **운영 영향 0** 으로 검증 완료.

---

## §7. V20260528_003 활성화 PR — 사전 작성 완료 (검수 통과 통지 시 즉시 머지)

- 파일: `src/main/resources/db/migration/V20260528_003__activate_alimtalk_biz_template_code_8types.sql`
- 작성 시점: 2026-05-23 (검수 진행 중 — develop 미머지 / 미푸시 상태로 사전 준비)
- 머지 조건: 솔라피/카카오 검수 통과 통지 수신 + 운영 점검 시간 확보
- 머지 절차:
  1. develop 에 본 파일 커밋 후 push (DEV Flyway 자동 적용 → 8건 `is_active=1`, `extra_data.approval_status='approved'`, `activated_at` ISO8601 KST 기록)
  2. DEV 검증 — §6 / §4.3 시나리오 #2~#3 (8건 `is_active=1`, 어드민 매핑 모드 발송 1건 PASS)
  3. develop → main fast-forward + 운영 워크플로 트리거
  4. 운영 Flyway 적용 후 활성화 검증 (어드민 매핑 모드 8종 1건씩 발송, `notification_batch_send_log` UNIQUE 멱등 확인)
- Rollback: §5.1 단일 SQL 실행 (`is_active=FALSE` 전체 차단) — 정보성 7종 자동 SMS 폴백 / 마케팅 1종 발송 0건
- 본 마이그레이션의 멱등 가드:
  - `AND is_active = FALSE` → 이미 활성 row 재실행 시 0 rows
  - `AND code_label LIKE 'KA01TP%'` → templateId 미주입(빈 문자열) row 활성화 차단
  - 8건 each statement 동일 가드 (V20260528_002 와 동일 분리 UPDATE 패턴)
- 본 마이그레이션의 데이터 정합성:
  - `extra_data.approval_status`: `pending_verified` → `approved`
  - `extra_data.template_id_received_at`: 유지 (감사 추적)
  - `extra_data.activated_at`: `DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m-%dT%H:%i:%s+09:00')` 으로 실 적용 시각 KST 기록
  - `common_codes.updated_at`: `CURRENT_TIMESTAMP`

본 PR 은 검수 통과 전이라 develop 머지 보류 — 통과 즉시 deployer 위임 1회로 머지 → main 반영 가능.
