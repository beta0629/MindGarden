/**
 * CommonCodeForm — EXPENSE_/INCOME_ 최소 등록 UX
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockImplementation((_url, params) => {
      if (params?.codeGroup === 'EXPENSE_CATEGORY') {
        return Promise.resolve([
          { codeValue: 'OTHER', codeLabel: '기타잡비', isActive: true },
          { codeValue: 'MEAL', codeLabel: '식대', isActive: true }
        ]);
      }
      if (params?.codeGroup === 'COMMON_CODE_GROUP') {
        return Promise.resolve([
          { codeValue: 'EXPENSE_CATEGORY', codeLabel: '지출 카테고리' },
          { codeValue: 'EXPENSE_SUBCATEGORY', codeLabel: '지출 세부' },
          { codeValue: 'PACKAGE_TYPE', codeLabel: '패키지 유형' }
        ]);
      }
      return Promise.resolve([]);
    })
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

describe('CommonCodeForm — EXPENSE 최소 등록 UX', () => {
  it('EXPENSE_CATEGORY 생성: 표시 이름만 보이고 정렬/활성/추가JSON 은 숨긴다', async () => {
    render(
      <CommonCodeForm
        isOpen
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        codeGroups={['EXPENSE_CATEGORY', 'PACKAGE_TYPE']}
      />
    );

    const groupSelect = await screen.findByRole('combobox', { name: /^코드 그룹/ });
    fireEvent.change(groupSelect, { target: { value: 'EXPENSE_CATEGORY' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/^표시 이름/)).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('저장 시 자동으로 발급됩니다')).toBeDisabled();
    expect(screen.queryByLabelText('정렬 순서')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: '활성 상태' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/추가 데이터/)).not.toBeInTheDocument();
  });

  it('EXPENSE_SUBCATEGORY 생성: 상위 카테고리 필수 필드가 보인다', async () => {
    render(
      <CommonCodeForm
        isOpen
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        codeGroups={['EXPENSE_SUBCATEGORY']}
      />
    );

    const groupSelect = await screen.findByRole('combobox', { name: /^코드 그룹/ });
    fireEvent.change(groupSelect, { target: { value: 'EXPENSE_SUBCATEGORY' } });

    expect(await screen.findByLabelText(/^상위 카테고리/)).toBeRequired();
    expect(screen.getByLabelText(/^표시 이름/)).toBeInTheDocument();
    expect(screen.queryByLabelText('정렬 순서')).not.toBeInTheDocument();
  });
});
