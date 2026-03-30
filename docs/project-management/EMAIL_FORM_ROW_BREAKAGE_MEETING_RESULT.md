# 이메일 폼 행 깨짐 — 기획·서브에이전트 회의 결과

**일자**: 2026-03  
**역할**: core-planner (취합·최종 보고)  
**참여**: core-debugger, core-designer, core-publisher, core-component-manager

---

## 1. 회의 목적

- 사용자 보고: 어드민 모달 내 이메일 폼이 여전히 깨져, "중복확인"만 보이고 입력 필드/레이아웃이 깨짐.
- **다른 해결책 검토** 및 **디자이너·퍼블리셔·디버거·컴포넌트매니저** 의견을 반영한 대안 정리 → 권장안 1개 선정 → core-coder 위임.

---

## 2. 서브에이전트 산출 요약

| 담당 | 산출 문서 | 요약 |
|------|-----------|------|
| **core-debugger** | `docs/debug/EMAIL_FORM_ROW_BREAKAGE_ROOT_CAUSE_ANALYSIS.md` | 원인: (A) DOM에 __input-wrap/input 없음 가능성은 코드상 없음 → (B) CSS/레이아웃 가능성 큼. 상위 min-width:0 연쇄 또는 __input-wrap의 min-width 덮어쓰기. 제안: 본문 min-width 280px 강제, __input-wrap min-width 12rem !important(B0KlA), form min-width 검토. |
| **core-designer** | `docs/design-system/ADMIN_MODAL_EMAIL_ROW_LAYOUT_SPEC.md` | 라벨 상단·이메일 행 한 줄(입력 래퍼+버튼). __input-wrap 최소 12rem, min-width:0 금지. 토큰·클래스 역할·반응형 정리. |
| **core-publisher** | `docs/design-system/CLIENT_MODAL_EMAIL_ROW_MARKUP_SPEC.md` | form-group > label + email-row > __input-wrap > input, 형제 button. __input-wrap 필수. 접근성 for/id, data-action. |
| **core-component-manager** | `docs/project-management/EMAIL_ROW_USAGE_CONSISTENCY_REVIEW.md` | 사용처 5곳(ClientModal, StaffManagement, Consultant, TabletRegister, 테스트). 모달 3곳은 구조 일치, TabletRegister만 __input-wrap 미사용. 이메일 행 규칙 단일화·ClientModal 중복 제거·TabletRegister 마크업 정렬 권장. |

---

## 3. 대안 해결책 (1~3)

### 대안 1 — CSS만 강화 (최소 변경)

- **내용**: 모달 본문·입력 래퍼의 min-width를 덮어쓰기당하지 않도록 `!important`로 강제.
- **수정 위치**  
  - `frontend/src/styles/06-components/_unified-modals.css`: `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body { min-width: 280px !important; }`  
  - `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css`: `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row__input-wrap` 에 `min-width: 12rem !important;`
- **장점**: 변경 범위 작음, 즉시 적용 가능.  
- **단점**: B0KlA와 ClientModal.css에 규칙이 중복 유지됨.

### 대안 2 — CSS 단일화 + 강화 (권장)

- **내용**: 이메일 행 규칙을 **한 곳(B0KlA)** 으로 모아 중복 제거하고, min-width 강제 적용. 상담사 모달(ClientModal.css 미로드) 포함 모든 어드민 모달에 동일 규칙 적용.
- **수정 위치**  
  1. `_unified-modals.css`: B0KlA 모달 본문 `min-width: 280px !important` (대안 1과 동일).  
  2. `AdminDashboardB0KlA.css`: `.__input-wrap` 에 `min-width: 12rem !important`, 행·input·버튼 규칙 일원화.  
  3. `ClientModal.css`: 이메일 행 관련 **중복 블록 제거** (B0KlA와 동일한 내용만). 필요한 경우 버튼 compact 등 최소 오버라이드만 유지.
- **장점**: 중복 제거, 캐스케이드·특이도 단순화, 내담자/상담사/스태프 동일 동작.  
- **단점**: ClientModal.css 수정 범위 있음.

### 대안 3 — CSS + 마크업/사용처 일관성

- **내용**: 대안 2까지 수행 후, TabletRegister에 `.__input-wrap` 도입·인라인 스타일 제거, AuthPageCommon.css에 __input-wrap 반영. (선택) 이메일+중복확인 공통 Molecules 컴포넌트 추출.
- **장점**: 전 사용처 구조·스타일 일관성, 재발 방지.  
- **단점**: 작업량·테스트 범위 큼.

---

## 4. 권장안

**권장안: 대안 2 (CSS 단일화 + 강화)**

- 디버거: 원인은 CSS/레이아웃(상위 수축 또는 __input-wrap 덮어쓰기) 가능성이 크므로, 본문·__input-wrap min-width 강제 및 규칙 단일화가 적합.
- 디자이너: __input-wrap 최소 12rem·min-width:0 금지 스펙과 부합.
- 퍼블리셔: 현재 마크업(form-group > label + email-row > __input-wrap > input, 형제 button) 유지, CSS만 정리하면 됨.
- 컴포넌트매니저: 이메일 행 규칙을 한 곳으로 모으면 중복·불일치 제거에 유리.

**즉시 적용 시**: 시간이 촉박하면 **대안 1**만 먼저 적용해 깨짐만 해소한 뒤, 이후 **대안 2**로 정리해도 됨.

---

## 5. core-coder 위임 요약

- **담당**: core-coder  
- **참조**:  
  - `docs/debug/EMAIL_FORM_ROW_BREAKAGE_ROOT_CAUSE_ANALYSIS.md` (§7 수정 제안, §8 태스크 초안)  
  - `docs/design-system/ADMIN_MODAL_EMAIL_ROW_LAYOUT_SPEC.md`  
  - `docs/design-system/CLIENT_MODAL_EMAIL_ROW_MARKUP_SPEC.md`  
  - 본 문서 §3 대안 2.

- **요청 사항**  
  1. `_unified-modals.css`: B0KlA 모달 본문 `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body` 에 `min-width: 280px !important` 적용(다른 모달 레이아웃·스크롤 영향 확인).  
  2. `AdminDashboardB0KlA.css`: `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row__input-wrap` 에 `min-width: 12rem !important` 적용. 기존 이메일 행·input·버튼 규칙 유지.  
  3. `ClientModal.css`: 이메일 행 관련 규칙 중 B0KlA와 **중복되는 부분** 제거. (B0KlA만으로 동일 레이아웃이 나오면 ClientModal 측 __input-wrap/input/button 규칙 정리.)  
  4. 검증: 내담자/상담사/스태프 등록·수정 모달에서 이메일 행 입력란·중복확인 버튼이 한 줄로 정상 노출되는지, DevTools에서 `.__input-wrap` computed min-width 192px(12rem)·`.mg-v2-modal-body` min-width 280px 확인.

상세 태스크·체크리스트는 `EMAIL_FORM_ROW_BREAKAGE_ROOT_CAUSE_ANALYSIS.md` §8·§9 참고.

---

**문서 끝.**
