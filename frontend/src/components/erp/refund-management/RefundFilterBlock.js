/**
 * 환불 필터 chips + 제어 툴바 (Organism)
 * TabChipRow period·status + ghost 일괄/엑셀 (레거시 filter toolbar 지배 크롬 폐기)
 *
 * @author CoreSolution
 * @since 2025-03-16
 * @updated 2026-09-08 Clinic-OS chips
 */

import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import TabChipRow from '../../common/TabChipRow';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../common/erpMgButtonProps';
import {
  RM_CHIPS,
  RM_PERIOD_CHIP_ITEMS,
  RM_STATUS_CHIP_ITEMS,
  RM_TOOLBAR
} from '../../../constants/refundManagementClinicOsStrings';

const RefundFilterBlock = ({
  selectedPeriod,
  selectedStatus,
  onPeriodChange,
  onStatusChange,
  onExportExcel,
  onBatchReflectErp,
  selectedRowIds = [],
  isLoadingReflect = false,
  silentListRefreshing = false
}) => {
  const hasSelection = Array.isArray(selectedRowIds) && selectedRowIds.length > 0;

  return (
    <section
      className="refund-management__chips"
      data-testid="refund-management-chips"
      aria-label={RM_CHIPS.FILTER_ARIA}
      aria-busy={silentListRefreshing}
    >
      <div className="refund-management__chips-row">
        <TabChipRow
          ariaLabel={RM_CHIPS.PERIOD_ARIA}
          items={RM_PERIOD_CHIP_ITEMS}
          activeKey={selectedPeriod}
          onChange={onPeriodChange}
          size="sm"
        />
      </div>
      <div className="refund-management__chips-row">
        <TabChipRow
          ariaLabel={RM_CHIPS.STATUS_ARIA}
          items={RM_STATUS_CHIP_ITEMS}
          activeKey={selectedStatus}
          onChange={onStatusChange}
          size="sm"
        />
      </div>
      <div className="refund-management__toolbar">
        <MGButton
          type="button"
          variant="ghost"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'ghost',
            size: 'sm',
            loading: false
          })}
          onClick={onExportExcel}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          aria-label={RM_TOOLBAR.EXPORT_EXCEL}
          preventDoubleClick={false}
        >
          {RM_TOOLBAR.EXPORT_EXCEL}
        </MGButton>
        <MGButton
          type="button"
          variant="outline"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'sm',
            loading: isLoadingReflect
          })}
          onClick={onBatchReflectErp}
          disabled={!hasSelection || isLoadingReflect}
          loading={isLoadingReflect}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          aria-label={RM_TOOLBAR.BATCH_REFLECT_ARIA}
        >
          {RM_TOOLBAR.BATCH_REFLECT}
        </MGButton>
      </div>
    </section>
  );
};

RefundFilterBlock.propTypes = {
  selectedPeriod: PropTypes.string.isRequired,
  selectedStatus: PropTypes.string.isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onExportExcel: PropTypes.func.isRequired,
  onBatchReflectErp: PropTypes.func.isRequired,
  selectedRowIds: PropTypes.array,
  isLoadingReflect: PropTypes.bool,
  silentListRefreshing: PropTypes.bool
};

export default RefundFilterBlock;
