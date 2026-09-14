# DATAFIX_20260914_CHOI_PREPAID

**태그**: `DATAFIX_20260914_CHOI_PREPAID`  
**일자**: 2026-09-14  
**범위**: PROD 적용 + DEV 미러. **GitHub Actions 미실행.**  
**대상**: 최가을 `clients.id=78` (`tenant-incheon-counseling-001`)만.

## 운영 판단

「가예약으로 들어온 100,000원」은 SAME_DAY_CARD/가예약 매출이 아니라 **타기관 초기 상담 선납(prepaid)**.  
장기 정책: **데이터 정본**, 소스 우회 금지.

## READ 요약 (적용 전)

| 항목 | PROD 상태 |
|------|-----------|
| client 78 | `engagement=INSTITUTION_LINK`, `institution_prepaid=1`, amount=`100000`, date=`2026-09-07` |
| contract `#1` | `source_mapping_id=265`, `prepaid_amount=100000`(이미 백필), `prepaid_at`≈백필시각, `status=ACTIVE` |
| mapping 242 | `TERMINATED` / `SAME_DAY_CARD` / 90,000 / deposit 확인 |
| mapping 245·265 | `ACTIVE` / `INSTITUTION_LINK` / APPROVED (가예약 미수 아님) |
| **FT `#241`** | INCOME **90,000**, category=상담료, `related_entity=CONSULTANT_CLIENT_MAPPING`→**242** |
| deposit_records | client 78 **0건** |
| FT `#93` (100,000) | **최가을 아님** — mapping `78` = client **31**. 손대지 않음 |

백업 SELECT: `/opt/cursor/artifacts/DATAFIX_20260914_CHOI_PREPAID/before/` (최가을 행 중심).

## 적용 (PROD · DEV 동일 의도)

1. **contract `#1`**: `prepaid_amount=100000`, `prepaid_at=2026-09-07`, `status=ACTIVE`, notes에 태그.
2. **client 78**: denorm 선납 true / 100000 / 2026-09-07 (PROD는 이미 동일, DEV는 NULL→채움).
3. **mapping 245/265**: notes 「후납」→「선납」, IL 유지.
4. **mapping 242**: TERMINATED SAME_DAY 이력 notes + FT 재분류 안내.
5. **FT `#241`**: 삭제·추가 INCOME **없음**.  
   - `category=타기관선납`  
   - `subcategory` / `related_entity_type=INSTITUTION_LINK_PREPAID`  
   - `related_entity_id=265` (contract source mapping)  
   - **amount=90,000 유지** (카드 입금 실액 돈 흔적)  
   - 운영 선납 SSOT 금액은 contract/client **100,000**.

SQL: `scripts/datafix/DATAFIX_20260914_CHOI_PREPAID_prod.sql` (DEV는 동일 패턴 미러).

## Before → After (한국어)

| 대상 | Before | After |
|------|--------|-------|
| **FT id** | **241** · 상담료 · `CONSULTANT_CLIENT_MAPPING`→**242** · 90,000 | **241** · **타기관선납** · `INSTITUTION_LINK_PREPAID`→**265** · 90,000 (실액 유지) |
| **contract** | `#1` · prepaid 100000 · prepaid_at 백필시각 · notes에 후납 표현 | `#1` · prepaid **100000** · prepaid_at **2026-09-07** · 선납 정본 notes |
| **mapping** | 242 SAME_DAY TERMINATED + FT 연결 / 245·265 IL | 242 이력만 / **265**가 선납 FT 연결 / 245·265 선납 notes |
| **client** | PROD 이미 선납 100000 / DEV NULL | PROD·DEV 모두 선납 **100000** |
| 이중 INCOME | — | mapping 242/245/265 기준 INCOME **1건·합 90,000** (추가 전표 없음) |

## 의도적 미변경

- FT 금액 **90,000 ≠ 운영 SSOT 100,000**: 입금 실액 전표를 부풀리지 않음. 차액은 문서화만.
- FE 재배포 **불필요** (코드 변경 없음; 라벨은 데이터 `타기관선납` / related type으로 반영).
- Actions / Flyway / ERP 재전기 **없음**.

## 검증

```sql
SELECT id, category, subcategory, amount, related_entity_type, related_entity_id
FROM financial_transactions WHERE id=241;
-- 기대: 타기관선납 / INSTITUTION_LINK_PREPAID / 90000 / INSTITUTION_LINK_PREPAID / 265

SELECT prepaid_amount, prepaid_at, status, source_mapping_id
FROM institution_link_contracts WHERE client_id=78 AND is_deleted=0;
-- 기대: 100000 / 2026-09-07 / ACTIVE / 265

SELECT COUNT(*), SUM(amount) FROM financial_transactions
WHERE related_entity_id IN (242,245,265) AND transaction_type='INCOME' AND is_deleted=0;
-- 기대: 1 / 90000 (related_entity_id가 265로 바뀌었으므로 0일 수 있음 — prepaid type 별도 확인)
SELECT COUNT(*), SUM(amount) FROM financial_transactions
WHERE related_entity_type='INSTITUTION_LINK_PREPAID' AND related_entity_id=265 AND is_deleted=0;
-- 기대: 1 / 90000
```
