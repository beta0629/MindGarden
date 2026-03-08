import React, { useState, useEffect } from 'react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';

const ConsultationRecordSection = ({ consultantId }) => {
  const navigate = useNavigate();
  const [recordStats, setRecordStats] = useState({
    totalRecords: 0,
    todayRecords: 0,
    pendingRecords: 0,
    recentRecords: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 상담일지 통계 로드
  const loadRecordStats = async () => {
    try {
      setLoading(true);
      
      // 최근 상담일지 조회
      const response = await apiGet(`/api/v1/admin/consultant-records/${consultantId}/consultation-records`);
      
      if (response && response.data) {
        const records = response.data;
        const today = new Date().toISOString().split('T')[0];
        
        const todayRecords = records.filter(record => 
          record.sessionDate && record.sessionDate.startsWith(today)
        ).length;
        
        setRecordStats({
          totalRecords: records.length,
          todayRecords: todayRecords,
          pendingRecords: records.filter(record => !record.isCompleted).length,
          recentRecords: records.slice(0, 3)
        });
      }
    } catch (error) {
      console.error('상담일지 통계 로드 실패:', error);
      setError('상담일지 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (consultantId) {
      loadRecordStats();
    }
  }, [consultantId]);

  const handleViewAllRecords = () => {
    navigate('/consultant/consultation-records');
  };

  const handleCreateRecord = () => {
    navigate('/consultant/schedule');
  };

  if (loading) {
    return (
      <div className="mg-v2-card">
        <div className="mg-v2-card-header">
          <h3 className="mg-h4 mg-mb-0">📝 상담일지</h3>
        </div>
        <div className="mg-loading-container">
          <div className="mg-spinner"></div>
          <p>상담일지 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mg-v2-card">
      <div className="mg-v2-card-header">
        <div className="mg-flex mg-justify-between mg-align-center consultation-record-header">
          <h3 className="mg-h4 mg-mb-0">📝 상담일지</h3>
          <div className="mg-flex mg-gap-sm consultation-record-header-buttons">
            <button 
              className="mg-v2-button mg-v2-button-ghost mg-v2-button-small"
              onClick={handleViewAllRecords}
            >
              전체보기
            </button>
            <button 
              className="mg-v2-button mg-v2-button-primary mg-v2-button-small"
              onClick={handleCreateRecord}
            >
              새 일지 작성
            </button>
          </div>
        </div>
      </div>

      <div className="mg-v2-card-body">
        {error ? (
          <div className="mg-error-state">
            <p>{error}</p>
          </div>
        ) : (
          <>
          {/* 통계 카드 */}
          <div className="mg-dashboard-stats mg-mb-lg">
            <div className="mg-dashboard-stat-card">
              <div className="mg-dashboard-stat-icon mg-dashboard-stat-icon-olive">
                📊
              </div>
              <div className="mg-dashboard-stat-content">
                <div className="mg-dashboard-stat-value">{recordStats.totalRecords}</div>
                <div className="mg-dashboard-stat-label">총 일지</div>
              </div>
            </div>
            <div className="mg-dashboard-stat-card">
              <div className="mg-dashboard-stat-icon mg-dashboard-stat-icon-mint">
                📅
              </div>
              <div className="mg-dashboard-stat-content">
                <div className="mg-dashboard-stat-value">{recordStats.todayRecords}</div>
                <div className="mg-dashboard-stat-label">오늘 작성</div>
              </div>
            </div>
            <div className="mg-dashboard-stat-card">
              <div className="mg-dashboard-stat-icon mg-dashboard-stat-icon-cocoa">
                ⏳
              </div>
              <div className="mg-dashboard-stat-content">
                <div className="mg-dashboard-stat-value">{recordStats.pendingRecords}</div>
                <div className="mg-dashboard-stat-label">미완료</div>
              </div>
            </div>
          </div>

          {/* 최근 상담일지 목록 */}
          {recordStats.recentRecords.length > 0 ? (
            <>
              <h4 className="mg-h5 mg-mb-md">최근 상담일지</h4>
              <div className="mg-space-y-sm">
                {recordStats.recentRecords.map((record, index) => (
                  <div key={record.id || index} className="mg-v2-card mg-v2-card-hover record-card">
                    <div className="mg-flex mg-justify-between mg-align-center record-card-content">
                      <div className="mg-flex-1">
                        <div className="mg-v2-text-base mg-font-semibold mg-v2-color-text-primary mg-mb-xs">
                          {record.clientName || '내담자'} - {record.sessionDate}
                        </div>
                        <div className="mg-flex mg-align-center mg-gap-sm record-meta">
                          <span className={`mg-badge ${record.isCompleted ? 'mg-badge-success' : 'mg-badge-warning'}`}>
                            {record.isCompleted ? '완료' : '미완료'}
                          </span>
                          <span className="mg-v2-text-sm mg-v2-color-text-secondary">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button 
                        className="mg-v2-button mg-v2-button-ghost mg-v2-button-small record-view-btn"
                        onClick={() => navigate(`/consultant/consultation-record-view/${record.id}`)}
                      >
                        보기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="mg-empty-state">
              <div className="mg-empty-state__icon">📝</div>
              <div className="mg-empty-state__text">
                아직 작성된 상담일지가 없습니다
              </div>
              <div className="mg-empty-state__hint mg-mb-md">
                첫 번째 상담일지를 작성해보세요
              </div>
              <button 
                className="mg-v2-button mg-v2-button-primary"
                onClick={handleCreateRecord}
              >
                상담일지 작성하기
              </button>
            </div>
          )}

          {/* 빠른 액션 */}
          <div className="quick-actions-grid mg-mt-lg mg-pt-lg mg-border-top">
            <button 
              className="mg-v2-button mg-v2-button-primary"
              onClick={handleCreateRecord}
            >
              새 일지 작성
            </button>
            <button 
              className="mg-v2-button mg-v2-button-ghost"
              onClick={handleViewAllRecords}
            >
              전체 목록
            </button>
            <button 
              className="mg-v2-button mg-v2-button-ghost"
              onClick={() => navigate('/consultant/consultation-records/statistics')}
            >
              통계 보기
            </button>
          </div>
        </>
        )}
      </div>
    </div>
  );
};

export default ConsultationRecordSection;
