import React, { useState, useEffect, useCallback } from 'react';
import { Users, User, UserCircle, Crown, Building2, Search } from 'lucide-react';
import { USER_ROLES } from '../../constants/roles';
import notificationManager from '../../utils/notification';
import { useConfirm } from '../../hooks/useConfirm';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import csrfTokenManager from '../../utils/csrfTokenManager';
import UnifiedModal from '../common/modals/UnifiedModal';
import BadgeSelect from '../common/BadgeSelect';
import './UserManagement.css';
import SafeText from '../common/SafeText';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../utils/safeDisplay';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_ADMIN_USERS_ROLES = '/api/v1/admin/users/roles';


const USER_MANAGEMENT_PAGE_TITLE_ID = 'user-management-title';

const UserManagement = ({ onUpdate }) => {
    const { t } = useTranslation(['admin', 'common']);
    const [confirm, ConfirmModal] = useConfirm();
    // notificationManager 사용
    const toast = (message, type) => {
        if (type === 'success') notificationManager.success(message);
        else if (type === 'danger' || type === 'error') notificationManager.error(message);
        else if (type === 'warning') notificationManager.warning(message);
        else notificationManager.info(message);
    };
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [includeInactive, setIncludeInactive] = useState(false);
    const [form, setForm] = useState({
        newRole: ''
    });
    const [roleSubmitting, setRoleSubmitting] = useState(false);

    // 역할 코드 로드
    const loadRoleCodes = useCallback(async() => {
        try {
            setLoadingCodes(true);
            // 표준 API 사용: /api/v1/common-codes?codeGroup=ROLE
            const { getCommonCodes } = await import('../../utils/commonCodeApi');
            const codes = await getCommonCodes('ROLE');
            
            const ALLOWED = [USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CONSULTANT, USER_ROLES.CLIENT];
            const defaultOptions = [
                { value: USER_ROLES.CLIENT, label: t('admin:labels.client'), icon: 'User', color: 'var(--mg-primary-500)', description: t('admin:user.roleDesc.client') },
                { value: USER_ROLES.CONSULTANT, label: t('admin:labels.consultant'), icon: 'UserCircle', color: 'var(--mg-success-500)', description: t('admin:user.roleDesc.consultant') },
                { value: USER_ROLES.STAFF, label: t('admin:labels.clerk'), icon: 'Building2', color: 'var(--mg-info-500)', description: t('admin:user.roleDesc.staff') },
                { value: USER_ROLES.ADMIN, label: t('admin:labels.administrator'), icon: 'Crown', color: 'var(--mg-warning-500)', description: t('admin:user.roleDesc.admin') }
            ];
            if (codes && Array.isArray(codes) && codes.length > 0) {
                const options = codes
                    .filter(code => code && ALLOWED.includes(code.codeValue))
                    .map(code => ({
                        value: code.codeValue,
                        label: code.codeLabel || code.koreanName,
                        icon: code.icon,
                        color: code.colorCode,
                        description: code.codeDescription
                    }));
                setRoleOptions(options.length ? options : defaultOptions);
            } else {
                setRoleOptions(defaultOptions);
            }
        } catch (error) {
            console.error('역할 코드 로드 실패:', error);
            setRoleOptions([
                { value: USER_ROLES.CLIENT, label: t('admin:labels.client'), icon: 'User' },
                { value: USER_ROLES.CONSULTANT, label: t('admin:labels.consultant'), icon: 'UserCircle' },
                { value: USER_ROLES.STAFF, label: t('admin:labels.clerk'), icon: 'Building2' },
                { value: USER_ROLES.ADMIN, label: t('admin:labels.administrator'), icon: 'Crown' }
            ]);
        } finally {
            setLoadingCodes(false);
        }
    }, []);

    const loadData = useCallback(async() => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                fetch(`/api/admin/users?includeInactive=${includeInactive}`),
                fetch(API_ADMIN_USERS_ROLES)
            ]);

            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.data || []);
            }

            if (rolesRes.ok) {
                const data = await rolesRes.json();
                setRoles(data || []);
            }
        } catch (error) {
            console.error('데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    }, [includeInactive]);

    useEffect(() => {
        loadData();
        loadRoleCodes();
    }, [loadData, loadRoleCodes]);

    // 필터링 로직
    useEffect(() => {
        // users가 배열이 아닌 경우 빈 배열로 초기화
        if (!Array.isArray(users)) {
            setFilteredUsers([]);
            return;
        }

        let filtered = users;

        // 역할 필터
        if (selectedRole) {
            filtered = filtered.filter(user => user.role === selectedRole);
        }

        // 검색 필터 (이름, 이메일)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(user => 
                user.name?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term)
            );
        }

        // 비활성 사용자 포함 옵션이 꺼져있으면 활성 사용자만 표시
        if (!includeInactive) {
            filtered = filtered.filter(user => user.isActive !== false);
        }

        setFilteredUsers(filtered);
    }, [users, selectedRole, searchTerm, includeInactive]);

    const handleRoleChange = async(e) => {
        e.preventDefault();
        
        // 내담자→상담사 변경 시 확인 메시지 (표준화 2025-12-05: 상수 활용)
        if (selectedUser.role === USER_ROLES.CLIENT && form.newRole === USER_ROLES.CONSULTANT) {
            const confirmed = await confirm({
                message: t('admin:user.confirm.changeToConsultant', { name: toDisplayString(selectedUser.name) }),
                variant: 'warning'
            });
            if (!confirmed) return;
        }
        
        setRoleSubmitting(true);
        try {
            const response = await csrfTokenManager.put(`/api/admin/users/${selectedUser.id}/role?newRole=${form.newRole}`);

            const result = await response.json();

            if (response.ok && result.success) {
                const message = selectedUser.role === USER_ROLES.CLIENT && form.newRole === USER_ROLES.CONSULTANT
                    ? t('admin:user.message.becameConsultant', { name: toDisplayString(selectedUser.name) })
                    : toDisplayString(result.message, t('admin:user.message.roleChanged'));
                toast(message, 'success');
                setShowRoleModal(false);
                setForm({ newRole: '' });
                loadData();
                onUpdate && onUpdate();
            } else {
                toast(toDisplayString(result.message, t('admin:user.error.roleChangeFailed')), 'danger');
            }
        } catch (error) {
            console.error('역할 변경 실패:', error);
            toast(t('admin:user.error.roleChangeFailed'), 'danger');
        } finally {
            setRoleSubmitting(false);
        }
    };

    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case USER_ROLES.CLIENT: return 'primary';
            case USER_ROLES.CONSULTANT: return 'success';
            case USER_ROLES.STAFF: return 'info';
            case USER_ROLES.ADMIN: return 'warning';
            default: return 'secondary';
        }
    };

    const getRoleDisplayName = (role) => {
        switch (role) {
            case USER_ROLES.CLIENT: return t('admin:labels.client');
            case USER_ROLES.CONSULTANT: return t('admin:labels.consultant');
            case USER_ROLES.STAFF: return t('admin:labels.clerk');
            case USER_ROLES.ADMIN: return t('admin:labels.administrator');
            default: return role;
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case USER_ROLES.CLIENT: return <User size={20} />;
            case USER_ROLES.CONSULTANT: return <UserCircle size={20} />;
            case USER_ROLES.STAFF: return <Building2 size={20} />;
            case USER_ROLES.ADMIN: return <Crown size={20} />;
            default: return <Users size={20} />;
        }
    };

    const renderUserListBody = () => {
        if (loading && filteredUsers.length === 0) {
            return (
                <div aria-busy="true" className="user-mgmt-initial-loading">
                    <UnifiedLoading type="inline" text={t('admin:user.loadingUsers')} />
                </div>
            );
        }
        if (users.length === 0) {
            return (
                <div className="mg-v2-empty-state">
                    <Users className="mg-v2-empty-state__icon" size={32} />
                    <p className="mg-v2-empty-state__text">{t('admin:user.emptyRegistered')}</p>
                </div>
            );
        }
        if (filteredUsers.length === 0) {
            return (
                <div className="mg-v2-empty-state">
                    <Search className="mg-v2-empty-state__icon" size={32} />
                    <p className="mg-v2-empty-state__text">{t('common:state.noResult')}</p>
                    <p className="mg-v2-empty-state__hint">{t('admin:user.searchHint')}</p>
                </div>
            );
        }
        return (
            <div className="user-mgmt-grid">
                {filteredUsers.map((user) => (
                    <div key={user.id} className={`user-mgmt-card ${user.isActive === false ? 'user-mgmt-card--inactive' : ''}`}>
                        <div className="user-mgmt-card-header">
                            <div className="user-mgmt-avatar">
                                {getRoleIcon(user.role)}
                            </div>
                            <div className="user-mgmt-info">
                                <h6 className="user-mgmt-name" title={toDisplayString(user.name)}>
                                    <SafeText tag="span">{user.name}</SafeText>
                                </h6>
                                <p className="user-mgmt-email" title={toDisplayString(user.email)}>
                                    {toDisplayString(user.email)}
                                </p>
                            </div>
                        </div>

                        <div className="user-mgmt-badges">
                            <span className={`mg-v2-badge mg-v2-badge-${getRoleBadgeVariant(user.role)}`}>
                                {getRoleDisplayName(user.role)}
                            </span>
                            {user.isActive === false && (
                                <span className="mg-v2-badge mg-v2-badge-secondary">
                                    {t('admin.labels.inactive')}
                                </span>
                            )}
                        </div>

                        <div className="user-mgmt-actions">
                            {user.role === USER_ROLES.CLIENT && (
                                <MGButton
                                    type="button"
                                    variant="success"
                                    size="small"
                                    className={buildErpMgButtonClassName({ variant: 'success', size: 'sm', loading: false })}
                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setForm({ newRole: USER_ROLES.CONSULTANT });
                                        setShowRoleModal(true);
                                    }}
                                    title={t('admin:user.action.toConsultantHint')}
                                    preventDoubleClick={false}
                                >
                                    {t('admin:user.action.toConsultant')}
                                </MGButton>
                            )}

                            <MGButton
                                type="button"
                                variant="outline"
                                size="small"
                                className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={() => {
                                    setSelectedUser(user);
                                    setForm({ newRole: user.role });
                                    setShowRoleModal(true);
                                }}
                                title={t('admin:user.action.changeRole')}
                                preventDoubleClick={false}
                            >
                                {t('admin:user.action.change')}
                            </MGButton>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <AdminCommonLayout title={t('admin:labels.userManagement')}>
            <ContentArea ariaLabel={t('admin:user.aria.list')}>
                <ContentHeader
                    title={t('admin:labels.userManagement')}
                    subtitle={t('admin:user.subtitle', { count: filteredUsers.length })}
                    titleId={USER_MANAGEMENT_PAGE_TITLE_ID}
                    actions={(
                        <MGButton
                            type="button"
                            variant="primary"
                            size="small"
                            className={buildErpMgButtonClassName({
                                variant: 'primary',
                                size: 'sm',
                                loading: false,
                                className: 'mg-v2-dashboard-icon-btn'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={loadData}
                            title={t('admin.actions.refresh')}
                            preventDoubleClick={false}
                        >
                            {t('admin.actions.refresh')}
                        </MGButton>
                    )}
                />

                <div className="mg-v2-card">
                        {/* 필터 및 검색 */}
                        <div className="user-mgmt-filters">
                            <div className="user-mgmt-search-wrapper">
                                <Search className="user-mgmt-search-icon" size={18} />
                                <input
                                    type="text"
                                    className="mg-v2-input user-mgmt-search-input"
                                    placeholder={t('admin:user.filter.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <BadgeSelect
                                className="mg-v2-form-badge-select user-mgmt-role-select"
                                value={selectedRole}
                                onChange={(val) => setSelectedRole(val)}
                                options={[
                                    { value: '', label: t('admin:user.filter.allRoles') },
                                    { value: USER_ROLES.CLIENT, label: t('admin:labels.client') },
                                    { value: USER_ROLES.CONSULTANT, label: t('admin:labels.consultant') },
                                    { value: USER_ROLES.STAFF, label: t('admin:labels.clerk') },
                                    { value: USER_ROLES.ADMIN, label: t('admin:labels.administrator') }
                                ]}
                                placeholder={t('admin:user.filter.allRoles')}
                            />
                            <label className="user-mgmt-checkbox-label">
                                <input
                                    type="checkbox"
                                    className="mg-v2-checkbox"
                                    id="includeInactive"
                                    checked={includeInactive}
                                    onChange={(e) => setIncludeInactive(e.target.checked)}
                                />
                                <span>{t('admin:user.filter.includeInactive')}</span>
                            </label>
                            <MGButton
                                type="button"
                                variant="outline"
                                size="small"
                                className={buildErpMgButtonClassName({ variant: 'ghost', size: 'sm', loading: false })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedRole('');
                                    setIncludeInactive(false);
                                }}
                                preventDoubleClick={false}
                            >
                                {t('common:action.reset')}
                            </MGButton>
                        </div>
                        {renderUserListBody()}
                    </div>
            </ContentArea>

            {/* 역할 변경 모달 */}
            <UnifiedModal
                isOpen={showRoleModal}
                onClose={() => setShowRoleModal(false)}
                title={t('admin:user.modal.roleSettingTitle')}
                size="large"
                showCloseButton={true}
                backdropClick={true}
            >
                {selectedUser && (
                    <form onSubmit={handleRoleChange}>
                        <div className="mg-v2-form-group">
                            <strong>{t('admin:user.modal.userLabel')}:</strong>{' '}
                            <SafeText tag="span">{selectedUser.name}</SafeText> ({toDisplayString(selectedUser.email)})
                        </div>
                        <div className="mg-v2-form-group">
                            <strong>{t('admin:user.modal.currentRole')}:</strong>
                            <span className={`mg-v2-badge mg-v2-badge-${getRoleBadgeVariant(selectedUser.role)} mg-ml-sm`}>
                                {getRoleDisplayName(selectedUser.role)}
                            </span>
                        </div>

                        {selectedUser.role === USER_ROLES.CLIENT && form.newRole === USER_ROLES.CONSULTANT && (
                            <div className="user-mgmt-info-box">
                                <h6 className="user-mgmt-info-title">{t('admin:user.modal.changeToConsultantTitle')}</h6>
                                <ul className="user-mgmt-info-list">
                                    <li>{t('admin:user.modal.changeToConsultantInfo1')}</li>
                                    <li>{t('admin:user.modal.changeToConsultantInfo2')}</li>
                                    <li>{t('admin:user.modal.changeToConsultantInfo3')}</li>
                                    <li>{t('admin:user.modal.changeToConsultantInfo4')}</li>
                                </ul>
                            </div>
                        )}

                        <div className="mg-v2-form-group">
                            <label className="mg-v2-label">{t('admin:user.modal.newRole')}</label>
                            <BadgeSelect
                                className="mg-v2-form-badge-select"
                                value={form.newRole}
                                onChange={(val) => setForm({ ...form, newRole: val })}
                                options={[
                                    { value: '', label: t('admin:user.modal.selectRole') },
                                    ...roleOptions.map(role => ({
                                        value: role.value,
                                        label: `${role.label} (${role.value})`
                                    }))
                                ]}
                                placeholder={t('admin:user.modal.selectRole')}
                            />
                        </div>

                        <div className="mg-v2-modal-footer">
                            <MGButton
                                type="button"
                                variant="secondary"
                                className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={() => setShowRoleModal(false)}
                                disabled={roleSubmitting}
                                preventDoubleClick={false}
                            >
                                {t('admin.actions.cancel')}
                            </MGButton>
                            <MGButton
                                type="submit"
                                variant="primary"
                                className={buildErpMgButtonClassName({
                                    variant: 'primary',
                                    size: 'md',
                                    loading: roleSubmitting
                                })}
                                disabled={form.newRole === selectedUser.role || roleSubmitting}
                                loading={roleSubmitting}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                preventDoubleClick={false}
                            >
                                {selectedUser.role === USER_ROLES.CLIENT && form.newRole === USER_ROLES.CONSULTANT
                                    ? t('admin:user.action.changeToConsultant')
                                    : t('admin:user.action.changeRole')}
                            </MGButton>
                        </div>
                    </form>
                )}
            </UnifiedModal>
            <ConfirmModal />
        </AdminCommonLayout>
    );
};

export default UserManagement;
