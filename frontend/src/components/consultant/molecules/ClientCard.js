/**
 * ClientCard Component
 * 
 * @description 내담자 카드 컴포넌트 (Organism)
 * @author Core Solution Team
 * @since 2026-03-09
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Mail, Phone, Calendar, Package, Clock, CheckCircle, XCircle, Clock as ClockIcon, CheckCircle2, PauseCircle } from 'lucide-react';
import Avatar from '../../common/Avatar';
import StatusBadge from '../../common/StatusBadge';
import MGButton from '../../common/MGButton';
import ClientSessionInfo from './ClientSessionInfo';

const STATUS_CONFIG = {
  ACTIVE: { icon: CheckCircle, label: '활성' },
  INACTIVE: { icon: XCircle, label: '비활성' },
  PENDING: { icon: ClockIcon, label: '대기중' },
  COMPLETED: { icon: CheckCircle2, label: '완료' },
  SUSPENDED: { icon: PauseCircle, label: '일시정지' }
};

const ClientCard = ({ client, onViewDetails }) => {
  const statusConfig = STATUS_CONFIG[client.status] || {
    icon: XCircle,
    label: client.status || '알 수 없음'
  };

  const StatusIcon = statusConfig.icon;

  const handleViewClick = () => {
    if (onViewDetails) {
      onViewDetails(client);
    }
  };

  return (
    <article
      aria-label={`${client.name} 내담자 정보`}
      className="mg-v2-client-card"
    >
      <div className="mg-v2-client-card__header">
        <div className="mg-v2-client-card__profile">
          <Avatar
            profileImageUrl={client.profileImage || client.profileImageUrl}
            displayName={client.name}
            className="mg-v2-client-card__avatar"
          />
          <h3 className="mg-v2-client-card__name">
            {client.name || '이름 없음'}
          </h3>
        </div>
        <StatusBadge status={client.status}>
          <StatusIcon size={14} />
          {statusConfig.label}
        </StatusBadge>
      </div>

      <div className="mg-v2-client-card__body">
        <div className="mg-v2-client-info-list">
          <div className="mg-v2-client-info-item">
            <Mail size={16} />
            <span>{client.email || '이메일 없음'}</span>
          </div>
          <div className="mg-v2-client-info-item">
            <Phone size={16} />
            <span>{client.phone || '전화번호 없음'}</span>
          </div>
          <div className="mg-v2-client-info-item">
            <Calendar size={16} />
            <span>
              가입일: {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '정보 없음'}
            </span>
          </div>
          <div className="mg-v2-client-info-item">
            <Package size={16} />
            <span>패키지: {client.packageName || '정보 없음'}</span>
          </div>
          {client.lastConsultationDate && (
            <div className="mg-v2-client-info-item">
              <Clock size={16} />
              <span>
                최근 상담: {new Date(client.lastConsultationDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <ClientSessionInfo
          totalSessions={client.totalSessions}
          usedSessions={client.usedSessions}
          remainingSessions={client.remainingSessions}
        />
      </div>

      <div className="mg-v2-client-card__footer">
        <MGButton
          onClick={handleViewClick}
          disabled={!client.id}
          variant="primary"
          className="mg-v2-client-view-btn"
        >
          상세보기
        </MGButton>
      </div>
    </article>
  );
};

ClientCard.propTypes = {
  client: PropTypes.shape({
    id: PropTypes.number,
    clientId: PropTypes.number,
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    status: PropTypes.string,
    createdAt: PropTypes.string,
    profileImage: PropTypes.string,
    profileImageUrl: PropTypes.string,
    remainingSessions: PropTypes.number,
    totalSessions: PropTypes.number,
    usedSessions: PropTypes.number,
    packageName: PropTypes.string,
    packagePrice: PropTypes.number,
    lastConsultationDate: PropTypes.string,
    riskLevel: PropTypes.string
  }).isRequired,
  onViewDetails: PropTypes.func.isRequired
};

export default ClientCard;
