/**
 * NotificationCenter — 알림 센터 컴포넌트
 *
 * 타입별 아이콘, 읽음/미읽음, 타입 필터, 시간 그룹핑, 스와이프 삭제 지원.
 * 상담사·내담자 공통 사용.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar, CreditCard, MessageCircle, Bell, Heart, Trash2
} from 'lucide-react';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import SegmentedTabs from './SegmentedTabs';
import './NotificationCenter.css';
import i18n from '../../i18n';
import { useTranslation } from 'react-i18next';

const API_ENDPOINT = '/api/v1/system-notifications';

const FILTER_TYPES = [
  { key: 'ALL', label: '전체' },
  { key: 'SCHEDULE', label: '예약' },
  { key: 'PAYMENT', label: '결제' },
  { key: 'MESSAGE', label: '메시지' },
  { key: 'SYSTEM', label: '시스템' },
  { key: 'WELLNESS', label: '웰니스' }
];

const TYPE_ICON_MAP = {
  SCHEDULE: { Icon: Calendar, className: 'mg-notif-center__icon--schedule' },
  BOOKING: { Icon: Calendar, className: 'mg-notif-center__icon--schedule' },
  PAYMENT: { Icon: CreditCard, className: 'mg-notif-center__icon--payment' },
  MESSAGE: { Icon: MessageCircle, className: 'mg-notif-center__icon--message' },
  SYSTEM: { Icon: Bell, className: 'mg-notif-center__icon--system' },
  WELLNESS: { Icon: Heart, className: 'mg-notif-center__icon--wellness' }
};

const SKELETON_COUNT = 6;
const EMPTY_TITLE = '알림이 없습니다';
const EMPTY_DESC = '새 알림이 도착하면 여기에 표시됩니다';
const SWIPE_THRESHOLD = 60;

const getTimeGroup = (dateString) => {
  if (!dateString) return i18n.t('common:common.NotificationCenter.t_dc03452e');
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffDay === 0 && date.toDateString() === now.toDateString()) return i18n.t('common:common.NotificationCenter.t_2bdce5e8');
  if (diffDay <= 1) return i18n.t('common:common.NotificationCenter.t_476b58b7');
  if (diffDay <= 7) return i18n.t('common:common.NotificationCenter.t_1b9a365a');
  return i18n.t('common:common.NotificationCenter.t_dc03452e');
};

const formatNotifTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return i18n.t('common:common.NotificationCenter.t_aec5ef39');
  if (diffMin < 60) return i18n.t('common:common.NotificationCenter.t_96b0d060');
  if (diffHour < 24) return i18n.t('common:common.NotificationCenter.t_310782ab');

  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const NotificationCenter = ({
  currentUserId,
  themeVariant = 'client'
}) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const themeStyle = {
    '--mg-chat-primary': themeVariant === 'consultant'
      ? 'var(--mg-consultant-primary)'
      : 'var(--mg-client-primary)',
    '--mg-chat-bg': themeVariant === 'consultant'
      ? 'var(--mg-consultant-bg-main)'
      : 'var(--mg-client-bg-main)'
  };

  const loadNotifications = useCallback(async() => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const response = await TenantAwareApiClient.get(API_ENDPOINT, {
        userId: currentUserId,
        page: 0,
        size: 100,
        sort: 'createdAt,desc'
      });

      let data = [];
      if (response?.success && response.data) {
        data = Array.isArray(response.data)
          ? response.data
          : response.data.notifications || response.data.content || [];
      } else if (Array.isArray(response)) {
        data = response;
      }
      setNotifications(data);
    } catch (error) {
      console.error('알림 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async(notifId) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === notifId ? { ...n, isRead: true } : n)
    );
    try {
      await TenantAwareApiClient.post(`${API_ENDPOINT}/${notifId}/read`);
    } catch (error) {
      console.error('읽음 처리 실패:', error);
    }
  };

  const deleteNotification = async(notifId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    try {
      await TenantAwareApiClient.delete(`${API_ENDPOINT}/${notifId}`);
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  };

  const handleCardClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
  };

  const filteredNotifications = activeFilter === 'ALL'
    ? notifications
    : notifications.filter((n) => {
        const type = (n.type || n.notificationType || '').toUpperCase();
        return type === activeFilter || type.includes(activeFilter);
      });

  const groupedNotifications = () => {
    const groups = { '오늘': [], '어제': [], '이번주': [], '이전': [] };
    filteredNotifications.forEach((notif) => {
      const group = getTimeGroup(notif.createdAt);
      groups[group].push(notif);
    });
    return groups;
  };

  const getTypeIcon = (notif) => {
    const type = (notif.type || notif.notificationType || 'SYSTEM').toUpperCase();
    for (const [key, value] of Object.entries(TYPE_ICON_MAP)) {
      if (type.includes(key)) return value;
    }
    return TYPE_ICON_MAP.SYSTEM;
  };

  const renderSkeleton = () => (
    <div className="mg-notif-center__skeleton">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="mg-notif-center__skeleton-card">
          <div className="mg-notif-center__skeleton-icon" />
          <div className="mg-notif-center__skeleton-lines">
            <div className="mg-notif-center__skeleton-line mg-notif-center__skeleton-line--short" />
            <div className="mg-notif-center__skeleton-line mg-notif-center__skeleton-line--long" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmpty = () => (
    <div className="mg-notif-center__empty">
      <div className="mg-notif-center__empty-icon">
        <Bell size={28} />
      </div>
      <h3 className="mg-notif-center__empty-title">{EMPTY_TITLE}</h3>
      <p className="mg-notif-center__empty-desc">{EMPTY_DESC}</p>
    </div>
  );

  const renderNotificationCard = (notif) => {
    const { Icon, className } = getTypeIcon(notif);
    return (
      <SwipeToDelete
        key={notif.id}
        onDelete={() => deleteNotification(notif.id)}
      >
        <button
          className={`mg-notif-center__card ${!notif.isRead ? 'mg-notif-center__card--unread' : ''}`}
          onClick={() => handleCardClick(notif)}
          type="button"
        >
          <div className={`mg-notif-center__icon ${className}`}>
            <Icon size={20} />
          </div>
          <div className="mg-notif-center__content">
            <h4 className={`mg-notif-center__title ${!notif.isRead ? 'mg-notif-center__title--unread' : ''}`}>
              {notif.title || notif.subject || t('common:common.NotificationCenter.t_e29d147e')}
            </h4>
            <p className="mg-notif-center__body">
              {notif.content || notif.message || notif.body || ''}
            </p>
            <span className="mg-notif-center__time">
              {formatNotifTime(notif.createdAt)}
            </span>
          </div>
        </button>
      </SwipeToDelete>
    );
  };

  const groups = groupedNotifications();

  return (
    <div className="mg-notif-center" style={themeStyle}>
      {/* 필터 칩 — MGButton SSOT */}
      <SegmentedTabs
        ariaLabel="알림 필터"
        items={FILTER_TYPES.map((filter) => ({ value: filter.key, label: filter.label }))}
        activeValue={activeFilter}
        onChange={setActiveFilter}
        size="sm"
        className="mg-notif-center__filters"
      />

      {/* 알림 리스트 */}
      <div className="mg-notif-center__list">
        {loading && renderSkeleton()}
        {!loading && filteredNotifications.length === 0 && renderEmpty()}
        {!loading && filteredNotifications.length > 0 && (
          <>
            {Object.entries(groups).map(([groupLabel, items]) => {
              if (items.length === 0) return null;
              return (
                <React.Fragment key={groupLabel}>
                  <div className="mg-notif-center__group-header">{groupLabel}</div>
                  {items.map(renderNotificationCard)}
                </React.Fragment>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

/**
 * SwipeToDelete — 좌 스와이프로 삭제
 */
const SwipeToDelete = ({ children, onDelete }) => {
  const wrapperRef = useRef(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const swipingRef = useRef(false);

  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    swipingRef.current = true;
  };

  const handleTouchMove = (e) => {
    if (!swipingRef.current) return;
    const diff = startXRef.current - e.touches[0].clientX;
    currentXRef.current = Math.max(0, Math.min(diff, 80));

    if (wrapperRef.current) {
      const card = wrapperRef.current.querySelector('.mg-notif-center__card');
      if (card) {
        card.style.transform = `translateX(-${currentXRef.current}px)`;
        card.style.transition = 'none';
      }
    }
  };

  const handleTouchEnd = () => {
    swipingRef.current = false;
    if (currentXRef.current >= SWIPE_THRESHOLD) {
      onDelete();
    } else if (wrapperRef.current) {
      const card = wrapperRef.current.querySelector('.mg-notif-center__card');
      if (card) {
        card.style.transform = 'translateX(0)';
        card.style.transition = `transform ${150}ms ease`;
      }
    }
    currentXRef.current = 0;
  };

  return (
    <div
      ref={wrapperRef}
      className="mg-notif-center__swipe-wrapper"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mg-notif-center__delete-bg">
        <Trash2 size={20} />
      </div>
      {children}
    </div>
  );
};

export default NotificationCenter;
