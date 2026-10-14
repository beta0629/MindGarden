/**
 * 드래그 중 Escape 취소 — 캘린더 밖 mousemove·mouseup 합성 계약 (#1486 후속).
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import useCalendarDragEscapeCancel from '../useCalendarDragEscapeCancel';

const Host = () => {
  useCalendarDragEscapeCancel();
  return <div data-testid="host" />;
};

describe('useCalendarDragEscapeCancel', () => {
  let received;
  let mirror;
  const record = (event) => {
    if (!event.isTrusted) {
      received.push({ type: event.type, x: event.clientX, y: event.clientY });
    }
  };

  beforeEach(() => {
    received = [];
    mirror = null;
    document.addEventListener('mousemove', record);
    document.addEventListener('mouseup', record);
  });

  afterEach(() => {
    document.removeEventListener('mousemove', record);
    document.removeEventListener('mouseup', record);
    if (mirror) {
      mirror.remove();
    }
  });

  const startDrag = (className) => {
    mirror = document.createElement('div');
    mirror.className = className;
    document.body.appendChild(mirror);
    fireEvent.mouseDown(document.body);
    received = [];
  };

  test.each(['fc-event-dragging', 'fc-event-mirror'])(
    '드래그 표식(%s)이 있고 누른 채 Escape → 캘린더 밖 mousemove 후 mouseup 합성',
    (className) => {
      render(<Host />);
      startDrag(className);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(received.map((e) => e.type)).toEqual(['mousemove', 'mouseup']);
      received.forEach((e) => {
        expect(e.x).toBeLessThan(0);
        expect(e.y).toBeLessThan(0);
      });
    }
  );

  test('합성 mouseup 이후 Escape 재입력은 아무것도 합성하지 않는다(중복 취소 없음)', () => {
    render(<Host />);
    startDrag('fc-event-dragging');
    fireEvent.keyDown(document, { key: 'Escape' });
    received = [];
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(received).toEqual([]);
  });

  test('드래그 표식이 없으면(일반 클릭 중) Escape 를 가로채지 않는다', () => {
    render(<Host />);
    fireEvent.mouseDown(document.body);
    received = [];
    const notPrevented = fireEvent.keyDown(document, { key: 'Escape' });
    expect(received).toEqual([]);
    expect(notPrevented).toBe(true);
  });

  test('마우스를 놓은 뒤(되돌림 애니메이션 중)에는 Escape 를 무시한다', () => {
    render(<Host />);
    startDrag('fc-event-dragging');
    fireEvent.mouseUp(document.body);
    received = [];
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(received).toEqual([]);
  });

  test('Escape 외 키는 무시한다', () => {
    render(<Host />);
    startDrag('fc-event-dragging');
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(received).toEqual([]);
  });

  test('언마운트 후에는 리스너가 남지 않는다', () => {
    const { unmount } = render(<Host />);
    unmount();
    startDrag('fc-event-dragging');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(received).toEqual([]);
  });
});
