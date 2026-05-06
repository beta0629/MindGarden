# 가예약(Tentative Booking) UX 및 디자인 스펙

**작성일**: 2026-05-06
**작성자**: core-designer
**관련 참조**: 
- `PRESERVE_PAY_TENTATIVE_BOOKING_PHASES_20260506.md` Phase 0
- `INTEGRATED_SCHEDULE_SSOT_UI_BACKEND_ALIGNMENT_20260506.md` §12 (또는 관련 기획서 §12)

---

## 1. PO 결정 사항 (핵심 전제)
- **선점 우선**: 입금 확인 **전**에 가예약 1건을 우선 등록하여 일정을 선점합니다.
- **상태 전환**: **입금 완료 또는 카드 결제**가 확인되는 시점에 상태가 변화하며 예약이 최종 완료(확정)됩니다.

---

## 2. 상태·라벨 표

화면에 표시될 사용자용 라벨과 내부 상태 키 후보, 그리고 해당 상태의 시각적/기능적 설명입니다.

| 사용자용 한글 라벨 | 내부 키 후보 (참고용) | 설명 및 시각적 표현 (Badge/Label) |
| :--- | :--- | :--- |
| **결제 대기 (가예약)** | `TENTATIVE_PENDING_PAYMENT` | 일정은 선점되었으나 결제가 완료되지 않은 상태. (시각: 보조 텍스트 색상 혹은 주황색 계열 경고 톤 `var(--mg-warning-color)`) |
| **결제 진행 중** | `PAYMENT_IN_PROGRESS` | 사용자가 결제/입금 확인을 진행 중인 상태. (시각: 진행 중 스피너 또는 `var(--mg-primary-light)` 톤 적용) |
| **예약 확정** | `CONFIRMED_PAID` | 입금 완료 또는 카드 결제가 확인되어 확정된 상태. (시각: 주조색 `var(--mg-primary-color)` 및 체크 아이콘) |
| **시간 초과 (취소)** | `TENTATIVE_EXPIRED` | 지정된 시간 내 결제가 이루어지지 않아 선점이 자동 해제된 상태. (시각: 취소선 또는 비활성 회색 `var(--mg-text-secondary)`) |
| **결제 실패** | `PAYMENT_FAILED` | 카드 한도 초과 등 결제 과정에서 오류가 발생한 상태. (시각: 붉은색 계열 에러 톤 `var(--mg-error-color)`) |

*(최소 5행 요건 충족)*

---

## 3. 통합 스케줄·일정 모달 UI/UX (차단·안내·다음 동선)

통합 스케줄 캘린더 및 일정 상세 모달에서 가예약 건을 다룰 때의 UX 원칙입니다.

- **패턴**: 모든 모달은 반드시 **UnifiedModal** 패턴을 사용합니다.
- **표시 경계 및 방어 로직 참조**: [`docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`](../../../docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md)
- **차단 및 안내**:
  - 타 사용자가 '결제 대기' 중인 슬롯을 클릭할 경우: "현재 다른 사용자가 결제를 진행 중인 일정입니다." 안내 토스트 노출 및 예약 액션 차단.
  - 본인이 '결제 대기' 중인 슬롯을 클릭할 경우: UnifiedModal 오픈 후 하단에 **[결제 마저 하기]** (Primary Button) 노출.
- **다음 동선**: 
  - 모달 내에서 결제 수단(무통장 입금 안내 또는 카드 결제창 호출)으로 바로 진입할 수 있는 Call-to-Action(CTA) 제공.
  - 결제 완료 시 모달 내 상태가 실시간으로 '예약 확정'으로 변경되며 닫기 버튼 활성화.

---

## 4. 접근성 (Accessibility - A11y)

- **스크린 리더 알림 (`aria-live`)**:
  - 결제 완료 등 긍정적/일반적 상태 변화: `aria-live="polite"`를 사용하여 자연스럽게 안내.
  - 결제 시간 초과, 결제 실패 등 즉각적인 조치가 필요한 경고: `aria-live="assertive"`를 사용하여 즉시 읽어주도록 처리.
- **포커스 관리**:
  - UnifiedModal 오픈 시: 첫 번째 입력 필드 또는 하단 [결제 마저 하기] 버튼으로 포커스 자동 이동.
  - 모달 종료 시: 모달을 열었던 캘린더의 해당 슬롯(트리거 요소)으로 포커스 복귀.
- **오류 메시지 톤**:
  - 기계적이거나 위협적인 톤 배제. 명확하고 온화한 톤 유지.
  - *예시*: "결제 시간이 초과되었습니다. 원하시는 일정을 다시 선택해 주세요." (O) / "시간 초과. 예약 불가." (X)

---

## 5. 디자인 토큰 및 시각 스펙 (하드코딩 금지)

- **색상 및 간격 하드코딩 절대 금지**: 모든 색상, 폰트 사이즈, 간격은 반드시 `unified-design-tokens.css` 및 `mindgarden-design-system.pen` (B0KlA 팔레트)에 정의된 토큰을 사용해야 합니다.
- **레이아웃 및 컴포넌트**:
  - 가예약 안내 섹션은 어드민 대시보드 샘플의 **섹션 블록** 스타일(배경 `var(--mg-surface-background)`, 테두리 `var(--mg-border-color)`, 반경 16px)을 따릅니다.
  - 섹션 제목 좌측에는 **세로 악센트 바**(`var(--mg-primary-color)`, 폭 4px, 반경 2px)를 배치하여 시각적 위계를 명확히 합니다.
  - 버튼: 주조 버튼은 `var(--mg-primary-color)` 배경에 `var(--mg-text-inverse)` 텍스트 적용.

---

## 6. core-publisher / core-coder 전달용 요약 (Handoff)

- [ ] **마크업 (core-publisher)**: UnifiedModal 내부에 가예약 상태를 표시하는 Badge 영역과 하단 결제 CTA 버튼 영역을 아토믹 디자인(Molecules/Organisms)에 맞춰 시맨틱하게 마크업해 주세요.
- [ ] **스타일링 (core-publisher)**: CSS 작성 시 절대 HEX 코드나 픽셀 하드코딩을 피하고, `var(--mg-*)` 형태의 `unified-design-tokens`만 사용해 주세요. 섹션 블록과 좌측 악센트 바 UI를 반영해 주세요.
- [ ] **상태 연동 (core-coder)**: 위 2번 항목의 5가지 상태(특히 `TENTATIVE_PENDING_PAYMENT` → `CONFIRMED_PAID`)에 따른 렌더링 분기 처리를 구현해 주세요.
- [ ] **접근성 (core-coder)**: 상태 변경 시 `aria-live` 속성이 동적으로 업데이트되도록 React 상태와 연동하고, 모달 열림/닫힘 시 포커스 트랩 및 복귀 로직을 적용해 주세요.
- [ ] **방어 로직 (core-coder)**: 타인이 선점한 가예약 슬롯 클릭 시 `COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`에 명시된 방어 로직(토스트 노출 및 액션 차단)을 구현해 주세요.