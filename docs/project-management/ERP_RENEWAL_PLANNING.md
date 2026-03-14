# ERP 자동화·리뉴얼 기획 — 기획·디자인·퍼블·코더 협업

**작성일**: 2025-03-14  
**역할**: core-planner (오케스트레이션)  
**참조**: `docs/troubleshooting/ERP_REVENUE_TO_STATEMENTS_ANALYSIS.md`, `/core-solution-erp`, `/core-solution-planning`

---

## 1. 목표·배경

- **배경**: 상담료 수입은 `financial_transactions`에 등록되나 분개(`accounting_entries`) 미생성 또는 전기 미반영 → 대차대조표·손익계산서·현금흐름표에 데이터 미표시. 사용자 불편 해소 및 운영 효율화를 위해 ERP 자동화·리뉴얼 필요.
- **목표**  
  1. **사용이 편해야 함** — 직관적 UI/UX, 반복 작업 최소화  
  2. **차변/대변 분리 입력** — 샘플처럼 차변/대변 라인별 입력, 수치 균형 검증  
  3. **자동화 극대화** — 설정값·매핑·반복 분개 등 자동 세팅  

---

## 2. 범위 (포함/제외)

| 포함 | 제외 |
|------|------|
| 입금확인/결제확인 → 분개 자동 생성·전기 플로우 정비 | ERP 외 도메인(상담·스케줄 등) 기능 확장 |
| 차변/대변 라인별 입력 수동 분개 폼·API·검증 | 외부 회계 시스템 연동(추후 Phase 검토) |
| 계정 매핑(ERP_ACCOUNT_TYPE)·템플릿·자동 세팅 | 재무제표 회계 기준 변경(별도 검토) |
| 대차대조표·손익계산서·현금흐름표 차트/테이블 시각화 | |

**영향 영역**: 어드민(AdminCommonLayout), ERP 회계 API·서비스(`AccountingServiceImpl`, `FinancialStatementServiceImpl`, `LedgerServiceImpl`), 분개·원장·재무제표 화면.

---

## 3. 자동화 vs 수동 입력 경계 (기획 정리)

- **자동**: 입금확인(confirm-deposit)·결제확인(confirm-payment) 시 `financial_transactions` 생성 → `createJournalEntryFromTransaction()` → 분개 생성 → (이미 코드 상) 자동 승인·전기 시도 → 원장 반영. **계정 매핑(REVENUE/EXPENSE/CASH)이 있으면** 이 흐름으로 재무제표까지 반영되도록 유지·보강.
- **수동**: 반복 분개·일회성 분개·차변/대변 라인을 사용자가 직접 입력하는 경우. **차변/대변 라인별 입력 폼** + **차·대 균형 검증** + 저장 시 `createJournalEntry()` 호출(기존 서비스 활용).
- **경계**: “거래(FinancialTransaction) 기반”이면 자동 분개; “사용자 직접 라인 입력”이면 수동 분개. 수동 분개도 승인·전기 후 원장 → 재무제표에 반영(기존 `approveJournalEntry` / `postJournalEntry` 활용).

---

## 4. 입금확인/결제확인 → 분개 자동 생성 플로우 (요약)

1. **입금확인** `POST .../confirm-deposit` → `AdminServiceImpl.confirmDeposit` → `createConsultationIncomeTransaction` → `FinancialTransactionServiceImpl.createTransaction()` → `AccountingServiceImpl.createJournalEntryFromTransaction()` → 분개 DRAFT 저장 → 자동 승인 → `postJournalEntry()` → 원장 반영.
2. **결제확인** `POST .../confirm-payment` (4인자, 금액 포함) → 동일하게 INCOME 거래 생성 후 위와 동일 분개·전기.
3. **끊김 방지**: 계정 매핑(REVENUE/EXPENSE/CASH) 시딩·점검, 테넌트 컨텍스트 일치, 전기 예외 로깅·모니터링. (상세는 `docs/troubleshooting/ERP_REVENUE_TO_STATEMENTS_ANALYSIS.md` §4·§5 참조.)

---

## 5. 사용자 시나리오별 플로우 (기획)

| 시나리오 | 트리거 | 플로우 | 담당 |
|----------|--------|--------|------|
| 신규 매칭 입금확인 | 관리자 입금확인 버튼 | confirm-deposit → 거래 생성 → 자동 분개 → 자동 승인·전기 → 원장 | 자동 |
| 추가 결제(추가 회기) | 추가 결제 확인 | confirm-payment(금액 포함) → 동일 자동 분개·전기 | 자동 |
| 환불 | 환불 처리 | 환불 거래 생성 → (정책에 따라) 자동 분개 또는 수동 분개 후보 | 자동/수동 정책 정의 |
| 수동 분개 | 관리자 분개 입력 화면 | 차변/대변 라인 입력 → 균형 검증 → 저장(DRAFT) → 승인 → 전기 | 수동 |
| 재무제표 조회 | 관리자 재무 메뉴 | 기간 선택 → 대차대조표/손익계산서/현금흐름표 API → 차트/테이블 시각화 | 조회·시각화 |

---

## 6. 사용자 관점 요구 (디자이너 전달용)

- **사용성**: 관리자(ADMIN)가 입금/결제 확인은 최소 클릭으로, 수동 분개는 차변/대변 라인을 명확히 구분해 입력·균형 확인. 자주 쓰는 동작(입금확인, 분개 목록, 재무제표)을 LNB/메인에서 바로 접근.
- **정보 노출**: 역할별로 ERP·재무 데이터는 ADMIN만; 차변/대변 금액·계정과목·전기 상태는 분개 상세에서 노출. 재무제표는 기간·테넌트 필터만 적용.
- **레이아웃**: AdminCommonLayout 기준. 분개 입력 폼은 상단(제목·일자·적요) + 차변/대변 테이블(라인 추가/삭제) + 합계·균형 표시 + 저장/승인/전기 버튼. 재무제표는 상단 기간 선택 + 카드/테이블/차트 블록.

---

## 7. 분배실행 (실행 분배표)

아래 Phase 순서로 서브에이전트를 호출하고, **결과를 기획에게 보고**받아 취합 후 사용자에게 최종 보고한다. **Phase 1·2·3은 서로 의존성이 없으므로 동시(병렬) 호출 가능.**

### Phase 1 — core-designer (UI/UX·레이아웃·비주얼 설계)

**호출**: `core-designer`  
**적용 스킬**: `/core-solution-atomic-design`, `/core-solution-design-handoff`, B0KlA·unified-design-tokens 참조

**전달할 태스크 설명(프롬프트)**:

```
[ERP 리뉴얼 — 디자인 설계 의뢰]

배경: ERP 분개 입력(차변/대변 라인별) 및 재무제표 시각화를 리뉴얼합니다. 
참조: docs/project-management/ERP_RENEWAL_PLANNING.md (기획서), 
어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample, 
mindgarden-design-system.pen B0KlA, unified-design-tokens.css.

다음 세 가지를 반영해 설계해 주세요.

1) 사용성: 관리자(ADMIN)가 차변/대변을 라인별로 입력하고, 합계 균형이 한눈에 보이게. 
   입금확인·결제확인은 기존처럼 최소 클릭 유지. 
   자주 쓰는 동작(분개 목록, 재무제표) 접근 경로 명확.

2) 정보 노출: 분개 폼 — 일자, 적요, 차변/대변 라인(계정, 금액), 합계·균형 표시. 
   재무제표 — 기간 선택, 대차대조표/손익계산서/현금흐름표별 테이블·차트 영역.

3) 레이아웃: AdminCommonLayout 기준. 
   분개 입력: 상단(제목·일자·적요) + 차변/대변 구분 테이블(라인 추가/삭제) + 합계·균형 + 저장/승인/전기 버튼. 
   재무제표: 상단 기간 선택 + 카드/테이블/차트 블록.

산출 요청: 
- 차변/대변 나눠 입력하는 분개 폼의 레이아웃·UI 스펙(영역·컴포넌트·토큰).
- 대차대조표·손익계산서·현금흐름표 차트/테이블 시각화 방향(블록 구성·데이터 표시 방식).
코드 작성 없음. 시안 또는 스펙 문서로 코더·퍼블리셔가 구현할 수 있게 작성.
```

---

### Phase 2 — core-publisher (아토믹 HTML 마크업)

**호출**: `core-publisher`  
**적용 스킬**: `/core-solution-publisher`, `/core-solution-atomic-design`

**전달할 태스크 설명(프롬프트)**:

```
[ERP 리뉴얼 — 퍼블리싱 의뢰]

배경: 분개 입력 폼(차변/대변 라인별)과 재무제표 영역을 아토믹 디자인 기반 HTML로 마크업하려 합니다.
참조: docs/project-management/ERP_RENEWAL_PLANNING.md, 
B0KlA·unified-design-tokens 적용, core-designer Phase 1 산출물(있으면 해당 스펙).

요청:
1) 분개 입력 폼: 시맨틱 HTML + BEM. 
   구조: 폼 상단(제목·일자·적요) + 차변 라인 테이블/리스트 + 대변 라인 테이블/리스트 + 
   합계·균형 표시 영역 + 버튼 그룹(저장/승인/전기).
2) 차변/대변 테이블: thead/tbody, 계정·금액 컬럼, 라인 추가용 빈 행 또는 버튼 위치.
3) B0KlA·unified-design-tokens 적용 시점: 클래스명·토큰 사용 위치를 스펙 또는 주석으로 명시.

산출: HTML 마크업만. JS/React·CSS 수정 없음. 코더가 JSX·로직·스타일 연동할 수 있도록 구조만 제공.
```

---

### Phase 3 — core-coder (연동·API·검증·자동 세팅 관점)

**호출**: `core-coder`  
**적용 스킬**: `/core-solution-backend`, `/core-solution-frontend`, `/core-solution-erp`, `/core-solution-database-first`

**전달할 태스크 설명(프롬프트)**:

```
[ERP 리뉴얼 — 구현 관점 의견·수정 포인트 정리]

배경: 입금확인/결제확인 → 분개 자동 생성·전기 연동 강화, 차변/대변 수동 입력 폼, 재무제표 시각화를 진행합니다.
참조: docs/project-management/ERP_RENEWAL_PLANNING.md, docs/troubleshooting/ERP_REVENUE_TO_STATEMENTS_ANALYSIS.md, 
AccountingServiceImpl.createJournalEntryFromTransaction(), createJournalEntry(), postJournalEntry().

다음 관점에서 핵심 의견·결론을 요약해 주세요 (실제 코드 수정은 후속 태스크에서 진행).

1) 분개 자동 생성 연동: 입금확인→분개→원장 반영이 끊기지 않도록 수정·점검 포인트 
   (계정 매핑, 테넌트 컨텍스트, 전기 예외 처리, 로깅).

2) 차변/대변 입력 폼: 프론트에서 라인 추가/삭제·합계·균형 검증 후 API로 전달할 때 
   기존 AccountingService.createJournalEntry(tenantId, entry, lines) 활용 방안, 
   API 스펙(요청/응답)·검증 로직 관점.

3) 자동 세팅: 계정 매핑(ERP_ACCOUNT_TYPE)·템플릿·반복 분개 자동 세팅 구현 시 
   백엔드/프론트 저장소·API·UI 노출 위치 관점.

코드 작성 없음. 의견·수정 포인트·우선순위만 산출.
```

---

## 8. 리스크·제약

- 기존 재무제표는 `erp_ledgers`만 사용하므로, 분개 전기 실패 시 계속 데이터 미표시. 계정 매핑 시딩·전기 예외 모니터링 필수.
- 테넌트 격리: 모든 ERP API·화면에 tenantId 필수 (`/core-solution-multi-tenant`).
- 반응형: 신규/개선 화면은 반응형 전제.

---

## 9. 완료 기준·체크리스트

- [ ] 기획: 자동화/수동 경계·시나리오별 플로우가 문서화되었는가?
- [ ] core-designer: 분개 폼·재무제표 시각화 스펙이 코더/퍼블이 구현 가능한 수준인가?
- [ ] core-publisher: 분개 폼·차변/대변 테이블 HTML이 아토믹·BEM·토큰 적용 방향이 명시되었는가?
- [ ] core-coder: 자동 생성 연동·폼 API·자동 세팅 관점에서 수정 포인트·우선순위가 정리되었는가?
- [ ] 역할별 산출물이 기획에게 보고되어 로드맵(Phase 1·2·3) 초안과 우선순위·예상 공수에 반영되었는가?

---

## 10. 실행 요청문

**다음 순서로 서브에이전트를 호출해 주세요.**

1. **Phase 1·2·3 병렬 호출**  
   - **Phase 1**: subagent_type=`core-designer`, 위 §7 Phase 1 전달 프롬프트 전문 전달.  
   - **Phase 2**: subagent_type=`core-publisher`, 위 §7 Phase 2 전달 프롬프트 전문 전달.  
   - **Phase 3**: subagent_type=`core-coder`, 위 §7 Phase 3 전달 프롬프트 전문 전달.  

2. 각 서브에이전트 **결과를 기획(core-planner)에게 보고**해 주시면, 기획이 취합하여 **ERP 리뉴얼 로드맵(Phase 1·2·3) 초안, 우선순위, 예상 공수(개략)** 를 포함한 최종 보고를 사용자에게 전달합니다.

---

## 11. ERP 리뉴얼 로드맵 초안 (역할별 산출물 취합 후)

### 역할별 산출물 참조

| 역할 | 산출물 | 경로 |
|------|--------|------|
| core-designer | 분개 폼·재무제표 디자인 스펙 | `docs/design-system/v2/ERP_JOURNAL_AND_STATEMENTS_DESIGN_SPEC.md` |
| core-publisher | 분개 입력 폼 HTML 마크업 | `docs/design-system/v2/ERP_JOURNAL_ENTRY_FORM_MARKUP.md` |
| core-coder | 구현 관점·수정 포인트·우선순위 | 본 문서 §11 로드맵에 반영 |

### 로드맵 Phase (초안)

| Phase | 목표 | 주요 작업 | 예상 공수(개략) |
|-------|------|-----------|-----------------|
| **Phase 1** | 입금확인→분개→원장 흐름 안정화 | 계정 매핑(ERP_ACCOUNT_TYPE) 점검·시딩, 테넌트 컨텍스트 검증, 전기 예외 로깅·모니터링 | 2~3일 |
| **Phase 2** | 차변/대변 수동 분개 입력·재무제표 시각화 | 디자이너/퍼블 산출물 기반 분개 폼 구현, 기존 createJournalEntry API 연동, 재무제표 탭·카드·테이블·차트 | 5~7일 |
| **Phase 3** | 자동 세팅·운영 효율화 | 계정 매핑 UI/API(ERP 설정 메뉴), 분개 템플릿(선택), 전기 실패 재시도/알림 | 3~5일 |

### 우선순위 요약

- **P0**: 계정 매핑 존재 여부(분개 미생성 방지), 테넌트 컨텍스트 → Phase 1 선행.
- **P1**: 차변/대변 폼 UI·API 연동, 재무제표 시각화 → Phase 2.
- **P2**: 계정 매핑 관리 화면, 전기 실패 처리 강화 → Phase 3.
- **P3**: 분개 템플릿·반복 분개(신규 테이블·API·스케줄러) → Phase 3 이후 검토.
