/**
 * 테넌트 홈·설정 공유 — 사업자·약관 푸터 미리보기
 * 공개 crawl 표면: /legal/terms · /legal/privacy · /legal/products Link.
 * 환불 등록 문구는 선택적 보조 UnifiedModal. 플랫폼 /terms · /privacy 가짜 hop 금지.
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import UnifiedModal from '../common/modals/UnifiedModal';
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

/** 청약|철회 중간 줄바꿈 방지용 U+2060 WORD JOINER */
const REFUND_LABEL = '환불·취소·청약\u2060철회';

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
  const refundText = legal.refundPolicyText?.trim() || '';

  const [guideModal, setGuideModal] = useState({
    isOpen: false,
    title: '',
    body: ''
  });

  const openGuide = useCallback((title, body) => {
    setGuideModal({ isOpen: true, title, body });
  }, []);

  const closeGuide = useCallback(() => {
    setGuideModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <footer
      className={`mg-merchant-legal-footer${compact ? ' mg-merchant-legal-footer--compact' : ''} ${className}`.trim()}
      role="contentinfo"
      id="tenant-home-legal"
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
          {refundText ? (
            <button
              type="button"
              className="mg-merchant-legal-footer__link"
              id="counseling-guide-refund"
              data-testid="counseling-guide-refund"
              onClick={() => openGuide(REFUND_LABEL.replace(/\u2060/g, ''), refundText)}
            >
              <span className="mg-merchant-legal-footer__link-label">{REFUND_LABEL}</span>
            </button>
          ) : null}
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
      {!compact && (
        <p className="mg-merchant-legal-footer__note">
          호스트로 테넌트가 결정됩니다 · 플랫폼 공통 메인 고정 없음
        </p>
      )}

      {guideModal.isOpen ? (
        <UnifiedModal
          isOpen
          onClose={closeGuide}
          title={guideModal.title}
          size="medium"
          variant="detail"
          className="mg-merchant-legal-footer__modal"
        >
          <div
            className="mg-merchant-legal-footer__modal-body"
            data-testid="merchant-legal-guide-modal-body"
          >
            {guideModal.body}
          </div>
        </UnifiedModal>
      ) : null}
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
