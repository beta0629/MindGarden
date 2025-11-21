/**
 * 대시보드 관리 컴포넌트
 * 테넌트의 모든 대시보드를 관리하는 페이지
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */

import React, { useState, useEffect, useCallback } from 'react';
import MGButton from '../common/MGButton';
import UnifiedLoading from '../common/UnifiedLoading';
import SimpleLayout from '../layout/SimpleLayout';
import notificationManager from '../../utils/notification';
import { apiGet } from '../../utils/ajax';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { API_BASE_URL } from '../../constants/api';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaSearch, FaFilter, FaSync, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { LayoutDashboard, Settings, Users, Shield } from 'lucide-react';
import DashboardFormModal from './DashboardFormModal';
import './DashboardManagement.css';

const DashboardManagement = () => {
  const [dashboards, setDashboards] = useState([]);
  const [filteredDashboards, setFilteredDashboards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, active, inactive
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);

  // 대시보드 목록 로드
  const loadDashboards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet(`${API_BASE_URL}/api/v1/tenant/dashboards`);
      
      if (response && response.success && response.data) {
        const dashboardList = Array.isArray(response.data) ? response.data : [];
        setDashboards(dashboardList);
        console.log('✅ 대시보드 목록 로드 성공:', dashboardList.length, '개');
      } else {
        console.warn('⚠️ 대시보드 목록 응답 형식 오류:', response);
        setDashboards([]);
      }
    } catch (error) {
      console.error('❌ 대시보드 목록 로드 실패:', error);
      notificationManager.show('대시보드 목록을 불러오는 중 오류가 발생했습니다.', 'error');
      setDashboards([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
  const handleToggleActive = async (dashboard) => {
    if (!dashboard.dashboardId) {
      notificationManager.show('대시보드 ID가 없습니다.', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await csrfTokenManager.put(
        `${API_BASE_URL}/api/v1/tenant/dashboards/${dashboard.dashboardId}`,
        {
          ...dashboard,
          isActive: !dashboard.isActive
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          notificationManager.show(
            dashboard.isActive ? '대시보드가 비활성화되었습니다.' : '대시보드가 활성화되었습니다.',
            'success'
          );
          await loadDashboards();
        } else {
          throw new Error(result.message || '대시보드 상태 변경 실패');
        }
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || '대시보드 상태 변경 실패');
      }
    } catch (error) {
      console.error('❌ 대시보드 상태 변경 실패:', error);
      notificationManager.show(error.message || '대시보드 상태 변경 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 대시보드 삭제
  const handleDelete = async (dashboard) => {
    if (!dashboard.dashboardId) {
      notificationManager.show('대시보드 ID가 없습니다.', 'error');
      return;
    }

    // 기본 대시보드는 삭제 불가
    if (dashboard.isDefault) {
      notificationManager.show('기본 대시보드는 삭제할 수 없습니다. 비활성화만 가능합니다.', 'warning');
      return;
    }

    const confirmed = window.confirm(
      `"${dashboard.dashboardNameKo || dashboard.dashboardName}" 대시보드를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      const response = await csrfTokenManager.delete(
        `${API_BASE_URL}/api/v1/tenant/dashboards/${dashboard.dashboardId}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          notificationManager.show('대시보드가 삭제되었습니다.', 'success');
          await loadDashboards();
        } else {
          throw new Error(result.message || '대시보드 삭제 실패');
        }
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || '대시보드 삭제 실패');
      }
    } catch (error) {
      console.error('❌ 대시보드 삭제 실패:', error);
      notificationManager.show(error.message || '대시보드 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 대시보드 수정
  const handleEdit = (dashboard) => {
    setSelectedDashboard(dashboard);
    setShowFormModal(true);
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
  const handleModalSave = async () => {
    await loadDashboards();
    handleModalClose();
  };

  // 대시보드 타입 한글 변환
  const getDashboardTypeLabel = (type) => {
    const typeMap = {
      'STUDENT': '학생',
      'TEACHER': '선생님',
      'ADMIN': '관리자',
      'CLIENT': '내담자',
      'CONSULTANT': '상담사',
      'PRINCIPAL': '원장',
      'DEFAULT': '기본'
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

  return (
    <SimpleLayout>
      <div className="dashboard-management-container">
        {/* 헤더 */}
        <div className="dashboard-management-header">
          <div className="dashboard-management-title">
            <LayoutDashboard className="dashboard-icon" />
            <h2>대시보드 관리</h2>
          </div>
          <MGButton
            variant="primary"
            onClick={handleCreate}
            className="btn-create-dashboard"
          >
            <FaPlus /> 새 대시보드
          </MGButton>
        </div>

        {/* 필터 및 검색 */}
        <div className="dashboard-management-filters">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="대시보드 이름, 역할, 타입으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                <FaTimesCircle />
              </button>
            )}
          </div>

          <div className="filter-buttons">
            <MGButton
              variant={filterType === 'all' ? 'primary' : 'secondary'}
              onClick={() => setFilterType('all')}
              className="filter-btn"
            >
              전체
            </MGButton>
            <MGButton
              variant={filterType === 'active' ? 'primary' : 'secondary'}
              onClick={() => setFilterType('active')}
              className="filter-btn"
            >
              <FaEye /> 활성
            </MGButton>
            <MGButton
              variant={filterType === 'inactive' ? 'primary' : 'secondary'}
              onClick={() => setFilterType('inactive')}
              className="filter-btn"
            >
              <FaEyeSlash /> 비활성
            </MGButton>
            <MGButton
              variant="secondary"
              onClick={loadDashboards}
              className="refresh-btn"
            >
              <FaSync /> 새로고침
            </MGButton>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && dashboards.length === 0 && (
          <div className="loading-container">
            <UnifiedLoading message="대시보드를 불러오는 중..." />
          </div>
        )}

        {/* 대시보드 목록 */}
        {!loading && filteredDashboards.length === 0 && (
          <div className="empty-state">
            <LayoutDashboard className="empty-icon" />
            <p>
              {searchTerm || filterType !== 'all'
                ? '검색 조건에 맞는 대시보드가 없습니다.'
                : '등록된 대시보드가 없습니다. 새 대시보드를 생성해주세요.'}
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
                        <FaCheckCircle /> 기본
                      </span>
                    )}
                    {dashboard.isActive ? (
                      <span className="badge badge-active">
                        <FaEye /> 활성
                      </span>
                    ) : (
                      <span className="badge badge-inactive">
                        <FaEyeSlash /> 비활성
                      </span>
                    )}
                  </div>
                </div>

                <div className="dashboard-card-body">
                  <div className="dashboard-info-row">
                    <span className="info-label">역할:</span>
                    <span className="info-value">
                      {dashboard.roleNameKo || dashboard.tenantRoleId || '-'}
                    </span>
                  </div>
                  <div className="dashboard-info-row">
                    <span className="info-label">타입:</span>
                    <span className="info-value">
                      {getDashboardTypeLabel(dashboard.dashboardType)}
                    </span>
                  </div>
                  {dashboard.description && (
                    <div className="dashboard-info-row">
                      <span className="info-label">설명:</span>
                      <span className="info-value description">
                        {dashboard.description}
                      </span>
                    </div>
                  )}
                  <div className="dashboard-info-row">
                    <span className="info-label">표시 순서:</span>
                    <span className="info-value">{dashboard.displayOrder || 0}</span>
                  </div>
                </div>

                <div className="dashboard-card-actions">
                  <MGButton
                    variant="secondary"
                    onClick={() => handleEdit(dashboard)}
                    className="btn-edit"
                  >
                    <FaEdit /> 수정
                  </MGButton>
                  <MGButton
                    variant="secondary"
                    onClick={() => handleToggleActive(dashboard)}
                    className="btn-toggle"
                  >
                    {dashboard.isActive ? (
                      <>
                        <FaEyeSlash /> 비활성화
                      </>
                    ) : (
                      <>
                        <FaEye /> 활성화
                      </>
                    )}
                  </MGButton>
                  {!dashboard.isDefault && (
                    <MGButton
                      variant="danger"
                      onClick={() => handleDelete(dashboard)}
                      className="btn-delete"
                    >
                      <FaTrash /> 삭제
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
              <span className="stat-label">전체:</span>
              <span className="stat-value">{dashboards.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">활성:</span>
              <span className="stat-value active">
                {dashboards.filter(d => d.isActive).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">비활성:</span>
              <span className="stat-value inactive">
                {dashboards.filter(d => !d.isActive).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">기본:</span>
              <span className="stat-value default">
                {dashboards.filter(d => d.isDefault).length}
              </span>
            </div>
          </div>
        )}
      </div>
    </SimpleLayout>
  );
};

export default DashboardManagement;

