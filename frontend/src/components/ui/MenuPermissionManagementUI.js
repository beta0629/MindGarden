/**
 * 메뉴 권한 관리 UI (Presentational Component)
 * 
 * 순수 UI 컴포넌트 - 비즈니스 로직 없음
 * Props를 통해 데이터와 이벤트 핸들러를 받아 렌더링만 수행
 * 
 * 표준화 준수:
 * - BEM 네이밍 (mg-{component}-{element}--{modifier})
 * - CSS 변수 사용 (--mg-* 접두사)
 * - 하드코딩 금지
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */

import React from 'react';
import './MenuPermissionManagementUI.css';

const MenuPermissionManagementUI = ({
    roles,
    selectedRole,
    menuPermissions,
    loading,
    error,
    onRoleSelect,
    onPermissionChange,
    onBatchSave
}) => {
    /**
     * 위치명 한글 변환
     */
    const getLocationName = (location) => {
        const names = {
            'DASHBOARD': '일반 대시보드',
            'ADMIN_ONLY': '관리자 전용',
            'BOTH': '양쪽 모두'
        };
        return names[location] || location;
    };

    /**
     * 권한 부여 가능 여부 확인
     */
    const canGrantPermission = (userRole, minRequiredRole) => {
        const roleHierarchy = {
            'ADMIN': 4,
            'STAFF': 3,
            'CONSULTANT': 2,
            'CLIENT': 1
        };
        
        const userLevel = roleHierarchy[userRole] || 0;
        const requiredLevel = roleHierarchy[minRequiredRole] || 0;
        
        return userLevel >= requiredLevel;
    };

    return (
        <div className="mg-menu-permission-management">
            <div className="mg-header">
                <h2 className="mg-title">메뉴 권한 설정</h2>
                {selectedRole && (
                    <button className="mg-btn mg-btn-primary" onClick={onBatchSave}>
                        변경사항 저장
                    </button>
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
                        <div className="mg-loading">로딩 중...</div>
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

                {/* 우측: 메뉴 권한 목록 */}
                <div className="mg-main-content">
                    {selectedRole ? (
                        <>
                            <div className="mg-role-header">
                                <h3 className="mg-role-title">{selectedRole.nameKo || selectedRole.nameEn} 역할의 메뉴 권한</h3>
                                <p className="mg-role-description">
                                    이 역할에 부여할 메뉴 접근 권한을 설정하세요.
                                </p>
                            </div>

                            {loading ? (
                                <div className="mg-loading">로딩 중...</div>
                            ) : (
                                <>
                                    <table className="mg-permission-table">
                                        <thead>
                                            <tr>
                                                <th>메뉴명</th>
                                                <th>경로</th>
                                                <th>위치</th>
                                                <th>최소 요구 역할</th>
                                                <th>조회</th>
                                                <th>생성</th>
                                                <th>수정</th>
                                                <th>삭제</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {menuPermissions.map(menu => {
                                                const canGrant = canGrantPermission(selectedRole.nameEn, menu.minRequiredRole);
                                                
                                                return (
                                                    <tr key={menu.menuId}>
                                                        <td>
                                                            <strong className="mg-menu-name">{menu.menuName}</strong>
                                                            <br />
                                                            <small className="mg-menu-code">{menu.menuCode}</small>
                                                        </td>
                                                        <td><code className="mg-menu-path">{menu.menuPath}</code></td>
                                                        <td>
                                                            <span className={`mg-badge mg-location-${menu.menuLocation.toLowerCase()}`}>
                                                                {getLocationName(menu.menuLocation)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="mg-badge mg-role-badge">
                                                                {menu.minRequiredRole}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={menu.canView || false}
                                                                onChange={e => onPermissionChange(menu.menuId, 'canView', e.target.checked)}
                                                                disabled={!canGrant}
                                                                className="mg-checkbox"
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={menu.canCreate || false}
                                                                onChange={e => onPermissionChange(menu.menuId, 'canCreate', e.target.checked)}
                                                                disabled={!menu.canView || !canGrant}
                                                                className="mg-checkbox"
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={menu.canUpdate || false}
                                                                onChange={e => onPermissionChange(menu.menuId, 'canUpdate', e.target.checked)}
                                                                disabled={!menu.canView || !canGrant}
                                                                className="mg-checkbox"
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={menu.canDelete || false}
                                                                onChange={e => onPermissionChange(menu.menuId, 'canDelete', e.target.checked)}
                                                                disabled={!menu.canView || !canGrant}
                                                                className="mg-checkbox"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    <div className="mg-help-text">
                                        <i className="bi bi-info-circle mg-help-icon"></i>
                                        <div className="mg-help-content">
                                            <p className="mg-help-title">권한 부여 규칙:</p>
                                            <ul className="mg-help-list">
                                                <li>최소 요구 역할보다 낮은 역할에게는 권한을 부여할 수 없습니다.</li>
                                                <li>조회 권한이 없으면 생성/수정/삭제 권한을 부여할 수 없습니다.</li>
                                                <li>ADMIN 역할은 모든 메뉴에 접근할 수 있습니다.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="mg-empty-state">
                            <i className="bi bi-shield-lock mg-empty-icon"></i>
                            <p className="mg-empty-text">좌측에서 역할을 선택하세요</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MenuPermissionManagementUI;

