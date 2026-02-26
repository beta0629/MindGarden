/**
 * 권한 그룹 관리 UI (Presentational Component)
 * 
 * 순수 UI 컴포넌트 - 비즈니스 로직 없음
 * Props를 통해 데이터와 이벤트 핸들러를 받아 렌더링만 수행
/**
 * 
/**
 * 표준화 준수:
/**
 * - BEM 네이밍 (mg-{component}-{element}--{modifier})
/**
 * - CSS 변수 사용 (--mg-* 접두사)
/**
 * - 하드코딩 금지
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0
/**
 * @since 2025-12-03
 */

import React from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import './PermissionGroupManagementUI.css';

const PermissionGroupManagementUI = ({
    roles,
    selectedRole,
    permissionGroups,
    rolePermissions,
    loading,
    error,
    onRoleSelect,
    onGrantPermission,
    onRevokePermission,
    onBatchGrant
}) => {
/**
     * 권한 레벨 한글 변환
     */
    const getAccessLevelName = (level) => {
        const names = {
            'READ': '읽기',
            'WRITE': '쓰기',
            'FULL': '전체'
        };
        return names[level] || level;
    };

/**
     * 그룹에 권한이 있는지 확인
     */
    const hasPermission = (groupCode) => {
        return rolePermissions.has(groupCode);
    };

/**
     * 그룹의 권한 레벨 조회
     */
    const getPermissionLevel = (groupCode) => {
        return rolePermissions.get(groupCode) || null;
    };

/**
     * 권한 그룹 트리 렌더링 (재귀)
     */
    const renderGroupTree = (groups, depth = 0) => {
        if (!groups || groups.length === 0) {
            return null;
        }

        // 깊이에 따른 CSS 클래스 생성
        const depthClass = depth > 0 ? `mg-depth-${depth}` : '';

        return (
            <ul className={`mg-permission-group-tree ${depth > 0 ? 'mg-nested' : ''}`}>
                {groups.map(group => (
                    <li key={group.groupCode} className={`mg-permission-group-item ${depthClass}`}>
                        <div className="mg-permission-group-row">
                            <div className="mg-permission-group-info">
                                <i className={`bi ${group.icon || 'bi-folder'} mg-group-icon`}></i>
                                <div className="mg-group-details">
                                    <span className="mg-group-name">{group.groupName}</span>
                                    <span className="mg-group-code">({group.groupCode})</span>
                                    {group.description && (
                                        <span className="mg-group-description">{group.description}</span>
                                    )}
                                </div>
                            </div>

                            <div className="mg-permission-group-actions">
                                {hasPermission(group.groupCode) ? (
                                    <>
                                        <span className="mg-permission-badge mg-permission-badge--active">
                                            {getAccessLevelName(getPermissionLevel(group.groupCode))}
                                        </span>
                                        <button
                                            className="mg-btn mg-btn-danger mg-btn-sm"
                                            onClick={() => onRevokePermission(group.groupCode)}
                                            disabled={loading}
                                        >
                                            회수
                                        </button>
                                    </>
                                ) : (
                                    <div className="mg-permission-grant-buttons">
                                        <button
                                            className="mg-btn mg-btn-primary mg-btn-sm"
                                            onClick={() => onGrantPermission(group.groupCode, 'READ')}
                                            disabled={loading}
                                        >
                                            읽기
                                        </button>
                                        <button
                                            className="mg-btn mg-btn-primary mg-btn-sm"
                                            onClick={() => onGrantPermission(group.groupCode, 'WRITE')}
                                            disabled={loading}
                                        >
                                            쓰기
                                        </button>
                                        <button
                                            className="mg-btn mg-btn-primary mg-btn-sm"
                                            onClick={() => onGrantPermission(group.groupCode, 'FULL')}
                                            disabled={loading}
                                        >
                                            전체
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 하위 그룹 렌더링 (재귀) */}
                        {group.children && group.children.length > 0 && (
                            <div className="mg-permission-group-children">
                                {renderGroupTree(group.children, depth + 1)}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="mg-permission-group-management">
            <div className="mg-header">
                <h2 className="mg-title">권한 그룹 설정</h2>
                {selectedRole && (
                    <div className="mg-selected-role">
                        <i className="bi bi-person-badge"></i>
                        <span>{selectedRole.nameKo || selectedRole.nameEn}</span>
                    </div>
                )}
            </div>

            {error && (
                <div className="mg-error-message">
                    <span className="mg-error-icon">⚠️</span>
                    {error}
                </div>
            )}

            <div className="mg-content">
                {/* 좌측: 역할 목록 */}
                <div className="mg-sidebar">
                    <h3 className="mg-sidebar-title">역할 선택</h3>
                    {loading && !selectedRole ? (
                        <UnifiedLoading type="inline" text="로딩 중..." />
                    ) : (
                        <ul className="mg-role-list">
                            {roles.map(role => (
                                <li
                                    key={role.tenantRoleId}
                                    className={`mg-role-item ${selectedRole?.tenantRoleId === role.tenantRoleId ? 'mg-active' : ''}`}
                                    onClick={() => onRoleSelect(role)}
                                >
                                    <i className="bi bi-person-badge mg-role-icon"></i>
                                    <div className="mg-role-info">
                                        <span className="mg-role-name">{role.nameKo || role.nameEn}</span>
                                        <span className="mg-role-code">({role.nameEn})</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* 우측: 권한 그룹 목록 */}
                <div className="mg-main-content">
                    {!selectedRole ? (
                        <div className="mg-empty-state">
                            <i className="bi bi-info-circle mg-empty-icon"></i>
                            <p>역할을 선택하여 권한을 설정하세요.</p>
                        </div>
                    ) : loading ? (
                        <UnifiedLoading type="inline" text="권한 그룹을 불러오는 중..." />
                    ) : (
                        <div className="mg-permission-groups">
                            <div className="mg-permission-groups-header">
                                <h3 className="mg-section-title">권한 그룹 목록</h3>
                                <p className="mg-section-description">
                                    역할에 부여할 권한 그룹을 선택하세요. 하위 그룹은 상위 그룹 권한을 상속받습니다.
                                </p>
                            </div>
                            {permissionGroups.length === 0 ? (
                                <div className="mg-empty-state">
                                    <i className="bi bi-folder-x mg-empty-icon"></i>
                                    <p>권한 그룹이 없습니다.</p>
                                </div>
                            ) : (
                                <div className="mg-permission-group-list">
                                    {renderGroupTree(permissionGroups)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PermissionGroupManagementUI;

