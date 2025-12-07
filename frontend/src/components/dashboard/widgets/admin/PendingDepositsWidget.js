import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils } from '../../../../constants/roles';
import { formatCurrency, formatDate } from '../../../../utils/formatUtils';
import './PendingDepositsWidget.css';

/**
 * 입금 확인 대기 목록 위젯 - 표준화된 위젯
/**
 * 관리자가 확인해야 할 입금 내역들을 표시
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (위젯 표준화 업그레이드)
/**
 * @since 2025-11-29
 */
const PendingDepositsWidget = ({ widget, user }) => {
  // 관리자만 표시
  if (!RoleUtils.isAdmin(user) && !RoleUtils.hasRole(user, 'HQ_MASTER')) {
    return null;
  }

  const navigate = useNavigate();

  // 입금 확인 대기 목록 데이터 소스 설정
  const getDataSourceConfig = () => {
    return {
      type: 'api',
      url: '/api/v1/admin/pending-deposits',
      cache: true,
      refreshInterval: 180000, // 3분마다 새로고침
      params: {
        status: 'pending',
        limit: widget.config?.maxItems || 10
      },
      transform: (data) => {
        // API 응답 데이터 변환
        if (!data || !Array.isArray(data.deposits)) {
          return { deposits: [], totalCount: 0, totalAmount: 0 };
        }
        return {
          deposits: data.deposits.map(deposit => ({
            id: deposit.id,
            clientName: deposit.client?.name || '알 수 없음',
            clientId: deposit.clientId,
            amount: deposit.amount || 0,
            depositDate: deposit.depositDate,
            bankName: deposit.bankName,
            accountNumber: deposit.accountNumber,
            depositorName: deposit.depositorName,
            memo: deposit.memo,
            status: deposit.status || 'pending',
            createdAt: deposit.createdAt
          })),
          totalCount: data.totalCount || 0,
          totalAmount: data.totalAmount || 0
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
    data: depositsData,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });

  // 기본 데이터 구조
  const defaultData = {
    deposits: [],
    totalCount: 0,
    totalAmount: 0
  };

  const displayData = depositsData || defaultData;

  // 헤더 설정
  const headerConfig = {
    icon: <CreditCard className="widget-header-icon" />,
    badge: displayData.totalCount > 0 ? {
      text: displayData.totalCount.toString(),
      variant: displayData.totalCount > 5 ? 'warning' : 'info'
    } : null,
    actions: [
      {
        icon: 'RefreshCw',
        label: '새로고침',
        onClick: refresh
      },
      {
        icon: 'ExternalLink',
        label: '전체 보기',
        onClick: () => navigate('/admin/deposits')
      }
    ]
  };

  // 입금 확인 처리
  const handleConfirmDeposit = (depositId) => {
    navigate(`/admin/deposits/${depositId}/confirm`);
  };

  // 입금 거부 처리
  const handleRejectDeposit = (depositId) => {
    navigate(`/admin/deposits/${depositId}/reject`);
  };

  // 상태별 스타일 클래스 결정
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'rejected': return 'status-rejected';
      default: return 'status-unknown';
    }
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      onRefresh={refresh}
      headerConfig={headerConfig}
      className="pending-deposits-widget"
    >
      <div className="pending-deposits-content">
        {/* 요약 정보 */}
        {hasData && displayData.totalCount > 0 && (
          <div className="deposits-summary">
            <div className="summary-item">
              <span className="summary-label">대기 중</span>
              <span className="summary-value">{displayData.totalCount}건</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">총 금액</span>
              <span className="summary-value">{formatCurrency(displayData.totalAmount)}</span>
            </div>
          </div>
        )}

        {/* 입금 목록 */}
        {hasData && displayData.deposits.length > 0 ? (
          <div className="deposits-list">
            {displayData.deposits.map((deposit) => (
              <div key={deposit.id} className={`deposit-item ${getStatusClass(deposit.status)}`}>
                <div className="deposit-info">
                  <div className="deposit-client">
                    <span className="client-name">{deposit.clientName}</span>
                    <span className="client-id">#{deposit.clientId}</span>
                  </div>
                  <div className="deposit-details">
                    <div className="deposit-amount">
                      {formatCurrency(deposit.amount)}
                    </div>
                    <div className="deposit-meta">
                      <span className="deposit-date">
                        <Clock className="meta-icon" />
                        {formatDate(deposit.depositDate)}
                      </span>
                      <span className="deposit-bank">
                        {deposit.bankName} ({deposit.depositorName})
                      </span>
                    </div>
                    {deposit.memo && (
                      <div className="deposit-memo">"{deposit.memo}"</div>
                    )}
                  </div>
                </div>
                <div className="deposit-actions">
                  <button 
                    className="deposit-btn deposit-btn-confirm"
                    onClick={() => handleConfirmDeposit(deposit.id)}
                    title="입금 확인"
                  >
                    <CheckCircle className="btn-icon" />
                    확인
                  </button>
                  <button 
                    className="deposit-btn deposit-btn-reject"
                    onClick={() => handleRejectDeposit(deposit.id)}
                    title="입금 거부"
                  >
                    <AlertCircle className="btn-icon" />
                    거부
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pending-deposits-empty">
            <CreditCard className="empty-icon" />
            <p>확인 대기 중인 입금이 없습니다</p>
            <button 
              className="mg-btn mg-btn-primary mg-btn-sm"
              onClick={refresh}
            >
              새로고침
            </button>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default PendingDepositsWidget;
