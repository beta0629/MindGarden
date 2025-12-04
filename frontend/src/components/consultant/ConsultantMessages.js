import React, { useState, useEffect, useCallback } from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { useNotification } from '../../contexts/NotificationContext';
import { apiGet, apiPost } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import './ConsultantMessages.css';

/**
 * 상담사 메시지 관리 페이지
 * 내담자들과의 메시지 목록을 확인하고 새 메시지를 전송할 수 있는 화면
 */
const ConsultantMessages = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const { markMessageAsRead } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // 새 메시지 작성 폼
  const [newMessage, setNewMessage] = useState({
    clientId: '',
    title: '',
    content: '',
    messageType: 'GENERAL',
    isImportant: false,
    isUrgent: false
  });

  // 메시지 유형 옵션
  const messageTypes = [
    { value: 'GENERAL', label: '일반', icon: '💬', color: 'var(--mg-secondary-500)' },
    { value: 'FOLLOW_UP', label: '후속 조치', icon: '📋', color: 'var(--mg-primary-500)' },
    { value: 'HOMEWORK', label: '과제 안내', icon: '📝', color: 'var(--mg-success-500)' },
    { value: 'REMINDER', label: '알림', icon: '🔔', color: 'var(--mg-warning-500)' },
    { value: 'URGENT', label: '긴급', icon: '⚠️', color: 'var(--mg-error-500)' }
  ];

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📨 상담사 메시지 목록 로드:', user.id);
      
      const response = await apiGet(`/api/consultation-messages/consultant/${user.id}`);
      
      if (response.success) {
        console.log('✅ 메시지 목록 로드 성공:', response.data);
        setMessages(response.data || []);
      } else {
        console.error('❌ 메시지 목록 로드 실패:', response.message);
        notificationManager.show(response.message || '메시지 목록을 불러오는데 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error('❌ 메시지 로드 중 오류:', err);
      notificationManager.show('메시지를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadClients = useCallback(async () => {
    try {
      console.log('👥 연계된 내담자 목록 로드:', user.id);
      
      const response = await apiGet(`/api/admin/mappings/consultant/${user.id}/clients`);
      
      if (response.success) {
        console.log('✅ 내담자 목록 로드 성공:', response.data);
        const clientData = response.data || [];
        const clients = clientData.map(item => item.client).filter(client => client);
        setClients(clients);
      } else {
        console.error('❌ 내담자 목록 로드 실패:', response.message);
      }
    } catch (err) {
      console.error('❌ 내담자 로드 중 오류:', err);
    }
  }, [user?.id]);

  // 데이터 로드
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadMessages();
      loadClients();
    }
  }, [isLoggedIn, user?.id, loadMessages, loadClients]);

  // 메시지 필터링
  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || message.messageType === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // 내담자별로 메시지 그룹화
  const groupedMessages = filteredMessages.reduce((groups, message) => {
    const clientId = message.clientId || 'unknown';
    const clientName = message.clientName || '알 수 없음';
    
    if (!groups[clientId]) {
      groups[clientId] = {
        clientId,
        clientName,
        messages: [],
        unreadCount: 0
      };
    }
    
    groups[clientId].messages.push(message);
    if (!message.isRead) {
      groups[clientId].unreadCount += 1;
    }
    
    return groups;
  }, {});

  // 객체를 배열로 변환하고 읽지 않은 메시지가 많은 순으로 정렬
  const clientGroups = Object.values(groupedMessages).sort((a, b) => {
    if (b.unreadCount !== a.unreadCount) {
      return b.unreadCount - a.unreadCount; // 읽지 않은 메시지 많은 순
    }
    return a.clientName.localeCompare(b.clientName, 'ko-KR'); // 이름 가나다순
  });

  // 메시지 전송
  const handleSendMessage = async () => {
    try {
      if (!newMessage.clientId || !newMessage.title || !newMessage.content) {
        notificationManager.show('모든 필드를 입력해주세요.', 'warning');
        return;
      }

      const response = await apiPost('/api/consultation-messages', {
        ...newMessage,
        consultantId: user.id
      });

      if (response.success) {
        notificationManager.show('메시지가 전송되었습니다.', 'success');
        setShowSendModal(false);
        setNewMessage({
          clientId: '',
          title: '',
          content: '',
          messageType: 'GENERAL',
          isImportant: false,
          isUrgent: false
        });
        loadMessages();
      } else {
        throw new Error(response.message || '메시지 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      notificationManager.show('메시지 전송 중 오류가 발생했습니다.', 'error');
    }
  };

  // 메시지 상세 보기
  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    
    // 읽지 않은 메시지인 경우 읽음 처리
    if (!message.isRead) {
      await markMessageAsRead(message.id);
      // 로컬 메시지 목록 업데이트
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === message.id ? { ...msg, isRead: true } : msg
        )
      );
    }
  };

  // 메시지 유형 정보 가져오기
  const getMessageTypeInfo = (messageType) => {
    return messageTypes.find(type => type.value === messageType) || messageTypes[0];
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '날짜 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (sessionLoading) {
    return (
      <SimpleLayout title="메시지 관리">
        <UnifiedLoading 
          type="page"
          text="세션 정보를 불러오는 중..."
          variant="pulse"
        />
      </SimpleLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <SimpleLayout title="메시지 관리">
        <div className="consultant-messages-login-required">
          <h3>로그인이 필요합니다.</h3>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="메시지 관리">
      <div className="consultant-messages-container">
        {/* 헤더 */}
        <div className="consultant-messages-header">
          <h1 className="consultant-messages-title">
            <i className="bi bi-chat-dots consultant-messages-icon"></i>
            메시지 관리
          </h1>
          <p className="consultant-messages-subtitle">
            내담자들과의 메시지를 관리할 수 있습니다.
          </p>
        </div>

        {/* 검색 및 필터 */}
        <div className="consultant-messages-search-container">
          <div className="consultant-messages-search-field">
            <div className="consultant-messages-search-input-container">
              <i className="bi bi-search consultant-messages-search-icon"></i>
              <input
                type="text"
                placeholder="제목, 내용, 내담자명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="consultant-messages-search-input"
              />
            </div>
          </div>
          
          <div className="consultant-messages-filter-container">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="consultant-messages-filter-select"
            >
              <option value="ALL">전체 유형</option>
              {messageTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowSendModal(true)}
            className="mg-v2-button mg-v2-button-primary"
          >
            새 메시지
          </button>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <UnifiedLoading 
            type="page"
            text="메시지를 불러오는 중..."
            variant="pulse"
          />
        )}

        {/* 메시지 목록 */}
        {!loading && (
          <div>
            {filteredMessages.length === 0 ? (
              <div className="consultant-messages-empty">
                <i className="bi bi-chat-dots consultant-messages-empty-icon"></i>
                <h3 className="consultant-messages-empty-title">
                  {messages.length === 0 ? "전송된 메시지가 없습니다" : "검색 결과가 없습니다"}
                </h3>
                <p className="consultant-messages-empty-description">
                  {messages.length === 0 ? "아직 전송한 메시지가 없습니다." : "다른 검색어를 사용해보세요."}
                </p>
                {messages.length === 0 && (
                  <button 
                    onClick={() => setShowSendModal(true)}
                    className="consultant-messages-empty-btn"
                  >
                    첫 메시지 보내기
                  </button>
                )}
              </div>
            ) : (
              <div className="mg-grid mg-grid-cols-3 mg-gap-md">
                {filteredMessages.map((message) => {
                  const typeInfo = getMessageTypeInfo(message.messageType);
                  
                  return (
                    <div
                      key={message.id}
                      onClick={() => handleMessageClick(message)}
                      className="mg-v2-card mg-cursor-pointer"
                    >
                      <div className="mg-flex mg-justify-between mg-align-center mg-mb-md">
                        <div className="mg-flex mg-align-center mg-gap-sm">
                          <span className={`mg-badge mg-badge-${typeInfo.value === 'GENERAL' ? 'secondary' : typeInfo.value === 'FOLLOW_UP' ? 'primary' : typeInfo.value === 'HOMEWORK' ? 'success' : typeInfo.value === 'REMINDER' ? 'warning' : 'danger'}`}>
                            {typeInfo.label}
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
                      
                      <h4 className="mg-h5 mg-mb-sm mg-v2-text-center">
                        {message.title}
                      </h4>
                      
                      <p className="mg-v2-text-sm mg-v2-color-text-secondary mg-mb-md">
                        {message.content.substring(0, 100)}{message.content.length > 100 && '...'}
                      </p>
                      
                      <div className="mg-flex mg-justify-between mg-align-center mg-pt-md mg-border-top">
                        <span className="mg-v2-text-sm mg-v2-color-text-secondary">
                          받는 사람: {message.clientName || '알 수 없음'}
                        </span>
                        <span className={`mg-badge ${message.isRead ? 'mg-badge-success' : 'mg-badge-secondary'} mg-v2-text-xs`}>
                          {message.isRead ? '읽음' : '안읽음'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 새 메시지 작성 모달 */}
        {showSendModal && ReactDOM.createPortal(
          <div className="mg-v2-modal-overlay" onClick={() => setShowSendModal(false)}>
            <div className="mg-v2-modal mg-v2-modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="mg-v2-modal-header">
                <h3 className="mg-h3 mg-mb-0">새 메시지 작성</h3>
                <button
                  className="mg-v2-modal-close"
                  onClick={() => setShowSendModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="mg-v2-modal-body">
                <div className="mg-v2-form-group">
                  <label className="mg-v2-label">받는 사람 *</label>
                  <select
                    className="mg-v2-select"
                    value={newMessage.clientId}
                    onChange={(e) => setNewMessage({ ...newMessage, clientId: e.target.value })}
                  >
                    <option key="default-client" value="">내담자를 선택하세요</option>
                    {clients.map((client, index) => (
                      <option key={`client-${client.id}-${index}`} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mg-v2-form-group">
                  <label className="mg-v2-label">메시지 유형</label>
                  <select
                    className="mg-v2-select"
                    value={newMessage.messageType}
                    onChange={(e) => setNewMessage({ ...newMessage, messageType: e.target.value })}
                  >
                    {messageTypes.map((type, index) => (
                      <option key={`message-type-${type.value}-${index}`} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mg-v2-form-group">
                  <label className="mg-v2-label">제목 *</label>
                  <input
                    type="text"
                    className="mg-v2-input"
                    value={newMessage.title}
                    onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                    placeholder="메시지 제목을 입력하세요"
                  />
                </div>
                
                <div className="mg-v2-form-group">
                  <label className="mg-v2-label">내용 *</label>
                  <textarea
                    className="mg-v2-textarea"
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                    placeholder="메시지 내용을 입력하세요"
                    rows={6}
                  />
                </div>
                
                <div className="mg-flex mg-gap-md">
                  <label className="mg-checkbox">
                    <input
                      type="checkbox"
                      checked={newMessage.isImportant}
                      onChange={(e) => setNewMessage({ ...newMessage, isImportant: e.target.checked })}
                    />
                    <span>중요</span>
                  </label>
                  <label className="mg-checkbox">
                    <input
                      type="checkbox"
                      checked={newMessage.isUrgent}
                      onChange={(e) => setNewMessage({ ...newMessage, isUrgent: e.target.checked })}
                    />
                    <span>긴급</span>
                  </label>
                </div>
              </div>
              
              <div className="mg-v2-modal-footer">
                <button
                  className="mg-v2-button mg-v2-button-secondary"
                  onClick={() => setShowSendModal(false)}
                >
                  취소
                </button>
                <button
                  className="mg-v2-button mg-v2-button-primary"
                  onClick={handleSendMessage}
                >
                  전송
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </SimpleLayout>
  );
};

export default ConsultantMessages;
