# Clinic-OS · 어드민 주문 상세 모달 SSOT (P1)

구현 기준 요약 (HTML/PNG 시안 미반입 VM — layout rules + Critic Worth로 고정).

## Worth (MUST)

- 이행 타임라인 **첫 점** = `--cs-slate-400` (`#94A3B8`) — **틸/녹 링 금지**
- Primary CTA **전액환불** = solid brick `var(--mg-v2-color-semantic-error)`
- Secondary **환불 정합** = ghost
- **강제 환불 정합** = 축소 muted brick 텍스트, 우측 정렬

## 레이아웃

1. UnifiedModal + dim scrim (풀블리드 페이지 아님)
2. Info grid: label↑ / value↓ 카드
3. PortOne: quiet `i` + 한 줄 (`ADMIN_SHOP_ORDER_DETAIL_PORTONE_HINT`), title=전체 `ADMIN_SHOP_REFUND_PG_HINT`
4. 주문 라인 · 이행 타임라인 섹션 + divider

## 바인딩

| UI | API |
|----|-----|
| orderId | `orderPublicId` |
| orderStatus | `status` + `ADMIN_SHOP_ORDER_STATUS_LABELS` |
| client | `clientName` else `clientId` (이름 날조 금지) |
| paymentId / paymentStatus | 동일 필드 |
| orderAmount | `pgAmount` → `cashDueMinor` → `subtotalMinor` |
| orderedAt | `createdAt` |
| productName | `line.title \|\| line.skuCode` |
| eventAt / type / note | `createdAt` / category+status labels / `message` |

## 구현 파일

- `frontend/src/components/admin/shop/AdminShopOrderDetailModal.js`
- `frontend/src/styles/shop/AdminShopClinicOs.css` (`.admin-shop-order-detail*`)
- `frontend/src/constants/adminShopApi.js`

@author CoreSolution
@since 2026-09-22
