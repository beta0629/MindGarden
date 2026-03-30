# 드롭다운 → 배지 전환 전체 범위 보고서

## 1. 제목·목표

**제목:** 프로젝트 전체 CustomSelect 사용처 정리 및 “중요한 부분 제외, 나머지 배지 전환” 적정성 검토  
**목표:** 드롭다운이 스크롤 시 따라다녀 지저분해 보이는 문제를 줄이기 위해, **유지할 드롭다운**과 **배지(BadgeSelect)로 교체할 대상**을 구분하고, 교체 시 우선순위를 제안한다.

---

## 2. 전체 드롭다운 사용처 재파악 (탐색 결과 요약)

### 2.1 CustomSelect 사용 파일·횟수

| 파일 경로 | CustomSelect 사용 횟수 |
|-----------|------------------------|
| `frontend/src/components/common/CustomSelect.js` | 정의(1) |
| `frontend/src/components/erp/ErpReportModal.js` | 3 |
| `frontend/src/components/admin/MappingCreationModal.js` | 2 |
| `frontend/src/components/consultant/ConsultationLogModal.js` | 3 |
| `frontend/src/components/admin/AdminMessages.js` | 2 |
| `frontend/src/components/admin/UserManagement.js` | 2 |
| `frontend/src/components/schedule/ScheduleModal.js` | 2 |
| `frontend/src/components/common/SessionModals.js` | 1 |
| `frontend/src/components/consultant/SpecialtyManagementModal.js` | 2 |
| `frontend/src/components/erp/FinancialTransactionForm.js` | 2 |
| `frontend/src/components/admin/mapping/SessionExtensionModal.js` | 1 |
| `frontend/src/components/schedule/ScheduleCalendar/ScheduleCalendarHeader.js` | 1 |
| `frontend/src/components/erp/SalaryConfigModal.js` | 5 |
| `frontend/src/components/consultant/ConsultantVacationModal.js` | 1 |
| `frontend/src/components/consultant/MessageSendModal.js` | 1 |
| `frontend/src/components/common/ScheduleList.js` | 1 |
| `frontend/src/components/erp/ItemManagement.js` | 2 |
| `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js` | 2 |
| `frontend/src/components/admin/AdminDashboard/molecules/MatchQueueRow.js` | 1 |
| `frontend/src/components/statistics/PerformanceMetricsModal.js` | 1 |
| `frontend/src/components/erp/SalaryProfileFormModal.js` | 4 |
| `frontend/src/components/admin/VacationManagementModal.js` | 2 |
| `frontend/src/components/schedule/TimeSelectionModal.js` | 2 |
| `frontend/src/components/admin/mapping/ConsultantTransferModal.js` | 1 |
| `frontend/src/components/consultant/ConsultantMessages.js` | 3 |
| `frontend/src/components/finance/RecurringExpenseModal.js` | 2 |

**제외:** 이미 BadgeSelect로 교체된 곳  
- `PaymentConfirmationModal`, `MappingPaymentModal`, `DiscountPaymentConfirmationModal`, `MappingCreationModal`의 **결제 방법·담당 업무** 필드는 위 집계에서 “교체 대상”에서 제외.  
- `MappingCreationModal`의 **내담자 필터/정렬** 2곳은 아직 CustomSelect이므로 본 문서 대상에 포함.

---

## 3. “중요한 부분” = 드롭다운 유지 vs 배지 전환 기준

### 3.1 유지 권장 (드롭다운 유지)

| 조건 | 설명 |
|------|------|
| (a) 옵션 16개 이상 | 목록이 길어 드롭다운이 적합. 배지는 옵션 많을 때 가독성·공간 부담 증가 |
| (b) 검색이 필수 | 상담사·클라이언트·지점 등 “찾기”가 필요한 경우. (현재 CustomSelect에 검색 여부는 구현별로 상이할 수 있음) |
| (c) 다중 선택 + 옵션 많음 | 현재 CustomSelect는 다중 선택 미지원. 추후 다중 선택 셀렉트는 별도 기준 적용 |

### 3.2 배지 전환 권장

| 조건 | 설명 |
|------|------|
| (a) 옵션 소수~중간(2~15개) | 배지로 한눈에 선택 가능 |
| (b) 단일 선택 | BadgeSelect 단일 선택 용도에 부합 |
| (c) 스크롤 시 따라다니는 컨텍스트 | 모달·스크롤 패널 내부 등에서 드롭다운이 viewport 대비 어긋나 보이는 경우 |

### 3.3 분류 결과 요약표

| 구분 | 건수 | 비고 |
|------|------|------|
| **드롭다운 유지** | 9개 사용처 | 상담사/내담자/지점/패키지 등 옵션 다수 또는 검색 필요 |
| **배지로 교체** | 39개 사용처 | 소수~중간 옵션 + 단일 선택, 대부분 모달/폼 내부 |

---

## 4. 드롭다운 유지 목록 (“중요한 부분”)

아래는 **배지로 바꾸지 않고 드롭다운을 유지**할 사용처이다.

| 파일 경로 | 대략 라인 | 용도 | 사유 |
|-----------|-----------|------|------|
| `frontend/src/components/erp/ErpReportModal.js` | 249 | 지점 선택 | 옵션 중간~다수(API branches) |
| `frontend/src/components/common/SessionModals.js` | 253 | 패키지 선택 | 옵션 중간~다수(API packageOptions) |
| `frontend/src/components/schedule/ScheduleCalendar/ScheduleCalendarHeader.js` | 46 | 상담사 필터 | 옵션 다수(API consultants), 검색 유용 |
| `frontend/src/components/common/ScheduleList.js` | 346 | 상담사 선택 | 옵션 다수(API consultants) |
| `frontend/src/components/admin/AdminDashboard/molecules/MatchQueueRow.js` | 46 | 상담사 선택(매칭 대기 배정) | 옵션 다수(API), 업무상 검색 필요 |
| `frontend/src/components/statistics/PerformanceMetricsModal.js` | 194 | 지점 선택 | 옵션 중간~다수(API branches) |
| `frontend/src/components/admin/VacationManagementModal.js` | 492 | 상담사 선택 | 옵션 다수(API consultants) |
| `frontend/src/components/admin/mapping/ConsultantTransferModal.js` | 267 | 새 상담사 선택 | 옵션 다수(API consultants) |
| `frontend/src/components/consultant/ConsultantMessages.js` | 383 | 받는 사람(내담자 선택, 새 메시지 모달) | 옵션 다수(API clients), 검색 유용 |

---

## 5. 배지 교체 대상 목록 (실행용 체크리스트)

아래는 **BadgeSelect로 교체 권장** 사용처이다. 파일·라인·용도만 정리한 실행용 체크리스트다.

| # | 파일 경로 | 대략 라인 | 필드 용도 |
|---|-----------|-----------|-----------|
| 1 | `frontend/src/components/admin/MappingCreationModal.js` | 535 | 내담자 필터(상태): 전체/매칭없음/활성/비활성/종료됨 |
| 2 | `frontend/src/components/admin/MappingCreationModal.js` | 548 | 내담자 정렬: 이름순/이메일순/등록일순 |
| 3 | `frontend/src/components/erp/ErpReportModal.js` | 212 | 분기 선택(보고 유형 quarterly) |
| 4 | `frontend/src/components/erp/ErpReportModal.js` | 228 | 연도 선택(보고 유형 yearly) |
| 5 | `frontend/src/components/consultant/ConsultationLogModal.js` | 1015 | 세션 완료 여부 |
| 6 | `frontend/src/components/consultant/ConsultationLogModal.js` | 1121 | 위험도 평가(공통코드) |
| 7 | `frontend/src/components/consultant/ConsultationLogModal.js` | 1186 | 목표 달성도 |
| 8 | `frontend/src/components/admin/AdminMessages.js` | 176 | 메시지 유형 필터 |
| 9 | `frontend/src/components/admin/AdminMessages.js` | 185 | 메시지 상태 필터(전체/읽지않음/읽음) |
| 10 | `frontend/src/components/admin/UserManagement.js` | 245 | 역할 필터(목록) |
| 11 | `frontend/src/components/admin/UserManagement.js` | 395 | 역할 변경 모달 – 새 역할 선택 |
| 12 | `frontend/src/components/schedule/ScheduleModal.js` | 458 | 상담 유형 |
| 13 | `frontend/src/components/schedule/ScheduleModal.js` | 472 | 상담 시간(duration) |
| 14 | `frontend/src/components/consultant/SpecialtyManagementModal.js` | 352 | 전문분야 필터(상담사 목록) |
| 15 | `frontend/src/components/consultant/SpecialtyManagementModal.js` | 416 | 전문분야 설정(선택된 상담사) |
| 16 | `frontend/src/components/erp/FinancialTransactionForm.js` | 161 | 카테고리(공통코드) |
| 17 | `frontend/src/components/erp/FinancialTransactionForm.js` | 191 | 세부 카테고리(공통코드) |
| 18 | `frontend/src/components/admin/mapping/SessionExtensionModal.js` | 271 | 결제 방법(신용카드/계좌이체/현금) |
| 19 | `frontend/src/components/erp/SalaryConfigModal.js` | 145 | 월급여 기산일 |
| 20 | `frontend/src/components/erp/SalaryConfigModal.js` | 155 | 급여 지급일 |
| 21 | `frontend/src/components/erp/SalaryConfigModal.js` | 165 | 급여 마감일 |
| 22 | `frontend/src/components/erp/SalaryConfigModal.js` | 179 | 배치 실행 주기 |
| 23 | `frontend/src/components/erp/SalaryConfigModal.js` | 193 | 계산 방식 |
| 24 | `frontend/src/components/consultant/ConsultantVacationModal.js` | 185 | 휴가 유형(공통코드) |
| 25 | `frontend/src/components/consultant/MessageSendModal.js` | 225 | 메시지 타입 |
| 26 | `frontend/src/components/erp/ItemManagement.js` | 373 | 아이템 카테고리(생성) |
| 27 | `frontend/src/components/erp/ItemManagement.js` | 499 | 아이템 카테고리(수정) |
| 28 | `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js` | 342 | 클라이언트 상태(공통코드/폴백 3개) |
| 29 | `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js` | 361 | 등급(브론즈~다이아몬드) |
| 30 | `frontend/src/components/erp/SalaryProfileFormModal.js` | 348 | 상담사 등급 |
| 31 | `frontend/src/components/erp/SalaryProfileFormModal.js` | 416 | 급여 유형(공통코드) |
| 32 | `frontend/src/components/erp/SalaryProfileFormModal.js` | 447 | 사업자 등록 여부 |
| 33 | `frontend/src/components/erp/SalaryProfileFormModal.js` | 523 | 급여 옵션 유형(공통코드) |
| 34 | `frontend/src/components/admin/VacationManagementModal.js` | 555 | 휴가 유형 |
| 35 | `frontend/src/components/schedule/TimeSelectionModal.js` | 149 | 상담 유형 |
| 36 | `frontend/src/components/schedule/TimeSelectionModal.js` | 160 | 상담 시간 |
| 37 | `frontend/src/components/consultant/ConsultantMessages.js` | 251 | 메시지 유형 필터 |
| 38 | `frontend/src/components/consultant/ConsultantMessages.js` | 399 | 메시지 유형(새 메시지 모달) |
| 39 | `frontend/src/components/finance/RecurringExpenseModal.js` | 423 | 주기(월간/분기별/연간) |
| 40 | `frontend/src/components/finance/RecurringExpenseModal.js` | 442 | 카테고리(공통코드) |

---

## 6. 결론 및 우선순위 제안

### 6.1 “중요한 부분 빼놓고 모두 배지로 교체” 적절성

- **결론: 적절하다.**  
  - 옵션 수가 많거나 “찾기”가 필요한 **9개 사용처**는 드롭다운 유지가 맞고,  
  - 나머지 **40개 사용처**는 옵션이 소수~중간이고 단일 선택이며, 상당수가 모달/스크롤 내부라 스크롤 시 드롭다운이 따라다니는 문제가 있는 맥락과 맞다.  
  - 이미 결제 방법·담당 업무 등 4개 모달은 BadgeSelect로 교체된 상태이므로, 같은 패턴을 확장하는 것이 일관성 측면에서도 타당하다.

### 6.2 교체 우선순위 제안

| 우선순위 | 대상 | 이유 |
|----------|------|------|
| **1차** | 모달 내부 + 옵션 소수(2~7개) | 스크롤 시 드롭다운 깨짐/따라다님 체감이 가장 큰 영역. 예: SessionExtensionModal 결제 방법, ConsultationLogModal 세션 완료 여부·목표 달성도, RecurringExpenseModal 주기, UserManagement 역할 변경 모달, MessageSendModal 메시지 타입, ConsultantVacationModal 휴가 유형, ClientModal 상태·등급, SalaryProfileFormModal 사업자 등록 여부 등 |
| **2차** | 모달/폼 내부 + 옵션 중간(8~15개) | 1차와 동일한 맥락이나 옵션 수가 조금 더 많은 경우. 예: 상담 유형·상담 시간(ScheduleModal, TimeSelectionModal), 위험도·전문분야(ConsultationLogModal, SpecialtyManagementModal), FinancialTransactionForm 카테고리, SalaryConfigModal/SalaryProfileFormModal 나머지 필드, VacationManagementModal 휴가 유형, RecurringExpenseModal 카테고리 등 |
| **3차** | 모달이 아닌 목록/필터 영역 | 스크롤 이슈는 상대적으로 적지만 UI 일관성을 위해 배지로 통일. 예: MappingCreationModal 내담자 필터·정렬, ErpReportModal 분기·연도, AdminMessages/ConsultantMessages 메시지 유형·상태 필터, UserManagement 역할 필터, ItemManagement 카테고리 등 |

### 6.3 구현 시 참고

- 배지 전환 시 **BadgeSelect** 컴포넌트 및 기존 교체 사례(PaymentConfirmationModal, MappingPaymentModal, DiscountPaymentConfirmationModal, MappingCreationModal의 결제 방법·담당 업무)를 참고하면 된다.
- 공통코드/API 옵션은 기존과 동일한 `options` 배열 형태로 전달하면 되며, 스타일은 `BadgeSelect.css` 및 디자인 토큰을 따른다.
- 드롭다운 유지 9곳은 **검색 가능 여부**를 한 번 점검해, 상담사/내담자/지점 등은 필요 시 검색 UI를 보강하는 것이 좋다.

---

## 7. 실행 분배 (서브에이전트 호출 시 참고)

| Phase | 담당 | 목표 | 호출 시 전달할 태스크 설명 |
|-------|------|------|----------------------------|
| **Phase 1** | explore | (완료) CustomSelect 사용처·옵션 수·용도 파악 | 위 2~5절 참고. 추가로 특정 파일만 상세 조사 필요 시 “해당 파일 내 CustomSelect 옵션 출처(공통코드/API) 확인” 등 |
| **Phase 2** | core-coder | 배지 교체 구현 | “`docs/planning/DROPDOWN_TO_BADGE_FULL_SCOPE.md`의 §5 체크리스트를 참고하여, 1차 우선순위(모달 내 소수 옵션)부터 BadgeSelect로 교체. 기존 PaymentConfirmationModal 등 BadgeSelect 사용 패턴 및 `core-solution-frontend`·`core-solution-unified-modal` 준수.” |
| (선택) | core-designer | 배지 그룹 레이아웃·모달 내 배치 검토 | “모달 내 BadgeSelect 배치·줄바꿈·여백이 디자인 시스템과 일치하는지 검토. 필요 시 스펙만 제안.” |

- **Phase 1**은 이미 수행 완료되었고, 본 문서가 그 결과를 반영한 최종 범위·체크리스트이다.  
- **Phase 2**는 기획이 정한 우선순위(1차 → 2차 → 3차)에 따라 core-coder가 교체 작업을 진행할 때 사용한다.
