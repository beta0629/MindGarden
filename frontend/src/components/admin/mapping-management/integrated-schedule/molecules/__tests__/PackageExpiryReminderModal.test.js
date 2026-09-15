/**
 * PackageExpiryReminderModal — 회기권 만료 임박 제목 분리 테스트
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PackageExpiryReminderModal from '../PackageExpiryReminderModal';
import {
  PACKAGE_EXPIRY_REMINDER_CONFIRM_LABEL,
  PACKAGE_EXPIRY_REMINDER_LAST_SESSION_HINT,
  PACKAGE_EXPIRY_REMINDER_SECTION_TITLE,
  PACKAGE_EXPIRY_REMINDER_TITLE
} from '../../constants/packageExpiryReminderConstants';

jest.mock('../../../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, children, actions, onClose }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <h1>{title}</h1>
        <div>{children}</div>
        <div>{actions}</div>
        <button type="button" onClick={onClose}>dismiss</button>
      </div>
    ) : null
}));

jest.mock('../../../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, type = 'button', 'aria-label': ariaLabel }) => (
    // eslint-disable-next-line react/button-has-type
    <button type={type} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  )
}));

jest.mock('../../../../../erp/common/erpMgButtonProps', () => ({
  buildErpMgButtonClassName: () => 'mg-v2-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중'
}));

describe('PackageExpiryReminderModal', () => {
  it('uses a title distinct from the special-notes reminder', () => {
    render(
      <PackageExpiryReminderModal
        isOpen
        onClose={jest.fn()}
        clientName="홍길동"
        consultantName="김상담"
        startTimeLabel="10:00 상담"
        remainingSessions={1}
        totalSessions={10}
      />
    );

    expect(screen.getByRole('dialog', { name: PACKAGE_EXPIRY_REMINDER_TITLE })).toBeInTheDocument();
    expect(screen.getByText(PACKAGE_EXPIRY_REMINDER_TITLE)).toBeInTheDocument();
    expect(screen.queryByText('곧 상담이 시작됩니다')).not.toBeInTheDocument();
    expect(screen.queryByText('내담자 특이사항')).not.toBeInTheDocument();
    expect(screen.getByText(PACKAGE_EXPIRY_REMINDER_SECTION_TITLE)).toBeInTheDocument();
    expect(screen.getByText(PACKAGE_EXPIRY_REMINDER_LAST_SESSION_HINT)).toBeInTheDocument();
  });

  it('calls onClose from confirm action', () => {
    const onClose = jest.fn();
    render(
      <PackageExpiryReminderModal
        isOpen
        onClose={onClose}
        remainingSessions={2}
        totalSessions={8}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: PACKAGE_EXPIRY_REMINDER_CONFIRM_LABEL }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
