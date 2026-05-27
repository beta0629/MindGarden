# 내담자 Hard Delete 영향도 재분석 보고서

> **읽기 전용 분석**. core-planner (2026-05-27) 가 explore Agent `f3975fe5` 산출 유실 이후 재분석. `docs/standards/SELF_WITHDRAWAL_PROCESS_AUDIT.md` 와 짝을 이루어 `docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md` 합의서 입력으로 활용.
>
> **범위**: core_solution `mind_garden` 미접촉. `users` 행을 행 단위로 물리 삭제(`DELETE FROM users WHERE id = ?`) 했을 때 운영·재무·법규에 미치는 영향만 분석. 자발 탈퇴(self-withdrawal) UX·법무 논점은 자매 보고서 참조.

---

## TL;DR (executive summary)

1. **현행 SSOT 충돌**: 사용자 종료 플래그가 `users.is_active`(boolean) 와 `users.is_deleted`(boolean, `AuditableTenantBase` 상속) 두 갈래로 분리되어 있고 두 플래그가 동일 사용자에 대해 **불일치 상태로 공존 가능**합니다. 어드민 `AdminServiceImpl.deleteClient` 는 `is_active=false` 만, `UserServiceImpl.deleteUserAccount` → `softDeleteById` 는 `is_deleted=true` 만 설정합니다. → 모든 list/조회 쿼리가 두 플래그 중 어느 쪽을 필터하느냐에 따라 같은 사용자가 "보임/안 보임" 으로 갈립니다.
2. **DB 레벨 FK 부재**: 핵심 운영 테이블(`consultant_client_mappings`, `schedules`, `consultation_records`, `financial_transactions`, `payments`) 은 JPA `@ManyToOne` 또는 `Long` 컬럼만 사용하고 **Flyway 마이그레이션 어디에도 FK 제약이 없습니다**. 즉 `DELETE FROM users WHERE id=?` 는 DB 레벨에서 차단되지 않으며 무수한 고아 행(orphan row) 을 즉시 생성합니다.
3. **신규 테이블 RESTRICT FK 존재**: 2026년 5월 도입 신규 테이블(`mobile_push_tokens`, `mobile_push_settings`, `mood_journal_entries`, `self_assessment_sessions`, `mind_weather_cards`, `shop_carts`, `shop_client_orders`, `client_point_wallets`, `client_point_ledger_entries`, `community_posts`, `community_comments`, `community_post_likes`, `community_reports`) 은 `users(id)` 에 명시 FK(`ON DELETE` 미지정 = MySQL 기본 RESTRICT)를 들고 있어 **이들 행이 1건이라도 있으면 `DELETE FROM users` 가 FK 제약으로 실패**합니다.
4. **회기 SSOT 부정합**: `consultant_client_mappings.{total_sessions, remaining_sessions, used_sessions}` + `schedules.session_sequence` + `schedules.mapping_id` 가 회기 SSOT 인데, 클라이언트 행이 hard delete 되면 매핑·일정의 `client_id`/`mapping_id` 는 살아있고 사용자만 사라져 회기 차감·재무 정산이 영구히 불일치 상태가 됩니다.
5. **결제·ERP 회계 정합성 위반**: `payments.payer_id`, `financial_transactions.related_entity_id` 가 사라진 사용자 PK 를 가리킵니다. 환불·세금계산서·승인액 검증·전자금융거래법 5년 보존(`docs/guides/SECURITY_POLICY.md:75-82`) 이 모두 깨집니다. ERP PortOne webhook(`PortOnePaymentWebhookService`) 가 사후 콜백을 보냈을 때 user join 실패로 dead-letter.
6. **상담일지 의료법 위반 위험**: `consultation_records.{client_id, consultant_id}` 가 사라진 사용자를 참조. 상담일지 자체는 살아남아도 의료법 §22 (진료기록 10년) 가 요구하는 "환자 식별 가능성" 이 사라져 **법적으로 유효한 보존이 아닐 가능성**.
7. **감사 로그 단절**: `personal_data_access_logs.{accessor_id, target_user_id}` 가 string 컬럼이라 FK 는 없지만 추적성이 끊김. 휴면(§39의6)·파기(§39의7) 추적 불가.
8. **시나리오 권장**: **Scenario A — PII Anonymization (행 유지 + 민감 컬럼 익명화)** 가 운영·법규·구현 LOC 모두에서 default 권장. Scenario B (Partial Hard Delete) 는 법규 보존 의무가 없는 신규 테이블(point ledger 외) 에만 적용 가능. Scenario C (True Hard Delete) 는 의료법·세법·전금법 동시 위반 위험으로 **비권장**.

---

## §1. 현행 soft delete 동작 — SSOT 충돌

### §1.1 `is_active` vs `is_deleted` 두 갈래 SSOT

`User` 엔티티는 두 개의 종료 플래그를 동시에 보유합니다.

```125:128:src/main/java/com/coresolution/consultation/entity/User.java
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
```

`User extends BaseEntity extends AuditableTenantBase` 에서 다음을 상속합니다.

```49:54:src/main/java/com/coresolution/consultation/entity/AuditableTenantBase.java
    @Column(name = "deleted_at")
    protected LocalDateTime deletedAt;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    protected Boolean isDeleted = false;
```

→ DB 레벨에서 `users.is_active`, `users.is_deleted`, `users.deleted_at` **세 컬럼이 모두 존재**합니다. 두 플래그를 동시·일관되게 갱신하는 단일 진입점이 없어, 사용 경로에 따라 어느 쪽만 토글됩니다.

### §1.2 진입점별 플래그 사용 매트릭스

| 진입점 | 코드 위치 | 처리 결과 | SSOT 영향 |
|---|---|---|---|
| **`AdminServiceImpl.deleteClient(Long id)`** (어드민 → 내담자 삭제) | `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java:3162-3271` | `client.setIsActive(false); userRepository.save(client);` — 활성 매핑·미결제·미래 스케줄 가드 후 `is_active=false` 만 설정. **`is_deleted` 는 그대로 false 유지**. | 동일 사용자가 `is_active=false, is_deleted=false` 상태 → BaseRepository soft-delete 필터(`isDeleted=false`) 통과해서 일반 list 에 노출될 가능성. |
| **`UserServiceImpl.softDeleteById(Long id)`** | `src/main/java/com/coresolution/consultation/service/impl/UserServiceImpl.java:219-225` | `userRepository.softDeleteByIdAndTenantId(id, tenantId, now())` — JPQL UPDATE 로 `is_deleted=true, deleted_at=now(), version+=1`. **`is_active` 는 변경 없음**. | 동일 사용자가 `is_deleted=true, is_active=true` 상태로 남음. 활성 검색 쿼리(`is_active=true`)에 여전히 포함. |
| **`UserServiceImpl.hardDeleteById(Long id)`** | `src/main/java/com/coresolution/consultation/service/impl/UserServiceImpl.java:235-241` | `userRepository.delete(user)` — JPA `EntityManager.remove` 로 실제 행 물리 삭제. | **본 분석의 1차 대상**. 호출 경로는 사용자 화면 없음. 코드 내부에서만 호출 가능. |
| **`UserServiceImpl.deleteUserAccount(Long id)`** → `softDeleteById` | `src/main/java/com/coresolution/consultation/service/impl/UserServiceImpl.java:1070-1073` | `UserController.deleteAccount` 의 컨트롤러 경로 (`DELETE /api/v1/users/{id}/account`). 본인 확인 가드 없음(자매 보고서 §1.1). | `is_deleted=true` 만 토글. cascade 없음. |
| **`MyPageServiceImpl.deleteAccount(String userId)`** | `src/main/java/com/coresolution/consultation/service/impl/MyPageServiceImpl.java:380-397` | `user.setIsActive(false); userRepository.save(user);` (dead code, 컨트롤러 노출 없음). | `is_active=false` 만. |
| **`PersonalDataRequestServiceImpl.requestPersonalDataDeletion`** | `src/main/java/com/coresolution/consultation/service/impl/PersonalDataRequestServiceImpl.java:106-167` | 비밀번호 검증 후 `PENDING` 로그만 기록. **실제 user 행 변경 코드는 주석 처리**(`user.setIsDeleted(true); ...`). | 변경 없음. |
| **`PersonalDataDestructionService.destroyExpiredUserData`** | `src/main/java/com/coresolution/consultation/service/PersonalDataDestructionService.java:102-146` | "탈퇴 후 1년 경과" 조회는 `is_deleted=true AND updated_at < cutoff` 기준 (라인 101 의 `UserRepository.findExpiredUsersForDestructionByTenantId`). 실제 `userRepository.deleteById(userId)` 는 주석 처리. | NO-OP. |
| **`BaseRepository.softDeleteByIdAndTenantId`** (모든 엔티티 공용) | `src/main/java/com/coresolution/consultation/repository/BaseRepository.java:402-407` | `UPDATE #{#entityName} SET is_deleted=true, deleted_at=:now, version+=1 WHERE id=:id AND tenant_id=:tenantId` | `is_active` 미사용 — JPA `@MappedSuperclass` 기반이라 `User` 의 `is_active` 컬럼은 알지 못함. |

### §1.3 두 플래그가 만드는 "상태 매트릭스"

| 상태 | `is_active` | `is_deleted` | 의미 | 발생 경로 |
|---|---|---|---|---|
| **A. 정상 활성** | `true` | `false` | 로그인·매핑·일정 모두 가능. | 가입 직후. |
| **B. 어드민 비활성** | `false` | `false` | "관리자가 비활성화" — BaseRepository `softDelete` 필터에는 안 잡힘. list/통계에 살아남을 가능성. | `AdminServiceImpl.deleteClient`, `MyPageServiceImpl.deleteAccount`. |
| **C. soft-deleted** | `true` | `true` | 일반 list 에서는 빠지지만 `is_active=true` 검색·통계에는 잡힘. 결제/매핑 join 으로 ghost 노출 가능. | `UserServiceImpl.softDeleteById`, `UserController.deleteAccount`. |
| **D. 완전 종료** | `false` | `true` | "모든 진입점에서 차단" 의도. | **현재 단일 코드 경로 없음** — 어떤 진입점도 두 플래그를 함께 토글하지 않음. |
| **E. hard-deleted** | `(row gone)` | `(row gone)` | 행 자체가 사라짐. FK 가 없는 핵심 운영 테이블은 즉시 고아 행 발생. 신규 테이블(RESTRICT FK) 은 삭제 자체가 실패. | `UserServiceImpl.hardDeleteById` (호출 경로 0건). |

**핵심 결함**: 자발/강제 종료 동선 어디에도 "정상 종료 = 두 플래그 + cascade 정리" 를 보장하는 단일 트랜잭션이 없습니다. 본 합의서가 SSOT 를 통일하지 않으면 어떤 시나리오를 채택해도 운영 사고 위험이 큽니다.

---

## §2. `users.id` FK 의존성 매트릭스

### §2.1 DB 레벨 FK 정의 — Flyway 마이그레이션 기준

`src/main/resources/db/migration/` 전수 검색(`REFERENCES users` / `REFERENCES users(id)`) 결과 **`users.id` 를 FK 로 명시한 마이그레이션은 다음 6건뿐**입니다.

| 마이그레이션 | 참조 테이블 | FK 컬럼 | ON DELETE | 비고 |
|---|---|---|---|---|
| `V21__create_refresh_token_store_table.sql:33` | `refresh_token_store.user_id` | `user_id` | **`CASCADE`** | 리프레시 토큰 — 사용자 삭제 시 자동 정리. |
| `V32__create_user_role_assignments_table.sql:38-39` | `user_role_assignments.user_id` | `user_id` | **`CASCADE`** | 역할 배정 — 사용자 삭제 시 자동 정리. |
| `V20260513_003__create_mind_weather_cards.sql:26-27` | `mind_weather_cards.client_id`, `mind_weather_cards.share_consultant_id` | `client_id`, `share_consultant_id` | **미지정 = RESTRICT (MySQL 기본)** | 행이 1건이라도 있으면 사용자 hard delete 차단. |
| `V20260514_001__create_mobile_push_token_and_settings.sql:21, 40` | `mobile_push_tokens.user_id`, `mobile_push_settings.user_id` | `user_id` | **미지정 = RESTRICT** | 푸시 토큰 1건이라도 있으면 사용자 hard delete 차단. |
| `V20260514_002__mood_journal_self_assessment_wellness.sql:22, 60` | `mood_journal_entries.client_id`, `self_assessment_sessions.client_id` | `client_id` | **미지정 = RESTRICT** | 무드일지·자가평가 1건이라도 있으면 차단. |
| `V20260514_003__client_shop_cart_order_points_mvp.sql:37, 77, 115, 134` | `shop_carts.client_id`, `shop_client_orders.client_id`, `client_point_wallets.user_id`, `client_point_ledger_entries.user_id` | `client_id`, `user_id` | **미지정 = RESTRICT** | 쇼핑 카트·주문·포인트 1건이라도 있으면 차단. |
| `V20260515_002__bw4_community_moderation.sql:26-27, 44, 61, 79` | `community_posts.{author_user_id, moderated_by_user_id}`, `community_comments.author_user_id`, `community_post_likes.user_id`, `community_reports.reporter_user_id` | 다수 | **미지정 = RESTRICT** | 커뮤니티 글·댓글·좋아요·신고 1건이라도 있으면 차단. |

### §2.2 핵심 운영 테이블 — FK 마이그레이션 부재 (orphan 발생 영역)

다음 테이블은 JPA 엔티티에서 `@ManyToOne(User)` 또는 `Long client_id` / `Long consultant_id` 만 사용하며 **Flyway 마이그레이션 어디에도 FK 가 정의되어 있지 않습니다.** (확인 방법: `rg "REFERENCES\s+users" src/main/resources/db/migration` 결과 위 §2.1 6건 외 0건. `CREATE TABLE.*users` 도 결과 0건 — `users` 테이블은 Hibernate `ddl-auto=update` 로 운영 DB 에 생성되었거나 신규 환경에서는 JPA 가 자동 생성하는 구조.)

| 테이블 | FK 컬럼 | JPA 매핑 | DB FK | hard delete 시 |
|---|---|---|---|---|
| `consultant_client_mappings` | `consultant_id`, `client_id` | `ConsultantClientMapping.java:46-54` `@ManyToOne User` | **없음** | 즉시 orphan. `mapping.client.id` 가 사라진 user 가리킴. |
| `schedules` | `consultant_id`, `client_id` | `Schedule.java:36, 74` `Long` 컬럼 | **없음** | 즉시 orphan. 캘린더·KPI 가 user join 실패. |
| `consultation_records` | `client_id`, `consultant_id` | `ConsultationRecord.java:41-47` `Long` 컬럼 | **없음** | 즉시 orphan. **의료법 §22 (10년 보존) 위반 위험**. |
| `payments` | `payer_id`, `recipient_id` | `Payment.java:81, 88` `Long` 컬럼 | **없음** | 즉시 orphan. **전금법 §22 (5년 보존) 위반 위험**. |
| `financial_transactions` | `related_entity_id` (str type 동반), `approver_id` (`@ManyToOne User`) | `FinancialTransaction.java:129-131, 149-157` | **없음** | 즉시 orphan. ERP 정산·세금계산서 발행 정합성 깨짐. |
| `notifications` (스키마 단위, 엔티티 미존재 — `BatchNotificationDispatchService` 가 동적 raw query 로 사용) | `recipient_user_id` 추정 | — | **없음** | 미발송 큐·전송 이력이 user join 실패로 dispatcher 예외. |
| `notification_batch_send_log` | `recipient_user_id` | `NotificationBatchSendLog.java:56` `Long` | **없음** | 알림 중복 차단 unique 키 영구 점유 위험. |
| `consultations` (legacy) | `client_id`, `consultant_id` | `Consultation` 엔티티 | **없음** | orphan. |
| `consultation_record_alerts`, `consultation_record_drafts` | `client_id`, `consultant_id` | `@ManyToOne User` | **없음** | orphan. |
| `clients` (PK 가 `users.id` 동일 할당) | `id` (= `users.id`) | `Client extends AuditableTenantBase`, `Client.java:36-38` `@Id` 자체 할당 | **없음** (FK 미선언) | `clients` 행은 자동 삭제되지 않음. user 만 사라지고 `clients` 행은 유령 상태로 잔존. |
| `user_social_accounts`, `user_addresses`, `user_passkey`, `user_sessions`, `user_activities`, `user_privacy_consent` | `user_id` | `@ManyToOne User` 또는 `Long` | **없음** | orphan. |
| `personal_data_access_logs` | `accessor_id`, `target_user_id` (둘 다 `VARCHAR` — 직접 ID 가 아니라 문자열) | `String` 컬럼 | **없음** (타입상 FK 불가) | 추적성만 끊김. |
| `consultant_ratings`, `consultant_performance`, `consultant_salary_profiles`, `salary_calculations` | `consultant_id`, `client_id` | `@ManyToOne User` 또는 `Long` | **없음** | orphan. 정산·평가 통계 깨짐. |
| `daily_statistics`, `dropout_risk_assessments`, `quality_evaluations` | `client_id`, `consultant_id` 등 | `@ManyToOne` 또는 `Long` | **없음** | orphan. 통계 KPI 깨짐. |

### §2.3 JPA `CascadeType` 동작

- `User.userSocialAccounts` 만 `cascade = CascadeType.ALL` 보유 (`User.java:205-207`) — JPA persist/remove 시점에 함께 처리.
- 그 외 `User` 와 연결된 모든 `@ManyToOne` 측 엔티티는 `User` 측에서 `@OneToMany` 미선언이거나 cascade 가 없어 **JPA `EntityManager.remove(user)` 호출 시 자식 행은 자동 삭제되지 않습니다.**
- 결과: `hardDeleteById` 가 호출되면 **JPA 가 알지 못하는 모든 외부 행이 orphan 또는 RESTRICT FK 위반** 으로 귀결.

---

## §3. 회기 SSOT 영향

### §3.1 회기 SSOT 구성

| 컬럼 | 위치 | 의미 |
|---|---|---|
| `consultant_client_mappings.total_sessions` | `ConsultantClientMapping.java:71-72` | 패키지 총 회기 수 (결제 기준). |
| `consultant_client_mappings.remaining_sessions` | `ConsultantClientMapping.java:74-75` | 남은 회기 수 — 차감 SSOT. |
| `consultant_client_mappings.used_sessions` | `ConsultantClientMapping.java:77-78` | 사용된 회기 수 — `total - remaining` 검증 baseline. |
| `schedules.session_sequence` | `Schedule.java:80-81` | 예약 확정·차감 시점의 회차 번호 (1-based). 가예약·미차감 일정은 null. |
| `schedules.mapping_id` | `Schedule.java:86-87` | 예약·회기 차감 시점의 매핑 PK — "캘린더 회기 표기 SSOT". |

회기 차감·환불·재무 정산·KPI(`PlSqlFinancialServiceImpl.GetBranchFinancialBreakdown`) 가 모두 이 SSOT 를 root truth 로 사용.

### §3.2 hard delete 시 부정합 시나리오

1. **시나리오 A — 내담자 hard delete**
   - `users.id=X` 사라짐.
   - `consultant_client_mappings.client_id=X` 는 orphan. JPA 가 mapping 조회 시 `mapping.client` 가 null 또는 LazyInitializationException 발생.
   - `schedules.client_id=X, mapping_id=Y` 는 살아 있음 → 매핑은 `client_id` 가 orphan → 캘린더는 "유령 회기" 노출.
   - `remaining_sessions > 0` 인 매핑이 있던 경우: 환불 자동 처리 흐름(`AdminController.partialRefund`) 이 user join 실패로 폭발.
   - KPI(`PlSqlFinancialServiceImpl.GetBranchFinancialBreakdown`) 가 raw SQL 로 `JOIN users` 또는 `LEFT JOIN users` 사용 시 결과 누락 또는 NULL 행 발생 — 매출·환불 통계가 영구히 어긋남.

2. **시나리오 B — 상담사 hard delete**
   - 동일하게 `consultant_id` orphan.
   - 상담사 급여(`salary_calculations.consultant_id`) 가 orphan → 4대보험·원천세 신고용 통계 깨짐.

3. **시나리오 C — 결제 완료 + 미사용 회기 보유 사용자 hard delete**
   - 매핑 행이 살아있지만 "결제는 됐고 환불 안 됨" 상태 → ERP 회계 invariant 위반.
   - `AdminServiceImpl.deleteClient` 가 이미 `remainingSessions > 0` 가드(`AdminServiceImpl.java:3181-3196`)로 막고 있는 이유 — hard delete 도 같은 가드를 우회하면 안 됨.

→ **결론**: hard delete 진입 전 반드시 회기 SSOT(`remainingSessions == 0` AND `PENDING_PAYMENT` 없음 AND `미래 BOOKED/CONFIRMED 스케줄` 없음) 가드 통과 필수. 어드민 `deleteClient` 의 현행 가드 로직(`AdminServiceImpl.java:3164-3271`)을 hard delete 경로에도 동일하게 부과해야 함.

---

## §4. 결제·환불·ERP 영향

### §4.1 결제·환불 정합성

- `Payment.payer_id` (`Payment.java:81-82`) — Long 컬럼, FK 없음. user 사라지면 결제 영수증·세금계산서 buyer 표기 깨짐.
- `Payment.recipient_id` (`Payment.java:87-88`) — 동일.
- `Payment.refunded_at` 등 환불 이력은 살아있지만 buyer 식별 불가 → 분쟁 시 거래 당사자 입증 불가.
- PortOne webhook (`src/main/java/com/coresolution/consultation/service/portone/PortOnePaymentWebhookService.java`) 는 결제 완료 후 비동기 콜백으로 도착. user 가 hard delete 된 사이 webhook 이 오면 user lookup 실패 → 결제 상태 동기화 끊김.

### §4.2 ERP 회계 정합성 (`FinancialTransaction`)

- `FinancialTransaction.approver_id` → `@ManyToOne User` (`FinancialTransaction.java:128-131`).
- `FinancialTransaction.related_entity_id` (Long) + `related_entity_type` (String) — 결제/급여/구매요청 PK 를 폴리몰픽으로 가리킴.
- user hard delete 시: approver join 실패, related_entity 가 payment 인 경우 payment.payer_id orphan 으로 2차 깨짐.
- 세금계산서·국세청 신고 자료가 buyer 정보 누락으로 발행 불가 → **세법 위반 위험**.

### §4.3 ERP 자동화 스케줄러 영향

- `ErpAutomationScheduler` + `PlSqlFinancialServiceImpl` 는 raw SQL `CALL GetBranchFinancialBreakdown(...)` 등 PL/SQL 프로시저 호출.
- 프로시저가 `users` 테이블과 `JOIN` 또는 `LEFT JOIN` 으로 연결되어 있으면 hard delete 된 user 의 거래는 매출 통계에서 누락. 동일 거래 금액이 누적 합계와 일별 합계에서 어긋나 회계 마감 깨짐.
- `V20260531_004__rewrite_financial_procedures_with_tenant.sql` 가 최신 ERP 프로시저 정의 — JOIN 형태는 본 분석 시점 직접 SELECT 금지(core-debugger 위임 병행) 이므로 추정.

→ **결론**: 결제·ERP 정합성을 지키려면 hard delete 대신 **PII 컬럼만 anonymize + `users` 행 보존** 이 default. 보존 의무 5년 경과 후에도 buyer 식별을 위한 surrogate(예: `anon-<uuid>`) 가 필요.

---

## §5. 상담일지·통계·리포트

### §5.1 상담일지 (`consultation_records`)

- 의료법 §22 — **진료기록 10년 보존**. MindGarden 상담일지는 의료법 직접 적용이 아니라 "준용" 관점이지만, 사실상 임상 상담 기록은 10년 기준이 가장 안전.
- 현행 코드는 5년 cutoff (`PersonalDataDestructionService.destroyExpiredConsultationData` `PersonalDataDestructionService.java:152-192` 의 `cutoffDate = now().minusYears(5)`) — **의료법 10년 기준과 충돌 가능성**. (자매 보고서 §2.2 와 동일 결론)
- hard delete 시: `consultation_records.client_id=X` orphan. 행은 살지만 환자 식별 불가 → 의료법상 "유효한 보존" 이 아닐 가능성. 분쟁·감독기관 조사 시 입증 불가.

### §5.2 통계·KPI 테이블

| 테이블 | 위치 | hard delete 영향 |
|---|---|---|
| `daily_statistics` | `DailyStatistics.java:27` | 일별 매출·내담자 수 통계. user join 깨지면 과거 통계 영구 깨짐. |
| `consultant_performance` | `ConsultantPerformance.java:31` | 상담사 성과 평가. consultant orphan. |
| `dropout_risk_assessments` | `DropoutRiskAssessment.java:22` | 이탈 위험 분석. client orphan. |
| `quality_evaluations` | `QualityEvaluation.java:29` | 상담 품질 평가. client/consultant orphan. |
| `consultant_ratings` | `ConsultantRating.java:23` | 별점. client/consultant orphan. |

### §5.3 KPI 함수 (`PlSqlFinancialServiceImpl`)

- `GetBranchFinancialBreakdown` 등 PL/SQL 프로시저가 `users` join 기반.
- hard delete 시 과거 시점의 매출 합계가 시간이 지난 후 다시 조회되면 값이 줄어듦 → "과거 KPI 가 변하는 시스템" 으로 회계 불신 야기.

→ **결론**: 통계·KPI 정합성을 지키려면 hard delete 대신 anonymize. 통계 산출 함수 자체가 user.name/email/phone 을 노출하지 않으면 anonymize 만으로 KPI 무결성 유지 가능.

---

## §6. 감사 로그·푸시·미발송 큐 + 법규 매트릭스 + 시나리오

### §6.1 감사 로그·개인정보 접근 로그

| 테이블 | 위치 | hard delete 영향 |
|---|---|---|
| `personal_data_access_logs` | `PersonalDataAccessLog` 엔티티, `PersonalDataAccessLog.java:24` | `accessor_id`, `target_user_id` 가 `String` — FK 없어 추적성만 끊김. 보존 1년(`SECURITY_POLICY.md:228`). |
| `personal_data_destruction_logs` (가칭, 실제로는 `personal_data_access_logs` 에 `accessType=DELETE` 로 통합 기록) | `PersonalDataDestructionService.logPersonalDataDestruction` `PersonalDataDestructionService.java:315-339` | DELETE 로그는 살아남지만 user.name 이 사라져 "누가 파기되었는지" 가 access log 기록 시점의 스냅샷에만 의존. |
| `audit_logs` (별도 엔티티 없음 — `AuditLoggingConfig` 가 구조만 정의) | `src/main/java/com/coresolution/consultation/config/AuditLoggingConfig.java` | hard delete 시 actor/target join 깨짐. |

### §6.2 푸시 토큰·채널 선호도·미발송 큐

| 테이블 | 위치 | hard delete 영향 |
|---|---|---|
| `mobile_push_tokens` | `V20260514_001` (`fk_mpt_user` FK RESTRICT 보유) | 토큰 1건이라도 있으면 `DELETE FROM users` 실패. 사전 정리 필수. |
| `mobile_push_settings` | `V20260514_001` (`fk_mps_user` FK RESTRICT) | 동일. |
| `client_channel_preferences` (= `users.notification_channel_preference` 컬럼, `User.java:277-279`) | `users` 자체 컬럼 | hard delete 시 컬럼 같이 사라짐. |
| `notifications` (`status=PENDING` 큐) | 엔티티 미존재, `BatchNotificationDispatchServiceImpl` 가 raw query 로 사용 | FK 없음. hard delete 후에도 PENDING 행이 dispatcher 에 의해 발송 시도 → user join 실패로 dispatcher 예외 또는 dead-letter. |
| `notification_batch_send_log` | `NotificationBatchSendLog.java:56` `recipient_user_id` 필수 | unique 키 `(tenant_id, template_code, target_type, target_id, recipient_user_id)` 영구 점유. |

### §6.3 법규 매트릭스 — hard delete vs anonymize vs tombstone

| 법규 | 적용 데이터 | 보존 기간 | 본인 삭제 요청 우선순위 | hard delete 가능성 | anonymize 가능성 | tombstone 가능성 |
|---|---|---|---|---|---|---|
| **개인정보보호법 §36** (정정·삭제·처리정지권) | `users` PII, `clients` PII | 본인 요청 시 즉시 | **본인 요청 > 보존 의무 없음 영역** | ◯ (보존 의무 없으면) | ◯ | △ (개인정보보호위 가이드 anonymize 우선) |
| **개인정보보호법 §39의6** (1년 미접속 휴면/파기) | `users`, `last_login_at` 1년 경과 | 휴면 분리 또는 파기 | 자동 | △ | ◯ | ◯ |
| **개인정보보호법 §39의7** (분쟁 대비 보존) | 분쟁 발생 가능 데이터 | 분쟁 종결까지 | 보존 의무 | ✕ | ◯ | ◯ |
| **의료법 §22** (진료기록 10년) | `consultation_records` | **10년** (현행 코드는 5년 — 불일치) | **보존 의무 > 본인 요청** | ✕ (위반) | ◯ (PII 익명화 후 임상 내용 보존) | ◯ |
| **세법** (장부·증빙 5~10년) | `financial_transactions`, ERP 거래 | 5년 (일반) ~ 10년 (분쟁) | **보존 의무 > 본인 요청** | ✕ | ◯ (buyer name anonymize, 거래 금액·일자·세금 보존) | ◯ |
| **전자금융거래법 §22** (5년 보존) | `payments`, `payment.external_response` | **5년** | **보존 의무 > 본인 요청** | ✕ | ◯ | ◯ |
| **상법** (10년 보존 — 회계장부·재무제표) | ERP ledger | **10년** | **보존 의무 > 본인 요청** | ✕ | ◯ | ◯ |
| **GDPR 17조** (잊혀질 권리) | 모든 PII | 본인 요청 즉시 | **본인 요청 = 정상 default** (단 17조 3항 예외) | ◯ (보존 의무 없으면) | ◯ (대안 default) | △ |

**충돌 패턴**:
- 의료법 10년 vs §36 본인 삭제 → **anonymize 가 유일한 정답**. PII 만 익명화하고 임상 내용은 보존.
- 세법·전금법 5년 vs §36 본인 삭제 → 동일. buyer 이름·전화 anonymize, 금액·일자·증빙 보존.
- 정책 결정 필요 — anonymize 가 default 라고 합의해야 함.

### §6.4 시나리오 3종 비교

#### Scenario A — PII Anonymization (행 유지, 민감 컬럼만 익명화) — **권장 default**

| 항목 | 처리 |
|---|---|
| `users` 행 | 보존. `is_active=false, is_deleted=true, deleted_at=now()` 동시 토글. |
| `users.name, email, phone, nickname, gender, address, address_detail, postal_code, rrn_encrypted, profile_image_url, memo, notes, specialization, birth_date` | 익명화 (`anon-<uuid>@deleted.local`, `이용종료-<uuid>`, null 등). 자매 보고서 §6.1 정책. |
| `clients` 행 | 보존. 동일 컬럼 익명화. |
| `consultation_records` | 행 보존. `client_condition, main_issues, intervention_methods, client_response, ...` 자체는 의료법 보존 의무 → 보존. PII 외부 노출 키만 anonymize. |
| `payments, financial_transactions` | 행 보존. buyer 식별 컬럼은 user 익명화로 자동 연결됨(JOIN 결과만 익명). |
| `mobile_push_tokens, mobile_push_settings` | active=false 변경 또는 행 삭제 (FK RESTRICT 회피용). |
| `mood_journal_entries, self_assessment_sessions, mind_weather_cards, shop_carts, shop_client_orders, client_point_wallets, client_point_ledger_entries, community_*` | RESTRICT FK 보유 — 보존 의무 없는 영역만 별도 정책 (§7 §10 결정 필요). |
| `notifications status=PENDING` | `status=CANCELLED`. |
| 회기 SSOT | 매핑·일정 그대로. 통계·KPI 정합성 유지. |
| 구현 LOC | 백엔드 ~600 LOC (서비스 1·DTO 3·migration 1·테스트 12). |
| FK 처리 | DB FK 미정의 → 변경 없음. 신규 테이블 RESTRICT FK → 별도 sweep 로직. |
| 법규 충족 | 개인정보보호법 §36 ◯ (PII 즉시 익명화), 의료법 §22 ◯, 세법·전금법 ◯, GDPR 17조 ◯ (3항 예외 사유 명시). |
| 회기·재무 정합성 | ◯ (행 보존). |
| 운영 사고 위험 | **낮음**. ERP·KPI·통계 모두 무사. |

#### Scenario B — Partial Hard Delete (보존 의무 없는 행만 hard delete + 의료/재무 anonymize)

| 항목 | 처리 |
|---|---|
| `users, clients` 행 | 보존 + 익명화 (Scenario A 와 동일). |
| `consultation_records, payments, financial_transactions` | 보존 + 익명화 (의료법·세법·전금법). |
| `mobile_push_*` | hard delete. |
| `mood_journal_entries, self_assessment_sessions, mind_weather_cards` | hard delete (사용자 자발적 일지 — 보존 의무 없음, 본인 삭제 권리 우선). |
| `shop_carts, shop_client_orders` | 주문은 결제 영수증 측면에서 5년 보존 필요 — **anonymize 권장**. 카트는 hard delete 가능. |
| `client_point_wallets, client_point_ledger_entries` | 잔여 포인트가 있으면 환불·소멸 처리 후 ledger 보존(세법) + wallet hard delete 가능. |
| `community_*` | 게시판 정책 — Scenario B 의 핵심 결정 포인트. 본인 삭제권 vs 다른 사용자의 댓글 맥락 보존 충돌. |
| 구현 LOC | 백엔드 ~1,500 LOC (테이블별 핸들러 분기 다수). |
| FK 처리 | RESTRICT FK 사전 정리 sweep 로직 필요. 핵심 운영 테이블은 그대로(FK 부재 = orphan 없음). |
| 법규 충족 | ◯ (영역별 분기) |
| 회기·재무 정합성 | ◯ (핵심 테이블 보존) |
| 운영 사고 위험 | **중간**. 신규 테이블 sweep 누락 시 RESTRICT FK 위반. 테이블 추가 시마다 핸들러 갱신 필요. |

#### Scenario C — True Hard Delete (전체 행 삭제) — **비권장**

| 항목 | 처리 |
|---|---|
| `users, clients` 등 모든 user 연결 행 | hard delete. |
| `consultation_records, payments, financial_transactions` | hard delete (의료법·세법·전금법 위반). |
| 구현 LOC | 백엔드 ~3,000 LOC (cascade 핸들러 + 보존 stamp 별도 테이블). |
| FK 처리 | 신규 테이블 RESTRICT FK 사전 정리 + 핵심 운영 테이블 raw SQL 삭제. |
| 법규 충족 | **위반** (의료법 §22, 세법, 전금법, 상법). 법무 자문·외부 stamp 테이블 별도 구축 필요. |
| 회기·재무 정합성 | **깨짐** (과거 KPI·세금계산서 buyer 누락). |
| 운영 사고 위험 | **매우 높음**. 법규 위반 + 운영 데이터 손실. |

→ **권장**: **Scenario A** 가 default. Scenario B 는 신규 테이블이 더 늘어나면(예: 게임·미니앱) 운영 부담이 커져 결국 A 로 수렴 가능성이 높음. Scenario C 는 **채택 불가** — 본 보고서는 위험 매트릭스 비교 목적으로만 기술.

---

## 부록 A — 본 분석에서 사용한 코드/마이그레이션 인벤토리

- `src/main/java/com/coresolution/consultation/entity/User.java:125-128, 205-207`
- `src/main/java/com/coresolution/consultation/entity/AuditableTenantBase.java:49-54, 131-134`
- `src/main/java/com/coresolution/consultation/entity/BaseEntity.java` (`User` 부모)
- `src/main/java/com/coresolution/consultation/entity/Client.java:31-46`
- `src/main/java/com/coresolution/consultation/entity/ConsultantClientMapping.java:46-78`
- `src/main/java/com/coresolution/consultation/entity/Schedule.java:36, 74, 80-87`
- `src/main/java/com/coresolution/consultation/entity/ConsultationRecord.java:41-47`
- `src/main/java/com/coresolution/consultation/entity/Payment.java:81-88, 129-136`
- `src/main/java/com/coresolution/consultation/entity/erp/financial/FinancialTransaction.java:128-157`
- `src/main/java/com/coresolution/consultation/entity/NotificationBatchSendLog.java:33, 56`
- `src/main/java/com/coresolution/consultation/entity/PersonalDataAccessLog.java`
- `src/main/java/com/coresolution/consultation/repository/BaseRepository.java:400-430`
- `src/main/java/com/coresolution/consultation/repository/UserRepository.java:88, 99-109`
- `src/main/java/com/coresolution/consultation/service/impl/UserServiceImpl.java:219-241, 1070-1078`
- `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java:3162-3271`
- `src/main/java/com/coresolution/consultation/service/impl/MyPageServiceImpl.java:380-397`
- `src/main/java/com/coresolution/consultation/service/impl/PersonalDataRequestServiceImpl.java:106-167`
- `src/main/java/com/coresolution/consultation/service/PersonalDataDestructionService.java:102-310, 315-339`
- `src/main/resources/db/migration/V21__create_refresh_token_store_table.sql:32-33`
- `src/main/resources/db/migration/V32__create_user_role_assignments_table.sql:37-46`
- `src/main/resources/db/migration/V20260513_003__create_mind_weather_cards.sql:25-28`
- `src/main/resources/db/migration/V20260514_001__create_mobile_push_token_and_settings.sql:20-22, 38-41`
- `src/main/resources/db/migration/V20260514_002__mood_journal_self_assessment_wellness.sql:21-23, 59-61`
- `src/main/resources/db/migration/V20260514_003__client_shop_cart_order_points_mvp.sql:36-37, 76-77, 114-115, 133-135`
- `src/main/resources/db/migration/V20260515_002__bw4_community_moderation.sql:25-28, 42-45, 59-62, 78-81`
- `docs/guides/SECURITY_POLICY.md:75-87, 239-265`
- `docs/standards/SELF_WITHDRAWAL_PROCESS_AUDIT.md` (자매 보고서)

## 부록 B — 본 보고서 작성 시 운영 가드 준수 사항

- 코드/설정/DB **무수정** (Read-only 가드 준수).
- `mind_garden` 스키마 미접촉.
- 운영 DB 직접 SELECT 금지 — core-debugger 위임 병행 처리.
- explore Agent `f3975fe5` 산출 미보존 — 본 재분석은 코드/마이그레이션 정적 분석만으로 작성.
- 후속 통합 합의서: `docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md`.
