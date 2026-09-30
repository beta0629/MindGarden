# Payment Source — Online vs Manual 매핑 규칙 (P1)

**상태**: 확정 (SSOT)  
**범위**: Client + Admin payment history / package history / admin shop orders  
**작성**: 2026-03-18 · core-planner

## 1. 목표

결제 수단(`paymentMethod`)만으로 채널을 추정하지 않는다.  
목록·이력 UI는 **`paymentSource` + 뱃지**로 온라인 vs 수동/센터를 구분한다.

| Source | 의미 | 뱃지 라벨 (FE 상수) |
|--------|------|---------------------|
| `ONLINE` | PortOne/PG (card 등) 경유 | 온라인 |
| `MANUAL` | 어드민 confirm-payment 등 센터 등록 | 수동/센터 |
| `UNKNOWN` | 판별 불가 | 미확인 (또는 숨김). **온라인으로 오인 금지** |

## 2. DB migration 판단 (P1)

**P1 = 목록 DTO 매핑 우선. `payment_source` 컬럼 / Flyway는 후속.**

- 기존에 `PaymentSource`/`PaymentChannel` enum·DB 컬럼 없음.
- fail-closed에 컬럼이 더 낫지만, 범위가 커지므로 **런타임 조인·추론으로 DTO에 `paymentSource` 주입**.
- Follow-up: mapping/extension에 `payment_source` 기록(confirm-payment→MANUAL, PortOne/shop→ONLINE).

## 3. Fail-closed 매핑 규칙

판정 시 **`paymentMethod == CARD` 만으로 ONLINE 금지**.

### 3.1 ONLINE

다음을 **모두** 만족하면 `ONLINE`:

1. `payments` 행 존재 (`tenantId` + `orderId` = mapping/extension의 `paymentReference` trim), 그리고
2. `provider ∈` PG providers (`TOSS`, `IAMPORT`(PortOne), `KAKAO`, `NAVER`, `PAYPAL`)

또는:

- Admin shop order 목록: 주문이 PG/shop checkout 경로이므로 **행별 `paymentSource=ONLINE`** (provider 있으면 그대로 보강).

### 3.2 MANUAL

다음이면 `MANUAL`:

- PG `payments` 연계 **없음**, 그리고
- 어드민 confirm-payment / mapping·session-extension 등록 경로로 보이는 이력  
  (매핑·회기추가 행에 `paymentMethod`/`paymentReference`/`paymentStatus`/`paymentDate` 중 하나라도 어드민 기록으로 존재, 또는 결제 완료·입금확인 상태이면서 PG 미연계)

### 3.3 UNKNOWN

- PG 행이 있으나 provider가 null/비PG → `UNKNOWN` (ONLINE 오인 금지)
- 참조만 있고 Payment 조회 실패·불명확 → `UNKNOWN`
- 아무 단서 없음 → `UNKNOWN`

## 4. API / DTO

| 산출물 | 변경 |
|--------|------|
| `PaymentSource` enum | `ONLINE`, `MANUAL`, `UNKNOWN` |
| `PackagePaymentHistoryItemResponse` | `paymentSource` 추가 (라벨은 FE 상수 권장) |
| `ShopOrderAdminSummaryItem` | `paymentSource` (기본 ONLINE) + 선택 `paymentProvider` |
| `PaymentResponse` | 기존 `provider`로 FE ONLINE 추론 가능 시 문서화; 필요 시 명시 필드 |

라벨 문자열은 테넌트/브랜드 하드코딩 금지. FE `PACKAGE_PAYMENT_HISTORY_UI.SOURCE_LABELS` 등.

## 5. 하드코딩 게이트

- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17  
- `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3  
- `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`

## 6. 범위 밖 (Follow-up)

- Flyway `payment_source` 컬럼 + 기록 경로 강제  
- Expo `usePayments` / sessions-payment 패스스루 (시간 되면)
