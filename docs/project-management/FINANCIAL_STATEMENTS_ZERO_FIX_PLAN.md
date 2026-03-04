# 재무제표(대차대조표·손익계산서) 0 표시 현상 수정 기획

> 목표: 대차대조표·손익계산서에 “0이 아닌 실제 값”이 나오고, 화면에서 정상 표시되도록 범위·원인 조사·수정 단계·역할 배분을 정리한다.  
> 기획만 수행하며, 실행은 core-debugger / core-designer / core-coder 서브에이전트 호출로 위임한다.

---

## 1. 목표·배경

- **배경**: 대차대조표·손익계산서 모두 데이터가 0으로만 표시됨.
  - **대차대조표 원인(이미 파악된 내용)**: 백엔드가 자산/부채/자본을 **은행 계좌번호(accountNumber) 문자열**로만 판별하고, 실제 원장(erp_ledgers)의 계정이 회계 분류(자산/부채/자본)와 매핑되지 않음. 또한 API 응답 구조와 프론트 기대 구조 불일치.
  - **손익계산서**: 동일한 방식의 분류 문제 + API·프론트 구조 불일치 추정.
- **목표**: 두 제표 모두 “0이 아닌 실제 값”이 나오고, 화면에서 정상 표시되도록 **범위 정의 → 원인 조사(손익) → 수정 단계 → 역할별 실행**을 한 번에 설계한다.

---

## 2. 범위 정의

### 2.1 포함 범위

| 구분 | 포함 내용 |
|------|-----------|
| **대차대조표** | 백엔드 집계 로직(자산/부채/자본 분류 기준), API 응답 구조, 프론트 `IntegratedFinanceDashboard.js` 내 대차대조표 탭의 데이터 매핑·표시 |
| **손익계산서** | 백엔드 집계 로직(수익/비용 분류 기준), API 응답 구조, 프론트 손익계산서 탭의 데이터 매핑·표시 |
| **공통** | 회계 계정 분류 기준 도입(Account 또는 별도 마스터/공통코드와 연동), Ledger·원장 데이터와의 연결, 테넌트 격리 유지 |

### 2.2 제외·경계

- 현금흐름표(cash-flow)는 동일한 분류 로직을 쓰므로, 본 수정 시 함께 점검 가능하나 **별도 Phase로 명시하지 않음**. 필요 시 동일 패턴으로 확장.
- ERP 권한·세션·테넌트 설정 자체의 버그 수정은 포함하되, “0 표시” 직접 원인은 **분류 로직 + API 구조 + 프론트 매핑**에 한정.

### 2.3 영향 영역 요약

| 레이어 | 파일·기능 |
|--------|-----------|
| **백엔드** | `FinancialStatementServiceImpl.java`(분류 메서드·집계), `LedgerService`/원장 조회, (선택) Account 확장 또는 회계 계정 마스터/공통코드 |
| **API** | `FinancialStatementController.java` — `GET /api/v1/erp/accounting/statements/balance`, `GET /api/v1/erp/accounting/statements/income` 응답 body 구조 |
| **프론트** | `frontend/src/components/erp/IntegratedFinanceDashboard.js` — BalanceSheetTab, IncomeStatementTab의 `response.data` 매핑 및 UI 바인딩 |
| **참조** | `docs/standards/ERP_ADVANCEMENT_STANDARD.md`, `Account` 엔티티(현재 accountNumber 등 은행 계좌 용도), `Ledger` 엔티티(account 연관) |

---

## 3. core-debugger용 질의문(손익계산서 0 원인 분석)

아래 블록을 **그대로** core-debugger 서브에이전트 호출 시 프롬프트로 전달하면 된다.

---

```
[손익계산서 전부 0 표시 원인 분석 요청]

목표: 손익계산서 API가 반환하는 데이터가 프론트에서 0으로만 보이는 원인을, 대차대조표와 동일한 방식으로 분석해 주세요.

1) API·컨트롤러·서비스 추적
- 손익계산서 API 경로: GET /api/v1/erp/accounting/statements/income (startDate, endDate 쿼리)
- 컨트롤러: FinancialStatementController.getIncomeStatement → FinancialStatementService.generateIncomeStatement
- 구현체: FinancialStatementServiceImpl.generateIncomeStatement
- 확인할 것: 응답 body 실제 구조(success/data/revenue/expenses/netIncome, items 배열 여부)

2) 수익/비용 분류 로직
- FinancialStatementServiceImpl 내 isRevenueAccount(Ledger), isExpenseAccount(Ledger) 확인.
- 현재 계정 판별이 ledger.getAccount().getAccountNumber() 문자열(contains "REVENUE"/"수익", "EXPENSE"/"비용")에만 의존하는지 확인.
- 실제 DB의 accounts.account_number 값이 은행 계좌번호 형태(예: 숫자-숫자)라면 위 조건에 전혀 매칭되지 않아 필터 결과가 빈 스트림이 되고, totalRevenue/totalExpenses가 0이 되는지 검증.

3) 원장 데이터
- LedgerService.getLedgersByPeriod(tenantId, startDate, endDate)가 해당 기간 원장을 반환하는지, Ledger에 account 연관이 로드되는지 확인.
- Ledger의 totalCredit/totalDebit/closingBalance 등 집계 필드가 채워지는지 확인.

4) API 응답 vs 프론트 기대 구조
- 백엔드 현재 응답: revenue: { total, items[] }, expenses: { total, items[] }, netIncome.
- 프론트 IntegratedFinanceDashboard.js IncomeStatementTab 기대: revenue.consultationRevenue, revenue.otherRevenue, expenses.salaryExpense, expenses.rentExpense 등 세부 키.
- 두 구조가 불일치하면 프론트에서 undefined → 0으로 표시되는지 확인.

5) 산출 요청
- 원인 요약(1~4를 종합한 “왜 0인가”).
- 수정 제안(회계 계정 분류 도입, API 구조 통일, 프론트 매핑 중 무엇을 어떻게 할지)을 core-coder에 넘기기 위한 체크리스트 형태로 정리.
- 필요 시 대차대조표(자산/부채/자본 분류) 쪽도 동일한 관점으로 보완 분석 제안.
```

---

## 4. 수정 단계(Phase) 및 산출물

아래 순서가 맞다. 단계별로 “어떤 파일/기능을 건드리는지”를 리스트로 정리한다.

### Phase 1: 백엔드 — 회계 계정 분류 기준 도입

- **목표**: 자산/부채/자본/수익/비용을 **계좌번호 문자열이 아닌** 회계 계정 기준으로 판별하게 한다.
- **대상**:
  - `FinancialStatementServiceImpl.java`: `isAssetAccount`, `isLiabilityAccount`, `isEquityAccount`, `isRevenueAccount`, `isExpenseAccount` (및 이에 의존하는 isOperatingAccount, isInvestingAccount, isFinancingAccount) 재구현.
  - **선택지**: (A) Account 엔티티에 회계 계정 타입/코드 필드 추가 + DB·마이그레이션, (B) 공통코드 또는 별도 회계 계정 마스터와 account_id 매핑 테이블 도입, (C) 계정과목 코드 규칙(예: account_number 접두사)으로 분류. DB 설계는 `/core-solution-database-first` 참조.
- **산출물**: 분류 로직이 “회계 계정”을 참조하도록 변경된 서비스 코드; 필요 시 Entity/Repository/공통코드 연동.

### Phase 2: 백엔드 — API 응답 구조 통일

- **목표**: 프론트가 기대하는 구조와 맞추거나, 프론트가 “items 기반”으로 통일하도록 **한 가지 명확한 스키마**로 통일한다.
- **대상**:
  - `FinancialStatementServiceImpl.generateBalanceSheet` 반환 Map: 현재 `assets/liabilities/equity` 각각 `{ total, items[] }` 형태. 프론트는 `assets.currentAssets.cash`, `equity.capital.total`, `summary.totalAssets` 등을 기대하므로, **백엔드에서 summary·currentAssets·fixedAssets·capital·retainedEarnings 등 세부 구조를 채우거나**, 프론트를 items 기반으로 바꾸는 것 중 하나로 통일.
  - `FinancialStatementServiceImpl.generateIncomeStatement` 반환 Map: 현재 `revenue: { total, items[] }`, `expenses: { total, items[] }`. 프론트는 `revenue.consultationRevenue`, `expenses.salaryExpense` 등 카테고리 키를 기대하므로, **백엔드에서 카테고리별 키를 채우거나**, 프론트를 items + total 기반으로 바꾸는 것 중 하나로 통일.
- **산출물**: API 스펙(문서 또는 주석) + 실제 반환 구조가 스펙과 일치하는 구현. 필요 시 `BalanceSheetResponse` 등 DTO 사용 검토.

### Phase 3: 프론트 — 응답 매핑 및 UI 정합

- **목표**: 통일된 API 응답을 그대로 또는 최소 변환으로 사용해, 재무제표 탭에 0이 아닌 값이 표시되게 한다.
- **대상**:
  - `frontend/src/components/erp/IntegratedFinanceDashboard.js`: BalanceSheetTab의 `balanceSheetData` 사용처(assets.currentAssets.*, assets.fixedAssets.*, liabilities.*, equity.*, summary.*)를 실제 API 응답 구조에 맞게 수정.
  - 동일 파일: IncomeStatementTab의 `incomeStatementData` 사용처(revenue.*, expenses.*, netIncome)를 실제 API 응답 구조에 맞게 수정.
  - `frontend/src/constants/api.js`: 재무제표 API 경로는 이미 `/api/v1/erp/accounting/statements/*` 사용 중이면 유지.
- **산출물**: 응답 필드와 컴포넌트 state/표시 로직이 일치하도록 수정된 코드; 필요 시 “데이터 없음”/에러 시 문구·표시 일관성은 Phase 4(디자이너)와 연계.

---

## 5. 역할 배분

| 역할 | 할 일(한 줄 요약) |
|------|-------------------|
| **core-debugger** | 손익계산서 0 원인 분석(API 경로·컨트롤러·서비스·수익/비용 분류 로직·원장 데이터·API vs 프론트 구조 불일치). 필요 시 대차대조표 보완 분석. 수정 제안·체크리스트를 core-coder 전달용으로 정리. |
| **core-designer** | 재무제표 화면에서 “0만 나오는 상태”, “데이터 없음”, “에러” 상태의 UI·문구·레이아웃 일관성 검토. B0KlA·unified-design-tokens·AdminCommonLayout 기준으로 개선 스펙 제안(코드 수정 없음). |
| **core-coder** | 백엔드 회계 계정 분류 도입, API 응답 구조 통일, 프론트 API 매핑 및 표시 로직 수정. core-debugger 산출물·기획서 Phase 1~3 순서대로 구현. |

---

## 6. 단계별 완료 기준·체크리스트

- **Phase 1 완료**: 동일 테넌트·기간에서 원장 데이터가 있을 때, 분류 로직으로 자산/부채/자본·수익/비용이 구분되어 집계됨. (문자열 contains에만 의존하지 않음.)
- **Phase 2 완료**: `GET .../statements/balance`, `GET .../statements/income` 응답이 문서화된 스키마와 일치하며, 프론트에서 사용할 필드(total, items 또는 세부 키)가 포함됨.
- **Phase 3 완료**: 대차대조표·손익계산서 탭에서 실제 데이터가 0이 아닌 값으로 표시됨. (데이터가 없을 때 빈 상태 처리만 해도 됨.)
- **core-designer 완료**: 0/에러/데이터 없음 상태에 대한 UI·문구·레이아웃 개선 스펙이 정리되어, 코더가 반영 가능한 수준으로 전달됨.

---

## 7. 실행 요청문(서브에이전트 호출 순서)

다음 순서로 서브에이전트를 호출해 주세요.

1. **core-debugger**  
   - **전달 프롬프트**: 본 문서 §3 “core-debugger용 질의문” 블록 전체를 그대로 전달.  
   - **목적**: 손익계산서 0 원인 분석 + 필요 시 대차대조표 보완 분석, 수정 제안·체크리스트 산출.

2. **core-designer** (Phase 1~3 진행과 병렬 가능)  
   - **전달 프롬프트**: “재무제표(대차대조표·손익계산서) 화면에서 데이터가 전부 0이거나 없거나 에러일 때의 UI·문구·레이아웃을 docs/project-management/FINANCIAL_STATEMENTS_ZERO_FIX_PLAN.md 및 B0KlA·unified-design-tokens 기준으로 검토하고, 개선 스펙(코드 수정 없이)을 handoff 형식으로 정리해 주세요.”  
   - **목적**: 0/에러/데이터 없음 상태의 일관된 UX 스펙 확보.

3. **core-coder**  
   - **전달 프롬프트**: “docs/project-management/FINANCIAL_STATEMENTS_ZERO_FIX_PLAN.md의 Phase 1→2→3 순서대로 구현해 주세요. core-debugger 산출물(원인·수정 제안)을 반영하고, Phase 1에서 회계 계정 분류 도입, Phase 2에서 API 응답 구조 통일, Phase 3에서 IntegratedFinanceDashboard.js의 대차대조표·손익계산서 탭 매핑 및 표시를 수정해 주세요. 표준: /core-solution-backend, /core-solution-frontend, /core-solution-api.”  
   - **목적**: 실제 0이 아닌 값 표시까지 구현 완료.

(선택) 4. **core-tester**  
   - **전달 프롬프트**: “재무제표 API(statements/balance, statements/income)와 IntegratedFinanceDashboard 대차대조표·손익계산서 탭에 대한 통합·E2E 시나리오를 core-solution-testing 기준으로 작성·실행해 주세요.”  
   - **목적**: 수정 후 회귀 방지 및 완료 검증.

---

## 8. 리스크·제약

- **DB/스키마 변경**: Account에 회계 계정 타입을 넣는 경우 기존 데이터 마이그레이션·공통코드 연동 필요. database-first 스킬 참조.
- **하위 호환**: 기존 ErpController의 `/finance/balance-sheet`, `/finance/income-statement`를 쓰는 클라이언트가 있다면, 응답 구조 변경 시 호환성 검토 필요.
- **멀티테넌트**: 모든 집계·조회에 tenantId가 포함되어 있는지 유지.

---

*문서 위치: docs/project-management/FINANCIAL_STATEMENTS_ZERO_FIX_PLAN.md*
