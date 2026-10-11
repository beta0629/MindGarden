/**
 * 상담일지 조회 - 캘린더 뷰 블록
 * records를 sessionDate 기준 FullCalendar dayGrid 이벤트로 표시.
 * 완료/미완료 색 구분, dateClick/eventClick 시 모달 또는 일지 선택 팝오버.
 * 필터 기간(startDate)에 맞춰 initialDate를 열어 목록·캘린더 데이터 패리티를 맞춤.
 *
 * @author Core Solution
 * @since 2025-03-02
 * @updated 2026-09-07 — initialDate 필터 동기화, allDay end 제거
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ContentSection from '../../dashboard-v2/content/ContentSection';
import ContentCard from '../../dashboard-v2/content/ContentCard';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDateStr } from '../../../utils/dateUtils';
import { resolvePersonName } from './consultationLogQuery';
import '../../../i18n';
import './ConsultationLogCalendarBlock.css';

const CALENDAR_KEY_TODAY = 'today';
const NS = 'adminConsultationLogs';
const CALENDAR_DAY_MAX_EVENTS = 2;

/**
 * FullCalendar initialDate 결정.
 * startDate → records 중 가장 이른 sessionDate → undefined(오늘).
 *
 * @param {string|null|undefined} startDate YYYY-MM-DD
 * @param {Array<{ sessionDate?: string, consultationDate?: string }>|null|undefined} records
 * @returns {string|undefined}
 */
export const computeCalendarInitialDate = (startDate, records) => {
  if (startDate && String(startDate).trim()) {
    return String(startDate).trim();
  }
  if (!records || !records.length) {
    return undefined;
  }
  let earliest;
  for (let i = 0; i < records.length; i += 1) {
    const sessionDate = toDateStr(records[i].sessionDate ?? records[i].consultationDate);
    if (!sessionDate) {
      continue;
    }
    if (!earliest || sessionDate < earliest) {
      earliest = sessionDate;
    }
  }
  return earliest;
};

const ConsultationLogCalendarBlock = ({
  records = [],
  clientNameMap = {},
  consultantNameMap = {},
  onOpenModal,
  startDate = '',
  endDate = '',
  onVisibleRangeChange
}) => {
  const { t } = useTranslation(NS);
  const [popover, setPopover] = useState(null);
  const popoverRef = useRef(null);
  const unknownName = t('people.unknownName');

  const calendarInitialDate = useMemo(
    () => computeCalendarInitialDate(startDate, records),
    [startDate, records]
  );

  // 필터 윈도우(start/end) 변경 시 FullCalendar remount → 월 뷰 재동기화
  const calendarRemountKey = `${calendarInitialDate || CALENDAR_KEY_TODAY}|${endDate || ''}`;

  const events = useMemo(() => {
    if (!records || !records.length) return [];
    return records.map((record) => {
      const sessionDate = toDateStr(record.sessionDate ?? record.consultationDate);
      if (!sessionDate) return null;
      const clientName = resolvePersonName(
        record.clientName,
        record.clientId,
        clientNameMap,
        unknownName
      );
      const done = record.isSessionCompleted === true;
      return {
        id: String(record.id),
        title: clientName,
        start: sessionDate,
        allDay: true,
        classNames: [
          'mg-v2-consultation-log-cal-event',
          done
            ? 'mg-v2-consultation-log-cal-event--done'
            : 'mg-v2-consultation-log-cal-event--pending'
        ],
        extendedProps: {
          recordId: record.id,
          clientName,
          isSessionCompleted: done,
          record
        }
      };
    }).filter(Boolean);
  }, [records, clientNameMap, unknownName]);

  const getRecordsByDate = (dateStr) => {
    if (!records || !dateStr) return [];
    return records.filter((r) => {
      const sd = toDateStr(r.sessionDate ?? r.consultationDate);
      return sd === dateStr;
    });
  };

  const handleDateClick = (info) => {
    const { dateStr } = info;
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
    if (!popover) return undefined;
    const onDocClick = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setPopover(null);
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setPopover(null);
      }
    };
    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [popover]);

  const handleDatesSet = (arg) => {
    if (!onVisibleRangeChange || !arg?.startStr || !arg?.endStr) {
      return;
    }
    onVisibleRangeChange({
      startDate: String(arg.startStr).slice(0, 10),
      endDate: String(arg.endStr).slice(0, 10)
    });
  };

  return (
    <ContentSection noCard className="mg-v2-consultation-log-calendar-block">
      <ContentCard className="mg-v2-consultation-log-calendar-block__card">
        <div className="mg-v2-consultation-log-calendar-wrapper" data-calendar-key={calendarRemountKey}>
          <FullCalendar
            key={calendarRemountKey}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            initialDate={calendarInitialDate}
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            buttonText={{ today: t('calendar.today') }}
            height="auto"
            locale="ko"
            dayMaxEvents={CALENDAR_DAY_MAX_EVENTS}
            moreLinkText={(count) => t('calendar.more', { n: count })}
            datesSet={handleDatesSet}
          />
        </div>
        {popover && (
          <div
            ref={popoverRef}
            className="mg-v2-consultation-log-calendar-popover"
            role="dialog"
            aria-modal="true"
            aria-label={t('calendar.dayList', { date: popover.dateStr })}
          >
            <div className="mg-v2-consultation-log-calendar-popover__title">
              {t('calendar.dayList', { date: popover.dateStr })}
              {' '}
              {t('calendar.dayCount', { n: popover.records.length })}
            </div>
            <ul className="mg-v2-consultation-log-calendar-popover__list">
              {popover.records.map((r) => {
                const clientName = resolvePersonName(
                  r.clientName,
                  r.clientId,
                  clientNameMap,
                  unknownName
                );
                return (
                  <li key={r.id}>
                    <MGButton
                      type="button"
                      variant="outline"
                      size="small"
                      className={buildErpMgButtonClassName({
                        variant: 'outline',
                        size: 'sm',
                        loading: false,
                        className: 'mg-v2-consultation-log-calendar-popover__item'
                      })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={() => handleSelectRecord(r.id)}
                      preventDoubleClick={false}
                    >
                      {clientName}
                    </MGButton>
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
  onOpenModal: PropTypes.func.isRequired,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  onVisibleRangeChange: PropTypes.func
};

export default ConsultationLogCalendarBlock;
