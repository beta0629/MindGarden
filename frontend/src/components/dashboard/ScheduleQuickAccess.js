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

      {/* 통합 스케줄 카드 */}
      <div
        style={{
          border: '1px solid #e9ecef',
          borderRadius: '12px',
          padding: '24px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center'
        }}
        onClick={handleScheduleClick}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            <i className="bi bi-calendar-check"></i>
          </div>
          <div>
            <h4 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              스케줄 관리
            </h4>
            <p style={{
              margin: 0,
              fontSize: '16px',
              opacity: 0.9,
              lineHeight: '1.4'
            }}>
              오늘의 스케줄, 다가오는 상담, 새 일정 등록
            </p>
          </div>
          <div style={{
            fontSize: '14px',
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <i className="bi bi-arrow-right"></i>
            스케줄 페이지로 이동
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleQuickAccess;
