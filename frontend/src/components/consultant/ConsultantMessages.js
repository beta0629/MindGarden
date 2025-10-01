import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost } from '../../utils/ajax';
import LoadingSpinner from '../common/LoadingSpinner';
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
    { value: 'GENERAL', label: '일반', icon: '💬', color: '#6c757d' },
    { value: 'FOLLOW_UP', label: '후속 조치', icon: '📋', color: '#007bff' },
    { value: 'HOMEWORK', label: '과제 안내', icon: '📝', color: '#28a745' },
    { value: 'REMINDER', label: '알림', icon: '🔔', color: '#ffc107' },
    { value: 'URGENT', label: '긴급', icon: '⚠️', color: '#dc3545' }
  ];

  // 데이터 로드
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadMessages();
      loadClients();
    }
  }, [isLoggedIn, user?.id]);

  const loadMessages = async () => {
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
  };

  const loadClients = async () => {
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
  };

  // 메시지 필터링
  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || message.messageType === filterStatus;
    
    return matchesSearch && matchesStatus;
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
  const handleMessageClick = (message) => {
    setSelectedMessage(message);
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
        <LoadingSpinner text="세션 정보를 불러오는 중..." size="medium" />
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
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                color: '#2c3e50',
                fontWeight: '500'
              }}
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
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '2px solid #3498db',
              background: '#3498db',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#2980b9';
              e.target.style.borderColor = '#2980b9';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#3498db';
              e.target.style.borderColor = '#3498db';
            }}
          >
            <i className="bi bi-plus"></i>
            새 메시지
          </button>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
            <LoadingSpinner text="메시지 목록을 불러오는 중..." size="medium" />
            <p style={{ marginTop: '15px', color: '#7f8c8d', fontSize: '1.1rem' }}>잠시만 기다려주세요...</p>
          </div>
        )}

        {/* 메시지 목록 */}
        {!loading && (
          <div>
            {filteredMessages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center', color: '#7f8c8d' }}>
                <i className="bi bi-chat-dots" style={{ fontSize: '4rem', marginBottom: '20px', opacity: '0.5' }}></i>
                <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>
                  {messages.length === 0 ? "전송된 메시지가 없습니다" : "검색 결과가 없습니다"}
                </h3>
                <p style={{ margin: '0', fontSize: '1.1rem' }}>
                  {messages.length === 0 ? "아직 전송한 메시지가 없습니다." : "다른 검색어를 사용해보세요."}
                </p>
                {messages.length === 0 && (
                  <button 
                    onClick={() => setShowSendModal(true)}
                    style={{
                      marginTop: '15px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #3498db',
                      background: 'transparent',
                      color: '#3498db',
                      cursor: 'pointer'
                    }}
                  >
                    첫 메시지 보내기
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                {filteredMessages.map((message) => {
                  const typeInfo = getMessageTypeInfo(message.messageType);
                  
                  return (
                    <div
                      key={message.id}
                      onClick={() => handleMessageClick(message)}
                      style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
                        border: '1px solid #e9ecef',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.08)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            backgroundColor: typeInfo.color + '20',
                            color: typeInfo.color,
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}>
                            {typeInfo.icon} {typeInfo.label}
                          </span>
                          {message.isImportant && (
                            <span style={{ color: '#ffc107', fontSize: '1.2rem' }}>⭐</span>
                          )}
                          {message.isUrgent && (
                            <span style={{ color: '#dc3545', fontSize: '1.2rem' }}>🚨</span>
                          )}
                        </div>
                        <span style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      
                      <h4 style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '600', 
                        color: '#2c3e50', 
                        marginBottom: '8px',
                        marginTop: '0'
                      }}>
                        {message.title}
                      </h4>
                      
                      <p style={{ 
                        color: '#6c757d', 
                        fontSize: '0.9rem', 
                        marginBottom: '10px',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {message.content}
                      </p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#3498db', fontSize: '0.85rem', fontWeight: '500' }}>
                          받는 사람: {message.clientName || '알 수 없음'}
                        </span>
                        <span style={{ 
                          color: message.isRead ? '#28a745' : '#6c757d', 
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <i className={`bi bi-${message.isRead ? 'check-circle' : 'circle'}`}></i>
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
        {showSendModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '15px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '25px 30px 20px',
                borderBottom: '1px solid #e9ecef',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderRadius: '15px 15px 0 0'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#2c3e50',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <i className="bi bi-chat-dots" style={{ color: '#3498db' }}></i>
                  새 메시지 작성
                </h3>
                <button
                  onClick={() => setShowSendModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    color: '#6c757d',
                    cursor: 'pointer',
                    padding: '5px',
                    borderRadius: '50%',
                    width: '35px',
                    height: '35px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#e9ecef';
                    e.target.style.color = '#2c3e50';
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{ padding: '30px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.95rem', marginBottom: '8px', display: 'block' }}>
                      받는 사람 *
                    </label>
                    <select
                      value={newMessage.clientId}
                      onChange={(e) => setNewMessage({ ...newMessage, clientId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: '2px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        background: '#fff'
                      }}
                    >
                      <option value="">내담자를 선택하세요</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name} ({client.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.95rem', marginBottom: '8px', display: 'block' }}>
                      메시지 유형
                    </label>
                    <select
                      value={newMessage.messageType}
                      onChange={(e) => setNewMessage({ ...newMessage, messageType: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: '2px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        background: '#fff'
                      }}
                    >
                      {messageTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.95rem', marginBottom: '8px', display: 'block' }}>
                      제목 *
                    </label>
                    <input
                      type="text"
                      value={newMessage.title}
                      onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                      placeholder="메시지 제목을 입력하세요"
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: '2px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        background: '#fff'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.95rem', marginBottom: '8px', display: 'block' }}>
                      내용 *
                    </label>
                    <textarea
                      value={newMessage.content}
                      onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                      placeholder="메시지 내용을 입력하세요"
                      rows={6}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: '2px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        background: '#fff',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={newMessage.isImportant}
                        onChange={(e) => setNewMessage({ ...newMessage, isImportant: e.target.checked })}
                      />
                      <span style={{ fontSize: '0.9rem', color: '#2c3e50', whiteSpace: 'nowrap' }}>중요</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={newMessage.isUrgent}
                        onChange={(e) => setNewMessage({ ...newMessage, isUrgent: e.target.checked })}
                      />
                      <span style={{ fontSize: '0.9rem', color: '#2c3e50', whiteSpace: 'nowrap' }}>긴급</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '15px',
                padding: '20px 30px 30px',
                borderTop: '1px solid #e9ecef',
                background: '#f8f9fa',
                borderRadius: '0 0 15px 15px'
              }}>
                <button
                  onClick={() => setShowSendModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    background: '#6c757d',
                    color: '#fff'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleSendMessage}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    background: '#3498db',
                    color: '#fff'
                  }}
                >
                  <i className="bi bi-send"></i>
                  전송
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SimpleLayout>
  );
};

export default ConsultantMessages;
