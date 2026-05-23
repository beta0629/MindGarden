# 운영 반영 사전 점검 리포트 — 2026-05-23

- **작성일**: 2026-05-23
- **대상 범위**: DEV `develop` 반영 완료 커밋 7건 (`1d97d41f7..1794d2ca8`) — 운영(`main`) 반영 전 사전 점검
- **본 문서 위치**: `docs/project-management/2026-05-23/PROD_GO_LIVE_READINESS_2026_05_23.md`
- **참조 표준**:
  - `/.cursor/agents/core-deployer.md` (저장소 워크플로 기준만, 추측 금지)
  - `/.cursor/skills/core-solution-deployment/SKILL.md`
  - `docs/standards/DEPLOYMENT_STANDARD.md`
  - `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`
  - `docs/project-management/2026-05-23/ALIMTALK_TEMPLATE_ID_ROTATION.md`
  - `docs/project-management/2026-05-23/NOTIFICATION_BATCH_MESSAGE_DESIGN.md`

> **본 문서의 목적**: **체크리스트·영향 분석·롤백 절차의 사실 정리.** 운영 트리거는 사용자 명시 시점에 별도 위임으로 수행한다. 본 문서가 단독으로 운영 반영을 권고하지 않는다.

---

## §0. 대상 커밋 7건 (DEV develop 반영 완료)

| # | SHA | 제목 |
|---|-----|------|
| 1 | `67a1c7cb6` | feat(admin): 어드민 수동 알림 발송 도구 — 다중 50명 일괄 발송 + batch_id 추적 |
| 2 | `719155731` | fix(push): 디바이스 사용자 격리 + actor 제외 + 결제 푸시 화이트리스트 |
| 3 | `92838a575` | feat(notification): 예약 안내 배치 + 회기 종료 + 환영/초기 안내 8종 + SMS 폴백 |
| 4 | `b4d64b4c9` | chore(scheduler): admin_test_notification_logs + notification_batch_send_log 90일 retention 스케줄러 |
| 5 | `a3bc22dd3` | ops(deploy): blue/green cutover 후 idle 슬롯 JAR 자동 동기화 (V73 회귀 방지) |
| 6 | `2d8cb03f8` | feat(notification): ALIMTALK_BIZ_TEMPLATE_CODE 8종 공통코드 시드 스켈레톤 + 갱신 절차 |
| 7 | `1794d2ca8` | feat(db): alimtalk biz template code 8 templateId UPDATE (V20260528_002) — 옵션 C 비활성 |

---

## §1. 운영 반영 영향 매트릭스 (트랙별)

| # | 트랙 | 핵심 변경 | 운영 사용자 영향 | 안전성 | 비고 |
|---|------|-----------|------------------|--------|------|
| 1 | **수동 알림 발송 도구 (P1)** | 어드민 LNB 신규 메뉴 + Controller(`/api/v1/admin/manual-notifications`) + Service + DTO + RecipientPicker UI | 어드민이 **명시 호출 시만** SMS/알림톡 발송. 일반 사용자 영향 0 | **안전** | STAFF/ADMIN 권한 게이트 + rate-limit 재사용 |
| 2 | **푸시 정책 fix 4건 (D-1/D-2/D-3/D-4)** | 디바이스↔사용자 격리 강화, actor 본인 제외, 결제 푸시 화이트리스트 | **의도된 개선** — 잘못 수신되던 노이즈 푸시 감소. 정상 푸시 영향 0 | **안전** | 회귀 테스트 PASS 확인 필요 |
| 3 | **알림 배치 8종 + 이벤트 hook** | D-2 09:00 KST 스케줄러 + 6개 이벤트 트리거 (welcome, initial-guide on/offline, session-ending-soon, session-renew-prompt, immediate-single, immediate-late) | **검수 통과 전**: V20260528_002 가 `is_active=false` → 알림톡 매핑 미발견 → **정보성 7종은 SMS 폴백 발화 가능**. SESSION_RENEW_PROMPT 는 F2 skip_marketing 로 차단 | **트리거 차단 필요** | §2 옵션 X-1 (dry-run=true) 권장 |
| 4 | **90일 retention 스케줄러** | 매일 03:30 KST `admin_test_notification_logs` / `notification_batch_send_log` DELETE | 운영 반영 직후 90일 이상 row 없음 → 영향 0 (점진적 적용) | **안전** | `APP_NOTIFICATION_RETENTION_DRY_RUN=true` 옵션 있음 (검증용) |
| 5 | **blue/green idle JAR 동기화** | `deploy-production.yml` 에 cutover 후 idle 슬롯 JAR 동기화 step 추가 | **다음 운영 배포부터 자동 적용** — V73 회귀 방지 | **안전** | 워크플로 자체 변경 (런타임 영향 없음) |
| 6 | **ALIMTALK 시드 8건 (V20260528_001)** | `common_codes.ALIMTALK_BIZ_TEMPLATE_CODE` 8건 INSERT (멱등, code_label='') | resolver `isActive=true AND code_label=''` → `isBlank()` 처리 → null 반환 → 동일하게 SMS 폴백 | **안전** | 시드만으로는 매핑 발화하지 않음 |
| 7 | **ALIMTALK templateId UPDATE (V20260528_002, 옵션 C)** | 8건에 KA01TP… 주입 + `is_active=FALSE` 일괄 전환 | resolver `AND c.isActive = true` JPQL 가드로 row 미반환 → 알림톡 스킵 → SMS 폴백 (정보성) / F2 skip (마케팅) / TEMPLATE_NOT_MAPPED 차단 (어드민 도구) | **안전** | `V20260528_003` 사전 작성됨 — 검수 통과 후 단일 SQL 토글로 활성화 |

### §1.1 추가 신규 마이그레이션 (커밋 7건 외 — 동일 develop 반영 범위)

| 파일 | 영향 |
|---|---|
| `V20260528_004__add_idx_created_at_for_retention.sql` | retention DELETE 성능 인덱스 추가 (멱등 ALTER, 코드 변경 0) — **안전** |

---

## §2. 알림 배치 트리거 검수 통과 전 차단 옵션

> **사실 근거**: `BatchNotificationDispatchServiceImpl.dispatchInternal()` 에서 `properties.isDryRun()` true 시 외부 호출 0건 + 멱등 로그 INSERT 없이 `DRY_RUN` outcome 반환. 모든 이벤트 hook(welcome/initial-guide/session-ending-soon/session-renew-prompt/immediate-*)이 동일 메서드 경유.

### 옵션 X-1: `notification.batch.dry-run=true` (드라이런 모드) — **권장 ✓**

- **Spring 키**: `notification.batch.dry-run` (`BatchNotificationProperties.dryRun`)
- **ENV 매핑**: `NOTIFICATION_BATCH_DRY_RUN=true`
  - Spring relaxed binding: `notification.batch.dryRun` ↔ `NOTIFICATION_BATCH_DRY_RUN`
- **적용 위치**:
  - 옵션 A. 운영 ENV 파일 (예: `/etc/mindgarden/mindgarden.env` 의 `Environment="NOTIFICATION_BATCH_DRY_RUN=true"`) — 사용자 SSH 1줄 추가 + 서비스 재기동
  - 옵션 B. `deployment/application-production.yml` 의 `notification.batch.dry-run: true` 추가 — 코드 PR + 운영 재배포 필요 (불가역적, 비권장)
- **영향**:
  - D-2 배치 스케줄러 발화 시: 후보 카운트 로그 + `[DRY-RUN]` 로그만 출력, **실 발송 0건**
  - 이벤트 hook 6종 발화 시: `[DRY-RUN]` 로그만 출력, **실 발송 0건**
  - `notification_batch_send_log` INSERT 미수행 (멱등 키 점유하지 않음)
- **검수 통과 후 토글**: ENV `NOTIFICATION_BATCH_DRY_RUN=false` 변경 + 서비스 재기동 → 즉시 발화

### 옵션 X-2: `notification.batch.reservation-reminder-enabled=false` (D-2 배치 한정 비활성)

- **Spring 키**: `notification.batch.reservation-reminder-enabled` (`@ConditionalOnProperty` + `BatchNotificationProperties.reservationReminderEnabled`)
- **ENV 매핑**: `NOTIFICATION_BATCH_RESERVATION_REMINDER_ENABLED=false`
- **영향**:
  - **D-2 09:00 KST 배치 스케줄러 빈 자체 비활성** (Spring `@ConditionalOnProperty`)
  - **이벤트 hook 6종은 그대로 동작** (welcome / initial-guide / session-ending-soon / session-renew-prompt / immediate-single / immediate-late)
  - 결과: 정보성 SMS 폴백 발화는 **여전히 가능**. 부분 차단.
- **사용 시나리오**: D-2 배치만 한 번 더 검증하고 싶을 때. 본 운영 반영에는 **부적합** (이벤트 hook 차단 불가).

### 옵션 X-3: 운영 반영 보류 (Hold)

- 검수 통과 통지 후 함께 운영 반영. 본 옵션 채택 시 다른 6개 트랙(수동 발송 도구·푸시 정책·retention·blue/green·시드·UPDATE)이 동반 지연.
- 가장 보수적이나 비용도 가장 큼.

### §2.1 권장 사항 (사실·옵션 비교 기반)

| 우선순위 | 옵션 | 이유 |
|---|---|---|
| 1 (권장) | **X-1 (`NOTIFICATION_BATCH_DRY_RUN=true`)** | 배치·이벤트 hook 전부 외부 호출 0건 차단 + 스케줄러·hook 자체 동작 검증은 진행. 검수 통과 후 ENV 1줄 + 재기동으로 즉시 활성. |
| 2 | X-3 (Hold) | 다른 6개 트랙 동반 지연 비용을 감수할 때만. |
| 3 (단독 부적합) | X-2 | 이벤트 hook 차단 못함. X-1 보조용으로만 가치 있음. |

---

## §3. Flyway 마이그레이션 운영 적용 시 영향

| 파일 | 영역 | 멱등성 | 운영 영향 | Rollback |
|---|---|---|---|---|
| `V20260526_001__create_admin_test_notification_logs.sql` | 어드민 테스트 로그 테이블 | `CREATE TABLE IF NOT EXISTS` | **이미 운영 적용됨** (P4 사이클) | N/A |
| `V20260526_002__lnb_admin_test_notification_menu.sql` | LNB 메뉴 추가 | `INSERT ... WHERE NOT EXISTS` | **이미 운영 적용됨** | N/A |
| `V20260526_003__add_batch_id_to_admin_test_notification_logs.sql` | `batch_id VARCHAR(36)` 컬럼 + 인덱스 추가 | `INFORMATION_SCHEMA.COLUMNS`/`STATISTICS` 가드 | 신규 — ALTER 1회. 코드 변경 0 | `ALTER TABLE … DROP COLUMN batch_id` + 인덱스 DROP (수동) |
| `V20260526_004__lnb_admin_manual_notification_menu.sql` | 수동 알림 발송 LNB 메뉴 | `INSERT ... WHERE NOT EXISTS` + 고정 `sort_order` UPDATE | 신규 — `ADM_REPORTS_COMP` sort_order 10→11 이동 | `UPDATE menus SET is_active=false WHERE menu_code='ADM_SETTINGS_MANUAL_NOTIFICATION'` |
| `V20260527_001__create_notification_batch_send_log.sql` | 배치 멱등성 로그 테이블 | `CREATE TABLE IF NOT EXISTS` + 인덱스 가드 | 신규 — 빈 테이블 생성, 즉시 영향 0 | DROP TABLE (운영 적용 후 데이터 누적 시 비파괴 권장 안 함) |
| `V20260528_001__seed_alimtalk_biz_template_code_8types.sql` | 공통코드 8건 시드 | `INSERT ... WHERE NOT EXISTS` | 신규 — `code_label=''` resolver isBlank() → null 반환. **알림톡 매핑 미발화** (시드만으로는 안전) | `UPDATE common_codes SET is_active=false WHERE code_group='ALIMTALK_BIZ_TEMPLATE_CODE' AND tenant_id IS NULL` |
| `V20260528_002__update_alimtalk_biz_template_code_solapi_ids.sql` | 8건 templateId 주입 + `is_active=FALSE` | `AND (code_label IS NULL OR code_label='')` 가드 | 신규 — `is_active=FALSE` 로 resolver row 미반환 → SMS 폴백 / TEMPLATE_NOT_MAPPED | rotation §5: `UPDATE common_codes SET is_active=false …` (이미 false 면 NO-OP) |
| `V20260528_004__add_idx_created_at_for_retention.sql` | retention DELETE 인덱스 추가 | `INFORMATION_SCHEMA.STATISTICS` 가드 | 신규 — ALTER 2회 (admin_test_notification_logs / notification_batch_send_log). 코드 변경 0 | `ALTER TABLE … DROP INDEX idx_*_created_at` (수동) |

### §3.1 사전 작성 (검수 통과 후 머지 대기)

| 파일 | 영역 | 활성화 트리거 |
|---|---|---|
| `V20260528_003__activate_alimtalk_biz_template_code_8types.sql` | 8건 `is_active=FALSE → TRUE` 토글 + extra_data `approval_status=approved` | **솔라피/카카오 검수 통과 통지 수신 후** 별도 PR 머지 (사전 작성됨) |

> **주의**: 본 운영 반영 범위에는 `V20260528_003` 포함하지 않는다. 검수 통과 후 별도 PR 로 머지.

---

## §4. 4-Phase 사전 검증 체크리스트

### Phase A — 사전 점검 (운영 반영 D-1 또는 직전)

- [ ] DEV `develop` 24h smoke 모니터링 — error rate < 0.5%, 알림 발송 성공률 회귀 없음
- [ ] DEV `flyway_schema_history` 에 V20260526_003·V20260526_004·V20260527_001·V20260528_001·V20260528_002·V20260528_004 6건 SUCCESS 확인
- [ ] DEV 수동 발송 도구 단건 SMS·라이브 알림톡 발송 OK (어드민 본인 번호 + 별도 휴대폰)
- [ ] DEV 푸시 정책 4건 회귀 검증 (consultant↔client actor 제외 / 디바이스 격리 / 결제 푸시 화이트리스트)
- [ ] DEV 회귀 테스트 232+/232+ PASS 유지
- [ ] DEV 알림 배치 dry-run 토글 OFF 상태에서 정보성 SMS 폴백 발화 1건 확인 (또는 매핑 차단 로그)
- [ ] **운영 ENV 파일에 `NOTIFICATION_BATCH_DRY_RUN=true` 추가** (사용자 SSH 수행 — 본 작업은 코드 PR 아님)
- [ ] (선택) 카카오 검수 통과 통지 수신 여부 확인 — 통과 전이라도 옵션 X-1 적용 시 안전

### Phase B — 운영 반영

- [ ] `develop → main` fast-forward merge PR 생성 (`gh pr create --base main --head develop`)
- [ ] PR CI 통과 확인 (회귀 테스트 / 하드코딩 게이트 / Flyway dry-run)
- [ ] main merge (squash 또는 fast-forward — 팀 컨벤션 확인)
- [ ] 운영 워크플로 자동 트리거 확인 (`deploy-production.yml`)
  - 트리거 근거: `on.push.branches: [main]` + `paths: src/main/java/com/coresolution/consultation/**`, `db/migration/**`, `application.yml`, `.github/workflows/deploy-production.yml`
- [ ] blue/green cutover 모니터링 (5~10분) — 새 슬롯 헬스 200 확인 후 nginx upstream 갱신
- [ ] 운영 DB `flyway_schema_history` 6건 SUCCESS 확인
- [ ] active 슬롯 외부 헬스체크 200 (`https://api.../actuator/health`)
- [ ] **idle 슬롯 JAR 자동 동기화 로그 확인** (a3bc22dd3 효과 — V73 회귀 방지)

### Phase C — 사후 검증 (운영 반영 후 1h 내)

- [ ] 운영 어드민 수동 발송 도구 LNB 메뉴 노출 (`ADM_SETTINGS_MANUAL_NOTIFICATION`, STAFF/ADMIN)
- [ ] 운영 어드민 수동 발송 도구 SMS 1건 발송 OK (admin 본인 번호)
- [ ] 운영 어드민 수동 발송 도구 알림톡 시도 시 `ERROR_CODE_TEMPLATE_NOT_MAPPED` 정상 반환 (검수 통과 전 의도된 동작)
- [ ] 운영 푸시 정책 4건 회귀 확인 (consultant↔client actor 제외 / 결제 푸시 화이트리스트)
- [ ] **운영 알림 배치 dry-run 로그 확인** — `[DRY-RUN] 발송 시뮬레이션` 라인 (실 발송 0건)
- [ ] 운영 로그 모니터링 5min (ERROR rate < 0.5%)

### Phase D — 검수 통과 후 활성화 (1~3일 후, 별도 머지)

- [ ] 솔라피/카카오 검수 통과 8종 확인 (콘솔 스크린샷 첨부)
- [ ] `V20260528_003` 사전 작성 PR 머지 (`develop → main`)
- [ ] 운영 DB `V20260528_003` SUCCESS 확인 (8건 `is_active=TRUE` 토글)
- [ ] 운영 ENV `NOTIFICATION_BATCH_DRY_RUN=false` 변경 + 서비스 재기동
- [ ] 어드민 도구로 8종 each 1건 발송 OK (알림톡 매핑 모드 발화)
- [ ] 이벤트 hook 발화 시 알림톡 실 발송 확인 (consultant_client_mapping create → CLIENT_WELCOME_FIRST)
- [ ] D-2 09:00 KST 배치 익일 발화 시 `notification_batch_send_log` UNIQUE 멱등 가드 확인
- [ ] 운영 로그 ERROR rate < 0.5% 유지 (검수 통과 후 24h)

---

## §5. Rollback 매트릭스

| 트랙 | 이상 발생 시 즉시 차단 | 코드 revert 여부 | 비고 |
|---|---|---|---|
| 수동 알림 발송 도구 | `UPDATE menus SET is_active=false WHERE menu_code='ADM_SETTINGS_MANUAL_NOTIFICATION'` (LNB 비노출) | 메뉴 비활성만으로 충분 | API 자체는 STAFF/ADMIN 게이트로 일반 사용자 영향 0 |
| 푸시 정책 fix 4건 | 즉시 차단 옵션 없음 — 커밋 `719155731` revert 필요 | **필요** (신중) | 운영 푸시 회귀 의심 시 revert PR + 재배포 |
| 알림 배치 8종 + 이벤트 hook (정보성 7종 + 마케팅 1종) | ENV `NOTIFICATION_BATCH_DRY_RUN=true` + 재기동 | 불필요 (ENV 토글) | D-2 한정 차단은 `NOTIFICATION_BATCH_RESERVATION_REMINDER_ENABLED=false` |
| 90일 retention 스케줄러 | ENV `APP_NOTIFICATION_RETENTION_ENABLED=false` + 재기동 | 불필요 | dry-run 만 원하면 `APP_NOTIFICATION_RETENTION_DRY_RUN=true` |
| blue/green idle JAR 동기화 | 워크플로 step revert 또는 step disable | **워크플로 PR** | 다음 배포부터 즉시 적용/해제 가능 |
| ALIMTALK 시드 8건 (V20260528_001) | resolver `isBlank()` 또는 `isActive=false` 가드로 자동 무영향 | 불필요 | 시드 자체는 발화 없음 |
| ALIMTALK templateId UPDATE (V20260528_002) | rotation §5 참조: `UPDATE common_codes SET is_active=false WHERE code_group='ALIMTALK_BIZ_TEMPLATE_CODE' AND tenant_id IS NULL` | 불필요 | 이미 V20260528_002 에서 `is_active=false` 적용 — NO-OP |

### §5.1 ENV 토글 우선순위 (Rollback 시)

1. **ENV 토글 (재기동만)** — 알림 배치 / retention. 5분 내 효과.
2. **DB UPDATE (커넥션만)** — 메뉴 비활성 / common_codes is_active. 즉시 효과 (캐시 TTL 의존).
3. **워크플로 step revert** — blue/green idle 동기화. 다음 배포 사이클.
4. **코드 revert + 재배포** — 푸시 정책 fix. 30분~1시간.

---

## §6. 사용자 결정 요청 항목

본 사전 점검 리포트는 **체크리스트만 작성**이며 운영 트리거는 사용자 명시 시점에 별도 위임으로 수행한다. 다음 2가지에 대한 명시적 결정 후 통합 deployer 위임 진행.

### Q1. 운영 반영 시점

- **A. 즉시 (오늘)** — Phase A 사전 검증 단축, DEV 24h smoke 생략하고 바로 진행
- **B. DEV 24h smoke 후 (내일 이후)** — Phase A 전체 완료 후 진행 (권장)
- **C. 검수 통과 통지 후 (Hold)** — 옵션 X-3, 다른 6개 트랙 동반 지연

### Q2. 알림 배치 트리거 차단 옵션

- **X-1. `NOTIFICATION_BATCH_DRY_RUN=true`** (권장 ✓) — 배치·이벤트 hook 전부 외부 호출 0건 + 스케줄러·hook 동작 검증 진행
- **X-2. `NOTIFICATION_BATCH_RESERVATION_REMINDER_ENABLED=false`** — D-2 배치만 비활성. 이벤트 hook 6종은 여전히 발화 (정보성 SMS 폴백 가능). **단독 부적합**
- **X-3. 운영 반영 보류** — Q1-C 와 동일

### Q3. (선택) 옵션 X-1 적용 위치

- **A. 운영 ENV 파일에 1줄 추가 + 서비스 재기동** (권장 ✓ — 가역적, 검수 통과 후 토글 용이)
- **B. `deployment/application-production.yml` PR 머지** (불가역적, 재배포 필요. 비권장)

---

## §7. 산출물 / 후속 위임

- **본 문서**: `docs/project-management/2026-05-23/PROD_GO_LIVE_READINESS_2026_05_23.md`
- **참조 문서 (변경 없음)**:
  - `docs/project-management/2026-05-23/ALIMTALK_TEMPLATE_ID_ROTATION.md`
  - `docs/project-management/2026-05-23/NOTIFICATION_BATCH_MESSAGE_DESIGN.md`
  - `docs/project-management/2026-05-23/MANUAL_NOTIFICATION_DESIGN_HANDOFF.md`
  - `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`

> **다음 액션 (사용자 결정 후)**:
> 1. Q1·Q2·Q3 응답 수신 → `core-planner` 또는 직접 `core-deployer` 위임으로 운영 반영 실행
> 2. 통합 deployer 위임 시 본 문서 §4 Phase B 체크리스트 인용
> 3. 커밋·푸시는 본 문서 작성 단계에서는 미수행 — 통합 deployer 위임 시 처리
