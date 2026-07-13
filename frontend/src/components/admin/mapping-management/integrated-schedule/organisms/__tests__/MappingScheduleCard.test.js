/**
 * MappingScheduleCard — 사이드바 카드 SessionProgress 연동 테스트
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MappingScheduleCard from '../MappingScheduleCard';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key) => key }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../../../common/CardContainer', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="card-container">{children}</div>
}));

jest.mock('../../molecules/CardActionGroup', () => ({
  __esModule: true,
  default: () => <div data-testid="card-action-group" />
}));

const MOCK_MAPPING = {
  id: 42,
  consultantName: '김상담',
  clientName: '이내담',
  status: 'ACTIVE',
  usedSessions: 2,
  totalSessions: 10,
  remainingSessions: 8
};

describe('MappingScheduleCard SessionProgress', () => {
  it('renders SessionProgressIndicator with used/total from mapping', () => {
    render(<MappingScheduleCard mapping={MOCK_MAPPING} />);

    const progress = screen.getByRole('progressbar', { name: '회기 진행 2/10회' });
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveAttribute('aria-valuenow', '20');
    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
    expect(screen.getByText('2/10회')).toBeInTheDocument();
  });

  it('keeps MappingPartiesRow visible alongside progress', () => {
    render(<MappingScheduleCard mapping={MOCK_MAPPING} />);

    expect(screen.getByText('김상담')).toBeInTheDocument();
    expect(screen.getByText('이내담')).toBeInTheDocument();
  });

  it('renders zero progress when session counts are missing', () => {
    render(
      <MappingScheduleCard
        mapping={{
          ...MOCK_MAPPING,
          usedSessions: undefined,
          totalSessions: undefined
        }}
      />
    );

    const progress = screen.getByRole('progressbar', { name: '회기 진행 0/0회' });
    expect(progress).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('0/0회')).toBeInTheDocument();
  });

  it('renders compact package name when packageName is provided', () => {
    render(
      <MappingScheduleCard
        mapping={{
          ...MOCK_MAPPING,
          packageName: 'Package A + Package B'
        }}
      />
    );
    
    expect(screen.getByText('Package A')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });
});
