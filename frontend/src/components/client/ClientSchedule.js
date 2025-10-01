import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { DASHBOARD_API } from '../../constants/api';
import SimpleLayout from '../layout/SimpleLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import ScheduleCalendar from '../schedule/ScheduleCalendar';
import './ClientSchedule.css';

const ClientSchedule = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionLoading && !isLoggedIn) {
      navigate('/login', { replace: true });
      return;
    }

    if (user) {
      setLoading(false);
    }
  }, [user, isLoggedIn, sessionLoading, navigate]);

  if (sessionLoading || loading) {
    return (
      <SimpleLayout>
        <div className="client-schedule-loading">
          <LoadingSpinner />
        </div>
      </SimpleLayout>
    );
  }

  if (error) {
    return (
      <SimpleLayout>
        <div className="client-schedule-error">
          <i className="bi bi-exclamation-triangle client-schedule-error-icon"></i>
          <h3 className="client-schedule-error-title">오류가 발생했습니다</h3>
          <p className="client-schedule-error-message">{error}</p>
          <button 
            className="mg-btn mg-btn--primary"
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="내 일정">
      <div className="client-schedule-container">
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            fontSize: 'var(--font-size-xxl)',
            fontWeight: '700',
            color: '#2c3e50',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <i className="bi bi-calendar3" style={{ color: '#3498db', fontSize: 'var(--font-size-xxxl)' }}></i>
            내 일정
          </h2>
          <p style={{
            fontSize: 'var(--font-size-base)',
            color: '#6c757d',
            margin: '0',
            lineHeight: '1.6'
          }}>
            예약된 상담 일정을 확인하고 관리할 수 있습니다.
          </p>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <ScheduleCalendar 
            userRole={user?.role || 'CLIENT'}
            userId={user?.id || null}
            readOnly={false}
            showClientView={true}
          />
        </div>
      </div>
    </SimpleLayout>
  );
};

export default ClientSchedule;
