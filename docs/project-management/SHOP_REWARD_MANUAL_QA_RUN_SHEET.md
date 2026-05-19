# Shop·Reward 수동 QA 런시트

| 항목 | 내용 |
|------|------|
| 일자 | 2026-05-19 |
| SSOT | [SHOP_REWARD_IMPLEMENTATION_STATUS.md](./SHOP_REWARD_IMPLEMENTATION_STATUS.md) §4, [SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md) |
| 용도 | dev/staging 운영 GO 전 Admin·Client·P1 회귀 수동 검증 기록 |
| 자격 증명 | **문서·커밋 금지** — 로컬 env·Secrets만 사용 |

---

## 실행 전제 (전부 충족 후 아래 표 진행)

| # | 전제 | 확인 방법 | ☐ |
|---|------|-----------|---|
| P1 | Flyway Shop P2 (`002`~`007`) + `V20260520_001` + `V20260521_001` | `flyway_schema_history`·[런북 §1](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md) SQL 스모크 | |
| P2 | OPS `activate-shop-reward-tenant-components.sql` | `tenant_components`에 `CLIENT_SHOP`, `CLIENT_REWARD`, `ADMIN_SHOP_CATALOG` 활성 | |
| P3 | (선택) `seed-shop-demo-catalog.sql` | `catalogVisible=true` SKU ≥1 (Client PLP·Playwright) | |
| P4 | 백엔드 API **8080** + 웹 **3000** | 헬스·로그인 스모크 | |
| P5 | 어드민 JWT + `X-Tenant-ID` / 내담자 로그인 | 역할·테넌트 격리 | |

**컴포넌트 코드**: `CLIENT_SHOP`, `CLIENT_REWARD`, `ADMIN_SHOP_CATALOG` (Flyway 003 시드 + OPS 활성화).

**기록 규칙**: 결과 열에 `PASS` / `FAIL` / `스킵` 중 하나. `FAIL`·`스킵` 시 비고에 재현·스크린샷·이슈 링크.

### 배포 완료·OPS 대기 (Tier A (5) 게이트)

| ☐ | 항목 | core-tester (2026-05-19) |
|---|------|---------------------------|
| ☑ | dev 배포·`https://dev.core-solution.co.kr/actuator/health` **200** | curl 확인 |
| ☐ | OPS `activate-shop-reward-tenant-components.sql` + (선택) `seed-shop-demo-catalog.sql` | DB 수동 — [런북 §4.2](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md#42-ops-실행-카드-tier-a--copy-paste) |
| ☐ | `TENANT_ID=<uuid> bash scripts/ops/verify-shop-reward-dev.sh` exit **0** | **BLOCKED** — `TENANT_ID` 미설정 시 exit **2**; health만: `curl -sS -o /dev/null -w "%{http_code}" https://dev.core-solution.co.kr/actuator/health` |

| 실행자 | 환경(URL) | 일시 | Flyway | OPS | 시드 |
|--------|-----------|------|--------|-----|------|
| | dev / staging | | ☐ | ☐ | ☐ |

---

## 4.1 Admin API

**전제**: P1~P5, 어드민 JWT, `X-Tenant-ID`, `ADMIN`/`STAFF`, `ADMIN_SHOP_CATALOG` 활성.

**UI 경로**: `/admin/shop/catalog-skus`, `/admin/shop/point-policies`, `/admin/shop/orders`

| ☐ | # | 영역 | 메서드·경로 | 기대 | 결과 | 비고 |
|---|---|------|-------------|------|------|------|
| ☐ | A1 | 카탈로그 | `GET /api/v1/admin/shop/catalog-skus` | `success=true`, 배열 | | |
| ☐ | A2 | 카탈로그 | `POST /catalog-skus` (신규 SKU) | `201`, `data.id` | | |
| ☐ | A3 | 카탈로그 | 동일 `skuCode` 재POST | `4xx` 중복 | | |
| ☐ | A4 | 카탈로그 | `PATCH .../catalog-visible` | PLP 노출 반영 | | |
| ☐ | A5 | 포인트 정책 | `GET /api/v1/admin/shop/point-policies` | MVP 키 6종 | | |
| ☐ | A6 | 포인트 정책 | `PATCH /point-policies` | GET과 일치 | | |
| ☐ | A7 | 주문 | `GET /api/v1/admin/shop/orders` | 최근 주문 목록 200 | | |
| ☐ | A8 | 주문 | `GET /api/v1/admin/shop/orders/{id}` | 상세·lines·fulfillmentEvents | | |
| ☐ | A9 | 환불 (R1) | `POST .../orders/{id}/refund` (PAID) | `REFUNDED`, 포인트 복원/clawback·PG refund | | |
| ☐ | A10 | 보안 | Bearer 없음 / CLIENT 역할 | `401`/`403` | | |

---

## 4.2 Client web

**전제**: 내담자 로그인, P1~P3, `catalogVisible=true` SKU ≥1, `CLIENT_SHOP`·`CLIENT_REWARD` 활성.

| ☐ | # | 경로 | 동작 | 기대 | 결과 | 비고 |
|---|---|------|------|------|------|------|
| ☐ | C1 | `/client/shop` | PLP·카테고리 탭 | SKU·가격·필터 | | |
| ☐ | C2 | PLP → cart | SKU 담기 | 수량·소계 | | |
| ☐ | C3 | `/client/shop/cart` | 수량 변경 | API 반영 | | |
| ☐ | C4 | checkout | 결제 화면 | 요약·포인트 입력 | | |
| ☐ | C5 | 카드 전액 | `pointsToRedeemMinor=0` | `nextStep=PAYMENT` | | |
| ☐ | C6 | 포인트 전액 | 가용 ≥ 소계 | `nextStep=DONE`, `PAID` | | |
| ☐ | C7 | `/client/shop/points` | 잔액·내역 | balance/ledger 일치 | | |
| ☐ | C8 | 주문 상세 | REFUNDED·fulfillment | 상태·이행 라인 표시 | | |
| ☐ | C9 | 회귀 | `/client/shop-catalog` | `/client/shop` 리다이렉트 | | |

---

## 4.3 P1 회귀 (스테이징)

| ☐ | # | 시나리오 | 기대 | 결과 | 비고 |
|---|---|----------|------|------|------|
| ☐ | QA-1 | 카드 전액 + PG 승인 | `PAID` + (정책) EARN | | |
| ☐ | QA-2 | 포인트 전액 | 즉시 `PAID` | | |
| ☐ | QA-3 | PG 실패 | hold 해제·`CREATED` | | |

상세 절차: [SHOP_P1_PG_POINT_COMMIT_TEST_REPORT.md](./SHOP_P1_PG_POINT_COMMIT_TEST_REPORT.md) §3.

---

## R10 Playwright (자동 보조)

| 항목 | 기록 |
|------|------|
| 스펙 | `tests/e2e/tests/client/client-shop-catalog-to-cart.spec.ts` |
| 명령 | `cd tests/e2e && npx playwright test client-shop-catalog-to-cart --project=chromium` |
| 로컬 실행 (core-tester) | 아래 §Playwright 로그 |

### Playwright 로그

| 일시 | 8080 | 3000 | 결과 | 비고 |
|------|------|------|------|------|
| 2026-05-20 | down | webServer 기동 | **1 skipped** | `skipWhenLocalBackend8080Down` — `npx playwright test client-shop-catalog-to-cart --project=chromium`, exit 0 |
| 2026-05-19 | down | webServer 기동 | **2 skipped** | client + admin smoke — `npx playwright test client-shop-catalog-to-cart admin-shop-catalog-skus-smoke --project=chromium`, exit 0 |

---

## 완료 판정

| 구역 | PASS | FAIL | 스킵 | GO |
|------|------|------|------|-----|
| Admin A1~A10 | /10 | | | ☐ |
| Client C1~C9 | /9 | | | ☐ |
| P1 QA-1~3 | /3 | | | ☐ |
| R10 Playwright | — | — | 조건부 | ☐ |

**운영 GO**: [INTEGRATION_COMMIT_CHECKLIST §6](./SHOP_REWARD_INTEGRATION_COMMIT_CHECKLIST.md) — 본 런시트 Admin·Client·P1 **전 항목 PASS**(또는 합의된 스킵) + dev 배포·OPS 완료 후에만 가능.

---

*작성: core-tester · 문서·Playwright 프로브 · 프로덕션 코드 변경 없음*
