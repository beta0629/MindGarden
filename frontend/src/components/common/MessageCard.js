import React from 'react';
import { Mail, AlertCircle, Clock, CheckCircle } from 'lucide-react';

/**
 * 메시지 카드 공통 컴포넌트
 * 메시지 목록에서 재사용 가능한 카드 컴포넌트
 */
const MessageCard = ({ 
  message, 
  onClick,
  showUnreadIndicator = true,
  compact = false
}) => {
  // 메시지 타입별 정보
  const getMessageTypeInfo = (messageType) => {
    const typeMap = {
      'GENERAL': { icon: <Mail size={16} />, label: '일반', colorClass: 'secondary' },
      'FOLLOW_UP': { icon: <CheckCircle size={16} />, label: '후속 조치', colorClass: 'primary' },
      'HOMEWORK': { icon: <Clock size={16} />, label: '과제 안내', colorClass: 'success' },
      'APPOINTMENT': { icon: <Clock size={16} />, label: '약속 안내', colorClass: 'warning' },
      'REMINDER': { icon: <AlertCircle size={16} />, label: '알림', colorClass: 'warning' },
      'URGENT': { icon: <AlertCircle size={16} />, label: '긴급', colorClass: 'danger' },
      'EMERGENCY': { icon: <AlertCircle size={16} />, label: '긴급 안내', colorClass: 'danger' }
    };
    return typeMap[messageType] || typeMap['GENERAL'];
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  const typeInfo = getMessageTypeInfo(message.messageType);

  return (
    <div
      className={`mg-card mg-cursor-pointer ${!message.isRead ? 'message-item-unread' : ''}`}
      onClick={() => onClick && onClick(message)}
    >
      <div className="mg-flex mg-align-start mg-gap-md">
        <div className={`message-type-icon message-type-icon-${typeInfo.colorClass}`}>
          {typeInfo.icon}
        </div>
        <div className="mg-flex-1">
          <div className="mg-flex mg-align-center mg-gap-sm mg-mb-xs mg-flex-wrap">
            <h5 className={`${compact ? 'mg-h6' : 'mg-h5'} mg-mb-0`}>
              {message.title}
            </h5>
            {message.isImportant && (
              <span className="mg-badge mg-badge-warning mg-text-xs">중요</span>
            )}
            {message.isUrgent && (
              <span className="mg-badge mg-badge-danger mg-text-xs">긴급</span>
            )}
          </div>
          <p className="mg-text-sm mg-color-text-secondary mg-mb-xs">
            {message.content?.substring(0, compact ? 40 : 50)}
            {message.content?.length > (compact ? 40 : 50) && '...'}
          </p>
          <div className="mg-flex mg-align-center mg-gap-sm mg-text-xs mg-color-text-secondary mg-flex-wrap">
            <span className={`mg-badge mg-badge-${typeInfo.colorClass}`}>{typeInfo.label}</span>
            <span>{formatDate(message.sentAt || message.createdAt)}</span>
          </div>
        </div>
        {!message.isRead && showUnreadIndicator && (
          <div className="message-item-unread-dot"></div>
        )}
      </div>
    </div>
  );
};

export default MessageCard;

