/**
 * DensityToggle — 밀도 토글 UI 테스트
 *
 * @author CoreSolution
 * @since 2026-07-06
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DensityToggle from '../DensityToggle';
import {
  SIDEBAR_DENSITY_COMFORTABLE,
  SIDEBAR_DENSITY_COMPACT
} from '../../../constants/integratedScheduleSidebarDensityConstants';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => {
      const labels = {
        'integratedSchedule.sidebar.densityCompactAria': '목록 압축 보기 켜기',
        'integratedSchedule.sidebar.densityComfortableAria': '목록 압축 보기 끄기'
      };
      return labels[key] || key;
    }
  })
}));

describe('DensityToggle', () => {
  it('renders comfortable state with aria-pressed false', () => {
    const onDensityChange = jest.fn();
    render(
      <DensityToggle
        density={SIDEBAR_DENSITY_COMFORTABLE}
        onDensityChange={onDensityChange}
      />
    );

    const toggle = screen.getByRole('button', { name: '목록 압축 보기 켜기' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).not.toHaveClass('integrated-schedule__density-toggle--active');
  });

  it('renders compact state with aria-pressed true', () => {
    render(
      <DensityToggle
        density={SIDEBAR_DENSITY_COMPACT}
        onDensityChange={jest.fn()}
      />
    );

    const toggle = screen.getByRole('button', { name: '목록 압축 보기 끄기' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveClass('integrated-schedule__density-toggle--active');
  });

  it('toggles from comfortable to compact on click', () => {
    const onDensityChange = jest.fn();
    render(
      <DensityToggle
        density={SIDEBAR_DENSITY_COMFORTABLE}
        onDensityChange={onDensityChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '목록 압축 보기 켜기' }));
    expect(onDensityChange).toHaveBeenCalledWith(SIDEBAR_DENSITY_COMPACT);
  });

  it('toggles from compact to comfortable on click', () => {
    const onDensityChange = jest.fn();
    render(
      <DensityToggle
        density={SIDEBAR_DENSITY_COMPACT}
        onDensityChange={onDensityChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '목록 압축 보기 끄기' }));
    expect(onDensityChange).toHaveBeenCalledWith(SIDEBAR_DENSITY_COMFORTABLE);
  });
});
