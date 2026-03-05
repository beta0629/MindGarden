# 결제 방법 드롭다운 "선택이 안 된다" 원인 분석 및 수정 보고

**검토 일자**: 2026-03-05  
**대상**: 결제 확인 모달 등 결제 방법(payment method) 드롭다운 선택 불가

---

## 1. 결제 방법 드롭다운 흐름 요약

| 화면 | 옵션 로드 방식 | options 형식 |
|------|----------------|--------------|
| **PaymentConfirmationModal.js** | `getCommonCodes('PAYMENT_METHOD')` → tenant API | `paymentMethodOptions.map(o => ({ value, label }))` |
| **MappingPaymentModal.js** | 없음 (하드코딩) | `[{ value: 'BANK_TRANSFER', label: '계좌이체' }, ...]` |
| **DiscountPaymentConfirmationModal.js** | 없음 (하드코딩) | `[{ value: 'CARD', label: '카드' }, ...]` |
| **MappingCreationModal.js** | `getTenantCodes('PAYMENT_METHOD')` | `paymentMethodOptions.map(m => ({ value, label }))` |

- **공통코드 API**: `PAYMENT_METHOD`는 `TENANT_ISOLATED_CODE_GROUPS`에 포함되어  
  `GET /api/v1/common-codes/tenant?codeGroup=PAYMENT_METHOD` 로 요청됨.
- **백엔드**: `CommonCodeController.getTenantCodes()` → `ApiResponse<CommonCodeListResponse>`  
  → body: `{ success: true, data: { codes: [...], totalCount } }`.
- **프론트 apiGet**: `jsonData.data` 반환 → `response = { codes, totalCount }`.
- **getCommonCodes**: `response.codes` 배열 반환, 없으면 `[]` → PaymentConfirmationModal에서 `PAYMENT_METHOD_FALLBACK` 사용.  
  → **options가 비어 있을 가능성은 낮음** (폴백 처리 있음).

---

## 2. 근본 원인: 드롭다운 z-index가 모달보다 낮음

- **CustomSelect**는 드롭다운을 `ReactDOM.createPortal(..., document.body)`로 body에 렌더링.
- **CustomSelect.css** 76라인: `.custom-select__dropdown { z-index: 1000 !important; }`
- 프로젝트 내 모달 z-index:
  - `--z-modal: 1050` (unified-design-tokens.css, emergency-design-fix.css 등)
  - 또는 `--z-modal: 10000` (01-settings/_z-index.css)
- **결과**: 드롭다운(1000)이 모달(1050 또는 10000) **아래**에 있어,  
  사용자가 옵션을 클릭해도 **클릭이 모달 오버레이에 먼저 걸림** → 선택이 반영되지 않음.

---

## 3. 기타 확인 사항 (이번 증상과 무관)

- **options 빈 배열**: API 실패/빈 목록 시 PaymentConfirmationModal은 `PAYMENT_METHOD_FALLBACK` 사용 → 빈 옵션 가능성 낮음.
- **value 타입**: `paymentData.method`는 문자열('CARD' 등), 옵션 value도 문자열 → 타입 불일치 아님.
- **공통코드 응답 구조**: tenant API는 `data.codes` 배열 반환, `commonCodeApi.js`에서 `response.codes`로 처리해 일치함.
- **loadingCodes**: 로딩 중에는 `disabled={loadingCodes}`로 비활성화되나, 정상 완료/에러 시 `finally`에서 해제됨.

---

## 4. 수정 제안 (반영함)

### 4.1 CustomSelect 드롭다운 z-index (필수)

- **파일**: `frontend/src/components/common/CustomSelect.css`
- **위치**: `.custom-select__dropdown` (76라인 부근)
- **변경**: `z-index: 1000 !important` → **모달보다 위에 오도록** `z-index: 10100` (또는 `var(--z-modal-report, 10050) + 50` 등)
- **이유**: `!important`로 인해 JS에서 설정한 9999도 덮이므로, CSS에서 모달 계열(1050~10050)보다 큰 값으로 통일.

### 4.2 (선택) 라벨/아이콘 방어 코드

- **파일**: `frontend/src/components/admin/PaymentConfirmationModal.js`
- **위치**: options 매핑 시 `label: \`${option.icon} ${option.label}\``
- **변경**: `label: \`${option.icon != null ? option.icon + ' ' : ''}${option.label || option.value || ''}\``  
  → API에서 `icon`/`label` 없을 때 "undefined" 노출 방지.

---

## 5. 체크리스트 (수정 후 확인)

- [ ] 결제 확인 모달에서 "결제 방법" 클릭 → 드롭다운 열림.
- [ ] 옵션(카드, 계좌이체, 현금 등) 클릭 시 선택값이 바뀌고 드롭다운이 닫힘.
- [ ] 다른 모달 내 CustomSelect(공통코드 기반 등)에서도 동일하게 선택 가능한지 확인.

---

## 6. 참고

- 기존 디버그 보고: `docs/debug/PAYMENT_CONFIRM_AND_DROPDOWN_REPORT.md` (결제 확인 500, 드롭다운/공통코드 정규화)
- 공통코드: `frontend/src/utils/commonCodeApi.js`, `CommonCodeController.getTenantCodes()`, `CommonCodeListResponse`
