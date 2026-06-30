/**
 * MappingCalendarView - 매칭 목록 캘린더 뷰 (B0KlA 스타일)
 * Primary: 이벤트 클릭 → 상세. 이벤트 내 ⋮ overflow menu.
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { ENTITY_ROW_ACTIONS_LAYOUT } from '../../../common';
import MappingEntityRowActions from '../molecules/MappingEntityRowActions';
import './MappingCalendarView.css';

const MappingCalendarEventContent = ({
  mapping,
  title,
  onEdit,
  onRefund,
  onConfirmPayment,
  onConfirmDeposit,
  onApprove
}) => (
  <div className="mg-v2-mapping-calendar-event">
    <span className="mg-v2-mapping-calendar-event__title">{title}</span>
    <div
      className="mg-v2-mapping-calendar-event__actions"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      role="presentation"
    >
      <MappingEntityRowActions
        mapping={mapping}
        layout={ENTITY_ROW_ACTIONS_LAYOUT.CORNER}
        menuId={`mapping-calendar-actions-${mapping.id}`}
        onEdit={onEdit}
        onRefund={onRefund}
        onConfirmPayment={onConfirmPayment}
        onConfirmDeposit={onConfirmDeposit}
        onApprove={onApprove}
      />
    </div>
  </div>
);

MappingCalendarEventContent.propTypes = {
  mapping: PropTypes.object.isRequired,
  title: PropTypes.string,
  onEdit: PropTypes.func,
  onRefund: PropTypes.func,
  onConfirmPayment: PropTypes.func,
  onConfirmDeposit: PropTypes.func,
  onApprove: PropTypes.func
};

const MappingCalendarView = ({
  mappings = [],
  getStatusColor,
  onView,
  onEdit,
  onRefund,
  onConfirmPayment,
  onConfirmDeposit,
  onApprove
}) => {
  const events = useMemo(() => {
    return mappings.map((mapping) => {
      const dateStr = mapping.startDate || mapping.createdAt || new Date().toISOString();
      const statusColor = getStatusColor ? getStatusColor(mapping.status) : 'var(--ad-b0kla-blue)';

      return {
        id: mapping.id,
        title: `${mapping.clientName || 'N/A'} - ${mapping.consultantName || 'N/A'}`,
        start: dateStr.split('T')[0],
        backgroundColor: statusColor,
        borderColor: statusColor,
        textColor: 'var(--mg-white)',
        extendedProps: {
          mapping
        }
      };
    });
  }, [mappings, getStatusColor]);

  const handleEventClick = (info) => {
    const { mapping } = info.event.extendedProps;
    if (onView && mapping) {
      onView(mapping);
    }
  };

  const renderEventContent = useCallback(
    (eventInfo) => {
      const { mapping } = eventInfo.event.extendedProps;
      if (!mapping) {
        return { html: eventInfo.event.title };
      }

      return (
        <MappingCalendarEventContent
          mapping={mapping}
          title={eventInfo.event.title}
          onEdit={onEdit}
          onRefund={onRefund}
          onConfirmPayment={onConfirmPayment}
          onConfirmDeposit={onConfirmDeposit}
          onApprove={onApprove}
        />
      );
    },
    [onEdit, onRefund, onConfirmPayment, onConfirmDeposit, onApprove]
  );

  return (
    <div className="mg-v2-mapping-calendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: ''
        }}
        buttonText={{
          today: '오늘'
        }}
        height="auto"
        locale="ko"
        dayMaxEvents={3}
      />
    </div>
  );
};

MappingCalendarView.propTypes = {
  mappings: PropTypes.array,
  getStatusColor: PropTypes.func,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onRefund: PropTypes.func,
  onConfirmPayment: PropTypes.func,
  onConfirmDeposit: PropTypes.func,
  onApprove: PropTypes.func
};

export default MappingCalendarView;
