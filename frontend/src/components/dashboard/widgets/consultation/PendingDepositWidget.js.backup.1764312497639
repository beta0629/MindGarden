/**
 * Pending Deposit Widget
 * 상담소 특화 입금 확인 대기 위젯
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../../utils/ajax';
import UnifiedLoading from '../../../common/UnifiedLoading';
import '../Widget.css';

const PendingDepositWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [pendingMappings, setPendingMappings] = useState([]);
  const [stats, setStats] = useState({
    count: 0,
    totalAmount: 0,
    oldestHours: 0
  });
  const [loading, setLoading] = useState(true);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const maxItems = config.maxItems || 5;
  const showAlert = config.showAlert !== false;
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadPendingDeposits();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadPendingDeposits, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.pendingMappings && Array.isArray(config.pendingMappings)) {
      setPendingMappings(config.pendingMappings);
      calculateStats(config.pendingMappings);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadPendingDeposits = async () => {
    try {
      setLoading(true);
      
      const url = dataSource.url || '/api/admin/mappings/pending-deposit';
      const params = { ...dataSource.params };
      const response = await apiGet(url, params);
      
      if (response && response.data) {
        const mappingsList = Array.isArray(response.data) ? response.data : [];
        setPendingMappings(mappingsList.slice(0, maxItems));
        calculateStats(mappingsList);
      }
    } catch (err) {
      console.error('PendingDepositWidget 데이터 로드 실패:', err);
      setPendingMappings([]);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateStats = (mappingsList) => {
    const count = mappingsList.length;
    const totalAmount = mappingsList.reduce((sum, mapping) => sum + (mapping.packagePrice || 0), 0);
    const oldestHours = mappingsList.length > 0 
      ? Math.max(...mappingsList.map(mapping => mapping.hoursElapsed || 0), 0)
      : 0;
    
    setStats({ count, totalAmount, oldestHours });
  };
  
  const handleMappingClick = (mapping) => {
    if (config.mappingUrl) {
      navigate(config.mappingUrl.replace('{mappingId}', mapping.id));
    } else {
      navigate(`/admin/mapping-management?mappingId=${mapping.id}&action=deposit`);
    }
  };
  
  const handleViewAll = () => {
    if (config.viewAllUrl) {
      navigate(config.viewAllUrl);
    } else {
      navigate('/admin/mapping-management?filter=pending-deposit');
    }
  };
  
  if (loading && pendingMappings.length === 0 && stats.count === 0) {
    return (
      <div className="widget widget-pending-deposit">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  // 입금 대기 건이 없으면 위젯을 숨기거나 빈 상태 표시
  if (stats.count === 0 && !config.showWhenEmpty) {
    return null;
  }
  
  return (
    <div className="widget widget-pending-deposit">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-exclamation-triangle"></i>
          {config.title || '입금 확인 대기'}
          {stats.count > 0 && (
            <span className="widget-badge widget-badge-warning">{stats.count}</span>
          )}
        </div>
        {stats.count > 0 && (
          <button className="widget-view-all" onClick={handleViewAll}>
            처리하기 →
          </button>
        )}
      </div>
      
      {stats.count > 0 && (
        <div className="widget-stats">
          <div className="stat-item">
            <div className="stat-label">대기 건수</div>
            <div className="stat-value">{stats.count}건</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">대기 금액</div>
            <div className="stat-value">₩{stats.totalAmount.toLocaleString()}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">최장 대기</div>
            <div className="stat-value">{stats.oldestHours}시간</div>
          </div>
        </div>
      )}
      
      <div className="widget-body">
        {pendingMappings.length > 0 ? (
          <div className="pending-deposit-list">
            {pendingMappings.map((mapping, index) => (
              <div
                key={mapping.id || index}
                className="pending-deposit-item"
                onClick={() => handleMappingClick(mapping)}
              >
                <div className="pending-deposit-info">
                  <div className="pending-deposit-header">
                    <div className="pending-deposit-client">{mapping.clientName || mapping.client?.name}</div>
                    <div className="pending-deposit-hours">
                      {mapping.hoursElapsed ? `${mapping.hoursElapsed}시간 대기` : '대기 중'}
                    </div>
                  </div>
                  <div className="pending-deposit-details">
                    <span>금액: ₩{(mapping.packagePrice || 0).toLocaleString()}</span>
                    {mapping.consultantName && (
                      <span>상담사: {mapping.consultantName}</span>
                    )}
                  </div>
                </div>
                <button className="pending-deposit-action-btn">
                  <i className="bi bi-check-circle"></i> 확인
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="widget-empty">
            <i className="bi bi-check-circle"></i>
            <p>{config.emptyMessage || '입금 확인 대기 건이 없습니다'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingDepositWidget;

