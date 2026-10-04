/**
 * UnifiedNotification 토스트 — 닫기 버튼(전용 아이콘 버튼)·자동 닫힘 시간·hover/focus 일시정지·진행바
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

jest.mock('react-i18next', () => {
  const ko = jest.requireActual('../../../locales/ko/common.json');
  const lookup = (key) => key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), ko);
  return {
    __esModule: true,
    useTranslation: () => ({ t: (key) => lookup(key) ?? key, i18n: { language: 'ko' } }),
    initReactI18next: { type: '3rdParty', init: jest.fn() }
  };
});

jest.mock('../../../utils/apiCache', () => ({
  __esModule: true,
  cachedApiCall: jest.fn().mockResolvedValue({}),
  CACHE_CONFIG: { COMMON_CODES: { ttl: 0 } }
}));

jest.mock('../../../utils/ajax', () => ({
  __esModule: true,
  apiGet: jest.fn()
}));

jest.mock('../../../styles/main.css', () => ({}));

// eslint-disable-next-line import/first
import UnifiedNotification from '../UnifiedNotification';
// eslint-disable-next-line import/first
import notificationManager from '../../../utils/notification';

const ERROR_MS = 5000;

const renderToast = () => render(<UnifiedNotification type="toast" position="top-right" />);

const showToast = (message, type = 'error', duration) => {
  act(() => {
    notificationManager.show(message, type, duration);
  });
};

const advance = (ms) => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

describe('UnifiedNotification toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    notificationManager.recentByKey.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('닫기 버튼은 MGButton 이 아닌 전용 아이콘 버튼, aria-label="닫기", 클릭하면 사라짐', () => {
    renderToast();
    showToast('닫기 테스트');
    const close = screen.getByRole('button', { name: '닫기' });
    expect(close.tagName).toBe('BUTTON');
    expect(close).toHaveClass('mg-notification-close');
    expect(close).not.toHaveClass('mg-button');
    expect(close).toHaveAttribute('data-gnb-chrome-free', 'true');
    expect(close.querySelector('svg')).not.toBeNull();
    expect(close.textContent).toBe('');
    fireEvent.click(close);
    expect(screen.queryByText('닫기 테스트')).toBeNull();
  });

  test('오류 토스트는 duration 없이도 5초 유지 후 닫힘', () => {
    renderToast();
    showToast('오류 5초');
    advance(ERROR_MS - 1);
    expect(screen.getByText('오류 5초')).toBeInTheDocument();
    advance(1);
    expect(screen.queryByText('오류 5초')).toBeNull();
  });

  test('명시 duration 은 그대로 쓴다', () => {
    renderToast();
    showToast('명시 1500', 'info', 1500);
    advance(1499);
    expect(screen.getByText('명시 1500')).toBeInTheDocument();
    advance(1);
    expect(screen.queryByText('명시 1500')).toBeNull();
  });

  test('진행바는 실제 duration 을 CSS 변수로 받는다', () => {
    renderToast();
    showToast('진행바');
    const bar = document.querySelector('.mg-notification-progress-bar');
    expect(bar.style.getPropertyValue('--notification-progress-duration')).toBe(`${ERROR_MS}ms`);
  });

  test('hover 동안 타이머·진행바가 멈추고, 떠나면 남은 시간만큼 더 보인다', () => {
    renderToast();
    showToast('hover 정지');
    const toast = screen.getByTestId('mg-notification-toast');
    advance(2000);
    fireEvent.mouseEnter(toast);
    expect(toast).toHaveClass('mg-notification--paused');
    advance(ERROR_MS * 3);
    expect(screen.getByText('hover 정지')).toBeInTheDocument();
    fireEvent.mouseLeave(toast);
    expect(toast).not.toHaveClass('mg-notification--paused');
    advance(ERROR_MS - 2000 - 1);
    expect(screen.getByText('hover 정지')).toBeInTheDocument();
    advance(1);
    expect(screen.queryByText('hover 정지')).toBeNull();
  });

  test('키보드 focus 동안에도 멈춘다', () => {
    renderToast();
    showToast('focus 정지');
    const close = screen.getByRole('button', { name: '닫기' });
    act(() => {
      close.focus();
    });
    advance(ERROR_MS * 2);
    expect(screen.getByText('focus 정지')).toBeInTheDocument();
    act(() => {
      close.blur();
    });
    advance(ERROR_MS);
    expect(screen.queryByText('focus 정지')).toBeNull();
  });

  test('같은 메시지가 연달아 와도 토스트는 하나', () => {
    renderToast();
    showToast('중복 오류');
    showToast('중복 오류');
    expect(screen.getAllByText('중복 오류')).toHaveLength(1);
  });
});
