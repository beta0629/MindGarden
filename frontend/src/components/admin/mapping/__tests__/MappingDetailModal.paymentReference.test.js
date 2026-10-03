/**
 * MappingDetailModal — 결제 정보 탭의 결제 참조(승인)번호 행은 카드 결제일 때만 노출.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('react-i18next', () => {
  const stableT = (key) => key;
  return {
    __esModule: true,
    useTranslation: () => ({ t: stableT })
  };
});

const mockApiGet = jest.fn();
jest.mock('../../../../utils/ajax', () => ({
  __esModule: true,
  apiGet: (...args) => mockApiGet(...args)
}));

jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children }) => (isOpen ? <div role="dialog">{children}</div> : null)
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => <button type="button" onClick={onClick}>{children}</button>
}));

import MappingDetailModal from '../MappingDetailModal';

const PAYMENT_TAB_KEY = 'admin:MappingDetailModal.t_cc4993c8';
const REFERENCE_LABEL_KEY = 'admin:MappingDetailModal.t_45e5e4dd';

const baseMapping = {
  id: 501,
  packageName: 'pkg',
  packagePrice: 100000,
  paymentAmount: 100000,
  paymentReference: 'REF-501'
};

const openPaymentTab = async (mapping) => {
  render(<MappingDetailModal isOpen onClose={jest.fn()} mapping={mapping} />);
  await waitFor(() => expect(mockApiGet).toHaveBeenCalled());
  fireEvent.click(await screen.findByText(PAYMENT_TAB_KEY));
};

describe('MappingDetailModal — 결제 참조번호 행', () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockApiGet.mockResolvedValue({ success: false });
  });

  test.each(['CREDIT_CARD', 'CARD', 'CARD_TERMINAL', 'DEBIT_CARD'])(
    '%s 결제는 참조번호 행 표시',
    async (paymentMethod) => {
      await openPaymentTab({ ...baseMapping, paymentMethod });
      expect(screen.getByTestId('mapping-detail-payment-reference')).toHaveTextContent('REF-501');
      expect(screen.getByText(REFERENCE_LABEL_KEY)).toBeInTheDocument();
    }
  );

  test.each(['CASH', 'BANK_TRANSFER', 'OTHER'])(
    '%s 결제는 참조번호 행 자체를 숨김',
    async (paymentMethod) => {
      await openPaymentTab({ ...baseMapping, paymentMethod });
      expect(screen.queryByTestId('mapping-detail-payment-reference')).toBeNull();
      expect(screen.queryByText(REFERENCE_LABEL_KEY)).toBeNull();
      expect(screen.queryByText('REF-501')).toBeNull();
    }
  );
});
