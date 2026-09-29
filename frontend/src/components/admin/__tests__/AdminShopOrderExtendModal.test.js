import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import AdminShopOrderExtendModal from '../shop/AdminShopOrderExtendModal';
import {
  ADMIN_SHOP_EXTEND_COPY,
  ADMIN_SHOP_LEDGER_STATE,
  ADMIN_SHOP_SUITE_TEST_IDS,
  formatAdminShopCopy
} from '../../../constants/adminShopSuite';

const ITEM = Object.freeze({
  orderPublicId: 'ord-1',
  shortId: '#ORD1',
  state: ADMIN_SHOP_LEDGER_STATE.PAID,
  expireDate: '2026-12-28',
  extensionCount: 0
});

const renderModal = (props = {}) => render(
  <AdminShopOrderExtendModal
    isOpen
    item={ITEM}
    history={[]}
    historyLoading={false}
    onClose={jest.fn()}
    onSubmit={jest.fn()}
    submitting={false}
    {...props}
  />
);

describe('AdminShopOrderExtendModal', () => {
  test('reason is required before saving', () => {
    const onSubmit = jest.fn();
    renderModal({ onSubmit });
    fireEvent.click(screen.getByText(formatAdminShopCopy(ADMIN_SHOP_EXTEND_COPY.QUICK_MONTH, { months: 3 })));
    const save = screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.EXTEND_SAVE);
    expect(save).toBeDisabled();
    fireEvent.click(save);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('month chip sets the new date from the current expiry and submits date + reason', () => {
    const onSubmit = jest.fn();
    renderModal({ onSubmit });
    fireEvent.click(screen.getByText(formatAdminShopCopy(ADMIN_SHOP_EXTEND_COPY.QUICK_MONTH, { months: 3 })));
    expect(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.EXTEND_DATE)).toHaveValue('2027-03-28');
    fireEvent.change(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.EXTEND_REASON), { target: { value: '  입원 치료  ' } });
    fireEvent.click(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.EXTEND_SAVE));
    expect(onSubmit).toHaveBeenCalledWith({ newExpireDate: '2027-03-28', reason: '입원 치료' });
  });

  test('a date on or before the current expiry cannot be saved', () => {
    const onSubmit = jest.fn();
    renderModal({ onSubmit });
    fireEvent.change(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.EXTEND_DATE), { target: { value: '2026-12-28' } });
    fireEvent.change(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.EXTEND_REASON), { target: { value: '사유' } });
    expect(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.EXTEND_SAVE)).toBeDisabled();
  });
});
