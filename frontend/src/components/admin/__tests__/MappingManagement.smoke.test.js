/**
 * MappingManagement — AdminCommonLayout 스모크 테스트 (G-14).
 * G-14 quiet: title은 ContentHeader(페이지)에서 담당한다.
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-i18next', () => {
  const stableT = (key) => key;
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
  default: ({ children }) => (
    <div data-testid="admin-common-layout">
      {children}
    </div>
  )
}));

jest.mock('../mapping-management', () => ({
  MappingManagementPage: () => <div data-testid="mapping-management-page-stub" />
}));

import MappingManagement from '../MappingManagement';

describe('MappingManagement (G-14)', () => {
  test('AdminCommonLayout 및 MappingManagementPage 본문 mount', () => {
    render(<MappingManagement />);

    expect(screen.getByTestId('admin-common-layout')).toBeInTheDocument();
    expect(screen.getByTestId('mapping-management-page-stub')).toBeInTheDocument();
  });
});
