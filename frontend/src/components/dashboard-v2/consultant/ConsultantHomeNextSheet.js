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
  COVER_CHAPTER_ZERO_BODY_REMAINING_EMPTY,
  COVER_CHAPTER_ZERO_META,
  COVER_CHAPTER_SHEET_KIND_REMAINING_EMPTY,
  COVER_CHAPTER_SHEET_KIND_TRUE_EMPTY
} from './consultantCoverChapterConstants';

const EMPTY_DISPLAY_PLACEHOLDER = '—';

/**
 * 시트 행 표시 여부 — 빈값·whitespace·「—」는 행 자체 미렌더
 *
 * @param {*} value
 * @returns {string|null} trim 된 표시 문자열 또는 null
 */
const resolveSheetLine = (value) => {
  const label = toDisplayString(value, '').trim();
  if (!label || label === EMPTY_DISPLAY_PLACEHOLDER) {
    return null;
  }
  return label;
};

/**
 * zero body — remaining-empty vs true-empty
 *
 * @param {string|null|undefined} sheetKind
 * @param {number} todayCount
 * @returns {string}
 */
const resolveZeroBody = (sheetKind, todayCount) => {
  if (sheetKind === COVER_CHAPTER_SHEET_KIND_REMAINING_EMPTY) {
    return COVER_CHAPTER_ZERO_BODY_REMAINING_EMPTY;
  }
  if (sheetKind === COVER_CHAPTER_SHEET_KIND_TRUE_EMPTY) {
    return COVER_CHAPTER_ZERO_BODY;
  }
  return todayCount > 0
    ? COVER_CHAPTER_ZERO_BODY_REMAINING_EMPTY
    : COVER_CHAPTER_ZERO_BODY;
};

/**
 * Clinic-OS Next-Sheet — has: 상담일지 열기+일정 / zero: 일정 열기 only
 *
 * @author CoreSolution
 * @since 2026-10-29
 */
const ConsultantHomeNextSheet = ({
  nextConsultation,
  sheetKind,
  todayCount = 0,
  onOpenConsultation,
  onOpenSchedule
}) => {
  const hasNext = Boolean(nextConsultation);

  if (!hasNext) {
    const zeroBody = resolveZeroBody(sheetKind, todayCount);

    return (
      <div
        className="consultant-cover-chapter__sheet"
        data-testid={COVER_CHAPTER_NEXT_SHEET_TEST_ID}
        data-state="zero"
        data-sheet-kind={sheetKind
          || (todayCount > 0
            ? COVER_CHAPTER_SHEET_KIND_REMAINING_EMPTY
            : COVER_CHAPTER_SHEET_KIND_TRUE_EMPTY)}
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
        <p className="consultant-cover-chapter__sheet-body">{zeroBody}</p>
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

  const timeLabel = resolveSheetLine(nextConsultation.timeLabel);
  const bodyLabel = resolveSheetLine(nextConsultation.bodyLabel);
  const metaLabel = resolveSheetLine(nextConsultation.metaLabel);
  const badgeLabel = toDisplayString(
    nextConsultation.badgeLabel,
    COVER_CHAPTER_BADGE_CONFIRMED
  );

  return (
    <div
      className="consultant-cover-chapter__sheet"
      data-testid={COVER_CHAPTER_NEXT_SHEET_TEST_ID}
      data-state="has"
      data-sheet-kind={sheetKind || nextConsultation.sheetKind || undefined}
    >
      <div className="consultant-cover-chapter__sheet-kicker">
        <span className="consultant-cover-chapter__sheet-lab">{COVER_CHAPTER_NEXT_LABEL}</span>
        <span className="consultant-cover-chapter__badge consultant-cover-chapter__badge--ok">
          <SafeText tag="span" fallback="">{badgeLabel}</SafeText>
        </span>
      </div>
      {timeLabel ? (
        <p className="consultant-cover-chapter__sheet-dom">
          <SafeText tag="span" fallback="">{timeLabel}</SafeText>
        </p>
      ) : null}
      {bodyLabel ? (
        <p className="consultant-cover-chapter__sheet-body">
          <SafeText tag="span" fallback="">{bodyLabel}</SafeText>
        </p>
      ) : null}
      {metaLabel ? (
        <p className="consultant-cover-chapter__sheet-meta">
          <SafeText tag="span" fallback="">{metaLabel}</SafeText>
        </p>
      ) : null}
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
    sheetKind: PropTypes.string,
    scheduleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  sheetKind: PropTypes.string,
  todayCount: PropTypes.number,
  onOpenConsultation: PropTypes.func.isRequired,
  onOpenSchedule: PropTypes.func.isRequired
};

export default ConsultantHomeNextSheet;
