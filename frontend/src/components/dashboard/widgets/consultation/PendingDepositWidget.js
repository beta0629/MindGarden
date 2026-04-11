/**
 * Pending Deposit Widget - 표준화된 위젯
/**
 * 상담소 특화 미결제 보증금 관리 위젯
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
import { CreditCard, AlertTriangle, Eye, DollarSign, Calendar, User, CheckCircle } from 'lucide-react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils, USER_ROLES } from '../../../../constants/roles';
import './PendingDepositWidget.css';
import MGButton from '../../../common/MGButton';

const PendingDepositWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  // 데이터 소스 설정
  const getDataSourceConfig = () => {
    return {
      type: 'multi-api',
      endpoints: {
        deposits: {
          url: '/api/v1/deposits/pending',
          method: 'GET',
          params: { 
            limit: widget.config?.maxItems || 10,
            // 상담사인 경우 자신과 관련된 보증금만 조회
            ...(RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && { consultantId: user.id })
          }
        },
        stats: {
          url: '/api/v1/deposits/pending-stats',
          method: 'GET',
          params: {
            ...(RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && { consultantId: user.id })
          }
        }
      },
      refreshInterval: widget.config?.refreshInterval || 60000, // 1분마다 새로고침
      cache: true,
      cacheDuration: 60000
    };
  };

  // Transform 함수
  const transform = (rawData) => {
    if (!rawData) return { deposits: [], stats: null, hasData: false };

    const { deposits, stats } = rawData;

    return {
      deposits: Array.isArray(deposits) ? deposits.slice(0, widget.config?.maxItems || 10) : [],
      stats: stats || {
        totalAmount: 0,
        count: 0,
        overdue: 0,
        urgent: 0
      },
      hasData: Array.isArray(deposits) && deposits.length > 0
    };
  };

  // 위젯 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig(),
      transform
    }
  };

  // 표준화된 위젯 훅 사용
  const {
    data,
    loading,
    error,
    hasData,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user) || RoleUtils.isAdmin(user),
    cache: true
  });

  // 권한 확인: 관리자와 상담사만 접근 가능
  if (!RoleUtils.isAdmin(user) && !RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user)) {
    return null;
  }

  if (!RoleUtils.isAdmin(user) && !RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user)) {
    return null;
  }

  // 우선순위별 스타일
  const getPriorityClass = (priority) => {
    const priorityMap = {
      'HIGH': 'priority-high',
      'MEDIUM': 'priority-medium',
      'LOW': 'priority-low',
      'URGENT': 'priority-urgent'
    };
    return priorityMap[priority] || 'priority-normal';
  };

  // 상세보기
  const handleViewDeposit = (depositId) => {
    navigate(`/deposits/${depositId}`);
  };

  // 전체보기
  const handleViewAll = () => {
    navigate('/deposits/pending');
  };

  // 금액 포맷팅
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // 렌더링 내용
  const renderContent = () => {
    if (!hasData) {
      return (
        <div className="deposit-empty-state">
          <div className="empty-icon-wrapper">
            <CheckCircle className="empty-icon" />
          </div>
          <h3 className="empty-title">미결제 보증금이 없습니다</h3>
          <p className="empty-description">
            {widget.config?.emptyMessage || '모든 보증금이 처리되었습니다.'}
          </p>
        </div>
      );
    }

    const { deposits, stats } = data;

    return (
      <div className="deposit-content">
        {/* 통계 섹션 */}
        {widget.config?.showStats !== false && stats && (
          <div className="deposit-stats">
            <div className="stat-card total">
              <div className="stat-icon">
                <CreditCard />
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.count}</div>
                <div className="stat-label">미결제 건수</div>
              </div>
            </div>
            <div className="stat-card amount">
              <div className="stat-icon">
                <DollarSign />
              </div>
              <div className="stat-info">
                <div className="stat-number">{formatAmount(stats.totalAmount)}</div>
                <div className="stat-label">총 금액</div>
              </div>
            </div>
            {stats.urgent > 0 && (
              <div className="stat-card urgent">
                <div className="stat-icon">
                  <AlertTriangle />
                </div>
                <div className="stat-info">
                  <div className="stat-number">{stats.urgent}</div>
                  <div className="stat-label">긴급 처리</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 보증금 목록 */}
        <div className="deposit-list">
          <div className="list-header">
            <h4 className="list-title">미결제 보증금</h4>
            <MGButton variant="outline" size="small" onClick={handleViewAll}>
              전체 보기
            </MGButton>
          </div>
          <div className="deposit-items">
            {deposits.map((deposit) => (
              <div key={deposit.id} className={`deposit-item ${getPriorityClass(deposit.priority)}`}>
                <div className="deposit-info">
                  <div className="deposit-header">
                    <div className="client-info">
                      <User className="client-icon" />
                      <span className="client-name">{deposit.clientName}</span>
                    </div>
                    <div className="deposit-amount">{formatAmount(deposit.amount)}</div>
                  </div>
                  <div className="deposit-details">
                    <div className="detail-item">
                      <Calendar className="detail-icon" />
                      <span className="detail-label">마감일:</span>
                      <span className="detail-value">{formatDate(deposit.dueDate)}</span>
                    </div>
                    {deposit.consultantName && (
                      <div className="detail-item">
                        <span className="detail-label">담당 상담사:</span>
                        <span className="detail-value">{deposit.consultantName}</span>
                      </div>
                    )}
                    {deposit.purpose && (
                      <div className="detail-item">
                        <span className="detail-label">목적:</span>
                        <span className="detail-value">{deposit.purpose}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="deposit-actions">
                  <MGButton
                    variant="outline"
                    size="small"
                    className="action-btn view-btn"
                    onClick={() => handleViewDeposit(deposit.id)}
                    title="상세 보기"
                    preventDoubleClick={false}
                  >
                    <Eye className="action-icon" />
                  </MGButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 헤더 설정
  const headerConfig = {
    icon: <CreditCard className="widget-header-icon" />,
    subtitle: '미결제 보증금 관리',
    actions: [
      {
        icon: 'RefreshCw',
        label: '새로고침',
        onClick: refresh
      },
      {
        icon: 'ExternalLink',
        label: '전체 보기',
        onClick: handleViewAll
      }
    ]
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      hasData={hasData}
      onRefresh={refresh}
      headerConfig={headerConfig}
      className="pending-deposit-widget"
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default PendingDepositWidget;