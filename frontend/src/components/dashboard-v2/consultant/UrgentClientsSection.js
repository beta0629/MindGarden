import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Icon from '../../ui/Icon/Icon';
import UrgentClientCard from './UrgentClientCard';
import { ContentSection } from '../content';

/**
 * 긴급 확인 필요 내담자 섹션 컴포넌트
 * 
 * @description 위험도가 높거나 진행도가 저하된 내담자 목록을 표시
 * @param {Array} clients - 긴급 내담자 목록
 * @param {Function} onViewAllClients - "전체보기" 클릭 핸들러
 * @param {Function} onViewClientDetails - 카드 클릭 핸들러
 * @param {string} className - 추가 CSS 클래스
 */
const UrgentClientsSection = ({ 
  clients = [], 
  onViewAllClients, 
  onViewClientDetails, 
  className = '' 
}) => {
  if (clients.length === 0) return null;

  return (
    <ContentSection
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="ALERT_CIRCLE" size="MD" color="TRANSPARENT" />
          긴급 확인 필요 내담자
        </div>
      }
      actions={
        <MGButton
          type="button"
          variant="outline"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'sm',
            loading: false,
            className: 'mg-v2-btn mg-v2-btn-ghost mg-v2-btn-sm'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onViewAllClients}
          preventDoubleClick={false}
          aria-label="긴급 내담자 전체보기"
        >
          <span>전체보기</span>
        </MGButton>
      }
      className={`mg-v2-urgent-clients-section ${className}`}
    >
      <div className="mg-v2-urgent-clients-section__body">
        {clients.slice(0, 5).map(client => (
          <UrgentClientCard
            key={client.clientId}
            client={client}
            onClick={() => onViewClientDetails(client.clientId)}
          />
        ))}
      </div>
    </ContentSection>
  );
};

UrgentClientsSection.propTypes = {
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      clientId: PropTypes.number.isRequired,
      clientName: PropTypes.string.isRequired,
      sessionNumber: PropTypes.number.isRequired,
      lastConsultationDate: PropTypes.string.isRequired,
      riskLevel: PropTypes.oneOf(['CRITICAL', 'HIGH', 'MEDIUM']).isRequired,
      mainIssue: PropTypes.string.isRequired
    })
  ).isRequired,
  onViewAllClients: PropTypes.func.isRequired,
  onViewClientDetails: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default UrgentClientsSection;
