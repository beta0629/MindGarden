/**
 * MoneyLedgerStrip — 최근 돈 움직임 (일자·내용·들어옴·나감)
 * 내용 = description 클리닉 문구만 (§8.1 카테고리 컬럼 금지).
 * memo/remarks 미사용. 결제코드 괄호는 billing SSOT로 치환.
 * trailing `[…]` 시스템 덤프는 스트립 표시에서만 제거.
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  OFD_LEDGER,
  OFD_LINKS,
  OFD_LOADING
} from '../../../../constants/operatorFinanceDashboardStrings';
import {
  getMappingPaymentMethodDisplayLabel,
  MAPPING_PAYMENT_METHOD_LABELS
} from '../../../../constants/billing';
import {
  buildRecentTransactionRowKey,
  formatRecentTransactionDate
} from '../../../../utils/erpFinanceDisplay';
import { formatWonDisplay, isIncomeTransaction } from './moneyCockpitData';
import { toSafeNumber } from '../../../../utils/safeDisplay';
import UnifiedLoading from '../../../common/UnifiedLoading';
import MGButton from '../../../common/MGButton';
import { ErpSafeText } from '../../common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../common/erpMgButtonProps';

/** trailing 디버그 브래킷 1개 (` [정확한금액: …]` 등) */
const TRAILING_DEBUG_BRACKET_RE = /\s*\[[^\]]*\]\s*$/u;

/** description 내 결제수단 코드 괄호 `(BANK_TRANSFER)` */
const PAYMENT_METHOD_PAREN_RE = /\(([A-Za-z0-9_]+)\)/g;

/**
 * 스트립 표시용: trailing `[…]` 블록을 모두 제거한다.
 * @param {string} text
 * @returns {string}
 */
function stripTrailingDebugBrackets(text) {
  let result = text;
  while (TRAILING_DEBUG_BRACKET_RE.test(result)) {
    result = result.replace(TRAILING_DEBUG_BRACKET_RE, '').trimEnd();
  }
  return result;
}

/**
 * SSOT `MAPPING_PAYMENT_METHOD_LABELS` 키가 괄호 안에 있으면 운영자 라벨로 치환.
 * @param {string} text
 * @returns {string}
 */
function localizePaymentMethodParens(text) {
  return text.replace(PAYMENT_METHOD_PAREN_RE, (match, code) => {
    const key = String(code).trim();
    if (!Object.prototype.hasOwnProperty.call(MAPPING_PAYMENT_METHOD_LABELS, key)) {
      return match;
    }
    return `(${getMappingPaymentMethodDisplayLabel(key)})`;
  });
}

/**
 * 머니 콕핏 스트립 내용 문구 (클리닉 노출용).
 * @param {object} tx
 * @returns {string}
 */
export function buildLedgerStripDescription(tx) {
  const rawDesc = tx?.description;
  const desc = rawDesc != null && String(rawDesc).trim() !== ''
    ? String(rawDesc).trim()
    : '';
  if (!desc) {
    return OFD_LEDGER.DASH;
  }
  return localizePaymentMethodParens(stripTrailingDebugBrackets(desc));
}

/**
 * @param {object} props
 * @param {boolean} props.loading
 * @param {Array<object>} props.transactions
 */
const MoneyLedgerStrip = ({ loading = false, transactions = [] }) => {
  const navigate = useNavigate();
  const rows = Array.isArray(transactions)
    ? transactions.slice(0, OFD_LEDGER.MAX_ROWS)
    : [];

  return (
    <section
      className="money-ledger"
      data-testid="money-ledger-strip"
      aria-label={OFD_LEDGER.ARIA}
      aria-busy={loading}
    >
      <div className="money-ledger__header">
        <h2 className="money-ledger__title">{OFD_LEDGER.TITLE}</h2>
        <MGButton
          type="button"
          variant="ghost"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'ghost',
            size: 'sm',
            loading: false,
            className: 'money-ledger__action'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => navigate(OFD_LINKS.FINANCIAL.path)}
          preventDoubleClick={false}
        >
          {OFD_LEDGER.VIEW_MORE}
        </MGButton>
      </div>
      <div className="money-ledger__table-wrap">
        {loading ? (
          <UnifiedLoading type="inline" text={OFD_LOADING.FINANCE} />
        ) : rows.length === 0 ? (
          <p className="money-ledger__empty" role="status">
            {OFD_LEDGER.EMPTY}
          </p>
        ) : (
          <table className="money-ledger__table" aria-label={OFD_LEDGER.ARIA}>
            <thead>
              <tr>
                <th scope="col">{OFD_LEDGER.COL_DATE}</th>
                <th scope="col">{OFD_LEDGER.COL_DESC}</th>
                <th scope="col" className="money-ledger__amount">
                  {OFD_LEDGER.COL_IN}
                </th>
                <th scope="col" className="money-ledger__amount">
                  {OFD_LEDGER.COL_OUT}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => {
                const income = isIncomeTransaction(tx);
                const amount = toSafeNumber(tx?.amount);
                const amountText = formatWonDisplay(amount);
                const content = buildLedgerStripDescription(tx);
                return (
                  <tr key={buildRecentTransactionRowKey(tx)}>
                    <td>
                      <ErpSafeText value={formatRecentTransactionDate(tx)} />
                    </td>
                    <td className="money-ledger__desc">
                      <ErpSafeText value={content} fallback={OFD_LEDGER.DASH} />
                    </td>
                    <td
                      className={
                        income
                          ? 'money-ledger__amount money-ledger__amount--in'
                          : 'money-ledger__amount'
                      }
                    >
                      {income ? amountText : OFD_LEDGER.DASH}
                    </td>
                    <td
                      className={
                        !income
                          ? 'money-ledger__amount money-ledger__amount--out'
                          : 'money-ledger__amount'
                      }
                    >
                      {!income ? amountText : OFD_LEDGER.DASH}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

MoneyLedgerStrip.propTypes = {
  loading: PropTypes.bool,
  transactions: PropTypes.arrayOf(PropTypes.object)
};


export default MoneyLedgerStrip;
