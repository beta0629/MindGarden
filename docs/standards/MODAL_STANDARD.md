# 모달 표준 (UnifiedModal)

> 모든 모달은 UnifiedModal 사용. MgModal/mg-v2-ad-modal 사용 금지.  
> @author MindGarden | @since 2025-02-23

## 개요

모달은 **UnifiedModal** 컴포넌트를 사용합니다.  
MgModal, mg-v2-ad-modal, mg-v2-modal, BaseModal, ErpModal 등 기타 모달 사용을 금지합니다.

## size 옵션

| size | max-width | 용도 |
|------|-----------|------|
| **fullscreen** | 100% | 전체 화면 모달 |
| **large** | 900px+ | 다단계 폼, 매칭 생성 등 큰 모달 |
| **medium** | 600px | 상세 정보, 리스트 선택, 폼 |
| **small** | 400px | 확인 다이얼로그, 날짜 선택 |

## 사용법

```jsx
import UnifiedModal from '@/components/common/modals/UnifiedModal';

// 1. 기본 (title + subtitle)
<UnifiedModal isOpen={open} onClose={close} title="제목" subtitle="부제목" size="medium">
  <p>본문 내용</p>
</UnifiedModal>

// 2. 소형 확인 모달
<UnifiedModal
  isOpen={open}
  onClose={close}
  title="확인"
  size="small"
  actions={
    <>
      <button className="mg-v2-btn--outline" onClick={close}>취소</button>
      <button className="mg-v2-btn--primary" onClick={handleConfirm}>확인</button>
    </>
  }
>
  <p>정말 삭제하시겠습니까?</p>
</UnifiedModal>

// 3. B0KlA 영역 (어드민·스케줄)
<UnifiedModal
  isOpen={open}
  onClose={close}
  title="매칭 상세"
  size="large"
  className="mg-v2-ad-b0kla"
>
  내용
</UnifiedModal>
```

## UnifiedModal Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| isOpen | boolean | false | 모달 표시 여부 |
| onClose | function | — | 닫기 핸들러 |
| children | node | — | 본문 내용 |
| title | string | '' | 헤더 제목 |
| subtitle | string | '' | 헤더 부제목 |
| size | 'small' \| 'medium' \| 'large' \| 'fullscreen' | 'medium' | 모달 크기 |
| variant | string | 'default' | 모달 타입 (default, confirm, form, detail, alert) |
| backdropClick | boolean | true | 배경 클릭 시 닫기 |
| showCloseButton | boolean | true | 닫기 버튼 표시 |
| actions | node | — | 푸터 액션 버튼들 |
| loading | boolean | false | 로딩 상태 |
| className | string | '' | 추가 CSS 클래스 |
| zIndex | number | — | z-index (중첩 모달용) |

## 금지

- **MgModal** (`frontend/src/components/ui/MgModal`)
- **mg-v2-ad-modal**, **mg-v2-modal** 직접 div 구현
- **BaseModal**, **ErpModal** (UnifiedModal로 대체)

## 참조

- 컴포넌트: `frontend/src/components/common/modals/UnifiedModal.js`
- 스타일: `frontend/src/styles/main.css` (mg-modal-* 클래스)
- 스킬: `/core-solution-unified-modal`
- 사용 예: ScheduleModal, ScheduleDetailModal, DateActionModal, TimeSelectionModal
