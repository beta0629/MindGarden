/**
 * DepositPendingList — G1-02 ListTableView·CTA 제한
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DepositPendingList from '../AdminDashboard/organisms/DepositPendingList';

describe('DepositPendingList G1-02', () => {
  test('행 데이터가 있으면 테이블과 입금 확인 액션을 렌더', () => {
    render(
      <MemoryRouter>
        <DepositPendingList
          items={[
            {
              id: 'MAPPING_DEPOSIT-1',
              sourceType: 'MAPPING_DEPOSIT',
              sourceId: 1,
              clientName: '홍길동',
              amount: 100000,
              status: 'PENDING_PAYMENT'
            }
          ]}
          viewAllHref="/admin/mapping-management"
        />
      </MemoryRouter>
    );

    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('100,000원')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '전체 보기' })).toHaveAttribute(
      'href',
      '/admin/mapping-management'
    );
    expect(screen.getByRole('button', { name: '홍길동 입금 확인' })).toBeInTheDocument();
  });

  test('빈 목록이어도 위젯·전체 보기 CTA는 유지', () => {
    render(
      <MemoryRouter>
        <DepositPendingList items={[]} viewAllHref="/admin/notifications" />
      </MemoryRouter>
    );

    expect(screen.getByText('처리 대기 항목이 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '전체 보기' })).toBeInTheDocument();
  });
});
