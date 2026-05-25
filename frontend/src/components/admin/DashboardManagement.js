/**
 * 대시보드 관리 컴포넌트
/**
 * 테넌트의 모든 대시보드를 관리하는 페이지
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-01-XX
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import notificationManager from '../../utils/notification';
import { apiGet } from '../../utils/ajax';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { FaEye, FaEyeSlash, FaSearch, FaCheckCircle } from 'react-icons/fa';
import DashboardFormModal from './DashboardFormModal';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './DashboardManagement.css';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../hooks/useConfirm';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_TENANT_DASHBOARDS = '/api/v1/tenant/dashboards';


const DASHBOARD_MGMT_TITLE_ID = 'dashboard-management-title';

const DashboardManagement = () => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const [confirm, ConfirmModal] = useConfirm();
  const [dashboards, setDashboards] = useState([]);
  const [filteredDashboards, setFilteredDashboards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, active, inactive
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);

  // 대시보드 목록 로드
  const loadDashboards = useCallback(async() => {
    setLoading(true);
    try {
      const response = await apiGet(API_TENANT_DASHBOARDS);
      
      // apiGet은 ApiResponse 래퍼를 처리하여 data를 반환하거나, 직접 배열을 반환할 수 있음
      let dashboardList = [];
      
      if (response) {
        if (response.success && response.data) {
          // ApiResponse 형식: { success: true, data: [...] }
          dashboardList = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          // 직접 배열 형식 (apiGet이 이미 data를 추출한 경우)
          dashboardList = response;
        } else if (response.data && Array.isArray(response.data)) {
          // data 필드에 배열이 있는 경우
          dashboardList = response.data;
        }
      }
      
      setDashboards(dashboardList);
      console.log('✅ 대시보드 목록 로드 성공:', dashboardList.length, '개');
      if (dashboardList.length > 0) {
        console.log('📋 대시보드 목록:', dashboardList.map(d => ({
          id: d.dashboardId,
          name: d.dashboardNameKo || d.dashboardName,
          roleId: d.tenantRoleId,
          roleName: d.roleNameKo || d.roleName
        })));
      }
    } catch (error) {
      console.error('❌ 대시보드 목록 로드 실패:', error);
      notificationManager.show(t('admin:dashboardManagement.notifications.loadFailed', '대시보드 목록을 불러오는 중 오류가 발생했습니다.'), 'error');
      setDashboards([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadDashboards();
  }, [loadDashboards]);

  // 필터링 로직
  useEffect(() => {
    let filtered = dashboards;

    // 검색어 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(dashboard => 
        (dashboard.dashboardNameKo && dashboard.dashboardNameKo.toLowerCase().includes(term)) ||
        (dashboard.dashboardName && dashboard.dashboardName.toLowerCase().includes(term)) ||
        (dashboard.dashboardType && dashboard.dashboardType.toLowerCase().includes(term)) ||
        (dashboard.roleNameKo && dashboard.roleNameKo.toLowerCase().includes(term))
      );
    }

    // 활성화 상태 필터
    if (filterType === 'active') {
      filtered = filtered.filter(dashboard => dashboard.isActive);
    } else if (filterType === 'inactive') {
      filtered = filtered.filter(dashboard => !dashboard.isActive);
    }

    setFilteredDashboards(filtered);
  }, [dashboards, searchTerm, filterType]);

  // 대시보드 활성화/비활성화 토글
  const handleToggleActive = async(dashboard) => {
    if (!dashboard.dashboardId) {
      notificationManager.show(t('admin:dashboardManagement.notifications.missingId', '대시보드 ID가 없습니다.'), 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await csrfTokenManager.put(
        `/api/v1/tenant/dashboards/${dashboard.dashboardId}`,
        {
          ...dashboard,
          isActive: !dashboard.isActive
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          notificationManager.show(
            dashboard.isActive
              ? t('admin:dashboardManagement.notifications.deactivated', '대시보드가 비활성화되었습니다.')
              : t('admin:dashboardManagement.notifications.activated', '대시보드가 활성화되었습니다.'),
            'success'
          );
          await loadDashboards();
        } else {
          throw new Error(result.message || t('admin:dashboardManagement.notifications.statusChangeFailed', '대시보드 상태 변경 실패'));
        }
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || t('admin:dashboardManagement.notifications.statusChangeFailed', '대시보드 상태 변경 실패'));
      }
    } catch (error) {
      console.error('❌ 대시보드 상태 변경 실패:', error);
      notificationManager.show(error.message || t('admin:dashboardManagement.notifications.statusChangeError', '대시보드 상태 변경 중 오류가 발생했습니다.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // 대시보드 삭제
  const handleDelete = async(dashboard) => {
    if (!dashboard.dashboardId) {
      notificationManager.show(t('admin:dashboardManagement.notifications.missingId', '대시보드 ID가 없습니다.'), 'error');
      return;
    }

    // 기본 대시보드는 삭제 불가
    if (dashboard.isDefault) {
      notificationManager.show(t('admin:dashboardManagement.notifications.defaultDeleteForbidden', '기본 대시보드는 삭제할 수 없습니다. 비활성화만 가능합니다.'), 'warning');
      return;
    }

    const confirmed = await confirm({
      variant: 'danger',
      messageKey: 'modal.dashboard.delete.confirm.message',
      interpolation: { name: dashboard.dashboardNameKo || dashboard.dashboardName },
    });

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      const response = await csrfTokenManager.delete(
        `/api/v1/tenant/dashboards/${dashboard.dashboardId}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          notificationManager.show(t('admin:dashboardManagement.notifications.deleted', '대시보드가 삭제되었습니다.'), 'success');
          await loadDashboards();
        } else {
          throw new Error(result.message || t('admin:dashboardManagement.notifications.deleteFailed', '대시보드 삭제 실패'));
        }
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || t('admin:dashboardManagement.notifications.deleteFailed', '대시보드 삭제 실패'));
      }
    } catch (error) {
      console.error('❌ 대시보드 삭제 실패:', error);
      notificationManager.show(error.message || t('admin:dashboardManagement.notifications.deleteError', '대시보드 삭제 중 오류가 발생했습니다.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // 대시보드 수정
  const handleEdit = (dashboard) => {
    console.log('🔧 대시보드 수정 버튼 클릭:', dashboard);
    if (!dashboard) {
      console.error('❌ 대시보드 데이터가 없습니다.');
      notificationManager.show(t('admin:dashboardManagement.notifications.missingData', '대시보드 데이터가 없습니다.'), 'error');
      return;
    }
    if (!dashboard.dashboardId) {
      console.error('❌ 대시보드 ID가 없습니다.');
      notificationManager.show(t('admin:dashboardManagement.notifications.missingId', '대시보드 ID가 없습니다.'), 'error');
      return;
    }
    setSelectedDashboard(dashboard);
    setShowFormModal(true);
    console.log('✅ 모달 열기:', { dashboardId: dashboard.dashboardId, showFormModal: true });
  };

  // 대시보드 생성
  const handleCreate = () => {
    setSelectedDashboard(null);
    setShowFormModal(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    setShowFormModal(false);
    setSelectedDashboard(null);
  };

  // 모달 저장 후 콜백
  const handleModalSave = async(savedDashboard) => {
    console.log('✅ 대시보드 저장 완료, 목록 새로고침:', savedDashboard);
    await loadDashboards();
    handleModalClose();
    notificationManager.show(
      t('admin:dashboardManagement.notifications.saved', '대시보드가 저장되었습니다.'),
      'success'
    );
  };

  // 대시보드 타입 한글 변환
  const getDashboardTypeLabel = (type) => {
    const typeMap = {
      'STUDENT': t('admin:dashboardManagement.type.student', '학생'),
      'TEACHER': t('admin:dashboardManagement.type.teacher', '선생님'),
      'ADMIN': t('admin:dashboardManagement.type.admin', '관리자'),
      'CLIENT': t('admin:dashboardManagement.type.client', '내담자'),
      'CONSULTANT': t('admin:dashboardManagement.type.consultant', '상담사'),
      'PRINCIPAL': t('admin:dashboardManagement.type.principal', '원장'),
      'DEFAULT': t('admin:dashboardManagement.type.default', '기본')
    };
    return typeMap[type] || type;
  };

  // 대시보드 타입 아이콘
  const getDashboardTypeIcon = (type) => {
    const iconMap = {
      'STUDENT': '👨‍🎓',
      'TEACHER': '👨‍🏫',
      'ADMIN': '👨‍💼',
      'CLIENT': '👤',
      'CONSULTANT': '👨‍⚕️',
      'PRINCIPAL': '👑',
      'DEFAULT': '📊'
    };
    return iconMap[type] || '📊';
  };

  // 대시보드 보기 (관리자용 - 역할 할당 없이도 볼 수 있음)
  const handleViewDashboard = (dashboard) => {
    if (!dashboard.dashboardId) {
      notificationManager.show(t('admin:dashboardManagement.notifications.missingId', '대시보드 ID가 없습니다.'), 'error');
      return;
    }

    // 쿼리 파라미터로 대시보드 ID 전달
    // DynamicDashboard 컴포넌트가 dashboardId 쿼리 파라미터를 확인하여 해당 대시보드를 로드
    navigate(`/dashboard?dashboardId=${dashboard.dashboardId}`, {
      state: { 
        dashboard: dashboard,
        isAdminPreview: true // 관리자 미리보기 모드
      }
    });
  };

  return (
    <>
    <AdminCommonLayout title={t('admin:dashboardManagement.title', '대시보드 관리')}>
      <div className="mg-v2-ad-b0kla">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={t('admin:dashboardManagement.regionLabel', '대시보드 관리 본문')}>
            <ContentHeader
              title={t('admin:dashboardManagement.title', '대시보드 관리')}
              subtitle={t('admin:dashboardManagement.subtitle', '테넌트 역할별 대시보드를 구성·활성화합니다.')}
              titleId={DASHBOARD_MGMT_TITLE_ID}
              actions={(
                <MGButton
                  type="button"
                  variant="primary"
                  size="small"
                  onClick={handleCreate}
                  className={buildErpMgButtonClassName({
                    variant: 'primary',
                    size: 'sm',
                    loading,
                    className: 'btn-create-dashboard'
                  })}
                  loading={loading}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                >
                  {t('admin:dashboardManagement.createButton', '새 대시보드')}
                </MGButton>
              )}
            />
            <main
              aria-labelledby={DASHBOARD_MGMT_TITLE_ID}
              className="dashboard-management-container"
            >
        {/* 필터 및 검색 */}
        <div className="dashboard-management-filters">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder={t('admin:dashboardManagement.filters.searchPlaceholder', '대시보드 이름, 역할, 타입으로 검색...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <MGButton
                type="button"
                variant="outline"
                size="small"
                className={buildErpMgButtonClassName({
                  variant: 'outline',
                  size: 'sm',
                  loading: false,
                  className: 'clear-search'
                })}
                onClick={() => setSearchTerm('')}
                preventDoubleClick={false}
                loading={false}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                aria-label={t('admin:dashboardManagement.filters.clearAria', '검색어 지우기')}
              >
                {t('admin:dashboardManagement.filters.clearLabel', '지우기')}
              </MGButton>
            )}
          </div>

          <div className="filter-buttons">
            <MGButton
              type="button"
              variant={filterType === 'all' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setFilterType('all')}
              className={buildErpMgButtonClassName({
                variant: filterType === 'all' ? 'primary' : 'secondary',
                size: 'sm',
                loading: false,
                className: 'filter-btn'
              })}
              loading={false}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            >
              {t('admin:labels.all', '전체')}
            </MGButton>
            <MGButton
              type="button"
              variant={filterType === 'active' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setFilterType('active')}
              className={buildErpMgButtonClassName({
                variant: filterType === 'active' ? 'primary' : 'secondary',
                size: 'sm',
                loading: false,
                className: 'filter-btn'
              })}
              loading={false}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            >
              {t('admin:labels.active', '활성')}
            </MGButton>
            <MGButton
              type="button"
              variant={filterType === 'inactive' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setFilterType('inactive')}
              className={buildErpMgButtonClassName({
                variant: filterType === 'inactive' ? 'primary' : 'secondary',
                size: 'sm',
                loading: false,
                className: 'filter-btn'
              })}
              loading={false}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            >
              {t('admin:labels.inactive', '비활성')}
            </MGButton>
            <MGButton
              type="button"
              variant="secondary"
              size="small"
              onClick={loadDashboards}
              className={buildErpMgButtonClassName({
                variant: 'secondary',
                size: 'sm',
                loading,
                className: 'refresh-btn'
              })}
              loading={loading}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            >
              {t('admin:actions.refresh', '새로고침')}
            </MGButton>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && dashboards.length === 0 && (
          <div className="loading-container">
            <div className="mg-loading">{t('admin:dashboardManagement.loading', '로딩중...')}</div>
          </div>
        )}

        {/* 대시보드 목록 */}
        {!loading && filteredDashboards.length === 0 && (
          <div className="empty-state">
            <p>
              {searchTerm || filterType !== 'all'
                ? t('admin:dashboardManagement.empty.filtered', '검색 조건에 맞는 대시보드가 없습니다.')
                : t('admin:dashboardManagement.empty.none', '등록된 대시보드가 없습니다. 새 대시보드를 생성해주세요.')}
            </p>
          </div>
        )}

        {!loading && filteredDashboards.length > 0 && (
          <div className="dashboard-list">
            {filteredDashboards.map((dashboard) => (
              <div
                key={dashboard.dashboardId}
                className={`dashboard-card ${!dashboard.isActive ? 'inactive' : ''} ${dashboard.isDefault ? 'default' : ''}`}
              >
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <span className="dashboard-type-icon">
                      {getDashboardTypeIcon(dashboard.dashboardType)}
                    </span>
                    <div>
                      <h3>{dashboard.dashboardNameKo || dashboard.dashboardName}</h3>
                      {dashboard.dashboardNameEn && (
                        <p className="dashboard-name-en">{dashboard.dashboardNameEn}</p>
                      )}
                    </div>
                  </div>
                  <div className="dashboard-card-badges">
                    {dashboard.isDefault && (
                      <span className="badge badge-default">
                        <FaCheckCircle /> {t('admin:dashboardManagement.card.default', '기본')}
                      </span>
                    )}
                    {dashboard.isActive ? (
                      <span className="badge badge-active">
                        <FaEye /> {t('admin:labels.active', '활성')}
                      </span>
                    ) : (
                      <span className="badge badge-inactive">
                        <FaEyeSlash /> {t('admin:labels.inactive', '비활성')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="dashboard-card-body">
                  <div className="dashboard-info-row">
                    <span className="info-label">{t('admin:dashboardManagement.card.roleLabel', '역할:')}</span>
                    <span className="info-value">
                      {dashboard.roleNameKo || dashboard.tenantRoleId || '-'}
                    </span>
                  </div>
                  <div className="dashboard-info-row">
                    <span className="info-label">{t('admin:dashboardManagement.card.typeLabel', '타입:')}</span>
                    <span className="info-value">
                      {getDashboardTypeLabel(dashboard.dashboardType)}
                    </span>
                  </div>
                  {dashboard.description && (
                    <div className="dashboard-info-row">
                      <span className="info-label">{t('admin:dashboardManagement.card.descLabel', '설명:')}</span>
                      <span className="info-value description">
                        {dashboard.description}
                      </span>
                    </div>
                  )}
                  <div className="dashboard-info-row">
                    <span className="info-label">{t('admin:dashboardManagement.card.orderLabel', '표시 순서:')}</span>
                    <span className="info-value">{dashboard.displayOrder || 0}</span>
                  </div>
                </div>

                <div className="dashboard-card-actions">
                  <MGButton
                    type="button"
                    variant="primary"
                    size="small"
                    onClick={() => handleViewDashboard(dashboard)}
                    className={buildErpMgButtonClassName({
                      variant: 'primary',
                      size: 'sm',
                      loading: false,
                      className: 'btn-view'
                    })}
                    loading={false}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    title={t('admin:dashboardManagement.actions.viewTitle', '대시보드 보기 (새 탭에서 열기: Ctrl+클릭)')}
                  >
                    {t('admin:actions.view', '보기')}
                  </MGButton>
                  <MGButton
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔘 수정 버튼 클릭 이벤트:', dashboard);
                      handleEdit(dashboard);
                    }}
                    className={buildErpMgButtonClassName({
                      variant: 'secondary',
                      size: 'sm',
                      loading,
                      className: 'btn-edit'
                    })}
                    disabled={loading || !dashboard || !dashboard.dashboardId}
                    loading={loading}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    title={dashboard?.dashboardId ? t('admin:dashboardManagement.actions.editTitle', '대시보드 수정') : t('admin:dashboardManagement.actions.editMissingTitle', '대시보드 ID가 없습니다.')}
                  >
                    {t('common:action.edit', '수정')}
                  </MGButton>
                  <MGButton
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => handleToggleActive(dashboard)}
                    className={buildErpMgButtonClassName({
                      variant: 'secondary',
                      size: 'sm',
                      loading,
                      className: 'btn-toggle'
                    })}
                    loading={loading}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  >
                    {dashboard.isActive
                      ? t('admin:dashboardManagement.actions.deactivate', '비활성화')
                      : t('admin:dashboardManagement.actions.activate', '활성화')}
                  </MGButton>
                  {!dashboard.isDefault && (
                    <MGButton
                      type="button"
                      variant="danger"
                      size="small"
                      onClick={() => handleDelete(dashboard)}
                      className={buildErpMgButtonClassName({
                        variant: 'danger',
                        size: 'sm',
                        loading,
                        className: 'btn-delete'
                      })}
                      loading={loading}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    >
                      {t('admin:actions.delete', '삭제')}
                    </MGButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 대시보드 생성/수정 모달 */}
        <DashboardFormModal
          isOpen={showFormModal}
          onClose={handleModalClose}
          dashboard={selectedDashboard}
          onSave={handleModalSave}
        />

        {/* 통계 정보 */}
        {!loading && dashboards.length > 0 && (
          <div className="dashboard-stats">
            <div className="stat-item">
              <span className="stat-label">{t('admin:labels.all', '전체')}:</span>
              <span className="stat-value">{dashboards.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t('admin:labels.active', '활성')}:</span>
              <span className="stat-value active">
                {dashboards.filter(d => d.isActive).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t('admin:labels.inactive', '비활성')}:</span>
              <span className="stat-value inactive">
                {dashboards.filter(d => !d.isActive).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t('admin:dashboardManagement.badge.default', '기본')}:</span>
              <span className="stat-value default">
                {dashboards.filter(d => d.isDefault).length}
              </span>
            </div>
          </div>
        )}
            </main>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
    <ConfirmModal />
    </>
  );
};

export default DashboardManagement;

