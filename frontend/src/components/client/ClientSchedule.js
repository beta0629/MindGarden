import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { DASHBOARD_API } from '../../constants/api';
import SimpleLayout from '../layout/SimpleLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import ScheduleCalendar from '../schedule/ScheduleCalendar';

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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <LoadingSpinner />
        </div>
      </SimpleLayout>
    );
  }

  if (error) {
    return (
      <SimpleLayout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <i className="bi bi-exclamation-triangle" style={{ fontSize: '48px', color: '#dc3545', marginBottom: '16px' }}></i>
          <h3 style={{ color: '#dc3545', marginBottom: '16px' }}>오류가 발생했습니다</h3>
          <p style={{ color: '#6c757d', marginBottom: '24px' }}>{error}</p>
          <button 
            className="btn btn-primary"
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
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%)',
        minHeight: '100vh'
      }}>
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
            fontSize: '28px',
            fontWeight: '700',
            color: '#2c3e50',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <i className="bi bi-calendar3" style={{ color: '#3498db', fontSize: '32px' }}></i>
            내 일정
          </h2>
          <p style={{
            fontSize: '16px',
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
