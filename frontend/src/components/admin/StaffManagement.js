/**
 * 스태프 계정 관리 (목록 조회·상세·기본 정보 수정·역할 변경)
 * - GET user-management 후 role=STAFF 필터, B0KlA·ContentArea 구조
 * - 기본 정보 수정: PUT /api/v1/admin/user-management/{id}/basic-profile (이름·이메일·전화, 서버 암호화)
 * - 역할 변경: UnifiedModal + GET roles, PUT .../role?newRole=...
 *
 * @author Core Solution
 * @since 2026-03-05
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { User, Users, Mail, Phone } from 'lucide-react';
import StandardizedApi from '../../utils/standardizedApi';
import UnifiedLoading from '../common/UnifiedLoading';
import UnifiedModal from '../common/modals/UnifiedModal';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import ContentCard from '../dashboard-v2/content/ContentCard';
import { ViewModeToggle, SmallCardGrid, ListTableView, StatusBadge, SafeText } from '../common';
import { SearchInput } from '../dashboard-v2/atoms';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { showSuccess, showError } from '../../utils/notification';
import { maskEncryptedDisplay } from '../../utils/codeHelper';
import { formatKoreanMobileForDisplay } from '../../utils/koreanMobilePhone';
import { VALIDATION_MESSAGES } from '../../constants/messages';
import {
  STAFF_MGMT_ARIA,
  STAFF_MGMT_BUTTON,
  STAFF_MGMT_FORM_LABEL,
  STAFF_MGMT_HELP,
  STAFF_MGMT_MASK,
  STAFF_MGMT_MODAL,
  STAFF_MGMT_MSG,
  STAFF_MGMT_PAGE,
  STAFF_MGMT_PLACEHOLDER,
  STAFF_MGMT_ROLE_LABELS,
  STAFF_MGMT_STATUS,
  STAFF_MGMT_TABLE
} from '../../constants/staffManagementStrings';
import MgEmailFieldWithAutocomplete from '../common/MgEmailFieldWithAutocomplete';
import ProfileImageInput from '../common/ProfileImageInput';
import Avatar from '../common/Avatar';
import '../../styles/unified-design-tokens.css';
import { toDisplayString } from '../../utils/safeDisplay';
import './ClientComprehensiveManagement/ClientModal.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './mapping-management/organisms/MappingKpiSection.css';
import './mapping-management/organisms/MappingSearchSection.css';
import './mapping-management/organisms/MappingListBlock.css';
import './ProfileCard.css';

const API_USER_MANAGEMENT = '/api/v1/admin/user-management';
const API_ROLES = '/api/v1/admin/user-management/roles';
const API_STAFF_REGISTER = '/api/v1/admin/staff';
const basicProfileEndpoint = (userId) => `/api/v1/admin/user-management/${userId}/basic-profile`;
const ROLE_STAFF = 'STAFF';

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
    return <p className="mg-v2-mapping-list-block__empty-desc">{STAFF_MGMT_MSG.ASSIGN_LIST_EMPTY}</p>;
  }
  return (
    <>
      <div className="mg-modal__form-group">
        <SearchInput
          value={searchTerm}
          onChange={onSearch}
          placeholder={STAFF_MGMT_PLACEHOLDER.SEARCH_NAME_EMAIL_PHONE}
        />
      </div>
      <div className="mg-v2-client-list-block" style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <p className="mg-v2-mapping-list-block__empty-desc">{STAFF_MGMT_MSG.SEARCH_EMPTY}</p>
        ) : (
          <div className="mg-v2-mapping-list-block__grid">
            {filtered.map((u) => (
              <div key={u.id} className="mg-v2-profile-card">
                <div className="mg-v2-profile-card__header">
                  <Avatar
                    profileImageUrl={u.profileImageUrl}
                    displayName={toDisplayString(u.name)}
                    className="mg-v2-profile-card__avatar"
                    size={48}
                  />
                  <div className="mg-v2-profile-card__info">
                    <h3 className="mg-v2-profile-card__name">{maskEncryptedDisplay(u.name, STAFF_MGMT_MASK.NAME)}</h3>
                    <div className="mg-v2-profile-card__contact">
                      <span className="mg-v2-profile-card__email">
                        <Mail size={12} /> {maskEncryptedDisplay(u.email, STAFF_MGMT_MASK.EMAIL)}
                      </span>
                      <span className="mg-v2-profile-card__badges">{STAFF_MGMT_ROLE_LABELS[roleOf(u)] || roleOf(u)}</span>
                    </div>
                  </div>
                </div>
                <div className="mg-v2-profile-card__footer">
                  <MGButton
                    type="button"
                    variant="primary"
                    size="small"
                    className={buildErpMgButtonClassName({
                      variant: 'primary',
                      size: 'sm',
                      loading: assigning
                    })}
                    onClick={() => onAssign(u)}
                    disabled={assigning}
                    loading={assigning}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    preventDoubleClick={false}
                  >
                    {STAFF_MGMT_BUTTON.ASSIGN_STAFF}
                  </MGButton>
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
  const [viewMode, setViewMode] = useState('largeCard'); // 'largeCard' | 'smallCard' | 'list'
  const [staffDetailModal, setStaffDetailModal] = useState({ open: false, staff: null });
  const [staffEditModal, setStaffEditModal] = useState({ open: false, staff: null });
  const [staffEditForm, setStaffEditForm] = useState({ name: '', email: '', phone: '' });
  const [staffEditSubmitting, setStaffEditSubmitting] = useState(false);

  const normalizeStaffPhoneForEdit = useCallback((p) => {
    if (p == null || String(p).trim() === '' || String(p).trim() === STAFF_MGMT_MASK.PHONE_NONE) return '';
    return String(p).trim();
  }, []);

  const openStaffDetail = useCallback((staff) => {
    setStaffDetailModal({ open: true, staff });
  }, []);

  const closeStaffDetail = useCallback(() => {
    setStaffDetailModal({ open: false, staff: null });
  }, []);

  const openStaffEdit = useCallback(
    (staff) => {
      if (!staff?.id) return;
      setStaffEditForm({
        name: maskEncryptedDisplay(staff.name, STAFF_MGMT_MASK.NAME) || '',
        email: maskEncryptedDisplay(staff.email, STAFF_MGMT_MASK.EMAIL) || '',
        phone: normalizeStaffPhoneForEdit(staff.phone)
      });
      setStaffEditModal({ open: true, staff });
    },
    [normalizeStaffPhoneForEdit]
  );

  const closeStaffEdit = useCallback(() => {
    setStaffEditModal({ open: false, staff: null });
    setStaffEditForm({ name: '', email: '', phone: '' });
    setStaffEditSubmitting(false);
  }, []);

  const handleStaffEditFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    setStaffEditForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const loadUsers = useCallback(async() => {
    setLoading(true);
    try {
      const response = await StandardizedApi.get(API_USER_MANAGEMENT, {
        includeInactive: true,
        role: ROLE_STAFF
      });
      // 응답이 배열이거나 { data: 배열 } 형태일 수 있어 배열 직접 처리
      const list = Array.isArray(response) ? response : (response?.data && Array.isArray(response.data) ? response.data : []);
      setStaffList(list);
    } catch (err) {
      console.error('스태프 목록 조회 실패:', err);
      setStaffList([]);
      showError(STAFF_MGMT_MSG.ERR_LOAD_USER_LIST);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoles = useCallback(async() => {
    try {
      const response = await StandardizedApi.get(API_ROLES);
      const list = Array.isArray(response) ? response : [];
      setRoles(list);
    } catch (err) {
      console.error('역할 목록 조회 실패:', err);
      setRoles([]);
    }
  }, []);

  const openAddStaffModal = useCallback(async() => {
    setAddStaffModal((prev) => ({ ...prev, open: true, loading: true, nonStaffUsers: [] }));
    try {
      const response = await StandardizedApi.get(API_USER_MANAGEMENT, { includeInactive: true });
      const list = Array.isArray(response) ? response : (response?.data && Array.isArray(response.data) ? response.data : []);
      const roleOf = (u) => (typeof u.role === 'string' ? u.role : u.role?.name) || '';
      const nonStaff = list.filter((u) => roleOf(u) !== ROLE_STAFF);
      setAddStaffModal((prev) => ({ ...prev, nonStaffUsers: nonStaff, loading: false }));
    } catch (err) {
      console.error('사용자 목록 조회 실패:', err);
      showError(STAFF_MGMT_MSG.ERR_LOAD_USER_LIST);
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

  const handleStaffEmailDuplicateCheck = useCallback(async() => {
    const email = (createForm.email || '').trim();
    if (!email) {
      showError(VALIDATION_MESSAGES.REQUIRED_EMAIL);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError(VALIDATION_MESSAGES.INVALID_EMAIL_FORMAT);
      return;
    }
    setIsCheckingStaffEmail(true);
    setStaffEmailCheckStatus('checking');
    try {
      const response = await StandardizedApi.get('/api/v1/admin/duplicate-check/email', { email });
      if (response && typeof response.isDuplicate === 'boolean') {
        if (response.isDuplicate) {
          setStaffEmailCheckStatus('duplicate');
          showError(VALIDATION_MESSAGES.EMAIL_EXISTS);
        } else {
          setStaffEmailCheckStatus('available');
          showSuccess(VALIDATION_MESSAGES.EMAIL_AVAILABLE);
        }
      } else {
        setStaffEmailCheckStatus(null);
      }
    } catch (err) {
      setStaffEmailCheckStatus(null);
      showError(VALIDATION_MESSAGES.EMAIL_DUPLICATE_CHECK_ERROR);
    } finally {
      setIsCheckingStaffEmail(false);
    }
  }, [createForm.email]);

  const handleCreateStaffSubmit = useCallback(
    async(e) => {
      e.preventDefault();
      const email = (createForm.email || '').trim().toLowerCase();
      const name = (createForm.name || '').trim();
      if (!email) {
        showError(VALIDATION_MESSAGES.REQUIRED_EMAIL);
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
          showSuccess(STAFF_MGMT_MSG.TOAST_STAFF_REGISTERED);
          closeCreateStaffModal();
          loadUsers();
        } else {
          throw new Error(STAFF_MGMT_MSG.ERR_REGISTER_FAILED);
        }
      } catch (err) {
        console.error('스태프 등록 실패:', err);
        showError(err.message || err.response?.data?.message || STAFF_MGMT_MSG.ERR_STAFF_REGISTER_PROCESS);
      } finally {
        setCreateStaffModal((prev) => ({ ...prev, submitting: false }));
      }
    },
    [createForm, closeCreateStaffModal, loadUsers]
  );

  const handleAssignAsStaff = useCallback(
    async(user) => {
      if (!user?.id) return;
      setAddStaffModal((prev) => ({ ...prev, assignSubmitting: true }));
      try {
        const endpoint = `${API_USER_MANAGEMENT}/${user.id}/role?newRole=${encodeURIComponent(ROLE_STAFF)}`;
        const response = await StandardizedApi.put(endpoint, {});
        if (response && response.success !== false) {
          showSuccess(response.message || STAFF_MGMT_MSG.TOAST_ASSIGNED_DEFAULT);
          closeAddStaffModal();
          loadUsers();
        } else {
          throw new Error(response?.message || STAFF_MGMT_MSG.ERR_ASSIGN_FAILED);
        }
      } catch (err) {
        console.error('스태프 지정 실패:', err);
        showError(err.message || STAFF_MGMT_MSG.ERR_ASSIGN_PROCESS);
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

  const roleOf = useCallback(
    (u) => (u == null ? '' : (typeof u.role === 'string' ? u.role : u.role?.name) || ''),
    []
  );

  const handleOpenRoleChange = useCallback(
    (user) => {
      setRoleChangeModal({ open: true, user });
      setSelectedNewRole(roleOf(user) || '');
      if (roles.length === 0) loadRoles();
    },
    [roles.length, loadRoles, roleOf]
  );

  const handleCloseRoleChange = useCallback(() => {
    setRoleChangeModal({ open: false, user: null });
    setSelectedNewRole('');
    setRoleChangeSubmitting(false);
  }, []);

  const handleConfirmRoleChange = useCallback(async() => {
    const { user } = roleChangeModal;
    if (!user || !selectedNewRole || selectedNewRole === roleOf(user)) return;
    setRoleChangeSubmitting(true);
    try {
      const endpoint = `${API_USER_MANAGEMENT}/${user.id}/role?newRole=${encodeURIComponent(selectedNewRole)}`;
      const response = await StandardizedApi.put(endpoint, {});
      if (response && response.success !== false) {
        showSuccess(response.message || STAFF_MGMT_MSG.TOAST_ROLE_CHANGED);
        handleCloseRoleChange();
        loadUsers();
      } else {
        throw new Error(response?.message || STAFF_MGMT_MSG.ERR_ROLE_FAILED);
      }
    } catch (err) {
      console.error('역할 변경 실패:', err);
      showError(err.message || STAFF_MGMT_MSG.ERR_ROLE_PROCESS);
    } finally {
      setRoleChangeSubmitting(false);
    }
  }, [roleChangeModal, selectedNewRole, handleCloseRoleChange, loadUsers, roleOf]);

  const handleStaffEditSubmit = useCallback(async() => {
    const { staff } = staffEditModal;
    if (!staff?.id) return;
    const name = (staffEditForm.name || '').trim();
    const email = (staffEditForm.email || '').trim();
    if (!name) {
      showError(STAFF_MGMT_MSG.VAL_NAME_REQUIRED);
      return;
    }
    if (!email) {
      showError(STAFF_MGMT_MSG.VAL_EMAIL_REQUIRED);
      return;
    }
    setStaffEditSubmitting(true);
    try {
      const response = await StandardizedApi.put(basicProfileEndpoint(staff.id), {
        name,
        email,
        phone: (staffEditForm.phone || '').trim()
      });
      if (response && response.success !== false) {
        showSuccess(response.message || STAFF_MGMT_MSG.TOAST_PROFILE_UPDATED);
        closeStaffEdit();
        await loadUsers();
      } else {
        throw new Error(response?.message || STAFF_MGMT_MSG.ERR_UPDATE_FAILED);
      }
    } catch (err) {
      console.error('스태프 기본 정보 수정 실패:', err);
      showError(err.message || STAFF_MGMT_MSG.ERR_UPDATE_PROCESS);
    } finally {
      setStaffEditSubmitting(false);
    }
  }, [staffEditModal, staffEditForm, closeStaffEdit, loadUsers]);

  const renderStaffActionBar = useCallback(
    (staff, { compact = false } = {}) => {
      const stop = (e) => {
        e.stopPropagation();
      };
      const wrapClass = [
        'mg-v2-profile-card__actions',
        'mg-v2-client-actions',
        compact && 'mg-v2-client-actions--compact'
      ]
        .filter(Boolean)
        .join(' ');
      return (
        <div
          className={wrapClass}
          onClick={stop}
          onKeyDown={stop}
          role="group"
          aria-label={STAFF_MGMT_ARIA.STAFF_ACTIONS}
        >
          <MGButton
            type="button"
            variant="secondary"
            size="small"
            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
            onClick={() => openStaffDetail(staff)}
            preventDoubleClick={false}
          >
            {STAFF_MGMT_BUTTON.DETAIL}
          </MGButton>
          <MGButton
            type="button"
            variant="primary"
            size="small"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
            onClick={() => openStaffEdit(staff)}
            preventDoubleClick={false}
          >
            {STAFF_MGMT_BUTTON.EDIT}
          </MGButton>
          <MGButton
            type="button"
            variant="secondary"
            size="small"
            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
            onClick={() => handleOpenRoleChange(staff)}
            preventDoubleClick={false}
          >
            {STAFF_MGMT_BUTTON.ROLE_CHANGE}
          </MGButton>
        </div>
      );
    },
    [openStaffDetail, openStaffEdit, handleOpenRoleChange]
  );

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  if (loading && staffList.length === 0) {
    if (embedded) {
      return (
        <ContentArea ariaLabel={STAFF_MGMT_PAGE.ARIA_MAIN}>
          <div aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text={STAFF_MGMT_PAGE.LOADING} variant="pulse" />
          </div>
        </ContentArea>
      );
    }
    return (
      <ContentArea ariaLabel={STAFF_MGMT_PAGE.ARIA_MAIN}>
        <ContentHeader
          title={STAFF_MGMT_PAGE.TITLE}
          subtitle={STAFF_MGMT_PAGE.SUBTITLE}
        />
        <div aria-busy="true" aria-live="polite">
          <UnifiedLoading type="inline" text={STAFF_MGMT_PAGE.LOADING} variant="pulse" />
        </div>
      </ContentArea>
    );
  }

  return (
    <>
      <ContentArea ariaLabel={STAFF_MGMT_PAGE.ARIA_MAIN}>
        {!embedded && (
          <ContentHeader
            title={STAFF_MGMT_PAGE.TITLE}
            subtitle={STAFF_MGMT_PAGE.SUBTITLE}
          />
        )}

        <ContentSection noCard className="mg-v2-mapping-kpi-section">
        <div className="mg-v2-mapping-kpi-section__grid">
          <div className="mg-v2-mapping-kpi-section__card">
            <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--blue">
              <Users size={24} />
            </div>
            <div className="mg-v2-mapping-kpi-section__info">
              <span className="mg-v2-mapping-kpi-section__label">{STAFF_MGMT_PAGE.KPI_TOTAL}</span>
              <span className="mg-v2-mapping-kpi-section__value">{staffList.length}{STAFF_MGMT_PAGE.KPI_UNIT}</span>
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
              placeholder={STAFF_MGMT_PLACEHOLDER.SEARCH_NAME_EMAIL_PHONE}
            />
          </div>
          <div className="mg-v2-mapping-search-section__chips">
            <MGButton
              type="button"
              variant="primary"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
              onClick={openCreateStaffModal}
              disabled={loading}
              preventDoubleClick={false}
            >
              {STAFF_MGMT_BUTTON.NEW_STAFF}
            </MGButton>
            <MGButton
              type="button"
              variant="secondary"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
              onClick={openAddStaffModal}
              disabled={loading}
              preventDoubleClick={false}
            >
              {STAFF_MGMT_BUTTON.ASSIGN_STAFF}
            </MGButton>
            <MGButton
              type="button"
              variant="secondary"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'secondary',
                size: 'sm',
                loading,
                className: 'mg-v2-mapping-header-btn mg-v2-mapping-header-btn--secondary'
              })}
              onClick={loadUsers}
              disabled={loading}
              loading={loading}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
            >
{STAFF_MGMT_BUTTON.REFRESH}
            </MGButton>
          </div>
        </div>
      </ContentSection>

      <div className="mg-v2-tab-content">
        <ContentSection noCard className="mg-v2-mapping-list-block">
          <ContentCard className="mg-v2-mapping-list-block__card">
            <div className="mg-v2-mapping-list-block__header">
              <div className="mg-v2-mapping-list-block__title">{STAFF_MGMT_PAGE.LIST_HEADING}</div>
              <ViewModeToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                className="mg-v2-mapping-list-block__toggle"
                ariaLabel={STAFF_MGMT_ARIA.VIEW_MODE_TOGGLE}
              />
            </div>
            {filteredStaff.length === 0 ? (
              <div className="mg-v2-mapping-list-block__empty">
                <div className="mg-v2-mapping-list-block__empty-icon">
                  <User size={48} />
                </div>
                <h3 className="mg-v2-mapping-list-block__empty-title">
                  {staffList.length === 0 ? STAFF_MGMT_PAGE.EMPTY_NO_STAFF_TITLE : STAFF_MGMT_PAGE.EMPTY_NO_SEARCH_TITLE}
                </h3>
                <p className="mg-v2-mapping-list-block__empty-desc">
                  {staffList.length === 0 ? STAFF_MGMT_PAGE.EMPTY_NO_STAFF_DESC : STAFF_MGMT_PAGE.EMPTY_NO_SEARCH_DESC}
                </p>
              </div>
            ) : viewMode === 'largeCard' ? (
              <div className="mg-v2-mapping-list-block__grid">
                {filteredStaff.map((staff) => (
                <div key={staff.id} className="mg-v2-profile-card">
                  <div className="mg-v2-profile-card__header">
                    <Avatar
                      profileImageUrl={staff.profileImageUrl}
                      displayName={toDisplayString(staff.name)}
                      className="mg-v2-profile-card__avatar"
                      size={48}
                    />
                    <div className="mg-v2-profile-card__info">
                      <h3 className="mg-v2-profile-card__name">{maskEncryptedDisplay(staff.name, STAFF_MGMT_MASK.NAME)}</h3>
                      <div className="mg-v2-profile-card__contact">
                        <span className="mg-v2-profile-card__email">
                          <Mail size={12} /> {maskEncryptedDisplay(staff.email, STAFF_MGMT_MASK.EMAIL)}
                        </span>
                        <span className="mg-v2-profile-card__phone">
                          <Phone size={12} /> {formatKoreanMobileForDisplay(maskEncryptedDisplay(staff.phone, STAFF_MGMT_MASK.PHONE_NONE))}
                        </span>
                      </div>
                    </div>
                    <div className="mg-v2-profile-card__badges">
                      <StatusBadge variant={staff.role === 'ADMIN' ? 'info' : 'neutral'}>
                        {STAFF_MGMT_ROLE_LABELS[staff.role] || staff.role}
                      </StatusBadge>
                      <StatusBadge variant={staff.isActive ? 'success' : 'neutral'}>
                        {staff.isActive ? STAFF_MGMT_STATUS.ACTIVE : STAFF_MGMT_STATUS.INACTIVE}
                      </StatusBadge>
                    </div>
                  </div>
                  <div className="mg-v2-profile-card__footer">
                    {renderStaffActionBar(staff)}
                  </div>
                </div>
              ))}
            </div>
            ) : viewMode === 'smallCard' ? (
              <SmallCardGrid>
                {filteredStaff.map((staff) => (
                  <div
                    key={staff.id}
                    className="mg-v2-profile-card mg-v2-profile-card--compact"
                    onClick={() => openStaffDetail(staff)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openStaffDetail(staff); } }}
                  >
                    <div className="mg-v2-profile-card__header">
                      <Avatar
                        profileImageUrl={staff.profileImageUrl}
                        displayName={toDisplayString(staff.name)}
                        className="mg-v2-profile-card__avatar"
                        size={36}
                      />
                      <div className="mg-v2-profile-card__info">
                        <h3 className="mg-v2-profile-card__name">{maskEncryptedDisplay(staff.name, STAFF_MGMT_MASK.NAME)}</h3>
                        <div className="mg-v2-profile-card__contact">
                          <span className="mg-v2-profile-card__email"><Mail size={12} /> {maskEncryptedDisplay(staff.email, STAFF_MGMT_MASK.EMAIL)}</span>
                          <span className="mg-v2-profile-card__phone"><Phone size={12} /> {formatKoreanMobileForDisplay(maskEncryptedDisplay(staff.phone, STAFF_MGMT_MASK.PHONE_NONE))}</span>
                        </div>
                      </div>
                      <div className="mg-v2-profile-card__badges">
                        <StatusBadge variant={staff.role === 'ADMIN' ? 'info' : 'neutral'}>
                          {STAFF_MGMT_ROLE_LABELS[staff.role] || staff.role}
                        </StatusBadge>
                        <StatusBadge variant={staff.isActive ? 'success' : 'neutral'}>
                          {staff.isActive ? STAFF_MGMT_STATUS.ACTIVE : STAFF_MGMT_STATUS.INACTIVE}
                        </StatusBadge>
                      </div>
                    </div>
                    <div className="mg-v2-profile-card__inline-actions">
                      {renderStaffActionBar(staff, { compact: true })}
                    </div>
                  </div>
                ))}
              </SmallCardGrid>
            ) : (
              <ListTableView
                columns={[
                  { key: 'name', label: STAFF_MGMT_TABLE.COL_NAME },
                  { key: 'email', label: STAFF_MGMT_TABLE.COL_EMAIL },
                  { key: 'role', label: STAFF_MGMT_TABLE.COL_ROLE },
                  { key: 'isActive', label: STAFF_MGMT_TABLE.COL_STATUS },
                  { key: '_actions', label: STAFF_MGMT_TABLE.COL_ACTIONS }
                ]}
                data={filteredStaff}
                renderCell={(key, item) => {
                  if (key === '_actions') return renderStaffActionBar(item, { table: true });
                  if (key === 'role') return STAFF_MGMT_ROLE_LABELS[item.role] || item.role;
                  if (key === 'isActive') return item.isActive ? STAFF_MGMT_STATUS.ACTIVE : STAFF_MGMT_STATUS.INACTIVE;
                  if (key === 'name') return maskEncryptedDisplay(item.name, STAFF_MGMT_MASK.NAME);
                  if (key === 'email') return maskEncryptedDisplay(item.email, STAFF_MGMT_MASK.EMAIL);
                  const v = item[key];
                  return v != null ? String(v) : '-';
                }}
                onRowClick={openStaffDetail}
              />
            )}
          </ContentCard>
        </ContentSection>
      </div>
      </ContentArea>

      <UnifiedModal
        isOpen={staffDetailModal.open}
        onClose={closeStaffDetail}
        title={STAFF_MGMT_MODAL.DETAIL_TITLE}
        subtitle={staffDetailModal.staff
          ? `${toDisplayString(staffDetailModal.staff.name)} · ${toDisplayString(staffDetailModal.staff.email)}`
          : ''}
        size="medium"
        variant="default"
        actions={
          <MGButton
            type="button"
            variant="secondary"
            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
            onClick={closeStaffDetail}
            preventDoubleClick={false}
          >
            {STAFF_MGMT_BUTTON.CLOSE}
          </MGButton>
        }
      >
        {staffDetailModal.staff && (
          <div className="mg-v2-modal-body mg-v2-form" style={{ display: 'grid', gap: '12px' }}>
            <div>
              <div className="mg-v2-form-label" style={{ marginBottom: 4 }}>{STAFF_MGMT_MASK.NAME}</div>
              <SafeText tag="div">{maskEncryptedDisplay(staffDetailModal.staff.name, STAFF_MGMT_MASK.NAME)}</SafeText>
            </div>
            <div>
              <div className="mg-v2-form-label" style={{ marginBottom: 4 }}>{STAFF_MGMT_MASK.EMAIL}</div>
              <SafeText tag="div">{maskEncryptedDisplay(staffDetailModal.staff.email, STAFF_MGMT_MASK.EMAIL)}</SafeText>
            </div>
            <div>
              <div className="mg-v2-form-label" style={{ marginBottom: 4 }}>{STAFF_MGMT_FORM_LABEL.PHONE}</div>
              <SafeText tag="div">{formatKoreanMobileForDisplay(maskEncryptedDisplay(staffDetailModal.staff.phone, STAFF_MGMT_MASK.PHONE_NONE))}</SafeText>
            </div>
            <div>
              <div className="mg-v2-form-label" style={{ marginBottom: 4 }}>{STAFF_MGMT_FORM_LABEL.ROLE}</div>
              <div>{STAFF_MGMT_ROLE_LABELS[staffDetailModal.staff.role] || staffDetailModal.staff.role}</div>
            </div>
            <div>
              <div className="mg-v2-form-label" style={{ marginBottom: 4 }}>{STAFF_MGMT_FORM_LABEL.STATUS}</div>
              <div>{staffDetailModal.staff.isActive ? STAFF_MGMT_STATUS.ACTIVE : STAFF_MGMT_STATUS.INACTIVE}</div>
            </div>
            <div>
              <div className="mg-v2-form-label" style={{ marginBottom: 4 }}>{STAFF_MGMT_FORM_LABEL.CREATED_AT}</div>
              <div>
                {staffDetailModal.staff.createdAt
                  ? new Date(staffDetailModal.staff.createdAt).toLocaleString('ko-KR')
                  : '-'}
              </div>
            </div>
            {(staffDetailModal.staff.address || staffDetailModal.staff.addressDetail || staffDetailModal.staff.postalCode) && (
              <div>
                <div className="mg-v2-form-label" style={{ marginBottom: 4 }}>{STAFF_MGMT_FORM_LABEL.ADDRESS}</div>
                <SafeText tag="div">
                  {[
                    toDisplayString(staffDetailModal.staff.postalCode, ''),
                    toDisplayString(staffDetailModal.staff.address, ''),
                    toDisplayString(staffDetailModal.staff.addressDetail, '')
                  ].filter(Boolean).join(' ') || '-'}
                </SafeText>
              </div>
            )}
          </div>
        )}
      </UnifiedModal>

      <UnifiedModal
        isOpen={staffEditModal.open}
        onClose={closeStaffEdit}
        title={STAFF_MGMT_MODAL.EDIT_TITLE}
        subtitle={STAFF_MGMT_MODAL.EDIT_SUBTITLE}
        size="medium"
        variant="form"
        loading={staffEditSubmitting}
        actions={
          <>
            <MGButton
              type="button"
              variant="secondary"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
              onClick={closeStaffEdit}
              disabled={staffEditSubmitting}
              preventDoubleClick={false}
            >
              {STAFF_MGMT_BUTTON.CANCEL}
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: staffEditSubmitting })}
              onClick={handleStaffEditSubmit}
              disabled={staffEditSubmitting}
              loading={staffEditSubmitting}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
            >
              {STAFF_MGMT_BUTTON.SAVE}
            </MGButton>
          </>
        }
      >
        <div className="mg-modal__form-group">
          <label htmlFor="staff-edit-name" className="mg-modal__label">{STAFF_MGMT_FORM_LABEL.NAME_REQUIRED}</label>
          <input
            id="staff-edit-name"
            name="name"
            className="mg-v2-form-input"
            value={staffEditForm.name}
            onChange={handleStaffEditFieldChange}
            disabled={staffEditSubmitting}
            autoComplete="name"
          />
        </div>
        <div className="mg-modal__form-group">
          <label htmlFor="staff-edit-email" className="mg-modal__label">{STAFF_MGMT_FORM_LABEL.EMAIL_REQUIRED}</label>
          <input
            id="staff-edit-email"
            name="email"
            type="email"
            className="mg-v2-form-input"
            value={staffEditForm.email}
            onChange={handleStaffEditFieldChange}
            disabled={staffEditSubmitting}
            autoComplete="email"
          />
        </div>
        <div className="mg-modal__form-group">
          <label htmlFor="staff-edit-phone" className="mg-modal__label">{STAFF_MGMT_FORM_LABEL.PHONE}</label>
          <input
            id="staff-edit-phone"
            name="phone"
            className="mg-v2-form-input"
            value={staffEditForm.phone}
            onChange={handleStaffEditFieldChange}
            disabled={staffEditSubmitting}
            placeholder={STAFF_MGMT_PLACEHOLDER.EDIT_PHONE_CLEAR}
            autoComplete="tel"
          />
        </div>
      </UnifiedModal>

      <UnifiedModal
        isOpen={roleChangeModal.open}
        onClose={handleCloseRoleChange}
        title={STAFF_MGMT_MODAL.ROLE_TITLE}
        subtitle={roleChangeModal.user
          ? `${toDisplayString(roleChangeModal.user.name)} (${toDisplayString(roleChangeModal.user.email)})`
          : ''}
        size="small"
        variant="form"
        loading={roleChangeSubmitting}
        actions={
          <>
            <MGButton
              type="button"
              variant="secondary"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
              onClick={handleCloseRoleChange}
              disabled={roleChangeSubmitting}
              preventDoubleClick={false}
            >
              {STAFF_MGMT_BUTTON.CANCEL}
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: roleChangeSubmitting })}
              onClick={handleConfirmRoleChange}
              disabled={roleChangeSubmitting || !selectedNewRole || selectedNewRole === roleOf(roleChangeModal.user)}
              loading={roleChangeSubmitting}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
            >
              {STAFF_MGMT_BUTTON.CONFIRM}
            </MGButton>
          </>
        }
      >
        <div className="mg-modal__form-group">
          <label htmlFor="staff-role-select" className="mg-modal__label">
            {STAFF_MGMT_MODAL.LABEL_NEW_ROLE}
          </label>
          <select
            id="staff-role-select"
            className="mg-modal__select"
            value={selectedNewRole}
            onChange={(e) => setSelectedNewRole(e.target.value)}
            disabled={roleChangeSubmitting}
          >
            <option value="">{STAFF_MGMT_MODAL.ROLE_SELECT_PLACEHOLDER}</option>
            {roles.map((role) => {
              const code = typeof role === 'string' ? role : role?.name || role;
              if (!code) return null;
              return (
                <option key={code} value={code}>
                  {STAFF_MGMT_ROLE_LABELS[code] || code}
                </option>
              );
            })}
          </select>
        </div>
      </UnifiedModal>

      <UnifiedModal
        isOpen={addStaffModal.open}
        onClose={closeAddStaffModal}
        title={STAFF_MGMT_MODAL.ASSIGN_TITLE}
        subtitle={STAFF_MGMT_MODAL.ASSIGN_SUBTITLE}
        size="medium"
        variant="form"
        loading={addStaffModal.loading}
        actions={
          <MGButton
            type="button"
            variant="secondary"
            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
            onClick={closeAddStaffModal}
            preventDoubleClick={false}
          >
            {STAFF_MGMT_BUTTON.CLOSE}
          </MGButton>
        }
      >
        {addStaffModal.loading ? (
          <UnifiedLoading type="block" text={STAFF_MGMT_MODAL.LOADING_USERS} variant="pulse" />
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
        title={STAFF_MGMT_MODAL.CREATE_TITLE}
        subtitle={STAFF_MGMT_MODAL.CREATE_SUBTITLE}
        size="large"
        variant="form"
        className="mg-v2-ad-b0kla"
        loading={createStaffModal.submitting}
        actions={
          <>
            <MGButton
              type="button"
              variant="secondary"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
              onClick={closeCreateStaffModal}
              disabled={createStaffModal.submitting}
              preventDoubleClick={false}
            >
              {STAFF_MGMT_BUTTON.CANCEL}
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: createStaffModal.submitting })}
              onClick={handleCreateStaffSubmit}
              disabled={createStaffModal.submitting || !(createForm.email || '').trim()}
              loading={createStaffModal.submitting}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
            >
              {STAFF_MGMT_BUTTON.REGISTER}
            </MGButton>
          </>
        }
      >
        <div className="mg-v2-modal-body">
          <form onSubmit={handleCreateStaffSubmit} className="mg-v2-form">
            <div className="mg-v2-info-box mg-v2-ad-b0kla-info-box">
              <p className="mg-v2-info-text">{STAFF_MGMT_HELP.PASSWORD_AUTO_INFO}</p>
            </div>
            <ProfileImageInput
              value={createForm.profileImageUrl || ''}
              onChange={(url) => setCreateForm((prev) => ({ ...prev, profileImageUrl: url || '' }))}
              maxBytes={2 * 1024 * 1024}
              cropSize={400}
              maxSize={512}
              quality={0.85}
              helpText={STAFF_MGMT_HELP.PROFILE_IMAGE}
            />
            <div className="mg-v2-form-group">
              <div className="mg-v2-form-row mg-v2-form-row--two" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div className="mg-v2-form-group">
                  <label htmlFor="staff-rrnFirst6" className="mg-v2-form-label">{STAFF_MGMT_FORM_LABEL.RRN_FIRST_OPTIONAL}</label>
                  <input
                    type="text"
                    id="staff-rrnFirst6"
                    name="rrnFirst6"
                    value={createForm.rrnFirst6}
                    onChange={handleCreateFormChange}
                    placeholder={STAFF_MGMT_PLACEHOLDER.RRN_FIRST6}
                    maxLength={6}
                    inputMode="numeric"
                    className="mg-v2-form-input"
                    disabled={createStaffModal.submitting}
                  />
                </div>
                <div className="mg-v2-form-group">
                  <label htmlFor="staff-rrnLast1" className="mg-v2-form-label">{STAFF_MGMT_FORM_LABEL.RRN_LAST_OPTIONAL}</label>
                  <input
                    type="text"
                    id="staff-rrnLast1"
                    name="rrnLast1"
                    value={createForm.rrnLast1}
                    onChange={handleCreateFormChange}
                    placeholder={STAFF_MGMT_PLACEHOLDER.RRN_LAST1}
                    maxLength={1}
                    inputMode="numeric"
                    className="mg-v2-form-input"
                    disabled={createStaffModal.submitting}
                  />
                </div>
              </div>
            </div>
            <div className="mg-v2-form-group">
              <label htmlFor="staff-name" className="mg-v2-form-label">{STAFF_MGMT_FORM_LABEL.NAME_REQUIRED}</label>
              <input
                type="text"
                id="staff-name"
                name="name"
                value={createForm.name}
                onChange={handleCreateFormChange}
                placeholder={STAFF_MGMT_PLACEHOLDER.CREATE_NAME}
                className="mg-v2-form-input"
                required
                disabled={createStaffModal.submitting}
              />
            </div>
            <div className="mg-v2-form-group">
              <label htmlFor="staff-phone" className="mg-v2-form-label">{STAFF_MGMT_FORM_LABEL.PHONE}</label>
              <input
                type="tel"
                id="staff-phone"
                name="phone"
                value={createForm.phone}
                onChange={handleCreateFormChange}
                placeholder={STAFF_MGMT_PLACEHOLDER.CREATE_PHONE}
                className="mg-v2-form-input"
                disabled={createStaffModal.submitting}
              />
            </div>
            <div className="mg-v2-form-group">
              <label htmlFor="staff-address-input" className="mg-v2-form-label">{STAFF_MGMT_FORM_LABEL.ADDRESS_SEARCH}</label>
              <div className="mg-v2-address-search-row" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <MGButton
                  type="button"
                  variant="secondary"
                  size="small"
                  className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
                  onClick={() => {
                    if (globalThis.window?.daum?.Postcode) {
                      new globalThis.window.daum.Postcode({
                        oncomplete: function(data) {
                          setCreateForm((prev) => ({
                            ...prev,
                            postalCode: data.zonecode || '',
                            address: data.address || ''
                          }));
                        }
                      }).open();
                    } else {
                      showError(STAFF_MGMT_MSG.ERR_ADDRESS_API);
                    }
                  }}
                  disabled={createStaffModal.submitting}
                  preventDoubleClick={false}
                >
                  {STAFF_MGMT_BUTTON.ADDRESS_SEARCH}
                </MGButton>
                <input
                  id="staff-address-input"
                  type="text"
                  readOnly
                  className="mg-v2-form-input"
                  style={{ flex: 1, minWidth: '200px' }}
                  value={createForm.address}
                  placeholder={STAFF_MGMT_PLACEHOLDER.CREATE_ADDRESS}
                />
              </div>
            </div>
            <div className="mg-v2-form-group">
              <label htmlFor="staff-addressDetail" className="mg-v2-form-label">{STAFF_MGMT_FORM_LABEL.ADDRESS_DETAIL}</label>
              <input
                type="text"
                id="staff-addressDetail"
                name="addressDetail"
                value={createForm.addressDetail}
                onChange={handleCreateFormChange}
                placeholder={STAFF_MGMT_PLACEHOLDER.CREATE_ADDRESS_DETAIL}
                className="mg-v2-form-input"
                disabled={createStaffModal.submitting}
              />
            </div>
            <div className="mg-v2-form-group">
              <label htmlFor="staff-postalCode" className="mg-v2-form-label">{STAFF_MGMT_FORM_LABEL.POSTAL}</label>
              <input
                type="text"
                id="staff-postalCode"
                name="postalCode"
                value={createForm.postalCode}
                onChange={handleCreateFormChange}
                placeholder={STAFF_MGMT_PLACEHOLDER.CREATE_POSTAL}
                maxLength={5}
                className="mg-v2-form-input"
                disabled={createStaffModal.submitting}
              />
            </div>
            <div className="mg-v2-form-group">
              <label htmlFor="staff-email" className="mg-v2-form-label">{VALIDATION_MESSAGES.LABEL_EMAIL_REQUIRED}</label>
              <div className="mg-v2-form-email-row">
                <div className="mg-v2-form-email-row__input-wrap">
                  <MgEmailFieldWithAutocomplete
                    id="staff-email"
                    name="email"
                    value={createForm.email}
                    onChange={handleCreateFormChange}
                    placeholder={STAFF_MGMT_PLACEHOLDER.CREATE_EMAIL}
                    required
                    disabled={createStaffModal.submitting}
                    autocompleteMode="datalist"
                  />
                </div>
                <MGButton
                  type="button"
                  variant="secondary"
                  size="small"
                  className={buildErpMgButtonClassName({
                    variant: 'secondary',
                    size: 'sm',
                    loading: isCheckingStaffEmail,
                    className: 'mg-v2-button--compact'
                  })}
                  onClick={handleStaffEmailDuplicateCheck}
                  disabled={isCheckingStaffEmail || !(createForm.email || '').trim() || createStaffModal.submitting}
                  data-action="email-duplicate-check"
                  loading={isCheckingStaffEmail}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  preventDoubleClick={false}
                >
                  {VALIDATION_MESSAGES.BUTTON_DUPLICATE_CHECK}
                </MGButton>
              </div>
              {staffEmailCheckStatus === 'duplicate' && (
                <small className="mg-v2-form-help mg-v2-form-help--error">{VALIDATION_MESSAGES.EMAIL_EXISTS}</small>
              )}
              {staffEmailCheckStatus === 'available' && (
                <small className="mg-v2-form-help mg-v2-form-help--success">{VALIDATION_MESSAGES.EMAIL_AVAILABLE}</small>
              )}
            </div>
            <div className="mg-v2-form-group">
              <label htmlFor="staff-password" className="mg-v2-form-label">{STAFF_MGMT_FORM_LABEL.PASSWORD}</label>
              <input
                type="password"
                id="staff-password"
                name="password"
                value={createForm.password}
                onChange={handleCreateFormChange}
                placeholder={STAFF_MGMT_PLACEHOLDER.CREATE_PASSWORD}
                className="mg-v2-form-input"
                disabled={createStaffModal.submitting}
              />
              <small className="mg-v2-form-help">{STAFF_MGMT_HELP.PASSWORD_HINT}</small>
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
