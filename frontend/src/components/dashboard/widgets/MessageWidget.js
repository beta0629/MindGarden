/**
 * Message Widget
/**
 * 메시지 목록을 표시하는 범용 위젯
/**
 * ClientMessageSection을 기반으로 범용화
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../utils/ajax';
// // import UnifiedLoading from '../../../components/common/UnifiedLoading'; // 임시 비활성화
import UnifiedModal from '../../../components/common/modals/UnifiedModal'; // 임시 비활성화
import './Widget.css';
import SafeText from '../../common/SafeText';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../utils/safeDisplay';

const MessageWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const maxItems = config.maxItems || 10;
  const messageTypes = config.messageTypes || {};
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadMessages();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadMessages, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.messages && Array.isArray(config.messages)) {
      setMessages(config.messages);
      setUnreadCount(config.messages.filter(m => !m.isRead).length);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadMessages = async() => {
    try {
      setLoading(true);
      
      // 실제 API 엔드포인트: /api/v1/consultation-messages/client/{userId}
      const url = dataSource.url || `/api/v1/consultation-messages/client/${user?.id}`;
      const params = { 
        ...dataSource.params, 
        page: 0,
        size: maxItems,
        sort: 'createdAt,desc'
      };
      
      const response = await apiGet(url, params);
      
      if (response && response.success) {
        // ConsultationMessageController 응답 형식: { messages: [...], totalElements: ... }
        const messageList = response.data?.messages || response.messages || [];
        setMessages(Array.isArray(messageList) ? messageList.slice(0, maxItems) : []);
        setUnreadCount(messageList.filter(m => !m.isRead).length);
      } else if (response) {
        // 다른 응답 형식 지원
        const messageList = response.data || response || [];
        setMessages(Array.isArray(messageList) ? messageList.slice(0, maxItems) : []);
        setUnreadCount(messageList.filter(m => !m.isRead).length);
      } else {
        setMessages([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('MessageWidget 데이터 로드 실패:', err);
      setMessages([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };
  
  const getMessageTypeInfo = (type) => {
    return messageTypes[type] || messageTypes.DEFAULT || {
      icon: 'bi-envelope',
      label: '메시지',
      colorClass: 'secondary'
    };
  };
  
  const handleMessageClick = (message) => {
    setSelectedMessage(message);
  };
  
  const handleViewAll = () => {
    if (config.viewAllUrl) {
      navigate(config.viewAllUrl);
    } else {
      navigate('/messages');
    }
  };
  
  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };
  
  if (loading && messages.length === 0) {
    return (
      <div className="widget widget-message">
        <div className="mg-loading">로딩중...</div>
      </div>
    );
  }
  
  const displayMessages = messages.slice(0, maxItems);
  
  return (
    <div className="widget widget-message">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-envelope" />
          {config.title || '메시지'}
          {unreadCount > 0 && (
            <span className="widget-badge">{unreadCount}</span>
          )}
        </div>
        {config.viewAllUrl && (
          <MGButton
            type="button"
            variant="outline"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              loading: false,
              className: 'widget-view-all'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleViewAll}
            preventDoubleClick={false}
          >
            전체보기 →
          </MGButton>
        )}
      </div>
      <div className="widget-body">
        {displayMessages.length > 0 ? (
          <div className="message-list">
            {displayMessages.map((message, index) => {
              const typeInfo = getMessageTypeInfo(message.type);
              return (
                <div
                  key={message.id || index}
                  className={`message-item ${!message.isRead ? 'unread' : ''}`}
                  onClick={() => handleMessageClick(message)}
                >
                  <div className="message-icon">
                    <i className={`bi ${typeInfo.icon}`} />
                  </div>
                  <div className="message-content">
                    <div className="message-title"><SafeText>{message.title ?? message.subject}</SafeText></div>
                    <div className="message-preview"><SafeText>{message.content ?? message.body}</SafeText></div>
                    <div className="message-meta">
                      <span className="message-time">{formatTime(message.createdAt || message.sentAt)}</span>
                      {message.sender && (
                        <span className="message-sender"><SafeText>{message.sender}</SafeText></span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="widget-empty">
            <i className="bi bi-inbox" />
            <p>{config.emptyMessage || '메시지가 없습니다'}</p>
          </div>
        )}
      </div>
      
      {selectedMessage && (
        <div className="mg-modal"
          isOpen={!!selectedMessage}
          onClose={() => setSelectedMessage(null)}
          title={toDisplayString(selectedMessage.title ?? selectedMessage.subject, '메시지')}
        >
          <div className="message-detail">
            <div className="message-detail-content">
              <SafeText tag="div">{selectedMessage.content ?? selectedMessage.body}</SafeText>
            </div>
            <div className="message-detail-meta">
              {selectedMessage.sender && (
                <div>보낸 사람: <SafeText>{selectedMessage.sender}</SafeText></div>
              )}
              {selectedMessage.createdAt && (
                <div>받은 시간: {new Date(selectedMessage.createdAt).toLocaleString('ko-KR')}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageWidget;

