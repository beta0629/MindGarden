import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';
import SimpleLayout from '../layout/SimpleLayout';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './ClientSessionManagement.css';

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
        alert('상담 가이드 페이지는 준비 중입니다.');
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
              onClick={() => navigate('/dashboard')}
            >
              상담사 연결하기
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
        <div className="client-session-management-header"
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
        }}>
          <h1 style={{
            margin: '0 0 12px 0',
            fontSize: 'var(--font-size-xxxl)',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px'
          }}>
            <i className="bi bi-clock-history" style={{ fontSize: 'var(--font-size-xxl)' }}></i>
            회기 관리
          </h1>
          <p style={{
            margin: '0',
            fontSize: 'var(--font-size-lg)',
            opacity: '0.9',
            fontWeight: '400'
          }}>
            상담 회기 현황과 사용 내역을 확인하세요
          </p>
        </div>

        {/* 햄버거 메뉴 드롭다운 */}
        {isMenuOpen && (
          <div style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '200px'
          }}>
            <div style={{ padding: '8px 0' }}>
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
                  gap: '8px'
                }}
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
                  gap: '8px'
                }}
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
                  gap: '8px'
                }}
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
                  gap: '8px'
                }}
                onClick={() => handleMenuAction('consultation-guide')}
              >
                <i className="bi bi-book"></i>
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
          <div style={{
            display: 'block',
            padding: '0',
            margin: '0',
            width: '100%'
          }}>
            {sessionData.mappings.map((mapping, index) => (
              <div key={mapping.id || index} style={{
                backgroundColor: '#fff',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <i className="bi bi-person" style={{ color: '#007bff', fontSize: 'var(--font-size-lg)' }}></i>
                    <span style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: '600',
                      color: '#2c3e50'
                    }}>상담사: {mapping.consultant?.consultantName || '미지정'}</span>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: '500',
                    backgroundColor: mapping.status === 'ACTIVE' ? '#d4edda' : '#f8d7da',
                    color: mapping.status === 'ACTIVE' ? '#155724' : '#721c24'
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
                  gap: '16px'
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
                      fontSize: 'var(--font-size-xs)',
                      color: '#6c757d',
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>총 회기</span>
                    <span style={{
                      fontSize: 'var(--font-size-base)',
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
                      fontSize: 'var(--font-size-xs)',
                      color: '#6c757d',
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>사용</span>
                    <span style={{
                      fontSize: 'var(--font-size-base)',
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
                      fontSize: 'var(--font-size-xs)',
                      color: '#6c757d',
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>남은 회기</span>
                    <span style={{
                      fontSize: 'var(--font-size-base)',
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
                      fontSize: 'var(--font-size-xs)',
                      color: '#6c757d',
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>상담사</span>
                    <span style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: '600',
                      color: '#2c3e50'
                    }}>{mapping.consultant?.consultantName || '미지정'}</span>
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
                      fontSize: 'var(--font-size-xs)',
                      color: '#6c757d',
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>연결일</span>
                    <span style={{
                      fontSize: 'var(--font-size-base)',
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
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginTop: '24px'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: 'var(--font-size-xl)',
            fontWeight: '600',
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="bi bi-calendar3" style={{ color: '#007bff' }}></i>
            최근 상담 일정
          </h3>
          {sessionData.schedules && sessionData.schedules.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {sessionData.schedules.slice(0, 5).map((schedule, index) => (
                <div key={schedule.id || index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div style={{ flex: '0 0 auto', marginRight: '16px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <i className="bi bi-calendar3" style={{ color: '#007bff', fontSize: 'var(--font-size-base)' }}></i>
                      {formatDate(schedule.date)}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      color: getStatusColor(schedule.status === '완료'),
                      fontWeight: '500'
                    }}>
                      {getStatusText(schedule.status === '완료')}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <i className="bi bi-chat-dots" style={{ color: '#28a745', fontSize: 'var(--font-size-base)' }}></i>
                      {schedule.title || '상담'}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: 'var(--font-size-sm)',
                      color: '#6c757d'
                    }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <i className="bi bi-clock" style={{ fontSize: 'var(--font-size-xs)' }}></i>
                        {schedule.startTime} - {schedule.endTime}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#6c757d',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '2px dashed #dee2e6'
            }}>
              <i className="bi bi-calendar-x" style={{ fontSize: 'var(--font-size-xxxl)', marginBottom: '20px', color: '#dee2e6' }}></i>
              <p style={{ margin: '0', fontSize: 'var(--font-size-lg)', fontWeight: '500' }}>아직 상담 일정이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </SimpleLayout>
  );
};

export default ClientSessionManagement;
