import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { RECENT_ACTIVITIES_CSS } from '../../constants/css';

const RecentActivities = ({ consultationData }) => {
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

  return (
    <div className={RECENT_ACTIVITIES_CSS.CONTAINER}>
      <h3 className="section-title">
        <i className="bi bi-clock-history"></i>
        최근 활동
      </h3>
      <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_LIST}>
        {consultationData?.recentActivities && consultationData.recentActivities.length > 0 ? (
          consultationData.recentActivities.map((activity, index) => (
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
