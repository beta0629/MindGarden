# 모달 전역 버튼·간격 디자인 스펙

모달 50개 이상에서 버튼 컴포넌트와 푸터/액션 영역 간격을 통일하기 위한 스펙. 코더는 이 문서만 보고 구현 가능하도록 구체적으로 기술한다.

**참조**
- 어드민 대시보드 샘플: https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample
- 공통 모달: `frontend/src/components/common/modals/UnifiedModal.js`
- Button 컴포넌트: `frontend/src/components/ui/Button`
- 디자인 토큰: `frontend/src/styles/unified-design-tokens.css`, `frontend/src/components/ui/Button/Button.css`

---

## 1. 버튼 컴포넌트

### 1.1 필수 사항

- 모달 내 **모든 액션 버튼**(확인, 취소, 저장, 닫기, 선택하기, 상세보기, 제출, 삭제 등)은 **공통 Button 컴포넌트**만 사용한다.
- **import 경로**: `frontend/src/components/ui/Button` (또는 프로젝트 alias `@/components/ui/Button` 등).
- raw `<button>`, `className="btn"`, `className="mg-button-*"` / `className="mg-v2-button*"` 직접 부여한 버튼은 **제거 후 Button 컴포넌트로 교체**한다.

### 1.2 Variant 매핑

| 용도 | Button variant | 비고 |
|------|----------------|------|
| 주 액션 (확인, 저장, 제출, 등록, 적용) | `primary` | 한 모달에 하나만. 배경 #3D5246 계열 |
| 보조 액션 (취소, 닫기, 뒤로) | `secondary` 또는 `outline` | 취소·닫기는 outline 권장(테두리만) |
| 위험 액션 (삭제, 철회, 환불 확정 등) | `danger` (있으면 사용) | 없으면 `primary` + 시맨틱 유지 |
| 부가/3차 액션 (더보기, 선택 등) | `outline` 또는 `ghost` | 비중 낮은 액션 |

- **기본값**: `variant="primary"` / `variant="outline"` 등 명시적으로 지정.

### 1.3 Size 통일

- 모달 **푸터·액션 영역** 버튼은 **size 하나로 통일**.
- **권장**: `size="medium"` (프로젝트 Button 기본값. min-height 40px, 패딩 sm~md).
- 대안: 전체 모달 톤이 작으면 `size="small"`로 통일 (min-height 32px).
- **한 모달 내에서** medium과 small 혼용 금지. 푸터는 동일 size만 사용.

### 1.4 사용 예시 (참고용)

```text
주 액션: <Button variant="primary" size="medium" onClick={onSubmit}>저장</Button>
보조 액션: <Button variant="outline" size="medium" onClick={onClose}>취소</Button>
위험 액션: <Button variant="danger" size="medium" onClick={onDelete}>삭제</Button>
```

(실제 코드 작성은 코더가 수행하며, 위는 스펙 이해용.)

---

## 2. 버튼 그룹 간격

### 2.1 단일 Spacing 토큰

- 모달 **푸터·액션 영역**에서 두 개 이상 버튼이 나란히 있을 때, 버튼 사이 간격은 **단일 CSS 변수**로 통일한다.
- **권장 토큰**: `var(--spacing-md)`  
  - 정의: `frontend/src/styles/06-components/_base/_modals.css` 등에서 이미 `.mg-modal__actions { gap: var(--spacing-md); }` 사용 중.  
  - 값: 1.5rem (24px) 수준 (프로젝트 토큰 정의에 따름).
- **대안**: 8px 이상이면 가능. 예: `var(--cs-spacing-md)` (1rem), `var(--spacing-sm)` (1rem인 경우). **8px 미만 값 사용 금지.**

### 2.2 푸터/액션 영역 클래스 및 gap

- **UnifiedModal 사용 시**: 액션은 `mg-modal__actions`로 렌더됨. 해당 영역에 **gap만** 위 단일 토큰으로 적용.
  - 전역 스타일: `.mg-modal__actions { gap: var(--spacing-md); }` 유지.
- **커스텀 푸터 div 사용 시** (UnifiedModal의 `actions` prop 없이 직접 마크업):
  - **클래스 권장명**: `mg-modal__footer` 또는 `mg-modal__actions`.
  - 레이아웃: `display: flex; justify-content: flex-end; align-items: center; gap: var(--spacing-md);`
  - 패딩: 상하·좌우는 기존 모달 패딩과 맞추기 (예: `padding: var(--spacing-lg);` 또는 16px 24px).

### 2.3 인라인 스타일·기타 gap 제거

- 푸터/액션 영역에서 `gap: 8px`, `gap: 12px`, `gap: 15px`, `0.5rem`, `0.75rem` 등 **하드코딩된 gap 제거**하고, 위 **단일 토큰**으로 교체.

---

## 3. 예외

### 3.1 닫기(X) 아이콘 버튼

- **헤더의 닫기(X) 버튼만** 있는 경우: 기존 유지 가능.  
- 프로젝트에 **아이콘 버튼** 규칙/컴포넌트가 있으면 그에 따름.  
- 이 스펙은 **푸터/액션 영역의 텍스트 액션 버튼**에만 강제.

### 3.2 이미 Button 컴포넌트를 쓰는 모달

- **DashboardFormModal**, **WidgetConfigModal** 등 이미 Button을 쓰는 모달은 **버튼 컴포넌트 유지**.
- **gap만** 푸터/액션 영역에서 단일 토큰(`var(--spacing-md)`)으로 맞춘다.

### 3.3 UnifiedModal props.actions

- UnifiedModal의 `actions` prop에 **Button 컴포넌트**만 넘기고, 푸터 영역 스타일은 `mg-modal__actions` 전역 스타일에 맡긴다.

---

## 4. 적용 대상 목록 (파일 단위)

### 4.1 Button 컴포넌트로 교체 대상 (B: raw button + mg-button-* / mg-v2-button*)

아래 파일에서 모달 푸터/본문 내 **raw button** 또는 **mg-button-* / mg-v2-button* 클래스 직접 사용**을 제거하고, **Button 컴포넌트**로 교체한다.

| # | 파일 경로 |
|---|-----------|
| 1 | `frontend/src/components/schedule/DateActionModal.js` |
| 2 | `frontend/src/components/consultant/ClientInfoModal.js` |
| 3 | `frontend/src/components/consultant/ClientDetailModal.js` |
| 4 | `frontend/src/components/admin/MappingCreationModal.js` |
| 5 | `frontend/src/components/admin/mapping/PartialRefundModal.js` |
| 6 | `frontend/src/components/admin/mapping/ConsultantTransferModal.js` |
| 7 | `frontend/src/components/common/CompactConfirmModal.js` |
| 8 | `frontend/src/components/common/DuplicateLoginModal.js` |
| 9 | `frontend/src/components/consultant/ConsultantVacationModal.js` |
| 10 | `frontend/src/components/hq/BranchRegistrationModal.js` |
| 11 | `frontend/src/components/consultant/EventModal.js` |
| 12 | `frontend/src/components/ui/ConsultantDetailModal.js` |
| 13 | `frontend/src/components/consultant/ConsultationLogModal.js` |
| 14 | `frontend/src/components/admin/SystemConfigManagement.js` |

### 4.2 Button 컴포넌트로 교체 대상 (C: raw button + btn / modal-close 등)

아래 파일에서 **푸터/액션 영역**의 `btn`, `modal-close` 등 클래스를 쓰는 **raw button**을 **Button 컴포넌트**로 교체한다. (헤더 닫기(X)는 예외 처리 가능.)

| # | 파일 경로 |
|---|-----------|
| 1 | `frontend/src/components/consultant/ConsultantAvailability.js` (및 관련 CSS) |
| 2 | `frontend/src/components/admin/DashboardFormModal.js` (역할추가 등 내부 모달의 raw button만; 닫기·기존 Button 유지) |
| 3 | `frontend/src/components/erp/SalaryConfigModal.js` |
| 4 | `frontend/src/components/hq/ErdManagement.js` |
| 5 | `frontend/src/components/consultant/MessageSendModal.js` |
| 6 | `frontend/src/components/mindgarden/ModalShowcase.js` |
| 7 | `frontend/src/components/ops/PgApprovalManagement.js` |
| 8 | `frontend/src/components/tenant/PgConfigurationDetail.js` (및 PgConfigurationDetail.css) |
| 9 | `frontend/src/components/tenant/PgConfigurationList.js` (및 PgConfigurationList.css) |
| 10 | `frontend/src/components/admin/TenantCodeManagement.js` |
| 11 | `frontend/src/components/schedule/ScheduleModalOld.js` |
| 12 | 통합 재무 대시보드·클라이언트 메시지 화면 등에서 모달 푸터 버튼 사용 시 해당 파일 |

- **IntegratedFinanceDashboard**, **ClientMessageScreen** 등 경로는 프로젝트 구조에 맞게 동일 규칙 적용.

### 4.3 간격 토큰 적용 대상 (gap 변경)

아래 파일에서 푸터/액션 영역 **gap** 또는 버튼 그룹 **margin**을 하드코딩한 부분을 **`var(--spacing-md)`** (또는 확정된 단일 토큰)으로 교체한다.

| # | 파일 경로 | 비고 |
|---|-----------|------|
| 1 | `frontend/src/components/schedule/ScheduleModal.css` | `.mg-modal__footer` padding/gap |
| 2 | `frontend/src/components/consultant/ConsultantAvailability.css` | `.mg-modal__footer` |
| 3 | `frontend/src/components/consultant/ConsultantClientList.css` | `.mg-modal__footer` |
| 4 | `frontend/src/components/admin/DashboardFormModal.css` | `.mg-modal__footer` |
| 5 | `frontend/src/components/admin/MappingCreationModal.css` | `.mg-modal__actions` (B0KlA) |
| 6 | `frontend/src/components/schedule/ScheduleB0KlA.css` | `.mg-modal__actions` padding |
| 7 | `frontend/src/styles/06-components/_base/_modals.css` | `.mg-modal__actions` gap — 이미 `var(--spacing-md)` 사용, 참고용 |
| 8 | `frontend/src/styles/modules/schedule-modal.css` | `.mg-modal__footer` padding |
| 9 | `frontend/src/components/hq/BranchUserTransfer.css` | `.mg-modal__footer` |
| 10 | `frontend/src/components/hq/ErdManagement.css` | `.mg-modal__footer` |
| 11 | `frontend/src/components/ops/PgApprovalManagement.css` | `.mg-modal__footer` |
| 12 | `frontend/src/components/tenant/PgConfigurationDetail.css` | `.mg-modal__footer` |
| 13 | `frontend/src/components/tenant/PgConfigurationList.css` | `.mg-modal__footer` |
| 14 | `frontend/src/components/admin/TenantCodeManagement.css` | `.mg-modal__footer` |
| 15 | `frontend/src/components/hq/BranchForm.css` | `.mg-modal__footer` |
| 16 | `frontend/src/components/hq/BranchDetail.css` | `.mg-modal__footer` |
| 17 | `frontend/src/styles/mindgarden-design-system.css` | `.mg-modal__footer` |
| 18 | `frontend/src/components/erp/ConsultantProfileModal.css` | `.consultant-profile-modal-footer` |

- **인라인 스타일**로 `gap`, `marginRight` 등을 준 모달 컴포넌트가 있으면, 해당 JS/JSX에서 제거하고 위 클래스 + 토큰으로 통일.

---

## 5. 체크리스트 (구현 후 검증)

- [ ] 모든 대상 모달 푸터/액션에서 **Button 컴포넌트**만 사용하는가?
- [ ] 주/보조/위험 액션이 **variant** 매핑에 맞는가?
- [ ] 모달 푸터 버튼 **size**가 한 모달 내에서 동일한가?
- [ ] 푸터/액션 영역 **gap**이 **단일 토큰**(권장: `var(--spacing-md)`)으로만 적용되어 있는가?
- [ ] 8px 미만 gap이 남아 있지 않은가?
- [ ] 닫기(X) 전용 버튼은 예외로 두었는가?
- [ ] UnifiedModal 사용 모달은 `mg-modal__actions` + 전역 gap 유지했는가?

---

*문서 버전: 1.0 | 적용 범위: 모달 전역 버튼·간격 통일*
