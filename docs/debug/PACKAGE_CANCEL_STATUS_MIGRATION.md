# 패키지 취소 상태 레거시 마이그레이션 가이드

**작성일**: 2026-08-29  
**대상**: `consultant_client_mappings` 중 관리자 취소인데 `status=TERMINATED` 로 남은 레거시 행  
**원칙**: **일괄 UPDATE 금지**. 판단 기준이 명확한 **단건만** 수동 SQL.

---

## 배경

write-path SSOT 변경 이후:

| 경로 | status | paymentStatus |
|------|--------|---------------|
| PENDING_PAYMENT 관리자 취소 | `CANCELLED` | `REJECTED` |
| 유료 전액 강제 종료/환불 | `CANCELLED` | `REFUNDED` |
| 추가패키지 병합·상담사 이관 | `TERMINATED` (유지) | 기존값 |
| 회기 소진 | `SESSIONS_EXHAUSTED` | 기존값 |

이력 API는 `mapping.status` 를 그대로 반환하고, StatusBadge 는 `CANCELLED→취소`, `TERMINATED→종료됨`.  
**UI display-only 패치로 TERMINATED→취소 매핑하지 말 것.**

---

## mapping #228 판단 기준 (예시)

대상 예: mapping `#228`, paymentReference `CARD_20260825_180714`, 화면상 최초매칭+종료됨.

다음을 **모두** 확인한 뒤에만 단건 UPDATE 검토:

1. `notes` 에 `PENDING_PAYMENT 매칭 취소` 문구가 있거나  
2. `notes` 에 `강제 종료` 문구가 있고, 동일 `mapping_id` 로 `CONSULTANT_CLIENT_MAPPING_REFUND` / subcategory `CONSULTATION_REFUND` EXPENSE FT 가 존재하며  
3. notes/termination_reason 에 **추가 패키지 병합**(`additional` / `targetActiveMappingId`) 또는 **상담사 변경** 이관이 **없을** 것  

**불확실하면 실행하지 말 것.** Flyway에 #228 강제 UPDATE 를 넣지 말 것.

---

## 안전할 때 — 단건 SQL 예시 (실행 전 백업·검증 SELECT 필수)

```sql
-- 1) 검증
SELECT id, tenant_id, status, payment_status, notes, termination_reason, payment_reference
FROM consultant_client_mappings
WHERE id = 228 AND is_deleted = FALSE;

SELECT id, related_entity_id, related_entity_type, subcategory, transaction_type, amount, is_deleted
FROM financial_transactions
WHERE related_entity_id = 228
  AND related_entity_type IN (
      'CONSULTANT_CLIENT_MAPPING_REFUND',
      'CONSULTANT_CLIENT_MAPPING_PARTIAL_REFUND'
  )
  AND is_deleted = FALSE;

-- 2) PENDING_PAYMENT 취소로 확정된 경우만
-- UPDATE consultant_client_mappings
-- SET status = 'CANCELLED',
--     payment_status = 'REJECTED',
--     updated_at = NOW()
-- WHERE id = 228
--   AND status = 'TERMINATED'
--   AND notes LIKE '%PENDING_PAYMENT 매칭 취소%';

-- 3) 유료 전액 강제 종료+REFUND FT 로 확정된 경우만
-- UPDATE consultant_client_mappings
-- SET status = 'CANCELLED',
--     payment_status = 'REFUNDED',
--     updated_at = NOW()
-- WHERE id = 228
--   AND status = 'TERMINATED'
--   AND notes LIKE '%강제 종료%'
--   AND EXISTS (
--     SELECT 1 FROM financial_transactions ft
--     WHERE ft.related_entity_id = 228
--       AND ft.related_entity_type = 'CONSULTANT_CLIENT_MAPPING_REFUND'
--       AND ft.is_deleted = FALSE
--   );
```

---

## 카드수수료 역분개

유료 전액 취소 write-path 는 기존 `createConsultationRefundTransaction`(CONSULTATION_REFUND EXPENSE) 을 유지한다.  
원 INCOME soft-delete / 카드수수료 역분개 전용 헬퍼가 없어 **본 배치에서는 수행하지 않음**.  
**카드수수료 역분개는 후속 과제.**

---

## 관련 코드

- Flyway: `V20260829_006__mapping_status_cancelled.sql`
- Write: `AdminServiceImpl.terminateMapping` / `terminatePendingPaymentMapping`
- Read: `ClientPackagePaymentHistoryServiceImpl` (status passthrough)
