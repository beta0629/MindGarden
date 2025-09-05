import React, { useState, useEffect } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import './FinanceDashboard.css';

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
    setLoading(true);
    try {
      // TODO: 실제 API 연동
      // const response = await apiGet('/api/super-admin/finance/dashboard');
      
      // 임시 데이터
      setTimeout(() => {
        setFinanceData({
          totalRevenue: 12500000,
          totalExpenses: 8500000,
          netProfit: 4000000,
          monthlyRevenue: [
            { month: '1월', revenue: 1200000, expenses: 800000 },
            { month: '2월', revenue: 1500000, expenses: 900000 },
            { month: '3월', revenue: 1800000, expenses: 1000000 },
            { month: '4월', revenue: 2000000, expenses: 1100000 },
            { month: '5월', revenue: 2200000, expenses: 1200000 },
            { month: '6월', revenue: 2500000, expenses: 1300000 }
          ],
          paymentStats: {
            totalPayments: 156,
            pendingPayments: 12,
            completedPayments: 140,
            failedPayments: 4
          }
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('자금 데이터 로드 실패:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  return (
    <SimpleLayout>
      <div className="finance-dashboard">
        <div className="finance-header">
          <h1 className="finance-title">
            <i className="bi bi-currency-dollar"></i>
            자금 관리 대시보드
          </h1>
          <div className="finance-actions">
            <button className="btn btn-outline-primary" onClick={loadFinanceData}>
              <i className="bi bi-arrow-clockwise"></i>
              새로고침
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </div>
            <p>자금 데이터를 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 주요 지표 카드 */}
            <div className="finance-metrics">
              <div className="metric-card revenue">
                <div className="metric-icon">
                  <i className="bi bi-graph-up-arrow"></i>
                </div>
                <div className="metric-content">
                  <h3>총 수익</h3>
                  <p className="metric-value">{formatCurrency(financeData.totalRevenue)}</p>
                  <span className="metric-label">누적 수익</span>
                </div>
              </div>

              <div className="metric-card expenses">
                <div className="metric-icon">
                  <i className="bi bi-graph-down-arrow"></i>
                </div>
                <div className="metric-content">
                  <h3>총 지출</h3>
                  <p className="metric-value">{formatCurrency(financeData.totalExpenses)}</p>
                  <span className="metric-label">누적 지출</span>
                </div>
              </div>

              <div className="metric-card profit">
                <div className="metric-icon">
                  <i className="bi bi-cash-stack"></i>
                </div>
                <div className="metric-content">
                  <h3>순이익</h3>
                  <p className="metric-value">{formatCurrency(financeData.netProfit)}</p>
                  <span className="metric-label">수익 - 지출</span>
                </div>
              </div>
            </div>

            {/* 결제 현황 */}
            <div className="payment-stats">
              <h2 className="section-title">결제 현황</h2>
              <div className="stats-grid">
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
