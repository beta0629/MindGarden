# ERP 위젯화 계획 (고도화 전략 연계)

**작성일**: 2025-11-22  
**버전**: 1.0.0  
**목적**: ERP 고도화 전략에 맞춰 위젯화 계획 수립

**참고 문서**:
- `ERP_ADVANCEMENT_PLAN.md` - 전체 ERP 고도화 계획
- `ERP_CURRENT_STATUS_AND_ADVANCEMENT.md` - 현재 상태 분석 및 고도화 계획
- `ERP_PROCEDURE_BASED_ADVANCEMENT.md` - 프로시저 기반 ERP 고도화 계획
- `ERP_COMPONENTS_ANALYSIS.md` - ERP 컴포넌트 분석 및 위젯화 계획

---

## 📋 ERP 고도화 전략 요약

### Phase 1: 회계 관리 고도화 (4주)
- 분개 시스템 (Journal Entry)
- 원장 시스템 (Ledger)
- 재무제표 생성 (손익계산서, 재무상태표, 현금흐름표)
- 결산 처리

### Phase 2: 세무 관리 시스템 (3주)
- 부가세 계산 및 신고
- 전자세금계산서 발행
- 원천징수 관리
- 연말정산 처리

### Phase 3: 인사 관리 시스템 (4주)
- 직원 정보 관리
- 근태 관리
- 휴가 관리
- 급여 계산 및 지급

### Phase 4: 정산 관리 고도화 (3주)
- 업종별 정산 자동화
- 정산 규칙 엔진
- 정산 리포트 생성

### Phase 5: 리포트 및 분석 (2주)
- 재무 리포트 생성
- 예산 대비 실적 분석
- 현금흐름 분석
- 손익 분석

### Phase 6: 외부 시스템 연동 (3주)
- 회계 시스템 연동 (더존, 영림원)
- 세무 시스템 연동 (홈택스)
- 은행 연동 (계좌 조회, 자동 이체)

---

## 🎯 위젯화 전략 (고도화 전략 연계)

### 원칙
1. **고도화 전략과 동기화**: 고도화 단계별로 필요한 위젯 우선 구현
2. **프로시저 기반 연동**: PL/SQL 프로시저 호출을 지원하는 위젯 구조
3. **메타 시스템 활용**: `dashboard_config` JSON으로 위젯 구성 자동화
4. **공통 위젯 우선**: 여러 업종에서 사용 가능한 공통 위젯 먼저 구현

---

## 📊 위젯화 로드맵

### Phase 0: 기반 구축 (완료 ✅)
- ✅ 공통 유틸리티 함수 (`formatUtils.js`)
- ✅ 공통 위젯 (`ErpStatsGridWidget`, `ErpManagementGridWidget`)
- ✅ WidgetRegistry ERP 카테고리 추가

### Phase 1: 회계 관리 위젯 (4주)

#### Week 1-2: 분개 시스템 위젯
- [ ] **JournalEntryWidget** - 분개 목록 및 상세
  - 분개 목록 조회
  - 분개 생성/수정 폼
  - 차변/대변 검증 표시
  - 분개 승인 버튼
- [ ] **JournalEntryLineWidget** - 분개 상세 라인
  - 분개 라인 추가/수정/삭제
  - 계정과목 선택
  - 차변/대변 금액 입력
- [ ] **JournalEntryValidationWidget** - 분개 검증 결과
  - 차변/대변 합계 비교
  - 검증 오류 표시
  - 검증 성공/실패 상태

#### Week 3-4: 원장 및 재무제표 위젯
- [ ] **LedgerWidget** - 원장 조회
  - 계정별 원장 조회
  - 기간별 원장 조회
  - 잔액 계산 표시
- [ ] **IncomeStatementWidget** - 손익계산서
  - 손익계산서 표시
  - 기간 선택
  - 지점별 필터링
- [ ] **BalanceSheetWidget** - 재무상태표
  - 재무상태표 표시
  - 기준일 선택
  - 지점별 필터링
- [ ] **CashFlowStatementWidget** - 현금흐름표
  - 현금흐름표 표시
  - 기간 선택
  - 현금흐름 트렌드 차트

**API 연동**:
- `/api/erp/journal-entries` - 분개 CRUD
- `/api/erp/journal-entries/{id}/validate` - 분개 검증
- `/api/erp/journal-entries/{id}/approve` - 분개 승인
- `/api/erp/ledgers` - 원장 조회
- `/api/erp/financial-statements/income` - 손익계산서
- `/api/erp/financial-statements/balance` - 재무상태표
- `/api/erp/financial-statements/cashflow` - 현금흐름표

**프로시저 연동**:
- `CreateJournalEntry` - 분개 생성
- `ValidateJournalEntry` - 분개 검증
- `ApproveAndPostJournalEntry` - 분개 승인 및 전기
- `GetAccountLedger` - 원장 조회
- `GenerateIncomeStatement` - 손익계산서 생성
- `GenerateBalanceSheet` - 재무상태표 생성
- `GenerateCashFlowStatement` - 현금흐름표 생성

---

### Phase 2: 세무 관리 위젯 (3주)

#### Week 1: 부가세 관리 위젯
- [ ] **VatCalculationWidget** - 부가세 계산
  - 기간별 부가세 계산
  - 공급가액/부가세액 표시
  - 매입세액 표시
  - 납부세액 계산
- [ ] **VatReturnWidget** - 부가세 신고서
  - 부가세 신고서 표시
  - 신고서 생성/수정
  - 신고서 제출

#### Week 2: 전자세금계산서 위젯
- [ ] **TaxInvoiceWidget** - 전자세금계산서 목록
  - 세금계산서 목록 조회
  - 발행/수정/취소
  - 국세청 연동 상태
- [ ] **TaxInvoiceFormWidget** - 전자세금계산서 발행 폼
  - 세금계산서 정보 입력
  - 발행 처리
  - 발행 결과 확인

#### Week 3: 원천징수 및 연말정산 위젯
- [ ] **WithholdingTaxWidget** - 원천징수 관리
  - 원천징수 계산
  - 원천징수 영수증 발급
- [ ] **YearEndSettlementWidget** - 연말정산 처리
  - 연말정산 신고서 생성
  - 소득공제 계산
  - 신고서 제출

**API 연동**:
- `/api/erp/vat-returns` - 부가세 신고 CRUD
- `/api/erp/vat-returns/{id}/submit` - 부가세 신고 제출
- `/api/erp/tax-invoices` - 전자세금계산서 CRUD
- `/api/erp/tax-invoices/{id}/cancel` - 세금계산서 취소
- `/api/erp/withholding-tax` - 원천징수 조회
- `/api/erp/year-end-settlement` - 연말정산 처리

**프로시저 연동**:
- `CalculateVatForPeriod` - 부가세 계산
- `GenerateVatReturn` - 부가세 신고서 생성

---

### Phase 3: 인사 관리 위젯 (4주)

#### Week 1-2: 직원 및 근태 관리 위젯
- [ ] **EmployeeManagementWidget** - 직원 목록 및 관리
  - 직원 목록 조회
  - 직원 등록/수정/삭제
  - 직원 프로필 표시
- [ ] **AttendanceWidget** - 근태 기록
  - 출퇴근 기록
  - 근태 통계
  - 근무 시간 계산
- [ ] **AttendanceCalendarWidget** - 근태 캘린더
  - 월별 근태 현황
  - 출퇴근 시간 표시
  - 휴가/결근 표시

#### Week 3-4: 급여 관리 위젯
- [ ] **PayrollWidget** - 급여 목록 및 계산
  - 급여 목록 조회
  - 급여 계산
  - 급여 명세서 표시
- [ ] **PayrollCalculationWidget** - 급여 계산 상세
  - 기본급 계산
  - 수당 계산
  - 공제 계산
  - 실지급액 계산
- [ ] **PayrollPaymentWidget** - 급여 지급
  - 급여 지급 처리
  - 급여 지급 이력
  - 급여 조회 권한 관리

**API 연동**:
- `/api/erp/employees` - 직원 CRUD
- `/api/erp/attendance` - 근태 기록 CRUD
- `/api/erp/attendance/{employeeId}` - 직원별 근태 조회
- `/api/erp/payrolls` - 급여 CRUD
- `/api/erp/payrolls/{id}/pay` - 급여 지급

**프로시저 연동**:
- `RecordAttendance` - 근태 기록
- `GetAttendanceStatistics` - 근태 통계
- `ProcessIntegratedSalaryCalculation` - 급여 계산 (기존 확장)
- `ApproveSalaryWithErpSync` - 급여 승인 (기존)
- `ProcessSalaryPaymentWithErpSync` - 급여 지급 (기존)

---

### Phase 4: 정산 관리 위젯 (3주)

#### Week 1: 정산 규칙 위젯
- [ ] **SettlementRuleWidget** - 정산 규칙 관리
  - 정산 규칙 목록
  - 정산 규칙 생성/수정
  - 업종별 정산 규칙 설정
- [ ] **SettlementRuleEditorWidget** - 정산 규칙 편집기
  - 정산 비율 설정
  - 정산 주기 설정
  - 정산 조건 설정

#### Week 2: 정산 계산 위젯
- [ ] **SettlementCalculationWidget** - 정산 계산
  - 정산 자동 계산
  - 정산 결과 표시
  - 정산 검증
- [ ] **SettlementListWidget** - 정산 목록
  - 정산 목록 조회
  - 정산 상세 정보
  - 정산 상태 관리

#### Week 3: 정산 리포트 위젯
- [ ] **SettlementReportWidget** - 정산 리포트
  - 정산 내역 리포트
  - 정산 요약 리포트
  - 정산 승인 프로세스

**API 연동**:
- `/api/erp/settlement-rules` - 정산 규칙 CRUD
- `/api/erp/settlements/calculate` - 정산 계산
- `/api/erp/settlements` - 정산 목록 조회
- `/api/erp/settlements/{id}/approve` - 정산 승인
- `/api/erp/settlements/{id}/pay` - 정산 지급
- `/api/erp/settlements/reports` - 정산 리포트

**프로시저 연동**:
- `CalculateSettlement` - 정산 계산
- `CalculateAcademySettlement` - 학원 정산 계산
- `CalculateConsultationSettlement` - 상담소 정산 계산

---

### Phase 5: 리포트 및 분석 위젯 (2주)

#### Week 1: 재무 리포트 위젯
- [ ] **FinancialReportWidget** - 재무 리포트
  - 월별 재무 리포트
  - 연도별 재무 리포트
  - 비교 분석 리포트
- [ ] **BudgetVsActualWidget** - 예산 대비 실적
  - 예산 대비 실적 차이 분석
  - 예산 달성률 계산
  - 예산 대비 실적 차트

#### Week 2: 분석 대시보드 위젯
- [ ] **CashFlowAnalysisWidget** - 현금흐름 분석
  - 현금흐름표 생성
  - 현금흐름 트렌드 분석
  - 현금흐름 차트
- [ ] **ProfitLossAnalysisWidget** - 손익 분석
  - 손익 구조 분석
  - 손익 트렌드 분석
  - 손익 예측

**API 연동**:
- `/api/erp/financial-reports` - 재무 리포트 조회
- `/api/erp/budget-vs-actual` - 예산 대비 실적
- `/api/erp/cash-flow-analysis` - 현금흐름 분석
- `/api/erp/profit-loss-analysis` - 손익 분석

---

### Phase 6: 외부 시스템 연동 위젯 (3주)

#### Week 1: 회계 시스템 연동 위젯
- [ ] **AccountingSystemSyncWidget** - 회계 시스템 동기화
  - 더존 연동 상태
  - 영림원 연동 상태
  - 데이터 동기화 버튼
  - 동기화 이력

#### Week 2: 세무 시스템 연동 위젯
- [ ] **TaxSystemSyncWidget** - 세무 시스템 동기화
  - 홈택스 연동 상태
  - 세무 신고 자동화 설정
  - 신고 이력

#### Week 3: 은행 연동 위젯
- [ ] **BankAccountWidget** - 계좌 조회
  - 계좌 목록
  - 계좌 잔액 조회
  - 거래 내역 조회
- [ ] **BankTransferWidget** - 자동 이체
  - 급여 자동 이체 설정
  - 정산 자동 이체 설정
  - 이체 이력

**API 연동**:
- `/api/erp/accounting-systems/sync` - 회계 시스템 동기화
- `/api/erp/tax-systems/sync` - 세무 시스템 동기화
- `/api/erp/bank-accounts` - 계좌 조회
- `/api/erp/bank-transfers` - 자동 이체

---

## 🔧 공통 위젯 패턴

### 1. 프로시저 호출 위젯 패턴

```javascript
// ErpProcedureWidget.js (기본 패턴)
const ErpProcedureWidget = ({ widget, user }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const config = widget.config || {};
  const procedureName = config.procedureName;
  const inputParams = config.inputParams || {};
  
  const executeProcedure = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 프로시저 호출 API
      const response = await apiPost(`/api/erp/procedures/${procedureName}`, {
        inputParams,
        tenantId: user?.tenantId,
        branchId: user?.branchId
      });
      
      if (response && response.success) {
        setResult(response.data);
      } else {
        setError(response?.message || '프로시저 실행 실패');
      }
    } catch (err) {
      console.error('프로시저 실행 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // ... 렌더링 로직
};
```

### 2. 재무 데이터 표시 위젯 패턴

```javascript
// ErpFinancialDataWidget.js (기본 패턴)
const ErpFinancialDataWidget = ({ widget, user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const format = config.format || 'currency'; // currency, number, percent
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiGet(dataSource.url, dataSource.params || {});
      if (response) {
        setData(response);
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const formatValue = (value) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'number':
        return formatNumber(value);
      case 'percent':
        return formatPercent(value);
      default:
        return value;
    }
  };
  
  // ... 렌더링 로직
};
```

---

## 📝 위젯 사용 예시

### Phase 1: 회계 관리 대시보드

```json
{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "columns": 12
  },
  "widgets": [
    {
      "id": "journal-entry-list",
      "type": "journal-entry",
      "position": { "row": 0, "col": 0, "span": 12 },
      "config": {
        "title": "분개 목록",
        "dataSource": {
          "type": "api",
          "url": "/api/erp/journal-entries"
        },
        "actions": ["create", "edit", "delete", "approve"]
      }
    },
    {
      "id": "ledger-summary",
      "type": "ledger",
      "position": { "row": 1, "col": 0, "span": 6 },
      "config": {
        "title": "원장 요약",
        "dataSource": {
          "type": "api",
          "url": "/api/erp/ledgers/summary"
        }
      }
    },
    {
      "id": "income-statement",
      "type": "income-statement",
      "position": { "row": 1, "col": 6, "span": 6 },
      "config": {
        "title": "손익계산서",
        "dataSource": {
          "type": "api",
          "url": "/api/erp/financial-statements/income"
        },
        "period": "monthly"
      }
    }
  ]
}
```

---

## 🎯 우선순위

### P0 (필수 - 즉시 구현)
1. **Phase 1 위젯** (회계 관리)
   - JournalEntryWidget
   - LedgerWidget
   - IncomeStatementWidget
   - BalanceSheetWidget

### P1 (중요 - 빠른 확장)
1. **Phase 2 위젯** (세무 관리)
   - VatCalculationWidget
   - VatReturnWidget
2. **Phase 4 위젯** (정산 관리)
   - SettlementCalculationWidget
   - SettlementReportWidget

### P2 (선택 - 장기)
1. **Phase 3 위젯** (인사 관리)
2. **Phase 5 위젯** (리포트 및 분석)
3. **Phase 6 위젯** (외부 시스템 연동)

---

## 📊 진행 상황

- ✅ Phase 0: 기반 구축 완료
- ⏳ Phase 1: 회계 관리 위젯 (진행 예정)
- ⏳ Phase 2: 세무 관리 위젯 (대기 중)
- ⏳ Phase 3: 인사 관리 위젯 (대기 중)
- ⏳ Phase 4: 정산 관리 위젯 (대기 중)
- ⏳ Phase 5: 리포트 및 분석 위젯 (대기 중)
- ⏳ Phase 6: 외부 시스템 연동 위젯 (대기 중)

---

**마지막 업데이트**: 2025-11-22  
**다음 리뷰 예정일**: Phase 1 완료 후

