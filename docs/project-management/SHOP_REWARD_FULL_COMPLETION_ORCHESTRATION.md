# 쇼핑·리워드 전체 완결 오케스트레이션 (SSOT)

| 항목 | 내용 |
|------|------|
| 문서 제목 | 쇼핑·리워드 **빠짐없이** 구현 완결 — 갭·알림·배치 |
| 상태 | **Tier A 진행** — R11(알림·푸시) P0 **코드·단위 검증 완료** (2026-05-19); R10·OPS·수동 QA 잔여 |
| 작성일 | 2026-05-20 |
| 상위 SSOT | [SHOP_REWARD_PLATFORM_ORCHESTRATION.md](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md) |
| 위임 규칙 | [CORE_PLANNER_DELEGATION_ORDER.md](./CORE_PLANNER_DELEGATION_ORDER.md) — 구현=`core-coder`, 검증=`core-tester` 게이트 |

---

## §1 범위 정의 — 사용자 「모두」에 대한 티어 A/B/C

사용자 요구 「쇼핑몰, 리워드 관련된 것 **모두** 빠짐없이 구현」은 **단일 릴리스에 Phase 3·MVP 제외 항목까지 무조건 포함**이 아니라, 아래 **티어**로 해석한다. 본 문서 SSOT가 **완결 판정**의 기준이다.

| 티어 | 명칭 | 포함 | 제외·후순위 | 「완결」 판정 |
|------|------|------|-------------|---------------|
| **A** | **MVP·운영 완결** | P1~P2 코어(카탈로그·장바구니·체크아웃·PG·포인트 hold/commit/EARN·환불·CONSULTATION fulfillment·어드민 SKU·정책·컴포넌트 게이트·R3/R4/R8/R9) + **R11 알림·푸시 P0** + **R10 Playwright** + **OPS·수동 QA** | R7(부분환불·쿠폰) | dev/staging **운영 GO**: Maven·Jest·Playwright(전제 충족)·[수동 QA 런시트](./SHOP_REWARD_MANUAL_QA_RUN_SHEET.md) PASS |
| **B** | **Phase 3 기능** | R5 통합 마켓(모델 B), R6 ASSESSMENT fulfillment + R11 시나리오 **ASSESSMENT** (선택) | 크로스 테넌트 포인트(기본 불가) 재설계 | 별도 마일스톤·[MULTI_TENANT §8](./MULTI_TENANT_SHOP_MARKETPLACE_SPEC.md) |
| **C** | **MVP 명시 제외** | — | R7 부분 환불·쿠폰·번들 | 제품 로드맵 합의 후 착수 |

**2026-05-19 코드 팩트 (R11 P0 반영 후)**: `ShopNotificationHelper`·`markOrderPaidAndCommitPoints`·hold TTL·환불·fulfillment 후크에서 S1~S6 인앱·푸시 발화. 쇼핑 PG는 `shop_order_paid` 등 전용 canonical·Expo `pushScenarios` 분기 — **R11 P0 구현 완료**. Tier A 잔여: R10 Playwright·OPS·수동 QA.

---

## §2 갭 인벤토리 표

**갭 총 개수: 22건** (P0: 11 · P1: 7 · P2: 4)

| ID | 영역 | 설명 | 우선순위 | 담당 에이전트 | 완료 조건 |
|----|------|------|:--------:|---------------|-----------|
| **R11-01** | 알림·푸시 | 쇼핑 주문 **PAID** (포인트 전액 + PG) — 전용 type·딥링크·인앱 | **P0** | core-coder → core-tester | `markOrderPaidAndCommitPoints`·포인트 전액 PAID 경로에서 멱등 발화; 웹 `/client/shop/orders/{orderPublicId}`·Expo `/(client)/(shop)/orders/{orderPublicId}`; Maven·Expo 시나리오 테스트 |
| **R11-02** | 알림·푸시 | 쇼핑 **결제 실패** (PG FAILED/CANCELLED → hold release) | **P0** | core-coder → core-tester | `releaseOrderHoldOnPaymentFailure` 연동; 기존 `payment_failed`와 **orderPublicId** 구분 data; 딥링크 체크아웃 또는 주문 상세 |
| **R11-03** | 알림·푸시 | **POINT_EARN** 적립 확정 알림 | **P0** | core-coder → core-tester | `creditEarnOnPaid` 성공·earnAmount>0 시 1회; 원장 `pointEarnKey` 멱등과 동일 키 |
| **R11-04** | 알림·푸시 | **hold TTL 만료** (EXPIRED + hold release) | **P0** | core-coder → core-tester | `ShopOrderHoldExpiryServiceImpl` 만료 처리 후 내담자 알림; 배치 중복 방지 |
| **R11-05** | 알림·푸시 | **환불 완료** (어드민 전액 환불) | **P0** | core-coder → core-tester | `AdminShopOrderRefundServiceImpl` 성공 트랜잭션 후; 복원·clawback 요약 본문(상수 클래스) |
| **R11-06** | 알림·푸시 | **CONSULTATION fulfillment COMPLETED** | **P0** | core-coder → core-tester | `ShopOrderFulfillmentServiceImpl` COMPLETED 시; mapping·ERP 성공/실패 메시지 구분(표시만, 민감정보 제외) |
| **R11-07** | 알림·푸시 | **PG 쇼핑 vs 매칭 결제** type·딥링크 분리 | **P0** | core-coder → core-tester | 쇼핑 PG는 `shop_order_paid` 등 **신규 canonical**; 레거시 `payment_completed`는 매칭 전용 유지 또는 data `domain=shop` 분기; Expo `pushScenarios`·라우터 처리 |
| **R11-08** | 백엔드 | `MobilePushCanonicalTypes`·`MobilePushNotificationCategory`·`ShopPush*` 상수·`MobilePushDispatchService` shop 메서드 | **P0** | core-coder | 하드코딩 문구·type 문자열 Java/TS 이중 정의 금지 — 상수·카피 클래스 1곳 |
| **R11-09** | 인앱 | 쇼핑·리워드 **인앱 메시지** (ConsultationMessage 또는 NotificationService 패턴) | **P0** | core-coder | PAYMENT_SCHEDULE 감사([PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md))와 동일 계층; tenantId·수신자 clientId 필수 |
| **R11-10** | Expo | `pushScenarios.ts`·딥링크 핸들러·알림 설정 카테고리 | **P0** | core-coder | 신규 type 등록·`PUSH_TYPE_ALIASES`·`settingsCategory: payment` (또는 신규 `shop` 합의) |
| **R11-11** | 웹 | (선택 P1) 웹 푸시 FCM — 서버 Expo 전용이면 **스킵 문서화** | P1 | core-planner | Tier A는 Expo+인앱; 웹은 인앱/GNB만 |
| **R10** | E2E | Playwright catalog→cart | **P1** | core-coder → core-tester | `tests/e2e/tests/client/client-shop-catalog-to-cart.spec.ts` passed; 8080·OPS·시드 전제 |
| **OPS-01** | 운영 | 커밋·develop push·dev 배포 | **P1** | core-deployer / shell | [INTEGRATION_COMMIT_CHECKLIST](./SHOP_REWARD_INTEGRATION_COMMIT_CHECKLIST.md) §6 |
| **OPS-02** | 운영 | OPS activate + (선택) seed | **P1** | shell | `scripts/ops/activate-shop-reward-tenant-components.sql` 실행·403 해소 |
| **QA-01** | QA | 수동 QA 런시트 §4 전체 | **P1** | (사용자·QA) | [SHOP_REWARD_MANUAL_QA_RUN_SHEET.md](./SHOP_REWARD_MANUAL_QA_RUN_SHEET.md) PASS 기록 |
| **QA-02** | QA | Go-Live 교차 | **P1** | core-tester | [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) Shop 항목 |
| **REG-01** | 회귀 | Maven Shop 84건·Expo Jest 29건 | **P1** | core-tester | [SHOP_P2_INTEGRATION_TEST_REPORT.md](./SHOP_P2_INTEGRATION_TEST_REPORT.md) 갱신 |
| **R3-UI** | 어드민 UI | SKU 가격 이력 탭 (API 완료) | **P2** | core-designer → core-coder | `AdminShopCatalogSkusPage` 탭; AdminCommonLayout |
| **R5** | Phase 3 | 통합 마켓 모델 B | **P2** | core-planner → explore·designer·coder | [MULTI_TENANT §8](./MULTI_TENANT_SHOP_MARKETPLACE_SPEC.md) |
| **R6** | Phase 3 | ASSESSMENT fulfillment | **P2** | core-coder | psych-assessment 슬롯; PENDING→COMPLETED |
| **R6-N11** | 알림 | ASSESSMENT fulfillment 완료 알림 | **P2** | core-coder | R6 완료 후 R11 시나리오 S7 |
| **R7** | 제외 | 부분환불·쿠폰·번들 | **—** | — | MVP 제외 — 티어 C |

---

## §3 알림·푸시 에픽 (R11)

**목표**: 쇼핑·리워드 도메인 이벤트마다 **인앱 + 모바일 푸시(Expo)** 가 발화되고, 매칭 결제 푸시와 **타입·딥링크가 분리**된다. 모든 발송은 **tenantId** 스코프·**멱등 키**(주문·이벤트·시나리오) 필수.

**참조 패턴**: [PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md) · `PaymentServiceImpl` + `MobilePushDispatchServiceImpl` · `expo-app/src/constants/pushScenarios.ts`

### 3.1 시나리오 표 (P0 + 선택)

| # | 비즈니스 이벤트 | 수신자 | 인앱 타입 (신규·초안) | push canonical type (신규·초안) | 웹 딥링크 | Expo 딥링크 | 멱등 키 (예) | 설정 카테고리 |
|---|-----------------|--------|----------------------|--------------------------------|-----------|-------------|--------------|---------------|
| S1 | 주문 **PAID** (PG·포인트 전액) | CLIENT | `SHOP_ORDER_PAID` | `shop_order_paid` | `/client/shop/orders/{orderPublicId}` | `/(client)/(shop)/orders/{orderPublicId}` | `shop:paid:{tenantId}:{orderPublicId}` | `payment` |
| S2 | PG **결제 실패** (쇼핑 order_id 연결) | CLIENT | `SHOP_PAYMENT_FAILED` | `shop_payment_failed` | `/client/shop/checkout` | `/(client)/(shop)/checkout` | `shop:pay-fail:{tenantId}:{orderPublicId}` | `payment` |
| S3 | **POINT_EARN** 적립 | CLIENT | `POINT_EARNED` | `point_earned` | `/client/shop/points` | `/(client)/(shop)/points` | `shop:earn:{tenantId}:{orderPublicId}` | `payment` |
| S4 | 주문 **EXPIRED** (hold TTL) | CLIENT | `SHOP_ORDER_EXPIRED` | `shop_order_expired` | `/client/shop/cart` | `/(client)/(shop)/cart` | `shop:expired:{tenantId}:{orderPublicId}` | `payment` |
| S5 | **환불 완료** (REFUNDED) | CLIENT | `SHOP_ORDER_REFUNDED` | `shop_order_refunded` | `/client/shop/orders/{orderPublicId}` | `/(client)/(shop)/orders/{orderPublicId}` | `shop:refund:{tenantId}:{orderPublicId}` | `payment` |
| S6 | **CONSULTATION fulfillment COMPLETED** | CLIENT | `SHOP_FULFILLMENT_CONSULTATION` | `shop_fulfillment_consultation` | `/client/shop/orders/{orderPublicId}` | `/(client)/(shop)/orders/{orderPublicId}` | `shop:fulfill:c:{tenantId}:{orderPublicId}:{skuCode}` | `payment` |
| S7 | **ASSESSMENT fulfillment COMPLETED** (Phase 3) | CLIENT | `SHOP_FULFILLMENT_ASSESSMENT` | `shop_fulfillment_assessment` | 동 S6 | 동 S6 | `shop:fulfill:a:...` | `payment` |

### 3.2 기존 `payment_completed`와의 관계 (R11-07)

| 구분 | order_id 의미 | 권장 push type | Expo route |
|------|---------------|----------------|------------|
| 매칭·일반 PG | `Payment` 엔티티·매핑 결제 | `payment_completed` (유지) | `/(client)/(more)/sessions-payment/{id}` |
| 쇼핑몰 | `shop_client_orders.public_id` | **`shop_order_paid`** (신규) | `/(client)/(shop)/orders/{orderPublicId}` |

**구현 방향 (코더 위임)**: `PaymentServiceImpl` APPROVED 시 `order_id`가 shop 주문이면 **매칭용 `dispatchPaymentCompleted` 생략**하고 S1만 발화, 또는 S1이 PAID 확정의 단일 SSOT가 되도록 정리. **중복 푸시 금지**.

### 3.3 발화 앵커 (코더 탐색 시작점)

| 시나리오 | 후크 위치 |
|----------|-----------|
| S1 | `ClientShopCheckoutServiceImpl.markOrderPaidAndCommitPoints`, `completeOrderOnPaymentApproved` |
| S2 | `releaseOrderHoldOnPaymentFailure`, `PaymentServiceImpl` FAILED/CANCELLED + shop sync |
| S3 | `creditEarnOnPaid` (earnAmount>0) |
| S4 | `ShopOrderHoldExpiryServiceImpl` EXPIRED 전이 후 |
| S5 | `AdminShopOrderRefundServiceImpl` 환불 성공 커밋 후 |
| S6 | `ShopOrderFulfillmentServiceImpl` CONSULTATION COMPLETED 기록 후 |

---

## §4 서브에이전트 배치 순서

| 순서 | Phase | 담당 | 목표 | 병렬 | 상태 |
|:----:|-------|------|------|:----:|:----:|
| 1 | **R11-P0 백엔드** | **core-coder** | §3 S1~S6 + R11-07~09 상수·dispatch·인앱 | — | ☑ |
| 2 | **R11-P0 Expo** | **core-coder** | `pushScenarios.ts`·딥링크 (Phase 1 직후 또는 1과 **병렬 가능** — 계약 합의 후) | ↔ 1 | ☑ |
| 3 | **검증 게이트** | **core-tester** | Maven 신규·회귀, Expo Jest, (선택) 푸시 단위 mock | 1·2 완료 후 | ☑ (단위·Jest; E2E·수동 잔여) |
| 4 | **R10·OPS** | **core-coder** + **shell** / **core-deployer** | Playwright, 배포, OPS SQL | 3과 **병렬 가능** (환경 전제) |
| 5 | **수동 QA** | 사용자·QA | [MANUAL_QA_RUN_SHEET](./SHOP_REWARD_MANUAL_QA_RUN_SHEET.md) | 4 후 |
| 6 | **Phase 3** | core-planner 재오케스트 | R5·R6·S7 | Tier B |

**필수 게이트**: [CORE_PLANNER_DELEGATION_ORDER.md](./CORE_PLANNER_DELEGATION_ORDER.md) — **코드 변경 배치는 core-tester 통과 전 완료 보고 금지**.

---

## §5 core-coder 1차 배치 프롬프트 (R11 P0)

아래 블록을 **Task `core-coder`** 에 그대로 전달한다.

```
역할: core-coder — Shop·Reward R11 알림·푸시 P0 (Tier A)

참조:
- docs/project-management/SHOP_REWARD_FULL_COMPLETION_ORCHESTRATION.md §3
- docs/project-management/PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md (푸시·인앱 패턴)
- docs/project-management/POINT_REWARD_EARN_AND_REDEEM_SPEC.md §4 상태머신
- .cursor/skills/core-solution-backend.md, core-solution-multi-tenant.md
- 하드코딩 금지: type·카피·딥링크는 Java/TS 상수 클래스로 분리

대상 파일(핵심):
- src/main/java/.../constant/MobilePushCanonicalTypes.java (+ ShopPush* 또는 consultation.constant.shop 패키지)
- src/main/java/.../constant/MobilePushNotificationCategory.java
- src/main/java/.../service/MobilePushDispatchService.java (+ Impl)
- src/main/java/.../service/impl/ClientShopCheckoutServiceImpl.java (markOrderPaidAndCommitPoints, creditEarnOnPaid, release...)
- src/main/java/.../service/impl/ShopOrderHoldExpiryServiceImpl.java
- src/main/java/.../service/impl/AdminShopOrderRefundServiceImpl.java
- src/main/java/.../service/impl/ShopOrderFulfillmentServiceImpl.java
- src/main/java/.../service/impl/PaymentServiceImpl.java (shop vs matching payment_completed 분리)
- expo-app/src/constants/pushScenarios.ts (+ 라우팅 핸들러가 있으면 동 파일)
- (인앱) ConsultationMessageService 또는 NotificationService 기존 패턴 파일 — explore 후 동일 스타일

완료 조건 (전부 충족):
1. tenantId 없는 발송 경로 0건 — TenantContextHolder / 인자 tenantId 일치
2. S1~S6 시나리오 각각 멱등 — 동일 주문·이벤트 재시도 시 푸시·인앱 중복 0건 (dedupe 키 문서화)
3. markOrderPaidAndCommitPoints 및 포인트 전액 PAID 경로에서 S1(+ earn>0 시 S3) 발화
4. PG FAILED/CANCELLED + shop order_id 시 S2; 매칭 결제 실패와 본문·딥링크 혼동 없음
5. hold TTL EXPIRED 시 S4
6. 어드민 환불 성공 시 S5
7. CONSULTATION fulfillment COMPLETED 시 S6 (SKIPPED/PENDING은 발화 안 함)
8. shop PG PAID 시 legacy payment_completed만 sessions-payment로 가는 동작 제거 또는 domain 분기 — Expo shop 주문 상세로 이동
9. MobilePushCanonicalTypes ↔ pushScenarios.ts type 문자열 1:1 대응 표를 PR 설명에 1줄
10. 문구·title/body 하드코딩 0 — ShopPushCopyConstants(가칭) 등 단일 소스
11. 단위 테스트: dispatch/mock 또는 서비스 테스트 ≥6건 신규 (시나리오별 최소 1)
12. 기존 Maven Shop 84건 + 신규 전부 PASS; 회귀 실패 시 수정 후 재보고

코드 커밋은 사용자 검수 후. 완료 시 core-tester 위임용 변경 파일 목록·시나리오 체크리스트를 반환.
```

---

## §6 검증 체크리스트·링크

| 계층 | 항목 | SSOT |
|------|------|------|
| 단위·통합 | Maven Shop (목표 84+ 신규) | [SHOP_P2_INTEGRATION_TEST_REPORT.md](./SHOP_P2_INTEGRATION_TEST_REPORT.md) |
| 클라이언트 | Expo Jest `clientShop*` | [EXPO_SHOP_REWARD_IMPLEMENTATION_STRATEGY.md](./EXPO_SHOP_REWARD_IMPLEMENTATION_STRATEGY.md) |
| E2E | Playwright catalog→cart (R10) | [SHOP_REWARD_IMPLEMENTATION_STATUS.md](./SHOP_REWARD_IMPLEMENTATION_STATUS.md) §1.3 |
| 수동 | Admin·Client·P1 회귀 | [SHOP_REWARD_MANUAL_QA_RUN_SHEET.md](./SHOP_REWARD_MANUAL_QA_RUN_SHEET.md) |
| 운영 | OPS·Flyway·컴포넌트 | [SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md) |
| Go-Live | 하드코딩·tenant | [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) |

**R11 수동 스모크 (테스터·QA 추가 행)**  
- [ ] 포인트 전액 결제 → S1+S3 푸시·인앱·주문 상세 딥링크  
- [ ] PG 결제 성공 → S1만(중복 payment_completed 없음)  
- [ ] PG 실패 → S2·hold 해제·잔액 복구  
- [ ] hold TTL 만료 → S4  
- [ ] 어드민 환불 → S5  
- [ ] CONSULTATION SKU PAID → S6 (mapping 있음)  

---

## 변경 이력

| 일자 | 내용 |
|------|------|
| 2026-05-20 | 초판 — 티어 A/B/C, 갭 22건, R11 에픽, coder 1차 배치, 검증 링크 |
| 2026-05-19 | R11 P0 완료 — §4 순서 1~3 체크, `ShopNotificationHelperImplTest` S2/S4/S5·checkout notify verify, Maven 15클래스·103건·Expo Jest 32건 |
