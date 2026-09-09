# Clinic-OS Onboarding Legal (사업자·약관 step)

**Status**: PASS·Ship (with merchant-legal shared record)  
**App**: e-trinity onboarding (`frontend-trinity`)

## Flow

`1 기본 정보` → **`7 사업자·약관`** → `2 업종` → `3 요금제` → `6 대시보드` → `5 완료`

## Checklist

- Step/card present with 「나중에 설정에서 또 쓰지 않아요」
- Mini footer preview (center name + legal fields)
- Empty 통신판매 / 환불 / 상품·가격 OK
- Biz number fail-closed (format+checksum) before next
- Values land in `checklistJson.merchantLegal` → `onboarding_request` columns → copied to `tenants` on approval
