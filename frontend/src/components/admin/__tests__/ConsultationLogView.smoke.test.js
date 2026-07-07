/**
 * ConsultationLogView — G-14 P0 header dedup 스모크 테스트.
 * ACL title 생략, ContentHeader SSOT는 ConsultationLogViewPage 내부.
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="admin-common-layout" data-title={title ?? ''}>
      {children}
    </div>
  )
}));

jest.mock('../consultation-log-view/ConsultationLogViewPage', () => ({
  __esModule: true,
  default: () => <div data-testid="consultation-log-view-page-stub" />
}));

import ConsultationLogView from '../ConsultationLogView';

describe('ConsultationLogView (G-14 P0 header dedup)', () => {
  test('AdminCommonLayout title 생략 및 b0kla 컨테이너·본문 mount', () => {
    const { container } = render(<ConsultationLogView />);

    expect(screen.getByTestId('admin-common-layout')).toBeInTheDocument();
    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', '');
    expect(screen.getByTestId('consultation-log-view-page-stub')).toBeInTheDocument();
    expect(container.querySelector('.mg-v2-ad-b0kla__container')).toBeInTheDocument();
  });
});
