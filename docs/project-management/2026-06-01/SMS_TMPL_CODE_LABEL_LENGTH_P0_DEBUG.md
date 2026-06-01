# P0 디버그 보고서 — 어드민 SMS 템플릿 본문 저장 "데이터 제약 위반" (2026-06-01)

## 1. 사용자 보고

- URL: `https://mindgarden.core-solution.co.kr/admin/sms-templates`
- 시나리오: SMS 템플릿 목록에서 **2일 전 메시지(`RESERVATION_REMINDER_D2`) 본문 수정 후 저장** 시 400 응답.
- 콘솔 로그(요약):
  - `PUT https://mindgarden.core-solution.co.kr/api/v1/admin/sms-templates/RESERVATION_REMINDER_D2 → 400 (Bad Request)`
  - `❌ [표준화 API] PUT /api/v1/admin/sms-templates/RESERVATION_REMINDER_D2 실패: Error: 데이터 제약 위반입니다.`
  - `SMS 템플릿 저장 실패 Error: 데이터 제약 위반입니다.`

## 2. 확정 원인 (H2 PROVEN)

**`common_codes.code_label` 컬럼 정의가 VARCHAR(100) NOT NULL** — SMS 본문 저장 용도로 부적절.

### 2.1 운영 DB 스키마 실측

```
COLUMN_NAME   COLUMN_TYPE       IS_NULLABLE   CHARACTER_MAXIMUM_LENGTH
code_label    varchar(100)      NO            100
code_description varchar(500)   YES           500
extra_data    varchar(1000)     YES           1000
korean_name   varchar(100)      NO            100
```

### 2.2 시드 본문 길이 실측 (V20260529_004 + V20260603_001 적용 후)

| code_value | char_length | 비고 |
|---|---|---|
| `INITIAL_GUIDE_OFFLINE` | **100** | 한도 도달 |
| `INITIAL_GUIDE_ONLINE` | 99 | |
| `DEPOSIT_PENDING_REMINDER` | 99 | |
| `RESERVATION_IMMEDIATE_LATE` | 93 | |
| **`RESERVATION_REMINDER_D2`** | **93** | 사용자가 7자 이상 추가하면 한도 초과 |

### 2.3 DTO vs DB 불일치

```java
// SmsTemplateUpdateRequest.java
@NotBlank(message = "본문은 필수 입력입니다.")
@Size(max = 500, message = "SMS 본문은 최대 500자까지 가능합니다.")
private String content;
```

- 백엔드 의도: **최대 500자**.
- DB 실제 제약: **100자**.
- 사용자 본문이 100자 초과 시 JPA `save()` → MariaDB error 1406 `Data too long for column 'code_label'` → `DataIntegrityViolationException` → `GlobalExceptionHandler.handleDataIntegrityViolation` (`src/main/java/.../GlobalExceptionHandler.java:334`) → 응답 `{ "message": "데이터 제약 위반입니다." }` 400.

### 2.4 사용자 보고 메시지 일치

- 응답 본문 메시지 "데이터 제약 위반입니다." 는 `GlobalExceptionHandler` 의 표준 매핑.
- 프론트는 backend message 를 그대로 표시 (별도 매핑 없음 — `frontend/` 전체 검색 결과 0 hit).

## 3. 가설 매트릭스

| ID | 가설 | 결과 |
|---|---|---|
| H1 | `findCoreCodeByGroupAndValue` (`is_active=true` 강제) empty → IllegalArgumentException | FALSIFIED — 운영 DB 글로벌 row id=576 `is_active=1`, V20260603_001 정상 복원 적용 |
| H2 | `code_label` VARCHAR(100) 초과 → DataIntegrityViolationException | **PROVEN** — DB 스키마 + 시드 길이 + 응답 메시지 일치 |
| H3 | UNIQUE 제약 `uk_tenant_code_group_value` 충돌 (테넌트 row 중복) | FALSIFIED — 운영 DB 테넌트 override row 0건 |
| H4 | `findTenantCodeByGroupAndValue` (`is_active=true`) 비활성 row 못 찾고 INSERT 시도 → UNIQUE 충돌 | FALSIFIED — 테넌트 row 자체 없음 |

## 4. 핫픽스 권고 (옵션 A 채택)

**Flyway V20260607_001 + Entity `CommonCode.codeLabel` length 갱신.**

| 영역 | 변경 |
|---|---|
| `src/main/resources/db/migration/V20260607_001__extend_common_codes_code_label_to_500.sql` | `code_label` VARCHAR(100) → VARCHAR(500), 멱등 (CHARACTER_MAXIMUM_LENGTH 기반 가드) |
| `src/main/java/com/coresolution/consultation/entity/CommonCode.java` | `@Column(length = 100)` → `length = 500`, JavaDoc 보강 |

검증:
- `mvn test -Dtest=SmsTemplate*` → 21/21 PASS
- `mvn test -Dtest=CommonCode*,AdminSmsTemplate*` → 26/26 PASS

## 5. 부차 발견 (별도 후속 PR 권고)

- `SmsTemplateServiceImpl.findTemplateContent/listForAdmin/upsertTenantOverride/...` 가 `findCoreCodeByGroupAndValue` (`is_active=true` 강제) 에 의존 — V20260602_001 류의 시드 비활성 마이그 적용 시 어드민 SMS 콘솔 전체가 무응답.
- 권고: SMS 템플릿 row 의 비활성 여부와 무관하게 어드민이 본문을 편집할 수 있도록 `findCoreCodeByGroupAndValueIncludeInactive` 류의 신규 메서드 도입 (이번 PR 범위 외 — 메인 P0 차단 완료 후 진행).

## 6. 운영 반영 권고

1. PR 머지 → develop FF → main FF → `deploy-production` 트리거.
2. Flyway V20260607_001 적용 검증:
   ```sql
   SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME='common_codes' AND COLUMN_NAME='code_label';
   -- 기대: varchar(500)
   ```
3. blue/green cutover 후 어드민 UI 에서 `RESERVATION_REMINDER_D2` 본문을 100자 초과로 저장 → 200 응답 확인.
4. 10~30분 모니터링 (`AdminSmsTemplate*` ERROR 0건).

---

작성 환경: 메인 에이전트 직접 진단 (사용자 quota 보전).
