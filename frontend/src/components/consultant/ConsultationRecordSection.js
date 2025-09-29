import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';
import './ConsultationRecordSection.css';

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
      const response = await apiGet(`/api/consultant/${consultantId}/consultation-records`);
      
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
    navigate('/consultation-records');
  };

  const handleCreateRecord = () => {
    navigate('/consultation-records/create');
  };

  if (loading) {
    return (
      <div className="consultation-record-section">
        <div className="section-header">
          <h3>📝 상담일지</h3>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span>상담일지 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="consultation-record-section">
      <div className="section-header">
        <h3>📝 상담일지</h3>
        <div className="header-actions">
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={handleViewAllRecords}
          >
            전체보기
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={handleCreateRecord}
          >
            새 일지 작성
          </button>
        </div>
      </div>

      {error ? (
        <div className="error-message">
          <i className="bi bi-exclamation-triangle"></i>
          {error}
        </div>
      ) : (
        <>
          {/* 통계 카드 */}
          <div className="record-stats">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-number">{recordStats.totalRecords}</div>
                <div className="stat-label">총 일지</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-number">{recordStats.todayRecords}</div>
                <div className="stat-label">오늘 작성</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-number">{recordStats.pendingRecords}</div>
                <div className="stat-label">미완료</div>
              </div>
            </div>
          </div>

          {/* 최근 상담일지 목록 */}
          {recordStats.recentRecords.length > 0 ? (
            <div className="recent-records">
              <h4>최근 상담일지</h4>
              <div className="record-list">
                {recordStats.recentRecords.map((record, index) => (
                  <div key={record.id || index} className="record-item">
                    <div className="record-info">
                      <div className="record-title">
                        {record.clientName || '내담자'} - {record.sessionDate}
                      </div>
                      <div className="record-meta">
                        <span className={`status-badge ${record.isCompleted ? 'completed' : 'pending'}`}>
                          {record.isCompleted ? '완료' : '미완료'}
                        </span>
                        <span className="record-date">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="record-actions">
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => navigate(`/consultant/consultation-record-view/${record.id}`)}
                      >
                        보기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-records">
              <div className="no-records-icon">📝</div>
              <div className="no-records-text">
                <h4>아직 작성된 상담일지가 없습니다</h4>
                <p>첫 번째 상담일지를 작성해보세요</p>
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateRecord}
                >
                  상담일지 작성하기
                </button>
              </div>
            </div>
          )}

          {/* 빠른 액션 */}
          <div className="quick-actions">
            <button 
              className="quick-action-btn"
              onClick={handleCreateRecord}
            >
              <i className="bi bi-plus-circle"></i>
              새 일지 작성
            </button>
            <button 
              className="quick-action-btn"
              onClick={handleViewAllRecords}
            >
              <i className="bi bi-list-ul"></i>
              전체 목록
            </button>
            <button 
              className="quick-action-btn"
              onClick={() => navigate('/consultation-records/statistics')}
            >
              <i className="bi bi-graph-up"></i>
              통계 보기
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ConsultationRecordSection;
