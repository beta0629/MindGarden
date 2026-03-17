---
name: core-solution-unified-modal
description: Core Solution(MindGarden) 모달 컴포넌트 표준. 모든 모달은 공통 UnifiedModal 사용 필수. 커스텀 오버레이/래퍼 금지.
---

# UnifiedModal 룰 (모달 통일성)

모달을 추가·수정할 때 반드시 이 스킬을 적용하세요. **모든 모달은 통일성을 위해 공통 모달(UnifiedModal)로만 구현**합니다.

## 필수

- **UnifiedModal만 사용**: `frontend/src/components/common/modals/UnifiedModal.js` import
- **커스텀 래퍼 금지**: `mg-v2-modal-overlay`, `mg-v2-ad-b0kla-modal-overlay`, `mg-v2-modal`, `mg-v2-ad-b0kla-modal` 등 별도 오버레이/모달 div 사용 금지. UnifiedModal이 overlay + modal shell 제공.
- MgModal, MgModal.js, mg-v2-ad-modal, BaseModal, ErpModal 등 기타 모달 사용 금지
- 기존 모달 수정 시 **UnifiedModal로 일괄 마이그레이션** (예: MappingCreationModal, VacationModal, MessageSendModal 등)

## UnifiedModal props

- isOpen, onClose, title, subtitle, children, size(small/medium/large/fullscreen), variant, backdropClick, showCloseButton, actions, loading, className

## B0KlA 적용

- 어드민·스케줄·매칭·B0KlA 디자인 영역 모달: **className="mg-v2-ad-b0kla"** 전달. 헤더/바디/액션은 `mg-modal__header`, `mg-modal__body`, `mg-modal__actions`로 통일.

## Reference

- **공통 모듈**: `/core-solution-common-modules` — 모든 모달은 공통 UnifiedModal 사용(공통 모듈 우선 원칙)
- `frontend/src/components/common/modals/UnifiedModal.js`
- `docs/standards/MODAL_STANDARD.md`, `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`
- ScheduleModal (UnifiedModal + className="mg-v2-ad-b0kla"), MappingCreationModal (UnifiedModal 마이그레이션 대상)
