import React, { useState, useEffect, useCallback } from 'react';
import MGButton from '../common/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import { Bell, Plus, Edit, Trash2, Send, Archive } from 'lucide-react';
import notificationManager from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedModal from '../common/modals/UnifiedModal';
import UnifiedLoading from '../common/UnifiedLoading';
import { fetchUserPermissions, hasPermission as checkPermission } from '../../utils/permissionUtils';
import { sessionManager } from '../../utils/sessionManager';
import '../../styles/mindgarden-design-system.css';

/**
 * 시스템 공지 관리 (관리자 전용 - 지점 관리자 이상)
 */
const SystemNotificationManagement = () => {
  const { user, isLoggedIn } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [filterTarget, setFilterTarget] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  // 폼 데이터
  const [formData, setFormData] = useState({
    targetType: 'ALL',
    title: '',
    content: '',
    notificationType: 'GENERAL',
    isImportant: false,
    isUrgent: false,
    expiresAt: ''
  });

  // 로그인 체크 (sessionManager로 직접 확인) - 먼저 선언
  const sessionUser = sessionManager.getUser();
  const sessionIsLoggedIn = sessionManager.isLoggedIn();

  // 권한 체크 (useCallback으로 메모이제이션)
  const hasManagePermission = useCallback(() => {
    const hasPermission = checkPermission(userPermissions, 'SYSTEM_NOTIFICATION_MANAGE');
    console.log('🔍 시스템 공지 관리 권한 체크:', {
      userPermissions: userPermissions?.length || 0,
      hasPermission,
      user: sessionUser?.role
    });
    return hasPermission;
  }, [userPermissions, sessionUser]);

  // 권한 로드
  useEffect(() => {
    const loadPermissions = async () => {
      // sessionManager를 통해 직접 사용자 확인
      const currentUser = sessionManager.getUser();
      const currentIsLoggedIn = sessionManager.isLoggedIn();
      
      if (currentIsLoggedIn && currentUser) {
        setPermissionsLoading(true);
        try {
          const permissions = await fetchUserPermissions(setUserPermissions);
          console.log('✅ SystemNotificationManagement 권한 로드 완료:', permissions?.length || 0, '개');
        } catch (error) {
          console.error('권한 로드 오류:', error);
        } finally {
          setPermissionsLoading(false);
        }
      } else {
        setPermissionsLoading(false);
      }
    };
    
    // 즉시 실행
    loadPermissions();
  }, []); // 빈 배열 - 마운트 시에만 실행

  // 공지 목록 로드
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterTarget) params.append('targetType', filterTarget);
      if (filterStatus) params.append('status', filterStatus);
      params.append('page', '0');
      params.append('size', '50');

      const response = await apiGet(`/api/system-notifications/admin/all?${params.toString()}`);

      if (response.success) {
        setNotifications(response.data || []);
      } else {
        notificationManager.show(response.message || '공지 목록을 불러올 수 없습니다.', 'error');
      }
    } catch (error) {
      console.error('공지 목록 로드 오류:', error);
      notificationManager.show('공지 목록을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 새 공지 작성
  const handleCreate = () => {
    setEditingNotification(null);
    setFormData({
      targetType: 'ALL',
      title: '',
      content: '',
      notificationType: 'GENERAL',
      isImportant: false,
      isUrgent: false,
      expiresAt: ''
    });
    setShowModal(true);
  };

  // 공지 수정
  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setFormData({
      targetType: notification.targetType,
      title: notification.title,
      content: notification.content,
      notificationType: notification.notificationType,
      isImportant: notification.isImportant,
      isUrgent: notification.isUrgent,
      expiresAt: notification.expiresAt || ''
    });
    setShowModal(true);
  };

  // 공지 저장
  const handleSave = async () => {
    try {
      if (!formData.title || !formData.content) {
        notificationManager.show('제목과 내용을 입력해주세요.', 'warning');
        return;
      }

      const endpoint = editingNotification
        ? `/api/system-notifications/admin/${editingNotification.id}`
        : '/api/system-notifications/admin';

      const method = editingNotification ? apiPut : apiPost;
      const response = await method(endpoint, formData);

      if (response.success) {
        notificationManager.show(
          editingNotification ? '공지가 수정되었습니다.' : '공지가 작성되었습니다.',
          'success'
        );
        setShowModal(false);
        loadNotifications();
      } else {
        throw new Error(response.message || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('공지 저장 오류:', error);
      notificationManager.show('공지 저장 중 오류가 발생했습니다.', 'error');
    }
  };

  // 공지 게시
  const handlePublish = async (id) => {
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm('이 공지를 게시하시겠습니까?', resolve);
    });
    if (!confirmed) return;

    try {
      const response = await apiPost(`/api/system-notifications/admin/${id}/publish`, {});

      if (response.success) {
        notificationManager.show('공지가 게시되었습니다.', 'success');
        loadNotifications();
      } else {
        throw new Error(response.message || '게시에 실패했습니다.');
      }
    } catch (error) {
      console.error('공지 게시 오류:', error);
      notificationManager.show('공지 게시 중 오류가 발생했습니다.', 'error');
    }
  };

  // 공지 보관
  const handleArchive = async (id) => {
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm('이 공지를 보관하시겠습니까?', resolve);
    });
    if (!confirmed) return;

    try {
      const response = await apiPost(`/api/system-notifications/admin/${id}/archive`, {});

      if (response.success) {
        notificationManager.show('공지가 보관되었습니다.', 'success');
        loadNotifications();
      } else {
        throw new Error(response.message || '보관에 실패했습니다.');
      }
    } catch (error) {
      console.error('공지 보관 오류:', error);
      notificationManager.show('공지 보관 중 오류가 발생했습니다.', 'error');
    }
  };

  // 공지 삭제
  const handleDelete = async (id) => {
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm('이 공지를 삭제하시겠습니까?', resolve);
    });
    if (!confirmed) return;

    try {
      const response = await apiDelete(`/api/system-notifications/admin/${id}`);

      if (response.success) {
        notificationManager.show('공지가 삭제되었습니다.', 'success');
        loadNotifications();
      } else {
        throw new Error(response.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('공지 삭제 오류:', error);
      notificationManager.show('공지 삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  // 공지 목록 로드 (권한 로드 완료 후)
  useEffect(() => {
    if (!permissionsLoading && hasManagePermission()) {
      console.log('✅ 권한 확인 완료, 공지 목록 로드 시작');
      loadNotifications();
    }
  }, [permissionsLoading, userPermissions, filterTarget, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // 로그인 체크
  if (!sessionIsLoggedIn || !sessionUser) {
    return (
      <SimpleLayout title="시스템 공지 관리">
        <div className="mg-v2-card mg-v2-text-center mg-p-xl">
          <h3>로그인이 필요합니다.</h3>
        </div>
      </SimpleLayout>
    );
  }

  // 권한 로딩 중
  if (permissionsLoading) {
    return (
      <SimpleLayout title="시스템 공지 관리">
        <UnifiedLoading message="권한 확인 중..." />
      </SimpleLayout>
    );
  }

  // 권한 체크
  if (!hasManagePermission()) {
    return (
      <SimpleLayout title="시스템 공지 관리">
        <div className="mg-v2-card mg-v2-text-center mg-p-xl">
          <h3>접근 권한이 없습니다.</h3>
          <p className="mg-v2-text-sm mg-v2-color-text-secondary">
            시스템 공지 관리 권한이 필요합니다.
          </p>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="시스템 공지 관리">
      <div className="mg-v2-dashboard-layout">
        {/* 헤더 */}
        <div className="mg-v2-card mg-mb-lg">
          <div className="mg-v2-flex mg-justify-between mg-align-center mg-mb-md">
            <div className="mg-v2-flex mg-align-center mg-gap-sm">
              <Bell className="mg-v2-color-primary" size={24} />
              <h2 className="mg-v2-h3 mg-mb-0">시스템 공지 관리</h2>
            </div>
            <button onClick={handleCreate} className="mg-v2-button mg-v2-button-primary">
              <Plus size={18} className="mg-v2-mr-sm" />
              새 공지 작성
            </button>
          </div>

          {/* 필터 */}
          <div className="mg-v2-flex mg-gap-md mg-flex-wrap">
            <select
              value={filterTarget}
              onChange={(e) => setFilterTarget(e.target.value)}
              className="mg-v2-select"
            >
              <option value="">전체 대상</option>
              <option value="ALL">전체 사용자</option>
              <option value="CONSULTANT">상담사만</option>
              <option value="CLIENT">내담자만</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mg-v2-select"
            >
              <option value="">전체 상태</option>
              <option value="DRAFT">임시 저장</option>
              <option value="PUBLISHED">게시됨</option>
              <option value="ARCHIVED">보관됨</option>
            </select>
          </div>
        </div>

        {/* 로딩 */}
        {loading && <UnifiedLoading message="공지 목록을 불러오는 중..." />}

        {/* 공지 목록 */}
        {!loading && (
          <div className="mg-v2-space-y-sm">
            {notifications.length === 0 ? (
              <div className="mg-v2-empty-state">
                <div className="mg-v2-empty-state__icon">
                  <Bell size={48} />
                </div>
                <div className="mg-v2-empty-state__text">작성된 공지가 없습니다</div>
                <button onClick={handleCreate} className="mg-v2-button mg-v2-button-primary mg-mt-md">
                  첫 공지 작성하기
                </button>
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="mg-v2-card">
                  <div className="mg-v2-flex mg-justify-between mg-align-start mg-gap-md">
                    <div className="mg-v2-flex-1">
                      <div className="mg-v2-flex mg-align-center mg-gap-sm mg-mb-sm mg-flex-wrap">
                        <h4 className="mg-v2-h5 mg-mb-0">{notification.title}</h4>
                        <span className={`mg-v2-badge ${
                          notification.status === 'PUBLISHED' ? 'mg-v2-badge-success' :
                          notification.status === 'DRAFT' ? 'mg-v2-badge-secondary' :
                          'mg-v2-badge-warning'
                        }`}>
                          {notification.status === 'PUBLISHED' ? '게시됨' :
                           notification.status === 'DRAFT' ? '임시저장' : '보관됨'}
                        </span>
                        <span className="mg-v2-badge mg-v2-badge-primary">
                          {notification.targetType === 'ALL' ? '전체' :
                           notification.targetType === 'CONSULTANT' ? '상담사' : '내담자'}
                        </span>
                        {notification.isUrgent && (
                          <span className="mg-v2-badge mg-v2-badge-danger mg-v2-text-xs">긴급</span>
                        )}
                        {notification.isImportant && (
                          <span className="mg-v2-badge mg-v2-badge-warning mg-v2-text-xs">중요</span>
                        )}
                      </div>
                      <p className="mg-v2-text-sm mg-v2-color-text-secondary mg-mb-sm">
                        {notification.content.length > 150
                          ? `${notification.content.substring(0, 150)}...`
                          : notification.content}
                      </p>
                      <div className="mg-v2-text-xs mg-v2-color-text-secondary">
                        작성자: {notification.authorName} · 
                        작성일: {new Date(notification.createdAt).toLocaleDateString('ko-KR')}
                        {notification.viewCount > 0 && ` · 조회수: ${notification.viewCount}`}
                      </div>
                    </div>
                    <div className="mg-v2-notification-actions">
                      {notification.status === 'DRAFT' && (
                        <button
                          onClick={() => handlePublish(notification.id)}
                          className="mg-v2-button mg-v2-button-primary mg-v2-button-small"
                          title="게시"
                        >
                          <Send size={16} />
                        </button>
                      )}
                      {notification.status === 'PUBLISHED' && (
                        <button
                          onClick={() => handleArchive(notification.id)}
                          className="mg-v2-button mg-v2-button-outline mg-v2-button-small"
                          title="보관"
                        >
                          <Archive size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(notification)}
                        className="mg-v2-button mg-v2-button-outline mg-v2-button-small"
                        title="수정"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="mg-v2-button mg-v2-button-danger mg-v2-button-small"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 작성/수정 모달 */}
        <UnifiedModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingNotification ? '공지 수정' : '새 공지 작성'}
          size="large"
          actions={
            <>
              <button onClick={() => setShowModal(false)} className="mg-v2-button mg-v2-button-outline">
                취소
              </button>
              <button onClick={handleSave} className="mg-v2-button mg-v2-button-primary">
                {editingNotification ? '수정' : '작성'}
              </button>
            </>
          }
        >
          <div className="mg-v2-space-y-md">
            {/* 대상 선택 */}
            <div className="mg-v2-form-group">
              <label className="mg-v2-label">대상</label>
              <select
                value={formData.targetType}
                onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                className="mg-v2-select"
              >
                <option value="ALL">전체 사용자</option>
                <option value="CONSULTANT">상담사만</option>
                <option value="CLIENT">내담자만</option>
              </select>
            </div>

            {/* 제목 */}
            <div className="mg-v2-form-group">
              <label className="mg-v2-label">제목</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mg-v2-input"
                placeholder="공지 제목을 입력하세요"
              />
            </div>

            {/* 내용 */}
            <div className="mg-v2-form-group">
              <label className="mg-v2-label">내용</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="mg-v2-textarea"
                rows="10"
                placeholder="공지 내용을 입력하세요"
              />
            </div>

            {/* 타입 */}
            <div className="mg-v2-form-group">
              <label className="mg-v2-label">공지 타입</label>
              <select
                value={formData.notificationType}
                onChange={(e) => setFormData({ ...formData, notificationType: e.target.value })}
                className="mg-v2-select"
              >
                <option value="GENERAL">일반</option>
                <option value="IMPORTANT">중요</option>
                <option value="URGENT">긴급</option>
                <option value="MAINTENANCE">시스템 점검</option>
                <option value="UPDATE">업데이트 안내</option>
              </select>
            </div>

            {/* 체크박스 */}
            <div className="mg-v2-form-group">
              <div className="mg-v2-checkbox-group">
                <label className="mg-v2-checkbox-label">
                  <input
                    type="checkbox"
                    className="mg-v2-checkbox-input"
                    checked={formData.isImportant}
                    onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                  />
                  <span className="mg-v2-checkbox-text">중요 공지</span>
                </label>
                <label className="mg-v2-checkbox-label">
                  <input
                    type="checkbox"
                    className="mg-v2-checkbox-input"
                    checked={formData.isUrgent}
                    onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                  />
                  <span className="mg-v2-checkbox-text">긴급 공지</span>
                </label>
              </div>
            </div>

            {/* 만료일 */}
            <div className="mg-v2-form-group">
              <label className="mg-v2-label">게시 종료일 (선택)</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="mg-v2-input"
              />
            </div>
          </div>
        </UnifiedModal>
      </div>
    </SimpleLayout>
  );
};

export default SystemNotificationManagement;
