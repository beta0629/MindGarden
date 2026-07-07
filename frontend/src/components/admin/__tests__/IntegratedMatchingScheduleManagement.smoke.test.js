/**
 * IntegratedMatchingScheduleManagement — AdminCommonLayout 스모크 테스트 (G-14 Pilot 3).
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-i18next', () => {
  const stableT = (key) => {
    if (key === 'common:misc.App.t_d67bbae4') return '통합 스케줄링';
    return key;
  };
  return {
    useTranslation: () => ({
      t: stableT,
      i18n: { language: 'ko', changeLanguage: () => Promise.resolve() }
    }),
    Trans: ({ children }) => children,
    initReactI18next: { type: '3rdParty', init: () => {} }
  };
});

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="admin-common-layout" data-title={title}>
      {children}
    </div>
  )
}));

jest.mock('../mapping-management/IntegratedMatchingSchedule', () => ({
  __esModule: true,
  default: () => <div data-testid="integrated-matching-schedule-stub" />
}));

import IntegratedMatchingScheduleManagement from '../IntegratedMatchingScheduleManagement';

describe('IntegratedMatchingScheduleManagement (G-14 Pilot 3)', () => {
  test('AdminCommonLayout title 및 IntegratedMatchingSchedule 본문 mount', () => {
    render(<IntegratedMatchingScheduleManagement />);

    expect(screen.getByTestId('admin-common-layout')).toBeInTheDocument();
    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute(
      'data-title',
      '통합 스케줄링'
    );
    expect(screen.getByTestId('integrated-matching-schedule-stub')).toBeInTheDocument();
  });
});
