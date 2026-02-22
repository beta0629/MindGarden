import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { getCommonCodes } from '../../utils/commonCodeApi';
import { DASHBOARD_API } from '../../constants/api';
import { USER_ROLES } from '../../constants/roles';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import notificationManager from '../../utils/notification';
import './ConsultationHistory.css';

const ConsultationHistory = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [statusOptions, setStatusOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !isLoggedIn) {
      navigate('/login', { replace: true });
      return;
    }

    if (user) {
      loadConsultationHistory();
    }
  }, [user, sessionLoading, isLoggedIn]);

  // 상담 상태 코드 로드 (공통코드 기반)
  useEffect(() => {
    const loadStatusCodes = async () => {
      try {
        setLoadingCodes(true);
        // 공통코드 API 사용 (표준화된 방법)
        const codes = await getCommonCodes('CONSULTATION_STATUS');
        
        if (codes && Array.isArray(codes) && codes.length > 0) {
          const options = codes.map(code => ({
            value: code.codeValue,
            label: code.koreanName || code.codeLabel,
            icon: code.icon || '📋',
            color: code.colorCode || 'var(--mg-gray-500)'
          }));
          setStatusOptions(options);
        } else {
          console.warn('📋 상담 상태 코드 데이터가 없습니다. 공통코드에서 조회하세요.');
          setStatusOptions([]); // 하드코딩된 fallback 제거
        }
      } catch (error) {
        console.error('상담 상태 코드 로드 실패:', error);
        // 하드코딩된 fallback 제거 - 공통코드에서만 조회
        setStatusOptions([]);
        notificationManager.error('상담 상태 코드를 불러올 수 없습니다. 관리자에게 문의하세요.');
      } finally {
        setLoadingCodes(false);
      }
    };

    loadStatusCodes();
  }, []);

  const loadConsultationHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 상담 내역 로드 시작 - 사용자 ID:', user.id, '역할:', user.role);

      // 사용자 역할에 따라 다른 API 호출 (표준화 2025-12-05: 상수 활용)
      let response;
      if (user.role === USER_ROLES.CLIENT) {
        response = await apiGet(DASHBOARD_API.CLIENT_SCHEDULES, {
          userId: user.id,
          userRole: USER_ROLES.CLIENT
        });
      } else if (user.role === USER_ROLES.CONSULTANT) {
        response = await apiGet(DASHBOARD_API.CONSULTANT_SCHEDULES, {
          userId: user.id,
          userRole: USER_ROLES.CONSULTANT
        });
      } else if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.BRANCH_SUPER_ADMIN) {
        response = await apiGet(DASHBOARD_API.ADMIN_STATS, {
          userRole: USER_ROLES.ADMIN
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
    // 동적으로 로드된 상태 옵션에서 찾기
    const statusOption = statusOptions.find(option => option.value === status);
    
    if (statusOption) {
      return (
        <span 
          className={`status-badge status-${status.toLowerCase()}`} 
          data-color={statusOption.color}
        >
          {statusOption.icon} {statusOption.label}
        </span>
      );
    }
    
    // 기본값
    return (
      <span className="status-badge status-default">
        ❓ {status}
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
      <AdminCommonLayout menuItems={DEFAULT_MENU_ITEMS} title="상담 내역" loading={true} loadingText="세션 정보를 불러오는 중...">
        <div />
      </AdminCommonLayout>
    );
  }

  if (loading) {
    return (
      <AdminCommonLayout menuItems={DEFAULT_MENU_ITEMS} title="상담 내역" loading={true} loadingText="상담 내역을 불러오는 중...">
        <div />
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout menuItems={DEFAULT_MENU_ITEMS} title="상담 내역">
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
                disabled={loadingCodes}
              >
                <option value="ALL">전체</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label} ({option.value})
                  </option>
                ))}
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
    </AdminCommonLayout>
  );
};

export default ConsultationHistory;
