import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';
import SimpleLayout from '../layout/SimpleLayout';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './ClientSessionManagement.css';
import notificationManager from '../../utils/notification';

const ClientSessionManagement = () => {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userResponse = await apiGet('/api/auth/current-user');
      if (!userResponse || !userResponse.id) {
        throw new Error('로그인이 필요합니다.');
      }

      const userId = userResponse.id;
      const mappingsResponse = await apiGet(`/api/admin/mappings/client?clientId=${userId}`);
      const mappings = mappingsResponse.data || [];

      const schedulesResponse = await apiGet(`/api/schedules?userId=${userId}&userRole=CLIENT`);
      const schedules = schedulesResponse.data || [];

      const totalSessions = mappings.reduce((sum, mapping) => sum + (mapping.totalSessions || 0), 0);
      const usedSessions = schedules.filter(s => s.status === '완료').length;
      const remainingSessions = totalSessions - usedSessions;

      setSessionData({
        totalSessions,
        usedSessions,
        remainingSessions,
        mappings: mappings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        schedules: schedules.sort((a, b) => new Date(b.date) - new Date(a.date))
      });

    } catch (err) {
      console.error('회기 데이터 로드 실패:', err);
      setError(err.message || '회기 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuAction = (action) => {
    setIsMenuOpen(false);
    switch (action) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'session-management':
        navigate('/client/session-management');
        break;
      case 'payment-history':
        navigate('/client/payment-history');
        break;
      case 'consultation-guide':
        notificationManager.show('상담 가이드 페이지는 준비 중입니다.', 'info');
        break;
      default:
        break;
    }
  };

  const handleHamburgerClick = (isOpen) => {
    setIsMenuOpen(isOpen);
  };

  const getStatusText = (isCompleted) => {
    return isCompleted ? '완료' : '예정';
  };

  const getStatusColor = (isCompleted) => {
    return isCompleted ? '#28a745' : '#ffc107';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '알 수 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <SimpleLayout title="회기 관리">
        <div className="client-session-management">
          <div className="loading-container">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </div>
            <p>회기 데이터를 불러오는 중...</p>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  if (error) {
    return (
      <SimpleLayout title="회기 관리">
        <div className="client-session-management">
          <div className="error-container">
            <div className="error-icon">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <h3>오류가 발생했습니다</h3>
            <p>{error}</p>
            <button 
              className="mg-btn mg-btn--primary"
              onClick={loadSessionData}
            >
              다시 시도
            </button>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  if (!sessionData || sessionData.mappings.length === 0) {
    return (
      <SimpleLayout title="회기 관리">
        <div className="client-session-management">
          <div className="no-data-container">
            <div className="no-data-icon">
              <i className="bi bi-calendar-check"></i>
            </div>
            <h3>회기 정보가 없습니다</h3>
            <p>아직 상담사와 연결된 패키지가 없습니다.</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/client/wellness')}
            >
              웰니스 가이드 보기
            </button>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="회기 관리">
      <div className="client-session-management">
        {/* 페이지 헤드라인 */}
        <div className="client-session-management-header">
          <h1 className="client-session-management-title">
            <i className="bi bi-clock-history client-session-management-title-icon"></i>
            회기 관리
          </h1>
          <p className="client-session-management-subtitle">
            상담 회기 현황과 사용 내역을 확인하세요
          </p>
        </div>

        {/* 햄버거 메뉴 드롭다운 */}
        {isMenuOpen && (
          <div className="client-session-menu-dropdown">
            <div className="client-session-menu-content">
              <button 
                className="client-session-menu-item"
                onClick={() => handleMenuAction('dashboard')}
              >
                <i className="bi bi-house client-session-menu-icon"></i>
                대시보드
              </button>
              <button 
                className="client-session-menu-item"
                onClick={() => handleMenuAction('session-management')}
              >
                <i className="bi bi-clock-history client-session-menu-icon"></i>
                회기 관리
              </button>
              <button 
                className="client-session-menu-item"
                onClick={() => handleMenuAction('payment-history')}
              >
                <i className="bi bi-credit-card client-session-menu-icon"></i>
                결제 내역
              </button>
              <button 
                className="client-session-menu-item"
                onClick={() => handleMenuAction('consultation-guide')}
              >
                <i className="bi bi-book client-session-menu-icon"></i>
                상담 가이드
              </button>
            </div>
          </div>
        )}

        {/* 요약 카드 */}
        <div className="summary-cards">
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
            <span>회기 사용률</span>
            <span className="progress-percentage">
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
          <div className="package-info-content">
            {sessionData.mappings.map((mapping, index) => (
              <div key={mapping.id || index} className="package-card">
                <div className="package-card-header">
                  <div className="package-card-header-left">
                    <i className="bi bi-person package-card-icon"></i>
                    <span className="package-card-title">상담사: {mapping.consultant?.consultantName || '미지정'}</span>
                  </div>
                  <span className={`package-card-status ${mapping.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                    {mapping.status === 'ACTIVE' ? '활성' : '비활성'}
                  </span>
                </div>
                <div className="package-card-content">
                  <div className="detail-item">
                    <span className="label">총 회기</span>
                    <span className="value">{mapping.totalSessions}회</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">사용</span>
                    <span className="value">{mapping.usedSessions || 0}회</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">남은 회기</span>
                    <span className="value">{mapping.remainingSessions || 0}회</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">상담사</span>
                    <span className="value">{mapping.consultant?.consultantName || '미지정'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">연결일</span>
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
          <h3>
            <i className="bi bi-calendar3 mg-color-primary"></i>
            최근 상담 일정
          </h3>
          {sessionData.schedules && sessionData.schedules.length > 0 ? (
            <div className="consultation-list">
              {sessionData.schedules.slice(0, 5).map((schedule, index) => (
                <div key={schedule.id || index} className="consultation-item">
                  <div className="consultation-header">
                    <div className="consultation-date">
                      <i className="bi bi-calendar3"></i>
                      {formatDate(schedule.date)}
                    </div>
                    <div className="consultation-status">
                      {getStatusText(schedule.status === '완료')}
                    </div>
                  </div>
                  <div className="consultation-content">
                    <div className="consultation-title">
                      <i className="bi bi-chat-dots"></i>
                      {schedule.title || '상담'}
                    </div>
                    <div className="consultation-details">
                      <div className="consultation-duration">
                        <i className="bi bi-clock"></i>
                        {schedule.startTime} - {schedule.endTime}
                      </div>
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
    </SimpleLayout>
  );
};

export default ClientSessionManagement;
