/**
 * 챕터 02 안내
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import CoverGuideDenseRow from '../../../common/coverChapter/CoverGuideDenseRow';
import { CLIENT_DASHBOARD_ROUTES } from '../../../../constants/clientDashboardRoutes';
import { CLIENT_SHOP_ROUTES } from '../../../../constants/clientShopConstants';
import {
  CLIENT_COVER_CHAPTER_GUIDE,
  CLIENT_COVER_CHAPTER_NUM_02,
  CLIENT_COVER_GUIDE_BODY_HAS,
  CLIENT_COVER_GUIDE_BODY_ZERO,
  CLIENT_COVER_GUIDE_GO_ARIA,
  CLIENT_COVER_GUIDE_TITLE_HAS,
  CLIENT_COVER_GUIDE_TITLE_ZERO,
  CLIENT_COVER_SHEET_MODE
} from '../constants';

/**
 * @param {object} props
 * @param {string} props.sheetMode
 */
const GuideChapter = ({ sheetMode }) => {
  const navigate = useNavigate();
  const isZero = sheetMode === CLIENT_COVER_SHEET_MODE.ZERO;
  const title = isZero ? CLIENT_COVER_GUIDE_TITLE_ZERO : CLIENT_COVER_GUIDE_TITLE_HAS;
  const body = isZero ? CLIENT_COVER_GUIDE_BODY_ZERO : CLIENT_COVER_GUIDE_BODY_HAS;
  const goTo = isZero ? CLIENT_SHOP_ROUTES.CATALOG : CLIENT_DASHBOARD_ROUTES.SCHEDULE;

  return (
    <section className="client-cover__chapter" aria-labelledby="client-cover-chap-guide">
      <div className="client-cover__chap-head">
        <span className="client-cover__chap-num">{CLIENT_COVER_CHAPTER_NUM_02}</span>
        <h2 className="client-cover__chap-title" id="client-cover-chap-guide">
          {CLIENT_COVER_CHAPTER_GUIDE}
        </h2>
      </div>
      <CoverGuideDenseRow
        title={title}
        body={body}
        asButton
        ariaLabel={CLIENT_COVER_GUIDE_GO_ARIA}
        onClick={() => navigate(goTo)}
      />
    </section>
  );
};

GuideChapter.propTypes = {
  sheetMode: PropTypes.string.isRequired
};

export default GuideChapter;
