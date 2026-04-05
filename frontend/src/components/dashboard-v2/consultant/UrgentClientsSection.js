import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, ChevronRight } from 'lucide-react';
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
          <AlertCircle size={18} />
          긴급 확인 필요 내담자
        </div>
      }
      actions={
        <button
          className="mg-v2-btn mg-v2-btn-ghost mg-v2-btn-sm"
          onClick={onViewAllClients}
          type="button"
          aria-label="긴급 내담자 전체보기"
        >
          전체보기 <ChevronRight size={16} />
        </button>
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
