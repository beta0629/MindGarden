import React, { useState, useEffect, useCallback } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import '../../styles/mindgarden-design-system.css';

const PERMISSION_CATEGORIES = {
    '대시보드 및 보고서': [
        { code: 'ADMIN_DASHBOARD_VIEW', name: '관리자 대시보드', description: '관리자 대시보드 전체 접근' },
        { code: 'HQ_DASHBOARD_VIEW', name: '본사 대시보드', description: '본사 대시보드 전체 접근 (성과지표, ERP보고서 포함)' },
        { code: 'DASHBOARD_VIEW', name: '대시보드 조회', description: '대시보드 통계 및 데이터 조회' },
        { code: 'REPORT_VIEW', name: '보고서 조회', description: '보고서 및 통계 조회 (성과지표 포함)' },
        { code: 'ERP_ACCESS', name: 'ERP 시스템', description: 'ERP 시스템 전체 접근' },
        { code: 'ERP_DASHBOARD_VIEW', name: 'ERP 대시보드', description: 'ERP 대시보드 조회' },
        { code: 'INTEGRATED_FINANCE_VIEW', name: '통합 재무 관리', description: '통합 재무 관리 시스템 접근' }
    ],
    '사용자 관리': [
        { code: 'USER_VIEW', name: '사용자 조회', description: '사용자 목록 및 정보 조회' },
        { code: 'USER_MANAGE', name: '사용자 관리', description: '사용자 등록, 수정, 삭제' },
        { code: 'USER_ROLE_CHANGE', name: '사용자 역할 변경', description: '사용자 역할 변경 권한' },
        { code: 'CONSULTANT_VIEW', name: '상담사 조회', description: '상담사 목록 및 정보 조회' },
        { code: 'CONSULTANT_MANAGE', name: '상담사 관리', description: '상담사 등록, 수정, 삭제' },
        { code: 'CLIENT_VIEW', name: '고객 조회', description: '고객 목록 및 정보 조회' },
        { code: 'CLIENT_MANAGE', name: '고객 관리', description: '고객 정보 관리' }
    ],
    '상담사 상세 관리': [
        { code: 'CONSULTANT_FUNCTIONS_VIEW', name: '상담사 기능 조회', description: '상담사 기능 및 역할 조회' },
        { code: 'CONSULTANT_SPECIALTY_MANAGE', name: '상담사 전문분야 관리', description: '상담사 전문분야 관리' },
        { code: 'CONSULTANT_AVAILABILITY_MANAGE', name: '상담사 가능시간 관리', description: '상담사 가능시간 설정/수정' },
        { code: 'VACATION_MANAGE', name: '휴가 관리', description: '상담사 휴가 등록/관리' },
        { code: 'CONSULTANT_TRANSFER', name: '상담사 이동', description: '상담사 다른 지점으로 이동' },
        { code: 'CONSULTANT_RATING_VIEW', name: '상담사 평가 조회', description: '상담사 평가 정보 조회' }
    ],
    '지점 관리': [
        { code: 'BRANCH_VIEW', name: '지점 조회', description: '지점 목록 및 정보 조회' },
        { code: 'BRANCH_MANAGE', name: '지점 관리', description: '지점 등록, 수정, 삭제' },
        { code: 'BRANCH_DETAILS_VIEW', name: '지점 상세 조회', description: '지점 상세 정보 조회' },
        { code: 'BRANCH_FINANCIAL_VIEW', name: '지점 재무 조회', description: '지점 재무 정보 조회' }
    ],
    '매핑 관리': [
        { code: 'MAPPING_VIEW', name: '매핑 조회', description: '상담사-내담자 매핑 조회' },
        { code: 'MAPPING_MANAGE', name: '매핑 관리', description: '상담사-내담자 매핑 생성/수정/삭제' },
        { code: 'CONSULTATION_PACKAGE_MANAGE', name: '상담 패키지 관리', description: '상담 패키지 설정 및 관리' },
        { code: 'DUPLICATE_MAPPING_MANAGE', name: '중복 매핑 관리', description: '중복 매핑 처리' }
    ],
    '일정 관리': [
        { code: 'SCHEDULE_VIEW', name: '일정 조회', description: '일정 목록 및 정보 조회' },
        { code: 'SCHEDULE_MANAGE', name: '일정 관리', description: '일정 전체 관리 (생성/수정/삭제)' }
    ],
    '상담일지 및 기록': [
        { code: 'CONSULTATION_RECORD_VIEW', name: '상담 기록 조회', description: '상담 기록 조회' },
        { code: 'CONSULTATION_RECORD_MANAGE', name: '상담 기록 관리', description: '상담 기록 생성/수정' },
        { code: 'CONSULTATION_HISTORY_VIEW', name: '상담 이력 조회', description: '상담 이력 전체 조회' },
        { code: 'CONSULTATION_STATISTICS_VIEW', name: '상담 통계 조회', description: '상담 통계 조회' },
        { code: 'CONSULTATION_REPORT_VIEW', name: '상담 보고서 조회', description: '상담 보고서 조회' }
    ],
    '재무 관리': [
        { code: 'FINANCIAL_VIEW', name: '재무 조회', description: '재무 정보 조회' },
        { code: 'FINANCIAL_MANAGE', name: '재무 관리', description: '재무 정보 생성/수정/삭제' },
        { code: 'TAX_MANAGE', name: '세금 관리', description: '세금 계산 및 관리' },
        { code: 'SALARY_MANAGE', name: '급여 관리', description: '급여 계산 및 관리' },
        { code: 'REFUND_MANAGE', name: '환불 관리', description: '환불 처리 및 관리' },
        { code: 'ANNUAL_FINANCIAL_REPORT_VIEW', name: '연간 재무 보고서', description: '연간 재무 보고서 조회' }
    ],
    '결제 관리': [
        { code: 'PAYMENT_ACCESS', name: '결제 접근', description: '결제 시스템 접근' },
        { code: 'PAYMENT_METHOD_MANAGE', name: '결제 수단 관리', description: '결제 수단 설정 및 관리' }
    ],
    'ERP 구매 및 승인': [
        { code: 'PURCHASE_REQUEST_VIEW', name: '구매 요청 조회', description: '구매 요청 목록 조회' },
        { code: 'PURCHASE_REQUEST_MANAGE', name: '구매 요청 관리', description: '구매 요청 생성/수정' },
        { code: 'APPROVAL_MANAGE', name: '승인 관리', description: '구매/결제 승인 처리' },
        { code: 'ITEM_MANAGE', name: '아이템 관리', description: '구매 가능한 아이템 관리' },
        { code: 'BUDGET_MANAGE', name: '예산 관리', description: '예산 설정 및 관리' }
    ],
    '통계 및 분석': [
        { code: 'STATISTICS_VIEW', name: '통계 조회', description: '전체 통계 조회' },
        { code: 'DATA_EXPORT', name: '데이터 내보내기', description: '데이터 엑셀 등 내보내기' },
        { code: 'DATA_IMPORT', name: '데이터 가져오기', description: '엑셀 등에서 데이터 가져오기' }
    ],
    '시스템 관리': [
        { code: 'PERMISSION_MANAGEMENT', name: '권한 관리', description: '사용자 권한 설정 및 관리' },
        { code: 'SYSTEM_SETTINGS_MANAGE', name: '시스템 설정 관리', description: '시스템 전체 설정 관리' },
        { code: 'BUSINESS_TIME_MANAGE', name: '업무 시간 관리', description: '업무 시간 설정 및 관리' },
        { code: 'CONSULTATION_TYPE_MANAGE', name: '상담 유형 관리', description: '상담 유형 설정 및 관리' },
        { code: 'COMMON_CODE_MANAGE', name: '공통코드 관리', description: '시스템 공통코드 관리' },
        { code: 'NOTIFICATION_MANAGE', name: '알림 관리', description: '사용자 알림 설정' },
        { code: 'SYSTEM_NOTIFICATION_MANAGE', name: '시스템 알림 관리', description: '시스템 전체 알림 관리' },
        { code: 'MENU_MANAGE', name: '메뉴 관리', description: '메뉴 구조 관리' }
    ],
    '감사 및 모니터링': [
        { code: 'AUDIT_LOG_VIEW', name: '감사 로그 조회', description: '시스템 감사 로그 조회' },
        { code: 'SYSTEM_HEALTH_CHECK', name: '시스템 건강 체크', description: '시스템 상태 모니터링' }
    ],
    '고객 지원': [
        { code: 'ANNOUNCEMENT_MANAGE', name: '공지사항 관리', description: '공지사항 작성 및 관리' },
        { code: 'FAQ_MANAGE', name: 'FAQ 관리', description: 'FAQ 작성 및 관리' },
        { code: 'CUSTOMER_SUPPORT_MANAGE', name: '고객 지원 관리', description: '고객 지원 관리' }
    ],
    '소셜 계정': [
        { code: 'SOCIAL_ACCOUNT_VIEW', name: '소셜 계정 조회', description: '소셜 계정 연동 정보 조회' }
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
        'HQ_DASHBOARD_VIEW', 'DASHBOARD_VIEW', 'REPORT_VIEW', 'BRANCH_MANAGE', 'USER_MANAGE', 'STATISTICS_VIEW',
        'FINANCIAL_VIEW', 'CONSULTATION_STATISTICS_VIEW'
    ],
    'SUPER_HQ_ADMIN': [
        'HQ_DASHBOARD_VIEW', 'DASHBOARD_VIEW', 'REPORT_VIEW', 'BRANCH_MANAGE', 'USER_MANAGE', 'STATISTICS_VIEW',
        'FINANCIAL_VIEW', 'CONSULTATION_STATISTICS_VIEW', 'ERP_ACCESS'
    ],
    'HQ_MASTER': [
        'HQ_DASHBOARD_VIEW', 'DASHBOARD_VIEW', 'REPORT_VIEW', 'BRANCH_MANAGE', 'USER_MANAGE', 'STATISTICS_VIEW',
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
    const canManagePermissions = currentUserRole === 'ADMIN' ||
                                currentUserRole === 'BRANCH_ADMIN' ||
                                currentUserRole === 'BRANCH_SUPER_ADMIN' || 
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
            <div className="mg-v2-permission-management">
                <div className="mg-v2-loading-container">
                    <div className="mg-v2-spinner"></div>
                    <p>권한 정보 로딩 중...</p>
                </div>
            </div>
        );
    }

    if (!canManagePermissions) {
        return (
            <div className="mg-v2-permission-management">
                <div className="mg-v2-error-state">
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
        <div className="mg-v2-permission-management">
            {message && (
                <div className={`mg-permission-message ${message.includes('성공') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <div className="mg-v2-permission-controls">
                <div className="mg-v2-role-selector">
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
                        <small className="mg-v2-role-restriction">
                            {ROLE_DISPLAY_NAMES[currentUserRole] || currentUserRole}는 자신의 역할만 관리할 수 있습니다.
                        </small>
                    )}
                </div>
                
                <button 
                    className="mg-v2-button mg-v2-button-primary"
                    onClick={handleSavePermissions}
                    disabled={loading}
                >
                    {loading ? '저장 중...' : '권한 저장'}
                </button>
            </div>

            <div className="mg-v2-permission-categories">
                {Object.entries(PERMISSION_CATEGORIES).map(([categoryName, permissions]) => (
                    <div key={categoryName} className="mg-v2-permission-category">
                        <h3>{categoryName}</h3>
                        <div className="mg-v2-permission-list">
                            {permissions.map(permission => (
                                <div key={permission.code} className="mg-v2-permission-item">
                                    <label className="mg-v2-permission-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={rolePermissions.includes(permission.code)}
                                            onChange={() => handlePermissionToggle(permission.code)}
                                        />
                                        <span className="mg-v2-permission-name">{permission.name}</span>
                                    </label>
                                    <p className="mg-v2-permission-description">{permission.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mg-v2-permission-summary">
                <h3>현재 선택된 권한 ({rolePermissions.length}개)</h3>
                <div className="mg-v2-selected-permissions">
                    {rolePermissions.map(permissionCode => {
                        const permission = Object.values(PERMISSION_CATEGORIES)
                            .flat()
                            .find(p => p.code === permissionCode);
                        return (
                            <span key={permissionCode} className="mg-v2-permission-tag">
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
