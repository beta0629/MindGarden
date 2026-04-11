import React, { useState, useEffect, useCallback } from 'react';
import {
  FaUsers, FaUserTie, FaUser, FaChartBar, FaChartLine,
  FaDollarSign, FaArrowUp, FaArrowDown,
  FaTrophy, FaClock
} from 'react-icons/fa';
import { apiGet } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import UnifiedLoading from '../common/UnifiedLoading';
import SafeText from '../common/SafeText';
import Chart from '../common/Chart';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './StatisticsDashboard.css';

const STATISTICS_TITLE_ID = 'statistics-dashboard-title';

/**
 * 통계 대시보드 — ACL 외곽은 App에서만 적용, 본문은 B0KlA 셸.
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-01-21
 */
const StatisticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    overall: {
      totalClients: 0,
      totalConsultants: 0,
      totalSessions: 0,
      activeMappings: 0,
      completionRate: 0,
      totalRevenue: 0
    },
    trends: {
      clientGrowth: 0,
      consultantGrowth: 0,
      sessionGrowth: 0,
      revenueGrowth: 0
    },
    chartData: {
      labels: [],
      datasets: []
    },
    recentActivity: []
  });

  const loadStatistics = useCallback(async() => {
    setLoading(true);
    setError(null);

    try {
      const [overallStats, trendStats, chartStats, activityStats] = await Promise.all([
        apiGet('/api/v1/admin/statistics/overall'),
        apiGet('/api/v1/admin/statistics/trends'),
        apiGet('/api/v1/admin/statistics/chart-data'),
        apiGet('/api/v1/admin/statistics/recent-activity')
      ]);

      const apiData = {
        overall: overallStats.data || {
          totalClients: 0,
          totalConsultants: 0,
          totalSessions: 0,
          activeMappings: 0,
          completionRate: 0,
          totalRevenue: 0
        },
        trends: trendStats.data || {
          clientGrowth: 0,
          consultantGrowth: 0,
          sessionGrowth: 0,
          revenueGrowth: 0
        },
        chartData: chartStats.data || {
          labels: [],
          datasets: []
        },
        recentActivity: activityStats.data || []
      };

      setStatistics(apiData);
    } catch (err) {
      console.error('통계 API 호출 오류:', err);
      setError(err.message || '통계 데이터를 불러오지 못했습니다.');
      showNotification('통계를 불러오지 못했습니다.', 'warning');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num?.toString() || '0';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const getTrendIcon = (trend) => {
    return trend > 0 ?
      <FaArrowUp className="stats-trend-icon stats-trend-up" /> :
      <FaArrowDown className="stats-trend-icon stats-trend-down" />;
  };

  const getTrendColor = (trend) => {
    return trend > 0 ? 'stats-trend-positive' : 'stats-trend-negative';
  };

  const headerActions = (
    <MGButton
      type="button"
      variant="secondary"
      onClick={loadStatistics}
      disabled={loading}
    >
      <FaChartBar />
      새로고침
    </MGButton>
  );

  const shell = (body) => (
    <div className="mg-v2-ad-b0kla mg-v2-statistics-dashboard">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="통계 대시보드 본문">
          <ContentHeader
            title="통계 대시보드"
            subtitle="전체 시스템 현황 및 성과 분석"
            titleId={STATISTICS_TITLE_ID}
            actions={headerActions}
          />
          {body}
        </ContentArea>
      </div>
    </div>
  );

  if (loading && !error) {
    return shell(
      <div aria-busy="true" aria-live="polite">
        <UnifiedLoading type="inline" text="통계 데이터를 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return shell(
      <main aria-labelledby={STATISTICS_TITLE_ID} className="statistics-dashboard-container">
        <div className="statistics-error-card">
          <div className="statistics-error-content">
            <FaChartBar className="statistics-error-icon" />
            <h3 className="statistics-error-title">오류 발생</h3>
            <p className="statistics-error-message">{error}</p>
            <MGButton
              type="button"
              variant="primary"
              className="statistics-retry-btn"
              onClick={loadStatistics}
            >
              다시 시도
            </MGButton>
          </div>
        </div>
      </main>
    );
  }

  return shell(
    <main aria-labelledby={STATISTICS_TITLE_ID} className="statistics-dashboard-container">
      <div className="statistics-cards-grid">
        <div className="statistics-card statistics-card--primary">
          <div className="statistics-card-header">
            <FaUsers className="statistics-card-icon" />
            <h3 className="statistics-card-title">총 내담자</h3>
          </div>
          <div className="statistics-card-body">
            <div className="statistics-card-value">
              {formatNumber(statistics.overall.totalClients)}
            </div>
            <div className="statistics-card-trend">
              {getTrendIcon(statistics.trends.clientGrowth)}
              <span className={getTrendColor(statistics.trends.clientGrowth)}>
                {statistics.trends.clientGrowth}%
              </span>
            </div>
          </div>
        </div>

        <div className="statistics-card statistics-card--success">
          <div className="statistics-card-header">
            <FaUserTie className="statistics-card-icon" />
            <h3 className="statistics-card-title">총 상담사</h3>
          </div>
          <div className="statistics-card-body">
            <div className="statistics-card-value">
              {formatNumber(statistics.overall.totalConsultants)}
            </div>
            <div className="statistics-card-trend">
              {getTrendIcon(statistics.trends.consultantGrowth)}
              <span className={getTrendColor(statistics.trends.consultantGrowth)}>
                {statistics.trends.consultantGrowth}%
              </span>
            </div>
          </div>
        </div>

        <div className="statistics-card statistics-card--info">
          <div className="statistics-card-header">
            <FaChartLine className="statistics-card-icon" />
            <h3 className="statistics-card-title">총 상담 세션</h3>
          </div>
          <div className="statistics-card-body">
            <div className="statistics-card-value">
              {formatNumber(statistics.overall.totalSessions)}
            </div>
            <div className="statistics-card-trend">
              {getTrendIcon(statistics.trends.sessionGrowth)}
              <span className={getTrendColor(statistics.trends.sessionGrowth)}>
                {statistics.trends.sessionGrowth}%
              </span>
            </div>
          </div>
        </div>

        <div className="statistics-card statistics-card--warning">
          <div className="statistics-card-header">
            <FaUser className="statistics-card-icon" />
            <h3 className="statistics-card-title">활성 매칭</h3>
          </div>
          <div className="statistics-card-body">
            <div className="statistics-card-value">
              {formatNumber(statistics.overall.activeMappings)}
            </div>
            <div className="statistics-card-description">
              완료율: {statistics.overall.completionRate}%
            </div>
          </div>
        </div>

        <div className="statistics-card statistics-card--danger">
          <div className="statistics-card-header">
            <FaDollarSign className="statistics-card-icon" />
            <h3 className="statistics-card-title">총 수익</h3>
          </div>
          <div className="statistics-card-body">
            <div className="statistics-card-value">
              {formatCurrency(statistics.overall.totalRevenue)}
            </div>
            <div className="statistics-card-trend">
              {getTrendIcon(statistics.trends.revenueGrowth)}
              <span className={getTrendColor(statistics.trends.revenueGrowth)}>
                {statistics.trends.revenueGrowth}%
              </span>
            </div>
          </div>
        </div>

        <div className="statistics-card statistics-card--secondary">
          <div className="statistics-card-header">
            <FaTrophy className="statistics-card-icon" />
            <h3 className="statistics-card-title">성과 지표</h3>
          </div>
          <div className="statistics-card-body">
            <div className="statistics-card-value">
              {statistics.overall.completionRate}%
            </div>
            <div className="statistics-card-description">
              평균 완료율
            </div>
          </div>
        </div>
      </div>

      <div className="statistics-chart-section">
        <div className="statistics-chart-card">
          <div className="statistics-chart-header">
            <h3 className="statistics-chart-title">
              <FaChartBar className="statistics-chart-icon" />
              월별 성장 추이
            </h3>
          </div>
          <div className="statistics-chart-body">
            <Chart
              type="line"
              data={statistics.chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top'
                  },
                  title: {
                    display: true,
                    text: '월별 성장 추이'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return formatNumber(value);
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="statistics-activity-section">
        <div className="statistics-activity-card">
          <div className="statistics-activity-header">
            <h3 className="statistics-activity-title">
              <FaClock className="statistics-activity-icon" />
              최근 활동
            </h3>
          </div>
          <div className="statistics-activity-body">
            {statistics.recentActivity.map((activity, index) => {
              const IconComponent = activity.icon;
              return (
                <div key={index} className="statistics-activity-item">
                  <div className="statistics-activity-item-icon">
                    <IconComponent />
                  </div>
                  <div className="statistics-activity-item-content">
                    <SafeText
                      className="statistics-activity-item-message"
                      tag="p"
                    >
                      {activity.message}
                    </SafeText>
                    <SafeText
                      className="statistics-activity-item-time"
                      tag="span"
                    >
                      {activity.time}
                    </SafeText>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
};

export default StatisticsDashboard;
