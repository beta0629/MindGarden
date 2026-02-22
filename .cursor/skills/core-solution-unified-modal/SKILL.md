---
name: core-solution-unified-modal
description: Core Solution(MindGarden) 모달 컴포넌트 표준. 모든 모달은 UnifiedModal 사용 필수. MgModal/mg-v2-ad-modal 금지.
---

# UnifiedModal 룰

모달을 추가·수정할 때 반드시 이 스킬을 적용하세요.

## 필수

- **UnifiedModal만 사용**: `frontend/src/components/common/modals/UnifiedModal.js` import
- MgModal, MgModal.js, mg-v2-ad-modal, mg-v2-modal, BaseModal, ErpModal 등 기타 모달 사용 금지
- 기존 모달 수정 시 UnifiedModal로 마이그레이션

## UnifiedModal props

- isOpen, onClose, title, subtitle, children, size(small/medium/large/fullscreen), variant, backdropClick, showCloseButton, actions, loading, className

## B0KlA 적용

- 어드민·스케줄·B0KlA 디자인 영역 모달: className="mg-v2-ad-b0kla" 전달

## Reference

- `frontend/src/components/common/modals/UnifiedModal.js`
- ScheduleModal, ScheduleDetailModal (사용 예시)
