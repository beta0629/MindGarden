/**
 * PublicNotification 단위 테스트
 *
 * - 타입별 role/aria-live 검증
 * - 자동 닫힘(autoDismiss) 동작
 * - Esc 키 닫기
 * - onClose 콜백 호출
 * - 메시지·액션 슬롯 렌더링
 *
 * @author MindGarden
 * @since 2026-06-15
 */
import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
    })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  }
}));

const PublicNotification = require('../PublicNotification').default;
const { NOTIFICATION_TYPES, ARIA_ROLE_MAP } = require('../PublicNotification');

describe('PublicNotification', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with info type by default', () => {
    render(<PublicNotification messageSlot="Test message" />);
    const el = screen.getByTestId('mg-v2-public-notification');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('role', 'status');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  it('renders success type with role=status', () => {
    render(<PublicNotification type="success" messageSlot="Success!" />);
    const el = screen.getByTestId('mg-v2-public-notification');
    expect(el).toHaveAttribute('role', 'status');
    expect(el).toHaveAttribute('aria-live', 'polite');
    expect(el).toHaveClass('mg-v2-public-notification--success');
  });

  it('renders warning type with role=alert', () => {
    render(<PublicNotification type="warning" messageSlot="Warning!" />);
    const el = screen.getByTestId('mg-v2-public-notification');
    expect(el).toHaveAttribute('role', 'alert');
    expect(el).toHaveAttribute('aria-live', 'assertive');
    expect(el).toHaveClass('mg-v2-public-notification--warning');
  });

  it('renders error type with role=alert', () => {
    render(<PublicNotification type="error" messageSlot="Error!" />);
    const el = screen.getByTestId('mg-v2-public-notification');
    expect(el).toHaveAttribute('role', 'alert');
    expect(el).toHaveAttribute('aria-live', 'assertive');
    expect(el).toHaveClass('mg-v2-public-notification--error');
  });

  it('renders messageSlot content', () => {
    render(<PublicNotification messageSlot={<span>Hello World</span>} />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders actionSlot when provided', () => {
    render(
      <PublicNotification
        messageSlot="Msg"
        actionSlot={<button type="button">Undo</button>}
      />
    );
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('does not render actionSlot area when not provided', () => {
    const { container } = render(<PublicNotification messageSlot="Msg" />);
    expect(container.querySelector('.mg-v2-public-notification__action')).not.toBeInTheDocument();
  });

  it('auto-dismisses after autoDismissMs', async () => {
    const onClose = jest.fn();
    render(
      <PublicNotification messageSlot="Auto" autoDismissMs={3000} onClose={onClose} />
    );

    act(() => { jest.advanceTimersByTime(50); });
    act(() => { jest.advanceTimersByTime(3000); });
    act(() => { jest.advanceTimersByTime(300); });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key', () => {
    const onClose = jest.fn();
    render(<PublicNotification messageSlot="Esc test" onClose={onClose} />);

    act(() => { jest.advanceTimersByTime(50); });

    fireEvent.keyDown(document, { key: 'Escape' });

    act(() => { jest.advanceTimersByTime(300); });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on close button click', () => {
    const onClose = jest.fn();
    render(<PublicNotification messageSlot="Close test" onClose={onClose} />);

    const closeBtn = screen.getByLabelText('Close notification');
    fireEvent.click(closeBtn);

    act(() => { jest.advanceTimersByTime(300); });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not auto-dismiss when autoDismissMs is 0', () => {
    const onClose = jest.fn();
    render(
      <PublicNotification messageSlot="No auto" autoDismissMs={0} onClose={onClose} />
    );

    act(() => { jest.advanceTimersByTime(50); });
    act(() => { jest.advanceTimersByTime(10000); });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('has aria-atomic=true', () => {
    render(<PublicNotification messageSlot="Atomic" />);
    const el = screen.getByTestId('mg-v2-public-notification');
    expect(el).toHaveAttribute('aria-atomic', 'true');
  });
});
