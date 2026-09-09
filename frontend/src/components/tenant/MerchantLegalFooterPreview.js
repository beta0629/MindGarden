/**
 * 테넌트 홈·설정 공유 — 사업자·약관 푸터 미리보기
 * 안내(환불·상품)는 테넌트 DB 등록 문구를 UnifiedModal로 표시한다. /terms 예정 링크 금지.
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import UnifiedModal from '../common/modals/UnifiedModal';
import './MerchantLegalFooterPreview.css';

const PLACEHOLDER = {
  biz: '사업자등록번호',
  rep: '대표',
  phone: '유선',
  address: '주소 (테넌트 DB)',
  mailOrder: '통신판매업 신고번호'
};

const GUIDE = {
  REFUND_LABEL: '환불·취소·청약철회',
  PRICE_LABEL: '상품·가격 안내'
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
  const refundText = legal.refundPolicyText?.trim() || '';
  const priceText = legal.productPriceGuideText?.trim() || '';

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

  const renderGuideControl = (label, body, testId) => {
    if (!body) {
      return null;
    }

    return (
      <button
        type="button"
        className="mg-merchant-legal-footer__link"
        id={testId === 'counseling-guide-refund' ? testId : undefined}
        data-testid={testId}
        onClick={() => openGuide(label, body)}
      >
        <span className="mg-merchant-legal-footer__link-label">{label}</span>
      </button>
    );
  };

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
          {renderGuideControl(
            GUIDE.REFUND_LABEL,
            refundText,
            'counseling-guide-refund'
          )}
          {renderGuideControl(
            GUIDE.PRICE_LABEL,
            priceText,
            'counseling-guide-pricing'
          )}
        </div>

        {showAccountLinks && (
          <div className="mg-merchant-legal-footer__col">
            <h3 className="mg-merchant-legal-footer__title">계정</h3>
            <Link to="/login" className="mg-merchant-legal-footer__link">
              로그인
            </Link>
            <Link to="/privacy" className="mg-merchant-legal-footer__link">
              개인정보처리방침
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
