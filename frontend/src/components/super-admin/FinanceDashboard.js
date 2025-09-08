import React, { useState, useEffect } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import './FinanceDashboard.css';
import { FINANCE_DASHBOARD_CSS } from '../../constants/css';
import { FINANCE_DASHBOARD_CONSTANTS } from '../../constants/css-variables';
import notificationManager from '../../utils/notification';

/**
 * 수퍼어드민 자금 대시보드 컴포넌트
 * - 전체 수익/지출 현황
 * - 월별/연별 재무 통계
 * - 결제 현황 및 분석
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */
const FinanceDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [financeData, setFinanceData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    monthlyRevenue: [],
    paymentStats: {
      totalPayments: 0,
      pendingPayments: 0,
      completedPayments: 0,
      failedPayments: 0
    }
  });

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    const { API_ENDPOINTS, MESSAGES, LOADING_DELAY } = FINANCE_DASHBOARD_CONSTANTS;
    
    setLoading(true);
    try {
      console.log('재무 데이터 로드 시작...');
      
      // 실제 API 호출
      const response = await fetch(API_ENDPOINTS.DASHBOARD, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('재무 데이터 로드 성공:', data);
        setFinanceData(data.data);
        notificationManager.success(MESSAGES.LOAD_SUCCESS);
      } else {
        throw new Error(data.message || MESSAGES.LOAD_ERROR);
      }
    } catch (error) {
      console.error('재무 데이터 로드 실패:', error);
      notificationManager.error(error.message || MESSAGES.LOAD_ERROR);
      
      // 에러 시 기본 데이터로 폴백
      setFinanceData({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        monthlyRevenue: [],
        paymentStats: {
          totalPayments: 0,
          pendingPayments: 0,
          completedPayments: 0,
          failedPayments: 0
        }
      });
    } finally {
      // 최소 로딩 시간 보장
      setTimeout(() => {
        setLoading(false);
      }, LOADING_DELAY);
    }
  };

  const formatCurrency = (amount) => {
    const { FORMAT } = FINANCE_DASHBOARD_CONSTANTS;
    return new Intl.NumberFormat(FORMAT.CURRENCY.LOCALE, {
      style: FORMAT.CURRENCY.STYLE,
      currency: FORMAT.CURRENCY.CURRENCY
    }).format(amount);
  };

  const handleRefresh = async () => {
    const { MESSAGES } = FINANCE_DASHBOARD_CONSTANTS;
    console.log('재무 데이터 새로고침...');
    await loadFinanceData();
    notificationManager.success(MESSAGES.REFRESH_SUCCESS);
  };

  return (
    <SimpleLayout>
      <div className={FINANCE_DASHBOARD_CSS.CONTAINER}>
        <div className={FINANCE_DASHBOARD_CSS.HEADER}>
          <h1 className={FINANCE_DASHBOARD_CSS.TITLE}>
            <i className="bi bi-currency-dollar"></i>
            자금 관리 대시보드
          </h1>
          <div className="finance-actions">
            <button 
              className={`btn btn-outline-primary ${FINANCE_DASHBOARD_CSS.REFRESH_BUTTON}`} 
              onClick={handleRefresh}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise"></i>
              새로고침
            </button>
          </div>
        </div>

        {loading ? (
          <div className={FINANCE_DASHBOARD_CSS.LOADING}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </div>
            <p>{FINANCE_DASHBOARD_CONSTANTS.MESSAGES.LOADING}</p>
          </div>
        ) : (
          <>
            {/* 주요 지표 카드 */}
            <div className={FINANCE_DASHBOARD_CSS.STATS_GRID}>
              <div className={`${FINANCE_DASHBOARD_CSS.STAT_CARD} ${FINANCE_DASHBOARD_CSS.STAT_CARD_REVENUE}`}>
                <div className={FINANCE_DASHBOARD_CSS.STAT_ICON}>
                  <i className="bi bi-graph-up-arrow"></i>
                </div>
                <div className="metric-content">
                  <h3>총 수익</h3>
                  <p className={FINANCE_DASHBOARD_CSS.STAT_VALUE}>{formatCurrency(financeData.totalRevenue)}</p>
                  <span className={FINANCE_DASHBOARD_CSS.STAT_LABEL}>누적 수익</span>
                </div>
              </div>

              <div className={`${FINANCE_DASHBOARD_CSS.STAT_CARD} ${FINANCE_DASHBOARD_CSS.STAT_CARD_EXPENSE}`}>
                <div className={FINANCE_DASHBOARD_CSS.STAT_ICON}>
                  <i className="bi bi-graph-down-arrow"></i>
                </div>
                <div className="metric-content">
                  <h3>총 지출</h3>
                  <p className={FINANCE_DASHBOARD_CSS.STAT_VALUE}>{formatCurrency(financeData.totalExpenses)}</p>
                  <span className={FINANCE_DASHBOARD_CSS.STAT_LABEL}>누적 지출</span>
                </div>
              </div>

              <div className={`${FINANCE_DASHBOARD_CSS.STAT_CARD} ${FINANCE_DASHBOARD_CSS.STAT_CARD_PROFIT}`}>
                <div className={FINANCE_DASHBOARD_CSS.STAT_ICON}>
                  <i className="bi bi-cash-stack"></i>
                </div>
                <div className="metric-content">
                  <h3>순이익</h3>
                  <p className={FINANCE_DASHBOARD_CSS.STAT_VALUE}>{formatCurrency(financeData.netProfit)}</p>
                  <span className={FINANCE_DASHBOARD_CSS.STAT_LABEL}>수익 - 지출</span>
                </div>
              </div>
            </div>

            {/* 결제 현황 */}
            <div className={FINANCE_DASHBOARD_CSS.PAYMENT_SECTION}>
              <h2 className={FINANCE_DASHBOARD_CSS.PAYMENT_TITLE}>결제 현황</h2>
              <div className={FINANCE_DASHBOARD_CSS.PAYMENT_GRID}>
                <div className="stat-item">
                  <div className="stat-icon total">
                    <i className="bi bi-credit-card"></i>
                  </div>
                  <div className="stat-content">
                    <h4>전체 결제</h4>
                    <p className="stat-value">{financeData.paymentStats.totalPayments}건</p>
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-icon completed">
                    <i className="bi bi-check-circle"></i>
                  </div>
                  <div className="stat-content">
                    <h4>완료된 결제</h4>
                    <p className="stat-value">{financeData.paymentStats.completedPayments}건</p>
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-icon pending">
                    <i className="bi bi-clock"></i>
                  </div>
                  <div className="stat-content">
                    <h4>대기 중</h4>
                    <p className="stat-value">{financeData.paymentStats.pendingPayments}건</p>
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-icon failed">
                    <i className="bi bi-x-circle"></i>
                  </div>
                  <div className="stat-content">
                    <h4>실패한 결제</h4>
                    <p className="stat-value">{financeData.paymentStats.failedPayments}건</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 월별 수익/지출 차트 */}
            <div className="monthly-chart">
              <h2 className="section-title">월별 수익/지출 현황</h2>
              <div className="chart-container">
                <div className="chart-placeholder">
                  <i className="bi bi-bar-chart"></i>
                  <p>차트 구현 예정</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </SimpleLayout>
  );
};

export default FinanceDashboard;
