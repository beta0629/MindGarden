import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

/**
 * 상담사용 스케줄 빠른 접근 컴포넌트
 */
const ScheduleQuickAccess = ({ user }) => {
  const navigate = useNavigate();

  // 상담사가 아닌 경우 렌더링하지 않음
  if (user?.role !== 'CONSULTANT') {
    return null;
  }

  const handleScheduleClick = () => {
    navigate('/consultant/schedule');
  };

  const handleTodayScheduleClick = () => {
    navigate('/consultant/schedule?view=today');
  };

  const handleUpcomingScheduleClick = () => {
    navigate('/consultant/schedule?view=upcoming');
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e9ecef'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: '#2c3e50',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className="bi bi-calendar-check" style={{ color: '#007bff' }}></i>
          스케줄 관리
        </h3>
        <button 
          className="btn btn-outline-primary btn-sm"
          onClick={handleScheduleClick}
          style={{
            fontSize: '14px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #007bff',
            background: 'transparent',
            color: '#007bff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#007bff';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#007bff';
          }}
        >
          <i className="bi bi-arrow-right"></i>
          전체보기
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {/* 오늘의 스케줄 */}
        <div
          style={{
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={handleTodayScheduleClick}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              <i className="bi bi-calendar-day"></i>
            </div>
            <div>
              <h4 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600'
              }}>
                오늘의 스케줄
              </h4>
              <p style={{
                margin: 0,
                fontSize: '14px',
                opacity: 0.9
              }}>
                오늘 예정된 상담
              </p>
            </div>
          </div>
          <div style={{
            fontSize: '12px',
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <i className="bi bi-clock"></i>
            바로가기
          </div>
        </div>

        {/* 다가오는 스케줄 */}
        <div
          style={{
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={handleUpcomingScheduleClick}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(240, 147, 251, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              <i className="bi bi-calendar-week"></i>
            </div>
            <div>
              <h4 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600'
              }}>
                다가오는 스케줄
              </h4>
              <p style={{
                margin: 0,
                fontSize: '14px',
                opacity: 0.9
              }}>
                예정된 상담 일정
              </p>
            </div>
          </div>
          <div style={{
            fontSize: '12px',
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <i className="bi bi-clock"></i>
            바로가기
          </div>
        </div>

        {/* 스케줄 등록 */}
        <div
          style={{
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={() => navigate('/consultant/schedule/new')}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(79, 172, 254, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              <i className="bi bi-plus-circle"></i>
            </div>
            <div>
              <h4 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600'
              }}>
                스케줄 등록
              </h4>
              <p style={{
                margin: 0,
                fontSize: '14px',
                opacity: 0.9
              }}>
                새로운 상담 일정
              </p>
            </div>
          </div>
          <div style={{
            fontSize: '12px',
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <i className="bi bi-plus"></i>
            새로 등록
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleQuickAccess;
