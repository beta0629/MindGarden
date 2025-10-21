import React, { useState, useEffect } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { useNotification } from '../../contexts/NotificationContext';
import { apiGet } from '../../utils/ajax';
import { Bell, AlertCircle, Info, AlertTriangle, Settings, Calendar } from 'lucide-react';
import SimpleLayout from '../layout/SimpleLayout';
import './SystemNotifications.css';

/**
 * 시스템 공지 목록 페이지
 */
const SystemNotifications = () => {
  const { user, isLoggedIn } = useSession();
  // const { loadUnreadSystemCount } = useNotification(); // 이벤트 기반으로 카운트 갱신
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 공지 타입별 정보
  const getNotificationTypeInfo = (type) => {
    const types = {
      GENERAL: { icon: Info, label: '일반', colorClass: 'mg-color-primary' },
      IMPORTANT: { icon: AlertCircle, label: '중요', colorClass: 'mg-color-warning' },
      URGENT: { icon: AlertTriangle, label: '긴급', colorClass: 'mg-color-danger' },
      MAINTENANCE: { icon: Settings, label: '점검', colorClass: 'mg-color-info' },
      UPDATE: { icon: Calendar, label: '업데이트', colorClass: 'mg-color-success' }
    };
    return types[type] || types.GENERAL;
  };

  // 대상 타입별 라벨
  const getTargetTypeLabel = (targetType) => {
    const labels = {
      ALL: '전체',
      CONSULTANT: '상담사',
      CLIENT: '내담자'
    };
    return labels[targetType] || '전체';
  };

  // 공지 목록 로드
  const loadNotifications = async (page = 0) => {
    if (!isLoggedIn) return;

    try {
      setLoading(true);
      const response = await apiGet(`/api/system-notifications?page=${page}&size=20`);

      if (response.success) {
        setNotifications(response.data || []);
        setTotalPages(response.totalPages || 0);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('공지 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 공지 상세 보기
  const handleNotificationClick = async (notification) => {
    try {
      // 상세 조회 API 호출 (자동 읽음 처리)
      const response = await apiGet(`/api/system-notifications/${notification.id}`);
      
      if (response.success) {
        setSelectedNotification(response.data);
      } else {
        // 실패 시 기존 데이터 사용
        setSelectedNotification(notification);
      }
    } catch (error) {
      console.error('공지 상세 조회 오류:', error);
      // 오류 시 기존 데이터 사용
      setSelectedNotification(notification);
    }
  };

  // 모달 닫기
  const closeModal = async () => {
    setSelectedNotification(null);
    
    // 목록 새로고침 (읽음 상태 반영)
    await loadNotifications(currentPage);
    // 공지 읽음 이벤트 발생 (NotificationContext가 카운트 갱신)
    window.dispatchEvent(new Event('notification-read'));
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

  useEffect(() => {
    loadNotifications();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <SimpleLayout title="시스템 공지">
        <div className="mg-card mg-text-center mg-p-xl">
          <h3>로그인이 필요합니다.</h3>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="시스템 공지">
      <div className="system-notifications-container">
        {/* 헤더 */}
        <div className="mg-card mg-mb-lg">
          <div className="mg-flex mg-align-center mg-gap-sm mg-mb-sm">
            <Bell className="mg-color-primary" size={24} />
            <h2 className="mg-h3 mg-mb-0">시스템 공지</h2>
          </div>
          <p className="mg-text-sm mg-color-text-secondary mg-mb-0">
            중요한 공지사항을 확인하세요.
          </p>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="mg-loading-container">
            <div className="mg-spinner"></div>
            <p>공지를 불러오는 중...</p>
          </div>
        )}

        {/* 공지 목록 */}
        {!loading && (
          <div>
            {notifications.length === 0 ? (
              <div className="mg-empty-state">
                <div className="mg-empty-state__icon">
                  <Bell size={48} />
                </div>
                <div className="mg-empty-state__text">공지사항이 없습니다</div>
                <div className="mg-empty-state__hint">새로운 공지가 등록되면 알려드립니다.</div>
              </div>
            ) : (
              <div className="mg-space-y-sm">
                {notifications.map((notification) => {
                  const typeInfo = getNotificationTypeInfo(notification.notificationType);
                  const IconComponent = typeInfo.icon;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="notification-card mg-card mg-cursor-pointer"
                    >
                      <div className="mg-flex mg-gap-md">
                        {/* 아이콘 */}
                        <div className={`notification-icon ${typeInfo.colorClass}`}>
                          <IconComponent size={24} />
                        </div>

                        {/* 내용 */}
                        <div className="mg-flex-1">
                          <div className="mg-flex mg-justify-between mg-align-start mg-mb-sm">
                            <div className="mg-flex mg-align-center mg-gap-sm mg-flex-wrap">
                              <h4 className="mg-h5 mg-mb-0">{notification.title}</h4>
                              {notification.isUrgent && (
                                <span className="mg-badge mg-badge-danger mg-text-xs">긴급</span>
                              )}
                              {notification.isImportant && (
                                <span className="mg-badge mg-badge-warning mg-text-xs">중요</span>
                              )}
                              <span className="mg-badge mg-badge-secondary mg-text-xs">
                                {getTargetTypeLabel(notification.targetType)}
                              </span>
                            </div>
                            <span className="mg-text-xs mg-color-text-secondary">
                              {formatDate(notification.publishedAt || notification.createdAt)}
                            </span>
                          </div>
                          <p className="mg-text-sm mg-color-text-secondary mg-mb-0">
                            {notification.content.length > 100
                              ? `${notification.content.substring(0, 100)}...`
                              : notification.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mg-flex mg-justify-center mg-gap-sm mg-mt-lg">
                <button
                  onClick={() => loadNotifications(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="mg-button mg-button-outline"
                >
                  이전
                </button>
                <span className="mg-text-sm mg-color-text-secondary mg-flex mg-align-center">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => loadNotifications(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="mg-button mg-button-outline"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}

        {/* 상세 모달 */}
        {selectedNotification && (
          <div className="mg-modal-overlay" onClick={closeModal}>
            <div className="mg-modal mg-modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="mg-modal-header">
                <div>
                  <div className="mg-flex mg-align-center mg-gap-sm mg-mb-sm">
                    <h3 className="mg-h3 mg-mb-0">{selectedNotification.title}</h3>
                    {selectedNotification.isUrgent && (
                      <span className="mg-badge mg-badge-danger">긴급</span>
                    )}
                    {selectedNotification.isImportant && (
                      <span className="mg-badge mg-badge-warning">중요</span>
                    )}
                  </div>
                  <div className="mg-flex mg-gap-sm mg-align-center">
                    <span className="mg-badge mg-badge-secondary">
                      {getTargetTypeLabel(selectedNotification.targetType)}
                    </span>
                    <span className="mg-text-sm mg-color-text-secondary">
                      {selectedNotification.authorName || '관리자'} · 
                      {formatDate(selectedNotification.publishedAt || selectedNotification.createdAt)}
                    </span>
                  </div>
                </div>
                <button onClick={closeModal} className="mg-modal-close">
                  ×
                </button>
              </div>
              <div className="mg-modal-body">
                <div className="notification-content">
                  {selectedNotification.content.split('\n').map((line, index) => (
                    <p key={index} className="mg-mb-sm">{line}</p>
                  ))}
                </div>
              </div>
              <div className="mg-modal-footer">
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

export default SystemNotifications;

