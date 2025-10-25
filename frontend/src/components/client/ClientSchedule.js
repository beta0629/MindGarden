import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, AlertTriangle } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import ScheduleCalendar from '../schedule/ScheduleCalendar';
import '../../styles/mindgarden-design-system.css';
import './ClientSchedule.css';

/**
 * 내담자 일정 페이지
 * 디자인 시스템 적용 버전
 */
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
          <UnifiedLoading text="일정을 불러오는 중..." />
        </div>
      </SimpleLayout>
    );
  }

  if (error) {
    return (
      <SimpleLayout>
        <div className="client-schedule-error">
          <div className="client-schedule-error__icon">
            <AlertTriangle size={48} />
          </div>
          <h3 className="client-schedule-error__title">오류가 발생했습니다</h3>
          <p className="client-schedule-error__message">{error}</p>
          <button 
            className="mg-v2-button mg-v2-button-primary"
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="client-schedule-container">
        <div className="client-schedule-header">
          <div className="client-schedule-header__icon">
            <Calendar size={32} />
          </div>
          <div className="client-schedule-header__content">
            <h1 className="client-schedule-header__title">내 일정</h1>
            <p className="client-schedule-header__subtitle">
              예약된 상담 일정을 확인하고 관리할 수 있습니다.
            </p>
          </div>
        </div>
        
        <div className="client-schedule-calendar-wrapper">
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
