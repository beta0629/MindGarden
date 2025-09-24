import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { RECENT_ACTIVITIES_CSS } from '../../constants/css';
import './RecentActivities.css';

const RecentActivities = ({ consultationData }) => {
  const navigate = useNavigate();
  const getActivityIcon = (type) => {
    switch (type) {
      case 'profile':
        return 'bi-person-circle';
      case 'schedule':
        return 'bi-calendar-check';
      case 'consultation':
        return 'bi-chat-dots';
      case 'payment':
        return 'bi-credit-card';
      default:
        return 'bi-info-circle';
    }
  };

  const handleViewAll = () => {
    // 활동 내역 페이지로 이동
    console.log('최근 활동 상세 페이지로 이동');
    navigate('/client/activity-history');
  };

  const activities = consultationData?.recentActivities || [];
  const displayActivities = activities.slice(0, 5);
  const hasMoreActivities = activities.length > 5;

  return (
    <div className={RECENT_ACTIVITIES_CSS.CONTAINER}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <h3 className={RECENT_ACTIVITIES_CSS.SECTION_TITLE}>
          <i className="bi bi-clock-history"></i>
          최근 활동
        </h3>
        {hasMoreActivities && (
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={handleViewAll}
            style={{
              fontSize: '14px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #007bff',
              background: 'transparent',
              color: '#007bff',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
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
            <i className="bi bi-arrow-right" style={{ marginRight: '4px' }}></i>
            전체보기
          </button>
        )}
      </div>
      <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_LIST}>
        {displayActivities.length > 0 ? (
          displayActivities.map((activity, index) => (
            <div key={index} className={RECENT_ACTIVITIES_CSS.ACTIVITY_ITEM}>
              <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_ICON}>
                <i className={`bi ${getActivityIcon(activity.type)}`}></i>
              </div>
              <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_CONTENT}>
                <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_TITLE}>{activity.title}</div>
                <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_TIME}>{activity.time}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-activities">
            <i className="bi bi-inbox"></i>
            <p>최근 활동이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivities;
