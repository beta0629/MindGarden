/**
 * 스태프 계정 관리 (목록 조회·역할 변경)
 * - GET user-management 후 role=STAFF 필터, B0KlA·ContentArea 구조
 * - 역할 변경: UnifiedModal + GET roles, PUT .../role?newRole=...
 *
 * @author Core Solution
 * @since 2026-03-05
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { User, Users, Mail, Phone, RefreshCw, UserPlus } from 'lucide-react';
import StandardizedApi from '../../utils/standardizedApi';
import UnifiedLoading from '../common/UnifiedLoading';
import UnifiedModal from '../common/modals/UnifiedModal';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import { SearchInput } from '../dashboard-v2/atoms';
import Button from '../ui/Button/Button';
import { showSuccess, showError } from '../../utils/notification';
import { apiGet } from '../../utils/ajax';
import { maskEncryptedDisplay } from '../../utils/codeHelper';
import ProfileImageInput from '../common/ProfileImageInput';
import '../../styles/unified-design-tokens.css';
import './ClientComprehensiveManagement/ClientModal.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './mapping-management/organisms/MappingKpiSection.css';
import './mapping-management/organisms/MappingSearchSection.css';
import './mapping-management/organisms/MappingListBlock.css';
import './ProfileCard.css';

const API_USER_MANAGEMENT = '/api/v1/admin/user-management';
const API_ROLES = '/api/v1/admin/user-management/roles';
const API_STAFF_REGISTER = '/api/v1/admin/staff';
const ROLE_STAFF = 'STAFF';

/** 역할 표시명 (백엔드 UserRole displayName과 동일) */
const ROLE_DISPLAY_NAMES = {
  ADMIN: '관리자',
  STAFF: '사무원',
  CONSULTANT: '상담사',
  CLIENT: '내담자'
};

/** 스태프로 지정 모달 내부 목록 (인지 복잡도 분리) */
const AddStaffModalContent = ({ list = [], searchTerm, onSearch, roleOf, onAssign, assigning }) => {
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase().trim();
    return list.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        (u.phone && String(u.phone).includes(term))
    );
  }, [list, searchTerm]);

  if (list.length === 0 && !searchTerm) {
    return <p className="mg-v2-mapping-list-block__empty-desc">스태프로 지정할 수 있는 사용자가 없습니다.</p>;
  }
  return (
    <>
      <div className="mg-modal__form-group">
        <SearchInput value={searchTerm} onChange={onSearch} placeholder="이름, 이메일, 전화번호로 검색..." />
      </div>
      <div className="mg-v2-client-list-block" style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <p className="mg-v2-mapping-list-block__empty-desc">검색 결과가 없습니다.</p>
        ) : (
          <div className="mg-v2-mapping-list-block__grid">
            {filtered.map((u) => (
              <div key={u.id} className="mg-v2-profile-card">
                <div className="mg-v2-profile-card__header">
                  <div className="mg-v2-profile-card__avatar">
                    <User size={24} />
                  </div>
                  <div className="mg-v2-profile-card__info">
                    <h3 className="mg-v2-profile-card__name">{maskEncryptedDisplay(u.name, '이름')}</h3>
                    <div className="mg-v2-profile-card__contact">
                      <span className="mg-v2-profile-card__email">
                        <Mail size={12} /> {maskEncryptedDisplay(u.email, '이메일')}
                      </span>
                      <span className="mg-v2-profile-card__badges">{ROLE_DISPLAY_NAMES[roleOf(u)] || roleOf(u)}</span>
                    </div>
                  </div>
                </div>
                <div className="mg-v2-profile-card__footer">
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => onAssign(u)}
                    disabled={assigning}
                    preventDoubleClick
                  >
                    스태프로 지정
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
AddStaffModalContent.propTypes = {
  list: PropTypes.arrayOf(PropTypes.object),
  searchTerm: PropTypes.string,
  onSearch: PropTypes.func.isRequired,
  roleOf: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
  assigning: PropTypes.bool
};

const StaffManagement = ({ embedded = false }) => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleChangeModal, setRoleChangeModal] = useState({ open: false, user: null });
  const [roles, setRoles] = useState([]);
  const [selectedNewRole, setSelectedNewRole] = useState('');
  const [roleChangeSubmitting, setRoleChangeSubmitting] = useState(false);
  const [addStaffModal, setAddStaffModal] = useState({ open: false, nonStaffUsers: [], loading: false, assignSubmitting: false });
  const [addStaffSearch, setAddStaffSearch] = useState('');
  const [createStaffModal, setCreateStaffModal] = useState({ open: false, submitting: false });
  const [createForm, setCreateForm] = useState({
    email: '',
    name: '',
    password: '',
    phone: '',
    profileImageUrl: '',
    rrnFirst6: '',
    rrnLast1: '',
    address: '',
    addressDetail: '',
    postalCode: ''
  });
  const [staffEmailCheckStatus, setStaffEmailCheckStatus] = useState(null);
  const [isCheckingStaffEmail, setIsCheckingStaffEmail] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await StandardizedApi.get(API_USER_MANAGEMENT, {
        includeInactive: true,
        role: ROLE_STAFF
      });
      // apiGet이 { success, data } 응답 시 data만 반환하므로 배열 직접 처리
      const list = Array.isArray(response) ? response : (response?.data && Array.isArray(response.data) ? response.data : []);
      setStaffList(list);
    } catch (err) {
      console.error('스태프 목록 조회 실패:', err);
      setStaffList([]);
      showError('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const response = await StandardizedApi.get(API_ROLES);
      const list = Array.isArray(response) ? response : [];
      setRoles(list);
    } catch (err) {
      console.error('역할 목록 조회 실패:', err);
      setRoles([]);
    }
  }, []);

  const openAddStaffModal = useCallback(async () => {
    setAddStaffModal((prev) => ({ ...prev, open: true, loading: true, nonStaffUsers: [] }));
    try {
      const response = await StandardizedApi.get(API_USER_MANAGEMENT, { includeInactive: true });
      const list = Array.isArray(response) ? response : (response?.data && Array.isArray(response.data) ? response.data : []);
      const roleOf = (u) => (typeof u.role === 'string' ? u.role : u.role?.name) || '';
      const nonStaff = list.filter((u) => roleOf(u) !== ROLE_STAFF);
      setAddStaffModal((prev) => ({ ...prev, nonStaffUsers: nonStaff, loading: false }));
    } catch (err) {
      console.error('사용자 목록 조회 실패:', err);
      showError('사용자 목록을 불러오는데 실패했습니다.');
      setAddStaffModal((prev) => ({ ...prev, loading: false, nonStaffUsers: [] }));
    }
  }, []);

  const closeAddStaffModal = useCallback(() => {
    setAddStaffModal({ open: false, nonStaffUsers: [], loading: false, assignSubmitting: false });
    setAddStaffSearch('');
  }, []);

  const openCreateStaffModal = useCallback(() => {
    setCreateForm({
      email: '', name: '', password: '', phone: '', profileImageUrl: '',
      rrnFirst6: '', rrnLast1: '', address: '', addressDetail: '', postalCode: ''
    });
    setStaffEmailCheckStatus(null);
    setCreateStaffModal({ open: true, submitting: false });
  }, []);

  const closeCreateStaffModal = useCallback(() => {
    setCreateStaffModal({ open: false, submitting: false });
    setCreateForm({
      email: '', name: '', password: '', phone: '', profileImageUrl: '',
      rrnFirst6: '', rrnLast1: '', address: '', addressDetail: '', postalCode: ''
    });
    setStaffEmailCheckStatus(null);
  }, []);

  const handleCreateFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'email') setStaffEmailCheckStatus(null);
  }, []);

  const handleStaffEmailDuplicateCheck = useCallback(async () => {
    const email = (createForm.email || '').trim();
    if (!email) {
      showError('이메일을 입력해 주세요.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('올바른 이메일 형식을 입력해 주세요.');
      return;
    }
    setIsCheckingStaffEmail(true);
    setStaffEmailCheckStatus('checking');
    try {
      const response = await apiGet(`/api/v1/admin/duplicate-check/email?email=${encodeURIComponent(email)}`);
      if (response && typeof response.isDuplicate === 'boolean') {
        if (response.isDuplicate) {
          setStaffEmailCheckStatus('duplicate');
          showError('이미 사용 중인 이메일입니다.');
        } else {
          setStaffEmailCheckStatus('available');
          showSuccess('사용 가능한 이메일입니다.');
        }
      } else {
        setStaffEmailCheckStatus(null);
      }
    } catch (err) {
      setStaffEmailCheckStatus(null);
      showError('이메일 중복 확인 중 오류가 발생했습니다.');
    } finally {
      setIsCheckingStaffEmail(false);
    }
  }, [createForm.email]);

  const handleCreateStaffSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const email = (createForm.email || '').trim().toLowerCase();
      const name = (createForm.name || '').trim();
      if (!email) {
        showError('이메일을 입력해 주세요.');
        return;
      }
      setCreateStaffModal((prev) => ({ ...prev, submitting: true }));
      try {
        const payload = {
          email,
          name: name || undefined,
          password: (createForm.password || '').trim() || undefined,
          phone: (createForm.phone || '').trim() || undefined,
          profileImageUrl: (createForm.profileImageUrl || '').trim() || undefined,
          rrnFirst6: (createForm.rrnFirst6 || '').trim() || undefined,
          rrnLast1: (createForm.rrnLast1 || '').trim() || undefined,
          address: (createForm.address || '').trim() || undefined,
          addressDetail: (createForm.addressDetail || '').trim() || undefined,
          postalCode: (createForm.postalCode || '').trim() || undefined
        };
        const response = await StandardizedApi.post(API_STAFF_REGISTER, payload);
        const user = response?.data ?? response;
        if (user && (user.id || user.email)) {
          showSuccess('스태프가 성공적으로 등록되었습니다.');
          closeCreateStaffModal();
          loadUsers();
        } else {
          throw new Error('등록에 실패했습니다.');
        }
      } catch (err) {
        console.error('스태프 등록 실패:', err);
        showError(err.message || err.response?.data?.message || '스태프 등록 중 오류가 발생했습니다.');
      } finally {
        setCreateStaffModal((prev) => ({ ...prev, submitting: false }));
      }
    },
    [createForm, closeCreateStaffModal, loadUsers]
  );

  const handleAssignAsStaff = useCallback(
    async (user) => {
      if (!user?.id) return;
      setAddStaffModal((prev) => ({ ...prev, assignSubmitting: true }));
      try {
        const endpoint = `${API_USER_MANAGEMENT}/${user.id}/role?newRole=${encodeURIComponent(ROLE_STAFF)}`;
        const response = await StandardizedApi.put(endpoint, {});
        if (response && response.success !== false) {
          showSuccess(response.message || '스태프로 지정되었습니다.');
          closeAddStaffModal();
          loadUsers();
        } else {
          throw new Error(response?.message || '스태프 지정에 실패했습니다.');
        }
      } catch (err) {
        console.error('스태프 지정 실패:', err);
        showError(err.message || '스태프 지정 중 오류가 발생했습니다.');
      } finally {
        setAddStaffModal((prev) => ({ ...prev, assignSubmitting: false }));
      }
    },
    [closeAddStaffModal, loadUsers]
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredStaff = useMemo(() => {
    if (!searchTerm.trim()) return staffList;
    const term = searchTerm.toLowerCase().trim();
    return staffList.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        (u.phone && String(u.phone).includes(term))
    );
  }, [staffList, searchTerm]);

  const roleOf = useCallback((u) => (typeof u.role === 'string' ? u.role : u.role?.name) || '', []);

  const handleOpenRoleChange = useCallback(
    (user) => {
      setRoleChangeModal({ open: true, user });
      setSelectedNewRole(user?.role || '');
      if (roles.length === 0) loadRoles();
    },
    [roles.length, loadRoles]
  );

  const handleCloseRoleChange = useCallback(() => {
    setRoleChangeModal({ open: false, user: null });
    setSelectedNewRole('');
    setRoleChangeSubmitting(false);
  }, []);

  const handleConfirmRoleChange = useCallback(async () => {
    const { user } = roleChangeModal;
    if (!user || !selectedNewRole || selectedNewRole === user.role) return;
    setRoleChangeSubmitting(true);
    try {
      const endpoint = `${API_USER_MANAGEMENT}/${user.id}/role?newRole=${encodeURIComponent(selectedNewRole)}`;
      const response = await StandardizedApi.put(endpoint, {});
      if (response && response.success !== false) {
        showSuccess(response.message || '역할이 변경되었습니다.');
        handleCloseRoleChange();
        loadUsers();
      } else {
        throw new Error(response?.message || '역할 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error('역할 변경 실패:', err);
      showError(err.message || '역할 변경 중 오류가 발생했습니다.');
    } finally {
      setRoleChangeSubmitting(false);
    }
  }, [roleChangeModal, selectedNewRole, handleCloseRoleChange, loadUsers]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  if (loading && staffList.length === 0) {
    if (embedded) {
      return <UnifiedLoading type="page" text="데이터를 불러오는 중..." variant="pulse" />;
    }
    return (
      <ContentArea>
        <UnifiedLoading type="page" text="데이터를 불러오는 중..." variant="pulse" />
      </ContentArea>
    );
  }

  return (
    <>
      <ContentHeader
        title="스태프 관리"
        subtitle="스태프(사무원) 목록 조회 및 역할 변경"
      />

      <ContentSection noCard className="mg-v2-mapping-kpi-section">
        <div className="mg-v2-mapping-kpi-section__grid">
          <div className="mg-v2-mapping-kpi-section__card">
            <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--blue">
              <Users size={24} />
            </div>
            <div className="mg-v2-mapping-kpi-section__info">
              <span className="mg-v2-mapping-kpi-section__label">총 스태프</span>
              <span className="mg-v2-mapping-kpi-section__value">{staffList.length}명</span>
            </div>
          </div>
        </div>
      </ContentSection>

      <ContentSection noCard className="mg-v2-mapping-search-section">
        <div className="mg-v2-mapping-search-section__row">
          <div className="mg-v2-mapping-search-section__input-wrap">
            <SearchInput
              value={searchTerm}
              onChange={handleSearch}
              placeholder="이름, 이메일, 전화번호로 검색..."
            />
          </div>
          <div className="mg-v2-mapping-search-section__chips">
            <Button
              type="button"
              variant="primary"
              size="small"
              onClick={openCreateStaffModal}
              disabled={loading}
              preventDoubleClick
            >
              <UserPlus size={16} /> 새 스태프 등록
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={openAddStaffModal}
              disabled={loading}
              preventDoubleClick
            >
              스태프로 지정
            </Button>
            <button
              type="button"
              className="mg-v2-mapping-header-btn mg-v2-mapping-header-btn--secondary"
              onClick={loadUsers}
              disabled={loading}
            >
              <RefreshCw size={16} /> 새로고침
            </button>
          </div>
        </div>
      </ContentSection>

      <div className="mg-v2-tab-content">
        <div className="mg-v2-client-list-block">
          {filteredStaff.length === 0 ? (
            <div className="mg-v2-mapping-list-block__empty">
              <div className="mg-v2-mapping-list-block__empty-icon">
                <User size={48} />
              </div>
              <h3 className="mg-v2-mapping-list-block__empty-title">
                {staffList.length === 0 ? '등록된 스태프가 없습니다' : '검색 결과가 없습니다'}
              </h3>
              <p className="mg-v2-mapping-list-block__empty-desc">
                {staffList.length === 0 ? '기존 사용자를 스태프(사무원)로 역할 변경할 수 있습니다.' : '다른 검색어로 시도해 보세요.'}
              </p>
            </div>
          ) : (
            <div className="mg-v2-mapping-list-block__grid">
              {filteredStaff.map((staff) => (
                <div key={staff.id} className="mg-v2-profile-card">
                  <div className="mg-v2-profile-card__header">
                    <div className="mg-v2-profile-card__avatar">
                      <User size={24} />
                    </div>
                    <div className="mg-v2-profile-card__info">
                      <h3 className="mg-v2-profile-card__name">{maskEncryptedDisplay(staff.name, '이름')}</h3>
                      <div className="mg-v2-profile-card__contact">
                        <span className="mg-v2-profile-card__email">
                          <Mail size={12} /> {maskEncryptedDisplay(staff.email, '이메일')}
                        </span>
                        <span className="mg-v2-profile-card__phone">
                          <Phone size={12} /> {maskEncryptedDisplay(staff.phone, '전화번호 없음')}
                        </span>
                      </div>
                    </div>
                    <div className="mg-v2-profile-card__badges">
                      <span className="mg-v2-status-badge">
                        {ROLE_DISPLAY_NAMES[staff.role] || staff.role}
                      </span>
                      <span className="mg-v2-grade-badge">
                        {staff.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                  </div>
                  <div className="mg-v2-profile-card__footer">
                    <div className="mg-v2-profile-card__actions">
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => handleOpenRoleChange(staff)}
                        preventDoubleClick
                      >
                        역할 변경
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <UnifiedModal
        isOpen={roleChangeModal.open}
        onClose={handleCloseRoleChange}
        title="역할 변경"
        subtitle={roleChangeModal.user ? `${roleChangeModal.user.name} (${roleChangeModal.user.email})` : ''}
        size="small"
        variant="form"
        loading={roleChangeSubmitting}
        actions={
          <>
            <Button variant="secondary" onClick={handleCloseRoleChange} disabled={roleChangeSubmitting}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmRoleChange}
              disabled={roleChangeSubmitting || !selectedNewRole || selectedNewRole === roleChangeModal.user?.role}
              preventDoubleClick
            >
              확인
            </Button>
          </>
        }
      >
        <div className="mg-modal__form-group">
          <label htmlFor="staff-role-select" className="mg-modal__label">
            새 역할
          </label>
          <select
            id="staff-role-select"
            className="mg-modal__select"
            value={selectedNewRole}
            onChange={(e) => setSelectedNewRole(e.target.value)}
            disabled={roleChangeSubmitting}
          >
            <option value="">역할 선택</option>
            {roles.map((role) => {
              const code = typeof role === 'string' ? role : role?.name || role;
              if (!code) return null;
              return (
                <option key={code} value={code}>
                  {ROLE_DISPLAY_NAMES[code] || code}
                </option>
              );
            })}
          </select>
        </div>
      </UnifiedModal>

      <UnifiedModal
        isOpen={addStaffModal.open}
        onClose={closeAddStaffModal}
        title="스태프로 지정"
        subtitle="사용자를 스태프(사무원)로 지정합니다. 목록에서 선택 후 버튼을 누르세요."
        size="medium"
        variant="form"
        loading={addStaffModal.loading}
        actions={
          <Button variant="secondary" onClick={closeAddStaffModal}>
            닫기
          </Button>
        }
      >
        {addStaffModal.loading ? (
          <UnifiedLoading type="block" text="사용자 목록 불러오는 중..." variant="pulse" />
        ) : (
          <AddStaffModalContent
            list={addStaffModal.nonStaffUsers}
            searchTerm={addStaffSearch}
            onSearch={setAddStaffSearch}
            roleOf={roleOf}
            onAssign={handleAssignAsStaff}
            assigning={addStaffModal.assignSubmitting}
          />
        )}
      </UnifiedModal>

      <UnifiedModal
        isOpen={createStaffModal.open}
        onClose={closeCreateStaffModal}
        title="새 스태프 등록"
        subtitle="내담자·상담사와 동일한 양식으로 사무원(스태프) 계정을 생성합니다."
        size="large"
        variant="form"
        className="mg-v2-ad-b0kla"
        loading={createStaffModal.submitting}
        actions={
          <>
            <Button variant="secondary" onClick={closeCreateStaffModal} disabled={createStaffModal.submitting}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateStaffSubmit}
              disabled={createStaffModal.submitting || !(createForm.email || '').trim()}
              preventDoubleClick
            >
              등록
            </Button>
          </>
        }
      >
        <div className="mg-v2-modal-body">
          <form onSubmit={handleCreateStaffSubmit} className="mg-v2-form">
            <div className="mg-v2-info-box mg-v2-ad-b0kla-info-box">
              <p className="mg-v2-info-text">비밀번호를 입력하지 않으면 임시 비밀번호가 자동으로 생성됩니다.</p>
            </div>
            <ProfileImageInput
              value={createForm.profileImageUrl || ''}
              onChange={(url) => setCreateForm((prev) => ({ ...prev, profileImageUrl: url || '' }))}
              maxBytes={2 * 1024 * 1024}
              cropSize={400}
              maxSize={512}
              quality={0.85}
              helpText="이미지 파일만 가능, 최대 2MB (리사이즈·크롭 적용)"
            />
            <div className="mg-v2-form-group">
              <div className="mg-v2-form-row mg-v2-form-row--two" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div className="mg-v2-form-group">
                  <label htmlFor="staff-rrnFirst6" className="mg-v2-form-label">주민번호 앞 6자리 (선택)</label>
                  <input
                    type="text"
                    id="staff-rrnFirst6"
                    name="rrnFirst6"
                    value={createForm.rrnFirst6}
                    onChange={handleCreateFormChange}
                    placeholder="900101"
                    maxLength={6}
                    inputMode="numeric"
                    className="mg-v2-form-input"
                    disabled={createStaffModal.submitting}
                  />
                </div>
                <div className="mg-v2-form-group">
                  <label htmlFor="staff-rrnLast1" className="mg-v2-form-label">주민번호 뒤 1자리 (선택)</label>
                  <input
                    type="text"
                    id="staff-rrnLast1"
                    name="rrnLast1"
                    value={createForm.rrnLast1}
                    onChange={handleCreateFormChange}
                    placeholder="1"
                    maxLength={1}
                    inputMode="numeric"
                    className="mg-v2-form-input"
                    disabled={createStaffModal.submitting}
                  />
                </div>
              </div>
            </div>
            <div className="mg-v2-form-group">
              <label htmlFor="staff-name" className="mg-v2-form-label">이름 *</label>
              <input
                type="text"
                id="staff-name"
                name="name"
                value={createForm.name}
                onChange={handleCreateFormChange}
                placeholder="이름을 입력하세요"
                className="mg-v2-form-input"
                required
                disabled={createStaffModal.submitting}
              />
            </div>
            <div className="mg-v2-form-group">
              <label htmlFor="staff-phone" className="mg-v2-form-label">전화번호</label>
              <input
                type="tel"
                id="staff-phone"
                name="phone"
                value={createForm.phone}
                onChange={handleCreateFormChange}
                placeholder="010-1234-5678"
                className="mg-v2-form-input"
                disabled={createStaffModal.submitting}
              />
            </div>
            <div className="mg-v2-form-group">
              <label htmlFor="staff-address-input" className="mg-v2-form-label">주소 검색</label>
              <div className="mg-v2-address-search-row" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="mg-v2-button mg-v2-button-secondary"
                  onClick={() => {
                    if (globalThis.window?.daum?.Postcode) {
                      new globalThis.window.daum.Postcode({
                        oncomplete: function (data) {
                          setCreateForm((prev) => ({
                            ...prev,
                            postalCode: data.zonecode || '',
                            address: data.address || ''
                          }));
                        }
                      }).open();
                    } else {
                      showError('주소 검색 서비스를 불러올 수 없습니다.');
                    }
                  }}
                >
                  주소 검색
                </button>
                <input
                  id="staff-address-input"
                  type="text"
                  readOnly
                  className="mg-v2-form-input"
                  style={{ flex: 1, minWidth: '200px' }}
                  value={createForm.address}
                  placeholder="주소 검색 버튼을 눌러 주소를 입력하세요."
                />
              </div>
            </div>
            <div className="mg-v2-form-group">
              <label htmlFor="staff-addressDetail" className="mg-v2-form-label">상세 주소</label>
              <input
                type="text"
                id="staff-addressDetail"
                name="addressDetail"
                value={createForm.addressDetail}
                onChange={handleCreateFormChange}
                placeholder="동, 호수, 상세 주소를 입력하세요."
                className="mg-v2-form-input"
                disabled={createStaffModal.submitting}
              />
            </div>
            <div className="mg-v2-form-group">
              <label htmlFor="staff-postalCode" className="mg-v2-form-label">우편번호</label>
              <input
                type="text"
                id="staff-postalCode"
                name="postalCode"
                value={createForm.postalCode}
                onChange={handleCreateFormChange}
                placeholder="00000"
                maxLength={5}
                className="mg-v2-form-input"
                disabled={createStaffModal.submitting}
              />
            </div>
            <div className="mg-v2-form-group">
              <label htmlFor="staff-email" className="mg-v2-form-label">이메일 *</label>
              <div className="mg-v2-form-email-row">
                <div className="mg-v2-form-email-row__input-wrap">
                  <input
                    type="email"
                    id="staff-email"
                    name="email"
                    value={createForm.email}
                    onChange={handleCreateFormChange}
                    required
                    placeholder="example@email.com"
                    className="mg-v2-form-input"
                    disabled={createStaffModal.submitting}
                    autoComplete="email"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleStaffEmailDuplicateCheck}
                  disabled={isCheckingStaffEmail || !(createForm.email || '').trim()}
                  className="mg-v2-button mg-v2-button-secondary mg-v2-button--compact"
                >
                  {isCheckingStaffEmail ? '확인 중...' : '중복확인'}
                </button>
              </div>
              {staffEmailCheckStatus === 'duplicate' && (
                <small className="mg-v2-form-help mg-v2-form-help--error">이미 사용 중인 이메일입니다.</small>
              )}
              {staffEmailCheckStatus === 'available' && (
                <small className="mg-v2-form-help mg-v2-form-help--success">사용 가능한 이메일입니다.</small>
              )}
            </div>
            <div className="mg-v2-form-group">
              <label htmlFor="staff-password" className="mg-v2-form-label">비밀번호</label>
              <input
                type="password"
                id="staff-password"
                name="password"
                value={createForm.password}
                onChange={handleCreateFormChange}
                placeholder="비밀번호를 입력하지 않으면 자동 생성됩니다"
                className="mg-v2-form-input"
                disabled={createStaffModal.submitting}
              />
              <small className="mg-v2-form-help">비밀번호를 입력하지 않으면 임시 비밀번호가 자동으로 생성됩니다.</small>
            </div>
          </form>
        </div>
      </UnifiedModal>
    </>
  );
};

StaffManagement.propTypes = {
  embedded: PropTypes.bool
};

StaffManagement.defaultProps = {
  embedded: false
};

export default StaffManagement;
