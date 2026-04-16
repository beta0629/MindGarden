import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../../contexts/SessionContext';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import SafeText from '../common/SafeText';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import { USER_ROLES } from '../../constants/roles';

const PERMISSION_CATEGORIES = {
    '대시보드 및 보고서': [
        { code: 'ADMIN_DASHBOARD_VIEW', name: '관리자 대시보드', description: '관리자 대시보드 전체 접근' },
        { code: 'DASHBOARD_VIEW', name: '대시보드 조회', description: '대시보드 통계 및 데이터 조회' },
        { code: 'REPORT_VIEW', name: '보고서 조회', description: '보고서 및 통계 조회 (성과지표 포함)' },
        { code: 'ERP_ACCESS', name: '운영·재무 접근', description: '운영·재무 메뉴 전체 접근' },
        { code: 'ERP_DASHBOARD_VIEW', name: '운영 현황', description: '운영 현황(수입·지출·구매) 조회' },
        { code: 'INTEGRATED_FINANCE_VIEW', name: '수입·지출 관리', description: '수입·지출·거래·정산 화면 접근' }
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
        { code: 'CONSULTANT_TRANSFER', name: '상담사 소속 변경', description: '상담사 소속 변경' },
        { code: 'CONSULTANT_RATING_VIEW', name: '상담사 평가 조회', description: '상담사 평가 정보 조회' }
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
    'ADMIN': [
        'ADMIN_DASHBOARD_VIEW', 'ERP_ACCESS', 'INTEGRATED_FINANCE_VIEW',
        'USER_MANAGE', 'CONSULTANT_MANAGE', 'CLIENT_MANAGE', 'MAPPING_VIEW', 'MAPPING_MANAGE',
        'SCHEDULE_MANAGE', 'SCHEDULE_CREATE', 'SCHEDULE_MODIFY', 'SCHEDULE_DELETE',
        'CONSULTATION_RECORD_VIEW', 'STATISTICS_VIEW', 'FINANCIAL_VIEW',
        'SALARY_MANAGE', 'TAX_MANAGE', 'REFUND_MANAGE', 'PURCHASE_REQUEST_VIEW',
        'APPROVAL_MANAGE', 'ITEM_MANAGE', 'BUDGET_MANAGE', 'CONSULTATION_STATISTICS_VIEW'
    ],
    'STAFF': [
        'ADMIN_DASHBOARD_VIEW', 'USER_MANAGE', 'CONSULTANT_MANAGE', 'CLIENT_MANAGE',
        'SCHEDULE_MANAGE', 'SCHEDULE_CREATE', 'SCHEDULE_MODIFY', 'SCHEDULE_DELETE',
        'CONSULTATION_RECORD_VIEW', 'STATISTICS_VIEW', 'MAPPING_VIEW', 'CONSULTATION_STATISTICS_VIEW'
    ],
    'CONSULTANT': [
        'SCHEDULE_MANAGE', 'SCHEDULE_CREATE', 'SCHEDULE_MODIFY', 'SCHEDULE_DELETE',
        'CONSULTATION_RECORD_VIEW', 'CLIENT_MANAGE'
    ],
    'CLIENT': [
        'SCHEDULE_VIEW', 'CONSULTATION_RECORD_VIEW'
    ]
};

// 역할 계층 (4역할: ADMIN, STAFF, CONSULTANT, CLIENT)
const ROLE_HIERARCHY = {
    'ADMIN': ['ADMIN', 'STAFF', 'CONSULTANT', 'CLIENT'],
    'STAFF': ['STAFF', 'CONSULTANT', 'CLIENT'],
    'CONSULTANT': ['CONSULTANT'],
    'CLIENT': ['CLIENT']
};

const ROLE_DISPLAY_NAMES = {
    'ADMIN': '관리자',
    'STAFF': '사무원',
    'CONSULTANT': '상담사',
    'CLIENT': '내담자'
};

const PermissionManagement = () => {
    const { checkSession } = useSession();
    const [userPermissions, setUserPermissions] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [selectedRole, setSelectedRole] = useState('ADMIN');
    const [rolePermissions, setRolePermissions] = useState([]);
    const [saveLoading, setSaveLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [allPermissions, setAllPermissions] = useState([]); // DB에서 로드한 모든 권한

    const fetchUserInfo = async() => {
        try {
            const response = await fetch('/api/v1/auth/current-user', {
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

    const loadAllPermissions = useCallback(async() => {
        try {
            // DB에서 모든 권한 목록 로드
            const response = await fetch('/api/v1/permissions/manageable', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setAllPermissions(data.data);
                    console.log('✅ 모든 권한 로드 완료:', data.data.length, '개');
                }
            }
        } catch (error) {
            console.error('❌ 모든 권한 로드 실패:', error);
        }
    }, []);

    const loadUserPermissions = useCallback(async() => {
        try {
            // 실제 사용자 권한 로드
            const response = await fetch('/api/v1/permissions/my-permissions', {
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
                    if (userInfo.role === USER_ROLES.ADMIN) {
                        setSelectedRole(USER_ROLES.ADMIN);
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

    const loadRolePermissions = useCallback(async() => {
        try {
            // 데이터베이스에서 역할 권한 로드
            const response = await fetch(`/api/v1/permissions/role/${selectedRole}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('🔍 역할 권한 응답 데이터:', data);
                if (data.success && data.data && data.data.permissions) {
                    const permissionCodes = data.data.permissions.map(p => {
                        // Map 형식이면 permission_code 필드 사용, String이면 그대로 사용
                        return typeof p === 'string' ? p : (p.permission_code || p.permissionCode || p);
                    });
                    setRolePermissions(permissionCodes);
                    console.log('✅ 역할 권한 로드 완료:', permissionCodes);
                } else {
                    console.error('❌ 역할 권한 로드 실패:', data.message);
                    // 폴백: 하드코딩된 권한 사용
                    const permissions = ROLE_PERMISSIONS[selectedRole] || [];
                    setRolePermissions(permissions);
                }
            } else {
                console.error('❌ 역할 권한 로드 실패:', response.status);
                // 폴백: 하드코딩된 권한 사용
                const permissions = ROLE_PERMISSIONS[selectedRole] || [];
                setRolePermissions(permissions);
            }
        } catch (error) {
            console.error('❌ 역할 권한 로드 실패:', error);
            // 폴백: 하드코딩된 권한 사용
            const permissions = ROLE_PERMISSIONS[selectedRole] || [];
            setRolePermissions(permissions);
        }
    }, [selectedRole]);

    useEffect(() => {
        loadAllPermissions();
        loadUserPermissions();
    }, [loadAllPermissions, loadUserPermissions]);

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

    const handleSavePermissions = async() => {
        setSaveLoading(true);
        setMessage('');
        
        try {
            const response = await fetch('/api/v1/permissions/role-permissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    roleName: selectedRole,
                    permissionCodes: rolePermissions
                })
            });

            if (response.ok) {
                await response.json();
                setMessage('권한이 성공적으로 저장되었습니다.');

                await loadRolePermissions();
                // 본인 역할 권한 변경 시 메뉴·세션 반영: current-user 재조회 (로그인 직후 토큰 동기화 등은 로그인 플로우에서만 풀리로드)
                if (selectedRole === currentUserRole) {
                    await checkSession(true);
                }
                await loadUserPermissions();
                window.dispatchEvent(new CustomEvent('admin-dashboard-refresh-stats'));
            } else {
                const error = await response.json();
                setMessage(`저장 실패: ${error.message || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error('권한 저장 실패:', error);
            setMessage('권한 저장에 실패했습니다.');
        } finally {
            setSaveLoading(false);
        }
    };

    const hasPermission = (permissionCode) => {
        return userPermissions.includes(permissionCode);
    };

    const canManagePermissions = currentUserRole === 'ADMIN';
    const isTopAdmin = currentUserRole === 'ADMIN';

    console.log('🔍 PermissionManagement 권한 체크:', {
        userPermissions,
        canManagePermissions,
        currentUserRole
    });

    if (!canManagePermissions) {
        return (
            <AdminCommonLayout title="권한 관리">
                <div className="mg-v2-ad-b0kla mg-v2-permission-management">
                    <div className="mg-v2-ad-b0kla__container">
                        <ContentArea ariaLabel="권한 관리 콘텐츠">
                            <ContentHeader
                                title="접근 권한 없음"
                                subtitle="권한 관리는 관리자(ADMIN)만 이용할 수 있습니다."
                                titleId="permission-management-title"
                            />
                            <div className="mg-v2-error-state" role="alert">
                                <p>현재 역할: {currentUserRole || '알 수 없음'}</p>
                            </div>
                        </ContentArea>
                    </div>
                </div>
            </AdminCommonLayout>
        );
    }

    // 현재 사용자가 관리할 수 있는 역할 목록
    const getManageableRoles = () => {
        if (isTopAdmin) {
            return Object.keys(ROLE_PERMISSIONS);
        }
        if (currentUserRole) {
            return ROLE_HIERARCHY[currentUserRole] || [currentUserRole];
        }
        return [currentUserRole];
    };

    const manageableRoles = getManageableRoles();

    return (
        <AdminCommonLayout title="권한 관리">
            <div className="mg-v2-ad-b0kla mg-v2-permission-management">
                <div className="mg-v2-ad-b0kla__container">
                    <ContentArea ariaLabel="권한 관리 콘텐츠">
                        <ContentHeader
                            title="권한 관리"
                            subtitle="역할별 메뉴·기능 접근 권한을 설정하고 저장합니다."
                            titleId="permission-management-title"
                        />

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
                                    disabled={!isTopAdmin && manageableRoles.length === 1}
                                >
                                    {manageableRoles.map(role => (
                                        <option key={role} value={role}>
                                            {ROLE_DISPLAY_NAMES[role] || role}
                                        </option>
                                    ))}
                                </select>
                                {!isTopAdmin && (
                                    <small className="mg-v2-role-restriction">
                                        {ROLE_DISPLAY_NAMES[currentUserRole] || currentUserRole}는 자신의 역할만 관리할 수 있습니다.
                                    </small>
                                )}
                            </div>
                            
                            <MGButton
                                variant="primary"
                                className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: saveLoading })}
                                onClick={handleSavePermissions}
                                disabled={saveLoading}
                                loading={saveLoading}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                preventDoubleClick={false}
                            >
                                권한 저장
                            </MGButton>
                        </div>

                        <div className="mg-v2-permission-categories">
                {allPermissions.length > 0 ? (
                    // DB에서 로드한 권한들을 카테고리별로 그룹화
                    Object.entries(
                        allPermissions.reduce((acc, perm) => {
                            const category = perm.category || '기타';
                            if (!acc[category]) acc[category] = [];
                            acc[category].push(perm);
                            return acc;
                        }, {})
                    ).map(([categoryName, permissions]) => (
                        <div key={categoryName} className="mg-v2-permission-category">
                            <h3><SafeText>{categoryName}</SafeText></h3>
                            <div className="mg-v2-permission-list">
                                {permissions.map(permission => (
                                    <div key={permission.permissionCode} className="mg-v2-permission-item">
                                        <label className="mg-v2-permission-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={rolePermissions.includes(permission.permissionCode)}
                                                onChange={() => handlePermissionToggle(permission.permissionCode)}
                                            />
                                            <span className="mg-v2-permission-name"><SafeText>{permission.permissionName}</SafeText></span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    // 로딩 중이면 하드코딩된 목록 사용 (폴백)
                    Object.entries(PERMISSION_CATEGORIES).map(([categoryName, permissions]) => (
                        <div key={categoryName} className="mg-v2-permission-category">
                            <h3><SafeText>{categoryName}</SafeText></h3>
                            <div className="mg-v2-permission-list">
                                {permissions.map(permission => (
                                    <div key={permission.code} className="mg-v2-permission-item">
                                        <label className="mg-v2-permission-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={rolePermissions.includes(permission.code)}
                                                onChange={() => handlePermissionToggle(permission.code)}
                                            />
                                            <span className="mg-v2-permission-name"><SafeText>{permission.name}</SafeText></span>
                                        </label>
                                        <p className="mg-v2-permission-description"><SafeText>{permission.description}</SafeText></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
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
                                            <SafeText>{permission ? permission.name : permissionCode}</SafeText>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </ContentArea>
                </div>
            </div>
        </AdminCommonLayout>
    );
};

export default PermissionManagement;
