/**
 * ScheduleClientNoteCard — 내담자 특이사항 카드 (Clinic-OS CardContainer + CardActionGroup)
 * 일정 상세 모달(편집)·통합 스케줄 알림 모달(읽기 전용)이 같은 카드를 쓴다.
 * 액션 핸들러를 넘기지 않으면 버튼 행을 그리지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import CardContainer from '../../common/CardContainer';
import CardActionGroup from '../../common/CardActionGroup';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  formatScheduleClientNoteMeta,
  isScheduleClientNotePromiseOverdue,
  isScheduleClientNoteUnresolved
} from '../../../utils/scheduleClientNoteTypeUtils';
import {
  CLIENT_SCHEDULE_NOTES_ACTION_REOPEN,
  CLIENT_SCHEDULE_NOTES_ACTION_RESOLVE,
  CLIENT_SCHEDULE_NOTES_BADGE_OVERDUE,
  CLIENT_SCHEDULE_NOTES_BADGE_RESOLVED
} from '../../../constants/clientScheduleNoteConstants';
import './ScheduleClientNoteCard.css';

export const SCHEDULE_CLIENT_NOTE_CARD_CLASS = 'schedule-client-note-card';
export const SCHEDULE_CLIENT_NOTE_CARD_ITEM_CLASS = 'schedule-client-note-card-item';

const BUTTON_SIZE = 'small';
const BUTTON_VARIANT = {
  RESOLVE: 'primary',
  REOPEN: 'outline',
  EDIT: 'secondary',
  DELETE: 'danger-outline'
};

const ScheduleClientNoteCard = ({
  note,
  getTypeLabel,
  showScheduleDate,
  onResolve,
  onReopen,
  onEdit,
  onDelete,
  actionsDisabled
}) => {
  const { t } = useTranslation();
  const unresolved = isScheduleClientNoteUnresolved(note);
  const overdue = isScheduleClientNotePromiseOverdue(note);
  const statusHandler = unresolved ? onResolve : onReopen;
  const hasActions = Boolean(statusHandler || onEdit || onDelete);

  const cardClassName = [
    SCHEDULE_CLIENT_NOTE_CARD_CLASS,
    overdue ? `${SCHEDULE_CLIENT_NOTE_CARD_CLASS}--overdue` : '',
    unresolved ? '' : `${SCHEDULE_CLIENT_NOTE_CARD_CLASS}--resolved`
  ].filter(Boolean).join(' ');

  const meta = formatScheduleClientNoteMeta(note, getTypeLabel, { includeScheduleDate: showScheduleDate });

  return (
    <CardContainer className={cardClassName} data-testid="schedule-client-note-card">
      <div className="schedule-client-note-card__title-row">
        <SafeText>{toDisplayString(note?.title, '')}</SafeText>
        {overdue ? (
          <span className="mg-v2-badge warning schedule-client-note-card__badge">
            {CLIENT_SCHEDULE_NOTES_BADGE_OVERDUE}
          </span>
        ) : null}
        {unresolved ? null : (
          <span className="mg-v2-badge secondary schedule-client-note-card__badge">
            {CLIENT_SCHEDULE_NOTES_BADGE_RESOLVED}
          </span>
        )}
      </div>
      {meta ? (
        <p className="schedule-client-note-card__meta">
          <SafeText>{toDisplayString(meta, '')}</SafeText>
        </p>
      ) : null}
      {note?.body ? (
        <p className="schedule-client-note-card__body">
          <SafeText>{toDisplayString(note.body, '')}</SafeText>
        </p>
      ) : null}
      {hasActions ? (
        <CardActionGroup
          align="end"
          className="schedule-client-note-card__actions"
          data-testid="schedule-client-note-card-actions"
        >
          {statusHandler ? (
            <MGButton
              type="button"
              variant={unresolved ? BUTTON_VARIANT.RESOLVE : BUTTON_VARIANT.REOPEN}
              size={BUTTON_SIZE}
              preventDoubleClick={false}
              onClick={() => statusHandler(note)}
              disabled={actionsDisabled}
              data-testid={unresolved ? 'schedule-client-note-resolve' : 'schedule-client-note-reopen'}
            >
              {unresolved ? CLIENT_SCHEDULE_NOTES_ACTION_RESOLVE : CLIENT_SCHEDULE_NOTES_ACTION_REOPEN}
            </MGButton>
          ) : null}
          {onEdit ? (
            <MGButton
              type="button"
              variant={BUTTON_VARIANT.EDIT}
              size={BUTTON_SIZE}
              preventDoubleClick={false}
              onClick={() => onEdit(note)}
              disabled={actionsDisabled}
              data-testid="schedule-client-note-edit"
            >
              {t('common.actions.edit')}
            </MGButton>
          ) : null}
          {onDelete ? (
            <MGButton
              type="button"
              variant={BUTTON_VARIANT.DELETE}
              size={BUTTON_SIZE}
              preventDoubleClick={false}
              onClick={() => onDelete(note)}
              disabled={actionsDisabled}
              data-testid="schedule-client-note-delete"
            >
              {t('common.actions.delete')}
            </MGButton>
          ) : null}
        </CardActionGroup>
      ) : null}
    </CardContainer>
  );
};

ScheduleClientNoteCard.propTypes = {
  note: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    body: PropTypes.string,
    noteType: PropTypes.string,
    promiseDate: PropTypes.string,
    scheduleDate: PropTypes.string,
    resolvedAt: PropTypes.string
  }).isRequired,
  getTypeLabel: PropTypes.func.isRequired,
  showScheduleDate: PropTypes.bool,
  onResolve: PropTypes.func,
  onReopen: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  actionsDisabled: PropTypes.bool
};

ScheduleClientNoteCard.defaultProps = {
  showScheduleDate: false,
  onResolve: null,
  onReopen: null,
  onEdit: null,
  onDelete: null,
  actionsDisabled: false
};

export default ScheduleClientNoteCard;
