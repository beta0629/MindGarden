import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';
import PageHeader from '../common/PageHeader';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './ClientSessionManagement.css';

/**
 * 내담자 회기 관리 상세 페이지
 * 회기 현황, 사용 내역, 남은 회기 등을 상세히 표시
 */
const ClientSessionManagement = () => {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 기존 세션 확인

      // 사용자 정보 가져오기
      const userResponse = await apiGet('/api/auth/current-user');
      
      if (!userResponse || !userResponse.id) {
        throw new Error('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      }
      
      const userId = userResponse.id;

      // 매핑 정보 가져오기
      const mappingResponse = await apiGet(`/api/admin/mappings/client?clientId=${userId}`);
      const mappings = mappingResponse.data || [];

      // 상담 일정 가져오기 (상담일지가 아닌 기본 일정 정보만)
      const scheduleResponse = await apiGet(`/api/schedules?userId=${userId}&userRole=CLIENT`);
      const schedules = scheduleResponse.data || [];

      // 회기 사용 내역 계산 (완료된 상담만)
      const usedSessions = schedules.filter(s => s.status === '완료').length;
      const totalSessions = mappings.reduce((sum, mapping) => sum + (mapping.totalSessions || 0), 0);
      const remainingSessions = totalSessions - usedSessions;

      // 최근 상담 일정 (최근 10개)
      const recentSchedules = schedules
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

      setSessionData({
        mappings,
        schedules,
        totalSessions,
        usedSessions,
        remainingSessions,
        recentSchedules
      });
    } catch (error) {
      console.error('회기 데이터 로드 실패:', error);
      if (error.message.includes('로그인이 필요합니다')) {
        setError('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      } else {
        setError('회기 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (isCompleted) => {
    return isCompleted ? '#28a745' : '#ffc107';
  };

  const getStatusText = (isCompleted) => {
    return isCompleted ? '완료' : '미완료';
  };

  if (isLoading) {
    return (
      <div className="client-session-management">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </div>
          <p>회기 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-session-management">
        <div className="error-container">
          <i className="bi bi-exclamation-triangle"></i>
          <h3>오류가 발생했습니다</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadSessionData}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!sessionData || sessionData.mappings.length === 0) {
    return (
      <div className="client-session-management">
        <div className="no-data-container">
          <i className="bi bi-clock-history"></i>
          <h3>회기 정보가 없습니다</h3>
          <p>아직 상담사와 연결되지 않았습니다.</p>
          <button className="btn btn-primary" onClick={() => navigate('/client/consultant-mapping')}>
            상담사 연결하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="client-session-management">
      {/* 공통 헤더 */}
      <PageHeader 
        title="회기 관리" 
        icon="bi-clock-history"
      />

      {/* 회기 현황 요약 */}
      <div className="session-summary">
        <div className="summary-card total">
          <div className="card-icon">
            <i className="bi bi-calendar-check"></i>
          </div>
          <div className="card-content">
            <h3>총 회기</h3>
            <p className="number">{sessionData.totalSessions}</p>
            <span className="unit">회</span>
          </div>
        </div>

        <div className="summary-card used">
          <div className="card-icon">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="card-content">
            <h3>사용한 회기</h3>
            <p className="number">{sessionData.usedSessions}</p>
            <span className="unit">회</span>
          </div>
        </div>

        <div className="summary-card remaining">
          <div className="card-icon">
            <i className="bi bi-clock"></i>
          </div>
          <div className="card-content">
            <h3>남은 회기</h3>
            <p className="number">{sessionData.remainingSessions}</p>
            <span className="unit">회</span>
          </div>
        </div>
      </div>

      {/* 진행률 표시 */}
      <div className="progress-section">
        <div className="progress-header">
          <h3>회기 사용 진행률</h3>
          <span className="progress-text">
            {sessionData.totalSessions > 0 
              ? Math.round((sessionData.usedSessions / sessionData.totalSessions) * 100)
              : 0}%
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{
              width: sessionData.totalSessions > 0 
                ? `${(sessionData.usedSessions / sessionData.totalSessions) * 100}%`
                : '0%'
            }}
          ></div>
        </div>
      </div>

      {/* 패키지 정보 */}
      <div className="package-info">
        <div className="package-grid">
          {sessionData.mappings
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((mapping, index) => (
            <div key={index} className="package-card">
              <div className="package-header">
                <h4>{mapping.packageName || '상담 패키지'}</h4>
                <span className="package-status">
                  {mapping.status === 'ACTIVE' ? '활성' : '비활성'}
                </span>
              </div>
              <div className="package-details">
                <div className="detail-item">
                  <span className="label">총 회기:</span>
                  <span className="value">{mapping.totalSessions}회</span>
                </div>
                <div className="detail-item">
                  <span className="label">사용 회기:</span>
                  <span className="value">{mapping.usedSessions || 0}회</span>
                </div>
                <div className="detail-item">
                  <span className="label">남은 회기:</span>
                  <span className="value">{mapping.remainingSessions || 0}회</span>
                </div>
                <div className="detail-item">
                  <span className="label">상담사:</span>
                  <span className="value">{mapping.consultant?.name || '미지정'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">연결일:</span>
                  <span className="value">
                    {mapping.createdAt ? formatDate(mapping.createdAt) : '알 수 없음'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 상담 일정 */}
      <div className="consultation-history">
        <h3><i className="bi bi-calendar-event"></i> 최근 상담 일정</h3>
        {sessionData.recentSchedules.length > 0 ? (
          <div className="consultation-list">
            {sessionData.recentSchedules.map((schedule, index) => (
              <div key={index} className="consultation-item">
                <div className="consultation-date">
                  {formatDate(schedule.date)}
                </div>
                <div className="consultation-info">
                  <div className="consultation-title">
                    {schedule.title || '상담'}
                  </div>
                  <div className="consultation-details">
                    <span className="consultation-duration">
                      {schedule.startTime} - {schedule.endTime}
                    </span>
                    <span className="consultation-status" style={{
                      color: getStatusColor(schedule.status === '완료')
                    }}>
                      {getStatusText(schedule.status === '완료')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-consultations">
            <i className="bi bi-calendar-x"></i>
            <p>아직 상담 일정이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSessionManagement;
