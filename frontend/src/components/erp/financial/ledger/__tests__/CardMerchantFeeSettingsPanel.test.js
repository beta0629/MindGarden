/**
 * CardMerchantFeeSettingsPanel — collapsible quiet panel tests
 *
 * @author CoreSolution
 * @since 2026-08-28
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FM_CARD_FEE } from '../../../../../constants/financialManagementStrings';
import CardMerchantFeeSettingsPanel from '../CardMerchantFeeSettingsPanel';

jest.mock('../../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  )
}));

jest.mock('../../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn()
  }
}));

jest.mock('../../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

import StandardizedApi from '../../../../../utils/standardizedApi';

describe('CardMerchantFeeSettingsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders collapsed by default with saved average summary', async() => {
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: {
        averageRatePercent: 2.5,
        issuerRates: []
      }
    });

    render(<CardMerchantFeeSettingsPanel />);

    expect(screen.getByText(FM_CARD_FEE.TITLE)).toBeInTheDocument();
    expect(screen.queryByText(FM_CARD_FEE.AVERAGE_RATE_LABEL)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(FM_CARD_FEE.COLLAPSED_AVERAGE_SUMMARY('2.5'))).toBeInTheDocument();
    });
  });

  it('expands panel on header click and shows settings form', async() => {
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: {
        averageRatePercent: null,
        issuerRates: []
      }
    });

    render(<CardMerchantFeeSettingsPanel />);

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: FM_CARD_FEE.TOGGLE_EXPAND }));

    expect(screen.getByText(FM_CARD_FEE.CAPTION)).toBeInTheDocument();
    expect(screen.getByText(FM_CARD_FEE.AVERAGE_RATE_LABEL)).toBeInTheDocument();
    expect(screen.getByText(FM_CARD_FEE.ISSUER_SECTION_TITLE)).toBeInTheDocument();
  });
});
