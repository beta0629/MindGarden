# React 자식 안전성 — 정적 스캔 인벤토리 (Phase 1)

**일자**: 2026-02-12  
**범위**: `frontend/src` (`*.js`, `*.jsx`)  
**방법**: ripgrep `{error}` / JSX 내 `.description`/`.message`/`.detail` 직접 출력 샘플

---

## 요약

| 구분 | 대략적 규모 | 비고 |
|------|-------------|------|
| `{error}` 또는 `error={error}` 로 **에러를 자식으로 넘기는 경로** | **약 95+ 매칭** (중복·prop 전달 포함) | `error` state가 **객체**(Axios/Response 본문)일 때 **#130 위험** |
| JSX에서 **`.description` / `.message` / `.detail`** 직접 렌더 | **약 35+ 매칭** (정적·샘플 데이터 포함) | API가 **객체형 description**이면 위험 (상황별) |
| `labels: ...map(... period)` 패턴 | **AdminDashboardV2 수정 후 추가 미발견** | 차트 레이블은 해당 파일 집중 |

---

## A. 에러 표시 — 우선 정리 권장 (허브)

한 번 고치면 하위 위젯이 **문자열 `error` prop**만 받도록 보장하기 쉬운 지점:

| 파일 | 내용 |
|------|------|
| `components/dashboard/widgets/BaseWidget.js` | `<p>{error}</p>` |
| `components/common/MGChart.js` | `<span className="mg-chart__error-detail">{error}</span>` |
| `components/admin/AdminDashboard/organisms/AdminMetricsVisualization.js` | `<p ...>{error}</p>` |

→ **`toErrorMessage(error)`** 유틸로 통일 권장 (Phase 2).

---

## B. `{error}` 직접 JSX (발췌 — 전체는 rg로 재현)

`EmotionDashboard.js`, `FinancialManagement.js`, `FinancialTransactionForm.js`, `PasswordResetModal.js`, `ClientSchedule.js`, `SmartNoteTab.js`, `ClientSessionManagement.js`, `ConsultationRecordView.js`, `HealingCard.js`, `ConsultantTransferHistory.js`, `ConsultantRecords.js`, `ConsultationReport.js`, `PurchaseRequestForm.js`, `BudgetManagement.js`, `TenantCommonCodeManagerUI.js`, `ComplianceDashboard.js`, `PgConfigurationList.js`, `FormInput.js`, `ConsultantClientList.js`, `DynamicDashboard.js`, …  
`IntegratedFinanceDashboard.js` (여러 `오류: {error}`), `OAuth2Callback.js`, `WidgetBasedAdminDashboard.js`, `StatisticsDashboard.js`, `ClientPaymentHistory.js`, `AdminApprovalDashboard.js`, `SuperAdminApprovalDashboard.js`, `ImprovedTaxManagement.js`, `SimpleHamburgerMenu.js`, `TodayStats.js`, `UserSettings.js`, `PgApprovalManagement.js`, `PaymentManagement.js`, `VacationModal.js`, `ConsultantAvailability.js`, `ErpListPage.js`, …

※ `error={error}` 만 하고 실제 렌더는 `BaseWidget` 인 경우 — **BaseWidget 수정 시 일괄 완화**.

---

## C. description / message 직접 렌더 (API 연동 가능성 높은 것)

- `ConsultationHistory.js` — `{consultation.description}`
- `ScheduleCard.js` — `{schedule.description}`
- `PurchaseManagement.js` / `BudgetManagement.js` — `{item.description}` / `{budget.description}`
- `ManagementGridWidget.js`, `StatisticsGridWidget.js`, `ErpManagementGridWidget.js` — 카드/액션 `description`
- `PgApprovalManagement.js` — `{testResult.message}`
- `SystemConfigManagement.js` — `{testResult.message}` 등
- `FormWidget.js` — `{submitResult.message}`
- `integration/test` 페이지 등은 샘플 데이터 — 우선순위 낮음

---

## D. 다음 Phase (core-coder 배치)

1. **배치 0**: `utils/safeDisplay.js` + **BaseWidget + MGChart + AdminMetricsVisualization** — **✅ 2026-02-12 적용됨**  
2. **배치 1**: ERP/재무 (`IntegratedFinanceDashboard`, `Purchase*`, `Budget*`)  
3. **배치 2**: 상담/히스토리 (`ConsultationHistory`, `ScheduleCard`)  
4. **배치 3**: 나머지 `{error}` 단일 파일 스윕

---

## E. API 숫자·KPI가 객체로 올 때 (관리자 대시보드 #130)

**증상**: `consultation-completion` 등 응답에서 `completionRate` / `completedCount` 가 **객체**이면  
JSX 패턴 `{row.completionRate}%` 처럼 **표현식만 자식으로 두면** React **#130** (object is not valid as a child).

**2026-03-21 대응 (소스)**:

| 파일 | 내용 |
|------|------|
| `utils/safeDisplay.js` | **`toSafeNumber(value, fallback)`** 추가 |
| `dashboard-v2/AdminDashboardV2.js` | `consultantIntegratedData` 병합 시 `toSafeNumber` 정규화; 통합 테이블 셀은 **템플릿 문자열**로만 출력 |
| `dashboard-v2/content/ContentKpiRow.js` | `label` / `value` / `badge` / `subtitle*` 에 **`toDisplayString` + `isValidElement`** 방어 |
| `ui/Schedule/ScheduleLegend.js` | `name` / `label` → `toDisplayString` |
| `ui/Schedule/ScheduleCalendarView.js` | 이벤트 표시명·휴가 제목 → `toDisplayString` |
| `common/Chart.js` | `data.labels[]` 를 차트 전 **`toDisplayString` 정규화** (객체 라벨 방지) |

**추가 점검 권장**: `rg '\{[a-zA-Z0-9_.]+\}%'` / `rg '\{[a-zA-Z0-9_.]+\}건'` 로 동일 패턴 수동 필터.

---

## 재현용 명령

```bash
rg '\{error\}' frontend/src --glob '*.js'
rg 'error=\{error\}' frontend/src --glob '*.js'
```

---

**작성**: explore + 정적 스캔 (런타임 미검증)
