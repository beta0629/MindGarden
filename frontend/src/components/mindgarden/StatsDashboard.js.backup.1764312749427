import React from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { Users, Calendar, CheckCircle, TrendingUp } from 'lucide-react';

const StatsDashboard = () => {
  const stats = [
    {
      icon: <Users size={24} />,
      value: '2,543',
      label: '총 사용자',
      change: '+12.5%',
      positive: true
    },
    {
      icon: <Calendar size={24} />,
      value: '1,234',
      label: '예약된 상담',
      change: '+8.2%',
      positive: true
    },
    {
      icon: <CheckCircle size={24} />,
      value: '987',
      label: '완료된 상담',
      change: '+15.3%',
      positive: true
    },
    {
      icon: <TrendingUp size={24} />,
      value: '94%',
      label: '만족도',
      change: '+2.1%',
      positive: true
    }
  ];

  return (
    <section className="mg-v2-section">
      <h2 className="mg-h2 mg-v2-text-center mg-mb-lg">통계 현황</h2>
      
      <div className="mg-stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="mg-dashboard-stat-card mg-animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="mg-dashboard-stat-icon">
              {stat.icon}
            </div>
            <div className="mg-dashboard-stat-content">
              <div className="mg-dashboard-stat-value">{stat.value}</div>
              <div className="mg-dashboard-stat-label">{stat.label}</div>
              <div className={`mg-dashboard-stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsDashboard;

