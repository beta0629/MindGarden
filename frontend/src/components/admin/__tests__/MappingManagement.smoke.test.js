/**
 * MappingManagement — AdminCommonLayout 스모크 테스트 (G-14).
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-i18next', () => {
  const stableT = (key) => {
    if (key === 'admin.labels.matchingManagement') return '매칭 관리';
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

jest.mock('../mapping-management', () => ({
  MappingManagementPage: () => <div data-testid="mapping-management-page-stub" />
}));

import MappingManagement from '../MappingManagement';

describe('MappingManagement (G-14)', () => {
  test('AdminCommonLayout title 및 MappingManagementPage 본문 mount', () => {
    render(<MappingManagement />);

    expect(screen.getByTestId('admin-common-layout')).toBeInTheDocument();
    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute(
      'data-title',
      '매칭 관리'
    );
    expect(screen.getByTestId('mapping-management-page-stub')).toBeInTheDocument();
  });
});
