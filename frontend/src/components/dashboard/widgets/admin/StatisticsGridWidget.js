/**
 * Statistics Grid Widget - 표준화된 위젯
/**
 * 실시간 Core Solution 관리자 주요 통계를 그리드 형태로 표시
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 3.0.0 (위젯 표준화 업그레이드)
/**
 * @since 2025-11-29
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWidget } from '../../../../hooks/useWidget';

import BaseWidget from '../BaseWidget';
import SafeText from '../../../common/SafeText';
import { RoleUtils } from '../../../../constants/roles';
import { formatCurrency } from '../../../../utils/formatUtils';
import { toDisplayString } from '../../../../utils/safeDisplay';
import './StatisticsGridWidget.css';
import MGButton from '../../../common/MGButton';
const StatisticsGridWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  // 다중 API 엔드포인트를 위한 데이터 소스 설정
  const getDataSourceConfig = () => {
    return {
      type: 'multi-api',
      cache: true,
      refreshInterval: 300000, // 5분마다 새로고침
      endpoints: [
        {
          url: '/api/v1/admin/consultants/with-stats',
          key: 'consultants',
          fallback: []
        },
        {
          url: '/api/v1/admin/clients/with-stats', 
          key: 'clients',
          fallback: []
        },
        {
          url: '/api/v1/admin/mappings/stats',
          key: 'mappings',
          fallback: {}
        },
        {
          url: '/api/v1/admin/schedules/today',
          key: 'schedules',
          fallback: []
        },
        {
          url: '/api/v1/admin/finance/summary',
          key: 'finance',
          fallback: { totalRevenue: 0, pendingPayments: 0 }
        }
      ],
      transform: (responses) => {
        const [consultants, clients, mappings, schedules, finance] = responses;
        
        return {
          totalConsultants: Array.isArray(consultants) ? consultants.length : 0,
          totalClients: Array.isArray(clients) ? clients.length : 0,
          totalMappings: mappings?.total || 0,
          activeMappings: mappings?.active || 0,
          todaySchedules: Array.isArray(schedules) ? schedules.length : 0,
          completedSessions: mappings?.completedSessions || 0,
          totalRevenue: finance?.totalRevenue || 0,
          pendingPayments: finance?.pendingPayments || 0
        };
      }
    };
  };

  // 위젯 설정에 데이터 소스 동적 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

  // 표준화된 위젯 훅 사용
  const {
    data: stats,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, 'HQ_MASTER'),
    cache: true,
    retryCount: 3
  });

  // 관리자만 표시
  if (!RoleUtils.isAdmin(user) && !RoleUtils.hasRole(user, 'HQ_MASTER')) {
    return null;
  }
  
  // 기본 통계 데이터 구조
  const defaultStats = {
    totalConsultants: 0,
    totalClients: 0,
    totalMappings: 0,
    activeMappings: 0,
    todaySchedules: 0,
    completedSessions: 0,
    totalRevenue: 0,
    pendingPayments: 0
  };

  const displayStats = stats || defaultStats;

  // 헤더 설정
  const headerConfig = {
    subtitle: '실시간 시스템 통계',
    actions: [
      {
        icon: 'REFRESH_CW',
        label: '새로고침',
        onClick: refresh
      }
    ]
  };

  // 통계 카드 정의 - 표준화된 형태
  const statCards = [
    {
      id: 'consultants',
      title: '총 상담사',
      value: displayStats.totalConsultants.toLocaleString(),
      category: 'user',
      onClick: () => navigate('/admin/consultants'),
      description: '등록된 상담사 수'
    },
    {
      id: 'clients',
      title: '총 내담자',
      value: displayStats.totalClients.toLocaleString(),
      category: 'user',
      onClick: () => navigate('/admin/clients'),
      description: '등록된 내담자 수'
    },
    {
      id: 'mappings',
      title: '총 매칭',
      value: displayStats.totalMappings.toLocaleString(),
      category: 'mapping',
      onClick: () => navigate('/admin/mappings'),
      description: '전체 매칭 건수'
    },
    {
      id: 'active-mappings',
      title: '활성 매칭',
      value: displayStats.activeMappings.toLocaleString(),
      category: 'mapping',
      onClick: () => navigate('/admin/mappings?status=active'),
      description: '현재 활성 매칭'
    },
    {
      id: 'today-schedules',
      title: '오늘 일정',
      value: displayStats.todaySchedules.toLocaleString(),
      category: 'schedule',
      onClick: () => navigate('/admin/schedules'),
      description: '오늘 예정된 상담'
    },
    {
      id: 'completed-sessions',
      title: '완료된 세션',
      value: displayStats.completedSessions.toLocaleString(),
      category: 'session',
      onClick: () => navigate('/admin/sessions'),
      description: '완료된 상담 세션'
    },
    {
      id: 'total-revenue',
      title: '총 매출',
      value: formatCurrency(displayStats.totalRevenue),
      category: 'finance',
      onClick: () => navigate('/admin/finance'),
      description: '누적 매출액'
    },
    {
      id: 'pending-payments',
      title: '미수금',
      value: formatCurrency(displayStats.pendingPayments),
      category: 'finance',
      status: 'warning',
      onClick: () => navigate('/admin/payments'),
      description: '미납 결제 금액'
    }
  ];
  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      onRefresh={refresh}
      headerConfig={headerConfig}
      className="statistics-grid-widget"
    >
      <div className="statistics-grid-content">
        <div className="statistics-grid">
          {statCards.map((card) => (
            <div 
              key={card.id} 
              className={`stat-card stat-card-${card.category} ${card.status ? `stat-card-${card.status}` : ''} clickable`}
              onClick={card.onClick}
              title={toDisplayString(card.description)}
            >
              <div className="stat-card-header">
                <div className="stat-card-icon-wrapper">
                  {card.icon}
                </div>
                <SafeText className="stat-card-title" tag="div">{card.title}</SafeText>
              </div>
              <div className="stat-card-body">
                <SafeText className="stat-card-value" tag="div">{card.value}</SafeText>
                <SafeText className="stat-card-description" tag="div">{card.description}</SafeText>
              </div>
            </div>
          ))}
        </div>
        
        {/* 빈 상태 처리 */}
        {isEmpty && (
          <div className="statistics-grid-empty">
            
            <p>통계 데이터가 없습니다</p>
            <MGButton variant="primary" size="small" onClick={refresh}>
              다시 시도
            </MGButton>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default StatisticsGridWidget;

