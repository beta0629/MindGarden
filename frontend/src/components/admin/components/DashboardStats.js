import React from 'react';
import { StatCard } from '../../common';

const DashboardStats = ({ 
  stats = {}, 
  refundStats = {}, 
  pendingDepositStats = {},
  className = '',
  onStatClick,
  ...props 
}) => {
  const statCards = [
    {
      title: '총 상담사',
      value: stats.totalConsultants || 0,
      icon: null,
      color: 'primary',
      id: 'consultants'
    },
    {
      title: '총 고객',
      value: stats.totalClients || 0,
      icon: null,
      color: 'success',
      id: 'clients'
    },
    {
      title: '총 매핑',
      value: stats.totalMappings || 0,
      icon: null,
      color: 'warning',
      id: 'mappings'
    },
    {
      title: '활성 매칭',
      value: stats.activeMappings || 0,
      icon: null,
      color: 'info',
      id: 'active-mappings'
    },
    {
      title: '환불 건수',
      value: refundStats.totalRefundCount || 0,
      icon: null,
      color: 'danger',
      id: 'refunds',
      change: refundStats.averageRefundPerCase ? {
        type: refundStats.averageRefundPerCase > 0 ? 'positive' : 'negative',
        value: Math.abs(refundStats.averageRefundPerCase)
      } : null
    },
    {
      title: '대기 입금',
      value: pendingDepositStats.count || 0,
      icon: null,
      color: 'warning',
      id: 'pending-deposits',
      change: pendingDepositStats.oldestHours ? {
        type: pendingDepositStats.oldestHours > 24 ? 'negative' : 'positive',
        value: pendingDepositStats.oldestHours > 24 ? 1 : 0
      } : null
    }
  ];

  const handleStatClick = (statData) => {
    if (onStatClick) {
      onStatClick(statData);
    }
  };

  return (
    <section className={`dashboard-section ${className}`} {...props}>
      <h2 className="section-title">시스템 현황</h2>
      <div className="stats-grid">
        {statCards.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            change={stat.change}
            onClick={() => handleStatClick(stat)}
          />
        ))}
      </div>
    </section>
  );
};

export default DashboardStats;