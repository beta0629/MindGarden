/**
 * SchedulePendingList — G1-02 ListTableView·CTA 제한
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SchedulePendingList from '../organisms/SchedulePendingList';

describe('SchedulePendingList G1-02', () => {
  test('행 데이터가 있으면 테이블과 전체 보기 링크 1개만 렌더', () => {
    render(
      <MemoryRouter>
        <SchedulePendingList
          items={[
            { id: '1', clientName: '홍길동', consultantName: '김상담' }
          ]}
          viewAllHref="/admin/schedules"
        />
      </MemoryRouter>
    );

    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('김상담')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '전체 보기' })).toHaveAttribute(
      'href',
      '/admin/schedules'
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('빈 목록이어도 위젯·전체 보기 CTA는 유지', () => {
    render(
      <MemoryRouter>
        <SchedulePendingList items={[]} viewAllHref="/admin/schedules" />
      </MemoryRouter>
    );

    expect(screen.getByText('처리 대기 항목이 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '전체 보기' })).toBeInTheDocument();
  });
});
