/**
 * LedgerCalendar amount figure/unit split — SSOT §D.5.
 *
 * `formatKrw()` returns a single string (e.g. "1,140,000원"). Rendering that as one
 * text node forces the browser to choose a mid-digit break point once `word-break:
 * break-all` / `overflow-wrap: anywhere` are applied (#710 regression: "+1,14" / "0,000"
 * / "원"). Splitting the figure from the trailing 원 unit lets CSS keep the figure on a
 * single nowrap line and only allow a wrap between the figure and the unit.
 *
 * This module does not change `formatKrw()` / `erpFinancialAmountStack.js` — those stay
 * the SSOT for every other page. This is purely a calendar-cell rendering split.
 *
 * @author CoreSolution
 * @since 2026-08-30
 */

/** Trailing unit stripped from formatKrw() output for figure/unit split rendering. */
export const LEDGER_CALENDAR_WON_UNIT = '원';

/**
 * Splits a formatKrw()-style string (e.g. "1,140,000원") into a nowrap-safe numeric
 * figure ("1,140,000") and its trailing unit ("원") so markup can wrap only between
 * the two — never mid-digit.
 * @param {string|null|undefined} formattedKrw formatKrw() output
 * @returns {{ figure: string, unit: string }}
 */
export function splitKrwFigureAndUnit(formattedKrw) {
  const str = formattedKrw != null ? String(formattedKrw) : '';
  if (str.endsWith(LEDGER_CALENDAR_WON_UNIT)) {
    return {
      figure: str.slice(0, str.length - LEDGER_CALENDAR_WON_UNIT.length),
      unit: LEDGER_CALENDAR_WON_UNIT
    };
  }
  return { figure: str, unit: '' };
}
