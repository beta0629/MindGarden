import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  COVER_CHAPTER_GUIDE_TEST_ID,
  COVER_CHAPTER_CHAP_GUIDE_NUM,
  COVER_CHAPTER_CHAP_GUIDE_TITLE,
  COVER_CHAPTER_GUIDE_DEFAULT_TITLE,
  COVER_CHAPTER_GUIDE_EMPTY,
  COVER_CHAPTER_GUIDE_MORE_ARIA
} from './consultantCoverChapterConstants';

/**
 * Clinic-OS Chapter 02 — 안내 (공지 · 일지 힌트)
 *
 * @author CoreSolution
 * @since 2026-10-29
 */
const ConsultantHomeGuideChapter = ({
  title,
  body,
  onOpen
}) => {
  const displayTitle = toDisplayString(title, COVER_CHAPTER_GUIDE_DEFAULT_TITLE);
  const displayBody = toDisplayString(body, COVER_CHAPTER_GUIDE_EMPTY);

  return (
    <section
      className="consultant-cover-chapter__chapter"
      data-testid={COVER_CHAPTER_GUIDE_TEST_ID}
      aria-labelledby="consultant-home-chap-guide-title"
    >
      <div className="consultant-cover-chapter__chap-head">
        <span className="consultant-cover-chapter__chap-num">
          {COVER_CHAPTER_CHAP_GUIDE_NUM}
        </span>
        <h2
          className="consultant-cover-chapter__chap-title"
          id="consultant-home-chap-guide-title"
        >
          {COVER_CHAPTER_CHAP_GUIDE_TITLE}
        </h2>
      </div>

      <button
        type="button"
        className="consultant-cover-chapter__guide-card"
        onClick={onOpen}
        aria-label={COVER_CHAPTER_GUIDE_MORE_ARIA}
      >
        <h4 className="consultant-cover-chapter__guide-title">
          <SafeText tag="span">{displayTitle}</SafeText>
        </h4>
        <p className="consultant-cover-chapter__guide-body">
          <SafeText tag="span">{displayBody}</SafeText>
        </p>
        <span className="consultant-cover-chapter__guide-go" aria-hidden="true">›</span>
      </button>
    </section>
  );
};

ConsultantHomeGuideChapter.propTypes = {
  title: PropTypes.string,
  body: PropTypes.string,
  onOpen: PropTypes.func
};

export default ConsultantHomeGuideChapter;
