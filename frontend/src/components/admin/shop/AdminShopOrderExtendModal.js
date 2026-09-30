/**
 * 어드민 주문 — 사용 기한 연장 창 (주문 상세 위 2차 다이얼로그)
 * 현재/새 만료일 쌍 패널 · 날짜 + 1/2/3개월 칩 · 사유 필수 · 연장 이력.
 *
 * @author CoreSolution
 * @since 2026-09-29
 */

import React, { useEffect, useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import UnifiedLoading from '../../common/UnifiedLoading';
import { buildErpMgButtonClassName } from '../../erp/common/erpMgButtonProps';
import {
  ADMIN_SHOP_EXTEND_COPY,
  ADMIN_SHOP_EXTEND_MONTH_OPTIONS,
  ADMIN_SHOP_SUITE_TEST_IDS,
  formatAdminShopCopy
} from '../../../constants/adminShopSuite';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  addDaysToAdminShopIsoDate,
  addMonthsToAdminShopIsoDate,
  diffAdminShopIsoDays,
  formatAdminShopDate,
  resolveAdminShopExtendBaseDate
} from '../../../utils/adminShopSuite';
import { AdminShopPairPanel } from './AdminShopSuiteParts';

const EXTEND_REASON_MAX = 500;
const QUICK_CUSTOM = 'CUSTOM';
const EMPTY = '—';

/**
 * @param {{ item: object|null, history: Array<object>, historyLoading: boolean, isOpen: boolean,
 *   onClose: Function, onSubmit: Function, submitting: boolean }} props
 * @returns {JSX.Element|null}
 */
function AdminShopOrderExtendModal({ isOpen, item, history, historyLoading, onClose, onSubmit, submitting }) {
  const baseId = useId();
  const [newDate, setNewDate] = useState('');
  const [quick, setQuick] = useState(QUICK_CUSTOM);
  const [reason, setReason] = useState('');

  const baseDate = useMemo(() => resolveAdminShopExtendBaseDate(item), [item]);
  const minDate = baseDate ? addDaysToAdminShopIsoDate(baseDate, 1) : '';
  const currentExpire = item?.expireDate ? toDisplayString(item.expireDate, '').slice(0, 10) : '';

  useEffect(() => {
    if (isOpen) {
      setNewDate('');
      setQuick(QUICK_CUSTOM);
      setReason('');
    }
  }, [isOpen, item?.orderPublicId]);

  const trimmedReason = reason.trim();
  const dateValid = Boolean(newDate) && Boolean(minDate) && newDate >= minDate;
  const canSave = dateValid && trimmedReason.length > 0 && !submitting;
  const extendDays = dateValid && currentExpire ? diffAdminShopIsoDays(currentExpire, newDate) : null;
  const extensionCount = Number(item?.extensionCount) || 0;

  const pickMonths = (months) => {
    setQuick(String(months));
    if (baseDate) {
      setNewDate(addMonthsToAdminShopIsoDate(baseDate, months) || '');
    }
  };

  const handleSubmit = () => {
    if (!canSave) {
      return;
    }
    onSubmit({ newExpireDate: newDate, reason: trimmedReason });
  };

  const headerMeta = [item?.shortId, item?.clientMasked, item?.productTitle].filter(Boolean).join(' · ');

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={ADMIN_SHOP_EXTEND_COPY.TITLE}
      subtitle={headerMeta}
      size="medium"
      backdropClick={!submitting}
      closeOnEscape={!submitting}
      className="admin-shop-suite admin-shop-clinic-os admin-shop-extend-modal"
      actions={(
        <div className="admin-shop-suite__modal-footer">
          <span className="admin-shop-suite__muted">{ADMIN_SHOP_EXTEND_COPY.FOOTER_NOTE}</span>
          <div className="admin-shop-suite__modal-footer-right">
            <MGButton
              type="button"
              variant="outline"
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'md' })}
              onClick={onClose}
              disabled={submitting}
            >
              {ADMIN_SHOP_EXTEND_COPY.CANCEL}
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: submitting })}
              onClick={handleSubmit}
              disabled={!canSave}
              loading={submitting}
              loadingText={ADMIN_SHOP_EXTEND_COPY.SAVE}
              preventDoubleClick
              data-testid={ADMIN_SHOP_SUITE_TEST_IDS.EXTEND_SAVE}
            >
              {ADMIN_SHOP_EXTEND_COPY.SAVE}
            </MGButton>
          </div>
        </div>
      )}
    >
      <div className="admin-shop-suite__form-stack" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.EXTEND_DIALOG}>
        <AdminShopPairPanel
          amountLabel={ADMIN_SHOP_EXTEND_COPY.CURRENT}
          amountText={formatAdminShopDate(currentExpire) || EMPTY}
          amountCaption={extensionCount > 0
            ? formatAdminShopCopy(ADMIN_SHOP_EXTEND_COPY.CURRENT_CAPTION, { count: extensionCount })
            : ADMIN_SHOP_EXTEND_COPY.CURRENT_CAPTION_NONE}
          sessionsLabel={ADMIN_SHOP_EXTEND_COPY.NEXT}
          sessionsText={dateValid ? formatAdminShopDate(newDate) : ADMIN_SHOP_EXTEND_COPY.NEXT_EMPTY}
          sessionsTone={dateValid ? null : 'dim'}
          sessionsCaption={extendDays != null && extendDays > 0
            ? formatAdminShopCopy(ADMIN_SHOP_EXTEND_COPY.NEXT_CAPTION, { days: extendDays })
            : ''}
        />

        <div className="admin-shop-suite__field">
          <label className="admin-shop-suite__label" htmlFor={`${baseId}-date`}>
            {ADMIN_SHOP_EXTEND_COPY.DATE_LABEL}
            <span className="admin-shop-suite__required" aria-hidden="true">*</span>
          </label>
          <div className="admin-shop-suite__extend-date-row">
            <input
              id={`${baseId}-date`}
              type="date"
              className="admin-shop-suite__input admin-shop-suite__extend-date"
              value={newDate}
              min={minDate || undefined}
              required
              aria-required="true"
              disabled={submitting}
              data-testid={ADMIN_SHOP_SUITE_TEST_IDS.EXTEND_DATE}
              onChange={(e) => {
                setQuick(QUICK_CUSTOM);
                setNewDate(e.target.value);
              }}
            />
            <div className="admin-shop-suite__chip-group" role="group" aria-label={ADMIN_SHOP_EXTEND_COPY.QUICK_ARIA}>
              {ADMIN_SHOP_EXTEND_MONTH_OPTIONS.map((months) => (
                <button
                  key={months}
                  type="button"
                  className="admin-shop-suite__chip-option"
                  aria-pressed={quick === String(months)}
                  disabled={submitting || !baseDate}
                  onClick={() => pickMonths(months)}
                >
                  {formatAdminShopCopy(ADMIN_SHOP_EXTEND_COPY.QUICK_MONTH, { months })}
                </button>
              ))}
              <button
                type="button"
                className="admin-shop-suite__chip-option"
                aria-pressed={quick === QUICK_CUSTOM}
                disabled={submitting}
                onClick={() => setQuick(QUICK_CUSTOM)}
              >
                {ADMIN_SHOP_EXTEND_COPY.QUICK_CUSTOM}
              </button>
            </div>
          </div>
        </div>

        <div className="admin-shop-suite__field">
          <label className="admin-shop-suite__label" htmlFor={`${baseId}-reason`}>
            {ADMIN_SHOP_EXTEND_COPY.REASON_LABEL}
            <span className="admin-shop-suite__required" aria-hidden="true">*</span>
          </label>
          <textarea
            id={`${baseId}-reason`}
            className="admin-shop-suite__input admin-shop-suite__textarea"
            value={reason}
            maxLength={EXTEND_REASON_MAX}
            placeholder={ADMIN_SHOP_EXTEND_COPY.REASON_PLACEHOLDER}
            required
            aria-required="true"
            disabled={submitting}
            data-testid={ADMIN_SHOP_SUITE_TEST_IDS.EXTEND_REASON}
            onChange={(e) => setReason(e.target.value)}
          />
          <span className="admin-shop-suite__hint">{ADMIN_SHOP_EXTEND_COPY.REASON_HINT}</span>
        </div>

        <section className="admin-shop-order-detail__section" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.EXTEND_HISTORY}>
          <div className="admin-shop-suite__section-head">
            <h3 className="admin-shop-order-detail__section-title">{ADMIN_SHOP_EXTEND_COPY.HISTORY_TITLE}</h3>
          </div>
          {historyLoading ? (
            <UnifiedLoading type="inline" />
          ) : history.length === 0 ? (
            <p className="admin-shop-suite__muted">{ADMIN_SHOP_EXTEND_COPY.HISTORY_EMPTY}</p>
          ) : (
            <table className="admin-shop-suite__ledger">
              <thead>
                <tr>
                  <th scope="col">{ADMIN_SHOP_EXTEND_COPY.HISTORY_AT}</th>
                  <th scope="col">{ADMIN_SHOP_EXTEND_COPY.HISTORY_PREVIOUS}</th>
                  <th scope="col">{ADMIN_SHOP_EXTEND_COPY.HISTORY_NEXT}</th>
                  <th scope="col">{ADMIN_SHOP_EXTEND_COPY.HISTORY_BY}</th>
                  <th scope="col">{ADMIN_SHOP_EXTEND_COPY.HISTORY_REASON}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={`ext-${row.id}`}>
                    <td className="admin-shop-suite__num"><SafeText>{formatAdminShopDate(row.extendedAt) || EMPTY}</SafeText></td>
                    <td className="admin-shop-suite__num"><SafeText>{formatAdminShopDate(row.previousExpireDate) || EMPTY}</SafeText></td>
                    <td className="admin-shop-suite__num admin-shop-suite__extend-next">
                      <SafeText>{formatAdminShopDate(row.newExpireDate) || EMPTY}</SafeText>
                    </td>
                    <td><SafeText>{toDisplayString(row.extendedByName, '') || EMPTY}</SafeText></td>
                    <td><SafeText>{toDisplayString(row.reason, '') || EMPTY}</SafeText></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </UnifiedModal>
  );
}

AdminShopOrderExtendModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  item: PropTypes.object,
  history: PropTypes.array,
  historyLoading: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool
};

AdminShopOrderExtendModal.defaultProps = {
  item: null,
  history: [],
  historyLoading: false,
  submitting: false
};

export default AdminShopOrderExtendModal;
