/**
 * NotificationDropdown - GNB 통합 알림 드롭다운 (Molecule)
 * 탭: 시스템 공지 | 메시지. NotificationContext 통합 카운트 사용.
 * StandardizedApi 사용. 퍼블 마크업(gnb-notification-dropdown.html) 구조 반영.
 *
 * @author CoreSolution
 * @since 2026-03-09
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { NavIcon, NotificationBadge } from '../atoms';
import { useNotification } from '../../../contexts/NotificationContext';
import { useSession } from '../../../contexts/SessionContext';
import StandardizedApi from '../../../utils/standardizedApi';
import { getConsultationMessagesListPath } from '../../../utils/consultationMessagesApi';
import { toDisplayString } from '../../../utils/safeDisplay';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import GnbDropdownPortal from './GnbDropdownPortal';
import './NotificationDropdown.css';

const NOTIFICATION_PANEL_ID = 'mg-v2-notification-panel';

const TAB_SYSTEM = 'system';
const TAB_MESSAGES = 'messages';
const LIST_SIZE = 10;

const NotificationDropdown = () => {
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
  const [selectedItem, setSelectedItem] = useState(null);

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
      const { target } = event;
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

  const fetchSystemNotifications = async() => {
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

  const fetchMessages = async() => {
    const endpoint = getConsultationMessagesListPath(user);
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

  const handleMarkAllRead = async() => {
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

  const stopNotificationItemEvent = (event) => {
    if (!event) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.nativeEvent?.stopImmediatePropagation) {
      event.nativeEvent.stopImmediatePropagation();
    }
  };

  const getSystemItemDetail = async(item) => {
    if (!item?.id) return item;
    try {
      const response = await StandardizedApi.get(`/api/v1/system-notifications/${item.id}`);
      return response?.data || response || item;
    } catch (err) {
      console.error('공지 상세 조회 실패:', err);
      return item;
    }
  };

  const getMessageItemDetail = async(item) => {
    if (!item?.id) return item;
    try {
      const response = await StandardizedApi.get(`/api/v1/consultation-messages/${item.id}`);
      return response?.data || response || item;
    } catch (err) {
      console.error('메시지 상세 조회 실패:', err);
      return item;
    }
  };

  const handleSystemItemClick = async(event, item) => {
    stopNotificationItemEvent(event);
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
    const detail = await getSystemItemDetail(item);
    setSelectedItem({ type: TAB_SYSTEM, data: detail });
    setIsOpen(false);
  };

  const handleMessageItemClick = async(event, item) => {
    stopNotificationItemEvent(event);
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
    const detail = await getMessageItemDetail(item);
    setSelectedItem({ type: TAB_MESSAGES, data: detail });
    setIsOpen(false);
  };

  const handleNotificationItemKeyDown = (event, item, type) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    stopNotificationItemEvent(event);
    if (type === TAB_SYSTEM) {
      handleSystemItemClick(event, item);
      return;
    }
    handleMessageItemClick(event, item);
  };

  const sliceContentPreview = (content) => {
    if (content == null) return '';
    const s = toDisplayString(content, '');
    return s.length > 30 ? `${s.slice(0, 30)}…` : s;
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

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const closeDetailModal = () => {
    setSelectedItem(null);
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
          icon="BELL"
          label="알림 열기"
          onClick={() => setIsOpen(!isOpen)}
          className="mg-v2-notification-trigger"
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-controls={NOTIFICATION_PANEL_ID}
        />
        <NotificationBadge count={totalUnread} />
      </div>

      <GnbDropdownPortal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        panelRef={panelRef}
        panelStyle={panelStyle}
        panelClassName="mg-v2-dropdown-panel mg-v2-notification-dropdown__panel"
        panelRole="dialog"
        panelId={NOTIFICATION_PANEL_ID}
        ariaLabel="알림 패널"
        ariaModal={false}
      >
        <div className="mg-v2-dropdown-panel__header">
          <h2 className="mg-v2-dropdown-panel__title">알림</h2>
          {totalUnread > 0 && (
            <MGButton
              type="button"
              variant="outline"
              preventDoubleClick={false}
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false, className: 'mg-v2-btn-text mg-v2-btn-sm' })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              aria-label="모두 읽음으로 표시"
              onClick={handleMarkAllRead}
            >
              모두 읽음
            </MGButton>
          )}
        </div>

        <div
          className="mg-v2-notification-dropdown__tabs"
          role="tablist"
          aria-label="알림 유형"
        >
          <MGButton
            type="button"
            variant="outline"
            preventDoubleClick={false}
            role="tab"
            id="tab-system"
            aria-selected={activeTab === TAB_SYSTEM}
            aria-controls="panel-system"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              loading: false,
              className: `mg-v2-notification-dropdown__tab ${activeTab === TAB_SYSTEM ? 'mg-v2-notification-dropdown__tab--active' : ''}`
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => setActiveTab(TAB_SYSTEM)}
          >
            시스템 공지
          </MGButton>
          <MGButton
            type="button"
            variant="outline"
            preventDoubleClick={false}
            role="tab"
            id="tab-messages"
            aria-selected={activeTab === TAB_MESSAGES}
            aria-controls="panel-messages"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              loading: false,
              className: `mg-v2-notification-dropdown__tab ${activeTab === TAB_MESSAGES ? 'mg-v2-notification-dropdown__tab--active' : ''}`
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => setActiveTab(TAB_MESSAGES)}
          >
            메시지
          </MGButton>
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
                    <MGButton
                      type="button"
                      variant="outline"
                      preventDoubleClick={false}
                      className={buildErpMgButtonClassName({
                        variant: 'outline',
                        size: 'md',
                        loading: false,
                        className: `mg-v2-notification-item ${isUnread ? 'mg-v2-notification-item--unread' : ''}`
                      })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={(event) => handleSystemItemClick(event, item)}
                      onKeyDown={(event) =>
                        handleNotificationItemKeyDown(event, item, TAB_SYSTEM)
                      }
                    >
                      {isUnread && (
                        <span
                          className="mg-v2-notification-item__unread-dot"
                          aria-hidden="true"
                        />
                      )}
                      <div className="mg-v2-notification-item__content">
                        <div className="mg-v2-notification-item__header">
                          <span className="mg-v2-notification-item__title">
                            {toDisplayString(item.title, '제목 없음')}
                          </span>
                          <span className="mg-v2-notification-item__time">
                            {formatTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="mg-v2-notification-item__message">시스템</p>
                      </div>
                    </MGButton>
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
                const sn = toDisplayString(item.senderName, '');
                const rn = toDisplayString(item.receiverName, '');
                const senderLabel =
                  sn && rn ? `${sn} → ${rn}` : sn || '메시지';
                return (
                  <li key={item.id}>
                    <MGButton
                      type="button"
                      variant="outline"
                      preventDoubleClick={false}
                      className={buildErpMgButtonClassName({
                        variant: 'outline',
                        size: 'md',
                        loading: false,
                        className: `mg-v2-notification-item ${isUnread ? 'mg-v2-notification-item--unread' : ''}`
                      })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={(event) => handleMessageItemClick(event, item)}
                      onKeyDown={(event) =>
                        handleNotificationItemKeyDown(event, item, TAB_MESSAGES)
                      }
                    >
                      {isUnread && (
                        <span
                          className="mg-v2-notification-item__unread-dot"
                          aria-hidden="true"
                        />
                      )}
                      <div className="mg-v2-notification-item__content">
                        <div className="mg-v2-notification-item__header">
                          <span className="mg-v2-notification-item__title">
                            {item.title != null && item.title !== ''
                              ? toDisplayString(item.title, '메시지')
                              : sliceContentPreview(item.content) || '메시지'}
                          </span>
                          <span className="mg-v2-notification-item__time">
                            {formatTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="mg-v2-notification-item__message mg-v2-notification-item__sender">
                          {senderLabel}
                        </p>
                      </div>
                    </MGButton>
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
      </GnbDropdownPortal>
      {selectedItem && (
        <UnifiedModal
          isOpen={!!selectedItem}
          onClose={closeDetailModal}
          title={toDisplayString(selectedItem.data?.title, '알림')}
          subtitle={`${toDisplayString(
            selectedItem.data?.authorName ||
              selectedItem.data?.senderName ||
              (selectedItem.type === TAB_MESSAGES ? '메시지' : '시스템'),
            '시스템'
          )} · ${formatDateTime(selectedItem.data?.publishedAt || selectedItem.data?.createdAt)}`}
          size="large"
          actions={
            <MGButton
              type="button"
              variant="primary"
              preventDoubleClick={false}
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={closeDetailModal}
            >
              확인
            </MGButton>
          }
        >
          <div className="mg-v2-notification-modal-content">
            <p className="mg-v2-notification-item__message">
              {toDisplayString(selectedItem.data?.content, '내용이 없습니다.')}
            </p>
          </div>
        </UnifiedModal>
      )}
    </nav>
  );
};

export default NotificationDropdown;
