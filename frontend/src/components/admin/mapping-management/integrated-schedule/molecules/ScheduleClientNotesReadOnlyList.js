/**
 * ScheduleClientNotesReadOnlyList — 특이사항 목록 읽기 전용 (알림 모달·미리보기)
 * 카드는 일정 상세 모달과 같은 ScheduleClientNoteCard 를 액션 없이 쓴다.
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../../../common/SafeText';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import { isScheduleClientNoteUnresolved } from '../../../../../utils/scheduleClientNoteTypeUtils';
import { useScheduleClientNoteTypeLabels } from '../../../../../hooks/useScheduleClientNoteTypeLabels';
import ScheduleClientNoteCard, {
  SCHEDULE_CLIENT_NOTE_CARD_ITEM_CLASS
} from '../../../../schedule/molecules/ScheduleClientNoteCard';
import {
  CLIENT_SCHEDULE_NOTES_EMPTY_UNRESOLVED,
  CLIENT_SCHEDULE_NOTES_RESOLVED_GROUP_TITLE,
  CLIENT_SCHEDULE_NOTES_UNRESOLVED_GROUP_TITLE
} from '../../../../../constants/clientScheduleNoteConstants';
import './ScheduleClientNotesReadOnlyList.css';

const ScheduleClientNotesReadOnlyList = ({ notes }) => {
  const { getLabel } = useScheduleClientNoteTypeLabels();
  const open = notes.filter((n) => isScheduleClientNoteUnresolved(n));
  const done = notes.filter((n) => !isScheduleClientNoteUnresolved(n));

  const renderItem = (note) => (
    <li key={String(note.id)} className={SCHEDULE_CLIENT_NOTE_CARD_ITEM_CLASS}>
      <ScheduleClientNoteCard note={note} getTypeLabel={getLabel} />
    </li>
  );

  return (
    <div className="schedule-client-notes-readonly">
      <div className="section-title schedule-client-notes-readonly__group-title">
        {`${CLIENT_SCHEDULE_NOTES_UNRESOLVED_GROUP_TITLE} (${open.length})`}
      </div>
      {open.length === 0 ? (
        <p className="mg-v2-text-secondary schedule-client-notes-readonly__empty">
          <SafeText>{toDisplayString(CLIENT_SCHEDULE_NOTES_EMPTY_UNRESOLVED, '')}</SafeText>
        </p>
      ) : (
        <ul className="mg-v2-list-unstyled">{open.map(renderItem)}</ul>
      )}
      {done.length > 0 ? (
        <>
          <div className="section-title schedule-client-notes-readonly__group-title--resolved">
            {`${CLIENT_SCHEDULE_NOTES_RESOLVED_GROUP_TITLE} (${done.length})`}
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
