# 드롭다운 → 배지 교체 기술 검토 보고서

**작성일**: 2026-03-05  
**담당**: core-debugger (원인·검토만, 코드 수정은 core-coder 위임)

---

## 1. 현재 드롭다운 문제 요약

### 1.1 지금까지 확인된 이슈

| 구분 | 내용 | 상태/참고 |
|------|------|-----------|
| **z-index** | 드롭다운이 모달 아래에 그려져 옵션 클릭이 모달 레이어에 가로채짐. CSS `10100`으로 수정했으나 **CustomSelect.js** `updatePosition()` 내부에서 `dropdown.style.zIndex = '9999'` 인라인 설정으로 CSS를 덮어씀. | 수정 제안: 해당 인라인 한 줄 삭제 (RESPONSIBILITY_DROPDOWN_AND_SCROLL_REPORT.md) |
| **스크롤 시 위치** | createPortal로 body에 렌더링 + getBoundingClientRect + scroll/resize 리스너로 트리거 추적. 모달 내부 스크롤 시 scrollParent 한 번만 계산하는 방식이라 레이아웃 지연 시 이슈 가능. | 의도된 “트리거 추적” 동작으로 보나, 사용자 체감 시 “이상하게 움직인다”면 추가 조사 필요 |
| **공통코드 응답 구조** | `getCommonCodes`/`getTenantCodes` 반환값이 `response.codes` 배열. 일부 화면에서 apiGet 직접 호출 시 `{ data: [...] }` 등 구조 차이로 options 비정규화 가능. | PaymentConfirmationModal 등에서 getCommonCodes + 배열 정규화·폴백 적용됨 (PAYMENT_CONFIRM_AND_DROPDOWN_REPORT.md) |
| **options 안전성** | `options`가 undefined/비배열일 때 CustomSelect 내부 filter 등에서 런타임 에러 가능. | CustomSelect에 `safeOptions = Array.isArray(options) ? options : []` 적용됨 |

**요약**: 모달 내 CustomSelect “선택이 안 된다” 현상의 주된 원인은 **z-index 인라인 덮어쓰기(9999)** 로 판단됨. 배지로 전환하면 포탈/드롭 레이어 자체가 없어져 해당 이슈는 사라짐.

---

### 1.2 CustomSelect 사용처 목록 (문제 케이스 표)

아래는 **CustomSelect를 import하여 JSX에서 사용하는** 파일만 정리한 목록이다.  
**모달 내 사용**이 z-index/스크롤 이슈에 직접 해당한다.

| 파일 | 용도(대략) | 모달 내부 여부 | 공통코드 연동 | 비고 |
|------|------------|----------------|---------------|------|
| `PaymentConfirmationModal.js` | 결제 방법 | ✅ | getCommonCodes('PAYMENT_METHOD') | 문제 보고 다수 |
| `MappingCreationModal.js` | 상담 패키지, 결제 방법, 담당 업무 등 | ✅ | getTenantCodes | 결제 방법·담당업무 이슈 |
| `DiscountPaymentConfirmationModal.js` | 결제 방법 | ✅ | 하드코딩 옵션 | |
| `MappingPaymentModal.js` | 결제 방법 | ✅ | 하드코딩 | |
| `SessionExtensionModal.js` | (세션 관련 선택) | ✅ | (해당 파일 확인) | |
| `ConsultantTransferModal.js` | (이전 관련 선택) | ✅ | (해당 파일 확인) | |
| `VacationManagementModal.js` | 휴가 유형 등 | ✅ | getTenantCodes 등 가능 | |
| `SessionModals.js` | 세션 모달 내 선택 | ✅ | | |
| `RecurringExpenseModal.js` | 반복 경비 카테고리 등 | ✅ | | |
| `ErpReportModal.js` | ERP 보고 필터 | ✅ | | |
| `TimeSelectionModal.js` | 시간 선택 | ✅ | | |
| `MessageSendModal.js` | 메시지 수신자 등 | ✅ | | |
| `ConsultationLogModal.js` | 상담 로그 필드 | ✅ | | |
| `SpecialtyManagementModal.js` | 전문분야 등 | ✅ | | |
| `PerformanceMetricsModal.js` | 지표 필터 | ✅ | | |
| `ScheduleModal.js` | 일정 필터/선택 | ✅ | | |
| `ClientModal.js` (ClientComprehensiveManagement) | 클라이언트 필드 | ✅ | | |
| `SalaryProfileFormModal.js` | 급여 프로필 | ✅ | | |
| `SalaryConfigModal.js` | 급여 설정 | ✅ | | |
| `ConsultantVacationModal.js` | 휴가 | ✅ | | |
| `FinancialTransactionForm.js` | 거래 폼 (모달/패널 가능) | 상황에 따라 | | |
| `ScheduleList.js` | 일정 목록 필터 | ❌ | | |
| `ScheduleCalendarHeader.js` | 캘린더 헤더 필터 | ❌ | | |
| `ConsultantMessages.js` | 메시지 필터 | ❌ | | |
| `AdminMessages.js` | 관리자 메시지 필터 | ❌ | | |
| `UserManagement.js` | 사용자 관리 필터/폼 | ❌ | | |
| `ItemManagement.js` (erp) | 품목 관리 | ❌ | | |
| `MatchQueueRow.js` (AdminDashboard) | 매칭 큐 행 내 선택 | ❌(테이블 행) | | |
| `ErpReportModal.js` | (위와 동일) | ✅ | | |

**“문제가 되는 케이스”**: **모달 내부**에서 사용하는 모든 CustomSelect. 특히 결제 확인·매칭 생성·담당 업무·휴가·세션 등 **이미 사용자 불만/버그 보고가 있는 화면**을 우선 교체 후보로 볼 수 있음.

---

## 2. 배지로 교체 시 기술적 고려

### 2.1 새 컴포넌트: BadgeSelect / ChipSelect

- **이름 제안**: `BadgeSelect` (단일 선택 강조) 또는 `ChipSelect` (Material 챙 스타일 연상). 프로젝트에 이미 `FilterChips`, `Badge`(ui)가 있으므로 네이밍은 디자인 시스템과 통일 권장.
- **인터페이스 (CustomSelect와 호환되게)**  
  - `options`: `Array<{ value: string, label: string }>` (공통코드 매핑과 동일).  
  - `value`: 단일 선택 시 `string`, 다중 선택 시 `string[]` (옵션).  
  - `onChange`: 단일 시 `(value: string) => void`, 다중 시 `(value: string[]) => void`.  
  - (선택) `multiple?: boolean`, `placeholder`, `disabled`, `loading`, `error`, `className` 등은 CustomSelect와 동일하게 두면 교체 시 치환만 하면 됨.
- **동작**:  
  - 옵션을 **배지(칩) 목록**으로 한 줄/여러 줄로 표시.  
  - 클릭 시 선택/해제. 단일 모드면 선택 시 기존 값 교체.  
  - **드롭다운/포탈 없음** → z-index·스크롤·외부 클릭 이슈 없음.

### 2.2 공통코드(getCommonCodes, getTenantCodes) 연동

- **옵션 로드**: 그대로 재사용 가능.  
  - `getCommonCodes('PAYMENT_METHOD')` / `getTenantCodes('RESPONSIBILITY')` 등 호출 후,  
  - 기존처럼 `codes.map(c => ({ value: c.codeValue ?? c.code_value, label: c.codeLabel ?? c.code_label }))` 형태로 `options` 배열 생성하면 됨.  
- **CommonCodeSelect 표준**: `docs/standards/COMMON_CODE_DROPDOWN_STANDARD.md`에는 CommonCodeSelect + CustomSelect 조합이 나와 있음.  
  - 배지 전환 시 **CommonCodeSelect를 “CommonCodeBadgeSelect”처럼 옵션만 배지로 넘기는 래퍼**로 두거나,  
  - 각 화면에서 `getCommonCodes`/`getTenantCodes` → `options` → `BadgeSelect` 로 직접 넣는 방식 모두 가능.  
- **결론**: 옵션 로드·형식은 기존과 동일하게 재사용 가능. “배지 목록으로 변환”은 옵션 배열을 그대로 BadgeSelect에 넘기면 되므로 추가 레이어 불필요.

### 2.3 한 번에 교체 vs 점진적 교체

| 방식 | 장점 | 단점 |
|------|------|------|
| **한 번에 전체 교체** | UI/동작 일관성, CustomSelect 유지보수 부담 제거, z-index 등 버그 원인 제거 | 변경 범위 큼, 회귀 테스트 부담, 옵션 수 많은 케이스에서 배지 가독성/공간 이슈 가능 |
| **점진적 교체** | 우선 모달·문제 보고된 화면만 배지로 바꿔 리스크 분산, 검증 후 확대 가능 | CustomSelect와 BadgeSelect 병존 기간 필요, 스타일/접근성 가이드 정리 필요 |

**권장**:  
- 먼저 **공통 BadgeSelect(또는 ChipSelect) 컴포넌트**를 도입하고,  
- **모달 내부 + 옵션 수가 적은(예: 3~10개) 화면**부터 점진적으로 교체.  
- 옵션 수가 매우 많은 필터(예: 사용자 목록)는 배지 대신 “검색 가능한 리스트/다른 패턴”을 유지하거나, 배지는 “자주 쓰는 것만” 노출하는 하이브리드도 검토.

---

## 3. 리스크·체크리스트

### 3.1 드롭다운에만 있던 동작

| 동작 | 배지 전환 시 | 대체 설계 |
|------|--------------|-----------|
| **검색(옵션 5개 초과 시 검색창)** | 없음 | 옵션 많을 때는 BadgeSelect 비권장 또는 상단에 간단 검색 필터(입력으로 배지 목록 필터링) 추가 |
| **긴 목록 스크롤** | 없음(전체 배지 노출) | 옵션 수 제한(예: ≤15) 또는 “더보기”로 접기/펼치기, 또는 해당 화면은 드롭다운 유지 |
| **키보드 네비게이션(Arrow/Enter)** | 기본 배지는 클릭 위주 | 접근성 요구 시 배지에 tabIndex + 키보드 포커스/선택 처리 추가 |
| **포탈/body 렌더링** | 사용 안 함 | z-index/스크롤 이슈 자체 제거 |

### 3.2 폼 제출·백엔드 호환성

- **value 형식**: CustomSelect와 동일하게 **문자열(단일)** 또는 **문자열 배열(다중)** 로 두면,  
  기존 `paymentData.method`, `paymentInfo.responsibility` 등 필드명·타입을 그대로 유지 가능.  
- **결론**: 폼 state와 API 전송 payload 구조를 바꿀 필요 없음. **동일 value 형식**만 유지하면 백엔드 호환성 유지 가능.

### 3.3 체크리스트 (배지 도입/교체 후)

- [ ] 모달 내 결제 방법·담당 업무 등에서 선택 값이 정상 반영되는지.
- [ ] 공통코드 기반 옵션이 배지에 올바르게 표시되는지 (getCommonCodes/getTenantCodes → options → BadgeSelect).
- [ ] 폼 제출 시 기존과 동일한 필드명·값 타입으로 전송되는지 (네트워크/콘솔 확인).
- [ ] 옵션 수가 많은 화면은 스크롤/가독성·검색 필요 여부 재검토.
- [ ] 접근성(키보드, 스크린 리더) 요구 시 BadgeSelect에 해당 동작 명세 반영.

---

## 4. 결과물 요약

### 4.1 “전체 바꿀 때” 수정 대상 (가능한 범위)

- **신규 공통 컴포넌트**  
  - `frontend/src/components/common/BadgeSelect.js` (또는 `ChipSelect.js`)  
  - `frontend/src/components/common/BadgeSelect.css` (필요 시)
- **CustomSelect 사용처 중 교체 후보(모달 내·옵션 소수)**  
  - `PaymentConfirmationModal.js`  
  - `MappingCreationModal.js`  
  - `DiscountPaymentConfirmationModal.js`  
  - `MappingPaymentModal.js`  
  - `SessionExtensionModal.js`  
  - `ConsultantTransferModal.js`  
  - `VacationManagementModal.js`  
  - `SessionModals.js`  
  - `RecurringExpenseModal.js`  
  - `ErpReportModal.js`  
  - `TimeSelectionModal.js`  
  - `MessageSendModal.js`  
  - `ConsultationLogModal.js`  
  - `SpecialtyManagementModal.js`  
  - `PerformanceMetricsModal.js`  
  - `ScheduleModal.js`  
  - `ClientModal.js` (ClientComprehensiveManagement)  
  - `SalaryProfileFormModal.js`  
  - `SalaryConfigModal.js`  
  - `ConsultantVacationModal.js`  
  - (그 외 표의 모달 내 CustomSelect)
- **문서/표준**  
  - `docs/standards/COMMON_CODE_DROPDOWN_STANDARD.md` — CommonCodeSelect 예시에 BadgeSelect 연동 또는 “배지 선택” 패턴 추가 검토.  
  - 디자인 시스템 문서에 “선택 UI: 드롭다운 vs 배지” 가이드 추가 권장.

**주의**: 옵션 수가 많은 필터(사용자 목록, 품목 등)는 위 목록에서 제외하거나, 배지 + 검색/접기 등 별도 설계 후 적용하는 것이 안전함.

### 4.2 배지 컴포넌트 도입 시 API(props) 제안

```text
BadgeSelect (또는 ChipSelect)
- options: Array<{ value: string, label: string }>   // 필수, 공통코드 매핑과 동일
- value: string | string[]                           // 단일 또는 다중
- onChange: (value: string) => void | (value: string[]) => void
- multiple?: boolean                                  // 기본 false
- placeholder?: string                                // 선택 없을 때 문구
- disabled?: boolean
- loading?: boolean                                   // 로딩 시 배지 비활성 또는 스피너
- error?: boolean                                     // 에러 스타일
- className?: string
- maxVisible?: number                                  // (선택) 초기 표시 개수, 나머지 “+N 더보기” 등
```

- **value/onChange**: 기존 CustomSelect와 동일하게 두면 교체 시 부모 state 로직 변경 최소화.  
- **공통코드 연동**: `getCommonCodes`/`getTenantCodes` → `options` 생성 로직은 그대로 두고, `CustomSelect` 대신 `BadgeSelect`에 넘기면 됨.

---

## 5. 참고 문서

- `docs/debug/PAYMENT_METHOD_DROPDOWN_REPORT.md` — 결제 방법 드롭다운 z-index
- `docs/debug/RESPONSIBILITY_DROPDOWN_AND_SCROLL_REPORT.md` — 담당업무 z-index·스크롤
- `docs/debug/PAYMENT_CONFIRM_AND_DROPDOWN_REPORT.md` — 결제 확인 500·공통코드 정규화
- `docs/standards/COMMON_CODE_DROPDOWN_STANDARD.md` — 공통코드 드롭다운 표준
- `frontend/src/utils/commonCodeApi.js` — getCommonCodes, getTenantCodes
- `frontend/src/components/common/CustomSelect.js` — 현재 드롭다운 구현
