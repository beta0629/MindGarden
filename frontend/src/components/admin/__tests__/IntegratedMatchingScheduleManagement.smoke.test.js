/**
 * IntegratedMatchingScheduleManagement — AdminCommonLayout 스모크 테스트 (G-14 P0).
 * ACL title 생략, ContentHeader SSOT는 IntegratedMatchingSchedule 내부.
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

jest.mock('../mapping-management/IntegratedMatchingSchedule', () => ({
  __esModule: true,
  default: () => <div data-testid="integrated-matching-schedule-stub" />
}));

import IntegratedMatchingScheduleManagement from '../IntegratedMatchingScheduleManagement';

describe('IntegratedMatchingScheduleManagement (G-14 P0 header dedup)', () => {
  test('AdminCommonLayout title 생략 및 IntegratedMatchingSchedule 본문 mount', () => {
    render(<IntegratedMatchingScheduleManagement />);

    expect(screen.getByTestId('admin-common-layout')).toBeInTheDocument();
    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', '');
    expect(screen.getByTestId('integrated-matching-schedule-stub')).toBeInTheDocument();
  });
});
