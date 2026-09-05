/**
 * ConsultationLogView — G-14 P0 header dedup 스모크 테스트.
 * ACL title 생략, ContentHeader SSOT는 ConsultationLogViewPage 내부.
 * Clinic-OS: B0KlA 셸 제거 후 page 직결.
 *
 * @author Core Solution
 * @since 2026-07-07
 * @updated 2026-09-05 — Clinic-OS chrome
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
  test('AdminCommonLayout title 생략 및 Clinic-OS page 직결 mount', () => {
    const { container } = render(<ConsultationLogView />);

    expect(screen.getByTestId('admin-common-layout')).toBeInTheDocument();
    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', '');
    expect(screen.getByTestId('consultation-log-view-page-stub')).toBeInTheDocument();
    expect(container.querySelector('.mg-v2-ad-b0kla')).not.toBeInTheDocument();
    expect(container.querySelector('.mg-v2-ad-b0kla__container')).not.toBeInTheDocument();
  });
});
