/**
 * 자격 증명 변경 호스트 — 닫기 경고와 성공 후 onClose 무시.
 *
 * @author CoreSolution
 * @since 2026-10-19
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '../../../i18n';
import PasswordChangeRequiredHost from '../PasswordChangeRequiredHost';
import { PASSWORD_CHANGE_REQUIRED_EVENT } from '../../../constants/passwordChangeRequired';
import notificationManager from '../../../utils/notification';

jest.mock('../../mypage/components/PasswordChangeModal', () => {
  const ReactActual = require('react');
  function MockPasswordChangeModal({ isOpen, onSuccess, onClose, tempPassword }) {
    if (!isOpen) {
      return null;
    }
    return ReactActual.createElement(
      'div',
      {
        role: 'dialog',
        'data-temp-password-passed': tempPassword ? 'yes' : 'no'
      },
      ReactActual.createElement(
        'button',
        { type: 'button', onClick: onClose },
        'close'
      ),
      ReactActual.createElement(
        'button',
        {
          type: 'button',
          onClick: () => {
            onSuccess();
            onClose();
          }
        },
        'success'
      )
    );
  }
  return {
    __esModule: true,
    default: MockPasswordChangeModal
  };
});

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: {
    show: jest.fn()
  }
}));

const CHANGE_REQUIRED_MESSAGE = '비밀번호를 변경한 뒤에 계속할 수 있습니다.';

const openHost = () => {
  render(<PasswordChangeRequiredHost />);
  act(() => {
    window.dispatchEvent(new CustomEvent(PASSWORD_CHANGE_REQUIRED_EVENT));
  });
};

describe('PasswordChangeRequiredHost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('닫으면 변경 필요 경고를 보여 준다', () => {
    openHost();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'close' }));

    expect(notificationManager.show).toHaveBeenCalledWith(CHANGE_REQUIRED_MESSAGE, 'warning');
    expect(screen.getByRole('dialog')).toHaveAttribute('data-temp-password-passed', 'yes');
  });

  test('성공 뒤 onClose 는 경고를 보여 주지 않는다', () => {
    openHost();

    fireEvent.click(screen.getByRole('button', { name: 'success' }));

    expect(notificationManager.show).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
