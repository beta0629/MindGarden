import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  COVER_CHAPTER_NEXT_SHEET_TEST_ID,
  COVER_CHAPTER_NEXT_LABEL,
  COVER_CHAPTER_BADGE_CONFIRMED,
  COVER_CHAPTER_BADGE_NONE,
  COVER_CHAPTER_CTA_OPEN_CONSULTATION,
  COVER_CHAPTER_CTA_SCHEDULE,
  COVER_CHAPTER_CTA_OPEN_SCHEDULE,
  COVER_CHAPTER_ZERO_DOM,
  COVER_CHAPTER_ZERO_UNIT,
  COVER_CHAPTER_ZERO_BODY,
  COVER_CHAPTER_ZERO_META
} from './consultantCoverChapterConstants';

/**
 * Clinic-OS Next-Sheet — has: 상담 열기+일정 / zero: 일정 열기 only
 *
 * @author CoreSolution
 * @since 2026-10-29
 */
const ConsultantHomeNextSheet = ({
  nextConsultation,
  onOpenConsultation,
  onOpenSchedule
}) => {
  const hasNext = Boolean(nextConsultation);

  if (!hasNext) {
    return (
      <div
        className="consultant-cover-chapter__sheet"
        data-testid={COVER_CHAPTER_NEXT_SHEET_TEST_ID}
        data-state="zero"
      >
        <div className="consultant-cover-chapter__sheet-kicker">
          <span className="consultant-cover-chapter__sheet-lab">{COVER_CHAPTER_NEXT_LABEL}</span>
          <span className="consultant-cover-chapter__badge consultant-cover-chapter__badge--mute">
            {COVER_CHAPTER_BADGE_NONE}
          </span>
        </div>
        <p className="consultant-cover-chapter__sheet-dom">
          {COVER_CHAPTER_ZERO_DOM}
          <span className="consultant-cover-chapter__sheet-dom-unit">{COVER_CHAPTER_ZERO_UNIT}</span>
        </p>
        <p className="consultant-cover-chapter__sheet-body">{COVER_CHAPTER_ZERO_BODY}</p>
        <p className="consultant-cover-chapter__sheet-meta">{COVER_CHAPTER_ZERO_META}</p>
        <div className="consultant-cover-chapter__cta-row">
          <MGButton
            type="button"
            variant="primary"
            className="consultant-cover-chapter__cta consultant-cover-chapter__cta--primary"
            onClick={onOpenSchedule}
            preventDoubleClick={false}
            aria-label={COVER_CHAPTER_CTA_OPEN_SCHEDULE}
          >
            {COVER_CHAPTER_CTA_OPEN_SCHEDULE}
          </MGButton>
        </div>
      </div>
    );
  }

  const timeLabel = toDisplayString(nextConsultation.timeLabel, '');
  const bodyLabel = toDisplayString(nextConsultation.bodyLabel, '');
  const metaLabel = toDisplayString(nextConsultation.metaLabel, '');
  const badgeLabel = toDisplayString(
    nextConsultation.badgeLabel,
    COVER_CHAPTER_BADGE_CONFIRMED
  );

  return (
    <div
      className="consultant-cover-chapter__sheet"
      data-testid={COVER_CHAPTER_NEXT_SHEET_TEST_ID}
      data-state="has"
    >
      <div className="consultant-cover-chapter__sheet-kicker">
        <span className="consultant-cover-chapter__sheet-lab">{COVER_CHAPTER_NEXT_LABEL}</span>
        <span className="consultant-cover-chapter__badge consultant-cover-chapter__badge--ok">
          <SafeText tag="span">{badgeLabel}</SafeText>
        </span>
      </div>
      <p className="consultant-cover-chapter__sheet-dom">
        <SafeText tag="span">{timeLabel}</SafeText>
      </p>
      <p className="consultant-cover-chapter__sheet-body">
        <SafeText tag="span">{bodyLabel}</SafeText>
      </p>
      <p className="consultant-cover-chapter__sheet-meta">
        <SafeText tag="span">{metaLabel}</SafeText>
      </p>
      <div className="consultant-cover-chapter__cta-row">
        <MGButton
          type="button"
          variant="primary"
          className="consultant-cover-chapter__cta consultant-cover-chapter__cta--primary"
          onClick={onOpenConsultation}
          preventDoubleClick={false}
          aria-label={COVER_CHAPTER_CTA_OPEN_CONSULTATION}
        >
          {COVER_CHAPTER_CTA_OPEN_CONSULTATION}
        </MGButton>
        <MGButton
          type="button"
          variant="outline"
          className="consultant-cover-chapter__cta consultant-cover-chapter__cta--ghost"
          onClick={onOpenSchedule}
          preventDoubleClick={false}
          aria-label={COVER_CHAPTER_CTA_SCHEDULE}
        >
          {COVER_CHAPTER_CTA_SCHEDULE}
        </MGButton>
      </div>
    </div>
  );
};

ConsultantHomeNextSheet.propTypes = {
  nextConsultation: PropTypes.shape({
    timeLabel: PropTypes.string,
    bodyLabel: PropTypes.string,
    metaLabel: PropTypes.string,
    badgeLabel: PropTypes.string,
    scheduleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  onOpenConsultation: PropTypes.func.isRequired,
  onOpenSchedule: PropTypes.func.isRequired
};

export default ConsultantHomeNextSheet;
