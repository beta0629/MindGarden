// import React from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import MGButton from '../common/MGButton';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { RECENT_ACTIVITIES_CSS } from '../../constants/css';
import './RecentActivities.css';
import SafeText from '../common/SafeText';

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
      <div className="recent-activities-header">
        <h3 className={RECENT_ACTIVITIES_CSS.SECTION_TITLE}>
          <i className="bi bi-clock-history" />
          최근 활동
        </h3>
        {hasMoreActivities && (
          <MGButton
            variant="outline"
            size="small"
            className="recent-activities-view-all mg-button--with-icon"
            onClick={handleViewAll}
          >
            <i className="bi bi-arrow-right" />
            전체보기
          </MGButton>
        )}
      </div>
      <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_LIST}>
        {displayActivities.length > 0 ? (
          displayActivities.map((activity, index) => (
            <div key={index} className={RECENT_ACTIVITIES_CSS.ACTIVITY_ITEM}>
              <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_ICON}>
                <i className={`bi ${getActivityIcon(activity.type)}`} />
              </div>
              <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_CONTENT}>
                <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_TITLE}><SafeText>{activity.title}</SafeText></div>
                <div className={RECENT_ACTIVITIES_CSS.ACTIVITY_TIME}><SafeText>{activity.time}</SafeText></div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-activities">
            <i className="bi bi-inbox" />
            <p>최근 활동이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivities;
