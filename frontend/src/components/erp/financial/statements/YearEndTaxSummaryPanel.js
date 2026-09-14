/**
 * YearEndTaxSummaryPanel — 1인 클리닉 월별 세금 저장액 표 (세율 재계산 없음)
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import PropTypes from 'prop-types';
import MGButton from '../../../common/MGButton';
import UnifiedLoading from '../../../common/UnifiedLoading';
import {
  FM_TAX_SUMMARY,
  FM_RETRY,
  FM_LOADING
} from '../../../../constants/financialManagementStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../common/erpMgButtonProps';
import { formatWonDisplay } from '../../organisms/moneyCockpit/moneyCockpitData';
import useYearTaxMonthlySeries from './useYearTaxMonthlySeries';

/**
 * @param {number} amount
 * @returns {string}
 */
const amountClassName = (amount) => {
  if (amount > 0) {
    return 'operator-ledger-tax-summary__amount operator-ledger-tax-summary__amount--plus';
  }
  if (amount < 0) {
    return 'operator-ledger-tax-summary__amount operator-ledger-tax-summary__amount--minus';
  }
  return 'operator-ledger-tax-summary__amount';
};

/**
 * @param {object} props
 * @param {number} props.year shared calendar year from YearEndIncomePanel
 */
const YearEndTaxSummaryPanel = ({ year }) => {
  const {
    loading,
    error,
    months,
    totals,
    salaryTaxTotals,
    reload
  } = useYearTaxMonthlySeries(year);

  return (
    <section
      className="operator-ledger-tax-summary"
      data-testid="year-end-tax-summary-panel"
      aria-label={FM_TAX_SUMMARY.SECTION_TITLE}
    >
      <h3 className="operator-ledger-tax-summary__title">{FM_TAX_SUMMARY.SECTION_TITLE}</h3>
      <p className="operator-ledger-tax-summary__intro">{FM_TAX_SUMMARY.INTRO_P1}</p>
      <p className="operator-ledger-tax-summary__intro">{FM_TAX_SUMMARY.INTRO_P2}</p>

      {error ? (
        <div className="operator-ledger-year-end__error" role="alert">
          <p className="operator-ledger-year-end__error-text">{error}</p>
          <MGButton
            type="button"
            variant="primary"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'sm',
              loading: false
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={reload}
            preventDoubleClick={false}
            aria-label={FM_RETRY.ARIA_LABEL}
          >
            {FM_RETRY.LABEL}
          </MGButton>
        </div>
      ) : null}

      {loading ? (
        <UnifiedLoading type="inline" text={FM_LOADING.TAX_SUMMARY} />
      ) : (
        <>
          <div className="operator-ledger-tax-summary__table-wrap">
            <table className="operator-ledger-tax-summary__table">
              <thead>
                <tr>
                  <th scope="col">{FM_TAX_SUMMARY.TH_MONTH}</th>
                  <th scope="col">{FM_TAX_SUMMARY.TH_VAT}</th>
                  <th scope="col">{FM_TAX_SUMMARY.TH_WITHHOLDING}</th>
                  <th scope="col">{FM_TAX_SUMMARY.TH_EXPENSE_VAT}</th>
                </tr>
              </thead>
              <tbody>
                {months.map((row) => (
                  <tr key={row.month}>
                    <th scope="row">{row.month}</th>
                    <td className={amountClassName(row.vatTotal)}>
                      {formatWonDisplay(row.vatTotal)}
                    </td>
                    <td className={amountClassName(row.withholdingTotal)}>
                      {formatWonDisplay(row.withholdingTotal)}
                    </td>
                    <td className={amountClassName(row.expenseVatTotal)}>
                      {formatWonDisplay(row.expenseVatTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">{FM_TAX_SUMMARY.FOOT_SUM}</th>
                  <td className={amountClassName(totals.vatTotal)}>
                    {formatWonDisplay(totals.vatTotal)}
                  </td>
                  <td className={amountClassName(totals.withholdingTotal)}>
                    {formatWonDisplay(totals.withholdingTotal)}
                  </td>
                  <td className={amountClassName(totals.expenseVatTotal)}>
                    {formatWonDisplay(totals.expenseVatTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div
            className="operator-ledger-tax-summary__salary"
            data-testid="year-end-tax-summary-salary"
          >
            <h4 className="operator-ledger-tax-summary__salary-title">
              {FM_TAX_SUMMARY.SALARY_SECTION_TITLE}
            </h4>
            <p className="operator-ledger-tax-summary__intro">{FM_TAX_SUMMARY.SALARY_INTRO}</p>
            <dl className="operator-ledger-tax-summary__salary-dl">
              <div className="operator-ledger-tax-summary__salary-row">
                <dt>{FM_TAX_SUMMARY.TH_SALARY_NATIONAL}</dt>
                <dd className={amountClassName(salaryTaxTotals.WITHHOLDING_NATIONAL)}>
                  {formatWonDisplay(salaryTaxTotals.WITHHOLDING_NATIONAL)}
                </dd>
              </div>
              <div className="operator-ledger-tax-summary__salary-row">
                <dt>{FM_TAX_SUMMARY.TH_SALARY_LOCAL}</dt>
                <dd className={amountClassName(salaryTaxTotals.WITHHOLDING_LOCAL)}>
                  {formatWonDisplay(salaryTaxTotals.WITHHOLDING_LOCAL)}
                </dd>
              </div>
              <div className="operator-ledger-tax-summary__salary-row">
                <dt>{FM_TAX_SUMMARY.TH_SALARY_VAT}</dt>
                <dd className={amountClassName(salaryTaxTotals.VAT)}>
                  {formatWonDisplay(salaryTaxTotals.VAT)}
                </dd>
              </div>
            </dl>
          </div>
        </>
      )}
    </section>
  );
};

YearEndTaxSummaryPanel.propTypes = {
  year: PropTypes.number.isRequired
};

export default YearEndTaxSummaryPanel;
