/**
 * 상담일지 조회 - 캘린더 뷰 블록
 * records를 sessionDate 기준 FullCalendar dayGrid 이벤트로 표시.
 * 완료/미완료 색 구분, dateClick/eventClick 시 모달 또는 일지 선택 팝오버.
 *
 * @author Core Solution
 * @since 2025-03-02
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ContentSection from '../../dashboard-v2/content/ContentSection';
import ContentCard from '../../dashboard-v2/content/ContentCard';
import { FileText } from 'lucide-react';
import { toDateStr } from '../../../utils/dateUtils';
import './ConsultationLogCalendarBlock.css';

const EMPTY_TITLE = '등록된 상담일지가 없습니다.';
const EMPTY_DESC = '다른 필터를 적용해 보시거나, 스케줄에서 상담일지를 작성해 주세요.';
const COLOR_SUCCESS = 'var(--mg-success-500)';
const COLOR_WARNING = 'var(--mg-warning-500)';

const ConsultationLogCalendarBlock = ({
  records,
  clientNameMap,
  consultantNameMap,
  onOpenModal
}) => {
  const [popover, setPopover] = useState(null);
  const popoverRef = useRef(null);

  const events = useMemo(() => {
    if (!records || !records.length) return [];
    return records.map((record) => {
      const sessionDate = toDateStr(record.sessionDate ?? record.consultationDate);
      if (!sessionDate) return null;
      const clientName =
        record.clientName ??
        (record.clientId && clientNameMap
          ? clientNameMap[Number(record.clientId)]
          : null) ??
        `내담자 #${record.clientId}`;
      const isCompleted = record.isSessionCompleted === true;
      return {
        id: String(record.id),
        title: clientName,
        start: sessionDate,
        end: sessionDate,
        allDay: true,
        backgroundColor: isCompleted ? COLOR_SUCCESS : COLOR_WARNING,
        borderColor: isCompleted ? COLOR_SUCCESS : COLOR_WARNING,
        extendedProps: {
          recordId: record.id,
          clientName,
          isSessionCompleted: isCompleted,
          record
        }
      };
    }).filter(Boolean);
  }, [records, clientNameMap]);

  const getRecordsByDate = (dateStr) => {
    if (!records || !dateStr) return [];
    return records.filter((r) => {
      const sd = toDateStr(r.sessionDate ?? r.consultationDate);
      return sd === dateStr;
    });
  };

  const handleDateClick = (info) => {
    const dateStr = info.dateStr;
    const dayRecords = getRecordsByDate(dateStr);
    if (dayRecords.length === 0) return;
    if (dayRecords.length === 1) {
      onOpenModal(dayRecords[0].id);
      return;
    }
    const ev = info.jsEvent;
    setPopover({
      dateStr,
      records: dayRecords,
      x: ev ? ev.clientX : 0,
      y: ev ? ev.clientY : 0
    });
  };

  const handleEventClick = (info) => {
    info.jsEvent?.stopPropagation();
    const recordId = info.event.extendedProps?.recordId;
    if (recordId != null) onOpenModal(recordId);
  };

  const handleSelectRecord = (recordId) => {
    setPopover(null);
    onOpenModal(recordId);
  };

  useEffect(() => {
    if (!popover) return;
    const onDocClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopover(null);
      }
    };
    document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);
  }, [popover]);

  const isEmpty = !records || records.length === 0;

  if (isEmpty) {
    return (
      <ContentSection noCard className="mg-v2-consultation-log-calendar-block">
        <ContentCard className="mg-v2-consultation-log-calendar-block__card">
          <div className="mg-v2-consultation-log-calendar-block__empty">
            <div className="mg-v2-consultation-log-calendar-block__empty-icon">
              <FileText size={48} />
            </div>
            <h3 className="mg-v2-consultation-log-calendar-block__empty-title">{EMPTY_TITLE}</h3>
            <p className="mg-v2-consultation-log-calendar-block__empty-desc">{EMPTY_DESC}</p>
          </div>
        </ContentCard>
      </ContentSection>
    );
  }

  return (
    <ContentSection noCard className="mg-v2-consultation-log-calendar-block">
      <ContentCard className="mg-v2-consultation-log-calendar-block__card">
        <div className="mg-v2-consultation-log-calendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            buttonText={{ today: '오늘' }}
            height="auto"
            locale="ko"
            dayMaxEvents={4}
            dayMaxEventRows={3}
          />
        </div>
        {popover && (
          <div
            ref={popoverRef}
            className="mg-v2-consultation-log-calendar-popover"
            aria-label="해당 날짜 상담일지 목록"
            style={{
              left: popover.x,
              top: (popover.y || 0) + 12
            }}
          >
            <div className="mg-v2-consultation-log-calendar-popover__title">
              {popover.dateStr} 상담일지 {popover.records.length}건
            </div>
            <ul className="mg-v2-consultation-log-calendar-popover__list">
              {popover.records.map((r) => {
                const clientName =
                  r.clientName ??
                  (r.clientId && clientNameMap ? clientNameMap[Number(r.clientId)] : null) ??
                  `내담자 #${r.clientId}`;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      className="mg-v2-consultation-log-calendar-popover__item"
                      onClick={() => handleSelectRecord(r.id)}
                    >
                      {clientName}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </ContentCard>
    </ContentSection>
  );
};

ConsultationLogCalendarBlock.propTypes = {
  records: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      sessionDate: PropTypes.string,
      consultationDate: PropTypes.string,
      sessionNumber: PropTypes.number,
      clientId: PropTypes.number,
      clientName: PropTypes.string,
      consultantId: PropTypes.number,
      consultantName: PropTypes.string,
      isSessionCompleted: PropTypes.bool
    })
  ),
  clientNameMap: PropTypes.object,
  consultantNameMap: PropTypes.object,
  onOpenModal: PropTypes.func.isRequired
};

export default ConsultationLogCalendarBlock;
