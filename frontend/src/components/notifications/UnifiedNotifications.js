import React, { useState, useEffect } from 'react';
import { useSession } from '../../contexts/SessionContext';
// import { useNotification } from '../../contexts/NotificationContext'; // 이벤트 기반으로 카운트 갱신
import { apiGet } from '../../utils/ajax';
import { Bell, MessageSquare, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import '../../styles/mindgarden-design-system.css';

/**
 * 통합 알림 페이지
 * 시스템 공지와 일반 메시지를 탭으로 구분하여 표시
 */
const UnifiedNotifications = () => {
  const { user, isLoggedIn } = useSession();
  
  const [activeTab, setActiveTab] = useState('system'); // 'system' or 'messages'
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  // 시스템 공지 로드
  const loadSystemNotifications = async () => {
    if (!isLoggedIn) return;

    try {
      setLoading(true);
      const response = await apiGet('/api/system-notifications?page=0&size=50');

      if (response.success) {
        setSystemNotifications(response.data || []);
      }
    } catch (error) {
      console.error('시스템 공지 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 일반 메시지 로드
  const loadMessages = async () => {
    if (!isLoggedIn || !user?.id) return;

    try {
      setLoading(true);
      
      // 역할에 따라 다른 API 호출
      let endpoint = '';
      if (user.role === 'CONSULTANT') {
        endpoint = `/api/consultation-messages/consultant/${user.id}?page=0&size=50`;
      } else if (user.role === 'CLIENT') {
        endpoint = `/api/consultation-messages/client/${user.id}?page=0&size=50`;
      } else {
        // 관리자는 전체 메시지
        endpoint = '/api/consultation-messages/all';
      }

      const response = await apiGet(endpoint);

      if (response.success) {
        setMessages(response.data || []);
      }
    } catch (error) {
      console.error('메시지 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedItem(null);
    if (tab === 'system') {
      loadSystemNotifications();
    } else {
      loadMessages();
    }
  };

  // 시스템 공지 클릭
  const handleSystemNotificationClick = async (notification) => {
    try {
      // 상세 조회 API 호출 (자동 읽음 처리)
      const response = await apiGet(`/api/system-notifications/${notification.id}`);
      
      if (response.success) {
        setSelectedItem({ type: 'system', data: response.data });
      } else {
        // 실패 시 기존 데이터 사용
        setSelectedItem({ type: 'system', data: notification });
      }
    } catch (error) {
      console.error('공지 상세 조회 오류:', error);
      // 오류 시 기존 데이터 사용
      setSelectedItem({ type: 'system', data: notification });
    }
  };

  // 일반 메시지 클릭
  const handleMessageClick = async (message) => {
    try {
      // 상세 조회 API 호출 (자동 읽음 처리)
      const response = await apiGet(`/api/consultation-messages/${message.id}`);
      
      if (response.success) {
        setSelectedItem({ type: 'message', data: response.data });
      } else {
        // 실패 시 기존 데이터 사용
        setSelectedItem({ type: 'message', data: message });
      }
    } catch (error) {
      console.error('메시지 상세 조회 오류:', error);
      // 오류 시 기존 데이터 사용
      setSelectedItem({ type: 'message', data: message });
    }
  };

  // 모달 닫기
  const closeModal = async () => {
    setSelectedItem(null);
    
    // 목록 새로고침 (읽음 상태 반영)
    if (activeTab === 'system') {
      await loadSystemNotifications();
      // 공지 읽음 이벤트 발생 (NotificationContext가 카운트 갱신)
      window.dispatchEvent(new Event('notification-read'));
    } else {
      await loadMessages();
      // 메시지 읽음 이벤트 발생 (NotificationContext가 카운트 갱신)
      window.dispatchEvent(new Event('message-read'));
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 메시지 유형 라벨
  const getMessageTypeLabel = (type) => {
    const labels = {
      GENERAL: '일반',
      FOLLOW_UP: '후속 조치',
      HOMEWORK: '과제 안내',
      REMINDER: '알림',
      URGENT: '긴급'
    };
    return labels[type] || '일반';
  };

  // 메시지 유형 색상
  const getMessageTypeColor = (type) => {
    const colors = {
      GENERAL: 'var(--color-info)',
      FOLLOW_UP: 'var(--color-primary)',
      HOMEWORK: 'var(--color-success)',
      REMINDER: 'var(--color-warning)',
      URGENT: 'var(--color-danger)'
    };
    return colors[type] || 'var(--color-info)';
  };

  useEffect(() => {
    if (activeTab === 'system') {
      loadSystemNotifications();
    } else {
      loadMessages();
    }
  }, [isLoggedIn, user?.id]);

  if (!isLoggedIn) {
    return (
      <SimpleLayout title="알림">
        <div className="mg-card mg-v2-text-center mg-p-xl">
          <h3>로그인이 필요합니다.</h3>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="알림">
      <div className="mg-dashboard-layout">
        {/* 헤더 */}
        <div className="mg-card mg-mb-lg">
          <div className="mg-flex mg-align-center mg-gap-sm mg-mb-sm">
            <Bell className="mg-v2-color-primary" size={24} />
            <h2 className="mg-h3 mg-mb-0">알림</h2>
          </div>
          <p className="mg-v2-text-sm mg-v2-color-text-secondary mg-mb-0">
            시스템 공지와 메시지를 확인하세요.
          </p>
        </div>

        {/* 탭 */}
        <div className="mg-card mg-mb-lg">
          <div className="mg-flex mg-gap-sm">
            <button
              onClick={() => handleTabChange('system')}
              className={`mg-button ${activeTab === 'system' ? 'mg-button-primary' : 'mg-button-outline'}`}
            >
              <Bell size={16} style={{ marginRight: 'var(--spacing-xs)' }} />
              시스템 공지
            </button>
            <button
              onClick={() => handleTabChange('messages')}
              className={`mg-button ${activeTab === 'messages' ? 'mg-button-primary' : 'mg-button-outline'}`}
            >
              <MessageSquare size={16} style={{ marginRight: 'var(--spacing-xs)' }} />
              일반 메시지
            </button>
          </div>
        </div>

        {/* 로딩 */}
        {loading && <UnifiedLoading message="불러오는 중..." />}

        {/* 시스템 공지 목록 */}
        {!loading && activeTab === 'system' && (
          <div>
            {systemNotifications.length === 0 ? (
              <div className="mg-empty-state">
                <div className="mg-empty-state__icon">
                  <Bell size={48} />
                </div>
                <div className="mg-empty-state__text">시스템 공지가 없습니다</div>
              </div>
            ) : (
              <div className="mg-space-y-sm">
                {systemNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleSystemNotificationClick(notification)}
                    className="mg-card mg-cursor-pointer"
                    style={{ 
                      borderLeft: notification.isRead ? 'none' : '4px solid var(--color-primary)',
                      backgroundColor: notification.isRead ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)'
                    }}
                  >
                    <div className="mg-flex mg-gap-md">
                      <div className="mg-flex-1">
                        <div className="mg-flex mg-justify-between mg-align-start mg-mb-sm">
                          <div className="mg-flex mg-align-center mg-gap-sm mg-flex-wrap">
                            <h4 className="mg-h5 mg-mb-0" style={{ fontWeight: notification.isRead ? 'normal' : 'var(--font-weight-semibold)' }}>
                              {notification.title}
                            </h4>
                            {notification.isUrgent && (
                              <span className="mg-badge mg-badge-danger mg-v2-text-xs">긴급</span>
                            )}
                            {notification.isImportant && (
                              <span className="mg-badge mg-badge-warning mg-v2-text-xs">중요</span>
                            )}
                            <span className="mg-badge mg-badge-secondary mg-v2-text-xs">
                              {notification.targetType === 'ALL' ? '전체' :
                               notification.targetType === 'CONSULTANT' ? '상담사' : '내담자'}
                            </span>
                          </div>
                          <span className="mg-v2-text-xs mg-v2-color-text-secondary">
                            {formatDate(notification.publishedAt || notification.createdAt)}
                          </span>
                        </div>
                        <p className="mg-v2-text-sm mg-v2-color-text-secondary mg-mb-0">
                          {notification.content.length > 100
                            ? `${notification.content.substring(0, 100)}...`
                            : notification.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 일반 메시지 목록 */}
        {!loading && activeTab === 'messages' && (
          <div>
            {messages.length === 0 ? (
              <div className="mg-empty-state">
                <div className="mg-empty-state__icon">
                  <MessageSquare size={48} />
                </div>
                <div className="mg-empty-state__text">메시지가 없습니다</div>
              </div>
            ) : (
              <div className="mg-space-y-sm">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className="mg-card mg-cursor-pointer"
                    style={{ 
                      borderLeft: message.isRead ? 'none' : '4px solid var(--color-primary)',
                      backgroundColor: message.isRead ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)'
                    }}
                  >
                    <div className="mg-flex mg-gap-md">
                      <div className="mg-flex-1">
                        <div className="mg-flex mg-justify-between mg-align-start mg-mb-sm">
                          <div className="mg-flex mg-align-center mg-gap-sm mg-flex-wrap">
                            <h4 className="mg-h5 mg-mb-0" style={{ fontWeight: message.isRead ? 'normal' : 'var(--font-weight-semibold)' }}>
                              {message.title}
                            </h4>
                            <span 
                              className="mg-badge mg-v2-text-xs"
                              style={{ backgroundColor: getMessageTypeColor(message.messageType), color: 'white' }}
                            >
                              {getMessageTypeLabel(message.messageType)}
                            </span>
                            {message.isImportant && (
                              <span className="mg-badge mg-badge-warning mg-v2-text-xs">중요</span>
                            )}
                            {message.isUrgent && (
                              <span className="mg-badge mg-badge-danger mg-v2-text-xs">긴급</span>
                            )}
                          </div>
                          <span className="mg-v2-text-xs mg-v2-color-text-secondary">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className="mg-v2-text-sm mg-v2-color-text-secondary mg-mb-sm">
                          {message.content.length > 100
                            ? `${message.content.substring(0, 100)}...`
                            : message.content}
                        </p>
                        <div className="mg-v2-text-xs mg-v2-color-text-secondary">
                          {message.senderType === 'CONSULTANT' ? '발신' : '수신'} · 
                          {message.senderName || '알 수 없음'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 상세 모달 */}
        {selectedItem && (
          <div className="mg-modal-overlay" onClick={closeModal}>
            <div className="mg-modal mg-modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="mg-modal__header">
                <div>
                  <div className="mg-flex mg-align-center mg-gap-sm mg-mb-sm">
                    <h3 className="mg-h3 mg-mb-0">{selectedItem.data.title}</h3>
                    {selectedItem.data.isUrgent && (
                      <span className="mg-badge mg-badge-danger">긴급</span>
                    )}
                    {selectedItem.data.isImportant && (
                      <span className="mg-badge mg-badge-warning">중요</span>
                    )}
                  </div>
                  <div className="mg-flex mg-gap-sm mg-align-center">
                    {selectedItem.type === 'system' && (
                      <span className="mg-badge mg-badge-secondary">
                        {selectedItem.data.targetType === 'ALL' ? '전체' :
                         selectedItem.data.targetType === 'CONSULTANT' ? '상담사' : '내담자'}
                      </span>
                    )}
                    {selectedItem.type === 'message' && (
                      <span 
                        className="mg-badge"
                        style={{ backgroundColor: getMessageTypeColor(selectedItem.data.messageType), color: 'white' }}
                      >
                        {getMessageTypeLabel(selectedItem.data.messageType)}
                      </span>
                    )}
                    <span className="mg-v2-text-sm mg-v2-color-text-secondary">
                      {selectedItem.data.authorName || selectedItem.data.senderName || '관리자'} · 
                      {formatDate(selectedItem.data.publishedAt || selectedItem.data.createdAt)}
                    </span>
                  </div>
                </div>
                <button onClick={closeModal} className="mg-modal__close">
                  ×
                </button>
              </div>
              <div className="mg-modal__body">
                <div className="notification-content">
                  {selectedItem.data.content.split('\n').map((line, index) => (
                    <p key={index} className="mg-mb-sm">{line || '\u00A0'}</p>
                  ))}
                </div>
              </div>
              <div className="mg-modal__actions">
                <button onClick={closeModal} className="mg-button mg-button-primary">
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SimpleLayout>
  );
};

export default UnifiedNotifications;

