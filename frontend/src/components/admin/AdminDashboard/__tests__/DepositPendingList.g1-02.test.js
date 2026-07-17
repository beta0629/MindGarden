/**
 * DepositPendingList — G1-02 ListTableView·CTA 제한
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DepositPendingList from '../organisms/DepositPendingList';

describe('DepositPendingList G1-02', () => {
  test('최초 결제와 회기 추가를 공통 행으로 표시하고 출처별 액션을 전달', () => {
    const handleAction = jest.fn();
    render(
      <MemoryRouter>
        <DepositPendingList
          items={[
            {
              id: 'MAPPING_DEPOSIT-1',
              sourceType: 'MAPPING_DEPOSIT',
              sourceId: 1,
              clientName: '홍길동',
              consultantName: '김상담',
              amount: 100000,
              status: 'PENDING_PAYMENT'
            },
            {
              id: 'SESSION_EXTENSION-2',
              sourceType: 'SESSION_EXTENSION',
              sourceId: 2,
              clientName: '이내담',
              consultantName: '박상담',
              amount: 200000,
              additionalSessions: 4,
              status: 'PENDING'
            }
          ]}
          onItemAction={handleAction}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('100,000원')).toBeInTheDocument();
    expect(screen.getByText('최초 결제')).toBeInTheDocument();
    expect(screen.getByText('회기 추가')).toBeInTheDocument();
    expect(screen.getByText('+4회기')).toBeInTheDocument();
    expect(screen.getByText('박상담')).toBeInTheDocument();
    expect(screen.getByText('회기 추가').closest('td')).toBe(
      screen.getByText('이내담').closest('td')
    );
    expect(screen.getByText('200,000원').closest('td')).not.toHaveClass(
      'mg-v2-list-block__col--hide-mobile'
    );
    expect(screen.getAllByRole('button', { name: /입금 확인/ })[0]).toHaveTextContent('확인하기');

    screen.getByRole('button', { name: '이내담 입금 확인' }).click();
    expect(handleAction).toHaveBeenCalledWith(
      expect.objectContaining({ sourceType: 'SESSION_EXTENSION', sourceId: 2 })
    );
  });

  test('회기 추가 행에 취소 버튼을 노출하고 onItemCancel을 전달한다', () => {
    const handleCancel = jest.fn();
    const { container } = render(
      <MemoryRouter>
        <DepositPendingList
          items={[
            {
              id: 'SESSION_EXTENSION-2',
              sourceType: 'SESSION_EXTENSION',
              sourceId: 2,
              clientName: '이내담',
              consultantName: '박상담',
              amount: 200000,
              additionalSessions: 4,
              status: 'PENDING'
            }
          ]}
          onItemAction={jest.fn()}
          onItemCancel={handleCancel}
        />
      </MemoryRouter>
    );

    expect(container.querySelector('.deposit-pending-list__actions')).toBeTruthy();
    expect(container.querySelectorAll('.deposit-pending-list__table th')).toHaveLength(3);
    screen.getByRole('button', { name: '이내담 회기 추가 요청 취소' }).click();
    expect(handleCancel).toHaveBeenCalledWith(
      expect.objectContaining({ sourceType: 'SESSION_EXTENSION', sourceId: 2 })
    );
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
