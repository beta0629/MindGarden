import React, { useState, useEffect, useCallback } from 'react';
import './PermissionManagement.css';

const PERMISSION_CATEGORIES = {
    '대시보드': [
        { code: 'ADMIN_DASHBOARD_VIEW', name: '관리자 대시보드', description: '관리자 대시보드 접근' },
        { code: 'HQ_DASHBOARD_VIEW', name: '본사 대시보드', description: '본사 대시보드 접근' },
        { code: 'ERP_ACCESS', name: 'ERP 시스템', description: 'ERP 시스템 접근' },
        { code: 'INTEGRATED_FINANCE_VIEW', name: '통합 재무 관리', description: '통합 재무 관리 시스템 접근' }
    ],
    '사용자 관리': [
        { code: 'USER_MANAGE', name: '사용자 관리', description: '사용자 등록, 수정, 삭제' },
        { code: 'CONSULTANT_MANAGE', name: '상담사 관리', description: '상담사 등록, 수정, 삭제' },
        { code: 'CLIENT_MANAGE', name: '고객 관리', description: '고객 정보 관리' }
    ],
    '지점 관리': [
        { code: 'BRANCH_MANAGE', name: '지점 관리', description: '지점 등록, 수정, 삭제' },
        { code: 'BRANCH_DETAILS_VIEW', name: '지점 상세 조회', description: '지점 상세 정보 조회' }
    ],
    '일정 관리': [
        { code: 'SCHEDULE_MANAGE', name: '일정 관리', description: '일정 전체 관리' },
        { code: 'SCHEDULE_CREATE', name: '일정 생성', description: '새 일정 생성' },
        { code: 'SCHEDULE_MODIFY', name: '일정 수정', description: '기존 일정 수정' },
        { code: 'SCHEDULE_DELETE', name: '일정 삭제', description: '일정 삭제' }
    ],
    'ERP 하위 메뉴': [
        { code: 'SALARY_MANAGE', name: '급여 관리', description: '급여 관리 시스템' },
        { code: 'TAX_MANAGE', name: '세금 관리', description: '세금 관리 시스템' },
        { code: 'REFUND_MANAGE', name: '환불 관리', description: '환불 관리 시스템' },
        { code: 'PURCHASE_REQUEST_VIEW', name: '구매 요청', description: '구매 요청 시스템' },
        { code: 'APPROVAL_MANAGE', name: '승인 관리', description: '승인 관리 시스템' },
        { code: 'ITEM_MANAGE', name: '아이템 관리', description: '아이템 관리 시스템' },
        { code: 'BUDGET_MANAGE', name: '예산 관리', description: '예산 관리 시스템' }
    ],
    '매핑 관리': [
        { code: 'MAPPING_VIEW', name: '매핑 조회', description: '상담사-내담자 매핑 조회' },
        { code: 'MAPPING_MANAGE', name: '매핑 관리', description: '상담사-내담자 매핑 관리' }
    ],
    '통계 및 조회': [
        { code: 'STATISTICS_VIEW', name: '통계 조회', description: '전체 통계 조회' },
        { code: 'FINANCIAL_VIEW', name: '재무 조회', description: '재무 정보 조회' },
        { code: 'CONSULTATION_STATISTICS_VIEW', name: '상담 통계', description: '상담 통계 조회' },
        { code: 'CONSULTATION_RECORD_VIEW', name: '상담 기록', description: '상담 기록 조회' }
    ]
};

const ROLE_PERMISSIONS = {
    'BRANCH_SUPER_ADMIN': [
        'ADMIN_DASHBOARD_VIEW', 'ERP_ACCESS', 'INTEGRATED_FINANCE_VIEW',
        'SALARY_MANAGE', 'TAX_MANAGE', 'REFUND_MANAGE', 'PURCHASE_REQUEST_VIEW',
        'APPROVAL_MANAGE', 'ITEM_MANAGE', 'BUDGET_MANAGE', 'USER_MANAGE',
        'CONSULTANT_MANAGE', 'CLIENT_MANAGE', 'MAPPING_VIEW', 'MAPPING_MANAGE',
        'BRANCH_DETAILS_VIEW', 'SCHEDULE_MANAGE', 'SCHEDULE_CREATE', 'SCHEDULE_MODIFY', 'SCHEDULE_DELETE',
        'CONSULTATION_RECORD_VIEW', 'STATISTICS_VIEW', 'FINANCIAL_VIEW',
        'CONSULTATION_STATISTICS_VIEW'
    ],
    'BRANCH_ADMIN': [
        'ADMIN_DASHBOARD_VIEW', 'USER_MANAGE', 'CONSULTANT_MANAGE', 'CLIENT_MANAGE',
        'BRANCH_DETAILS_VIEW', 'SCHEDULE_MANAGE', 'SCHEDULE_CREATE', 'SCHEDULE_MODIFY',
        'SCHEDULE_DELETE', 'CONSULTATION_RECORD_VIEW', 'STATISTICS_VIEW',
        'CONSULTATION_STATISTICS_VIEW', 'MAPPING_VIEW'
    ],
    'CONSULTANT': [
        'SCHEDULE_MANAGE', 'SCHEDULE_CREATE', 'SCHEDULE_MODIFY', 'SCHEDULE_DELETE',
        'CONSULTATION_RECORD_VIEW', 'CLIENT_MANAGE'
    ],
    'CLIENT': [
        'SCHEDULE_VIEW', 'CONSULTATION_RECORD_VIEW'
    ],
    'ADMIN': [
        'ADMIN_DASHBOARD_VIEW', 'USER_MANAGE', 'CONSULTANT_MANAGE', 'CLIENT_MANAGE',
        'BRANCH_DETAILS_VIEW', 'SCHEDULE_MANAGE', 'SCHEDULE_CREATE', 'SCHEDULE_MODIFY',
        'SCHEDULE_DELETE', 'CONSULTATION_RECORD_VIEW', 'STATISTICS_VIEW',
        'CONSULTATION_STATISTICS_VIEW'
    ],
    'HQ_ADMIN': [
        'HQ_DASHBOARD_VIEW', 'BRANCH_MANAGE', 'USER_MANAGE', 'STATISTICS_VIEW',
        'FINANCIAL_VIEW', 'CONSULTATION_STATISTICS_VIEW'
    ],
    'SUPER_HQ_ADMIN': [
        'HQ_DASHBOARD_VIEW', 'BRANCH_MANAGE', 'USER_MANAGE', 'STATISTICS_VIEW',
        'FINANCIAL_VIEW', 'CONSULTATION_STATISTICS_VIEW', 'ERP_ACCESS'
    ],
    'HQ_MASTER': [
        'HQ_DASHBOARD_VIEW', 'BRANCH_MANAGE', 'USER_MANAGE', 'STATISTICS_VIEW',
        'FINANCIAL_VIEW', 'CONSULTATION_STATISTICS_VIEW', 'ERP_ACCESS',
        'INTEGRATED_FINANCE_VIEW'
    ]
};

// 역할 계층 구조 (높은 등급이 낮은 등급을 관리할 수 있음)
const ROLE_HIERARCHY = {
    'HQ_MASTER': ['HQ_MASTER', 'SUPER_HQ_ADMIN', 'HQ_ADMIN', 'ADMIN', 'BRANCH_SUPER_ADMIN', 'BRANCH_ADMIN', 'CONSULTANT', 'CLIENT'],
    'SUPER_HQ_ADMIN': ['SUPER_HQ_ADMIN', 'HQ_ADMIN', 'ADMIN', 'BRANCH_SUPER_ADMIN', 'BRANCH_ADMIN', 'CONSULTANT', 'CLIENT'],
    'HQ_ADMIN': ['HQ_ADMIN', 'ADMIN', 'BRANCH_SUPER_ADMIN', 'BRANCH_ADMIN', 'CONSULTANT', 'CLIENT'],
    'ADMIN': ['ADMIN', 'BRANCH_SUPER_ADMIN', 'BRANCH_ADMIN', 'CONSULTANT', 'CLIENT'],
    'BRANCH_SUPER_ADMIN': ['BRANCH_SUPER_ADMIN', 'BRANCH_ADMIN', 'CONSULTANT', 'CLIENT'], // 지점수퍼관리자는 지점 내 하위 역할 관리 가능
    'BRANCH_ADMIN': ['BRANCH_ADMIN', 'CONSULTANT', 'CLIENT'] // 지점관리자는 상담사, 내담자 관리 가능
};

// 역할별 표시명
const ROLE_DISPLAY_NAMES = {
    'BRANCH_SUPER_ADMIN': '지점 수퍼관리자',
    'BRANCH_ADMIN': '지점 관리자',
    'CONSULTANT': '상담사',
    'CLIENT': '내담자',
    'ADMIN': '관리자',
    'HQ_ADMIN': '본사 관리자',
    'SUPER_HQ_ADMIN': '수퍼 본사 관리자',
    'HQ_MASTER': '본사 마스터'
};

const PermissionManagement = () => {
    const [userPermissions, setUserPermissions] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [selectedRole, setSelectedRole] = useState('BRANCH_SUPER_ADMIN');
    const [rolePermissions, setRolePermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchUserInfo = async () => {
        try {
            const response = await fetch('/api/auth/current-user', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                console.error('사용자 정보 조회 실패:', response.status);
                return null;
            }
        } catch (error) {
            console.error('사용자 정보 조회 실패:', error);
            return null;
        }
    };

    const loadUserPermissions = useCallback(async () => {
        try {
            // 실제 사용자 권한 로드
            const response = await fetch('/api/permissions/my-permissions', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success && data.data && data.data.permissions) {
                setUserPermissions(data.data.permissions);
                console.log('✅ 사용자 권한 로드 완료:', data.data.permissions.length, '개');
                
                // 현재 사용자의 역할 가져오기
                const userInfo = await fetchUserInfo();
                if (userInfo && userInfo.role) {
                    setCurrentUserRole(userInfo.role);
                    // 사용자 역할에 따라 기본 선택 역할 설정
                    if (userInfo.role === 'HQ_MASTER') {
                        setSelectedRole('BRANCH_SUPER_ADMIN'); // HQ 마스터는 모든 역할 관리 가능
                    } else {
                        setSelectedRole(userInfo.role); // 다른 역할은 자신의 역할만 관리 가능
                    }
                }
            } else {
                console.error('❌ 권한 로드 실패:', data.message);
                setMessage('권한을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ 권한 로드 실패:', error);
            setMessage('권한을 불러오는데 실패했습니다.');
        }
    }, []);

    const loadRolePermissions = useCallback(() => {
        const permissions = ROLE_PERMISSIONS[selectedRole] || [];
        setRolePermissions(permissions);
    }, [selectedRole]);

    useEffect(() => {
        loadUserPermissions();
    }, [loadUserPermissions]);

    useEffect(() => {
        loadRolePermissions();
    }, [loadRolePermissions]);

    const handlePermissionToggle = (permissionCode) => {
        setRolePermissions(prev => {
            if (prev.includes(permissionCode)) {
                return prev.filter(p => p !== permissionCode);
            } else {
                return [...prev, permissionCode];
            }
        });
    };

    const handleSavePermissions = async () => {
        setLoading(true);
        setMessage('');
        
        try {
            const response = await fetch('/api/permissions/role-permissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    roleName: selectedRole,
                    permissionCodes: rolePermissions
                })
            });

            if (response.ok) {
                setMessage('권한이 성공적으로 저장되었습니다.');
                loadUserPermissions(); // 현재 사용자 권한 새로고침
            } else {
                const error = await response.json();
                setMessage(`저장 실패: ${error.message || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error('권한 저장 실패:', error);
            setMessage('권한 저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (permissionCode) => {
        return userPermissions.includes(permissionCode);
    };

    // 권한 관리는 지점 수퍼 어드민 이상만 가능
    const canManagePermissions = currentUserRole === 'BRANCH_SUPER_ADMIN' || 
                                currentUserRole === 'HQ_ADMIN' || 
                                currentUserRole === 'SUPER_HQ_ADMIN' || 
                                currentUserRole === 'HQ_MASTER';
    const isHQMaster = currentUserRole === 'HQ_MASTER';

    console.log('🔍 PermissionManagement 권한 체크:', {
        userPermissions,
        canManagePermissions,
        currentUserRole
    });

    if (loading) {
        return (
            <div className="permission-management">
                <div className="permission-loading">
                    <h3>⏳ 권한 정보 로딩 중...</h3>
                    <p>잠시만 기다려주세요.</p>
                </div>
            </div>
        );
    }

    if (!canManagePermissions) {
        return (
            <div className="permission-management">
                <div className="permission-error">
                    <h3>🚫 접근 권한 없음</h3>
                    <p>권한 관리를 위해서는 지점 수퍼 어드민 이상의 권한이 필요합니다.</p>
                    <p>현재 역할: {currentUserRole || '알 수 없음'}</p>
                </div>
            </div>
        );
    }

    // 현재 사용자가 관리할 수 있는 역할 목록
    const getManageableRoles = () => {
        if (isHQMaster) {
            return Object.keys(ROLE_PERMISSIONS);
        } else if (currentUserRole) {
            return ROLE_HIERARCHY[currentUserRole] || [currentUserRole];
        }
        return [currentUserRole];
    };

    const manageableRoles = getManageableRoles();

    return (
        <div className="permission-management">
            <div className="permission-header">
                <h2>🔐 권한 관리</h2>
                <p>역할별 권한을 설정하고 관리할 수 있습니다.</p>
            </div>

            {message && (
                <div className={`permission-message ${message.includes('성공') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <div className="permission-controls">
                <div className="role-selector">
                    <label htmlFor="role-select">역할 선택:</label>
                    <select 
                        id="role-select"
                        value={selectedRole} 
                        onChange={(e) => setSelectedRole(e.target.value)}
                        disabled={!isHQMaster && manageableRoles.length === 1}
                    >
                        {manageableRoles.map(role => (
                            <option key={role} value={role}>
                                {ROLE_DISPLAY_NAMES[role] || role}
                            </option>
                        ))}
                    </select>
                    {!isHQMaster && (
                        <small className="role-restriction">
                            {ROLE_DISPLAY_NAMES[currentUserRole] || currentUserRole}는 자신의 역할만 관리할 수 있습니다.
                        </small>
                    )}
                </div>
                
                <button 
                    className="save-button"
                    onClick={handleSavePermissions}
                    disabled={loading}
                >
                    {loading ? '저장 중...' : '권한 저장'}
                </button>
            </div>

            <div className="permission-categories">
                {Object.entries(PERMISSION_CATEGORIES).map(([categoryName, permissions]) => (
                    <div key={categoryName} className="permission-category">
                        <h3>{categoryName}</h3>
                        <div className="permission-list">
                            {permissions.map(permission => (
                                <div key={permission.code} className="permission-item">
                                    <label className="permission-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={rolePermissions.includes(permission.code)}
                                            onChange={() => handlePermissionToggle(permission.code)}
                                        />
                                        <span className="permission-name">{permission.name}</span>
                                    </label>
                                    <p className="permission-description">{permission.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="permission-summary">
                <h3>현재 선택된 권한 ({rolePermissions.length}개)</h3>
                <div className="selected-permissions">
                    {rolePermissions.map(permissionCode => {
                        const permission = Object.values(PERMISSION_CATEGORIES)
                            .flat()
                            .find(p => p.code === permissionCode);
                        return (
                            <span key={permissionCode} className="permission-tag">
                                {permission ? permission.name : permissionCode}
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PermissionManagement;
