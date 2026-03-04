# ERP 시스템 전체 점검 기획서

**작성일**: 2026-03-04  
**목적**: ERP 전반(구매/재무/대차대조표/손익계산서/예산/급여/세금/환불/원장 등) 및 PL/SQL 구조·자동화 시스템을 점검하여 **"전부 자동화되어야 한다"**는 요구에 맞는 범위·단계·산출물을 정리한다.  
**제약**: 기획만 수행하며, 실제 코드 분석·수정은 하지 않음. 실행은 explore / core-coder / core-tester 등 서브에이전트에 위임.

---

## 1. 목표·범위

### 1.1 목표 (1~2문장)

- ERP 기능·백엔드·프론트·PL/SQL·자동화 현황을 체계적으로 파악하고, PL/SQL 구조 정리/표준화 및 **전 구간 자동화** 갭을 분석하여 구현 계획을 수립한다.
- 점검 결과를 바탕으로 explore → (필요 시 core-coder/core-tester)가 실행할 수 있는 **실행 요청문(프롬프트)**을 문서에 포함한다.

### 1.2 범위

| 구분 | 포함 | 제외 |
|------|------|------|
| **기능** | 구매·재무·대차대조표·손익계산서·예산·급여·세금·환불·원장(분개/원장)·정산·ERP 대시보드·통합 재무·HQ 지점 재무 | ERP와 무관한 일반 상담/회기/결제(ERP 미연동 부분) |
| **백엔드** | ERP 전용·공용 컨트롤러·서비스·엔티티·Repository, PL/SQL 호출부, 스케줄러·배치 | 비 ERP 도메인(예: 인증·대시보드 위젯만) |
| **프론트** | ERP 라우트·메뉴·컴포넌트(구매/재무/예산/세금/환불/급여/원장 등) | 비 ERP 화면 |
| **PL/SQL** | 저장 프로시저·함수·패키지, 재무/집계/원장/정산 관련 SP, Java 호출 위치 | DB 스키마 마이그레이션만(프로시저 미호출) |
| **자동화** | 스케줄러·배치·cron·이벤트 기반 처리·수동 트리거 여부, "전부 자동화" 시 추가 대상 | 수동 운영 절차 문서만 |

### 1.3 영향 영역

- **화면**: `/erp/*`, `/admin/erp/*` 라우트, LNB ERP 메뉴, AdminDashboard ERP 카드, ERP 위젯.
- **API**: `/api/v1/erp/**`, `/api/v1/hq/erp/**`, `/api/v1/erp/accounting/**`.
- **DB**: `financial_*`, `accounting_*`, 구매/예산/급여/정산 관련 테이블, 프로시저/함수/이벤트.
- **역할**: ADMIN, 슈퍼관리자, 상담사(구매 요청자), 본사(HQ) 재무 조회 등.

---

## 2. 점검 범위 상세 정의

### 2.1 현재 ERP 기능 목록 (점검 시 채울 항목)

아래 표는 **Phase 1(현황 분석)** 에서 explore/core-coder가 채우는 **체크리스트 초안**이다.

| 기능 영역 | 설명 | 백엔드(컨트롤러/서비스) | 프론트(라우트/컴포넌트) | PL/SQL 연동 | 자동화 여부 |
|-----------|------|-------------------------|--------------------------|-------------|-------------|
| 구매 관리 | 구매 요청·승인·아이템 | ErpController, ErpServiceImpl 등 | /erp/purchase, PurchaseManagement | (있으면 기입) | 수동/자동 |
| 재무 관리 | 거래·대시보드·리포트 | ErpController finance/*, FinancialStatementController | /erp/financial, IntegratedFinanceDashboard | (있으면 기입) | 수동/자동 |
| 대차대조표 | 재무상태표 | FinancialStatementController | (라우트/컴포넌트) | (SP 있으면 기입) | 수동/자동 |
| 손익계산서 | 손익계산서 | FinancialStatementController | (라우트/컴포넌트) | (SP 있으면 기입) | 수동/자동 |
| 예산 | 예산 관리 | ErpController budgets | /erp/budget, BudgetManagement | (있으면 기입) | 수동/자동 |
| 급여 | 급여 계산·배치 | SalaryBatchService, SalaryScheduleService | /erp/salary, SalaryManagement | (있으면 기입) | 수동/자동 |
| 세금 | 세무 관리 | (컨트롤러 확인) | /erp/tax, ImprovedTaxManagement | (있으면 기입) | 수동/자동 |
| 환불 | 환불·할인 환불 | (서비스 확인), Process*Refund 프로시저 | /erp/refund-management, RefundManagement | ApplyDiscountAccounting, Process*Refund | 수동/자동 |
| 원장/분개 | 분개·원장·잔액 | AccountingController, LedgerController | (라우트/컴포넌트) | (있으면 기입) | 수동/자동 |
| 정산 | 정산 규칙·계산·승인 | SettlementController | (라우트/컴포넌트) | (있으면 기입) | 수동/자동 |
| HQ/지점 재무 | 본사·지점 통합 재무 | HQErpController | (라우트/컴포넌트) | (있으면 기입) | 수동/자동 |

- **ERP 전용 vs 공용**: 컨트롤러·서비스·Repository 중 `erp` 패키지 또는 `*Erp*`, `*Financial*`, `*Accounting*`, `*Settlement*`, `*Ledger*` 등으로 구분되는지, 공용 유틸(예: TenantContextHolder)만 쓰는지 구분하여 기입.

### 2.2 백엔드 점검 항목

- **컨트롤러**: ErpController, AccountingController, LedgerController, FinancialStatementController, SettlementController, HQErpController 등 ERP 관련 컨트롤러 목록·엔드포인트·tenantId 사용 여부.
- **서비스**: ErpServiceImpl, FinancialStatementServiceImpl, 정산·급여·환불 관련 서비스, PL/SQL 호출 서비스(PlSql*ServiceImpl 등).
- **엔티티·Repository**: FinancialTransaction, JournalEntry, Ledger 등 ERP/재무/원장 엔티티 및 해당 Repository, ERP 전용 vs 공용 구분.
- **참조 문서**: `docs/planning/ERP_SECTION_AUDIT_AND_PLANNING.md` (테넌트·API 목록), `docs/project-management/archive/2025-docs-root-moved/erp-procedure-integration-check.md`, `docs/project-management/archive/2025-11-22/PLSQL_ERP_INTEGRATION_STATUS.md`.

### 2.3 프론트엔드 점검 항목

- **라우트**: App.js 기준 `/erp/*`, `/admin/erp/*` 전체 목록 및 매핑 컴포넌트.
- **메뉴**: menuItems/ERP_MENU_ITEMS, LNB ERP 관리 하위 메뉴, AdminDashboard ERP 카드·위젯(ErpManagementGridWidget, ErpStatsGridWidget 등) 진입 경로.
- **컴포넌트**: PurchaseManagement, FinancialManagement, BudgetManagement, ImprovedTaxManagement, RefundManagement, IntegratedFinanceDashboard, SalaryManagement, 원장/분개/정산 화면 등.

### 2.4 PL/SQL 점검 항목

- **저장 프로시저·함수·패키지**: 재무 집계, 원장 정산, 보고서 생성, 할인/환불(ApplyDiscountAccounting, ProcessDiscountRefund, ProcessPartialRefund, ProcessRefundWithSessionAdjustment), 온보딩(ProcessOnboardingApproval), 매칭(UpdateMappingInfo) 등 **목록 및 용도**.
- **Java 호출 위치**: JdbcTemplate, @Procedure, MyBatis, SimpleJdbcCall 등 **호출 방식** 및 파일/메서드명.
- **트랜잭션·에러 처리·로깅**: SP 내부 커밋/롤백, Java 쪽 트랜잭션 경계, 예외 처리·로깅 방식.
- **표준화**: 네이밍 규칙, IN/OUT 파라미터 패턴, 반환 형식(성공/실패 코드 등) 일관성.

### 2.5 자동화 점검 항목

- **현재 자동 실행**: Spring @Scheduled, Quartz, DB job, MySQL Event Scheduler, 외부 cron 등 **구현체별 목록** (예: StatisticsSchedulerServiceImpl 일일 통계, SchemaChangeDetectionScheduler, MetricCollectionService, SalaryBatchService 호출 방식).
- **수동만 존재하는 작업**: 정기 집계(일/주/월 마감), 원장 동기화, 재무제표 생성, 정산 배치, 급여 배치 등이 **수동 트리거만 있는지** 여부.
- **"전부 자동화" 시 추가 대상**: 위 수동 작업 중 자동화할 후보 목록(우선순위·주기·트리거 조건).

---

## 3. PL/SQL 구조 점검 항목 (상세)

| 항목 | 내용 | Phase에서 채울 산출물 |
|------|------|------------------------|
| SP/함수 목록 및 용도 | 재무 집계, 원장 정산, 보고서 생성, 할인/환불/온보딩/매칭 등 | SP명·스키마·용도·호출처 표 |
| Java 호출 방식 | JdbcTemplate / @Procedure / MyBatis / SimpleJdbcCall 등 | 호출 방식별 파일·메서드 목록 |
| 트랜잭션·에러·로깅 | SP 내부 commit/rollback, Java @Transactional, 예외·로그 | 트랜잭션 경계·에러 처리 요약 |
| 표준화 여부 | 네이밍, IN/OUT 파라미터, 반환 형식 | 표준 준수/미준수 목록·개선 제안 |

---

## 4. 자동화 점검 항목 (상세)

| 항목 | 내용 | Phase에서 채울 산출물 |
|------|------|------------------------|
| 자동 vs 수동 구분 | 현재 자동 실행되는 작업 vs 수동만 있는 작업 | 작업별 자동/수동 표 |
| 정기 집계·원장·재무제표 | 일/주/월 마감, 원장 동기화, 재무제표 생성이 자동인지 | 자동 여부·주기·담당 구현체 |
| 스케줄러 구현체 | @Scheduled, Quartz, DB job, MySQL Event, 외부 cron | 구현체별 목록·cron/설정 |
| "전부 자동화" 갭 | 수동만 있는 작업 중 자동화 대상·우선순위 | 갭 목록·구현 계획 초안 |

---

## 5. ERP 전체 점검 체크리스트

### 5.1 기능·백엔드·프론트

- [ ] **기능 목록**: 구매/재무/대차대조표/손익계산서/예산/급여/세금/환불/원장/정산/HQ 재무가 표에 모두 기입되었는가?
- [ ] **백엔드**: ERP 관련 컨트롤러·서비스·엔티티·Repository 목록이 정리되었는가? ERP 전용 vs 공용 구분이 되어 있는가?
- [ ] **프론트**: ERP 라우트·LNB 메뉴·컴포넌트·위젯 진입점이 정리되었는가?
- [ ] **테넌트**: ERP API·서비스에서 tenantId 필수 사용 여부가 점검되었는가? (기존 ERP_SECTION_AUDIT_AND_PLANNING.md 참고)

### 5.2 PL/SQL

- [ ] **SP/함수 목록**: 재무/집계/원장/정산/보고서/할인/환불/온보딩/매칭 관련 프로시저·함수가 모두 나열되었는가?
- [ ] **호출 위치**: Java에서 각 SP 호출 방식을 포함한 호출 위치가 문서화되었는가?
- [ ] **트랜잭션·에러·로깅**: SP·Java 양쪽 트랜잭션 경계와 에러 처리·로깅이 요약되었는가?
- [ ] **표준화**: 네이밍·파라미터·반환 형식의 표준 준수 여부가 정리되었는가?

### 5.3 자동화

- [ ] **자동 실행 목록**: @Scheduled, Quartz, DB job, Event, cron 등 자동 실행 작업이 모두 나열되었는가?
- [ ] **수동만 있는 작업**: 정기 마감·원장 동기화·재무제표 생성·정산·급여 등 수동만 있는 작업이 구분되었는가?
- [ ] **갭 분석**: "전부 자동화" 요구 대비 추가 자동화 대상이 우선순위와 함께 정리되었는가?

---

## 6. Phase 구분 및 담당·목표

### Phase 1: 현황 분석

| 항목 | 내용 |
|------|------|
| **담당** | **explore** (주 담당), 필요 시 **core-coder** (코드 위치 확인) |
| **목표** | ERP 기능·백엔드·프론트·PL/SQL·자동화 현황을 수집하여 본 문서 §2.1 표 및 §2.2~2.5 항목을 채우고, 체크리스트 §5를 기준으로 현황 보고서 초안을 작성한다. |
| **산출물** | `docs/project-management/ERP_AUDIT_CURRENT_STATE.md` (기능 목록·컨트롤러/서비스/라우트/컴포넌트·PL/SQL 목록·자동/수동 작업 목록). |
| **완료 기준** | §2.1 표가 채워졌고, §5.1~5.3 체크리스트 항목에 대한 "현황"이 문서에 반영되어 있다. |

### Phase 2: PL/SQL 구조 정리/표준화

| 항목 | 내용 |
|------|------|
| **담당** | **explore** (상세 목록·호출 위치 정리), **core-coder** (표준화 적용·리팩터링) |
| **목표** | Phase 1 산출물을 바탕으로 PL/SQL SP/함수 목록·용도·Java 호출 방식·트랜잭션·에러·로깅·표준화 갭을 정리하고, 표준화 계획(네이밍·파라미터·반환 형식)을 수립한다. 필요 시 core-coder가 표준화 작업을 수행한다. |
| **산출물** | `docs/project-management/ERP_PLSQL_STRUCTURE_AND_STANDARDIZATION.md` (목록·호출 맵·표준화 규칙·미준수 목록·개선 계획). |
| **완료 기준** | 모든 ERP 관련 SP/함수와 Java 호출부가 매핑되었고, 표준화 규칙과 갭·개선 계획이 문서에 명시되어 있다. |

### Phase 3: 자동화 갭 분석 및 구현 계획

| 항목 | 내용 |
|------|------|
| **담당** | **explore** (갭 정리), **core-coder** (자동화 구현), **core-tester** (배치/스케줄 검증) |
| **목표** | "전부 자동화" 요구에 따라 현재 수동만 있는 작업을 파악하고, 자동화 대상·우선순위·구현체(스케줄러/배치)·트리거 조건을 정리한 뒤 구현 계획을 수립한다. |
| **산출물** | `docs/project-management/ERP_AUTOMATION_GAP_AND_PLAN.md` (자동/수동 목록·갭·우선순위·구현 계획·스케줄 설계). |
| **완료 기준** | 자동화 갭 목록과 우선순위가 확정되었고, Phase별 구현 계획과 서브에이전트 실행 요청문이 포함되어 있다. |

---

## 7. 리스크·제약

- **기존 코드·DB**: PL/SQL 변경 시 기존 호출부·트랜잭션 경계와의 호환성 유지 필요. ERP API는 이미 `/api/v1/erp` 등으로 노출되어 있으므로 경로 변경 없음.
- **멀티테넌트**: 모든 ERP·재무·원장·배치에서 tenantId 필수. 스케줄러/배치는 테넌트별 또는 전 테넌트 순회 시 TenantContext 설정 필요.
- **성능**: 정기 집계·재무제표·원장 동기화를 자동화할 경우 실행 시점·부하 분산 검토 필요.
- **실행 주체**: 기획만 수행하며, 실제 코드 분석·수정·테스트는 explore / core-coder / core-tester에 위임한다.

---

## 8. 단계별 완료 기준·체크리스트

| Phase | 완료 기준 | 체크리스트 |
|-------|-----------|------------|
| **Phase 1** | 현황 문서가 산출되고 본 문서 §2·§5 항목이 채워짐 | §5.1~5.3 모든 항목에 대해 "현황"이 기록됨 |
| **Phase 2** | PL/SQL 목록·호출 맵·표준화 규칙·갭·개선 계획이 문서화됨 | SP/함수–Java 호출부 매핑 완료, 표준화 미준수 목록·계획 존재 |
| **Phase 3** | 자동화 갭·우선순위·구현 계획이 문서화됨 | 자동/수동 목록 확정, 추가 자동화 대상·스케줄 설계 반영 |

---

## 9. 실행 요청문 (서브에이전트 호출용 프롬프트)

아래는 부모 에이전트 또는 사용자가 **mcp_task(또는 해당 메커니즘)**로 서브에이전트를 호출할 때 전달할 **실행 요청문(프롬프트)** 초안이다. 호출 시 문서 경로·브랜치 등은 상황에 맞게 보완한다.

---

### 9.1 Phase 1: explore — 현황 분석

**서브에이전트**: `explore`  
**호출 시 전달할 프롬프트 초안**:

```
다음 기획 문서에 따라 ERP 시스템 전체 현황을 분석해 주세요.

참조 문서: docs/project-management/ERP_COMPREHENSIVE_AUDIT_PLAN.md

수행 내용:
1) ERP 기능 목록 채우기
   - 구매/재무/대차대조표/손익계산서/예산/급여/세금/환불/원장/정산/HQ 재무에 대해, 백엔드(컨트롤러·서비스)·프론트(라우트·컴포넌트)·PL/SQL 연동 여부·자동화 여부를 코드베이스에서 검색해 표로 정리합니다.
   - 백엔드: ErpController, AccountingController, LedgerController, FinancialStatementController, SettlementController, HQErpController 및 관련 Service/Repository/Entity를 검색해 ERP 전용 vs 공용을 구분해 나열합니다.
   - 프론트: App.js의 /erp/*, /admin/erp/* 라우트, ERP 메뉴(menuItems/ERP_MENU_ITEMS), ERP 관련 컴포넌트(구매/재무/예산/세금/환불/급여/원장/정산)를 검색해 목록화합니다.

2) PL/SQL 현황
   - database/schema, procedures_standardized, Flyway 마이그레이션 등에서 ERP/재무/원장/정산/할인/환불 관련 저장 프로시저·함수·패키지를 검색해 목록과 용도를 정리합니다.
   - Java에서 JdbcTemplate, @Procedure, SimpleJdbcCall, MyBatis 등으로 프로시저를 호출하는 위치를 검색해 SP별 호출 위치(클래스·메서드)를 매핑합니다.

3) 자동화 현황
   - @Scheduled, Quartz, Scheduler, cron, MySQL Event, batch 관련 클래스·리소스를 검색해 "자동 실행되는 작업" 목록을 만듭니다.
   - 재무 집계(일/주/월), 원장 동기화, 재무제표 생성, 정산, 급여 배치 등이 자동인지 수동인지 구분해 표로 정리합니다.

산출물: docs/project-management/ERP_AUDIT_CURRENT_STATE.md 에 위 내용을 반영한 현황 보고서를 작성합니다. 기획서의 §2.1 표와 §5.1~5.3 체크리스트를 채우는 형태로 작성해 주세요. 코드 수정은 하지 않습니다.
```

---

### 9.2 Phase 2: explore → core-coder — PL/SQL 구조 정리/표준화

**2-1. explore (PL/SQL 상세 정리)**  
**호출 시 전달할 프롬프트 초안**:

```
docs/project-management/ERP_COMPREHENSIVE_AUDIT_PLAN.md Phase 2를 참조해 주세요.

Phase 1 산출물(docs/project-management/ERP_AUDIT_CURRENT_STATE.md)을 기준으로, PL/SQL 구조 점검을 상세화해 주세요.

수행 내용:
- ERP 관련 모든 저장 프로시저·함수의 네이밍, IN/OUT 파라미터 패턴, 반환 형식(성공/실패 코드 등)을 검색해 표로 정리합니다.
- Java 호출부의 트랜잭션(@Transactional), 에러 처리, 로깅 방식을 각 호출 위치별로 요약합니다.
- 표준화 관점: 네이밍 규칙 일관성, 파라미터 순서(tenantId 등), 반환 형식 통일 여부를 평가해 "표준 준수/미준수" 목록을 만듭니다.

산출물: docs/project-management/ERP_PLSQL_STRUCTURE_AND_STANDARDIZATION.md 에 SP/함수 목록·Java 호출 맵·트랜잭션/에러 요약·표준화 갭 및 개선 제안을 반영합니다. 코드 수정은 하지 않습니다.
```

**2-2. core-coder (표준화 적용 — Phase 2 결과 반영 후)**  
**호출 시 전달할 프롬프트 초안**:

```
docs/project-management/ERP_PLSQL_STRUCTURE_AND_STANDARDIZATION.md 에 정리된 "표준화 개선 계획"을 구현해 주세요.

참조: /core-solution-backend, /core-solution-database-first. tenantId는 모든 레이어에서 필수입니다(/core-solution-multi-tenant).

작업 범위는 문서에 명시된 SP·Java 호출부만 대상으로 하며, 네이밍·파라미터·반환 형식 표준에 맞게 수정합니다. 트랜잭션 경계와 기존 동작을 깨지 않도록 합니다.
```

---

### 9.3 Phase 3: explore → core-coder / core-tester — 자동화 갭 및 구현 계획

**3-1. explore (자동화 갭 정리)**  
**호출 시 전달할 프롬프트 초안**:

```
docs/project-management/ERP_COMPREHENSIVE_AUDIT_PLAN.md Phase 3를 참조해 주세요.

Phase 1 산출물(ERP_AUDIT_CURRENT_STATE.md)의 자동화 현황을 바탕으로 "전부 자동화" 요구에 따른 갭을 정리해 주세요.

수행 내용:
- 현재 "수동만 있는" 작업을 모두 나열합니다(정기 일/주/월 마감, 원장 동기화, 재무제표 생성, 정산 배치, 급여 배치 등).
- 각 수동 작업에 대해 자동화 시 권장 주기(cron 표현), 트리거 조건, 구현체(@Scheduled vs Quartz vs DB job 등) 제안을 표로 작성합니다.
- 우선순위(높음/중간/낮음)와 Phase별 구현 순서를 제안합니다.

산출물: docs/project-management/ERP_AUTOMATION_GAP_AND_PLAN.md 에 자동/수동 목록·갭·우선순위·구현 계획·스케줄 설계를 반영합니다. 코드 수정은 하지 않습니다.
```

**3-2. core-coder (자동화 구현 — 계획 확정 후)**  
**호출 시 전달할 프롬프트 초안**:

```
docs/project-management/ERP_AUTOMATION_GAP_AND_PLAN.md 에 확정된 구현 계획에 따라, 명시된 우선순위 순으로 자동화를 구현해 주세요.

참조: /core-solution-backend, /core-solution-multi-tenant. 스케줄러/배치 실행 시 테넌트 컨텍스트 설정을 잊지 마세요. 기존 StatisticsSchedulerServiceImpl, SchemaChangeDetectionScheduler, SalaryBatchService 등 패턴을 참고합니다.

구현 시 실행 주기(cron), 실패 시 로깅·알림, 트랜잭션 경계를 문서에 맞게 반영합니다.
```

**3-3. core-tester (자동화·배치 검증)**  
**호출 시 전달할 프롬프트 초안**:

```
docs/project-management/ERP_AUTOMATION_GAP_AND_PLAN.md 및 새로 추가된 스케줄러/배치 코드를 기준으로 테스트를 작성·실행해 주세요.

참조: /core-solution-testing.

대상: ERP 자동화 작업(정기 집계·원장 동기화·재무제표 생성·정산·급여 배치 등)에 대한 단위·통합 테스트. 스케줄러/배치가 조건에 맞게 실행되는지, tenantId가 올바르게 설정되는지 검증하는 시나리오를 포함합니다. E2E는 필요 시 시나리오만 문서화해도 됩니다.
```

---

## 10. 실행 순서 요약

다음 순서로 서브에이전트를 호출해 주세요.

1. **Phase 1**: **explore** — 위 §9.1 프롬프트로 ERP 현황 분석 → `ERP_AUDIT_CURRENT_STATE.md` 산출.
2. **Phase 2**:  
   - **explore** — §9.2(2-1) 프롬프트로 PL/SQL 상세·표준화 갭 정리 → `ERP_PLSQL_STRUCTURE_AND_STANDARDIZATION.md` 산출.  
   - (문서 확정 후) **core-coder** — §9.2(2-2) 프롬프트로 PL/SQL 표준화 구현.
3. **Phase 3**:  
   - **explore** — §9.3(3-1) 프롬프트로 자동화 갭·구현 계획 정리 → `ERP_AUTOMATION_GAP_AND_PLAN.md` 산출.  
   - (계획 확정 후) **core-coder** — §9.3(3-2) 프롬프트로 자동화 구현.  
   - **core-tester** — §9.3(3-3) 프롬프트로 자동화·배치 검증 테스트 작성·실행.

---

**문서 끝.** 기획만 수행했으며, 실제 코드 분석·수정은 위 Phase별 서브에이전트 실행으로 진행한다.
