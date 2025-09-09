import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { DASHBOARD_API } from '../../constants/api';
import SimpleLayout from '../layout/SimpleLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import './ConsultationHistory.css';

const ConsultationHistory = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    if (!sessionLoading && !isLoggedIn) {
      navigate('/login', { replace: true });
      return;
    }

    if (user) {
      loadConsultationHistory();
    }
  }, [user, sessionLoading, isLoggedIn]);

  const loadConsultationHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 상담 내역 로드 시작 - 사용자 ID:', user.id, '역할:', user.role);

      // 사용자 역할에 따라 다른 API 호출
      let response;
      if (user.role === 'CLIENT') {
        response = await apiGet(DASHBOARD_API.CLIENT_SCHEDULES, {
          userId: user.id,
          userRole: 'CLIENT'
        });
      } else if (user.role === 'CONSULTANT') {
        response = await apiGet(DASHBOARD_API.CONSULTANT_SCHEDULES, {
          userId: user.id,
          userRole: 'CONSULTANT'
        });
      } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        response = await apiGet(DASHBOARD_API.ADMIN_STATS, {
          userRole: 'ADMIN'
        });
      }

      if (response?.success && response?.data) {
        setConsultations(response.data);
        console.log('✅ 상담 내역 로드 완료:', response.data.length, '건');
      } else {
        setConsultations([]);
        console.log('⚠️ 상담 내역 데이터 없음');
      }
    } catch (error) {
      console.error('❌ 상담 내역 로드 오류:', error);
      setError('상담 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'CONFIRMED': { text: '확정', class: 'status-confirmed' },
      'BOOKED': { text: '예약', class: 'status-booked' },
      'COMPLETED': { text: '완료', class: 'status-completed' },
      'CANCELLED': { text: '취소', class: 'status-cancelled' },
      'PENDING': { text: '대기', class: 'status-pending' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-default' };
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5); // HH:MM 형식으로 변환
  };

  const getConsultationTitle = (consultation) => {
    if (user.role === 'CLIENT') {
      return `${consultation.consultantName} 상담사와의 상담`;
    } else if (user.role === 'CONSULTANT') {
      return `${consultation.clientName}과의 상담`;
    } else {
      return `${consultation.consultantName} - ${consultation.clientName} 상담`;
    }
  };

  const filteredConsultations = consultations.filter(consultation => {
    const statusMatch = filterStatus === 'ALL' || consultation.status === filterStatus;
    const dateMatch = !filterDate || consultation.date === filterDate;
    return statusMatch && dateMatch;
  });

  if (sessionLoading) {
    return (
      <SimpleLayout>
        <div className="consultation-history-page">
          <div className="loading-container">
            <LoadingSpinner text="세션 확인 중..." size="medium" />
          </div>
        </div>
      </SimpleLayout>
    );
  }

  if (loading) {
    return (
      <SimpleLayout>
        <div className="consultation-history-page">
          <div className="loading-container">
            <LoadingSpinner text="상담 내역을 불러오는 중..." size="medium" />
          </div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="consultation-history-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left"></i>
            </button>
            <div className="header-text">
              <h1>📋 상담 내역</h1>
              <p>나의 상담 기록을 확인할 수 있습니다</p>
            </div>
          </div>
        </div>

        <div className="page-content">
          {/* 필터 섹션 */}
          <div className="filter-section">
            <div className="filter-group">
              <label htmlFor="status-filter">상태</label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">전체</option>
                <option value="CONFIRMED">확정</option>
                <option value="BOOKED">예약</option>
                <option value="COMPLETED">완료</option>
                <option value="CANCELLED">취소</option>
                <option value="PENDING">대기</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="date-filter">날짜</label>
              <input
                id="date-filter"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="filter-input"
              />
            </div>
            
            <button
              className="clear-filters-btn"
              onClick={() => {
                setFilterStatus('ALL');
                setFilterDate('');
              }}
            >
              필터 초기화
            </button>
          </div>

          {/* 상담 내역 목록 */}
          <div className="consultation-list">
            {error ? (
              <div className="error-message">
                <i className="bi bi-exclamation-triangle"></i>
                <p>{error}</p>
                <button onClick={loadConsultationHistory} className="retry-btn">
                  다시 시도
                </button>
              </div>
            ) : filteredConsultations.length === 0 ? (
              <div className="no-data">
                <i className="bi bi-calendar-x"></i>
                <p>상담 내역이 없습니다</p>
                <small>새로운 상담을 예약해보세요</small>
              </div>
            ) : (
              filteredConsultations.map((consultation) => (
                <div key={consultation.id} className="consultation-card">
                  <div className="consultation-header">
                    <h3 className="consultation-title">
                      {getConsultationTitle(consultation)}
                    </h3>
                    {getStatusBadge(consultation.status)}
                  </div>
                  
                  <div className="consultation-details">
                    <div className="detail-item">
                      <i className="bi bi-calendar"></i>
                      <span>{formatDate(consultation.date)}</span>
                    </div>
                    
                    <div className="detail-item">
                      <i className="bi bi-clock"></i>
                      <span>
                        {formatTime(consultation.startTime)} - {formatTime(consultation.endTime)}
                      </span>
                    </div>
                    
                    {consultation.title && (
                      <div className="detail-item">
                        <i className="bi bi-chat-text"></i>
                        <span>{consultation.title}</span>
                      </div>
                    )}
                    
                    {consultation.description && (
                      <div className="detail-item description">
                        <i className="bi bi-file-text"></i>
                        <span>{consultation.description}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="consultation-footer">
                    <small className="created-at">
                      등록일: {formatDate(consultation.createdAt)}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default ConsultationHistory;
