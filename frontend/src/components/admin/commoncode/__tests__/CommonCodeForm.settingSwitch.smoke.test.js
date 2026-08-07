/**
 * CommonCodeForm — isActive SettingSwitchRow(role=switch) 스모크
 *
 * checkbox 잔여 없이 공통 Switch Atom 으로 토글되는지 검증한다.
 *
 * @author Core Solution
 * @since 2026-08-07
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, actions }) =>
    isOpen ? (
      <div role="dialog">
        <div data-testid="modal-body">{children}</div>
        <div data-testid="modal-actions">{actions}</div>
      </div>
    ) : null
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, type = 'button', form }) => (
    // eslint-disable-next-line react/button-has-type
    <button type={type} onClick={onClick} disabled={disabled} form={form}>
      {children}
    </button>
  )
}));

jest.mock('../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mock-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...'
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, fallback) => (typeof fallback === 'string' ? fallback : key)
  })
}));

import CommonCodeForm from '../CommonCodeForm';

describe('CommonCodeForm — SettingSwitchRow isActive 스모크', () => {
  it('활성 상태를 role=switch 로 렌더하고 checkbox 가 없다', async () => {
    render(
      <CommonCodeForm
        isOpen
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        codeGroups={['PACKAGE_TYPE']}
      />
    );

    const sw = await screen.findByRole('switch', { name: '활성 상태' });
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(sw).toHaveAttribute('id', 'isActive');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('스위치 클릭 시 aria-checked 가 반전된다', async () => {
    render(
      <CommonCodeForm
        isOpen
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        codeGroups={[]}
      />
    );

    const sw = await screen.findByRole('switch', { name: '활성 상태' });
    expect(sw).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(sw);

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: '활성 상태' })).toHaveAttribute(
        'aria-checked',
        'false'
      );
    });
  });
});
