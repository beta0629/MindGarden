/**
 * AccountForm — isPrimary/isActive SettingSwitchRow(role=switch) 스모크
 *
 * @author Core Solution
 * @since 2026-08-07
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

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

import AccountForm from '../AccountForm';

describe('AccountForm — SettingSwitchRow 스모크', () => {
  const baseFormData = {
    bankName: 'KB',
    accountNumber: '123',
    accountHolder: '테스트',
    description: '',
    isPrimary: false,
    isActive: true
  };

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => []
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('기본/활성 스위치를 role=switch 로 렌더하고 checkbox 가 없다', async () => {
    const onFormDataChange = jest.fn();
    render(
      <AccountForm
        showForm
        editingAccount={null}
        formData={baseFormData}
        loading={false}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        onBankChange={jest.fn()}
        onFormDataChange={onFormDataChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: '기본 계좌로 설정' })).toHaveAttribute(
        'aria-checked',
        'false'
      );
    });
    expect(screen.getByRole('switch', { name: '활성 상태' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('활성 스위치 클릭 시 onFormDataChange(isActive, false) 를 호출한다', async () => {
    const onFormDataChange = jest.fn();
    render(
      <AccountForm
        showForm
        editingAccount={null}
        formData={baseFormData}
        loading={false}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        onBankChange={jest.fn()}
        onFormDataChange={onFormDataChange}
      />
    );

    const activeSw = await screen.findByRole('switch', { name: '활성 상태' });
    fireEvent.click(activeSw);

    expect(onFormDataChange).toHaveBeenCalledWith('isActive', false);
  });
});
