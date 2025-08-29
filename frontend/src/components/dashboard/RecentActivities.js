import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

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
    <div className="recent-activities">
      <h3 className="section-title">
        <i className="bi bi-clock-history"></i>
        최근 활동
      </h3>
      <div className="activity-list">
        {consultationData?.recentActivities && consultationData.recentActivities.length > 0 ? (
          consultationData.recentActivities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon">
                <i className={`bi ${getActivityIcon(activity.type)}`}></i>
              </div>
              <div className="activity-content">
                <div className="activity-title">{activity.title}</div>
                <div className="activity-time">{activity.time}</div>
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
