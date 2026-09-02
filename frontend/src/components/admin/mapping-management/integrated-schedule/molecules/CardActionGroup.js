/**
 * CardActionGroup — 통합 스케줄 카드 하단 액션 래퍼 (ActionBar + ActionBarButton + MappingMatchActions)
 *
 * @author CoreSolution
 * @since 2026-04-30
 */

import React from 'react';
import PropTypes from 'prop-types';
import { CardActionGroup as CommonCardActionGroup } from '../../../../common';
import ActionBar from '../../../../common/ActionBar';
import ActionBarButton from '../../../../common/ActionBarButton';
import MappingMatchActions from '../../molecules/MappingMatchActions';
import { SESSION_EXTENSION_UI } from '../../../../../utils/sessionExtensionPending';
import { SESSION_SUCCESSION_UI } from '../../../../../constants/sessionSuccession';
import { PACKAGE_PAYMENT_HISTORY_UI } from '../../../../../constants/packagePaymentHistory';
import {
  MAPPING_DESYNC_CTA_TYPE,
  MAPPING_DESYNC_KIND,
  resolveMappingScheduleDesync
} from '../utils/mappingScheduleDesync';
import { toDisplayString } from '../../../../../utils/safeDisplay';

const CardActionGroup = ({
  mapping,
  onOpenPeek,
  onScheduleFromCard,
  onPayment,
  onDeposit,
  onApprove,
  onCheckoutSameDay,
  onCancelPendingMapping,
  onChangePendingPackage,
  onDesyncAction,
  onSessionExtension,
  onSessionSuccession,
  onConfirmSessionExtensionPayment,
  onCancelSessionExtension,
  onPackagePaymentHistory,
  approveProcessing,
  cancelPendingProcessing,
  desyncProcessing
}) => {
  const pendingExtension = mapping?.pendingSessionExtension;
  const hasPendingExtension = Boolean(pendingExtension?.id);
  const desync = resolveMappingScheduleDesync(mapping);
  const showCleanupCta =
    desync.kind === MAPPING_DESYNC_KIND.CLEANUP
    && desync.ctaType === MAPPING_DESYNC_CTA_TYPE.CLEANUP
    && onDesyncAction;
  const showCompleteCta =
    desync.kind === MAPPING_DESYNC_KIND.STATUS
    && desync.ctaType === MAPPING_DESYNC_CTA_TYPE.COMPLETE
    && onDesyncAction;
  const emphasizeCancelDanger = desync.kind === MAPPING_DESYNC_KIND.CANCEL;
  const desyncCtaLabel = toDisplayString(desync.ctaLabel, '');
  const remainingSessions = Number(mapping?.remainingSessions);
  const canOfferSuccession =
    mapping?.status === 'ACTIVE'
    && !hasPendingExtension
    && onSessionSuccession
    && (Number.isFinite(remainingSessions) ? remainingSessions > 0 : true);

  return (
  <CommonCardActionGroup className="integrated-schedule__card-actions">
    {onOpenPeek && (
      <ActionBarButton
        type="button"
        variant="ghost"
        size="sm"
        className="integrated-schedule__btn-detail-peek"
        onClick={(event) => {
          event.stopPropagation();
          onOpenPeek();
        }}
        aria-label="상세"
        data-testid={`mapping-detail-peek-${mapping?.id ?? 'unknown'}`}
      >
        상세
      </ActionBarButton>
    )}
    <ActionBar align="start" gap="sm" className="integrated-schedule__card-actionbar">
      {onScheduleFromCard && (
        <ActionBarButton
          type="button"
          variant="outline"
          size="sm"
          className="integrated-schedule__btn-schedule-from-card"
          onClick={onScheduleFromCard}
          aria-label="일정 등록"
        >
          일정 등록
        </ActionBarButton>
      )}
      {mapping?.status === 'ACTIVE' && !hasPendingExtension && onSessionExtension && (
        <ActionBarButton
          type="button"
          variant="outline"
          size="sm"
          className="integrated-schedule__btn-add-sessions-from-card"
          onClick={() => onSessionExtension(mapping)}
          aria-label={SESSION_EXTENSION_UI.ADD_LABEL}
        >
          {SESSION_EXTENSION_UI.ADD_LABEL}
        </ActionBarButton>
      )}
      {canOfferSuccession && (
        <ActionBarButton
          type="button"
          variant="outline"
          size="sm"
          className="integrated-schedule__btn-session-succession"
          onClick={(event) => {
            event.stopPropagation();
            onSessionSuccession(mapping);
          }}
          aria-label={SESSION_SUCCESSION_UI.ACTION_LABEL}
          data-testid={`mapping-session-succession-${mapping?.id ?? 'unknown'}`}
        >
          {SESSION_SUCCESSION_UI.ACTION_LABEL}
        </ActionBarButton>
      )}
      {mapping?.status === 'ACTIVE' && onPackagePaymentHistory && (
        <ActionBarButton
          type="button"
          variant="ghost"
          size="sm"
          className="integrated-schedule__btn-package-payment-history"
          onClick={(event) => {
            event.stopPropagation();
            onPackagePaymentHistory(mapping);
          }}
          aria-label={PACKAGE_PAYMENT_HISTORY_UI.CARD_ACTION_LABEL}
          data-testid={`mapping-package-payment-history-${mapping?.id ?? 'unknown'}`}
        >
          {PACKAGE_PAYMENT_HISTORY_UI.CARD_ACTION_LABEL}
        </ActionBarButton>
      )}
      {mapping?.status === 'ACTIVE' && hasPendingExtension && onConfirmSessionExtensionPayment && (
        <ActionBarButton
          type="button"
          variant="primary"
          size="sm"
          className="integrated-schedule__btn-confirm-session-extension"
          onClick={() => onConfirmSessionExtensionPayment(mapping)}
          aria-label={SESSION_EXTENSION_UI.CONFIRM_LABEL}
        >
          {SESSION_EXTENSION_UI.CONFIRM_LABEL}
        </ActionBarButton>
      )}
      {mapping?.status === 'ACTIVE' && hasPendingExtension && onCancelSessionExtension && (
        <ActionBarButton
          type="button"
          variant="danger"
          size="sm"
          className="integrated-schedule__btn-cancel-session-extension"
          onClick={() => onCancelSessionExtension(mapping)}
          aria-label={SESSION_EXTENSION_UI.CANCEL_LABEL}
        >
          {SESSION_EXTENSION_UI.CANCEL_LABEL}
        </ActionBarButton>
      )}
      {showCleanupCta && (
        <ActionBarButton
          type="button"
          variant="danger"
          size="sm"
          className="integrated-schedule__action-danger integrated-schedule__btn-desync-cleanup"
          loading={desyncProcessing}
          disabled={desyncProcessing}
          onClick={() => onDesyncAction(mapping, desync)}
          aria-label={desyncCtaLabel}
          data-testid={`mapping-desync-cleanup-${mapping?.id ?? 'unknown'}`}
        >
          {desyncCtaLabel}
        </ActionBarButton>
      )}
      {showCompleteCta && (
        <ActionBarButton
          type="button"
          variant="danger"
          size="sm"
          className="integrated-schedule__action-danger integrated-schedule__btn-desync-complete"
          loading={desyncProcessing}
          disabled={desyncProcessing}
          onClick={() => onDesyncAction(mapping, desync)}
          aria-label={desyncCtaLabel}
          data-testid={`mapping-desync-complete-${mapping?.id ?? 'unknown'}`}
        >
          {desyncCtaLabel}
        </ActionBarButton>
      )}
      <MappingMatchActions
        mapping={mapping}
        onPayment={onPayment}
        onDeposit={onDeposit}
        onApprove={onApprove}
        onCheckoutSameDay={onCheckoutSameDay}
        onCancelPendingMapping={onCancelPendingMapping}
        onChangePendingPackage={onChangePendingPackage}
        cancelPendingProcessing={cancelPendingProcessing}
        emphasizeCancelDanger={emphasizeCancelDanger}
        disabled={approveProcessing}
        loading={approveProcessing}
      />
    </ActionBar>
  </CommonCardActionGroup>
  );
};

CardActionGroup.propTypes = {
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    paymentTiming: PropTypes.string,
    clientName: PropTypes.string,
    remainingSessions: PropTypes.number,
    hasConsultationSchedule: PropTypes.bool,
    nextConsultationDate: PropTypes.string,
    pendingSessionExtension: PropTypes.object
  }),
  onOpenPeek: PropTypes.func,
  onPayment: PropTypes.func,
  onDeposit: PropTypes.func,
  onApprove: PropTypes.func,
  onCheckoutSameDay: PropTypes.func,
  onCancelPendingMapping: PropTypes.func,
  onChangePendingPackage: PropTypes.func,
  onDesyncAction: PropTypes.func,
  onSessionExtension: PropTypes.func,
  onSessionSuccession: PropTypes.func,
  onConfirmSessionExtensionPayment: PropTypes.func,
  onCancelSessionExtension: PropTypes.func,
  onPackagePaymentHistory: PropTypes.func,
  approveProcessing: PropTypes.bool,
  cancelPendingProcessing: PropTypes.bool,
  desyncProcessing: PropTypes.bool
};

CardActionGroup.defaultProps = {
  mapping: null,
  onOpenPeek: null,
  onScheduleFromCard: null,
  onPayment: null,
  onDeposit: null,
  onApprove: null,
  onCheckoutSameDay: null,
  onCancelPendingMapping: null,
  onChangePendingPackage: null,
  onDesyncAction: null,
  onSessionExtension: null,
  onSessionSuccession: null,
  onConfirmSessionExtensionPayment: null,
  onCancelSessionExtension: null,
  onPackagePaymentHistory: null,
  approveProcessing: false,
  cancelPendingProcessing: false,
  desyncProcessing: false
};

export default CardActionGroup;
