import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';

/**
 * 긴급 내담자 카드 컴포넌트 (Molecule)
 * 
 * @description 긴급 확인이 필요한 내담자 정보를 표시하는 카드
 * @param {Object} client - 내담자 정보
 * @param {Function} onClick - 카드 클릭 핸들러
 * @param {string} className - 추가 CSS 클래스
 */
const UrgentClientCard = ({ client, onClick, className = '' }) => {
  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel) {
      case 'CRITICAL':
        return 'mg-v2-badge--critical';
      case 'HIGH':
        return 'mg-v2-badge--high';
      case 'MEDIUM':
        return 'mg-v2-badge--medium';
      default:
        return 'mg-v2-badge--medium';
    }
  };

  const getRiskLabel = (riskLevel) => {
    switch (riskLevel) {
      case 'CRITICAL':
        return '위험';
      case 'HIGH':
        return '높음';
      case 'MEDIUM':
        return '보통';
      default:
        return '보통';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  };

  return (
    <MGButton
      type="button"
      variant="outline"
      size="medium"
      className={`mg-v2-urgent-client-card ${className}`}
      onClick={onClick}
      preventDoubleClick={false}
      aria-label={`${client.clientName} 상세보기`}
    >
      <div className="mg-v2-urgent-client-card__info">
        <div className="mg-v2-urgent-client-card__header">
          <div className="mg-v2-urgent-client-card__name">{client.clientName}</div>
          <div className={`mg-v2-badge ${getRiskBadgeClass(client.riskLevel)}`}>
            {getRiskLabel(client.riskLevel)}
          </div>
        </div>
        <div className="mg-v2-urgent-client-card__meta">
          <span>{formatDate(client.lastConsultationDate)} · {client.sessionNumber}회기</span>
        </div>
        <div className="mg-v2-urgent-client-card__issue">
          {client.mainIssue}
        </div>
      </div>
    </MGButton>
  );
};

UrgentClientCard.propTypes = {
  client: PropTypes.shape({
    clientId: PropTypes.number.isRequired,
    clientName: PropTypes.string.isRequired,
    sessionNumber: PropTypes.number.isRequired,
    lastConsultationDate: PropTypes.string.isRequired,
    riskLevel: PropTypes.oneOf(['CRITICAL', 'HIGH', 'MEDIUM']).isRequired,
    mainIssue: PropTypes.string.isRequired
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default UrgentClientCard;
