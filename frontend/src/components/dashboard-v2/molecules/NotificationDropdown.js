/**
 * NotificationDropdown - GNB 통합 알림 드롭다운 (Molecule)
 * 탭: 시스템 공지 | 메시지. NotificationContext 통합 카운트 사용.
 * StandardizedApi 사용. 퍼블 마크업(gnb-notification-dropdown.html) 구조 반영.
 *
 * @author CoreSolution
 * @since 2026-03-09
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Info } from 'lucide-react';
import { NavIcon, NotificationBadge } from '../atoms';
import { useNotification } from '../../../contexts/NotificationContext';
import { useSession } from '../../../contexts/SessionContext';
import StandardizedApi from '../../../utils/standardizedApi';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import '../styles/dropdown-common.css';
import './NotificationDropdown.css';

const TAB_SYSTEM = 'system';
const TAB_MESSAGES = 'messages';
const LIST_SIZE = 10;

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const {
    unreadSystemCount,
    unreadMessageCount,
    refreshNotifications,
    loadUnreadCount,
    markSystemNotificationAsRead,
    markAllSystemNotificationsAsRead,
    markMessageAsRead
  } = useNotification();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_SYSTEM);
  const [systemList, setSystemList] = useState([]);
  const [messageList, setMessageList] = useState([]);
  const [loadingSystem, setLoadingSystem] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const panelStyle = useDropdownPosition(triggerRef, panelRef, isOpen);

  const totalUnread = (unreadSystemCount || 0) + (unreadMessageCount || 0);

  useEffect(() => {
    if (isOpen && activeTab === TAB_SYSTEM) {
      fetchSystemNotifications();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (isOpen && activeTab === TAB_MESSAGES) {
      fetchMessages();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const fetchSystemNotifications = async () => {
    try {
      setLoadingSystem(true);
      const response = await StandardizedApi.get('/api/v1/system-notifications', {
        page: 0,
        size: LIST_SIZE
      });
      const data = response?.data || response;
      const list = data?.notifications || (Array.isArray(data) ? data : []);
      setSystemList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('공지 목록 조회 실패:', err);
      setSystemList([]);
    } finally {
      setLoadingSystem(false);
    }
  };

  const getMessagesEndpoint = () => {
    if (!user?.id) return null;
    const role = String(user.role || '');
    if (role === 'CONSULTANT' || role === 'ROLE_CONSULTANT') {
      return `/api/v1/consultation-messages/consultant/${user.id}`;
    }
    if (role === 'CLIENT' || role === 'ROLE_CLIENT') {
      return `/api/v1/consultation-messages/client/${user.id}`;
    }
    if (role === 'ADMIN' || role.includes('ADMIN')) {
      return '/api/v1/consultation-messages/all';
    }
    return `/api/v1/consultation-messages/client/${user.id}`;
  };

  const fetchMessages = async () => {
    const endpoint = getMessagesEndpoint();
    if (!endpoint) {
      setMessageList([]);
      return;
    }
    try {
      setLoadingMessages(true);
      const response = await StandardizedApi.get(endpoint, { page: 0, size: LIST_SIZE });
      const data = response?.data || response;
      const list = data?.messages || data?.content || (Array.isArray(data) ? data : []);
      const arr = Array.isArray(list) ? list : [];
      setMessageList(arr.slice(0, LIST_SIZE));
    } catch (err) {
      console.error('메시지 목록 조회 실패:', err);
      setMessageList([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      if ((unreadSystemCount || 0) > 0) {
        await markAllSystemNotificationsAsRead();
      }
      const unreadMessages = messageList.filter((m) => !m.isRead);
      for (const m of unreadMessages) {
        try {
          await markMessageAsRead(m.id);
        } catch {
          // 개별 실패 시 무시
        }
      }
      refreshNotifications();
      await loadUnreadCount();
      if (isOpen && activeTab === TAB_SYSTEM) fetchSystemNotifications();
      if (isOpen && activeTab === TAB_MESSAGES) fetchMessages();
    } catch (err) {
      console.error('전체 읽음 처리 실패:', err);
    }
  };

  const handleSystemItemClick = async (item) => {
    const id = item?.id;
    if (id == null) return;

    if (!item.isRead) {
      try {
        await markSystemNotificationAsRead(id);
        refreshNotifications();
        await loadUnreadCount();
        setSystemList((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error('공지 읽음 처리 실패:', err);
      }
    }
    setIsOpen(false);
    // 시스템 공지: 읽음 처리 후 드롭다운만 닫음(통합 알림 상세 페이지로 이동하지 않음). 전체 목록은 footer 링크 이용.
  };

  const handleMessageItemClick = async (item) => {
    const mid = item?.id;
    if (mid == null) return;

    if (!item.isRead) {
      try {
        await markMessageAsRead(mid);
        refreshNotifications();
        await loadUnreadCount();
        setMessageList((prev) =>
          prev.map((m) => (m.id === mid ? { ...m, isRead: true } : m))
        );
      } catch (err) {
        console.error('메시지 읽음 처리 실패:', err);
      }
    }
    setIsOpen(false);
    navigate('/notifications', { state: { openConsultationMessageId: mid } });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <nav
      className="mg-v2-notification-dropdown"
      ref={dropdownRef}
      role="navigation"
      aria-label="알림"
    >
      <div className="mg-v2-notification-trigger-wrapper" ref={triggerRef}>
        <NavIcon
          icon={Bell}
          label="알림 열기"
          onClick={() => setIsOpen(!isOpen)}
          className="mg-v2-notification-trigger"
          aria-expanded={isOpen}
          aria-haspopup="true"
        />
        <NotificationBadge count={totalUnread} />
      </div>

      {isOpen &&
        ReactDOM.createPortal(
          <>
            <button
              type="button"
              className="mg-v2-dropdown-overlay"
              onClick={() => setIsOpen(false)}
              aria-label="드롭다운 닫기"
            />
            <div
              ref={panelRef}
              className="mg-v2-dropdown-panel mg-v2-notification-dropdown__panel"
              role="dialog"
              aria-label="알림 패널"
              aria-modal="false"
              style={panelStyle}
            >
              <div className="mg-v2-dropdown-panel__header">
                <h2 className="mg-v2-dropdown-panel__title">알림</h2>
                {totalUnread > 0 && (
                  <button
                    type="button"
                    className="mg-v2-btn-text mg-v2-btn-sm"
                    aria-label="모두 읽음으로 표시"
                    onClick={handleMarkAllRead}
                  >
                    모두 읽음
                  </button>
                )}
              </div>

              <div
                className="mg-v2-notification-dropdown__tabs"
                role="tablist"
                aria-label="알림 유형"
              >
                <button
                  type="button"
                  role="tab"
                  id="tab-system"
                  aria-selected={activeTab === TAB_SYSTEM}
                  aria-controls="panel-system"
                  className={`mg-v2-notification-dropdown__tab ${
                    activeTab === TAB_SYSTEM ? 'mg-v2-notification-dropdown__tab--active' : ''
                  }`}
                  onClick={() => setActiveTab(TAB_SYSTEM)}
                >
                  시스템 공지
                </button>
                <button
                  type="button"
                  role="tab"
                  id="tab-messages"
                  aria-selected={activeTab === TAB_MESSAGES}
                  aria-controls="panel-messages"
                  className={`mg-v2-notification-dropdown__tab ${
                    activeTab === TAB_MESSAGES ? 'mg-v2-notification-dropdown__tab--active' : ''
                  }`}
                  onClick={() => setActiveTab(TAB_MESSAGES)}
                >
                  메시지
                </button>
              </div>

              <div
                id="panel-system"
                role="tabpanel"
                aria-labelledby="tab-system"
                className="mg-v2-notification-dropdown__panel-content"
                hidden={activeTab !== TAB_SYSTEM}
              >
                <ul className="mg-v2-notification-list" aria-label="시스템 공지 목록">
                  {loadingSystem && (
                    <li>
                      <div className="mg-v2-notification-empty">로딩 중...</div>
                    </li>
                  )}
                  {!loadingSystem && systemList.length === 0 && (
                    <li>
                      <div className="mg-v2-notification-empty">새로운 공지가 없습니다</div>
                    </li>
                  )}
                  {!loadingSystem &&
                    systemList.map((item) => {
                      const isUnread = !item.isRead;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={`mg-v2-notification-item ${
                              isUnread ? 'mg-v2-notification-item--unread' : ''
                            }`}
                            onClick={() => handleSystemItemClick(item)}
                          >
                            {isUnread && (
                              <span
                                className="mg-v2-notification-item__unread-dot"
                                aria-hidden="true"
                              />
                            )}
                            <div
                              className="mg-v2-notification-item__icon"
                              aria-hidden="true"
                            >
                              <Info size={16} />
                            </div>
                            <div className="mg-v2-notification-item__content">
                              <div className="mg-v2-notification-item__header">
                                <span className="mg-v2-notification-item__title">
                                  {item.title || '제목 없음'}
                                </span>
                                <span className="mg-v2-notification-item__time">
                                  {formatTime(item.createdAt)}
                                </span>
                              </div>
                              <p className="mg-v2-notification-item__message">시스템</p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>

              <div
                id="panel-messages"
                role="tabpanel"
                aria-labelledby="tab-messages"
                className="mg-v2-notification-dropdown__panel-content"
                hidden={activeTab !== TAB_MESSAGES}
              >
                <ul className="mg-v2-notification-list" aria-label="메시지 목록">
                  {loadingMessages && (
                    <li>
                      <div className="mg-v2-notification-empty">로딩 중...</div>
                    </li>
                  )}
                  {!loadingMessages && messageList.length === 0 && (
                    <li>
                      <div className="mg-v2-notification-empty">새로운 메시지가 없습니다</div>
                    </li>
                  )}
                  {!loadingMessages &&
                    messageList.map((item) => {
                      const isUnread = !item.isRead;
                      const senderLabel =
                        item.senderName && item.receiverName
                          ? `${item.senderName} → ${item.receiverName}`
                          : item.senderName || '메시지';
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={`mg-v2-notification-item ${
                              isUnread ? 'mg-v2-notification-item--unread' : ''
                            }`}
                            onClick={() => handleMessageItemClick(item)}
                          >
                            {isUnread && (
                              <span
                                className="mg-v2-notification-item__unread-dot"
                                aria-hidden="true"
                              />
                            )}
                            <div
                              className="mg-v2-notification-item__icon"
                              aria-hidden="true"
                            >
                              <MessageSquare size={16} />
                            </div>
                            <div className="mg-v2-notification-item__content">
                              <div className="mg-v2-notification-item__header">
                                <span className="mg-v2-notification-item__title">
                                  {item.title || item.content?.slice(0, 30) || '메시지'}
                                </span>
                                <span className="mg-v2-notification-item__time">
                                  {formatTime(item.createdAt)}
                                </span>
                              </div>
                              <p className="mg-v2-notification-item__message mg-v2-notification-item__sender">
                                {senderLabel}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>

              <div className="mg-v2-dropdown-panel__footer">
                <Link
                  to="/notifications"
                  className="mg-v2-dropdown-panel__footer-link"
                  onClick={() => setIsOpen(false)}
                >
                  알림 전체 보기
                </Link>
              </div>
            </div>
          </>,
          document.body
        )}
    </nav>
  );
};

export default NotificationDropdown;
