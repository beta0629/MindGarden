/**
 * LedgerCalendar.helpers — formatKrw() figure/unit split (SSOT §D.5, #710 follow-up).
 *
 * @author CoreSolution
 * @since 2026-08-30
 */

import { splitKrwFigureAndUnit, LEDGER_CALENDAR_WON_UNIT } from '../LedgerCalendar.helpers';
import { formatKrw } from '../../../../../utils/erpFinancialAmountStack';

describe('splitKrwFigureAndUnit', () => {
  it('strips the trailing 원 unit from a formatKrw() string', () => {
    expect(splitKrwFigureAndUnit('1,140,000원')).toEqual({ figure: '1,140,000', unit: '원' });
  });

  it('matches the live formatKrw() output for a typical calendar amount', () => {
    expect(splitKrwFigureAndUnit(formatKrw(1140000))).toEqual({ figure: '1,140,000', unit: '원' });
  });

  it('handles zero and single-digit amounts (formatKrw still appends 원)', () => {
    expect(splitKrwFigureAndUnit(formatKrw(0))).toEqual({ figure: '0', unit: '원' });
    expect(splitKrwFigureAndUnit(formatKrw(5))).toEqual({ figure: '5', unit: '원' });
  });

  it('falls back to treating the whole string as the figure when there is no 원 suffix', () => {
    expect(splitKrwFigureAndUnit('N/A')).toEqual({ figure: 'N/A', unit: '' });
    expect(splitKrwFigureAndUnit(null)).toEqual({ figure: '', unit: '' });
    expect(splitKrwFigureAndUnit(undefined)).toEqual({ figure: '', unit: '' });
  });

  it('splits the formatKrw() empty-amount fallback label the same way as any other 원 amount', () => {
    const emptyLabel = formatKrw(null);
    expect(splitKrwFigureAndUnit(emptyLabel)).toEqual({ figure: '0', unit: '원' });
  });

  it('exports the 원 unit constant used for the split', () => {
    expect(LEDGER_CALENDAR_WON_UNIT).toBe('원');
  });

  it('rejoining figure + unit reproduces the original formatKrw() output (no digits lost)', () => {
    [1140000, 999, 1000000000, 7].forEach((amount) => {
      const formatted = formatKrw(amount);
      const { figure, unit } = splitKrwFigureAndUnit(formatted);
      expect(`${figure}${unit}`).toBe(formatted);
      expect(figure).not.toMatch(/원/);
    });
  });
});
