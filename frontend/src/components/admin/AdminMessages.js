import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { useNotification } from '../../contexts/NotificationContext';
import { apiGet } from '../../utils/ajax';
import { MessageSquare, Search, Filter, Users, User } from 'lucide-react';
import UnifiedLoading from "../common/UnifiedLoading";
import MGButton from "../common/MGButton";
import notificationManager from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import '../../styles/mindgarden-design-system.css';

/**
 * 관리자 메시지 관리 페이지
 * 모든 상담사-내담자 메시지를 조회하고 관리할 수 있는 화면
 */
const AdminMessages = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const { unreadCount } = useNotification(); // loadUnreadMessageCount는 이벤트 기반으로 처리
  
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // 메시지 유형 옵션
  const MESSAGE_TYPES = {
    ALL: { label: '전체', color: 'var(--color-text-secondary)' },
    GENERAL: { label: '일반', color: 'var(--color-info)' },
    FOLLOW_UP: { label: '후속 조치', color: 'var(--color-primary)' },
    HOMEWORK: { label: '과제 안내', color: 'var(--color-success)' },
    REMINDER: { label: '알림', color: 'var(--color-warning)' },
    URGENT: { label: '긴급', color: 'var(--color-danger)' }
  };

  // 데이터 로드
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadMessages();
    }
  }, [isLoggedIn, user?.id]);

  const loadMessages = async() => {
    try {
      setLoading(true);
      console.log('📨 관리자 메시지 목록 로드');
      
      // 관리자는 모든 메시지 조회
      const response = await apiGet('/api/consultation-messages/all');
      
      if (response.success) {
        console.log('✅ 메시지 목록 로드 성공:', response.data);
        setMessages(response.data || []);
      } else {
        console.error('❌ 메시지 목록 로드 실패:', response.message);
        notificationManager.error(response.message || '메시지 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 메시지 로드 중 오류:', err);
      notificationManager.error('메시지를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 메시지 필터링
  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.receiverName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'ALL' || message.messageType === filterType;
    const matchesStatus = filterStatus === 'ALL' || 
                         (filterStatus === 'UNREAD' && !message.isRead) ||
                         (filterStatus === 'READ' && message.isRead);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // 메시지 상세 보기
  const handleMessageClick = async(message) => {
    try {
      // 상세 조회 API 호출 (자동 읽음 처리)
      const response = await apiGet(`/api/consultation-messages/${message.id}`);
      
      if (response.success) {
        setSelectedMessage(response.data);
      } else {
        // 실패 시 기존 데이터 사용
        setSelectedMessage(message);
      }
    } catch (error) {
      console.error('메시지 상세 조회 오류:', error);
      // 오류 시 기존 데이터 사용
      setSelectedMessage(message);
    }
  };

  // 모달 닫기
  const closeModal = async() => {
    setSelectedMessage(null);
    
    // 목록 새로고침 (읽음 상태 반영)
    await loadMessages();
    // 메시지 읽음 이벤트 발생 (NotificationContext가 카운트 갱신)
    window.dispatchEvent(new Event('message-read'));
  };

  // 메시지 유형별 색상
  const getMessageTypeColor = (type) => {
    return MESSAGE_TYPES[type]?.color || MESSAGE_TYPES.GENERAL.color;
  };

  // 로딩 상태
  if (sessionLoading || loading) {
    return (
      <SimpleLayout>
        <div className="mg-v2-dashboard-layout">
          <UnifiedLoading text="메시지를 불러오는 중..." />
        </div>
      </SimpleLayout>
    );
  }

  // 권한 체크
  if (!isLoggedIn || !user) {
    return (
      <SimpleLayout>
        <div className="mg-v2-dashboard-layout">
          <div className="mg-v2-card">
            <h3>로그인이 필요합니다</h3>
            <p>메시지를 확인하려면 로그인해주세요.</p>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="mg-v2-dashboard-layout">
        {/* 헤더 */}
        <div className="mg-v2-dashboard-header">
          <div className="mg-v2-dashboard-header-content">
            <div className="mg-v2-dashboard-header-left">
              <MessageSquare />
              <div>
                <h1 className="mg-v2-dashboard-title">메시지 관리</h1>
                <p className="mg-v2-dashboard-subtitle">
                  전체 메시지 {messages.length}개 
                  {unreadCount > 0 && ` · 읽지 않음 ${unreadCount}개`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="mg-v2-card mg-v2-message-filters-card mg-mobile-section">
          <div className="mg-v2-message-filters-container mg-mobile-form-group">
            {/* 검색 */}
            <div className="mg-v2-message-search-container">
              <Search 
                size={20} 
                className="mg-v2-message-search-icon" 
              />
              <input
                type="text"
                className="mg-v2-input mg-v2-message-search-input"
                placeholder="제목, 내용, 발신자, 수신자로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* 유형 필터 */}
            <select
              className="mg-v2-select mg-v2-message-type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {Object.entries(MESSAGE_TYPES).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* 상태 필터 */}
            <select
              className="mg-v2-select mg-v2-message-status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">전체 상태</option>
              <option value="UNREAD">읽지 않음</option>
              <option value="READ">읽음</option>
            </select>
          </div>
        </div>

        {/* 메시지 목록 */}
        <div className="mg-v2-card">
          {filteredMessages.length === 0 ? (
            <div className="mg-v2-message-empty-state">
              <MessageSquare size={48} className="mg-v2-message-empty-icon" />
              <p>메시지가 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 데스크탑 테이블 */}
              <div className="mg-v2-table-container mg-desktop-only mg-mobile-table">
                <table className="mg-v2-table">
                  <thead>
                    <tr>
                      <th>상태</th>
                      <th>유형</th>
                      <th>제목</th>
                      <th>발신자</th>
                      <th>수신자</th>
                      <th>날짜</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMessages.map((message) => (
                      <tr 
                        key={message.id}
                        onClick={() => handleMessageClick(message)}
                        className={`mg-v2-message-row-clickable ${!message.isRead ? 'mg-v2-table-row-unread' : ''}`}
                      >
                        <td>
                          <span className={`mg-v2-badge ${!message.isRead ? 'mg-v2-badge-primary' : 'mg-v2-badge-secondary'}`}>
                            {!message.isRead ? '읽지 않음' : '읽음'}
                          </span>
                        </td>
                        <td>
                          <div className="mg-v2-message-badge-container">
                            <span 
                              className="mg-v2-badge mg-v2-message-badge"
                            >
                              {MESSAGE_TYPES[message.messageType]?.label || '일반'}
                            </span>
                            {message.isImportant && (
                              <span className="mg-v2-badge mg-v2-badge-warning">중요</span>
                            )}
                            {message.isUrgent && (
                              <span className="mg-v2-badge mg-v2-badge-danger">긴급</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={`mg-v2-message-title ${!message.isRead ? 'mg-v2-message-title-unread' : ''}`}>
                            {message.title}
                          </div>
                        </td>
                        <td>
                          <div className="mg-v2-message-sender-container">
                            <User size={16} />
                            {message.senderName}
                          </div>
                        </td>
                        <td>
                          <div className="mg-v2-message-receiver-container">
                            <Users size={16} />
                            {message.receiverName}
                          </div>
                        </td>
                        <td>
                          {new Date(message.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 모바일 카드 리스트 */}
              <div className="mg-mobile-only mg-v2-message-mobile-list mg-mobile-card-stack">
                {filteredMessages.map((message) => (
                  <div 
                    key={message.id}
                    className={`mg-v2-card mg-v2-message-mobile-card ${!message.isRead ? 'mg-v2-message-mobile-card-unread' : ''}`}
                  >
                    {/* 상단: 상태 + 유형 배지 */}
                    <div className="mg-v2-message-mobile-header">
                      <span className={`mg-v2-badge ${!message.isRead ? 'mg-v2-badge-primary' : 'mg-v2-badge-secondary'}`}>
                        {!message.isRead ? '읽지 않음' : '읽음'}
                      </span>
                      <span 
                        className="mg-v2-badge mg-v2-message-badge"
                      >
                        {MESSAGE_TYPES[message.messageType]?.label || '일반'}
                      </span>
                      {message.isImportant && (
                        <span className="mg-v2-badge mg-v2-badge-warning">중요</span>
                      )}
                      {message.isUrgent && (
                        <span className="mg-v2-badge mg-v2-badge-danger">긴급</span>
                      )}
                    </div>

                    {/* 제목 */}
                    <div className={`mg-v2-message-mobile-title ${!message.isRead ? 'mg-v2-message-mobile-title-unread' : ''}`}>
                      {message.title}
                    </div>

                    {/* 발신자/수신자 */}
                    <div className="mg-v2-message-mobile-participants">
                      <div className="mg-v2-message-mobile-participant">
                        <User size={14} />
                        <span>발신: {message.senderName}</span>
                      </div>
                      <div className="mg-v2-message-mobile-participant">
                        <Users size={14} />
                        <span>수신: {message.receiverName}</span>
                      </div>
                    </div>

                    {/* 날짜 */}
                    <div className="mg-v2-message-mobile-date">
                      {new Date(message.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 메시지 상세 모달 */}
        {selectedMessage && (
          <div className="mg-v2-modal-overlay" onClick={closeModal}>
            <div className="mg-v2-modal mg-v2-modal--medium" onClick={(e) => e.stopPropagation()}>
              <div className="mg-v2-modal__header">
                <h2 className="mg-v2-modal__title">{selectedMessage.title}</h2>
                <MGButton 
                  variant="outline"
                  size="small"
                  onClick={closeModal}
                  aria-label="닫기"
                >
                  ×
                </MGButton>
              </div>
              <div className="mg-v2-modal__body">
                <div className="mg-v2-message-modal-content">
                  <div className="mg-v2-message-modal-header">
                    <span 
                      className="mg-v2-badge mg-v2-message-badge"
                    >
                      {MESSAGE_TYPES[selectedMessage.messageType]?.label || '일반'}
                    </span>
                    {selectedMessage.isImportant && (
                      <span className="mg-v2-badge mg-v2-badge-warning">중요</span>
                    )}
                    {selectedMessage.isUrgent && (
                      <span className="mg-v2-badge mg-v2-badge-danger">긴급</span>
                    )}
                  </div>
                  <div className="mg-v2-message-modal-info-grid">
                    <div>
                      <strong>발신자:</strong> {selectedMessage.senderName}
                    </div>
                    <div>
                      <strong>수신자:</strong> {selectedMessage.receiverName}
                    </div>
                    <div>
                      <strong>발송일:</strong> {new Date(selectedMessage.createdAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                </div>
                <div className="mg-v2-message-modal-body">
                  {selectedMessage.content}
                </div>
              </div>
              <div className="mg-v2-modal__actions">
                <MGButton 
                  variant="outline"
                  onClick={closeModal}
                >
                  닫기
                </MGButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </SimpleLayout>
  );
};

export default AdminMessages;

