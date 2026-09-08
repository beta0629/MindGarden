/**
 * SalaryCalculationTable — 상담사 지급 primary list (ListTableView + 승인/지급 + ⋮)
 * SSOT: docs/design-system/SALARY_MANAGEMENT_CLINIC_OS_HANDOFF.md §4.5 · §6
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import PropTypes from 'prop-types';
import { ListTableView, EntityRowActions, ENTITY_ROW_ACTIONS_LAYOUT } from '../../common';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import SalaryPrintComponent from '../../common/SalaryPrintComponent';
import { ErpEmptyState } from '../common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../common/erpMgButtonProps';
import {
  SALARY_ACTION_LABELS,
  SALARY_STATUS,
  SALARY_LATE_NOTES_LABELS
} from '../../../constants/salaryConstants';
import {
  SM_EMPTY_LIST,
  SM_TABLE,
  SM_ROW_MENU
} from '../../../constants/salaryManagementClinicOsStrings';
import {
  normalizeSalaryCalculationStatus,
  isSalaryAdjustmentCalculation
} from '../../../utils/salaryCalculationDisplay';
import { toDisplayString } from '../../../utils/safeDisplay';

const COLUMNS = [
  { key: 'consultant', label: SM_TABLE.COL_CONSULTANT },
  { key: 'period', label: SM_TABLE.COL_PERIOD },
  { key: 'net', label: SM_TABLE.COL_NET },
  { key: 'status', label: SM_TABLE.COL_STATUS },
  { key: 'actions', label: SM_TABLE.COL_ACTIONS, hideOnMobile: false }
];

/**
 * @param {string|undefined} rawStatus
 * @returns {string}
 */
function toBadgeModifier(rawStatus) {
  const key = normalizeSalaryCalculationStatus(rawStatus);
  switch (key) {
    case SALARY_STATUS.CALCULATED:
      return 'salary-management__badge--awaiting-approval';
    case SALARY_STATUS.APPROVED:
      return 'salary-management__badge--awaiting-pay';
    case SALARY_STATUS.PAID:
      return 'salary-management__badge--paid';
    default:
      return '';
  }
}

/**
 * @param {object} props
 */
const SalaryCalculationTable = ({
  calculations = [],
  consultants = [],
  lateSessionByPrimaryId = {},
  loading = false,
  emptyTitle = SM_EMPTY_LIST,
  formatCurrency,
  toSalaryNumber,
  toSalaryStatusDisplayLabel,
  toSalaryStatusBadgeVariant,
  approvingCalculationId = null,
  payingCalculationId = null,
  recalcLoadingId = null,
  adjustmentLoadingId = null,
  onApprove,
  onPay,
  onOpenCalc,
  onOpenTaxDetails,
  onOpenExport,
  onRecalc,
  onCreateAdjustment
}) => {
  const busy = Boolean(
    approvingCalculationId != null
    || payingCalculationId != null
    || recalcLoadingId != null
    || adjustmentLoadingId != null
  );

  const getNet = (calculation) => {
    if (calculation.netSalary != null && calculation.netSalary !== '') {
      return toSalaryNumber(calculation.netSalary);
    }
    return toSalaryNumber(calculation.totalSalary) - toSalaryNumber(calculation.taxAmount);
  };

  const getConsultantName = (calculation) => {
    const fromRow = calculation.consultantName;
    if (fromRow) {
      return toDisplayString(fromRow);
    }
    const found = consultants.find((c) => String(c.id) === String(calculation.consultantId));
    return toDisplayString(found?.name, '—');
  };

  const buildMenuItems = (calculation) => {
    const statusNorm = normalizeSalaryCalculationStatus(calculation.status);
    const isAdjustment = isSalaryAdjustmentCalculation(calculation);
    const lateInfo = lateSessionByPrimaryId[calculation.id];
    const extraCompletedCount = lateInfo?.extraCompletedCount ?? 0;
    const showLateNotice = !isAdjustment && extraCompletedCount > 0;
    const showRecalcAction = showLateNotice
      && (statusNorm === SALARY_STATUS.CALCULATED || statusNorm === SALARY_STATUS.APPROVED);
    const showAdjustmentAction = showLateNotice && statusNorm === SALARY_STATUS.PAID;

    const items = [
      {
        id: 'calc',
        label: SM_ROW_MENU.CALC,
        onClick: () => onOpenCalc?.(calculation)
      },
      {
        id: 'tax',
        label: SM_ROW_MENU.TAX_DETAILS,
        onClick: () => onOpenTaxDetails?.(calculation)
      },
      {
        id: 'export',
        label: SM_ROW_MENU.EXPORT,
        onClick: () => onOpenExport?.(calculation)
      }
    ];

    if (showRecalcAction) {
      items.push({
        id: 'recalc',
        label: SM_ROW_MENU.RECALC,
        onClick: () => onRecalc?.(calculation, extraCompletedCount),
        disabled: busy
      });
    }
    if (showAdjustmentAction) {
      items.push({
        id: 'adjustment',
        label: SM_ROW_MENU.ADJUSTMENT,
        onClick: () => onCreateAdjustment?.(calculation, extraCompletedCount),
        disabled: busy
      });
    }

    return items;
  };

  const renderCell = (columnKey, calculation) => {
    const statusNorm = normalizeSalaryCalculationStatus(calculation.status);
    const isAdjustment = isSalaryAdjustmentCalculation(calculation);
    const net = getNet(calculation);
    const badgeMod = toBadgeModifier(calculation.status);

    if (columnKey === 'consultant') {
      return (
        <span className="salary-management__row-consultant">
          <SafeText>{getConsultantName(calculation)}</SafeText>
          {isAdjustment ? (
            <span className="salary-calc-block__adjustment-badge" role="status">
              {SALARY_LATE_NOTES_LABELS.ADJUSTMENT_BADGE}
            </span>
          ) : null}
        </span>
      );
    }
    if (columnKey === 'period') {
      return <SafeText>{calculation.calculationPeriod}</SafeText>;
    }
    if (columnKey === 'net') {
      return (
        <span className="salary-management__row-net">
          {formatCurrency(net)}
        </span>
      );
    }
    if (columnKey === 'status') {
      return (
        <span
          className={[
            'mg-v2-status-badge',
            `mg-v2-badge--${toSalaryStatusBadgeVariant(calculation.status)}`,
            'salary-calc-block__status-badge',
            'salary-management__badge',
            badgeMod
          ].filter(Boolean).join(' ')}
          role="status"
        >
          <SafeText>{toSalaryStatusDisplayLabel(calculation.status)}</SafeText>
        </span>
      );
    }
    if (columnKey === 'actions') {
      return (
        <div className="salary-management__actions">
          {statusNorm === SALARY_STATUS.CALCULATED ? (
            <MGButton
              variant="primary"
              size="small"
              onClick={() => onApprove?.(calculation)}
              disabled={busy}
              loading={approvingCalculationId === calculation.id}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'sm',
                loading: approvingCalculationId === calculation.id,
                className: 'salary-management__cta'
              })}
              aria-label={SALARY_ACTION_LABELS.APPROVE}
              preventDoubleClick
            >
              {SALARY_ACTION_LABELS.APPROVE}
            </MGButton>
          ) : null}
          {statusNorm === SALARY_STATUS.APPROVED ? (
            <MGButton
              variant="primary"
              size="small"
              onClick={() => onPay?.(calculation)}
              disabled={busy}
              loading={payingCalculationId === calculation.id}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'sm',
                loading: payingCalculationId === calculation.id,
                className: 'salary-management__cta'
              })}
              aria-label={SALARY_ACTION_LABELS.PAY}
              preventDoubleClick
            >
              {SALARY_ACTION_LABELS.PAY}
            </MGButton>
          ) : null}
          <div className="salary-management__row-menu">
            <EntityRowActions
              layout={ENTITY_ROW_ACTIONS_LAYOUT.TABLE}
              ariaLabel={SM_TABLE.ROW_MENU_ARIA}
              menuId={`salary-row-menu-${calculation.id}`}
              items={buildMenuItems(calculation)}
            />
          </div>
          <span className="salary-management__print-slot">
            <SalaryPrintComponent
              salaryData={calculation}
              consultantName={getConsultantName(calculation)}
              period={toDisplayString(calculation.calculationPeriod)}
              includeTaxDetails
              includeCalculationDetails
            />
          </span>
        </div>
      );
    }
    return <SafeText>—</SafeText>;
  };

  if (!loading && calculations.length === 0) {
    return (
      <div className="salary-calc-block__empty salary-management__table-empty" role="status" data-state="empty">
        <ErpEmptyState title={emptyTitle} />
      </div>
    );
  }

  return (
    <div className="salary-management__table" data-testid="salary-calculation-table">
      <ListTableView
        columns={COLUMNS}
        data={calculations}
        renderCell={renderCell}
        rowKeyField="id"
        className="salary-management__list-table"
      />
    </div>
  );
};

SalaryCalculationTable.propTypes = {
  calculations: PropTypes.arrayOf(PropTypes.object),
  consultants: PropTypes.arrayOf(PropTypes.object),
  lateSessionByPrimaryId: PropTypes.object,
  loading: PropTypes.bool,
  emptyTitle: PropTypes.string,
  formatCurrency: PropTypes.func.isRequired,
  toSalaryNumber: PropTypes.func.isRequired,
  toSalaryStatusDisplayLabel: PropTypes.func.isRequired,
  toSalaryStatusBadgeVariant: PropTypes.func.isRequired,
  approvingCalculationId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  payingCalculationId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  recalcLoadingId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  adjustmentLoadingId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onApprove: PropTypes.func,
  onPay: PropTypes.func,
  onOpenCalc: PropTypes.func,
  onOpenTaxDetails: PropTypes.func,
  onOpenExport: PropTypes.func,
  onRecalc: PropTypes.func,
  onCreateAdjustment: PropTypes.func
};

export default SalaryCalculationTable;
