/**
 * MappingCalendarView - 매칭 목록 캘린더 뷰 (B0KlA 스타일)
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import './MappingCalendarView.css';

const MappingCalendarView = ({
  mappings = [],
  getStatusColor,
  onView
}) => {
  const events = useMemo(() => {
    return mappings.map((mapping) => {
      // startDate가 없으면 createdAt을 사용. 그것도 없으면 오늘 날짜.
      const dateStr = mapping.startDate || mapping.createdAt || new Date().toISOString();
      const statusColor = getStatusColor ? getStatusColor(mapping.status) : 'var(--ad-b0kla-blue, #6d9dc5)';
      
      return {
        id: mapping.id,
        title: `${mapping.clientName || 'N/A'} - ${mapping.consultantName || 'N/A'}`,
        start: dateStr.split('T')[0], // YYYY-MM-DD 형식 추출
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

  return (
    <div className="mg-v2-mapping-calendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
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
  onView: PropTypes.func
};

export default MappingCalendarView;
