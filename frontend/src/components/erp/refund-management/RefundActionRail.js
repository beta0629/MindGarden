/**
 * RefundActionRail — ERP 미반영 secondary strip (blue tone)
 * MoneyTodoList / salary todo 와 동일 밀도·빈면 null 계약. MoneyTodoList 본문 복제·재사용 금지.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import {
  buildRefundRailTitle,
  RM_RAIL_ARIA,
  RM_RAIL_VIEW_IN_LIST
} from '../../../constants/refundManagementClinicOsStrings';
import { formatWonDisplay } from '../organisms/moneyCockpit/moneyCockpitData';
import { toSafeNumber } from '../../../utils/safeDisplay';
import { ErpSafeText } from '../common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../common/erpMgButtonProps';

/**
 * @param {object} props
 * @param {number} props.pendingCount — pendingErpRequests
 * @param {number|null|undefined} [props.pendingAmount] — 미반영 금액 합(산출 가능 시)
 * @param {() => void} [props.onViewInList] — ghost「목록에서 보기」
 */
const RefundActionRail = ({
  pendingCount = 0,
  pendingAmount = null,
  onViewInList
}) => {
  const count = toSafeNumber(pendingCount);
  if (count <= 0) {
    return null;
  }

  const title = buildRefundRailTitle(count);
  const hasAmount = pendingAmount != null && !Number.isNaN(Number(pendingAmount));

  return (
    <section
      className="refund-management-rail"
      data-testid="refund-management-rail"
      aria-label={RM_RAIL_ARIA}
    >
      <div className="refund-management-rail__body">
        <h2 className="refund-management-rail__title">{title}</h2>
        {hasAmount ? (
          <p className="refund-management-rail__fact">
            <span className="refund-management-rail__amount">
              <ErpSafeText value={formatWonDisplay(pendingAmount)} />
            </span>
          </p>
        ) : null}
      </div>
      {typeof onViewInList === 'function' ? (
        <MGButton
          type="button"
          variant="ghost"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'ghost',
            size: 'sm',
            loading: false,
            className: 'refund-management-rail__action'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onViewInList}
          preventDoubleClick={false}
        >
          {RM_RAIL_VIEW_IN_LIST}
        </MGButton>
      ) : null}
    </section>
  );
};

RefundActionRail.propTypes = {
  pendingCount: PropTypes.number,
  pendingAmount: PropTypes.number,
  onViewInList: PropTypes.func
};

export default RefundActionRail;
