/**
 * 스태프·관리자 계정 관리 (목록 조회·상세·기본 정보 수정·역할 변경)
 * - GET user-management: role=STAFF 및 role=ADMIN 병합 목록
 * - 관리자(ADMIN) 상세: GET /api/v1/admin/users/{id}로 상담 겸직(counselingEnabled) 표시,
 *   PUT /api/v1/admin/users/{id}/counseling-enabled 갱신 (CONSULTANT_MANAGE 권한)
 * - 기본 정보 수정: PUT /api/v1/admin/user-management/{id}/basic-profile
 * - 역할 변경: UnifiedModal + GET roles, PUT .../role?newRole=...
 *
 * @author Core Solution
 * @since 2026-03-05
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { User, Users, Mail, Phone } from 'lucide-react';
import StandardizedApi from '../../utils/standardizedApi';
import UnifiedLoading from '../common/UnifiedLoading';
import UnifiedModal from '../common/modals/UnifiedModal';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import ContentCard from '../dashboard-v2/content/ContentCard';
import { ViewModeToggle, SafeText, SidePeekShell, USER_MANAGEMENT_DEFAULT_VIEW_MODE } from '../common';
import { SearchInput } from '../dashboard-v2/atoms';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import StaffOverviewTab from './StaffManagement/StaffOverviewTab';
import StaffSidePeekContent from './StaffManagement/molecules/StaffSidePeekContent';
import { showSuccess, showError } from '../../utils/notification';
import { maskEncryptedDisplay } from '../../utils/codeHelper';
import { formatKoreanMobileForDisplay, isValidKoreanMobileDigits, normalizeKoreanMobileDigits } from '../../utils/koreanMobilePhone';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { VALIDATION_MESSAGES } from '../../constants/messages';
import {
  STAFF_MGMT_ARIA,
  STAFF_MGMT_BUTTON,
  STAFF_MGMT_COUNSELING,
  STAFF_MGMT_FORM_LABEL,
  STAFF_MGMT_HELP,
  STAFF_MGMT_MASK,
  STAFF_MGMT_MODAL,
  STAFF_MGMT_MSG,
  STAFF_MGMT_PAGE,
  STAFF_MGMT_PLACEHOLDER,
  STAFF_MGMT_ROLE_LABELS,
  STAFF_MGMT_STATUS
} from '../../constants/staffManagementStrings';
import { fetchUserPermissions, hasPermission, PERMISSIONS } from '../../utils/permissionUtils';
import MgEmailFieldWithAutocomplete from '../common/MgEmailFieldWithAutocomplete';
import KoreanMobileDuplicateField from '../common/molecules/KoreanMobileDuplicateField';
import ProfileImageInput from '../common/ProfileImageInput';
import Avatar from '../common/Avatar';
import '../../styles/unified-design-tokens.css';
import { toDisplayString } from '../../utils/safeDisplay';
import { useSession } from '../../contexts/SessionContext';
import './ClientComprehensiveManagement/ClientModal.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './mapping-management/organisms/MappingKpiSection.css';
import './mapping-management/organisms/MappingSearchSection.css';
import './mapping-management/organisms/MappingListBlock.css';
import './StaffManagementPage.css';

import { USER_ROLES } from '../../constants/roles';

const STAFF_MGMT_PEEK_LAYOUT_CLASS = 'staff-management__peek-layout';
const STAFF_MGMT_PEEK_LAYOUT_OPEN_MODIFIER = 'staff-management__peek-layout--peek-open';
const STAFF_MGMT_MAIN_REGION_CLASS = 'staff-management__main-region';

const API_USER_MANAGEMENT = '/api/v1/admin/user-management';
const API_ROLES = '/api/v1/admin/user-management/roles';
const API_STAFF_REGISTER = '/api/v1/admin/staff';
const basicProfileEndpoint = (userId) => `/api/v1/admin/user-management/${userId}/basic-profile`;
const staffDeleteEndpoint = (userId) => `/api/v1/admin/staff/${userId}`;
const ROLE_STAFF = USER_ROLES.STAFF;
const ROLE_ADMIN = USER_ROLES.ADMIN;
const adminUserDetailPath = (userId) => `/api/v1/admin/users/${userId}`;
const adminCounselingEnabledPath = (userId) => `/api/v1/admin/users/${userId}/counseling-enabled`;

/** AdminUserController 목록 응답 → 사용자 배열 */
const parseUserManagementListPayload = (response) => {
  if (Array.isArray(response)) {
    return response;
  }
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
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
      <div className="mg-v2-client-list-block mg-v2-client-list-block--scrollable">
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
  const { hasRole, user: sessionUser } = useSession();
  const sessionUserId = sessionUser?.id ?? null;
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
  const [staffPhoneCheckStatus, setStaffPhoneCheckStatus] = useState(null);
  const [isCheckingStaffPhone, setIsCheckingStaffPhone] = useState(false);
  const staffEditPhoneBaselineRef = useRef('');
  const [viewMode, setViewMode] = useState(USER_MANAGEMENT_DEFAULT_VIEW_MODE);
  const [peekStaff, setPeekStaff] = useState(null);
  const [staffDetailModal, setStaffDetailModal] = useState({ open: false, staff: null });
  const [staffEditModal, setStaffEditModal] = useState({ open: false, staff: null });
  const [staffEditForm, setStaffEditForm] = useState({ name: '', email: '', phone: '' });
  const [staffEditSubmitting, setStaffEditSubmitting] = useState(false);
  const [staffDeleteModal, setStaffDeleteModal] = useState({ open: false, staff: null, submitting: false });
  const [userPermissions, setUserPermissions] = useState([]);
  const [counselingDetail, setCounselingDetail] = useState({
    loading: false,
    enabled: null,
    saving: false
  });

  const canConsultantManage = hasPermission(userPermissions, PERMISSIONS.CONSULTANT_MANAGE);
  /** API updateCounselingEnabled는 세션 역할 ADMIN만 허용 */
  const canEditAdminCounselingDual = canConsultantManage && hasRole(USER_ROLES.ADMIN);

  useEffect(() => {
    fetchUserPermissions(setUserPermissions);
  }, []);

  const normalizeStaffPhoneForEdit = useCallback((p) => {
    if (p == null || String(p).trim() === '' || String(p).trim() === STAFF_MGMT_MASK.PHONE_NONE) return '';
    return String(p).trim();
  }, []);

  const handleStaffPeek = useCallback((staff) => {
    setPeekStaff(staff);
  }, []);

  const handleCloseStaffPeek = useCallback(() => {
    setPeekStaff(null);
  }, []);

  const openStaffDetail = useCallback((staff) => {
    setStaffDetailModal({ open: true, staff });
  }, []);

  const closeStaffDetail = useCallback(() => {
    setStaffDetailModal({ open: false, staff: null });
    setCounselingDetail({ loading: false, enabled: null, saving: false });
  }, []);

  const openStaffEdit = useCallback(
    (staff) => {
      if (!staff?.id) return;
      const phoneEdit = normalizeStaffPhoneForEdit(staff.phone);
      setStaffEditForm({
        name: maskEncryptedDisplay(staff.name, STAFF_MGMT_MASK.NAME) || '',
        email: maskEncryptedDisplay(staff.email, STAFF_MGMT_MASK.EMAIL) || '',
        phone: phoneEdit
      });
      staffEditPhoneBaselineRef.current = phoneEdit
        ? normalizeKoreanMobileDigits(phoneEdit)
        : '';
      setStaffPhoneCheckStatus(null);
      setStaffEditModal({ open: true, staff });
    },
    [normalizeStaffPhoneForEdit]
  );

  const closeStaffEdit = useCallback(() => {
    setStaffEditModal({ open: false, staff: null });
    setStaffEditForm({ name: '', email: '', phone: '' });
    setStaffEditSubmitting(false);
    setStaffPhoneCheckStatus(null);
    staffEditPhoneBaselineRef.current = '';
  }, []);

  const handleStaffEditFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    setStaffEditForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'phone') {
      setStaffPhoneCheckStatus(null);
    }
  }, []);

  const loadUsers = useCallback(async() => {
    setLoading(true);
    try {
      const [staffPayload, adminPayload] = await Promise.all([
        StandardizedApi.get(API_USER_MANAGEMENT, {
          includeInactive: true,
          role: ROLE_STAFF
        }),
        StandardizedApi.get(API_USER_MANAGEMENT, {
          includeInactive: true,
          role: ROLE_ADMIN
        })
      ]);
      const staffArr = parseUserManagementListPayload(staffPayload);
      const adminArr = parseUserManagementListPayload(adminPayload);
      const normRole = (u) => (typeof u.role === 'string' ? u.role : u.role?.name) || '';
      const roleSortRank = (r) => {
        if (r === ROLE_ADMIN) return 0;
        if (r === ROLE_STAFF) return 1;
        return 9;
      };
      const byId = new Map();
      [...adminArr, ...staffArr].forEach((u) => {
        if (u?.id != null) {
          byId.set(u.id, u);
        }
      });
      const merged = [...byId.values()].sort((a, b) => {
        const ra = normRole(a);
        const rb = normRole(b);
        const d = roleSortRank(ra) - roleSortRank(rb);
        if (d !== 0) {
          return d;
        }
        return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
      });
      setStaffList(merged);
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
    setStaffPhoneCheckStatus(null);
    setCreateStaffModal({ open: true, submitting: false });
  }, []);

  const closeCreateStaffModal = useCallback(() => {
    setCreateStaffModal({ open: false, submitting: false });
    setCreateForm({
      email: '', name: '', password: '', phone: '', profileImageUrl: '',
      rrnFirst6: '', rrnLast1: '', address: '', addressDetail: '', postalCode: ''
    });
    setStaffEmailCheckStatus(null);
    setStaffPhoneCheckStatus(null);
  }, []);

  const handleCreateFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'email') setStaffEmailCheckStatus(null);
    if (name === 'phone') setStaffPhoneCheckStatus(null);
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
      const response = await StandardizedApi.get(API_ENDPOINTS.ADMIN.DUPLICATE_CHECK.EMAIL, { email });
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

  const handleStaffPhoneDuplicateCheck = useCallback(async() => {
    const raw = staffEditModal.open
      ? (staffEditForm.phone || '')
      : (createForm.phone || '');
    const normalized = normalizeKoreanMobileDigits(String(raw).trim());
    if (!normalized || !isValidKoreanMobileDigits(normalized)) {
      showError(VALIDATION_MESSAGES.INVALID_PHONE);
      setStaffPhoneCheckStatus(null);
      return;
    }
    setIsCheckingStaffPhone(true);
    try {
      const params = { phone: normalized };
      if (staffEditModal.open && staffEditModal.staff?.id) {
        params.excludeUserId = staffEditModal.staff.id;
      }
      const response = await StandardizedApi.get(API_ENDPOINTS.ADMIN.DUPLICATE_CHECK.PHONE, params);
      if (response && typeof response.isDuplicate === 'boolean') {
        if (response.isDuplicate === false && response.available === false) {
          setStaffPhoneCheckStatus(null);
          showError(response.message || VALIDATION_MESSAGES.INVALID_PHONE);
          return;
        }
        if (response.isDuplicate) {
          setStaffPhoneCheckStatus('duplicate');
          showError(VALIDATION_MESSAGES.PHONE_EXISTS);
        } else {
          setStaffPhoneCheckStatus('available');
          showSuccess(VALIDATION_MESSAGES.PHONE_AVAILABLE);
        }
      } else {
        setStaffPhoneCheckStatus(null);
      }
    } catch (err) {
      setStaffPhoneCheckStatus(null);
      showError(VALIDATION_MESSAGES.PHONE_DUPLICATE_CHECK_ERROR);
    } finally {
      setIsCheckingStaffPhone(false);
    }
  }, [createForm.phone, staffEditForm.phone, staffEditModal.open, staffEditModal.staff?.id]);

  const handleCreateStaffSubmit = useCallback(
    async(e) => {
      e.preventDefault();
      const email = (createForm.email || '').trim().toLowerCase();
      const name = (createForm.name || '').trim();
      if (!email) {
        showError(VALIDATION_MESSAGES.REQUIRED_EMAIL);
        return;
      }
      const phoneNorm = normalizeKoreanMobileDigits((createForm.phone || '').trim());
      if (phoneNorm && isValidKoreanMobileDigits(phoneNorm) && staffPhoneCheckStatus !== 'available') {
        showError(VALIDATION_MESSAGES.PHONE_DUPLICATE_CHECK_REQUIRED);
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
    [createForm, closeCreateStaffModal, loadUsers, staffPhoneCheckStatus]
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

  useEffect(() => {
    if (!staffDetailModal.open || !staffDetailModal.staff) {
      return undefined;
    }
    const st = staffDetailModal.staff;
    if (roleOf(st) !== ROLE_ADMIN || !canEditAdminCounselingDual) {
      setCounselingDetail({ loading: false, enabled: null, saving: false });
      return undefined;
    }
    let cancelled = false;
    setCounselingDetail((prev) => ({ ...prev, loading: true, enabled: null }));
    (async() => {
      try {
        const data = await StandardizedApi.get(adminUserDetailPath(st.id));
        if (cancelled) return;
        setCounselingDetail({
          loading: false,
          enabled: Boolean(data?.counselingEnabled),
          saving: false
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setCounselingDetail({ loading: false, enabled: null, saving: false });
          showError(STAFF_MGMT_MSG.ERR_LOAD_ADMIN_COUNSELING);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [staffDetailModal.open, staffDetailModal.staff, canEditAdminCounselingDual, roleOf]);

  const handleAdminCounselingToggle = useCallback(
    async(e) => {
      const st = staffDetailModal.staff;
      if (!st?.id || roleOf(st) !== ROLE_ADMIN || !canEditAdminCounselingDual) return;
      const next = e.target.checked;
      setCounselingDetail((prev) => ({ ...prev, saving: true }));
      try {
        const res = await StandardizedApi.put(adminCounselingEnabledPath(st.id), {
          counselingEnabled: next
        });
        const raw = res?.counselingEnabled ?? res?.data?.counselingEnabled;
        const enabled = typeof raw === 'boolean' ? raw : next;
        setCounselingDetail({ loading: false, enabled, saving: false });
        showSuccess(STAFF_MGMT_MSG.TOAST_ADMIN_COUNSELING_SAVED);
        await loadUsers();
        const refreshed = await StandardizedApi.get(adminUserDetailPath(st.id));
        setCounselingDetail({
          loading: false,
          enabled: Boolean(refreshed?.counselingEnabled),
          saving: false
        });
      } catch (err) {
        console.error(err);
        setCounselingDetail((prev) => ({ ...prev, saving: false }));
        showError(err.message || STAFF_MGMT_MSG.ERR_SAVE_ADMIN_COUNSELING);
      }
    },
    [staffDetailModal.staff, roleOf, canEditAdminCounselingDual, loadUsers]
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

  const openStaffDelete = useCallback((staff) => {
    if (!staff?.id) return;
    setStaffDeleteModal({ open: true, staff, submitting: false });
  }, []);

  const closeStaffDelete = useCallback(() => {
    setStaffDeleteModal({ open: false, staff: null, submitting: false });
  }, []);

  const handleConfirmStaffDelete = useCallback(async() => {
    const target = staffDeleteModal.staff;
    if (!target?.id) return;
    setStaffDeleteModal((prev) => ({ ...prev, submitting: true }));
    try {
      const response = await StandardizedApi.delete(staffDeleteEndpoint(target.id));
      if (response && response.success !== false) {
        showSuccess(response.message || STAFF_MGMT_MSG.TOAST_STAFF_DELETED);
        closeStaffDelete();
        await loadUsers();
      } else {
        throw new Error(response?.message || STAFF_MGMT_MSG.ERR_DELETE_FAILED);
      }
    } catch (err) {
      console.error('스태프 삭제 실패:', err);
      showError(err.message || err.response?.data?.message || STAFF_MGMT_MSG.ERR_DELETE_PROCESS);
      setStaffDeleteModal((prev) => ({ ...prev, submitting: false }));
    }
  }, [staffDeleteModal.staff, closeStaffDelete, loadUsers]);

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
    const phoneNorm = normalizeKoreanMobileDigits((staffEditForm.phone || '').trim());
    const baseline = staffEditPhoneBaselineRef.current || '';
    if (phoneNorm && isValidKoreanMobileDigits(phoneNorm) && phoneNorm !== baseline
        && staffPhoneCheckStatus !== 'available') {
      showError(VALIDATION_MESSAGES.PHONE_DUPLICATE_CHECK_REQUIRED);
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
  }, [staffEditModal, staffEditForm, closeStaffEdit, loadUsers, staffPhoneCheckStatus]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  if (loading && staffList.length === 0) {
    if (embedded) {
      return (
        <ContentArea ariaLabel={STAFF_MGMT_PAGE.ARIA_MAIN}>
          <div aria-busy="true" aria-live="polite">
            <UnifiedLoading
              type="inline"
              variant="spinner"
              tone="primary"
              size="md"
              text={STAFF_MGMT_PAGE.LOADING}
            />
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
          <UnifiedLoading
            type="inline"
            variant="spinner"
            tone="primary"
            size="md"
            text={STAFF_MGMT_PAGE.LOADING}
          />
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
          <div
            className={`${STAFF_MGMT_PEEK_LAYOUT_CLASS}${
              peekStaff ? ` ${STAFF_MGMT_PEEK_LAYOUT_OPEN_MODIFIER}` : ''
            }`}
          >
            <div
              className={STAFF_MGMT_MAIN_REGION_CLASS}
              data-region="R-MAIN"
            >
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
                ) : (
                  <StaffOverviewTab
                    staffList={filteredStaff}
                    onStaffPeek={handleStaffPeek}
                    onStaffSelect={openStaffDetail}
                    onEditStaff={openStaffEdit}
                    onRoleChange={handleOpenRoleChange}
                    onDeleteStaff={openStaffDelete}
                    sessionUserId={sessionUserId}
                    viewMode={viewMode}
                  />
                )}
              </ContentCard>
            </div>
            <SidePeekShell
              isOpen={Boolean(peekStaff)}
              onClose={handleCloseStaffPeek}
              title="상세"
              ariaLabel={
                peekStaff
                  ? `${maskEncryptedDisplay(peekStaff.name, STAFF_MGMT_MASK.NAME)} 상세`
                  : '상세'
              }
            >
              <StaffSidePeekContent staff={peekStaff} />
            </SidePeekShell>
          </div>
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
          <div className="mg-v2-modal-body mg-v2-form mg-v2-form-grid">
            <div>
              <div className="mg-v2-form-label">{STAFF_MGMT_MASK.NAME}</div>
              <SafeText tag="div">{maskEncryptedDisplay(staffDetailModal.staff.name, STAFF_MGMT_MASK.NAME)}</SafeText>
            </div>
            <div>
              <div className="mg-v2-form-label">{STAFF_MGMT_MASK.EMAIL}</div>
              <SafeText tag="div">{maskEncryptedDisplay(staffDetailModal.staff.email, STAFF_MGMT_MASK.EMAIL)}</SafeText>
            </div>
            <div>
              <div className="mg-v2-form-label">{STAFF_MGMT_FORM_LABEL.PHONE}</div>
              <SafeText tag="div">{formatKoreanMobileForDisplay(maskEncryptedDisplay(staffDetailModal.staff.phone, STAFF_MGMT_MASK.PHONE_NONE))}</SafeText>
            </div>
            <div>
              <div className="mg-v2-form-label">{STAFF_MGMT_FORM_LABEL.ROLE}</div>
              <div>{STAFF_MGMT_ROLE_LABELS[staffDetailModal.staff.role] || staffDetailModal.staff.role}</div>
            </div>
            {roleOf(staffDetailModal.staff) === ROLE_ADMIN && canEditAdminCounselingDual && (
              <div>
                <div className="mg-v2-form-label">{STAFF_MGMT_FORM_LABEL.COUNSELING_DUAL_ROLE}</div>
                <p className="mg-v2-form-help">{STAFF_MGMT_HELP.ADMIN_COUNSELING_DUAL_ROLE}</p>
                {counselingDetail.loading ? (
                  <p className="mg-v2-text-secondary">{STAFF_MGMT_COUNSELING.LOADING_HINT}</p>
                ) : (
                  <label className="mg-v2-form-checkbox" htmlFor="staff-detail-admin-counseling-enabled">
                    <input
                      id="staff-detail-admin-counseling-enabled"
                      type="checkbox"
                      role="switch"
                      aria-checked={Boolean(counselingDetail.enabled)}
                      checked={Boolean(counselingDetail.enabled)}
                      onChange={handleAdminCounselingToggle}
                      disabled={counselingDetail.saving}
                    />
                    <span>{STAFF_MGMT_COUNSELING.TOGGLE_LABEL}</span>
                  </label>
                )}
              </div>
            )}
            <div>
              <div className="mg-v2-form-label">{STAFF_MGMT_FORM_LABEL.STATUS}</div>
              <div>{staffDetailModal.staff.isActive ? STAFF_MGMT_STATUS.ACTIVE : STAFF_MGMT_STATUS.INACTIVE}</div>
            </div>
            <div>
              <div className="mg-v2-form-label">{STAFF_MGMT_FORM_LABEL.CREATED_AT}</div>
              <div>
                {staffDetailModal.staff.createdAt
                  ? new Date(staffDetailModal.staff.createdAt).toLocaleString('ko-KR')
                  : '-'}
              </div>
            </div>
            {(staffDetailModal.staff.address || staffDetailModal.staff.addressDetail || staffDetailModal.staff.postalCode) && (
              <div>
                <div className="mg-v2-form-label">{STAFF_MGMT_FORM_LABEL.ADDRESS}</div>
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
        <KoreanMobileDuplicateField
          containerClassName="mg-modal__form-group"
          labelClassName="mg-modal__label"
          label={STAFF_MGMT_FORM_LABEL.PHONE}
          id="staff-edit-phone"
          name="phone"
          value={staffEditForm.phone}
          onChange={handleStaffEditFieldChange}
          onBlur={(e) => {
            const raw = String(e.target.value ?? '').trim();
            const n = raw ? normalizeKoreanMobileDigits(raw) : '';
            setStaffEditForm((prev) => (prev.phone === n ? prev : { ...prev, phone: n }));
          }}
          onDuplicateClick={handleStaffPhoneDuplicateCheck}
          isCheckingDuplicate={isCheckingStaffPhone}
          duplicateButtonDataAction="staff-edit-phone-duplicate"
          duplicateButtonLabel={VALIDATION_MESSAGES.BUTTON_DUPLICATE_CHECK}
          checkStatus={staffPhoneCheckStatus === 'duplicate' ? 'duplicate' : staffPhoneCheckStatus === 'available' ? 'available' : null}
          messageDuplicate={VALIDATION_MESSAGES.PHONE_EXISTS}
          messageAvailable={VALIDATION_MESSAGES.PHONE_AVAILABLE}
          disabled={staffEditSubmitting}
          duplicateDisabled={staffEditSubmitting}
          placeholder={STAFF_MGMT_PLACEHOLDER.EDIT_PHONE_CLEAR}
          autoComplete="tel"
        />
      </UnifiedModal>

      <UnifiedModal
        isOpen={staffDeleteModal.open}
        onClose={closeStaffDelete}
        title={STAFF_MGMT_MODAL.DELETE_TITLE}
        subtitle={STAFF_MGMT_MODAL.DELETE_SUBTITLE}
        size="small"
        variant="form"
        loading={staffDeleteModal.submitting}
        actions={
          <>
            <MGButton
              type="button"
              variant="secondary"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
              onClick={closeStaffDelete}
              disabled={staffDeleteModal.submitting}
              preventDoubleClick={false}
            >
              {STAFF_MGMT_BUTTON.CANCEL}
            </MGButton>
            <MGButton
              type="button"
              variant="danger"
              className={buildErpMgButtonClassName({ variant: 'danger', size: 'md', loading: staffDeleteModal.submitting })}
              onClick={handleConfirmStaffDelete}
              disabled={staffDeleteModal.submitting}
              loading={staffDeleteModal.submitting}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
            >
              {STAFF_MGMT_MODAL.DELETE_BUTTON}
            </MGButton>
          </>
        }
      >
        <div className="mg-modal__form-group">
          <p>
            {STAFF_MGMT_MODAL.DELETE_CONFIRM_FMT.replace(
              '{name}',
              staffDeleteModal.staff
                ? toDisplayString(maskEncryptedDisplay(staffDeleteModal.staff.name, STAFF_MGMT_MASK.NAME))
                : ''
            )}
          </p>
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
          <UnifiedLoading
            type="block"
            variant="spinner"
            tone="primary"
            size="md"
            text={STAFF_MGMT_MODAL.LOADING_USERS}
          />
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
              <div className="mg-v2-form-row mg-v2-form-row--two mg-v2-client-modal__form-row-two">
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
            <KoreanMobileDuplicateField
              label={STAFF_MGMT_FORM_LABEL.PHONE}
              id="staff-phone"
              name="phone"
              value={createForm.phone}
              onChange={handleCreateFormChange}
              onBlur={(e) => {
                const raw = String(e.target.value ?? '').trim();
                const n = raw ? normalizeKoreanMobileDigits(raw) : '';
                setCreateForm((prev) => (prev.phone === n ? prev : { ...prev, phone: n }));
              }}
              onDuplicateClick={handleStaffPhoneDuplicateCheck}
              isCheckingDuplicate={isCheckingStaffPhone}
              duplicateButtonDataAction="staff-create-phone-duplicate"
              duplicateButtonLabel={VALIDATION_MESSAGES.BUTTON_DUPLICATE_CHECK}
              checkStatus={staffPhoneCheckStatus === 'duplicate' ? 'duplicate' : staffPhoneCheckStatus === 'available' ? 'available' : null}
              messageDuplicate={VALIDATION_MESSAGES.PHONE_EXISTS}
              messageAvailable={VALIDATION_MESSAGES.PHONE_AVAILABLE}
              disabled={createStaffModal.submitting}
              duplicateDisabled={createStaffModal.submitting}
              placeholder={STAFF_MGMT_PLACEHOLDER.CREATE_PHONE}
            />
            <div className="mg-v2-form-group">
              <label htmlFor="staff-address-input" className="mg-v2-form-label">{STAFF_MGMT_FORM_LABEL.ADDRESS_SEARCH}</label>
              <div className="mg-v2-address-search-row mg-v2-client-modal__address-row">
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
                  className="mg-v2-form-input mg-v2-client-modal__address-input"
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
