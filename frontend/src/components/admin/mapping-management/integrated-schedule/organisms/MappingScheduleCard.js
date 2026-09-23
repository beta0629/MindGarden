/**
 * MappingScheduleCard - Clinic-OS 사이드바 배정 카드 v2.1
 * SSOT: docs/design-system/clinic-os-sidebar-cards.md
 * Billing progress: docs/design-system/SCREEN_SPEC_MAPPING_CARD_BILLING_PROGRESS.md
 *
 * @param {Object} mapping - 매칭 객체
 * @param {Object} eventData - 드래그용 이벤트 데이터 (FullCalendar)
 * @param {boolean} isDraggable - 드래그 가능 여부
 * @param {Function} [onScheduleFromCard] - «일정 등록» 클릭 시 (통합 스케줄 사이드바)
 * @param {Function} onPayment - 결제 확인 핸들러
 * @param {Function} onDeposit - 입금 확인 핸들러
 * @param {Function} onApprove - 승인 핸들러
 * @param {boolean} approveProcessing - 승인 처리 중 여부
 */

import React from 'react';
import PropTypes from 'prop-types';
import CardContainer from '../../../../common/CardContainer';
import MappingPartiesRow from '../molecules/MappingPartiesRow';
import CardMeta from '../molecules/CardMeta';
import CardBillingProgress from '../molecules/CardBillingProgress';
import CardActionGroup from '../molecules/CardActionGroup';
import { toSafeNumber } from '../../../../../utils/safeDisplay';
import { isInstitutionLinkEngagement } from '../../../../../constants/mappingEngagementType';
import {
  resolveClientCompletedConsultationCount,
  resolveConsultationSchedulesForCard
} from '../utils/cardBillingProgressDisplay';
import { resolveMappingPackageDisplayName } from '../utils/mappingPackageDisplay';
import './MappingScheduleCard.css';

/**
 * @param {object} mapping
 * @param {boolean} institutionLink
 * @returns {number} 0–100
 */
const resolveTicketFillPercent = (mapping, institutionLink) => {
  // 기관연동은 회기권 fill 을 쓰지 않는다 (매핑 스코프 누적과 분리).
  if (institutionLink) {
    return 0;
  }
  const used = Math.max(0, toSafeNumber(mapping?.usedSessions, 0) ?? 0);
  const total = Math.max(0, toSafeNumber(mapping?.totalSessions, 0) ?? 0);
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((used / total) * 100));
};

/**
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
const resolveIsInstitutionLinkMapping = (mapping) => (
  isInstitutionLinkEngagement(mapping?.paymentTiming)
  || isInstitutionLinkEngagement(mapping?.clientEngagementType)
  || isInstitutionLinkEngagement(mapping?.engagementType)
  || isInstitutionLinkEngagement(mapping?.mappingEngagementType)
);

const MappingScheduleCard = ({
  mapping,
  eventData,
  isDraggable,
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
  const handleCardBodyClick = () => {
    if (onOpenPeek) {
      onOpenPeek(mapping);
    }
  };

  const handleCardBodyKeyDown = (event) => {
    if (!onOpenPeek) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenPeek(mapping);
    }
  };

  const institutionLink = resolveIsInstitutionLinkMapping(mapping);
  const ticketFillPercent = resolveTicketFillPercent(mapping, institutionLink);
  const ticketStyle = {
    ['--integrated-schedule-ticket-fill']: `${ticketFillPercent}%`
  };
  const billingSchedules = resolveConsultationSchedulesForCard(mapping, institutionLink);
  const mappingCompletedCount = resolveClientCompletedConsultationCount(mapping);

  return (
  <CardContainer>
    <div
      className="integrated-schedule__card-body integrated-schedule__card-body--peek-trigger"
      role={onOpenPeek ? 'button' : undefined}
      tabIndex={onOpenPeek ? 0 : undefined}
      onClick={onOpenPeek ? handleCardBodyClick : undefined}
      onKeyDown={onOpenPeek ? handleCardBodyKeyDown : undefined}
      aria-label={onOpenPeek ? `${mapping?.clientName || '배정'} 상세 보기` : undefined}
    >
      <div
        className="integrated-schedule__card-ticket-track"
        data-testid="mapping-card-ticket-track"
        role="presentation"
        aria-hidden="true"
        style={ticketStyle}
      >
        <div className="integrated-schedule__card-ticket-track-rail" />
        <div className="integrated-schedule__card-ticket-track-fill" />
      </div>
      <MappingPartiesRow
        consultantName={mapping?.consultantName}
        clientName={mapping?.clientName}
        packageName={resolveMappingPackageDisplayName(mapping)}
      />
      <CardMeta
        status={mapping?.status}
        remainingSessions={mapping?.remainingSessions}
        pendingSessionExtension={mapping?.pendingSessionExtension}
        hasConsultationSchedule={mapping?.hasConsultationSchedule}
        nextConsultationDate={mapping?.nextConsultationDate}
        paymentTiming={mapping?.paymentTiming}
        clientEngagementType={mapping?.clientEngagementType}
        engagementType={mapping?.engagementType ?? mapping?.mappingEngagementType}
        hasInstitutionLinkInitialPayment={mapping?.hasInstitutionLinkInitialPayment}
        initialConsultationPayment={mapping?.initialConsultationPayment}
        institutionLinkBillingComposition={mapping?.institutionLinkBillingComposition}
        institutionLinkInitialBillingMode={mapping?.institutionLinkInitialBillingMode}
      />
      <CardBillingProgress
        usedSessions={mapping?.usedSessions}
        totalSessions={mapping?.totalSessions}
        remainingSessions={mapping?.remainingSessions}
        consultationSchedules={billingSchedules}
        isInstitutionLink={institutionLink}
        clientCompletedConsultationCount={mappingCompletedCount}
      />
    </div>
    <CardActionGroup
      mapping={mapping}
      onOpenPeek={onOpenPeek ? () => onOpenPeek(mapping) : undefined}
      onScheduleFromCard={onScheduleFromCard}
      onPayment={onPayment}
      onDeposit={onDeposit}
      onApprove={onApprove}
      onCheckoutSameDay={onCheckoutSameDay}
      onCancelPendingMapping={onCancelPendingMapping}
      onChangePendingPackage={onChangePendingPackage}
      onDesyncAction={onDesyncAction}
      onSessionExtension={onSessionExtension}
      onSessionSuccession={onSessionSuccession}
      onConfirmSessionExtensionPayment={onConfirmSessionExtensionPayment}
      onCancelSessionExtension={onCancelSessionExtension}
      onPackagePaymentHistory={onPackagePaymentHistory}
      approveProcessing={approveProcessing}
      cancelPendingProcessing={cancelPendingProcessing}
      desyncProcessing={desyncProcessing}
    />
  </CardContainer>
  );
};

MappingScheduleCard.propTypes = {
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    paymentTiming: PropTypes.string,
    engagementType: PropTypes.string,
    mappingEngagementType: PropTypes.string,
    consultantName: PropTypes.string,
    clientName: PropTypes.string,
    packageName: PropTypes.string,
    usedSessions: PropTypes.number,
    totalSessions: PropTypes.number,
    remainingSessions: PropTypes.number,
    pendingSessionExtension: PropTypes.object,
    hasConsultationSchedule: PropTypes.bool,
    nextConsultationDate: PropTypes.string,
    consultationSchedules: PropTypes.arrayOf(PropTypes.object),
    clientConsultationSchedules: PropTypes.arrayOf(PropTypes.object),
    institutionLinkConsultationSchedules: PropTypes.arrayOf(PropTypes.object),
    hasInstitutionLinkInitialPayment: PropTypes.bool,
    initialConsultationPayment: PropTypes.object,
    institutionLinkBillingComposition: PropTypes.string,
    institutionLinkInitialBillingMode: PropTypes.string,
    institutionLinkBillingComposition: PropTypes.string,
    institutionLinkMonthlyAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    clientCompletedConsultationCount: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string
    ]),
    clientEngagementType: PropTypes.string,
    clientReminderSms: PropTypes.object
  }),
  eventData: PropTypes.object,
  isDraggable: PropTypes.bool,
  onOpenPeek: PropTypes.func,
  onScheduleFromCard: PropTypes.func,
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

MappingScheduleCard.defaultProps = {
  mapping: null,
  eventData: null,
  isDraggable: false,
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

export default MappingScheduleCard;
