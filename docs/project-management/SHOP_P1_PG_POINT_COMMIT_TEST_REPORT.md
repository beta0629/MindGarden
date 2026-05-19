# Shop P1 — PG·포인트 commit 검증 게이트 (core-tester)

| 항목 | 내용 |
|------|------|
| 일자 | 2026-05-19 |
| 범위 | `ClientShopCheckoutServiceImpl`, `PaymentServiceImpl`, `PortOnePaymentWebhookService` 및 단위 테스트 2종 |
| SSOT | [SHOP_REWARD_PLATFORM_ORCHESTRATION.md](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md) §3~§4, [POINT_REWARD_EARN_AND_REDEEM_SPEC.md](./POINT_REWARD_EARN_AND_REDEEM_SPEC.md) §4 |
| 코드 수정 | 없음 (실패 시 core-coder 위임만) |

---

## 1. 단위 테스트 실행

```bash
mvn -Dtest=ClientPointWalletServiceImplTest,ClientShopCheckoutServiceImplTest test
```

| 클래스 | Tests | Failures | Errors | Skipped | 결과 |
|--------|-------|----------|--------|---------|------|
| `ClientShopCheckoutServiceImplTest` | 5 | 0 | 0 | 0 | PASS |
| `ClientPointWalletServiceImplTest` | 5 | 0 | 0 | 0 | PASS |
| **합계** | **10** | **0** | **0** | **0** | **BUILD SUCCESS** |

소요: 약 5s (2026-05-19 10:58 KST).

---

## 2. 코드 리뷰 체크리스트 (tenant · 멱등 · hold 해제)

### 2.1 테넌트 격리

| # | 항목 | 구현 | 단위 테스트 | 판정 |
|---|------|------|-------------|------|
| T1 | 주문 조회 `findByTenantIdAndPublicId` | O | 간접(모킹 tenant) | PASS |
| T2 | 체크아웃·장바구니 `tenantId` 스코프 | O | 미커버 | GAP |
| T3 | `preparePayment` / `cancelOrder` clientId 소유 검증 | O | 미커버 | GAP |
| T4 | 원장·지갑 `lockByTenantIdAndUserId` | O | `tenant-a`/`t` 분리 | PASS |
| T5 | PG 웹훅 `TenantPgConfiguration.tenantId` → `TenantContextHolder` | O | 없음 | GAP (통합 권장) |
| T6 | 타 테넌트 주문·지갑 접근 거부(음성) | API 레이어 가정 | 없음 | **core-coder**: 교차 tenant 통합/단위 1건 |

### 2.2 멱등

| # | 항목 | 구현 | 단위 테스트 | 판정 |
|---|------|------|-------------|------|
| I1 | 주문 이미 `PAID` → `commitHold` 미호출 | O | O (`alreadyPaid_noOp`) | PASS |
| I2 | `commitHold` idempotencyKey 중복 no-op | O | O | PASS |
| I3 | `hold` / `releaseHold` idempotencyKey 중복 | O (exists 체크) | 없음 | GAP |
| I4 | 포트원 동일 상태 재전송 → 결제 dedup + shop sync | O | 없음 | GAP (수동/E2E) |
| I5 | 체크아웃 `Idempotency-Key` → `pointHoldKey` | O | 없음 | GAP |

### 2.3 hold 해제

| # | 항목 | 구현 | 단위 테스트 | 판정 |
|---|------|------|-------------|------|
| H1 | PG 실패·취소 → `releaseHold` + `PENDING_PAYMENT`→`CREATED` | O | O | PASS |
| H2 | 사용자 취소(`PENDING_PAYMENT`) → `releaseHold` + `CANCELLED` | O | O | PASS |
| H3 | `PAID`/`CANCELLED`/`EXPIRED` 시 release no-op | O | 없음 | GAP |
| H4 | 포인트 전액(`cashDueMinor=0`) → 즉시 `PAID`+commit | O | 없음 | **core-coder**: checkout 단위 1건 권장 |
| H5 | hold TTL 만료 배치 | 미구현 (스펙 후속) | — | OUT OF P1 |

**P1 게이트 요약**: 핵심 경로(PG 승인 commit, PAID 멱등, PG 실패 release)는 구현·단위 테스트 일치. 교차 tenant·포인트 전액·hold/release 멱등·웹훅 경로는 보강 권장(차단 아님, P1 머지 전 스모크로 완화 가능).

---

## 3. 수동 QA (3건)

전제: 개발/스테이징, `X-Tenant-ID`·내담자 JWT, 카탈로그 SKU·포인트 잔액 시드. EARN·혼합 PG+포인트는 P1 제외.

### QA-1 카드 전액 결제

1. 장바구니에 SKU 추가 → `POST /api/v1/clients/me/shop/checkout` (`pointsRedeemMinor=0`, `Idempotency-Key` 헤더).
2. 응답 `nextStep=PAYMENT`, 주문 `CREATED` 또는 `PENDING_PAYMENT` 전 단계 확인.
3. `POST .../orders/{orderPublicId}/prepare-payment` → PG URL/결제창 진행 → 승인.
4. **기대**: `shop_client_orders.status=PAID`, 결제 `APPROVED`, 포인트 hold 없음(또는 0). 웹훅 재전송 시 주문·원장 이중 반영 없음.

### QA-2 포인트 전액 결제

1. 가용 포인트 ≥ 주문액인 계정으로 체크아웃 (`pointsRedeemMinor` = 소계, 현금 0).
2. **기대**: 응답 `nextStep=DONE`, 즉시 `PAID`; 원장 `POINT_HOLD`→`POINT_COMMIT` (동일 `orderPublicId` 키), `prepare-payment` 호출 불가(400).

### QA-3 PG 실패

1. QA-1과 동일 until `prepare-payment` 후 `PENDING_PAYMENT`.
2. PG 실패·취소 또는 포트원 `TRANSACTION_FAILED`/`CANCELLED` 웹훅(또는 결제 상태 FAILED 반영).
3. **기대**: 주문 `CREATED` 복귀, `POINT_HOLD_RELEASE`(포인트 사용 시), 가용 잔액 복구; 재결제 가능.

---

## 4. core-coder 위임 (코드 수정 필요 시만)

| 우선순위 | 항목 |
|----------|------|
| P2 | `ClientShopCheckoutServiceImplTest`: `cashDueMinor=0` 즉시 PAID·commit |
| P2 | `ClientPointWalletServiceImplTest`: `hold`/`releaseHold` 멱등 중복 no-op |
| P3 | 교차 tenant 주문 접근 거부 단위 또는 MockMvc 통합 1건 |
| P3 | `releaseOrderHoldOnPaymentFailure` — 이미 `PAID` 시 release 미호출 단위 |

현재 **단위 테스트 실패 없음** → P1 블로커 없음.

---

## 5. 판정

| 게이트 | 결과 |
|--------|------|
| 지정 단위 테스트 10건 | **PASS** |
| SSOT §4 MVP (PG 전액·포인트 전액·hold/commit) | 구현 정합, EARN·혼합·TTL 제외 |
| P1 머지 권고 | **조건부 GO** — §3 수동 QA 3건 스테이징 확인 후 최종 GO |

**P2 연계 (2026-05-19)**: 환불·fulfillment 자동화는 [SHOP_P2_INTEGRATION_TEST_REPORT.md](./SHOP_P2_INTEGRATION_TEST_REPORT.md) — 11클래스 60건 PASS; 스테이징 시 P1 QA-1~3에 **어드민 refund(C3~C4)**·PAID 후 fulfillment 이벤트 확인을 추가 권장.

---

*작성: core-tester · 커밋 없음*
