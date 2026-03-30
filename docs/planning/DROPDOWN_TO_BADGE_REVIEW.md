# 드롭다운 → 배지 전환 검토 보고서

**작성일**: 2026-03-05  
**목적**: 드롭다운 문제 대안으로 배지(chip) 도입 검토 — "전체 다 바꾸는 게 어떨까"에 대한 기획적 결론 및 권장안  
**참조**: `docs/debug/PAYMENT_METHOD_DROPDOWN_REPORT.md`, `docs/debug/RESPONSIBILITY_DROPDOWN_AND_SCROLL_REPORT.md`

---

## 1. 현재 드롭다운 사용처 파악

### 1.1 유형별 정리

| 유형 | 컴포넌트 | 단일/다중 | 옵션 수 | 사용처 예시 |
|------|-----------|-----------|---------|-------------|
| **결제 방법** | CustomSelect | 단일 | 소수(3~5) | PaymentConfirmationModal, DiscountPaymentConfirmationModal, MappingCreationModal, MappingPaymentModal |
| **담당 업무** | CustomSelect | 단일 | 소수(공통코드) | MappingCreationModal |
| **상담사 선택** | CustomSelect | 단일 | **다수** 가능 | MatchQueueRow, ConsultantTransferModal, ScheduleList, ScheduleModal, TimeSelectionModal |
| **역할/권한** | CustomSelect | 단일 | 소수(4개 내외) | UserManagement |
| **공통코드 기반** | CustomSelect | 단일 | 소수~중간 | 결제 방법, 담당업무, 휴가 유형, 세션 확장 사유, 메시지 필터 등 |
| **일정/시간** | CustomSelect | 단일 | 소수~중간 | ScheduleModal, TimeSelectionModal, ScheduleCalendarHeader |
| **메시지 필터** | CustomSelect | 단일 | 소수 | ConsultantMessages, AdminMessages, MessageSendModal |
| **ERP·재무** | CustomSelect | 단일 | 소수~다수 | SalaryConfigModal, SalaryProfileFormModal, ErpReportModal, ItemManagement, FinancialTransactionForm, RecurringExpenseModal |
| **클라이언트/매핑** | CustomSelect | 단일 | 다수 가능 | ClientModal, SessionExtensionModal, MappingCreationModal(패키지 등) |
| **전문 분야/특기** | CustomSelect / native select | 단일 | 소수 | SpecialtyManagementModal, ConsultationLogModal, ConsultantRegistrationWidget(전문 분야) |
| **네이티브 select** | `<select>` | 단일 | 가변 | SalaryManagement(상담사·기간), TaxManagement, SessionManagement, PermissionManagement, WidgetBasedAdminDashboard, MappingFilters, PaymentTest 등 |
| **다중 선택** | MultiSelectCheckbox | 다중 | 가변 | 전용 드롭다운 UI(체크박스 목록) |

### 1.2 CustomSelect 사용 파일 목록(요약)

- **어드민·결제·매핑**: PaymentConfirmationModal, DiscountPaymentConfirmationModal, MappingCreationModal, MappingPaymentModal, ConsultantTransferModal, MatchQueueRow, VacationManagementModal, UserManagement, ClientModal(ClientComprehensiveManagement), SessionExtensionModal
- **상담사·스케줄**: ScheduleList, ScheduleModal, TimeSelectionModal, ScheduleCalendarHeader, SessionModals
- **메시지**: ConsultantMessages, AdminMessages, MessageSendModal
- **상담 로그·특기**: ConsultationLogModal, SpecialtyManagementModal, ConsultantVacationModal
- **ERP·재무**: SalaryConfigModal, ErpReportModal, SalaryProfileFormModal, ItemManagement, FinancialTransactionForm, RecurringExpenseModal
- **기타**: PerformanceMetricsModal

### 1.3 옵션 수 구분 기준

| 구분 | 기준 | 배지 적합성 |
|------|------|-------------|
| **소수** | 보통 2~7개 (결제 방법, 담당업무, 역할, 휴가 유형 등) | 배지 적합 |
| **중간** | 8~15개 (일부 공통코드, 시간대 등) | 배지 가능(한 줄·두 줄 그리드) |
| **다수** | 16개 이상 (상담사 목록, 클라이언트 목록 등) | 드롭다운 유지 권장 |

---

## 2. 드롭다운 vs 배지 비교

### 2.1 드롭다운

| 장점 | 단점 |
|------|------|
| 옵션이 많을 때 공간 절약 | 모달·스크롤 컨텍스트에서 z-index·포지션 이슈(현재 문제) |
| 단일/다중 선택 모두 구현 가능 | 터치 시 열기/닫기·스크롤과 겹치는 UX 이슈 |
| 기존 패턴 익숙함 | 포커스·접근성 처리 복잡 |

### 2.2 배지(칩)

| 장점 | 단점 |
|------|------|
| 옵션을 평면 배치 — 한눈에 보임 | 옵션 많을 때 공간·스크롤/그리드 필요 |
| 클릭으로 선택·해제 단순 | 다중 선택 시 "선택된 배지들" 영역 설계 필요 |
| 터치 친화적, 오버레이 없음 | 목록이 매우 길면 비효율 |
| 모달 내부에서 z-index 이슈 없음 | — |

### 2.3 화면/필드별 적합성 제안

| 조건 | 권장 UI | 비고 |
|------|----------|------|
| **옵션 소수(2~7) + 단일 선택** | **배지** | 결제 방법, 담당 업무, 역할, 휴가 유형 등 |
| **옵션 소수 + 모달 내부** | **배지 우선** | 현재 드롭다운 문제가 집중된 영역 |
| **옵션 중간(8~15) + 단일 선택** | 배지(그리드/줄바꿈) 또는 드롭다운 | 공간·가독성에 따라 결정 |
| **옵션 다수(16개 이상)** | **드롭다운 유지** | 상담사/클라이언트 목록 등 |
| **다중 선택** | MultiSelectCheckbox 유지 또는 배지 그룹 | "선택된 항목" 표시 방식 설계 필요 |

---

## 3. 전체 교체 시 고려사항

### 3.1 전체를 배지로 통일할 경우

- **일관성**: 단일 선택·소수 옵션 구간은 UX 일관성 확보에 유리.
- **접근성**: 배지도 키보드 포커스·aria 역할·스크린리더 대응 필요 (공통 컴포넌트로 규격화).
- **반응형**: 배지 그리드/줄바꿈으로 좁은 화면 대응 가능.
- **옵션 수가 많은 경우**: 스크롤 영역·그리드(2열 등)로 캡하고, "옵션 10개 초과 시 드롭다운 유지" 같은 규칙으로 예외 두는 편이 안전.

### 3.2 부분 적용(공통코드 기반·단일 선택 위주)

**우선 적용 후보(배지 전환)**

1. **결제 방법** — PaymentConfirmationModal, DiscountPaymentConfirmationModal, MappingCreationModal, MappingPaymentModal  
   → 옵션 소수, 모달 내 사용, 현재 문제 보고 다수.
2. **담당 업무** — MappingCreationModal  
   → 동일 모달 내, 옵션 소수.
3. **역할/권한** — UserManagement (소수 옵션).
4. **휴가 유형·세션 확장 사유 등** — VacationManagementModal, SessionExtensionModal 등 공통코드 소수 옵션 단일 선택.

**유지 권장(드롭다운 또는 네이티브 select)**

- 상담사/클라이언트 선택(옵션 다수).
- ERP·재무 중 항목 수 많은 선택.
- MultiSelectCheckbox 사용처(다중 선택).
- 테스트/내부용 네이티브 select(우선순위 낮음).

### 3.3 마이그레이션 단계 제안

| 단계 | 범위 | 목표 |
|------|------|------|
| **1단계** | 결제 방법·담당 업무 등 **문제 되던 모달 내 선택만** 배지로 전환 | 드롭다운 z-index·스크롤 이슈 회피, 사용성 개선 |
| **2단계** | **공통코드 기반 단일 선택** 중 옵션 소수(예: 7개 이하)인 필드 전면 배지 | 일관성 확대, 디자인 시스템에 "단일 선택 배지" 패턴 정립 |
| **3단계** | (선택) 역할·휴가 유형·메시지 필터 등 나머지 소수 옵션 단일 선택을 배지로 확대 | 전역 일관성 |
| **유지** | 옵션 다수·다중 선택 | 기존 드롭다운/MultiSelectCheckbox 유지, 필요 시 드롭다운만 접근성·z-index 정리 |

---

## 4. 기획적 결론 및 권장안

### 4.1 "전체 다 바꾸는 게 어떨까"에 대한 결론

**권장: 전체를 한 번에 배지로 바꾸지 않고, 단계적·조건부 적용.**

### 4.2 이유

1. **옵션 수에 따른 적합성 차이**  
   - 소수(2~7개): 배지가 유리(가독성, 터치, 모달 내 이슈 없음).  
   - 다수(상담사·클라이언트 등): 배지는 공간·스크롤 부담이 커서 드롭다운이 더 적합.

2. **현재 문제의 범위**  
   - 결제 방법·담당 업무 등 **모달 내 소수 옵션**에서 드롭다운(z-index·스크롤) 문제가 집중됨.  
   - 이 구간만 배지로 바꿔도 문제 해소와 체감 개선이 큼.

3. **리스크·비용**  
   - 전체 교체 시 "옵션 다수" 화면까지 배지로 가면 스크롤/그리드·접근성 설계가 필요하고, 기존 드롭다운과의 일관성 규칙이 복잡해짐.  
   - 단계적 적용으로 공통 "단일 선택 배지" 컴포넌트를 먼저 정립한 뒤, 소수 옵션부터 확대하는 편이 안전.

4. **일관성**  
   - "옵션 소수 단일 선택 = 배지, 옵션 다수/다중 선택 = 드롭다운(또는 MultiSelect)" 규칙을 두면, 전체를 다 바꾸지 않아도 **규칙 기반 일관성**을 확보할 수 있음.

### 4.3 권장 실행 방향(요약)

- **1단계**: 결제 방법·담당 업무 등 **문제 되던 모달 내 소수 옵션**을 배지로 전환 (디자인·구현: core-designer → core-coder).
- **2단계**: 공통코드 기반 단일 선택 중 **옵션 7개 이하**인 필드를 배지로 통일하고, 디자인 시스템에 "단일 선택 배지" 스펙 추가.
- **전체 교체는 하지 않음**: 옵션 다수·다중 선택은 드롭다운/MultiSelect 유지.  
- (선택) 드롭다운을 계속 쓰는 화면은 z-index·포지션만 표준에 맞춰 정리하여 재발 방지.

---

## 5. 다음 단계(실행 위임 시 참고)

- **Phase 1 — 설계**: core-designer에게 "모달 내 결제 방법·담당 업무 단일 선택을 배지(chip) UI로 전환" 화면설계 의뢰 (사용성·정보 노출·레이아웃 요구 포함, `docs/planning/DROPDOWN_TO_BADGE_REVIEW.md` 참조).
- **Phase 2 — 구현**: core-coder에게 "단일 선택 배지 공통 컴포넌트 + PaymentConfirmationModal, MappingCreationModal 등 1단계 대상 화면 적용" 구현 의뢰 (디자인 산출물·본 문서 기준).
- **Phase 0 (선택)**: 기존 CustomSelect를 계속 쓰는 구간에 대해 core-debugger/coder가 z-index·스크롤 대응 점검하여 잔여 드롭다운 이슈 최소화.

---

*본 문서는 기획 검토 산출물이며, 실제 설계·구현은 분배실행 표에 따라 core-designer·core-coder 등 해당 서브에이전트에 의뢰한다.*
