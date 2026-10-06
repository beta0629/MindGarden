# 타기관(INSTITUTION_LINK) 연계 데이터 누락 전수 점검

**일자**: 2026-09-14  
**범위**: 스키마 · 코드 상수 · DEV/PROD DB READ-ONLY  
**전표**: ERP posting 없음 (재무 갭은 관찰만)  
**재무 SSOT 문서 브랜치**: `origin/cursor/institution-then-voucher-def-7f13` → `docs/project-management/INSTITUTION_LINK_FINANCE.md`

---

## 1. 스키마 점검 결과

| 대상 | DEV | PROD | 비고 |
|------|-----|------|------|
| `partner_institutions` | 있음 | 있음 | Flyway `20260914.003` |
| `institution_link_contracts` | 있음 | 있음 | `institution_id` FK → partner |
| `institution_link_consultation_logs` | 있음 | 있음 | `contract_id` FK **없음** (002 설계) |
| `clients.engagement_type` | 있음 | 있음 | `20260914.005` |
| `clients.partner_institution_id` | 있음 | 있음 | `20260914.006` FK |
| `consultant_client_mappings.payment_timing` | 있음 | 있음 | `INSTITUTION_LINK` 값 사용 중 |
| `schedules` → mapping/client FK | **DB FK 없음** | 동일 | soft reference (`mapping_id`) |
| `institution_link_schedule_links` | 없음 | 없음 | 구 `V20260914_001` data-mig 브랜치 설계만 |
| `institution_link_consultation_records` | 없음 | 있음(빈 테이블) | PROD만 `20260914.001` records DDL |

공통코드: `CLIENT_ENGAGEMENT_TYPE`, `INSTITUTION_LINK_CONTRACT_STATUS` 시드됨.

---

## 2. 인벤토리 (tenant `tenant-incheon-counseling-001`)

| 구분 | DEV | PROD |
|------|-----|------|
| partner | 1 (`id=1` 인천광역시 자립지원전담기관) | 1 (동일) |
| contracts | 1 (`id=1`, client **78**) | 1 |
| clients INSTITUTION_LINK | 1 (**78** 최가을) | 1 |
| mappings `payment_timing=INSTITUTION_LINK` | 2 (`245`,`265`) | 2 |
| institution logs | 0 | 2 (`1`,`2`) |
| 타 테넌트 IL 신호 | 0 | 0 |

---

## 3. Gap 표 (구체 ID · 조치)

| Gap | 조건 | 환경 | ID | 권장 |
|-----|------|------|-----|------|
| G1 | engagement=INSTITUTION_LINK ∧ `partner_institution_id` NULL | DEV/PROD | **없음** (78→partner 1) | — |
| G2a | IL mapping without `source_mapping_id` contract | DEV/PROD | **mapping 245** (client contract는 1건 존재, source=265) | **LEAVE** — schedule **378**이 245를 참조. 계약 1건(265) 유지 |
| G2b | contract without live mapping | — | **없음** (source 265 ACTIVE) | — |
| G3 | IL client with only SAME_DAY_CARD left | — | **없음** (ACTIVE IL 2건) | — |
| G4 | log missing mapping/schedule/client/contract | PROD | **log 1**: `contract_id` NULL (map 265·sched 436·client 78 OK) | **UPDATE** → contract 1 (`V20260914_007`) |
| G4 | log OK | PROD | log **2** (contract 1, map 265, sched 436) | LEAVE |
| G5 | contract amount 0 | DEV/PROD | **contract 1** prepaid=0 monthly=0 | **UPDATE prepaid** ← client denorm 100000 (PROD). monthly는 **LEAVE 0** (월 고정 아님) |
| G5 | missing institution | — | **없음** (institution_id=1 OK) | — |
| G6 | IL client schedule still provisional/SAME_DAY typed | DEV/PROD | **schedule 373** → map **242** TERMINATED `SAME_DAY_CARD` | **LEAVE** — 전환 전 이력. status는 COMPLETED(가예약 상태 아님) |
| DUP | 동일 client ACTIVE IL mapping 2건 | DEV/PROD | **245, 265** | **LEAVE** (당분간). 이력 스케줄 분리 유지. 추후 245 종료는 제품 합의 후 |
| DENORM | client institution_name NULL | **DEV only** | client **78** | **UPDATE** name ← partner (`V20260914_007`) |
| CR leak | 회기권 `consultation_records` on IL path | PROD/DEV | CR **328**(sched 373), **355**(sched 378) | **LEAVE** 후 별도 이관 Flyway (본문 복사). 이번 백필 제외 |
| FIN | FT related_entity 이상 | PROD | FT **93** type=MAPPING id=**78**(client id 오인 가능); FT **241** → map **242** 90,000 당일카드 입금 | **LEAVE / no ERP posting**. 타기관 전용 매출 경로 미구현([INSTITUTION_LINK_FINANCE.md](./INSTITUTION_LINK_FINANCE.md)) |

---

## 4. 최가을 (client_id=78) 요약

| 항목 | 값 |
|------|-----|
| engagement | `INSTITUTION_LINK` |
| partner | 1 (인천광역시 자립지원전담기관) |
| contract | 1 · status ACTIVE · source_mapping **265** · 금액 0/0 → 백필 대상(PROD 선납 100,000) |
| mappings | 242 TERMINATED SAME_DAY · 245 ACTIVE IL · 265 ACTIVE IL |
| schedules | 373(242), 378(245), PROD+436(265 CONFIRMED) |
| PROD logs | 1(contract NULL→백필), 2(OK) — 동일 schedule 436에 occurrence 1·2 |
| PROD client denorm | prepaid=1, amount=100000, name 채워짐 |
| DEV client denorm | name/prepaid NULL → name만 백필 |

DATAFIX 노트: mapping 245/265 notes에 `[DATAFIX_20260914_CHOIGAEUL]` (SAME_DAY→INSTITUTION_LINK) 이미 반영.

---

## 5. 재무 관련 갭 (ERP posting 없음)

| 관찰 | 의미 | 조치 |
|------|------|------|
| contract prepaid/monthly = 0 vs client prepaid 100,000 | 계약 SSOT 금액 비어 있음 | 백필 prepaid only |
| mapping package/payment 90,000 (단회기) | 회기권 패키지 잔재 | LEAVE. 타기관=고정금액·remaining 게이트 분리 |
| FT 241 → mapping 242 (SAME_DAY 종료분) | 가예약/당일카드 매출 경로 이력 | LEAVE. 기관연계 경로로 재전기 금지 |
| FT 93 related_entity_id=78 | mapping id로 client id가 들어간 이력 의 | LEAVE. 정정 전표 금지 |
| mapping 245/265 에 연결된 FT 없음 | 기관연계 배정·선납 전표 미연결 | 설계상 배정≠전표 ([FINANCE](./INSTITUTION_LINK_FINANCE.md) §2). 선납 confirm-deposit 재사용은 **후속 구현** |
| `deposit_records` client_id=78 | 조회 0건 | 선납은 client denorm만 존재 |

---

## 6. 제안 마이그레이션 아웃라인

파일: `src/main/resources/db/migration/V20260914_007__institution_link_data_gap_backfill.sql`

1. `institution_link_contracts.prepaid_amount` ← `clients.institution_prepaid_amount`  
   (engagement=INSTITUTION_LINK ∧ prepaid=1 ∧ amount>0 ∧ contract.prepaid=0)
2. `institution_link_consultation_logs.contract_id` ← 유일 활성 계약  
   (contract_id IS NULL ∧ client당 계약 1건)
3. `clients.institution_name` ← `partner_institutions.name`  
   (NULL/빈문자만)

**후속(별도 Flyway, 이번 PR 비포함)**  
- CR 355(IL schedule) → `institution_link_consultation_logs` 본문 이관  
- mapping 245 종료 여부 제품 합의  
- 타기관 선납 `confirm-deposit` 경로 구현 (전표는 그때)

---

## 7. 검증 쿼리 (tenant-safe, READ-ONLY)

```sql
-- G1
SELECT tenant_id, id FROM clients
WHERE engagement_type='INSTITUTION_LINK' AND partner_institution_id IS NULL
  AND tenant_id IS NOT NULL AND tenant_id<>'';

-- G2a
SELECT m.tenant_id, m.id FROM consultant_client_mappings m
WHERE m.payment_timing='INSTITUTION_LINK' AND (m.is_deleted=0 OR m.is_deleted IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM institution_link_contracts c
    WHERE c.tenant_id=m.tenant_id AND c.source_mapping_id=m.id AND c.is_deleted=0);

-- G5
SELECT id, client_id, prepaid_amount, monthly_amount FROM institution_link_contracts
WHERE is_deleted=0 AND (prepaid_amount=0 OR monthly_amount=0);
```

---

## 8. 참고 브랜치

| 브랜치 | 용도 |
|--------|------|
| `origin/cursor/institution-then-voucher-def-7f13` | `INSTITUTION_LINK_FINANCE.md` · `INSTITUTION_LINK_THEN_VOUCHER.md` (문서만) |
| `origin/cursor/institution-link-data-mig-7f13` | 구 통합 `V20260914_001` 마이그(마커 LIKE). **현 PROD 스키마와 불일치** — 재적용 금지 |
| 본 브랜치 `cursor/institution-link-gap-audit-71ba` | 갭 감사 문서 + `V20260914_007` 백필 |
