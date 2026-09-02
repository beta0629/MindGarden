/**
 * ScheduleNotesReminderModal — 상담 시작 5분 전 특이사항 알림 (통합 스케줄 전용)
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import React from 'react';
import PropTypes from 'prop-types';
import UnifiedModal from '../../../../common/modals/UnifiedModal';
import ActionBar from '../../../../common/ActionBar';
import ActionBarButton from '../../../../common/ActionBarButton';
import SafeText from '../../../../common/SafeText';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import ScheduleClientNotesReadOnlyList from './ScheduleClientNotesReadOnlyList';
import './ScheduleNotesReminderModal.css';

const ScheduleNotesReminderModal = ({
  isOpen,
  onClose,
  clientName,
  consultantName,
  startTimeLabel,
  notes
}) => {
  const subtitleParts = [
    clientName ? String(clientName).trim() : '',
    startTimeLabel ? String(startTimeLabel).trim() : ''
  ].filter(Boolean);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="곧 상담이 시작됩니다"
      size="medium"
      className="mg-v2-ad-b0kla schedule-notes-reminder-modal"
      backdropClick
      showCloseButton
      actions={(
        <ActionBar align="end" gap="md">
          <ActionBarButton variant="primary" onClick={onClose}>
            확인했습니다
          </ActionBarButton>
        </ActionBar>
      )}
    >
      <div className="schedule-notes-reminder-modal__intro">
        <p className="schedule-notes-reminder-modal__lead">
          <SafeText>
            {toDisplayString(
              '상담 시작 5분 전입니다. 일정 상세를 열지 않고도 특이사항을 미리 확인할 수 있습니다.',
              ''
            )}
          </SafeText>
        </p>
        {subtitleParts.length > 0 ? (
          <p className="mg-v2-text-secondary schedule-notes-reminder-modal__session">
            <SafeText>
              {toDisplayString(subtitleParts.join(' · '), '')}
            </SafeText>
            {consultantName ? (
              <span className="schedule-notes-reminder-modal__consultant">
                <SafeText>{toDisplayString(`상담사 ${consultantName}`, '')}</SafeText>
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
      <div className="mg-v2-ad-modal__section">
        <div className="section-title">내담자 특이사항</div>
        <ScheduleClientNotesReadOnlyList notes={notes} />
      </div>
    </UnifiedModal>
  );
};

ScheduleNotesReminderModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  clientName: PropTypes.string,
  consultantName: PropTypes.string,
  startTimeLabel: PropTypes.string,
  notes: PropTypes.arrayOf(PropTypes.object)
};

ScheduleNotesReminderModal.defaultProps = {
  isOpen: false,
  clientName: '',
  consultantName: '',
  startTimeLabel: '',
  notes: []
};

export default ScheduleNotesReminderModal;
