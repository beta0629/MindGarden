/**
 * CoverGuideDenseRow — dense flex 행 · chevron 고정 정사각
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CoverGuideDenseRow from '../CoverGuideDenseRow';

describe('CoverGuideDenseRow', () => {
  test('renders title/body/chevron dense structure as button', () => {
    const onClick = jest.fn();
    const { container } = render(
      <CoverGuideDenseRow
        title="센터 공지"
        body="주차는 지하 1층입니다"
        asButton
        ariaLabel="안내 더보기"
        onClick={onClick}
      />
    );

    const row = screen.getByRole('button', { name: '안내 더보기' });
    expect(row).toHaveClass('cover-guide-dense');
    expect(row.querySelector('.cover-guide-dense__text')).not.toBeNull();
    expect(row.querySelector('.cover-guide-dense__title')).toHaveTextContent('센터 공지');
    expect(row.querySelector('.cover-guide-dense__body')).toHaveTextContent('주차는 지하 1층입니다');
    const go = row.querySelector('.cover-guide-dense__go');
    expect(go).not.toBeNull();
    expect(go).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.cover-guide-dense__go')).toHaveTextContent('›');

    fireEvent.click(row);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('href renders Link with dense classes', () => {
    render(
      <MemoryRouter>
        <CoverGuideDenseRow
          title="방문 전 체크"
          body="10분 전 도착"
          href="/client/schedule"
          ariaLabel="일정으로"
        />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: '일정으로' });
    expect(link).toHaveAttribute('href', '/client/schedule');
    expect(link).toHaveClass('cover-guide-dense');
  });
});
