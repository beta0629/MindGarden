# ERP 세금·회계 결정 (2026)

## 개요

본 문서는 MindGarden ERP·회계 영역에서 **세금 처리·원천·카드 입금·취소/환불** 등에 대한 운영·구현 전제를 확정한 기록이다. 구현 세부는 별도 스펙·티켓에서 다루며, 여기서는 **결정 사항만** 명시한다.

## 결정 사항

| ID | 결정 내용 |
|----|-----------|
| **D1** | 일반과세(일반) |
| **D2** | 소비자 수취 금액에서 부가세 10% 분리 → 부가세 테이블 등록 |
| **D3** | 원천징수는 등록 시점에 즉시 계산 |
| **D4** | 원천 전용 계정 없음 → **계정 추가 필요** |
| **D5** | 카드: 승인액 − 수수료 = 입금 처리 |
| **D6** | 단말기, 조만간 PG/연동 예정 |
| **D7** | 취소·환불은 역분개 |
| **D8** | 소급 적용 필요, 운영 반영 데이터 포함 |

## 구현 시 유의

- **월별 세금 요약 집계**: `ErpMonthlyTaxBreakdownHelper`는 레거시(원천이 `tax_amount`에만 있는 경우)를 설명·비고 키워드로 원천·부가세 합계를 분리한다(D8 배치와 별개의 읽기 보정).
- **분개**: D2·D5·D7에 맞춰 차변·대변·세금 계정 매핑을 일관되게 유지하고, 취소·환불 시 역분개 규칙을 명문화한다.
- **계정 마스터**: D4에 따라 원천 관련 계정을 마스터에 반영한 뒤 트랜잭션·보고서와 정합을 검증한다.
- **마이그레이션**: D8에 따라 과거 데이터 소급 시 스키마·배치 순서·롤백 전략을 사전에 정한다.
- **감사**: 원천 즉시 계산(D3)·소급(D8) 시 누가 언제 무엇을 바꿨는지 추적 가능하도록 로그·이력 요건을 맞춘다.

## 참고

- `src/main/java/com/coresolution/consultation/service/impl/AccountingServiceImpl.java`
- `src/main/java/com/coresolution/consultation/service/impl/FinancialStatementServiceImpl.java`
- `docs/standards/ERP_ADVANCEMENT_STANDARD.md`

## D8 소급 절차(초안)

- **목적**: 과거에 원천징수 예정액이 `financial_transactions.tax_amount`에만 기록된 거래를 `withholding_tax_amount`로 옮겨 의미를 단일화한다(부가세는 `tax_amount`, 원천은 `withholding_tax_amount`).
- **식별(설계)**: 테넌트·거래 유형·카테고리(프리랜스/사업소득 등) 조건으로 후보를 좁히고, `withholding_tax_amount = 0`이면서 `tax_amount > 0` 등 규칙은 **운영 샘플·대사**로 확정한 뒤 반영한다. VAT만 있는 정상 거래와 혼동되지 않게 한다.
- **dry-run 필수**: 파괴적 `UPDATE` 없이 먼저 SELECT-only 또는 미리보기 집계(건수, 합계, 표본 ID)를 남기고, 감사 로그·승인·실행 윈도우를 갖춘 뒤 본 실행한다.
- **dry-run 구현됨(읽기 전용)**: `ErpFinancialDataRetrofitServiceImpl#retrofitWithholdingFromLegacyTaxAmount`에서 후보 건수·표본 ID를 INFO 로그로만 남긴다(UPDATE 없음).
- **실행 경로**: 전 테넌트 루프·일반 스케줄러 연결 금지. 관리자 전용 API(세션·역할) + 단일 `tenantId` + 필요 시 `erp-retrofit` 프로파일 및 `erp.financial.retrofit.enabled=true` 등 **명시적 플래그** 조합을 전제로 한다. 구현 훅: `ErpFinancialDataRetrofitService#retrofitWithholdingFromLegacyTaxAmount`.
- **참고 백필 패턴**: 분개 백필은 `AccountingBackfillController` / `AccountingServiceImpl#backfillJournalEntriesFromIncomeTransactions`와 유사하게 테넌트 단위·관리자 전용을 유지한다.
