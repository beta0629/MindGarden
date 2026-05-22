/**
 * NotificationSettings — 알림 설정 화면
 *
 * 카테고리별 on/off 토글, 리마인더 시점 선택, 시간 피커.
 * localStorage에 저장 (백엔드 API 후속).
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, CreditCard, MessageCircle, Bell, Heart, Volume2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import './NotificationSettings.css';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'mg_notification_settings';
const TOAST_DURATION = 2000;

const REMINDER_OPTIONS = [
  { value: '30', label: '30분 전' },
  { value: '60', label: '1시간 전' },
  { value: '120', label: '2시간 전' },
];

const DEFAULT_SETTINGS = {
  schedule: {
    enabled: true,
    reminderMinutes: '60',
    confirmCancel: true,
    startEnd: true,
  },
  payment: {
    enabled: true,
    confirmFail: true,
    sessionLow: true,
  },
  message: {
    enabled: true,
  },
  wellness: {
    enabled: true,
    reminderTime: '09:00',
  },
  system: {
    enabled: true,
  },
  sound: {
    enabled: true,
  },
};

const loadSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('알림 설정 로드 실패:', error);
  }
  return DEFAULT_SETTINGS;
};

const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('알림 설정 저장 실패:', error);
  }
};

const Toggle = ({ active, disabled = false, onChange }) => (
  <button
    className={`mg-notif-settings__toggle ${active ? 'mg-notif-settings__toggle--active' : ''} ${disabled ? 'mg-notif-settings__toggle--disabled' : ''}`}
    onClick={() => !disabled && onChange(!active)}
    disabled={disabled}
    type="button"
    aria-pressed={active}
    aria-label={active ? '활성' : '비활성'}
  >
    <span className="mg-notif-settings__toggle-knob" />
  </button>
);

const NotificationSettings = ({ themeVariant = 'client' }) => {
  const { t } = useTranslation();
  const { showToast: showAppToast } = useToast();
  const [settings, setSettings] = useState(loadSettings);
  const [showToast, setShowToast] = useState(false);

  const themeStyle = {
    '--mg-chat-primary': themeVariant === 'consultant'
      ? 'var(--mg-consultant-primary)'
      : 'var(--mg-client-primary)',
    '--mg-chat-bg': themeVariant === 'consultant'
      ? 'var(--mg-consultant-bg-main)'
      : 'var(--mg-client-bg-main)',
  };

  const persistSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setShowToast(true);
    showAppToast({ message: '설정이 저장되었습니다.', type: 'success' });
  }, [showAppToast]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), TOAST_DURATION);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const updateCategory = (category, key, value) => {
    const updated = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    };
    persistSettings(updated);
  };

  return (
    <div className="mg-notif-settings" style={themeStyle}>
      {/* 예약 관련 */}
      <section className="mg-notif-settings__section">
        <div className="mg-notif-settings__section-header">
          <h3 className="mg-notif-settings__section-title">
            <Calendar size={18} className="mg-notif-settings__section-icon" />
            예약 관련
          </h3>
          <Toggle
            active={settings.schedule.enabled}
            onChange={(v) => updateCategory('schedule', 'enabled', v)}
          />
        </div>
        {settings.schedule.enabled && (
          <div className="mg-notif-settings__sub-options">
            <div className="mg-notif-settings__sub-item">
              <span className="mg-notif-settings__sub-label">리마인더 시점</span>
              <select
                className="mg-notif-settings__select"
                value={settings.schedule.reminderMinutes}
                onChange={(e) => updateCategory('schedule', 'reminderMinutes', e.target.value)}
                aria-label="리마인더 시점 선택"
              >
                {REMINDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="mg-notif-settings__sub-item">
              <span className="mg-notif-settings__sub-label">예약 확정·취소</span>
              <Toggle
                active={settings.schedule.confirmCancel}
                onChange={(v) => updateCategory('schedule', 'confirmCancel', v)}
              />
            </div>
            <div className="mg-notif-settings__sub-item">
              <span className="mg-notif-settings__sub-label">상담 시작·완료</span>
              <Toggle
                active={settings.schedule.startEnd}
                onChange={(v) => updateCategory('schedule', 'startEnd', v)}
              />
            </div>
          </div>
        )}
      </section>

      {/* 결제 관련 */}
      <section className="mg-notif-settings__section">
        <div className="mg-notif-settings__section-header">
          <h3 className="mg-notif-settings__section-title">
            <CreditCard size={18} className="mg-notif-settings__section-icon" />
            결제 관련
          </h3>
          <Toggle
            active={settings.payment.enabled}
            onChange={(v) => updateCategory('payment', 'enabled', v)}
          />
        </div>
        {settings.payment.enabled && (
          <div className="mg-notif-settings__sub-options">
            <div className="mg-notif-settings__sub-item">
              <span className="mg-notif-settings__sub-label">결제 확인·실패</span>
              <Toggle
                active={settings.payment.confirmFail}
                onChange={(v) => updateCategory('payment', 'confirmFail', v)}
              />
            </div>
            <div className="mg-notif-settings__sub-item">
              <span className="mg-notif-settings__sub-label">회기 소진 임박</span>
              <Toggle
                active={settings.payment.sessionLow}
                onChange={(v) => updateCategory('payment', 'sessionLow', v)}
              />
            </div>
          </div>
        )}
      </section>

      {/* 메시지 */}
      <section className="mg-notif-settings__section">
        <div className="mg-notif-settings__section-header">
          <h3 className="mg-notif-settings__section-title">
            <MessageCircle size={18} className="mg-notif-settings__section-icon" />
            {t('admin.labels.message', '메시지')}
          </h3>
          <Toggle
            active={settings.message.enabled}
            onChange={(v) => updateCategory('message', 'enabled', v)}
          />
        </div>
      </section>

      {/* 웰니스 리마인드 */}
      <section className="mg-notif-settings__section">
        <div className="mg-notif-settings__section-header">
          <h3 className="mg-notif-settings__section-title">
            <Heart size={18} className="mg-notif-settings__section-icon" />
            웰니스 리마인드
          </h3>
          <Toggle
            active={settings.wellness.enabled}
            onChange={(v) => updateCategory('wellness', 'enabled', v)}
          />
        </div>
        {settings.wellness.enabled && (
          <div className="mg-notif-settings__sub-options">
            <div className="mg-notif-settings__sub-item">
              <span className="mg-notif-settings__sub-label">리마인드 시각</span>
              <input
                type="time"
                className="mg-notif-settings__time-picker"
                value={settings.wellness.reminderTime}
                onChange={(e) => updateCategory('wellness', 'reminderTime', e.target.value)}
                aria-label="웰니스 리마인드 시각"
              />
            </div>
          </div>
        )}
      </section>

      {/* 시스템 공지 (비활성화 불가) */}
      <section className="mg-notif-settings__section mg-notif-settings__section--forced">
        <div className="mg-notif-settings__section-header">
          <h3 className="mg-notif-settings__section-title">
            <Bell size={18} className="mg-notif-settings__section-icon" />
            시스템 공지
            <span className="mg-notif-settings__forced-label">항상 수신</span>
          </h3>
          <Toggle active={true} disabled={true} onChange={() => {}} />
        </div>
      </section>

      {/* 사운드·진동 */}
      <section className="mg-notif-settings__section">
        <div className="mg-notif-settings__section-header">
          <h3 className="mg-notif-settings__section-title">
            <Volume2 size={18} className="mg-notif-settings__section-icon" />
            사운드·진동
          </h3>
          <Toggle
            active={settings.sound.enabled}
            onChange={(v) => updateCategory('sound', 'enabled', v)}
          />
        </div>
      </section>

      {/* 저장 토스트 */}
      {showToast && (
        <output className="mg-notif-settings__saved-toast">
          설정이 저장되었습니다
        </output>
      )}
    </div>
  );
};

export default NotificationSettings;
