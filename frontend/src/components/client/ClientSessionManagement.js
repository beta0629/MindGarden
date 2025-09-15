import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';
import SimpleLayout from '../layout/SimpleLayout';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleHamburgerClick = (isOpen) => {
    setIsMenuOpen(isOpen);
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
        alert('상담 가이드 페이지는 준비 중입니다.');
        break;
      default:
        break;
    }
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
    <SimpleLayout title="회기 관리">
      <div className="client-session-management">
      
      {/* 햄버거 메뉴 드롭다운 */}
      {isMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          minWidth: '200px',
          padding: '8px 0'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e9ecef',
            fontWeight: '600',
            color: '#2c3e50',
            fontSize: '14px'
          }}>
            메뉴
          </div>
          <button 
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#2c3e50',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            onClick={() => handleMenuAction('dashboard')}
          >
            <i className="bi bi-house"></i>
            대시보드
          </button>
          <button 
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#2c3e50',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            onClick={() => handleMenuAction('session-management')}
          >
            <i className="bi bi-clock-history"></i>
            회기 관리
          </button>
          <button 
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#2c3e50',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            onClick={() => handleMenuAction('payment-history')}
          >
            <i className="bi bi-credit-card"></i>
            결제 내역
          </button>
          <button 
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#2c3e50',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            onClick={() => handleMenuAction('consultation-guide')}
          >
            <i className="bi bi-book"></i>
            상담 가이드
          </button>
        </div>
      )}

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
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        margin: '20px 0 30px 0',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        maxHeight: '500px',
        overflowY: 'auto',
        position: 'relative'
      }}>
        <div style={{
          display: 'block',
          padding: '0',
          margin: '0',
          width: '100%'
        }}>
          {sessionData.mappings
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((mapping, index) => (
            <div key={index} style={{
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              padding: '20px',
              transition: 'all 0.3s ease',
              display: 'block',
              minHeight: '100px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              marginBottom: '16px',
              width: '100%',
              position: 'relative',
              boxSizing: 'border-box',
              background: '#f8f9fa'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #e9ecef'
              }}>
                <h4 style={{
                  margin: '0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>{mapping.packageName || '상담 패키지'}</h4>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: mapping.status === 'ACTIVE' ? '#d4edda' : '#f8d7da',
                  color: mapping.status === 'ACTIVE' ? '#155724' : '#721c24',
                  border: mapping.status === 'ACTIVE' ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
                }}>
                  {mapping.status === 'ACTIVE' ? '활성' : '비활성'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '16px',
                flexWrap: 'wrap',
                gap: '16px',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 12px',
                  textAlign: 'center',
                  minWidth: '80px',
                  boxSizing: 'border-box'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#6c757d',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>총 회기:</span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>{mapping.totalSessions}회</span>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 12px',
                  textAlign: 'center',
                  minWidth: '80px',
                  boxSizing: 'border-box'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#6c757d',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>사용 회기:</span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>{mapping.usedSessions || 0}회</span>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 12px',
                  textAlign: 'center',
                  minWidth: '80px',
                  boxSizing: 'border-box'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#6c757d',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>남은 회기:</span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>{mapping.remainingSessions || 0}회</span>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 12px',
                  textAlign: 'center',
                  minWidth: '80px',
                  boxSizing: 'border-box'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#6c757d',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>상담사:</span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>{mapping.consultant?.name || '미지정'}</span>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 12px',
                  textAlign: 'center',
                  minWidth: '80px',
                  boxSizing: 'border-box'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#6c757d',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>연결일:</span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    {mapping.createdAt ? formatDate(mapping.createdAt) : '알 수 없음'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 상담 일정 */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginTop: '20px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          margin: '0 0 24px 0',
          fontSize: '22px',
          fontWeight: '700',
          color: '#2c3e50',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <i className="bi bi-calendar-event" style={{ color: '#007bff', fontSize: '20px' }}></i> 
          최근 상담 일정
        </h3>
        {sessionData.recentSchedules.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {sessionData.recentSchedules.map((schedule, index) => (
              <div key={index} style={{
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                padding: '20px',
                transition: 'all 0.3s ease',
                background: '#f8f9fa',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e9ecef'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <i className="bi bi-calendar3" style={{ color: '#007bff', fontSize: '16px' }}></i>
                    {formatDate(schedule.date)}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: '#d4edda',
                    color: '#155724',
                    border: '1px solid #c3e6cb'
                  }}>
                    {getStatusText(schedule.status === '완료')}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <i className="bi bi-chat-dots" style={{ color: '#28a745', fontSize: '16px' }}></i>
                    {schedule.title || '상담'}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      color: '#6c757d',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      background: '#e9ecef',
                      borderRadius: '6px'
                    }}>
                      <i className="bi bi-clock" style={{ color: '#6c757d', fontSize: '14px' }}></i>
                      {schedule.startTime} - {schedule.endTime}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center',
            color: '#6c757d',
            background: '#f8f9fa',
            borderRadius: '12px',
            border: '2px dashed #dee2e6'
          }}>
            <i className="bi bi-calendar-x" style={{ fontSize: '64px', marginBottom: '20px', color: '#dee2e6' }}></i>
            <p style={{ margin: '0', fontSize: '18px', fontWeight: '500' }}>아직 상담 일정이 없습니다.</p>
          </div>
        )}
      </div>
    </SimpleLayout>
  );
};

export default ClientSessionManagement;
