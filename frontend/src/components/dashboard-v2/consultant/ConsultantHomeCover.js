import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import CoverClinicSvg, {
  COVER_CLINIC_SVG_VARIANT_LANDSCAPE,
  COVER_CLINIC_SVG_VARIANT_PORTRAIT
} from '../../client/clientDashboard/coverChapter/CoverClinicSvg';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  COVER_CHAPTER_SVG_VARIANT_LANDSCAPE,
  COVER_CHAPTER_SVG_VARIANT_PORTRAIT
} from './consultantCoverChapterConstants';

/**
 * Clinic-OS Cover — 상담실 SVG + 센터·상담사 오버레이
 * 햄버거는 AdminCommonLayout MobileGnb 단일 유지 (커버 중복 금지).
 *
 * @author CoreSolution
 * @since 2026-10-29
 */
const ConsultantHomeCover = ({
  brandName,
  kicker,
  consultantName,
  subtitle,
  titleId,
  variant = COVER_CHAPTER_SVG_VARIANT_PORTRAIT,
  children
}) => {
  const svgVariant = variant === COVER_CHAPTER_SVG_VARIANT_LANDSCAPE
    ? COVER_CLINIC_SVG_VARIANT_LANDSCAPE
    : COVER_CLINIC_SVG_VARIANT_PORTRAIT;

  return (
    <div className="consultant-cover-chapter__cover" data-cover-variant={variant}>
      <div className="consultant-cover-chapter__cover-clip" aria-hidden="true">
        <CoverClinicSvg
          className="consultant-cover-chapter__cover-svg"
          variant={svgVariant}
        />
      </div>

      <div className="consultant-cover-chapter__cover-top">
        <SafeText tag="span" className="consultant-cover-chapter__brand" fallback="">
          {toDisplayString(brandName, '')}
        </SafeText>
      </div>

      <div className="consultant-cover-chapter__meta">
        <p className="consultant-cover-chapter__kicker">
          <SafeText tag="span" fallback="">{toDisplayString(kicker, '')}</SafeText>
        </p>
        <h1 className="consultant-cover-chapter__name" id={titleId}>
          <SafeText tag="span" fallback="">{toDisplayString(consultantName, '')}</SafeText>
        </h1>
        <p className="consultant-cover-chapter__sub">
          <SafeText tag="span" fallback="">{toDisplayString(subtitle, '')}</SafeText>
        </p>
      </div>

      {children}
    </div>
  );
};

ConsultantHomeCover.propTypes = {
  brandName: PropTypes.string,
  kicker: PropTypes.string,
  consultantName: PropTypes.string,
  subtitle: PropTypes.string,
  titleId: PropTypes.string,
  variant: PropTypes.oneOf([
    COVER_CHAPTER_SVG_VARIANT_PORTRAIT,
    COVER_CHAPTER_SVG_VARIANT_LANDSCAPE
  ]),
  children: PropTypes.node
};

export default ConsultantHomeCover;
