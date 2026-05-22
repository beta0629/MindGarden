# ALIMTALK_BIZ_TEMPLATE_CODE — 솔라피 검수 통과 후 templateId 갱신 절차

**대상 템플릿**: 8종 (2026-05-23 솔라피 콘솔 등록 — `검수진행중` 상태)
**관련 시드**: `src/main/resources/db/migration/V20260528_001__seed_alimtalk_biz_template_code_8types.sql`
**관련 코드**: `AlimtalkTemplateMappingResolver`, `BatchNotificationDispatchServiceImpl`,
`AdminTestNotificationServiceImpl`, `AdminManualNotificationServiceImpl`,
`NotificationServiceImpl#resolveAlimTalkBizTemplateCode`

---

## 1. 배경

- **시드(V20260528_001)** 는 `code_label = ''` (빈 문자열) 로 8건을 미리 생성한다.
- `AlimtalkTemplateMappingResolver` 는 `code_label` 이 `null/blank` 이면 매핑 미발급으로 간주
  → 호출자별 안전한 폴백 경로로 진입한다.
  - **배치 디스패치 (정보성 7종)** — F1 SMS 폴백 자동 진행.
  - **배치 디스패치 (마케팅 1종 — `SESSION_RENEW_PROMPT`)** — F2 정책에 따라 SMS 폴백 미수행.
  - **어드민 테스트/수동 발송 (공통코드 모드)** — `TEMPLATE_NOT_MAPPED` 차단(라이브 토글로 우회 가능).
  - **운영 호출부 (`NotificationServiceImpl#sendKakaoAlimTalk`)** — `type.name()` (내부 키) 로 폴백 후
    `KakaoAlimTalkServiceImpl` 의 `templateId` 검증 단계에서 발송 차단(SMS/이메일 폴백 정책 적용).
- **솔라피 검수 통과** 시 사용자가 콘솔에서 8개 `templateId(KA01TP…)` 를 회수해 운영 DB 에 갱신해야 한다.

---

## 2. 갱신 방식 — **신규 Flyway PR 권장 (이력 추적 + 운영 게이트 통과)**

### 2.1 권장 — 신규 Flyway 시드 PR

새 마이그레이션 파일 `V<YYYYMMDD>_NNN__update_alimtalk_biz_template_code_solapi_ids.sql` 로
`UPDATE` 8건을 작성하여 PR 한다. 장점:

- **이력 추적**: `flyway_schema_history` 에 적용 시점·체크섬이 기록.
- **재현성**: 운영·검증·DR DB 모두 동일한 절차로 적용.
- **롤백 가능**: 직전 값을 복원하는 보강 PR 로 즉시 회복.

```sql
-- 예: V20260601_001__update_alimtalk_biz_template_code_solapi_ids.sql
-- 솔라피 콘솔 검수 통과 — 8종 templateId 회수 후 code_label 갱신.
-- 직전 값(빈 문자열) 백업: 본 파일 적용 전 별도 SELECT 로 캡처 (§4 참고).

UPDATE common_codes
   SET code_label = 'KA01TP260523000000001RESERVATION_REMINDER_D2',
       updated_at = NOW()
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'RESERVATION_REMINDER_D2';

UPDATE common_codes
   SET code_label = 'KA01TP260523000000002RESERVATION_IMMEDIATE_SINGLE',
       updated_at = NOW()
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'RESERVATION_IMMEDIATE_SINGLE';

UPDATE common_codes
   SET code_label = 'KA01TP260523000000003RESERVATION_IMMEDIATE_LATE',
       updated_at = NOW()
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'RESERVATION_IMMEDIATE_LATE';

UPDATE common_codes
   SET code_label = 'KA01TP260523000000004SESSION_ENDING_SOON',
       updated_at = NOW()
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'SESSION_ENDING_SOON';

UPDATE common_codes
   SET code_label = 'KA01TP260523000000005SESSION_RENEW_PROMPT',
       updated_at = NOW()
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'SESSION_RENEW_PROMPT';

UPDATE common_codes
   SET code_label = 'KA01TP260523000000006CLIENT_WELCOME_FIRST',
       updated_at = NOW()
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'CLIENT_WELCOME_FIRST';

UPDATE common_codes
   SET code_label = 'KA01TP260523000000007INITIAL_GUIDE_OFFLINE',
       updated_at = NOW()
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'INITIAL_GUIDE_OFFLINE';

UPDATE common_codes
   SET code_label = 'KA01TP260523000000008INITIAL_GUIDE_ONLINE',
       updated_at = NOW()
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = 'INITIAL_GUIDE_ONLINE';
```

> **주의**: 위 `KA01TP…` 값은 **샘플** 이며 검수 통과 후 솔라피 콘솔 실제 값으로 교체해야 한다.
> placeholder/더미 값은 **운영 게이트(§17/§1.3) 위반** 이므로 검수 통과 전까지 절대 적용 금지.

### 2.2 대체 — 핫픽스 직접 SQL (긴급 시 한정)

운영 점검 시간 등 PR 사이클을 기다릴 수 없는 상황에서만 사용한다. 이 경우에도
실행 후 동일 내용의 Flyway PR 을 **반드시** 후행 등록해 이력을 보존한다.

```sql
-- 핫픽스 직접 SQL (점검 시간 한정)
UPDATE common_codes
   SET code_label = '<KA01TP...>',
       updated_at = NOW()
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
   AND code_value = '<RESERVATION_REMINDER_D2 ...>';
-- 8건 반복
```

---

## 3. 갱신 후 검증 절차

### 3.1 DB 확인 (검수 통과 8건 모두 KA01TP… 인지)

```sql
SELECT code_value, code_label, sort_order, is_active
  FROM common_codes
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
 ORDER BY sort_order;
-- 기대: 8 rows, code_label 모두 'KA01TP…' 시작, is_active = TRUE
```

### 3.2 어드민 테스트 발송 (라이브 토글 OFF — 공통코드 모드)

- 어드민 → 시스템 도구 → 알림 발송 테스트 → `RESERVATION_REMINDER_D2` 선택
- 자기 자신 번호로 1건 발송 → 알림톡 도착 확인.
- 8종 모두 동일 절차 반복(또는 batch 1건씩 라이브 발송).

### 3.3 배치 디스패치 dry-run → 라이브

- DEV `batch.notification.dry-run = true` 상태에서 D-2 스케줄러 트리거 → 로그에 `solapiTemplateId` 가
  `KA01TP…` 로 기록되는지 확인.
- 이후 `dry-run = false` 로 전환하고 1건 라이브 발송.

### 3.4 운영 적용 시점

- **권장**: 솔라피 검수 통과 즉시(영업일 09:00–17:00 KST) 적용.
  - 이유: 검수 통과 후에도 발송 실패 시 SMS 폴백이 동작 중이므로 사용자 영향 최소.
- **점검 필요 시**: 점검 시간(주말 22:00–02:00 KST) 적용.
- **금지**: 마케팅 템플릿 `SESSION_RENEW_PROMPT` 만 별도 적용하는 것은 권장하지 않음 — 일괄 적용.

---

## 4. Rollback 절차

### 4.1 사전 백업 (UPDATE 직전 캡처)

```sql
-- 갱신 전 전체 스냅샷 (이전 값 = 빈 문자열)
SELECT id, tenant_id, code_group, code_value, code_label, sort_order, updated_at
  FROM common_codes
 WHERE tenant_id IS NULL
   AND code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
 ORDER BY sort_order;
-- 결과를 별도 파일로 저장 (예: ops/backup/2026-XX-XX_alimtalk_template_pre_rotation.csv)
```

### 4.2 즉시 우회 — 라이브 토글로 폴백

`NotificationServiceImpl` 호출 경로는 매핑 누락 시 `type.name()` 으로 폴백 후
`KakaoAlimTalkServiceImpl` 검증에서 차단되어 SMS/이메일 폴백이 동작한다.
배치 디스패치도 SMS 폴백이 자동 진행되므로, 잘못된 templateId 가 기록되었을 때 다음과 같이
즉시 빈 문자열로 되돌려 안전한 폴백 상태로 회복한다:

```sql
UPDATE common_codes
   SET code_label = '',
       updated_at = NOW()
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

### 4.3 정상 복구 — 백업 SQL 재적용

§4.1 백업 SQL 의 직전 값(또는 정상 templateId)을 다시 적용해 운영 상태로 복귀한다.

---

## 5. 본 PR (V20260528_001) 단독 머지 가능성

- **DEV 머지 영향도**: 0 — `code_label = ''` 라 resolver 가 매핑 미발급으로 처리하고 SMS/F2 폴백이
  동작한다. 기존 호출부에 패치 0건.
- **운영 영향도**: 0 — 솔라피 검수 통과 전까지는 알림톡 발송이 코드상 차단되며, SMS 폴백으로
  사용자 알림은 유지된다. 검수 통과 후 §2 의 후행 PR 로 templateId 를 일괄 갱신한다.

---

## 6. 체크리스트

- [ ] V20260528_001 시드 머지 후 DEV `flyway:validate` PASS 확인
- [ ] 솔라피 콘솔 검수 결과 모니터링 (8종 모두 `검수완료` 진입 시점 기록)
- [ ] 8개 templateId(KA01TP…) 회수 → 후행 Flyway PR 작성
- [ ] §4.1 백업 SQL 실행 → 결과 파일 저장 (운영 DB 적용 전)
- [ ] DEV 적용 → §3.2 어드민 테스트 발송 통과
- [ ] 운영 적용 → §3.3 배치 dry-run 로그 확인
- [ ] 운영 라이브 발송 1건 → 알림톡 도착 확인
- [ ] 발송 실패 시 §4.2 빈 문자열 회복 SQL 즉시 적용 가능 상태 유지
