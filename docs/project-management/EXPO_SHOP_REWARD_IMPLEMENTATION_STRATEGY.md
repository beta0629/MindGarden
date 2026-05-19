# Expo Shop·Reward 구현 전략 (앱 SSOT)

| 항목 | 내용 |
|------|------|
| 문서 제목 | Expo Shop·Reward 구현 전략 |
| 상태 | **SSOT** — Phase 2 패리티 반영 (로컬 구현) |
| 작성일 | 2026-05-19 |
| SSOT 역할 | Expo 앱 쇼핑·리워드 **라우트·API·플래그·웹 패리티·검증** 단일 참조 |
| 오케스트레이션 | [SHOP_REWARD_PLATFORM_ORCHESTRATION.md](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md) §6 |
| 디자인 | [SHOP_REWARD_CLIENT_UI_DESIGN_HANDOFF.md](./SHOP_REWARD_CLIENT_UI_DESIGN_HANDOFF.md) §3·§5 |

---

## §0 한 줄 결론

Expo는 **웹과 동일 REST API**(`/api/v1/clients/me/shop/*`)·동일 IA로 `(client)/(shop)/` 스택을 구현한다. 하단 탭 `(shop)`은 **`href: null`**(숨김), **더보기 → 온라인 쇼핑**이 1차 진입점이다. `CLIENT_SHOP`·`CLIENT_REWARD`는 `useTenantComponentFlags`로 게이트한다.

---

## §1 API·상태 공유 (웹과 동일)

| 영역 | 엔드포인트 | Expo 훅·유틸 |
|------|-----------|---------------|
| 카탈로그 | `GET .../shop/catalog` | `useClientShopCatalog` |
| 장바구니 | `GET/PUT .../shop/cart` | `useClientShopCart` |
| 체크아웃 | `POST .../checkout`, `prepare-payment` | `useClientShopCheckout` |
| 포인트 | `GET .../points/balance`, `.../points/ledger` | `useClientShopPoints` |
| 주문 | `GET .../orders`, `.../orders/{id}` | `useClientShopOrders` |
| 컴포넌트 | `GET /api/v1/tenant/components/active-codes` | `useTenantComponentFlags` |

- **tenantId**: 세션·`X-Tenant-ID` — 코드·문서에 테넌트 UUID 하드코딩 금지.
- **가격 권위**: `shop_catalog_skus.unit_price_minor` — 프론트 상수 금지.

---

## §2 라우트 트리

**Expo Router 경로** (`expo-app/app/(client)/(shop)/`):

| 화면 | 파일 | `CLIENT_SHOP_ROUTES` 상수 |
|------|------|---------------------------|
| PLP | `index.tsx` | `CATALOG` → `/(client)/(shop)` |
| 장바구니 | `cart.tsx` | `CART` |
| 체크아웃 | `checkout.tsx` | `CHECKOUT` |
| 내 포인트 | `points.tsx` | `POINTS` |
| 주문 목록 | `orders/index.tsx` | `ORDERS` |
| 주문 상세 | `orders/[orderPublicId].tsx` | `buildShopOrderDetailPath(id)` |
| SKU PDP | `sku/[skuCode].tsx` | `buildShopSkuDetailPath(code)` |

**레이아웃**: `_layout.tsx` — Stack, `headerShown: false`, `slide_from_right`.

**진입점**

| 경로 | 설명 |
|------|------|
| `(client)/(more)/index.tsx` | 「온라인 쇼핑」→ `CLIENT_SHOP_ROUTES.CATALOG` |
| `(client)/_layout.tsx` | `(shop)` 탭 `href: null` — 바텀 탭 비노출 |

**레거시**: `sessions-payment/*` 인접 — 쇼핑 전용 트리로 이전 완료.

---

## §3 컴포넌트·아토믹 계층

웹 `frontend/src/components/shop/`와 **동일 IA**, Expo는 `expo-app/src/components/shop/`:

| 계층 | Expo 컴포넌트 |
|------|----------------|
| Atoms | `AccentBar`, `PriceText` |
| Molecules | `SkuCard`, `PointInput`, `ShopCategoryTabs`, `LedgerListItem`, `FulfillmentLineList` |
| Organisms | `CheckoutSummary`, `PointBalanceHeader`, `ShopTenantBanner` |

상수·포맷·장바구니 로직: `clientShopConstants.ts`, `clientShopFormat.ts`, `clientShopCart.ts`.

---

## §4 웹 패리티 표

| MG-S | 웹 | Expo | 패리티 |
|------|-----|------|--------|
| MG-S1 PLP | `/client/shop` | `/(client)/(shop)` | ✅ |
| MG-S2 장바구니 | `/client/shop/cart` | `/(client)/(shop)/cart` | ✅ |
| MG-S3 체크아웃 | `/client/shop/checkout` | `/(client)/(shop)/checkout` | ✅ |
| MG-S4 포인트 | `/client/shop/points` | `/(client)/(shop)/points` | ✅ |
| MG-S5 주문 | `/client/shop/orders`, `.../orders/:id` | `orders/index`, `orders/[orderPublicId]` | ✅ |
| PDP | `/client/shop/sku/:skuCode` | `sku/[skuCode]` | ✅ |
| MG-S6 어드민 | `/admin/shop/*` | — | 웹 only |

**미패리티(의도)**  
- PG 결제창: Expo는 `prepare-payment` 후 WebView/딥링크 — 실기기 1건 검증 권장.  
- 어드민 SKU·정책·환불: 웹 only.

---

## §5 완료 조건 (core-coder·core-tester)

| # | 조건 | 상태 (로컬) |
|---|------|-------------|
| E1 | `(client)/(shop)/` 7화면 + Stack 레이아웃 | ✅ |
| E2 | 더보기 진입 + `(shop)` 탭 숨김 | ✅ |
| E3 | `useTenantComponentFlags` — `CLIENT_SHOP`/`CLIENT_REWARD` off 시 진입 차단 | ✅ |
| E4 | catalog·cart·checkout·points·orders API 훅 연동 | ✅ |
| E5 | Jest — `clientShopCart`, `clientShopFormat`, `clientShopRoutes` | ✅ (3 suite) |
| E6 | 실기기 체크아웃·PG 1건 | ☐ 수동 |
| E7 | Metro 번들 — [EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md](./EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md) §5 | ☐ CI/로컬 |

---

## §6 검증 명령

```bash
# Expo Shop 유틸 Jest
cd expo-app && npx jest --testPathPattern=clientShop

# 번들 (비대화형)
cd expo-app && npm run verify:bundle:ci
```

백엔드 Shop Maven 60건·Flyway·OPS: [SHOP_REWARD_IMPLEMENTATION_STATUS.md](./SHOP_REWARD_IMPLEMENTATION_STATUS.md).

---

## §7 잔여 (Expo 관점)

| ID | 항목 | Phase |
|----|------|-------|
| — | 실기기 PG·포인트 전액 E2E | P2 수동 |
| — | ASSESSMENT fulfillment UI(배지·슬롯) | Phase 3 |
| — | 하단 탭 `(shop)` 공개 노출 (제품 결정) | 후속 |

플랫폼 전체 잔여: [SHOP_REWARD_PLATFORM_ORCHESTRATION.md](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md) §3.4.

---

## §8 관련 문서

| 문서 | 용도 |
|------|------|
| [SHOP_REWARD_PLATFORM_ORCHESTRATION.md](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md) | 엔진·갭·MG-S 라우트 |
| [SHOP_REWARD_CLIENT_UI_DESIGN_HANDOFF.md](./SHOP_REWARD_CLIENT_UI_DESIGN_HANDOFF.md) | 토큰·와이어·Handoff |
| [POINT_REWARD_EARN_AND_REDEEM_SPEC.md](./POINT_REWARD_EARN_AND_REDEEM_SPEC.md) | hold·EARN·clawback |
| [MULTI_TENANT_SHOP_MARKETPLACE_SPEC.md](./MULTI_TENANT_SHOP_MARKETPLACE_SPEC.md) §7 | 채널 로드맵 |

---

*작성: core-planner Phase 1 · 문서만 · 커밋 없음*
