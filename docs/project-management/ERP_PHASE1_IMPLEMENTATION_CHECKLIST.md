# ERP Phase 1 구현 체크리스트

본 문서는 ERP 회계·세무 Phase 1 구현 시 확인할 항목을 순서대로 정리한다. 구현 전제·결정 사항은 `docs/project-management/ERP_TAX_ACCOUNTING_DECISIONS_2026.md`를 따른다.

---

## 전제: 결정 사항 D1~D8

| ID | 내용 |
|----|------|
| **D1** | 일반과세(일반) |
| **D2** | 소비자 수취 금액에서 부가세 10% 분리 → 부가세 테이블 등록 |
| **D3** | 원천징수는 등록 시점에 즉시 계산 |
| **D4** | 원천 전용 계정 없음 → 계정 추가 필요 |
| **D5** | 카드: 승인액 − 수수료 = 입금 처리 |
| **D6** | 단말기, 조만간 PG/연동 예정 |
| **D7** | 취소·환불은 역분개 |
| **D8** | 소급 적용 필요, 운영 반영 데이터 포함 |

상세·참고 구현 위치: `docs/project-management/ERP_TAX_ACCOUNTING_DECISIONS_2026.md`

---

## 순서별 체크리스트

- [ ] **1.** 계정 마스터(`Account`)에 D4 원천·D2 부가세 매출세금 계정 등 Chart of Accounts 반영 방안 확정 및 테넌트별 생성·동기화와 정합 검증  
  참고: `src/main/java/com/coresolution/consultation/entity/Account.java`, `docs/standards/ERP_ADVANCEMENT_STANDARD.md`, `docs/project-management/ERP_ACCOUNT_TYPES_FOR_JOURNAL_PLAN.md`

- [ ] **2.** 공통코드 `ERP_ACCOUNT_TYPE` 및 온보딩 시드(REVENUE / EXPENSE / CASH / LIABILITY 등)에 원천·부가세 구분에 필요한 코드값·extraData(`accountId`) 보강  
  참고: `src/main/java/com/coresolution/consultation/support/TenantOnboardingSalaryAndFinancialSeedDefinitions.java`, `src/main/java/com/coresolution/consultation/controller/erp/AccountingAccountTypesController.java`

- [ ] **3.** `FinancialTransaction` 필드·`FinancialTransactionRequest` / `FinancialTransactionResponse`·`taxIncluded` / `amountBeforeTax` 등과 `taxAmount` 의미를 문서·코드 주석으로 단일화한다. **방침(한 줄):** 일반적으로 `taxAmount`는 부가세(VAT) 금액이며, 원천징수 예정액은 VAT와 별도이므로 동일 필드에 넣는 경우는 맥락(프리랜서 등)을 명시하고 혼동을 방지한다.  
  참고: `src/main/java/com/coresolution/consultation/entity/erp/financial/FinancialTransaction.java`, `src/main/java/com/coresolution/consultation/dto/FinancialTransactionRequest.java`, `src/main/java/com/coresolution/consultation/dto/FinancialTransactionResponse.java`, `src/main/java/com/coresolution/consultation/util/FreelanceWithholdingTaxUtil.java`, `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java`(원천 예정액 기록 예시)

- [ ] **4.** `AccountingServiceImpl.createJournalEntryFromTransaction`에서 D2에 맞춘 **다줄 분개**(매출·부가세 예수·현금 등 차변·대변 및 세금 계정 매핑) 설계·구현; 단일 분개 한계 시 분개 라인 확장·`AccountingEntry` 연계 규칙 명문화  
  참고: `src/main/java/com/coresolution/consultation/service/impl/AccountingServiceImpl.java`, `src/main/java/com/coresolution/consultation/entity/erp/accounting/AccountingEntry.java`

- [ ] **5.** 카드 D5: 승인액·가맹점 수수료·실입금액을 분리 반영하는 분개·거래 입력 흐름(결제 승인 → 재무 거래 → 입금 대사); D6 PG 연동 전 단말·수동 보정 전제 명시  
  참고: `src/main/java/com/coresolution/consultation/service/impl/PaymentServiceImpl.java`, `src/main/java/com/coresolution/consultation/service/impl/FinancialTransactionServiceImpl.java`, `src/main/java/com/coresolution/consultation/util/TaxCalculationUtil.java`(부가세 분리)

- [ ] **6.** D7 환불·부분환불 시 역분개: 기존 분개와 대칭되는 분개·`FinancialTransaction` 서브카테고리(`CONSULTATION_REFUND` 등)와 통계 연동을 검증  
  참고: `src/main/java/com/coresolution/consultation/service/impl/FinancialTransactionServiceImpl.java`, `src/test/java/com/coresolution/consultation/service/impl/AccountingServiceImplTest.java`

- [ ] **7.** Flyway 마이그레이션: `financial_transactions`·`accounting_entries`·`financial_transaction_id` 연계 등 스키마 변경 시 순서·호환성·롤백 전략 정리  
  참고: `src/main/resources/db/migration/V20250314_001__add_financial_transaction_id_to_accounting_entries.sql`, `src/main/resources/db/migration/V20260228_003__ensure_financial_transaction_id_on_accounting_entries.sql`

- [ ] **8.** D8 소급 배치: 과거 거래·분개 재생성 또는 보정 배치 실행 전제, 운영 데이터 포함 시 감사 로그·이력 요건 및 실행 윈도우  
  참고: `docs/project-management/ERP_TAX_ACCOUNTING_DECISIONS_2026.md`(마이그레이션·감사), `src/main/java/com/coresolution/consultation/service/impl/FinancialStatementServiceImpl.java`

---

## 검증·배포 게이트

- **core-tester:** Phase 1 반영 후 `AccountingServiceImplTest`·분개·환불·시드·세금 계산 관련 단위·통합 테스트 및 ERP 재무 허브 스모크를 `core-tester` 기준으로 통과시킨다.

- **core-deployer:** Flyway 적용 순서·D8 소급 배치·백엔드 배포를 `core-deployer` 저장소 워크플로 절차에 맞게 실행한다.
