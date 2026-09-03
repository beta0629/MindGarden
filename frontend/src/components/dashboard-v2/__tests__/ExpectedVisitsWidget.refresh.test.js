/**
 * ExpectedVisitsWidget — 개별 새로고침 (loadData만, layout blank 금지)
 *
 * @author CoreSolution
 * @since 2026-08-13
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StandardizedApi from '../../../utils/standardizedApi';
import { VISIT_PREDICTION_API } from '../../../constants/visitPredictionConstants';
import ExpectedVisitsWidget from '../ExpectedVisitsWidget';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => (opts && opts.defaultValue) || key,
    i18n: { language: 'ko' }
  })
}));

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({
    hasRole: () => true,
    user: { role: 'ADMIN' }
  })
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn()
  }
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, loading, ...rest }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {children}
    </button>
  )
}));

jest.mock('../../common/modals/UnifiedModal', () => () => null);

describe('ExpectedVisitsWidget refresh', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
    StandardizedApi.get.mockResolvedValue({ data: { content: [] } });
  });

  test('마운트 시 unbooked-expected API 1회 호출', async() => {
    render(<ExpectedVisitsWidget />);

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalledWith(
        VISIT_PREDICTION_API.UNBOOKED_EXPECTED,
        expect.objectContaining({ page: 0 })
      );
    });
    expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('expected-visits-widget')).toBeInTheDocument();
  });

  test('새로고침 클릭 시 loadData만 재호출', async() => {
    render(<ExpectedVisitsWidget />);

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByTestId('expected-visits-refresh'));

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalledTimes(2);
    });
    expect(StandardizedApi.get).toHaveBeenLastCalledWith(
      VISIT_PREDICTION_API.UNBOOKED_EXPECTED,
      expect.objectContaining({ page: 0 })
    );
  });
});
