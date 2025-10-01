import React from 'react';
import { ManagementCard } from '../../common';

const DashboardManagement = ({ 
  onNavigate, 
  hasPermission, 
  showToast,
  className = '',
  ...props 
}) => {
  const managementCards = [
    {
      id: 'schedule',
      title: '스케줄 관리',
      description: '상담 일정을 관리합니다',
      icon: '📅',
      color: 'schedule',
      onClick: () => onNavigate('/admin/schedule-management'),
      permission: 'SCHEDULE_MANAGEMENT'
    },
    {
      id: 'sessions',
      title: '상담 세션',
      description: '진행 중인 상담을 확인합니다',
      icon: '💬',
      color: 'sessions',
      onClick: () => onNavigate('/admin/session-management'),
      permission: 'SESSION_MANAGEMENT'
    },
    {
      id: 'consultants',
      title: '상담사 관리',
      description: '상담사 정보를 관리합니다',
      icon: '👨‍⚕️',
      color: 'consultants',
      onClick: () => onNavigate('/admin/consultant-management'),
      permission: 'CONSULTANT_MANAGEMENT'
    },
    {
      id: 'clients',
      title: '고객 관리',
      description: '고객 정보를 관리합니다',
      icon: '👥',
      color: 'clients',
      onClick: () => onNavigate('/admin/client-management'),
      permission: 'CLIENT_MANAGEMENT'
    },
    {
      id: 'user-management',
      title: '사용자 관리',
      description: '시스템 사용자를 관리합니다',
      icon: '👤',
      color: 'user-management',
      onClick: () => onNavigate('/admin/user-management'),
      permission: 'USER_MANAGEMENT'
    },
    {
      id: 'mappings',
      title: '매핑 관리',
      description: '상담사-고객 매핑을 관리합니다',
      icon: '🔗',
      color: 'mappings',
      onClick: () => onNavigate('/admin/mapping-management'),
      permission: 'MAPPING_MANAGEMENT'
    },
    {
      id: 'finance',
      title: '재무 관리',
      description: '수입과 지출을 관리합니다',
      icon: '💰',
      color: 'finance',
      onClick: () => onNavigate('/admin/finance-management'),
      permission: 'FINANCE_MANAGEMENT'
    },
    {
      id: 'reports',
      title: '보고서',
      description: '통계 및 분석 보고서',
      icon: '📊',
      color: 'reports',
      onClick: () => onNavigate('/admin/reports'),
      permission: 'REPORT_ACCESS'
    }
  ];

  const handleCardClick = (card) => {
    if (hasPermission && hasPermission(card.permission)) {
      card.onClick();
    } else {
      showToast && showToast('접근 권한이 없습니다.', 'error');
    }
  };

  return (
    <section className={`dashboard-section ${className}`} {...props}>
      <h2 className="section-title">관리 기능</h2>
      <div className="management-grid">
        {managementCards.map((card) => (
          <ManagementCard
            key={card.id}
            title={card.title}
            description={card.description}
            icon={card.icon}
            color={card.color}
            onClick={() => handleCardClick(card)}
          />
        ))}
      </div>
    </section>
  );
};

export default DashboardManagement;