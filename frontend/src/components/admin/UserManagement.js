import React, { useState, useEffect, useCallback } from 'react';
import { FaUsers, FaEdit, FaUser, FaUserTie, FaCrown, FaBuilding, FaSearch, FaFilter, FaSync, FaTimes } from 'react-icons/fa';
import { apiGet } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import UnifiedLoading from '../common/UnifiedLoading';
import SimpleLayout from '../layout/SimpleLayout';
import csrfTokenManager from '../../utils/csrfTokenManager';
import './UserManagement.css';

const UserManagement = ({ onUpdate }) => {
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

    // 역할 코드 로드
    const loadRoleCodes = useCallback(async () => {
        try {
            setLoadingCodes(true);
            const response = await apiGet('/api/common-codes/group/ROLE');
            if (response && response.length > 0) {
                const options = response.map(code => ({
                    value: code.codeValue,
                    label: code.codeLabel,
                    icon: code.icon,
                    color: code.colorCode,
                    description: code.description
                }));
                setRoleOptions(options);
            }
        } catch (error) {
            console.error('역할 코드 로드 실패:', error);
            // 실패 시 기본값 설정
            setRoleOptions([
                { value: 'CLIENT', label: '내담자', icon: '👤', color: '#3b82f6', description: '상담을 받는 내담자' },
                { value: 'CONSULTANT', label: '상담사', icon: '👨‍⚕️', color: '#10b981', description: '상담을 제공하는 상담사' },
                { value: 'ADMIN', label: '관리자', icon: '👨‍💼', color: '#f59e0b', description: '시스템 관리자' },
                { value: 'BRANCH_SUPER_ADMIN', label: '수퍼관리자', icon: '👑', color: '#ef4444', description: '최고 관리자' }
            ]);
        } finally {
            setLoadingCodes(false);
        }
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                fetch(`/api/admin/users?includeInactive=${includeInactive}`),
                fetch('/api/admin/users/roles')
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

    const handleRoleChange = async (e) => {
        e.preventDefault();
        
        // 내담자→상담사 변경 시 확인 메시지
        if (selectedUser.role === 'CLIENT' && form.newRole === 'CONSULTANT') {
            const confirmed = window.confirm(
                `${selectedUser.name}님을 상담사로 변경하시겠습니까?\n\n` +
                '이 변경으로 인해:\n' +
                '• 상담사 메뉴와 기능에 접근 가능\n' +
                '• 내담자 관리, 스케줄 관리 권한 부여\n' +
                '• 필요시 다시 내담자로 되돌릴 수 있음'
            );
            if (!confirmed) return;
        }
        
        try {
            const response = await csrfTokenManager.put(`/api/admin/users/${selectedUser.id}/role?newRole=${form.newRole}`);

            const result = await response.json();

            if (response.ok && result.success) {
                const message = selectedUser.role === 'CLIENT' && form.newRole === 'CONSULTANT' 
                    ? `${selectedUser.name}님이 상담사로 성공적으로 변경되었습니다.`
                    : result.message || '사용자 역할이 성공적으로 변경되었습니다.';
                toast(message, 'success');
                setShowRoleModal(false);
                setForm({ newRole: '' });
                loadData();
                onUpdate && onUpdate();
            } else {
                toast(result.message || '역할 변경에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('역할 변경 실패:', error);
            toast('역할 변경에 실패했습니다.', 'danger');
        }
    };

    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'CLIENT': return 'primary';
            case 'CONSULTANT': return 'success';
            case 'ADMIN': return 'warning';
            case 'BRANCH_SUPER_ADMIN': return 'danger';
            default: return 'secondary';
        }
    };

    const getRoleDisplayName = (role) => {
        switch (role) {
            case 'CLIENT': return '내담자';
            case 'CONSULTANT': return '상담사';
            case 'ADMIN': return '관리자';
            case 'BRANCH_SUPER_ADMIN': return '최고관리자';
            default: return role;
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'CLIENT': return <FaUser />;
            case 'CONSULTANT': return <FaUserTie />;
            case 'ADMIN': return <FaBuilding />;
            case 'BRANCH_SUPER_ADMIN': return <FaCrown />;
            default: return <FaUsers />;
        }
    };

    return (
        <SimpleLayout title="사용자 관리">
            <div className="user-mgmt-container">
                <div className="mg-card">
                    <div className="user-mgmt-header">
                        <h5 className="user-mgmt-title">
                            <FaUsers className="user-mgmt-title-icon" />
                            사용자 목록 ({filteredUsers.length}명)
                        </h5>
                        <button className="mg-button mg-button-outline mg-button-sm" onClick={loadData}>
                            <FaSync className="mg-button-icon" />
                            새로고침
                        </button>
                    </div>
                    <div className="user-mgmt-body">
                        {/* 필터 및 검색 */}
                        <div className="user-mgmt-filters">
                            <div className="user-mgmt-search-wrapper">
                                <FaSearch className="user-mgmt-search-icon" />
                                <input
                                    type="text"
                                    className="mg-input user-mgmt-search-input"
                                    placeholder="이름 또는 이메일로 검색..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                className="mg-select user-mgmt-role-select"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                <option value="">모든 역할</option>
                                <option value="CLIENT">내담자</option>
                                <option value="CONSULTANT">상담사</option>
                                <option value="ADMIN">관리자</option>
                                <option value="BRANCH_SUPER_ADMIN">최고관리자</option>
                            </select>
                            <label className="user-mgmt-checkbox-label">
                                <input
                                    type="checkbox"
                                    className="mg-checkbox"
                                    id="includeInactive"
                                    checked={includeInactive}
                                    onChange={(e) => setIncludeInactive(e.target.checked)}
                                />
                                <span>비활성 사용자 포함</span>
                            </label>
                            <button 
                                className="mg-button mg-button-ghost mg-button-sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedRole('');
                                    setIncludeInactive(false);
                                }}
                            >
                                <FaFilter className="mg-button-icon" />
                                초기화
                            </button>
                        </div>
                        {loading ? (
                            <UnifiedLoading text="사용자 목록을 불러오는 중..." size="medium" type="inline" />
                        ) : users.length === 0 ? (
                            <div className="mg-empty-state">
                                <FaUsers className="mg-empty-state__icon" />
                                <p className="mg-empty-state__text">등록된 사용자가 없습니다.</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="mg-empty-state">
                                <FaSearch className="mg-empty-state__icon" />
                                <p className="mg-empty-state__text">검색 결과가 없습니다.</p>
                                <p className="mg-empty-state__hint">다른 검색어나 필터를 시도해보세요.</p>
                            </div>
                        ) : (
                            <div className="user-mgmt-grid">
                                {filteredUsers.map((user) => (
                                    <div key={user.id} className={`user-mgmt-card ${user.isActive === false ? 'user-mgmt-card--inactive' : ''}`}>
                                        <div className="user-mgmt-card-header">
                                            <div className="user-mgmt-avatar">
                                                {getRoleIcon(user.role)}
                                            </div>
                                            <div className="user-mgmt-info">
                                                <h6 className="user-mgmt-name" title={user.name}>
                                                    {user.name}
                                                </h6>
                                                <p className="user-mgmt-email" title={user.email}>
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="user-mgmt-badges">
                                            <span className={`mg-badge mg-badge-${getRoleBadgeVariant(user.role)}`}>
                                                {getRoleDisplayName(user.role)}
                                            </span>
                                            {user.isActive === false && (
                                                <span className="mg-badge mg-badge-secondary">
                                                    비활성
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="user-mgmt-actions">
                                            {/* 내담자→상담사 빠른 변경 버튼 */}
                                            {user.role === 'CLIENT' && (
                                                <button 
                                                    className="mg-button mg-button-success mg-button-sm"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setForm({ newRole: 'CONSULTANT' });
                                                        setShowRoleModal(true);
                                                    }}
                                                    title="내담자를 상담사로 변경"
                                                >
                                                    상담사로
                                                </button>
                                            )}
                                            
                                            {/* 일반 역할 변경 버튼 */}
                                            <button 
                                                className="mg-button mg-button-outline mg-button-sm"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setForm({ newRole: user.role });
                                                    setShowRoleModal(true);
                                                }}
                                                title="역할 변경"
                                            >
                                                <FaEdit className="mg-button-icon" />
                                                변경
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 역할 변경 모달 */}
            {showRoleModal && (
                <div className="mg-modal-overlay" onClick={() => setShowRoleModal(false)}>
                    <div className="mg-modal mg-modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="mg-modal-header">
                            <h3 className="mg-modal-title">
                                <FaEdit className="mg-modal-title-icon" />
                                사용자 역할 변경
                            </h3>
                            <button 
                                className="mg-modal-close"
                                onClick={() => setShowRoleModal(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>
                            {selectedUser && (
                                <form onSubmit={handleRoleChange}>
                                    <div className="mg-form-group">
                                        <strong>사용자:</strong> {selectedUser.name} ({selectedUser.email})
                                    </div>
                                    <div className="mg-form-group">
                                        <strong>현재 역할:</strong> 
                                        <span className={`mg-badge mg-badge-${getRoleBadgeVariant(selectedUser.role)} mg-ml-sm`}>
                                            {getRoleDisplayName(selectedUser.role)}
                                        </span>
                                    </div>
                                    
                                    {/* 내담자→상담사 변경 시 특별 안내 */}
                                    {selectedUser.role === 'CLIENT' && form.newRole === 'CONSULTANT' && (
                                        <div className="user-mgmt-info-box">
                                            <h6 className="user-mgmt-info-title">상담사 역할 변경 안내</h6>
                                            <ul className="user-mgmt-info-list">
                                                <li>사용자가 상담사 역할로 변경됩니다.</li>
                                                <li>상담사 메뉴와 기능에 접근할 수 있게 됩니다.</li>
                                                <li>내담자 관리, 스케줄 관리 등의 권한이 부여됩니다.</li>
                                                <li>변경 후에는 다시 내담자로 되돌릴 수 있습니다.</li>
                                            </ul>
                                        </div>
                                    )}
                                    
                                    <div className="mg-form-group">
                                        <label className="mg-label">
                                            새로운 역할
                                        </label>
                                        <select
                                            className="mg-select"
                                            value={form.newRole}
                                            onChange={(e) => setForm({...form, newRole: e.target.value})}
                                            required
                                        >
                                            <option value="">역할을 선택하세요</option>
                                            {roleOptions.map(role => (
                                                <option key={role.value} value={role.value}>
                                                    {role.icon} {role.label} ({role.value})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="mg-modal-footer">
                                        <button
                                            type="button"
                                            onClick={() => setShowRoleModal(false)}
                                            className="mg-button mg-button-secondary"
                                        >
                                            취소
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={form.newRole === selectedUser.role}
                                            className="mg-button mg-button-primary"
                                        >
                                            {selectedUser.role === 'CLIENT' && form.newRole === 'CONSULTANT' 
                                                ? '상담사로 변경' 
                                                : '역할 변경'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </SimpleLayout>
    );
};

export default UserManagement;
