import { useEffect } from 'react';

const ESCAPE_KEY = 'Escape';
const PRIMARY_MOUSE_BUTTON = 0;
const FC_ACTIVE_DRAG_SELECTOR = '.fc-event-dragging, .fc-event-mirror';

/**
 * 드래그 중 Escape 취소 (FullCalendar 일정 이동·리사이즈·외부 카드 드롭 공통).
 * FullCalendar 는 진행 중 드래그를 끊는 공개 API 가 없으므로, 포인터를 캘린더 밖으로 옮긴 뒤 놓는
 * 마우스 이벤트를 합성한다. FullCalendar 가 "밖에 놓음"으로 처리해 원위치로 되돌리고
 * eventDrop·eventResize·eventReceive 는 호출되지 않는다.
 */
const useCalendarDragEscapeCancel = () => {
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return undefined;
    }
    let mouseHeld = false;

    const handleMouseDown = () => {
      mouseHeld = true;
    };
    const handleMouseUp = () => {
      mouseHeld = false;
    };
    const dispatchOutside = (type) => {
      const outsideX = -1 - window.scrollX;
      const outsideY = -1 - window.scrollY;
      document.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button: PRIMARY_MOUSE_BUTTON,
        clientX: outsideX,
        clientY: outsideY
      }));
    };
    const handleKeyDown = (event) => {
      if (event.key !== ESCAPE_KEY || !mouseHeld) {
        return;
      }
      if (!document.querySelector(FC_ACTIVE_DRAG_SELECTOR)) {
        return;
      }
      event.preventDefault();
      dispatchOutside('mousemove');
      dispatchOutside('mouseup');
    };

    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);
};

export default useCalendarDragEscapeCancel;
