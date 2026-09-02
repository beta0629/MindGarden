/**
 * ScheduleClientNotesReadOnlyList — 특이사항 목록 읽기 전용 (알림 모달·미리보기)
 * ScheduleClientNotesSection 목록 렌더와 동일 필드(title, body, noteType, promiseDate, resolvedAt).
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../../../common/SafeText';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import './ScheduleClientNotesReadOnlyList.css';

const isUnresolved = (note) => !note?.resolvedAt;

const isPromiseOverdue = (note) => {
  if (!isUnresolved(note) || !note?.promiseDate) return false;
  const d = String(note.promiseDate).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${day}`;
  return d < todayStr;
};

const ScheduleClientNotesReadOnlyList = ({ notes }) => {
  const open = notes.filter((n) => isUnresolved(n));
  const done = notes.filter((n) => !isUnresolved(n));

  const renderItem = (note) => {
    const overdue = isPromiseOverdue(note);
    const resolved = !isUnresolved(note);
    const itemClassName = [
      'mg-v2-card',
      'mg-v2-card--flat',
      'schedule-client-notes-readonly__item',
      overdue ? 'schedule-client-notes-readonly__item--overdue' : '',
      resolved ? 'schedule-client-notes-readonly__item--resolved' : ''
    ].filter(Boolean).join(' ');

    return (
      <li key={String(note.id)} className={itemClassName}>
        <div className="schedule-client-notes-readonly__item-title">
          <SafeText>{toDisplayString(note.title, '')}</SafeText>
          {overdue ? (
            <span className="mg-v2-badge warning schedule-client-notes-readonly__item-badge">
              약속일 경과
            </span>
          ) : null}
          {resolved ? (
            <span className="mg-v2-badge secondary schedule-client-notes-readonly__item-badge">
              해소됨
            </span>
          ) : null}
        </div>
        <div className="mg-v2-text-secondary schedule-client-notes-readonly__item-meta">
          <SafeText>
            {toDisplayString(
              `${note.noteType || ''}${note.promiseDate ? ` · 약속일 ${note.promiseDate}` : ''}`,
              ''
            )}
          </SafeText>
        </div>
        {note.body ? (
          <div className="schedule-client-notes-readonly__item-body">
            <SafeText>{toDisplayString(note.body, '')}</SafeText>
          </div>
        ) : null}
      </li>
    );
  };

  return (
    <div className="schedule-client-notes-readonly">
      <div className="section-title schedule-client-notes-readonly__group-title">
        미해소 ({open.length})
      </div>
      {open.length === 0 ? (
        <p className="mg-v2-text-secondary schedule-client-notes-readonly__empty">
          <SafeText>{toDisplayString('미해소 특이사항이 없습니다.', '')}</SafeText>
        </p>
      ) : (
        <ul className="mg-v2-list-unstyled">{open.map(renderItem)}</ul>
      )}
      {done.length > 0 ? (
        <>
          <div className="section-title schedule-client-notes-readonly__group-title--resolved">
            해소됨 ({done.length})
          </div>
          <ul className="mg-v2-list-unstyled">{done.map(renderItem)}</ul>
        </>
      ) : null}
    </div>
  );
};

ScheduleClientNotesReadOnlyList.propTypes = {
  notes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    body: PropTypes.string,
    noteType: PropTypes.string,
    promiseDate: PropTypes.string,
    resolvedAt: PropTypes.string
  }))
};

ScheduleClientNotesReadOnlyList.defaultProps = {
  notes: []
};

export default ScheduleClientNotesReadOnlyList;
