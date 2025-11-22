/**
 * ERP Statistics Grid Widget
 * StatCard 그리드를 표시하는 ERP 위젯
 * ErpDashboard의 통계 카드 그리드를 위젯화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../../utils/ajax';
import StatCard from '../../../ui/Card/StatCard';
import UnifiedLoading from '../../../common/UnifiedLoading';
import { formatCurrency, formatNumber, formatPercent } from '../../../../utils/formatUtils';
import * as LucideIcons from 'lucide-react';
import '../Widget.css';
import './ErpWidget.css';

const ErpStatsGridWidget = ({ widget, user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const statistics = config.statistics || []; // 통계 항목 정의
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadStats();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadStats, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.stats) {
      setStats(config.stats);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = dataSource.url || '/api/erp/dashboard/stats';
      const params = dataSource.params || {};
      
      const response = await apiGet(url, params);
      
      if (response && response.success) {
        setStats(response.data || response);
      } else if (response) {
        setStats(response);
      } else {
        setStats({});
      }
    } catch (err) {
      console.error('ErpStatsGridWidget 데이터 로드 실패:', err);
      setError(err.message);
      setStats({});
    } finally {
      setLoading(false);
    }
  };
  
  const formatValue = (stat, value) => {
    if (value === null || value === undefined) {
      return '0';
    }
    
    switch (stat.format) {
      case 'currency':
        return formatCurrency(value, { showCurrency: stat.showCurrency !== false });
      case 'percent':
        return formatPercent(value / 100, stat.decimals || 1);
      case 'number':
        return formatNumber(value);
      default:
        return String(value);
    }
  };
  
  if (loading && !stats) {
    return (
      <div className="widget widget-erp-stats-grid">
        <UnifiedLoading message="통계를 불러오는 중..." />
      </div>
    );
  }
  
  if (error && !stats) {
    return (
      <div className="widget widget-erp-stats-grid widget-error">
        <div className="widget-title">{config.title || 'ERP 통계'}</div>
        <div className="widget-error-message">{error}</div>
      </div>
    );
  }
  
  const statsData = stats || {};
  const columns = config.columns || 4;
  
  return (
    <div className="widget widget-erp-stats-grid">
      {config.title && (
        <div className="widget-header">
          <div className="widget-title">{config.title}</div>
        </div>
      )}
      <div className="widget-body">
        <div className={`mg-dashboard-stats erp-stats-grid erp-stats-grid-${columns}`}>
          {statistics.map((stat, index) => {
            const value = statsData[stat.key] || stat.defaultValue || 0;
            const formattedValue = formatValue(stat, value);
            
            // 아이콘 처리
            let iconComponent = null;
            if (stat.icon) {
              if (typeof stat.icon === 'string') {
                // 문자열인 경우 lucide-react에서 찾기
                // eslint-disable-next-line import/namespace
                const IconComponent = LucideIcons[stat.icon];
                iconComponent = IconComponent ? <IconComponent size={24} /> : null;
              } else {
                // 컴포넌트인 경우 직접 렌더링
                iconComponent = React.createElement(stat.icon, { size: 24 });
              }
            }
            
            return (
              <StatCard
                key={stat.id || index}
                icon={iconComponent}
                value={formattedValue}
                label={stat.label}
                change={stat.change ? formatValue(stat, statsData[stat.changeKey]) : undefined}
                changeType={stat.changeType}
                className={stat.className}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ErpStatsGridWidget;

