/**
 * Personalized Message Widget
 * 맞춤형 메시지를 표시하는 범용 위젯
 * ClientPersonalizedMessages를 기반으로 범용화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../utils/ajax';
import UnifiedLoading from '../../common/UnifiedLoading';
import './Widget.css';

const PersonalizedMessageWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const userId = user?.id || config.userId;
  const maxItems = config.maxItems || 3;
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url && userId) {
      loadPersonalizedMessages();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadPersonalizedMessages, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.messages && Array.isArray(config.messages)) {
      setMessages(config.messages);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [userId]);
  
  const loadPersonalizedMessages = async () => {
    try {
      setLoading(true);
      
      const url = dataSource.url || `/api/personalized-messages/${userId}`;
      const params = {
        ...dataSource.params,
        userId: userId,
        userRole: user?.role
      };
      
      const response = await apiGet(url, params);
      
      if (response && response.data) {
        const messageList = Array.isArray(response.data) ? response.data : [];
        setMessages(messageList.slice(0, maxItems));
      }
    } catch (err) {
      console.error('PersonalizedMessageWidget 데이터 로드 실패:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMessageClick = (message) => {
    if (message.action && message.action.url) {
      navigate(message.action.url);
    } else if (message.url) {
      navigate(message.url);
    } else if (config.defaultActionUrl) {
      navigate(config.defaultActionUrl);
    }
  };
  
  const getIconComponent = (iconName) => {
    // Bootstrap Icons 사용
    return <i className={`bi bi-${iconName}`}></i>;
  };
  
  if (loading && messages.length === 0) {
    return (
      <div className="widget widget-personalized-message">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  return (
    <div className="widget widget-personalized-message">
      <div className="widget-header">
        {config.title && (
          <div className="widget-title">{config.title}</div>
        )}
      </div>
      <div className="widget-body">
        {messages.length > 0 ? (
          <div className="personalized-message-list">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`personalized-message-card ${message.type || 'info'}`}
                onClick={() => handleMessageClick(message)}
              >
                {message.icon && (
                  <div className="personalized-message-icon">
                    {getIconComponent(message.icon)}
                  </div>
                )}
                <div className="personalized-message-content">
                  <div className="personalized-message-title">{message.title}</div>
                  {message.description && (
                    <div className="personalized-message-description">{message.description}</div>
                  )}
                  {message.action && message.action.label && (
                    <div className="personalized-message-action">
                      {message.action.label} <i className="bi bi-arrow-right"></i>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="widget-empty">
            <i className="bi bi-chat-dots"></i>
            <p>{config.emptyMessage || '맞춤형 메시지가 없습니다'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizedMessageWidget;



