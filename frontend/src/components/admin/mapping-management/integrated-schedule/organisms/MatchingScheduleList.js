/**
 * MatchingScheduleList — 통합 스케줄 사이드바 매칭 목록 (드래그·카드 렌더)
 *
 * @author CoreSolution
 * @since 2026-06-27
 */

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Draggable } from '@fullcalendar/interaction';
import UnifiedLoading from '../../../../common/UnifiedLoading';
import MappingScheduleCard from './MappingScheduleCard';
import MatchingScheduleCompactRow from '../molecules/MatchingScheduleCompactRow';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import {
  SIDEBAR_DENSITY_COMFORTABLE,
  SIDEBAR_DENSITY_COMPACT
} from '../../constants/integratedScheduleSidebarDensityConstants';
import {
  VIEW_FILTER_NEW,
  VIEW_FILTER_REMAINING,
  VIEW_FILTER_NEW_LABEL,
  canScheduleForMapping
} from '../../constants/integratedScheduleSidebarFilterConstants';
import './MatchingScheduleList.css';

const buildEventData = (mapping) => ({
  id: `mapping-${mapping.id}`,
  title: mapping.clientName || '내담자',
  extendedProps: {
    mappingId: mapping.id,
    consultantId: mapping.consultantId,
    clientId: mapping.clientId,
    consultantName: mapping.consultantName || '상담사',
    clientName: mapping.clientName || '내담자',
    status: mapping.status,
    remainingSessions: mapping.remainingSessions,
    paymentTiming: mapping.paymentTiming ?? null,
    packageName: mapping.packageName ?? null,
    packagePrice: mapping.packagePrice ?? null,
    totalSessions: mapping.totalSessions ?? null
  }
});

const MatchingScheduleList = ({
  mappings,
  loading,
  density,
  viewFilter,
  statusFilter,
  activePeekMappingId,
  highlightedMappingId,
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
  cancelTargetMappingId,
  desyncProcessing,
  desyncTargetMappingId
}) => {
  const listRef = useRef(null);

  useEffect(() => {
    if (loading || !listRef.current || mappings.length === 0) {
      return undefined;
    }
    const draggable = new Draggable(listRef.current, {
      itemSelector: '.integrated-schedule__card.fc-event'
    });
    return () => draggable.destroy();
  }, [loading, mappings]);

  useEffect(() => {
    if (!highlightedMappingId || loading || !listRef.current) {
      return;
    }
    const selector = `[data-mapping-id="${String(highlightedMappingId)}"]`;
    const el = listRef.current.querySelector(selector);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [highlightedMappingId, loading, mappings]);

  if (loading) {
    return (
      <div className="integrated-schedule__list-scroll">
        <UnifiedLoading type="inline" text="매칭 목록 불러오는 중..." />
      </div>
    );
  }

  let emptyMessage = '매칭이 없습니다.';
  if (statusFilter) {
    emptyMessage = '선택한 조건에 맞는 매칭이 없습니다.';
  } else if (viewFilter === VIEW_FILTER_NEW) {
    emptyMessage = `${VIEW_FILTER_NEW_LABEL}이 없습니다.`;
  } else if (viewFilter === VIEW_FILTER_REMAINING) {
    emptyMessage = '회기 남은 매칭이 없습니다.';
  }

  const isCompact = density === SIDEBAR_DENSITY_COMPACT;

  return (
    <div className="integrated-schedule__list-scroll">
      <ul
        ref={listRef}
        className={`integrated-schedule__list${
          isCompact ? ' integrated-schedule__list--compact' : ''
        }`}
        aria-label="매칭 목록"
      >
        {mappings.length === 0 ? (
          <li className="integrated-schedule__empty">
            {toDisplayString(emptyMessage)}
          </li>
        ) : (
          mappings.map((mapping) => {
            const scheduleable = canScheduleForMapping(mapping);
            const eventData = buildEventData(mapping);
            const isPeekActive = activePeekMappingId != null
              && String(activePeekMappingId) === String(mapping.id);
            const isHighlighted = highlightedMappingId != null
              && String(highlightedMappingId) === String(mapping.id);

            if (isCompact) {
              return (
                <li
                  key={mapping.id}
                  className={`integrated-schedule__card integrated-schedule__card--compact${
                    scheduleable ? ' fc-event' : ''
                  }${isHighlighted ? ' integrated-schedule__card--highlighted' : ''}`}
                  data-mapping-id={mapping.id}
                  data-event={scheduleable ? JSON.stringify(eventData) : undefined}
                >
                  <MatchingScheduleCompactRow
                    mapping={mapping}
                    onOpenPeek={onOpenPeek}
                    isActive={isPeekActive}
                    isHighlighted={isHighlighted}
                  />
                </li>
              );
            }

            return (
              <li
                key={mapping.id}
                className={`integrated-schedule__card${scheduleable ? ' fc-event' : ''}${
                  isHighlighted ? ' integrated-schedule__card--highlighted' : ''
                }`}
                data-mapping-id={mapping.id}
                data-event={scheduleable ? JSON.stringify(eventData) : undefined}
              >
                <MappingScheduleCard
                  mapping={mapping}
                  eventData={eventData}
                  isDraggable={scheduleable}
                  onOpenPeek={onOpenPeek}
                  onScheduleFromCard={
                    scheduleable
                      ? () => onScheduleFromCard(mapping)
                      : undefined
                  }
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
                  cancelPendingProcessing={
                    cancelPendingProcessing
                    && cancelTargetMappingId === mapping.id
                  }
                  desyncProcessing={
                    desyncProcessing
                    && String(desyncTargetMappingId) === String(mapping.id)
                  }
                />
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};

MatchingScheduleList.propTypes = {
  mappings: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  density: PropTypes.string,
  viewFilter: PropTypes.string,
  statusFilter: PropTypes.string,
  activePeekMappingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  highlightedMappingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onOpenPeek: PropTypes.func,
  onScheduleFromCard: PropTypes.func.isRequired,
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
  cancelTargetMappingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  desyncProcessing: PropTypes.bool,
  desyncTargetMappingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

MatchingScheduleList.defaultProps = {
  loading: false,
  density: SIDEBAR_DENSITY_COMFORTABLE,
  viewFilter: '',
  statusFilter: '',
  activePeekMappingId: null,
  highlightedMappingId: null,
  onOpenPeek: null,
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
  cancelTargetMappingId: null,
  desyncProcessing: false,
  desyncTargetMappingId: null
};

export default MatchingScheduleList;
