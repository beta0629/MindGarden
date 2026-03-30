import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../common/MGButton';
import { formatDate } from '../../utils/onboardingService';
import { DEFAULT_RISK_LEVEL } from '../../constants/onboarding';

/**
 * 온보딩 요청 카드 컴포넌트 (Presentational)
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-09
 */
const OnboardingRequestCard = ({
  request,
  statusLabel,
  riskLevelLabel,
  onDetailClick
}) => {
  return (
    <div className="mg-card mg-card--default">
      <div className="mg-card__header">
        <div className="mg-v2-card-header-content">
          <div className="mg-v2-card-header-text">
            <h3 className="mg-v2-heading mg-v2-heading--h3 mg-v2-text--semibold">
              {request.tenantName}
            </h3>
            {request.tenantId && (
              <p className="mg-v2-text mg-v2-text--secondary mg-v2-text--sm mg-v2-mt-xs">
                {request.tenantId}
              </p>
            )}
          </div>
        </div>
        <span className={`mg-v2-badge mg-v2-badge--${(request.status || '').toLowerCase()}`}>
          {statusLabel}
        </span>
      </div>
      
      <div className="mg-card__body">
        <div className="mg-v2-info-list">
          <div className="mg-v2-info-item">
            <span className="mg-v2-info-label">업종:</span>
            <span className="mg-v2-info-value">{request.businessType || '-'}</span>
          </div>
          <div className="mg-v2-info-item">
            <span className="mg-v2-info-label">요청자:</span>
            <span className="mg-v2-info-value">{request.requestedBy || '-'}</span>
          </div>
          <div className="mg-v2-info-item">
            <span className="mg-v2-info-label">위험도:</span>
            <span className={`mg-v2-badge mg-v2-badge--${(request.riskLevel || DEFAULT_RISK_LEVEL).toLowerCase()}`}>
              {riskLevelLabel}
            </span>
          </div>
          <div className="mg-v2-info-item">
            <span className="mg-v2-info-label">요청일시:</span>
            <span className="mg-v2-info-value">{formatDate(request.createdAt)}</span>
          </div>
        </div>
      </div>
      
      <div className="mg-card__footer">
        <MGButton
          variant="primary"
          size="small"
          onClick={() => onDetailClick(request.id)}
          fullWidth
        >
          상세보기
        </MGButton>
      </div>
    </div>
  );
};

OnboardingRequestCard.propTypes = {
  request: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    tenantName: PropTypes.string.isRequired,
    tenantId: PropTypes.string,
    businessType: PropTypes.string,
    requestedBy: PropTypes.string,
    riskLevel: PropTypes.string,
    status: PropTypes.string,
    createdAt: PropTypes.string.isRequired
  }).isRequired,
  statusLabel: PropTypes.string.isRequired,
  riskLevelLabel: PropTypes.string.isRequired,
  onDetailClick: PropTypes.func.isRequired
};

export default OnboardingRequestCard;

