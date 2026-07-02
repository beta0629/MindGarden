/**
 * MappingCard — detailed variant Primary 1 + overflow SSOT
 *
 * @author CoreSolution
 * @since 2026-07-02
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MappingCard from '../MappingCard';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => {
      const labels = {
        'common.labels.consultant': '상담사',
        'common.labels.client': '내담자',
        'admin.actions.paymentConfirm': '결제 확인',
        'common.actions.edit': '수정'
      };
      return labels[key] || key;
    }
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../common/Avatar', () => ({
  __esModule: true,
  default: ({ displayName }) => <span data-testid="avatar">{displayName}</span>
}));

jest.mock('../../../admin/mapping/MappingPaymentModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../../admin/mapping/MappingDepositModal', () => ({
  __esModule: true,
  default: () => null
}));

const BASE_MAPPING = {
  id: 99,
  status: 'ACTIVE',
  consultantName: '김상담',
  clientName: '이내담',
  packageName: '기본 패키지',
  packagePrice: 100000,
  createdAt: '2026-01-01T00:00:00.000Z'
};

describe('MappingCard detailed Primary1+overflow', () => {
  it('renders footer with overflow only when no workflow primary exists', () => {
    render(
      <MappingCard
        mapping={BASE_MAPPING}
        onView={jest.fn()}
        onEdit={jest.fn()}
        onRefund={jest.fn()}
      />
    );

    expect(screen.getByRole('group', { name: '매칭 작업' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '더보기' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '결제 확인' })).not.toBeInTheDocument();
  });

  it('renders workflow primary CTA and overflow for pending payment', () => {
    render(
      <MappingCard
        mapping={{ ...BASE_MAPPING, status: 'PENDING_PAYMENT' }}
        onView={jest.fn()}
        onEdit={jest.fn()}
        onConfirmPayment={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: '결제 확인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '더보기' })).toBeInTheDocument();
  });

  it('does not trigger card view when footer primary is clicked', () => {
    const onView = jest.fn();
    render(
      <MappingCard
        mapping={{ ...BASE_MAPPING, status: 'PENDING_PAYMENT' }}
        onView={onView}
        onEdit={jest.fn()}
        onConfirmPayment={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '결제 확인' }));
    expect(onView).not.toHaveBeenCalled();
  });

  it('keeps compact variant unchanged without footer primary layout', () => {
    render(
      <MappingCard
        variant="compact"
        id={7}
        consultantName="김상담"
        status="ACTIVE"
        onViewDetail={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: '결제 확인' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '더보기' })).toBeInTheDocument();
  });
});
