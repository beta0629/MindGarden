/**
 * AppTopBar — 앱 상단 바 (Molecule)
 *
 * 글래스모피즘 스타일의 상단 바. 페이지 제목, 뒤로가기, 알림, 프로필 표시.
 * 스크롤 시 배경 블러+그림자 적용.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import './AppTopBar.css';
import { useTranslation } from 'react-i18next';

const AppTopBar = ({
  title = '',
  showBack = false,
  onBack,
  showNotification = true,
  notificationCount = 0,
  showProfile = true,
  profileImage = null,
  themeClass = '',
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={`mg-top-bar ${scrolled ? 'mg-top-bar--scrolled' : ''} ${themeClass}`}
      role="banner"
    >
      <div className="mg-top-bar__left">
        {showBack && (
          <button
            className="mg-top-bar__btn"
            onClick={handleBack}
            aria-label="뒤로가기"
            type="button"
          >
            <ArrowLeft size={24} />
          </button>
        )}
      </div>

      <h1 className="mg-top-bar__title">{title}</h1>

      <div className="mg-top-bar__right">
        {showNotification && (
          <button
            className="mg-top-bar__btn mg-top-bar__notification"
            aria-label={`알림 ${notificationCount}건`}
            type="button"
          >
            <Bell size={22} />
            {notificationCount > 0 && (
              <span className="mg-top-bar__notification-badge">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>
        )}
        {showProfile && (
          <button className="mg-top-bar__profile" aria-label={t('common.labels.profile', '프로필')} type="button">
            {profileImage ? (
              <img
                src={profileImage}
                alt={t('common.labels.profile', '프로필')}
                className="mg-top-bar__avatar"
              />
            ) : (
              <span className="mg-top-bar__avatar mg-top-bar__avatar--placeholder" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};

export default AppTopBar;
