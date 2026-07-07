/**
 * 테넌트 공통코드 관리 (G5-02 — ListTableView + SidePeekShell)
 *
 * @author Core Solution
 * @version 3.0.0
 * @since 2025-12-03
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import ContentArea from '../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../dashboard-v2/content/ContentHeader';
import { SidePeekShell } from '../../common';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import TenantCommonCodeTable from './tenant-common-codes/organisms/TenantCommonCodeTable';
import TenantCommonCodeSidePeekContent from './tenant-common-codes/molecules/TenantCommonCodeSidePeekContent';
import TenantCommonCodeFormModal from './tenant-common-codes/molecules/TenantCommonCodeFormModal';
import {
  getTenantCodeGroups,
  getTenantCodesByGroup,
  createTenantCode,
  updateTenantCode,
  deleteTenantCode,
  toggleTenantCodeActive
} from '../../utils/tenantCommonCodeApi';
import { getCommonCodes } from '../../utils/commonCodeApi';
import { getCodeGroupKoreanNameSync, loadCodeGroupMetadata } from '../../utils/codeHelper';
import { resolveTenantCodeOverrideStatus } from '../../utils/tenantCommonCodeDiff';
import { normalizeTenantCommonCodeRow } from '../../constants/professionalProviderRoles';
import notificationManager from '../../utils/notification';
import { useConfirm } from '../../hooks/useConfirm';
import {
  getParentCodeGroupForSubcategory,
  isSubcategoryCodeGroup
} from '../../utils/commonCodeParentGroups';
import { toDisplayString } from '../../utils/safeDisplay';
import {
  TENANT_COMMON_CODE_GROUP_KO_FALLBACK
} from '../../constants/tenantCommonCodeManagerStrings';
import {
  TENANT_COMMON_CODE_FILTER_ALL,
  TENANT_COMMON_CODE_FILTER_ACTIVE,
  TENANT_COMMON_CODE_FILTER_INACTIVE,
  TENANT_COMMON_CODE_PEEK_LAYOUT_CLASS,
  TENANT_COMMON_CODE_PEEK_LAYOUT_OPEN_MODIFIER,
  TENANT_COMMON_CODE_MAIN_REGION_CLASS,
  TENANT_COMMON_CODE_FILTER_LABELS
} from '../../constants/tenantCommonCodeTableConstants';
import { useTranslation } from 'react-i18next';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './CommonCodeManagementB0KlA.css';
import './tenant-common-codes/organisms/TenantCommonCodeTable.css';

const TENANT_COMMON_CODE_TITLE_ID = 'tenant-common-code-title';

const EMPTY_FORM = {
  codeGroup: '',
  codeValue: '',
  codeLabel: '',
  koreanName: '',
  codeDescription: '',
  sortOrder: 0,
  isActive: true,
  extraData: '',
  parentCodeGroup: '',
  parentCodeValue: ''
};

const TenantCommonCodeManager = () => {
  const { t } = useTranslation(['admin']);
  const [confirm, ConfirmModal] = useConfirm();

  const [codeGroups, setCodeGroups] = useState([]);
  const [codes, setCodes] = useState([]);
  const [globalByGroup, setGlobalByGroup] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groupFilter, setGroupFilter] = useState(TENANT_COMMON_CODE_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(TENANT_COMMON_CODE_FILTER_ALL);
  const [searchTerm, setSearchTerm] = useState('');
  const [peekCode, setPeekCode] = useState(null);
  const [peekGlobalCode, setPeekGlobalCode] = useState(null);
  const [peekGlobalLoading, setPeekGlobalLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentCode, setCurrentCode] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [parentCategoryOptions, setParentCategoryOptions] = useState([]);
  const [parentOptionsLoading, setParentOptionsLoading] = useState(false);

  const convertGroupNameToKorean = useCallback((groupName) => {
    if (!groupName) return groupName;
    const fallback = TENANT_COMMON_CODE_GROUP_KO_FALLBACK[groupName] || groupName;
    return t(`admin:tenantCommonCode.groupKoFallback.${groupName}`, fallback);
  }, [t]);

  const groupLabelByName = useMemo(() => {
    const map = {};
    codeGroups.forEach((group) => {
      const groupName = group.groupName || group;
      const korean = group.koreanName
        || getCodeGroupKoreanNameSync(groupName)
        || convertGroupNameToKorean(groupName);
      map[groupName] = toDisplayString(korean, groupName);
    });
    return map;
  }, [codeGroups, convertGroupNameToKorean]);

  const loadGlobalCodesForGroup = useCallback(async(groupName) => {
    if (!groupName || globalByGroup[groupName]) {
      return globalByGroup[groupName] || [];
    }
    try {
      const globalRows = await getCommonCodes(groupName, false);
      const normalized = (globalRows || [])
        .map((row) => normalizeTenantCommonCodeRow(row))
        .filter(Boolean);
      setGlobalByGroup((prev) => ({ ...prev, [groupName]: normalized }));
      return normalized;
    } catch (err) {
      console.error('글로벌 코드 조회 오류:', err);
      return [];
    }
  }, [globalByGroup]);

  const enrichCodesWithOverride = useCallback((tenantRows, globalRows) =>
    tenantRows.map((code) => {
      const globalMatch = (globalRows || []).find(
        (g) => g.codeValue === code.codeValue
      );
      return {
        ...code,
        overrideStatus: resolveTenantCodeOverrideStatus(code, globalMatch)
      };
    }), []);

  const loadCodesForGroups = useCallback(async(groupNames) => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        groupNames.map(async(groupName) => {
          const [tenantRes, globalRows] = await Promise.all([
            getTenantCodesByGroup(groupName),
            loadGlobalCodesForGroup(groupName)
          ]);
          if (!tenantRes.success) {
            throw new Error(tenantRes.message || t('admin:tenantCommonCode.msg.errCodesFetchFallback'));
          }
          return enrichCodesWithOverride(tenantRes.data || [], globalRows);
        })
      );
      setCodes(results.flat());
    } catch (err) {
      console.error(t('admin:tenantCommonCode.msg.logCodesFetch'), err);
      setError(err.message || t('admin:tenantCommonCode.msg.errCodesLoad'));
      setCodes([]);
    } finally {
      setLoading(false);
    }
  }, [enrichCodesWithOverride, loadGlobalCodesForGroup, t]);

  const loadCodeGroups = useCallback(async() => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTenantCodeGroups();
      if (response.success) {
        const groups = response.data || [];
        setCodeGroups(groups);
        return groups;
      }
      setError(response.message || t('admin:tenantCommonCode.msg.errCodeGroupsFetchFallback'));
      return [];
    } catch (err) {
      console.error(t('admin:tenantCommonCode.msg.logCodeGroupsFetch'), err);
      setError(t('admin:tenantCommonCode.msg.errCodeGroupsLoad'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const init = async() => {
      await loadCodeGroupMetadata();
      await loadCodeGroups();
    };
    init();
  }, [loadCodeGroups]);

  useEffect(() => {
    if (codeGroups.length === 0) {
      return;
    }
    const groupNames = groupFilter === TENANT_COMMON_CODE_FILTER_ALL
      ? codeGroups.map((g) => g.groupName || g)
      : [groupFilter];
    loadCodesForGroups(groupNames);
  }, [codeGroups, groupFilter, loadCodesForGroups]);

  const loadParentCategoryOptions = useCallback(async(groupName) => {
    const parentGroup = getParentCodeGroupForSubcategory(groupName);
    if (!parentGroup) {
      setParentCategoryOptions([]);
      return;
    }
    setParentOptionsLoading(true);
    try {
      const res = await getTenantCodesByGroup(parentGroup);
      if (res.success) {
        const list = (res.data || []).filter((c) => c.isActive !== false);
        setParentCategoryOptions(
          list.map((c) => ({
            value: c.codeValue,
            label: toDisplayString(c.codeLabel || c.koreanName || c.codeValue, c.codeValue)
          }))
        );
      } else {
        setParentCategoryOptions([]);
      }
    } catch (err) {
      console.error(t('admin:tenantCommonCode.msg.logParentOptionsLoad'), err);
      setParentCategoryOptions([]);
    } finally {
      setParentOptionsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const gn = formData.codeGroup;
    if (!gn || !isSubcategoryCodeGroup(gn)) {
      setParentCategoryOptions([]);
      return;
    }
    loadParentCategoryOptions(gn);
  }, [formData.codeGroup, loadParentCategoryOptions]);

  const filteredCodes = useMemo(() => {
    let rows = codes;
    if (statusFilter === TENANT_COMMON_CODE_FILTER_ACTIVE) {
      rows = rows.filter((c) => c.isActive !== false);
    } else if (statusFilter === TENANT_COMMON_CODE_FILTER_INACTIVE) {
      rows = rows.filter((c) => c.isActive === false);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      rows = rows.filter((c) => {
        const label = toDisplayString(c.codeLabel || c.koreanName, '').toLowerCase();
        const value = toDisplayString(c.codeValue, '').toLowerCase();
        const group = toDisplayString(c.codeGroup, '').toLowerCase();
        return label.includes(q) || value.includes(q) || group.includes(q);
      });
    }
    return rows;
  }, [codes, statusFilter, searchTerm]);

  const reloadCurrentCodes = useCallback(() => {
    const groupNames = groupFilter === TENANT_COMMON_CODE_FILTER_ALL
      ? codeGroups.map((g) => g.groupName || g)
      : [groupFilter];
    if (groupNames.length > 0) {
      loadCodesForGroups(groupNames);
    }
  }, [codeGroups, groupFilter, loadCodesForGroups]);

  const openPeek = useCallback(async(code) => {
    setPeekCode(code);
    setPeekGlobalCode(null);
    setPeekGlobalLoading(true);
    try {
      const globalRows = await loadGlobalCodesForGroup(code.codeGroup);
      const match = (globalRows || []).find((g) => g.codeValue === code.codeValue) || null;
      setPeekGlobalCode(match);
    } finally {
      setPeekGlobalLoading(false);
    }
  }, [loadGlobalCodesForGroup]);

  const handleCreateCode = () => {
    const defaultGroup = groupFilter !== TENANT_COMMON_CODE_FILTER_ALL
      ? groupFilter
      : (codeGroups[0]?.groupName || codeGroups[0] || '');
    const pg = getParentCodeGroupForSubcategory(defaultGroup) || '';
    setModalMode('create');
    setCurrentCode(null);
    setFormData({
      ...EMPTY_FORM,
      codeGroup: defaultGroup,
      parentCodeGroup: pg,
      sortOrder: codes.filter((c) => c.codeGroup === defaultGroup).length
    });
    setShowModal(true);
  };

  const handleEditCode = (code) => {
    setModalMode('edit');
    setCurrentCode(code);
    const pg = code.parentCodeGroup || getParentCodeGroupForSubcategory(code.codeGroup) || '';
    setFormData({
      codeGroup: code.codeGroup,
      codeValue: code.codeValue,
      codeLabel: code.codeLabel,
      koreanName: code.koreanName || code.codeLabel,
      codeDescription: code.codeDescription || '',
      sortOrder: code.sortOrder || 0,
      isActive: code.isActive !== false,
      extraData: code.extraData || '',
      parentCodeGroup: pg,
      parentCodeValue: code.parentCodeValue || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    const gn = formData.codeGroup;
    if (isSubcategoryCodeGroup(gn)) {
      if (!formData.parentCodeValue || !String(formData.parentCodeValue).trim()) {
        notificationManager.error(t('admin:tenantCommonCode.msg.errSelectParentCategory'));
        return;
      }
    }
    const parentGroupResolved = getParentCodeGroupForSubcategory(gn);
    const payload = { ...formData };
    if (parentGroupResolved) {
      payload.parentCodeGroup = parentGroupResolved;
      payload.parentCodeValue = formData.parentCodeValue;
    } else {
      delete payload.parentCodeGroup;
      delete payload.parentCodeValue;
    }
    try {
      setLoading(true);
      setError(null);
      const response = modalMode === 'create'
        ? await createTenantCode(payload)
        : await updateTenantCode(currentCode.id, payload);
      if (response.success) {
        setShowModal(false);
        reloadCurrentCodes();
        notificationManager.success(modalMode === 'create'
          ? t('admin:tenantCommonCode.msg.successCodeCreated')
          : t('admin:tenantCommonCode.msg.successCodeUpdated'));
        if (peekCode?.id === currentCode?.id && response.data) {
          openPeek(response.data);
        }
      } else {
        setError(response.message || t('admin:tenantCommonCode.msg.errOperationFallback'));
      }
    } catch (err) {
      console.error(t('admin:tenantCommonCode.msg.logCodeSave'), err);
      setError(t('admin:tenantCommonCode.msg.errCodeSave'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCode = async(code) => {
    const confirmed = await confirm({
      message: t('admin:tenantCommonCode.msg.confirmDelete'),
      variant: 'danger'
    });
    if (!confirmed) return;
    try {
      setLoading(true);
      const response = await deleteTenantCode(code.id);
      if (response.success) {
        if (peekCode?.id === code.id) setPeekCode(null);
        reloadCurrentCodes();
        notificationManager.success(t('admin:tenantCommonCode.msg.successCodeDeleted'));
      } else {
        setError(response.message || t('admin:tenantCommonCode.msg.errDeleteFallback'));
      }
    } catch (err) {
      console.error(t('admin:tenantCommonCode.msg.logCodeDelete'), err);
      setError(t('admin:tenantCommonCode.msg.errCodeDelete'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async(code) => {
    try {
      setLoading(true);
      const response = await toggleTenantCodeActive(code.id, !(code.isActive !== false));
      if (response.success) {
        reloadCurrentCodes();
      } else {
        setError(response.message || t('admin:tenantCommonCode.msg.errToggleFallback'));
      }
    } catch (err) {
      console.error(t('admin:tenantCommonCode.msg.logToggle'), err);
      setError(t('admin:tenantCommonCode.msg.errToggle'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetGlobal = async(code) => {
    const confirmed = await confirm({
      message: '글로벌 코드 값으로 초기화하시겠습니까? 테넌트 오버라이드가 삭제됩니다.',
      variant: 'danger'
    });
    if (!confirmed) return;
    await handleDeleteCode(code);
  };

  const headerActions = (
    <MGButton
      type="button"
      variant="primary"
      className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      onClick={handleCreateCode}
      disabled={codeGroups.length === 0}
      preventDoubleClick
    >
      + {t('admin:tenantCommonCode.ui.btnAddCode')}
    </MGButton>
  );

  return (
    <AdminCommonLayout title={t('admin:tenantCommonCode.ui.layoutTitle')} loading={loading}>
      <div className="mg-v2-ad-b0kla">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={t('admin:tenantCommonCode.ui.contentAriaLabel')}>
            <ContentHeader
              title={t('admin:tenantCommonCode.ui.headerTitle')}
              subtitle={t('admin:tenantCommonCode.ui.headerSubtitle')}
              titleId={TENANT_COMMON_CODE_TITLE_ID}
              actions={headerActions}
            />
            <main aria-labelledby={TENANT_COMMON_CODE_TITLE_ID}>
              {error && (
                <div className="tenant-common-code__error" role="alert">
                  {toDisplayString(error, '—')}
                </div>
              )}

              <div className="tenant-common-code__filters">
                <div className="tenant-common-code__filter-field">
                  <label className="tenant-common-code__filter-label" htmlFor="tenant-code-group-filter">
                    {TENANT_COMMON_CODE_FILTER_LABELS.GROUP}
                  </label>
                  <select
                    id="tenant-code-group-filter"
                    className="tenant-common-code__filter-select"
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                  >
                    <option value={TENANT_COMMON_CODE_FILTER_ALL}>전체 그룹</option>
                    {codeGroups.map((group) => {
                      const groupName = group.groupName || group;
                      return (
                        <option key={groupName} value={groupName}>
                          {groupLabelByName[groupName] || groupName}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="tenant-common-code__filter-field">
                  <label className="tenant-common-code__filter-label" htmlFor="tenant-code-status-filter">
                    {TENANT_COMMON_CODE_FILTER_LABELS.STATUS}
                  </label>
                  <select
                    id="tenant-code-status-filter"
                    className="tenant-common-code__filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value={TENANT_COMMON_CODE_FILTER_ALL}>전체</option>
                    <option value={TENANT_COMMON_CODE_FILTER_ACTIVE}>사용</option>
                    <option value={TENANT_COMMON_CODE_FILTER_INACTIVE}>미사용</option>
                  </select>
                </div>
                <div className="tenant-common-code__filter-field">
                  <label className="tenant-common-code__filter-label" htmlFor="tenant-code-search">
                    {TENANT_COMMON_CODE_FILTER_LABELS.SEARCH}
                  </label>
                  <input
                    id="tenant-code-search"
                    type="search"
                    className="tenant-common-code__filter-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('admin:tenantCommonCode.ui.searchPlaceholder')}
                  />
                </div>
              </div>

              <div
                className={[
                  TENANT_COMMON_CODE_PEEK_LAYOUT_CLASS,
                  peekCode ? TENANT_COMMON_CODE_PEEK_LAYOUT_OPEN_MODIFIER : ''
                ].filter(Boolean).join(' ')}
              >
                <div className={TENANT_COMMON_CODE_MAIN_REGION_CLASS} data-region="R-MAIN">
                  <TenantCommonCodeTable
                    codes={filteredCodes}
                    loading={loading}
                    groupLabelByName={groupLabelByName}
                    onRowClick={openPeek}
                    onEdit={handleEditCode}
                    onDelete={handleDeleteCode}
                    onToggleActive={handleToggleActive}
                    onResetGlobal={handleResetGlobal}
                  />
                </div>
                <SidePeekShell
                  isOpen={Boolean(peekCode)}
                  onClose={() => setPeekCode(null)}
                  title={peekCode
                    ? toDisplayString(peekCode.codeLabel || peekCode.codeValue, '상세')
                    : '상세'}
                  ariaLabel="테넌트 공통코드 상세"
                >
                  <TenantCommonCodeSidePeekContent
                    code={peekCode}
                    globalCode={peekGlobalCode}
                    loading={peekGlobalLoading}
                  />
                </SidePeekShell>
              </div>
            </main>
          </ContentArea>
        </div>
      </div>

      <TenantCommonCodeFormModal
        showModal={showModal}
        modalMode={modalMode}
        formData={formData}
        loading={loading}
        parentCategoryOptions={parentCategoryOptions}
        parentOptionsLoading={parentOptionsLoading}
        onFormChange={setFormData}
        onFormSubmit={handleSubmit}
        onModalClose={() => setShowModal(false)}
      />
      <ConfirmModal />
    </AdminCommonLayout>
  );
};

export default TenantCommonCodeManager;
