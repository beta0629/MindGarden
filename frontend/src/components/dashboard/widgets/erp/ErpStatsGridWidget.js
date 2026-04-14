/**
 * ERP Statistics Grid Widget - 표준화된 위젯
/**
 * ERP 주요 통계를 그리드 형태로 표시 (수입, 지출, 매출, 예산 등)
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (위젯 표준화 업그레이드)
/**
 * @since 2025-11-29
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils, USER_ROLES } from '../../../../constants/roles';
import { formatCurrency, formatNumber, formatPercent } from '../../../../utils/formatUtils';
import './ErpStatsGridWidget.css';
import SafeText from '../../../common/SafeText';
import MGButton from '../../../common/MGButton';
const ErpStatsGridWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  // ERP 통계 데이터 소스 설정
  const getDataSourceConfig = () => {
    return {
      type: 'api',
      url: '/api/v1/erp/dashboard/statistics',
      cache: true,
      refreshInterval: 300000, // 5분마다 새로고침
      params: {
        userId: user.id,
        period: widget.config?.period || 'month', // monthly, yearly
        includeComparison: true
      },
      transform: (data) => {
        if (!data) {
          return getDefaultErpStats();
        }
        
        return {
          totalRevenue: data.revenue?.total || 0,
          totalExpenses: data.expenses?.total || 0,
          netProfit: (data.revenue?.total || 0) - (data.expenses?.total || 0),
          profitMargin: data.profitMargin || 0,
          purchaseRequests: data.purchaseRequests || 0,
          approvedRequests: data.approvedRequests || 0,
          budgetUtilization: data.budgetUtilization || 0,
          cashFlow: data.cashFlow || 0,
          // 비교 데이터
          revenueChange: data.comparison?.revenue || 0,
          expensesChange: data.comparison?.expenses || 0,
          profitChange: data.comparison?.profit || 0
        };
      }
    };
  };

  // 기본 ERP 통계 데이터
  const getDefaultErpStats = () => ({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    purchaseRequests: 0,
    approvedRequests: 0,
    budgetUtilization: 0,
    cashFlow: 0,
    revenueChange: 0,
    expensesChange: 0,
    profitChange: 0
  });

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
    data: statsData,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user) || RoleUtils.isAdmin(user),
    cache: true,
    retryCount: 3
  });

  // ERP 접근 권한 체크 (상담사 이상)
  if (!RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && !RoleUtils.isAdmin(user)) {
    return null;
  }

  if (!RoleUtils.isAdmin(user) && !RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user)) {
    return null;
  }

  // 기본 데이터 구조
  const defaultStats = getDefaultErpStats();
  const displayStats = statsData || defaultStats;

  // 헤더 설정
  const headerConfig = {
    subtitle: `${widget.config?.period === 'year' ? '연간' : '월간'} ERP 통계`,
    actions: [
      {
        icon: 'REFRESH_CW',
        label: '새로고침',
        onClick: refresh
      },
      {
        icon: 'EXTERNAL_LINK',
        label: 'ERP 대시보드',
        onClick: () => navigate('/erp/dashboard')
      }
    ]
  };

  // 내비게이션 핸들러
  const handleStatClick = (type) => {
    switch (type) {
      case 'revenue':
        navigate('/erp/financial-management?tab=revenue');
        break;
      case 'expenses':
        navigate('/erp/financial-management?tab=expenses');
        break;
      case 'purchase':
        navigate('/erp/purchase-management');
        break;
      case 'budget':
        // 앱 라우트는 /erp/budget · /erp/budgets (예산 관리 단일 화면)
        navigate('/erp/budget');
        break;
      default:
        navigate('/erp/dashboard');
        break;
    }
  };

  // 변화율 계산 및 포맷팅
  const getChangeInfo = (current, change) => {
    if (!change || change === 0) return null;
    
    const isPositive = change > 0;
    const percentage = current ? Math.abs((change / current) * 100) : 0;
    
    return {
      value: formatPercent(percentage / 100),
      isPositive,
      iconName: isPositive ? 'ARROW_UP_CIRCLE' : 'ARROW_DOWN_CIRCLE'
    };
  };
  
  // ERP 통계 카드 데이터
  const statCards = [
    {
      id: 'revenue',
      title: '총 매출',
      value: formatCurrency(displayStats.totalRevenue),
      category: 'revenue',
      change: getChangeInfo(displayStats.totalRevenue, displayStats.revenueChange),
      onClick: () => handleStatClick('revenue')
    },
    {
      id: 'expenses', 
      title: '총 지출',
      value: formatCurrency(displayStats.totalExpenses),
      category: 'expenses',
      change: getChangeInfo(displayStats.totalExpenses, displayStats.expensesChange),
      onClick: () => handleStatClick('expenses')
    },
    {
      id: 'profit',
      title: '순이익',
      value: formatCurrency(displayStats.netProfit),
      category: displayStats.netProfit >= 0 ? 'profit' : 'loss',
      change: getChangeInfo(displayStats.netProfit, displayStats.profitChange),
      onClick: () => handleStatClick('revenue')
    },
    {
      id: 'margin',
      title: '수익률',
      value: formatPercent(displayStats.profitMargin / 100),
      category: 'margin',
      onClick: () => handleStatClick('revenue')
    },
    {
      id: 'purchase-requests',
      title: '구매 요청',
      value: displayStats.purchaseRequests.toLocaleString(),
      category: 'purchase',
      badge: displayStats.purchaseRequests > 0 ? {
        text: `${displayStats.approvedRequests}/승인`,
        variant: 'info'
      } : null,
      onClick: () => handleStatClick('purchase')
    },
    {
      id: 'budget',
      title: '예산 사용률',
      value: formatPercent(displayStats.budgetUtilization / 100),
      category: 'budget',
      status: displayStats.budgetUtilization > 90 ? 'warning' : displayStats.budgetUtilization > 100 ? 'error' : 'normal',
      onClick: () => handleStatClick('budget')
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
      className="erp-stats-grid-widget"
    >
      <div className="erp-stats-content">
        <div className="erp-stats-grid">
          {statCards.map((card) => (
            <div 
              key={card.id}
              className={`erp-stat-card erp-stat-${card.category} ${card.status ? `stat-${card.status}` : ''} clickable`}
              onClick={card.onClick}
            >
              <div className="erp-stat-header">
                <div className="erp-stat-icon-wrapper">
                  {card.icon}
                </div>
                <SafeText tag="div" className="erp-stat-title">{card.title}</SafeText>
                {card.badge && (
                  <div className={`erp-stat-badge badge-${card.badge.variant}`}>
                    <SafeText>{card.badge.text}</SafeText>
                  </div>
                )}
              </div>
              <div className="erp-stat-body">
                <div className="erp-stat-value"><SafeText>{card.value}</SafeText></div>
                {card.change && (
                  <div className={`erp-stat-change ${card.change.isPositive ? 'positive' : 'negative'}`}>
                    
                    <span><SafeText>{card.change.value}</SafeText></span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* 빈 상태 처리 */}
        {isEmpty && (
          <div className="erp-stats-empty">
            
            <p>ERP 통계 데이터가 없습니다</p>
            <MGButton variant="primary" size="small" onClick={refresh}>
              다시 시도
            </MGButton>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default ErpStatsGridWidget;

