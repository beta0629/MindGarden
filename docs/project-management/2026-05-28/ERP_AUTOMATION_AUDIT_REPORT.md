# ERP 자동화 시스템 전수 인벤토리 보고서

> 작성: 2026-05-28 (Agent b5551fab, explore subagent)
> 기준: develop tip `4dee473b8` (PR #69 merge 직후)
> 운영 main 비교: `c759f97a8` (시한폭탄 동일 잔존 확인)
> SSOT: `docs/standards/ERP_TROUBLESHOOTING.md` + `.cursor/skills/core-solution-erp/SKILL.md`

## A. 자동 분개 / 거래 생성 경로

| 트리거 | 파일·라인 | 거래 타입 | 자동화 | 비고 |
|---|---|---|---|---|
| `confirmPayment` 4-arg | `AdminServiceImpl.java:789` | **INCOME** | 활성 (REQUIRES_NEW) | `createConsultationIncomeTransactionAsync` → `createConsultationIncomeTransaction` 동기 호출 (메서드명만 "Async") |
| `confirmPayment` 3-arg | `AdminServiceImpl.java:1255` | **RECEIVABLES** | 활성 | `createReceivablesTransaction` |
| `confirmDeposit` | `AdminServiceImpl.java:1395` | **INCOME** | 활성 | 추가매칭 분기 + `effectiveAmount` 미존재 시 스킵 + Phase 4b finalize 호출 |
| `createConsultationIncomeTransaction` | `AdminServiceImpl.java:895` | INCOME | 중앙화 | 부가세 + 원천징수 + tax_amount/amount_before_tax 일관 채움 |
| `createAdditionalSessionIncomeTransaction` | `AdminServiceImpl.java:994` | INCOME (`subcategory=ADDITIONAL_CONSULTATION`) | 중앙화 | `CONSULTANT_CLIENT_MAPPING_ADDITIONAL` |
| `createConsultationRefundTransaction` | `AdminServiceImpl.java:1122` | **EXPENSE** (`CONSULTATION_REFUND`) | 자동 | |
| `createPartialConsultationRefundTransaction` | `AdminServiceImpl.java:1172` | **EXPENSE** (`CONSULTATION_PARTIAL_REFUND`) | 자동 | recordAmountChange 미호출 (StaleState 방지) |
| **`checkoutSameDayCard` (옵션 B)** | `AdminServiceImpl.java:1528, 1534` | **INCOME** | 활성 | `confirmPayment(4-arg)` → `confirmDeposit` → `approveMapping` 자동 연속 |
| 회기 차감 (`useSession`) | `AdminServiceImpl.java:1656` | (분개 없음) | 미구현 | `SESSION_USED` enum 부존재 |
| 멀티-트랜잭션 패턴 | `AdminServiceImpl.runInNewTransaction:1311-1335` | — | 활성 | save/restore 패턴 정착 (옵션 B v2.0 §4) |

**A 핵심 결함**: `TransactionType` enum 환불 코드 부재 → 환불도 EXPENSE 로 들어가 손익계산서에서 일반 비용과 섞임. `Async` 명명 오해 (실제는 동기).

## B. relatedTransactions / amount-info 일관성

| 항목 | 파일·라인 | 상태 |
|---|---|---|
| `getIntegratedAmountInfo` | `AmountManagementServiceImpl.java:119` | tenant 격리 OK |
| `accurateAmount` 우선순위 | `:41-60` | packagePrice 우선 → paymentAmount fallback |
| `isConsistent` 분기 | `:222-278` | packagePrice vs paymentAmount (10% 임계), packagePrice vs erpAmount |
| **환불 동기화** | `:241-244` | ❌ **INCOME 만 합산** — REFUND/PARTIAL_REFUND EXPENSE 거래가 erpTotalAmount 에서 차감되지 않음 |

**B 핵심 결함 (P1)**: 부분 환불 후 isConsistent OK 응답이 회계 사실과 분리. 옵션 B PENDING_PAYMENT + TENTATIVE_PENDING_PAYMENT 일정-매칭 mismatch 미탐지.

## C. 누적·역참조 위험 (LazyInit / N+1)

| 항목 | 위치 | 상태 |
|---|---|---|
| `AccountingEntry.lines` `@OneToMany` | `AccountingEntry.java:229` | **LAZY** (기본) |
| `JournalEntryLine.journalEntry` `@ManyToOne(LAZY)` | `JournalEntryLine.java:61` | LAZY |
| `application.yml` `open-in-view` | `:59` | **false** (LazyInit 폭탄 불관용) |
| `getJournalEntries` / `getJournalEntry` | `AccountingServiceImpl.java:176, 187` | ✅ DTO 프로젝션 (Agent 796e3a07 핫픽스) |
| `createJournalEntry` POST | `AccountingController.java:75-91` | ❌ **raw AccountingEntry 반환** — LazyInit |
| `approveJournalEntry` POST | `AccountingController.java:133-147` | ❌ raw entity 반환 |
| `postJournalEntry` POST | `AccountingController.java:153-165` | ❌ raw entity 반환 |
| `updateJournalEntry` PUT | `AccountingController.java:171-188` | ❌ raw entity 반환 |
| **운영 main `c759f97a8`** | (Merge PR #19) | **동일 시한폭탄 잔존** — GET 2개만 핫픽스, POST/PUT 4개 그대로 |

**C 핵심 결함 (P0/P1)**: 운영에서 어드민이 분개 생성/승인/전기/수정 호출 → 응답 직렬화 단계 LazyInit → 500. `backfillJournalEntriesFromIncomeTransactions` (`:853`) 풀스캔 + 매일 0:08 → 누적 시 메모리/응답 시간 위험.

## D. 멀티테넌시 / 컨텍스트 격리

| 검증 항목 | 결과 | 근거 |
|---|---|---|
| `financial_transactions.tenant_id` | ✅ 존재 | AuditableTenantBase + V20260531_004 backfill 100% |
| `branches.tenant_id` | ✅ 존재 (자체 컬럼) | `Branch.java:97` |
| `accounting_entries.tenant_id` + UNIQUE (tenant_id, entry_number) | ✅ | `:50-57` |
| `erp_journal_entry_lines.tenant_id` + 인덱스 | ✅ | `:34` |
| `TenantContextHolder` save/restore | ✅ | `AdminServiceImpl.runInNewTransaction:1317-1330` |
| 스케줄러 tenant 처리 | ⚠️ 패턴 불일치 | `ErpAutomationScheduler.runPerTenant:248-262` + StatisticsGenerationScheduler — `clear()` (save/restore 아님). 현재 thread fresh 이라 영향 없지만 합의서 §4 패턴 불일치 |
| HQ_ADMIN vs BRANCH_ADMIN | ⚠️ 분리 약함 | `AccountingController.checkErpAccess:45-69` 가 role.isAdmin() 단일 게이트 |
| `WorkflowAutomationServiceImpl @Scheduled` 4건 | ⚠️ tenant 처리 미확인 | 추가 조사 필요 |

## E. 결산 / 부가세 / 정산 자동화

| 자동화 | 클래스·메서드 | cron | 상태 | 비고 |
|---|---|---|---|---|
| 일 마감 | `ErpFinancialCloseServiceImpl.performDailyClose` | `0 10 0 * * *` | 🚨 **STUB** | log.debug 만 |
| 주 마감 | 동 `performWeeklyClose` | `0 15 0 * * MON` | 🚨 STUB | |
| 월 마감 | 동 `performMonthlyClose` | `0 20 0 1 * *` | 🚨 STUB | |
| 재무제표 (BS/IS/CF) | `ErpAutomationScheduler:97-113` | `0 25 0 1 * *` | 활성 | 마감 전 호출되므로 데이터 무결성 별도 |
| ERP init + 분개 backfill | `:56` | `0 8 0 * * *` | 활성 | 풀스캔 위험 (C 항목) |
| 통합 재무 갱신 | `:217` | `0 0 4 * * *` | 활성 | `CalculateFinancialKPIs` 등 5개 표준 프로시저 (E3 트랙 정착) |
| 정산 배치 | `:181` | `0 0 3 1 * *` | 활성 | `SettlementService.calculateSettlement` |
| 부가세 자동 계산 | `TaxCalculationUtil` (호출 `AdminServiceImpl:931, 1196`) | 거래 생성 시점 | 활성 | 10% VAT + D2 처리 |
| `DailyStatistics` 동기화 | `StatisticsGenerationScheduler:57, 147` | `0 1 0 * * *` | 활성 (ShedLock) | R6 KPI 분리 트랙과 일치 |
| 결산 후 거래 수정 차단 | (구현 없음) | — | 🚨 **부재** | `financial_period` 테이블 자체 부재 |

**E 핵심 결함 (P0)**: 일/주/월 마감 전부 스텁. 결산 후 수정 차단 가드 부재. 운영에서 "마감 후 거래 수정/삭제 → 재무제표 재집계로 과거 KPI 변동" 시나리오 무방비.

## F. 스케줄러 / 배치 매트릭스

| 클래스 | cron | enabled | tenant loop |
|---|---|---|---|
| `ErpAutomationScheduler` (10개) | 다양 | `scheduler.erp-automation.enabled` | ✅ `runPerTenant` |
| `StatisticsGenerationScheduler` daily/realtime | `0 1 0` / `0 0 *` | `scheduler.statistics-generation.enabled` | ✅ ShedLock |
| `SalaryBatchScheduler` | `0 0 2` / `0 0 *` | `scheduler.salary-batch.enabled` | ✅ |
| `WorkflowAutomationServiceImpl` (4) | `fixedRate=600000` 외 | (확인 필요) | (D 항목 위험 후보) |
| 기타 (Wellness/Reservation/Withdrawal/ShopOrder/Session/ClientGrade/AdminDeleteRetention/NotificationLog/Anonymize/Dormant) | 각자 | 대체로 ConditionalOnProperty | (개별 확인) |

E1 withSchemaName / E2 @Modifying long→int / E3 procedure signature drift — 모두 정착, ERP 잔존 영향 없음.

## G. 운영 영향 / P0–P3 잔존

| ID | 항목 | 우선순위 | 근거 |
|---|---|---|---|
| **G1** | **결산 스텁** — daily/weekly/monthly close 무동작 | **P0** | `ErpFinancialCloseServiceImpl:22-34` |
| **G2** | **AccountingController POST/PUT/approve/post 4 endpoint LazyInit 폭탄** | **P0** | `:75,133,153,171` raw entity 반환 + OSIV=false |
| G3 | 중복 거래 가드 app-level only — DB UNIQUE 부재 | P1 | `isDuplicateTransaction:102-115` (existsBy) |
| G4 | 환불 후 amount-info isConsistent 오탐 | P1 | `checkAmountConsistency:241-244` INCOME 만 합산 |
| G5 | 스케줄러 TenantContextHolder.clear() (save/restore 아님) | P2 | `ErpAutomationScheduler:258`, `StatisticsGenerationScheduler:108,172` |
| G6 | `WorkflowAutomationServiceImpl @Scheduled` 4건 tenant 미확인 | P2 | 추가 조사 |
| G7 | HQ_ADMIN vs BRANCH_ADMIN 분리 부재 | P2 | `checkErpAccess` 단일 게이트 |
| G8 | 회계 정정/취소 자동화 부재 | P2 | `AccountingEntry.cancel()` 호출 워크플로 없음 |
| G9 | 옵션 B PENDING_PAYMENT → INCOME 수동 status 변경 시 INCOME 트리거 없음 | P2 | checkoutSameDayCard 만 자동 |
| G10 | `createConsultationIncomeTransactionAsync` 명명 오해 | P3 | 실제는 동기 |
| G11 | `backfillJournalEntriesFromIncomeTransactions` 풀스캔 | P2 | `:853-878` 일일 00:08 |
| **G13** | **운영 main `c759f97a8` 시한폭탄** | **P0** (G2 sweep) | develop·main 동일 코드 |

## 결론부 — HIGH/MEDIUM/LOW + 다음 단계 + 우선순위 5건

### 트랙 권고
- **HIGH** (즉시 운영 리스크): G1 결산 스텁, G2 LazyInit 4 endpoint, G3 중복 거래 DB 가드 부재
- **MEDIUM**: G4 환불 일관성, G6 스케줄러 tenant 확인, G11 backfill 페이지네이션
- **LOW**: G5 save/restore 통일, G7 권한 분리, G8 회계 정정 자동화, G10 네이밍

### 다음 단계
1. 디버거 — 운영 DB 측정 (LazyInit 누적, 중복 거래 이력, 결산 스텁 증거, 환불 isConsistent 샘플)
2. 코더 PR-1~5
   - **PR-1 (P0)**: AccountingController 4 endpoint DTO 변환 sweep + LazyInitGuardTest (4)
   - **PR-2 (P0)**: ErpFinancialCloseServiceImpl 실구현 + `financial_period` 마이그 + 마감 후 수정 차단 가드
   - **PR-3 (P1)**: financial_transactions partial UNIQUE (tenant_id, related_entity_id, related_entity_type, transaction_type) WHERE is_deleted=false
   - **PR-4 (P1)**: checkAmountConsistency 환불 차감 + AmountConsistencyRefundDiffTest
   - **PR-5 (P2)**: backfill Pageable 스트리밍 + 메트릭
3. 테스터 — 회기 차감/환불 시나리오 회귀, PR-2 는 dry-run 토글 필수
4. 디플로이어 — PR-1 → PR-3 → PR-4 → PR-2 → PR-5 순. PR-2 는 RC 격리 배포

### 우선순위 5건 체크리스트
1. **[P0]** AccountingController 4 endpoint DTO sweep (G2/G13) — 운영 시한폭탄
2. **[P0]** ErpFinancialCloseServiceImpl 일/주/월 마감 실구현 + `financial_period` (G1)
3. **[P1]** financial_transactions 중복 거래 DB UNIQUE (G3)
4. **[P1]** checkAmountConsistency 환불 차감 (G4)
5. **[P2]** backfillJournalEntriesFromIncomeTransactions 페이지네이션 + 메트릭 (G11)
