/**
 * 테넌트 홈·설정 공유 — 사업자·약관 푸터 미리보기
 * 공개 crawl 표면: /legal/terms · /legal/privacy · /legal/products · /legal/refund Link.
 * 환불 본문은 /legal/refund (테넌트 refundPolicyText 우선, 없으면 플랫폼 SSOT).
 * 플랫폼 /terms · /privacy 가짜 hop 금지. Modal-only 공개 법적 문서 금지.
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  LEGAL_PUBLIC_LABELS,
  LEGAL_PUBLIC_PATHS
} from '../../constants/legalPublic';
import './MerchantLegalFooterPreview.css';

const PLACEHOLDER = {
  biz: '사업자등록번호',
  rep: '대표',
  phone: '유선',
  address: '주소 (테넌트 DB)',
  mailOrder: '통신판매업 신고번호'
};

/**
 * @param {object} props
 * @param {string} props.centerName
 * @param {object} props.legal
 * @param {boolean} [props.showAccountLinks]
 * @param {boolean} [props.compact]
 * @param {string} [props.className]
 */
const MerchantLegalFooterPreview = ({
  centerName = '',
  legal = {},
  showAccountLinks = true,
  compact = false,
  className = ''
}) => {
  const name = (centerName && String(centerName).trim()) || '{센터명}';
  const biz = legal.businessRegistrationNumber?.trim() || PLACEHOLDER.biz;
  const rep = legal.representativeName?.trim() || PLACEHOLDER.rep;
  const phone = legal.businessLandline?.trim() || PLACEHOLDER.phone;
  const address = legal.businessAddress?.trim() || PLACEHOLDER.address;
  const mailOrder = legal.mailOrderReportNumber?.trim() || PLACEHOLDER.mailOrder;

  return (
    <footer
      className={`mg-merchant-legal-footer${compact ? ' mg-merchant-legal-footer--compact' : ''} ${className}`.trim()}
      role="contentinfo"
      id="tenant-home-legal"
      data-testid="merchant-legal-footer"
    >
      <div className="mg-merchant-legal-footer__grid">
        <div className="mg-merchant-legal-footer__col">
          <h3 className="mg-merchant-legal-footer__title">{name}</h3>
          <p className="mg-merchant-legal-footer__line">
            {biz}
            {' · '}
            {rep}
            {' · '}
            {phone}
          </p>
          <p className="mg-merchant-legal-footer__line">{address}</p>
          <p className="mg-merchant-legal-footer__line">{mailOrder}</p>
        </div>

        <div className="mg-merchant-legal-footer__col">
          <h3 className="mg-merchant-legal-footer__title">안내</h3>
          <Link
            to={LEGAL_PUBLIC_PATHS.TERMS}
            className="mg-merchant-legal-footer__link"
            data-testid="legal-public-link-terms"
          >
            <span className="mg-merchant-legal-footer__link-label">
              {LEGAL_PUBLIC_LABELS.TERMS}
            </span>
          </Link>
          <Link
            to={LEGAL_PUBLIC_PATHS.PRIVACY}
            className="mg-merchant-legal-footer__link"
            data-testid="legal-public-link-privacy"
          >
            <span className="mg-merchant-legal-footer__link-label">
              {LEGAL_PUBLIC_LABELS.PRIVACY}
            </span>
          </Link>
          <Link
            to={LEGAL_PUBLIC_PATHS.PRODUCTS}
            className="mg-merchant-legal-footer__link"
            data-testid="legal-public-link-products"
          >
            <span className="mg-merchant-legal-footer__link-label">
              {LEGAL_PUBLIC_LABELS.PRODUCTS}
            </span>
          </Link>
          <Link
            to={LEGAL_PUBLIC_PATHS.REFUND}
            className="mg-merchant-legal-footer__link"
            data-testid="legal-public-link-refund"
          >
            <span className="mg-merchant-legal-footer__link-label">
              {LEGAL_PUBLIC_LABELS.REFUND}
            </span>
          </Link>
        </div>

        {showAccountLinks && (
          <div className="mg-merchant-legal-footer__col">
            <h3 className="mg-merchant-legal-footer__title">계정</h3>
            <Link to="/login" className="mg-merchant-legal-footer__link">
              로그인
            </Link>
            <Link
              to={LEGAL_PUBLIC_PATHS.PRIVACY}
              className="mg-merchant-legal-footer__link"
              data-testid="legal-account-privacy-link"
            >
              {LEGAL_PUBLIC_LABELS.PRIVACY}
            </Link>
          </div>
        )}
      </div>
    </footer>
  );
};

MerchantLegalFooterPreview.propTypes = {
  centerName: PropTypes.string,
  legal: PropTypes.shape({
    businessRegistrationNumber: PropTypes.string,
    representativeName: PropTypes.string,
    businessLandline: PropTypes.string,
    businessAddress: PropTypes.string,
    mailOrderReportNumber: PropTypes.string,
    refundPolicyText: PropTypes.string,
    productPriceGuideText: PropTypes.string
  }),
  showAccountLinks: PropTypes.bool,
  compact: PropTypes.bool,
  className: PropTypes.string
};

export default MerchantLegalFooterPreview;
