/**
 * 어드민 수동 발송 폼 — 수신자 검색 debounce·API 파라미터 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-06-26
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';

jest.mock('../../../../i18n', () => ({
  __esModule: true,
  default: { t: (key) => key }
}));

jest.mock('../../../../api/admin/manualNotificationApi', () => {
  const actual = jest.requireActual('../../../../api/admin/manualNotificationApi');
  return {
    __esModule: true,
    ...actual,
    searchRecipients: jest.fn().mockResolvedValue([]),
    fetchCommonCodeTemplates: jest.fn().mockResolvedValue([]),
    fetchLiveTemplates: jest.fn().mockResolvedValue([]),
    sendSmsBatch: jest.fn(),
    sendAlimtalkBatch: jest.fn(),
    sendPushBatch: jest.fn()
  };
});

jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children }) => (isOpen ? <div role="dialog">{children}</div> : null)
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, type = 'button' }) => (
    // eslint-disable-next-line react/button-has-type
    <button type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}));

jest.mock('../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mock-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...'
}));

jest.mock('../../../common/BadgeSelect', () => ({
  __esModule: true,
  default: ({ options = [], value, onChange, 'aria-label': ariaLabel }) => (
    <div role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={String(value) === String(opt.value)}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, defOrOpts, opts) => {
      const hasDefault = typeof defOrOpts === 'string';
      const variables = hasDefault ? (opts || {}) : (defOrOpts || {});
      const fallback = hasDefault
        ? defOrOpts
        : (variables.defaultValue || key);
      return Object.entries(variables).reduce(
        (acc, [name, value]) => acc.replace(new RegExp(`{{${name}}}`, 'g'), String(value)),
        fallback
      );
    }
  })
}));

import { searchRecipients } from '../../../../api/admin/manualNotificationApi';
import ManualNotificationForm from '../ManualNotificationForm';

describe('ManualNotificationForm — 수신자 검색', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('한글 검색어 입력 시 searchRecipients에 search 파라미터로 전달된다', async() => {
    render(<ManualNotificationForm onBatchSent={jest.fn()} />);

    const searchInput = document.getElementById('mg-manual-notif-recipient-search');
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: '이' } });

    await waitFor(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(searchRecipients).toHaveBeenCalledWith({ search: '이' });
    });
  });
});
