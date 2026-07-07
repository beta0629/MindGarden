import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet } from '../../utils/ajax';
import {
    getCommonCodes,
    createCommonCode,
    updateCommonCode,
    deleteCommonCode,
    toggleCommonCodeStatus,
    getCodeGroups
} from '../../utils/commonCodeApi';
import CustomSelect from '../common/CustomSelect';
import {
    getParentCodeGroupForSubcategory,
    isSubcategoryCodeGroup
} from '../../utils/commonCodeParentGroups';
import { toDisplayString } from '../../utils/safeDisplay';
import notificationManager from '../../utils/notification';
import { useConfirm } from '../../hooks/useConfirm';
import { 
    loadCodeGroupMetadata, 
    getCodeGroupKoreanNameSync,
    getCodeGroupIconSync,
    clearCodeGroupCache
} from '../../utils/codeHelper';
import { useSession } from '../../contexts/SessionContext';
import { RoleUtils, USER_ROLES } from '../../constants/roles';
import {
    COMMON_CODE_MANAGEMENT_GROUP_KO_FALLBACK
} from '../../constants/commonCodeManagementStrings';
import {
    COMMON_CODE_MANAGEMENT_DEFAULT_CATEGORY_FILTER,
    COMMON_CODE_MANAGEMENT_DEFAULT_SEARCH_TERM,
    COMMON_CODE_MANAGEMENT_SAVED_VIEW_PAGE_ID,
    COMMON_CODE_MANAGEMENT_SAVED_VIEW_PERSIST_DEBOUNCE_MS,
    COMMON_CODE_MANAGEMENT_SAVED_VIEW_ROW_ARIA_LABEL,
    buildCommonCodeManagementDefaultSavedView
} from '../../constants/commonCodeSavedViewConstants';
import SavedViewControls from './ClientComprehensiveManagement/molecules/SavedViewControls';
import { useSavedViewPreference } from '../../hooks/useSavedViewPreference';
import { useTranslation } from 'react-i18next';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import './CommonCodeManagementB0KlA.css';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_COMMON_CODES_GROUPS_LIST = '/api/v1/common-codes/groups/list';

const COMMON_CODE_DEFAULT_SAVED_VIEW = buildCommonCodeManagementDefaultSavedView();

/**
 * - 2단 분할 구조 (마스터-디테일): 코드그룹 목록(좌) / 코드 관리(우)
 * - 아토믹 디자인 및 B0KlA 어드민 디자인 토큰 적용
 * 
 * @author Core Solution
 * @version 2.1.0
 * @since 2025-09-13
 */
const CommonCodeManagement = () => {
    const { t } = useTranslation(['admin']);
    const [confirm, ConfirmModal] = useConfirm();
    const { user } = useSession();
    
    const hasErpCodePermission = () => {
        return RoleUtils.isAdmin(user);
    };
    
    const hasFinancialCodePermission = () => {
        return RoleUtils.isAdmin(user);
    };
    
    const hasBranchCodePermission = () => {
        return RoleUtils.isAdmin(user);
    };
    
    const hasGeneralCodePermission = () => {
        return RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, USER_ROLES.STAFF);
    };
    
    const isErpCodeGroup = (codeGroup) => {
        return ['ITEM_CATEGORY', 'ITEM_STATUS', 'PURCHASE_STATUS', 'BUDGET_CATEGORY', 
                'APPROVAL_TYPE', 'APPROVAL_STATUS', 'APPROVAL_PRIORITY'].includes(codeGroup);
    };
    
    const isFinancialCodeGroup = (codeGroup) => {
        return ['FINANCIAL_CATEGORY', 'FINANCIAL_SUBCATEGORY', 'TRANSACTION_TYPE', 
                'PAYMENT_METHOD', 'PAYMENT_STATUS', 'SALARY_TYPE', 'SALARY_GRADE', 'TAX_TYPE'].includes(codeGroup);
    };
    
    const isBranchCodeGroup = (codeGroup) => {
        return ['BRANCH_STATUS', 'BRANCH_TYPE', 'BRANCH_PERMISSION', 'BRANCH_STATISTICS',
                'BRANCH_SETTING', 'BRANCH_CODE', 'BRANCH_MANAGEMENT',
                'HQ_SETTING', 'HQ_MANAGEMENT', 'HQ_PERMISSION', 'HQ_STATISTICS', 'HQ_CONFIG'].includes(codeGroup);
    };
    
    const hasCodeGroupPermission = (codeGroup) => {
        if (isBranchCodeGroup(codeGroup)) {
            return hasBranchCodePermission();
        }
        if (isErpCodeGroup(codeGroup)) {
            return hasErpCodePermission();
        }
        if (isFinancialCodeGroup(codeGroup)) {
            return hasFinancialCodePermission();
        }
        return hasGeneralCodePermission();
    };
    
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [codeGroups, setCodeGroups] = useState([]);
    const [groupCodes, setGroupCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCode, setEditingCode] = useState(null);

    const [groupMetadata, setGroupMetadata] = useState([]);
    
    const [searchTerm, setSearchTerm] = useState(COMMON_CODE_MANAGEMENT_DEFAULT_SEARCH_TERM);
    const [categoryFilter, setCategoryFilter] = useState(COMMON_CODE_MANAGEMENT_DEFAULT_CATEGORY_FILTER);
    const [parentCategoryCodes, setParentCategoryCodes] = useState([]);

    const {
        savedView,
        setSavedView,
        views,
        activeViewId,
        saveNamedView,
        loadNamedView,
        resetToDefaultView,
        deleteNamedView
    } = useSavedViewPreference({
        pageId: COMMON_CODE_MANAGEMENT_SAVED_VIEW_PAGE_ID,
        defaultView: COMMON_CODE_DEFAULT_SAVED_VIEW,
        namedViews: true
    });
    const savedViewFiltersRestoredRef = useRef(false);
    const savedViewPersistReadyRef = useRef(false);
    const savedViewPersistTimerRef = useRef(null);
    const savedViewMetaRef = useRef({
        sort: COMMON_CODE_DEFAULT_SAVED_VIEW.sort,
        density: COMMON_CODE_DEFAULT_SAVED_VIEW.density
    });

    const loadMetadata = useCallback(async() => {
        try {
            clearCodeGroupCache();
            const metadata = await loadCodeGroupMetadata();
            setGroupMetadata(metadata);
            console.log('코드그룹 메타데이터 로드 완료:', metadata.length, '개');
        } catch (error) {
            console.error('코드그룹 메타데이터 로드 실패:', error);
        }
    }, []);

    const getGroupKoreanName = useCallback((groupName) => {
        return getCodeGroupKoreanNameSync(groupName);
    }, []);

    const getGroupIcon = useCallback((groupName) => {
        return getCodeGroupIconSync(groupName);
    }, []);

    const [newCodeData, setNewCodeData] = useState({
        codeGroup: '',
        codeValue: '',
        codeLabel: '',
        codeDescription: '',
        sortOrder: 0,
        isActive: true,
        parentCodeGroup: '',
        parentCodeValue: '',
        extraData: '',
        icon: '',
        colorCode: '',
        koreanName: ''
    });

    const loadCodeGroups = useCallback(async() => {
        try {
            setLoading(true);
            const groups = await getCodeGroups();
            if (groups && groups.length > 0) {
                setCodeGroups(groups);
            } else {
                const response = await apiGet(API_COMMON_CODES_GROUPS_LIST);
                if (response && response.length > 0) {
                    const filteredGroups = response.filter(groupCode => {
                        return hasCodeGroupPermission(groupCode);
                    });
                    setCodeGroups(filteredGroups);
                } else {
                    notificationManager.error(t('admin:commonCode.msg.errLoadCodeGroups'));
                }
            }
        } catch (error) {
            console.error('코드그룹 로드 오류:', error);
            notificationManager.error(t('admin:commonCode.msg.errLoadCodeGroups'));
        } finally {
            setLoading(false);
        }
    }, [user?.role]);

    const loadParentCategoryCodes = useCallback(async(groupName) => {
        if (!groupName || !isSubcategoryCodeGroup(groupName)) {
            setParentCategoryCodes([]);
            return;
        }
        const parentGroup = getParentCodeGroupForSubcategory(groupName);
        if (!parentGroup) {
            setParentCategoryCodes([]);
            return;
        }
        try {
            const codes = await getCommonCodes(parentGroup);
            const list = Array.isArray(codes) ? codes : [];
            setParentCategoryCodes(list.filter((c) => c.isActive !== false));
        } catch (error) {
            console.error('상위 카테고리 코드 로드 오류:', error);
            setParentCategoryCodes([]);
        }
    }, []);

    const loadGroupCodes = useCallback(async(groupName) => {
        try {
            setLoading(true);
            const codes = await getCommonCodes(groupName);
            if (Array.isArray(codes)) {
                setGroupCodes(codes);
            } else {
                setGroupCodes([]);
                notificationManager.error(t('admin:commonCode.msg.groupCodesLoadError', { groupName: groupName }));
            }
        } catch (error) {
            console.error('그룹 코드 로드 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error(t('admin:commonCode.msg.errNoAccessCodeGroup'));
            } else {
                notificationManager.error(t('admin:commonCode.msg.groupCodesLoadError', { groupName: groupName }));
            }
        } finally {
            setLoading(false);
        }
    }, [user?.role]);

    const handleGroupSelect = (group) => {
        if (!hasCodeGroupPermission(group)) {
            if (isBranchCodeGroup(group)) {
                notificationManager.error(t('admin:commonCode.msg.errBranchCodeGroupAdminOnly'));
            } else if (isErpCodeGroup(group)) {
                notificationManager.error(t('admin:commonCode.msg.errErpCodeGroupAdminOnly'));
            } else if (isFinancialCodeGroup(group)) {
                notificationManager.error(t('admin:commonCode.msg.errFinancialCodeGroupAdminOnly'));
            } else {
                notificationManager.error(t('admin:commonCode.msg.errNoAccessCodeGroup'));
            }
            return;
        }
        
        setSelectedGroup(group);
        setShowAddForm(false);
        setEditingCode(null);
        loadParentCategoryCodes(group);
        loadGroupCodes(group);
    };

    const getFilteredCodeGroups = () => {
        let filtered = codeGroups;

        if (searchTerm) {
            filtered = filtered.filter(group => {
                const rawKoreanName = getCodeGroupKoreanNameSync(group);
                const finalKoreanName = rawKoreanName !== group ? rawKoreanName : convertGroupNameToKorean(group);
                const searchLower = searchTerm.toLowerCase();
                
                const groupMatch = group.toLowerCase().includes(searchLower);
                
                const koreanMatch = finalKoreanName.toLowerCase().includes(searchLower);
                
                return groupMatch || koreanMatch;
            });
        }

        if (categoryFilter !== 'all' && groupMetadata.length > 0) {
            filtered = filtered.filter(group => {
                const metadata = groupMetadata.find(m => m.groupName === group);
                if (!metadata) return false;
                
                switch (categoryFilter) {
                    case 'user':
                        return group.includes('USER') || 
                               group.includes(USER_ROLES.CLIENT) || 
                               group.includes(USER_ROLES.CONSULTANT);
                    case 'system':
                        return group.includes('STATUS') || group.includes('PRIORITY') || group.includes('MAPPING');
                    case 'payment':
                        return group.includes('PAYMENT') || group.includes('SALARY') || group.includes('BUDGET');
                    case 'consultation':
                        return group.includes('CONSULTATION') || group.includes('SCHEDULE') || group.includes('SESSION');
                    case 'erp':
                        return group.includes('ERP') || group.includes('PURCHASE') || group.includes('FINANCIAL');
                    default:
                        return true;
                }
            });
        }

        return filtered;
    };

    const convertGroupNameToKorean = (groupName) => {
        if (!groupName) return groupName;
        const fallback = COMMON_CODE_MANAGEMENT_GROUP_KO_FALLBACK[groupName] || groupName;
        return t(`admin:commonCode.groupKoFallback.${groupName}`, fallback);
    };

    const handleAddCode = async(e) => {
        e.preventDefault();
        
        if (!newCodeData.codeValue.trim() || !newCodeData.codeLabel.trim()) {
            notificationManager.error(t('admin:commonCode.msg.errCodeValueLabelRequired'));
            return;
        }

        if (isSubcategoryCodeGroup(selectedGroup)) {
            if (!newCodeData.parentCodeValue || !String(newCodeData.parentCodeValue).trim()) {
                notificationManager.error(t('admin:commonCode.msg.errSelectParentCategory'));
                return;
            }
        }

        try {
            setLoading(true);
            const parentGroupForSub = getParentCodeGroupForSubcategory(selectedGroup);
            const codeData = {
                codeGroup: selectedGroup,
                codeValue: newCodeData.codeValue,
                codeLabel: newCodeData.codeLabel,
                koreanName: newCodeData.koreanName || newCodeData.codeLabel, // 한글명 필수
                codeDescription: newCodeData.codeDescription,
                sortOrder: newCodeData.sortOrder,
                isActive: newCodeData.isActive,
                extraData: newCodeData.extraData,
                icon: newCodeData.icon,
                colorCode: newCodeData.colorCode
            };
            if (parentGroupForSub) {
                codeData.parentCodeGroup = parentGroupForSub;
                codeData.parentCodeValue = newCodeData.parentCodeValue;
            } else {
                codeData.parentCodeGroup = newCodeData.parentCodeGroup || undefined;
                codeData.parentCodeValue = newCodeData.parentCodeValue || undefined;
            }
            
            const createdCode = await createCommonCode(codeData);
            
            if (createdCode) {
                notificationManager.success(t('admin:commonCode.msg.successCodeAdded'));
                setShowAddForm(false);
                setNewCodeData({
                    codeGroup: '',
                    codeValue: '',
                    codeLabel: '',
                    codeDescription: '',
                    sortOrder: 0,
                    isActive: true,
                    parentCodeGroup: '',
                    parentCodeValue: '',
                    extraData: '',
                    icon: '',
                    colorCode: '',
                    koreanName: ''
                });
                loadGroupCodes(selectedGroup);
            } else {
                notificationManager.error(t('admin:commonCode.msg.errCodeAddFailed'));
            }
        } catch (error) {
            console.error('코드 추가 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error(t('admin:commonCode.msg.errNoCreatePermission'));
            } else {
                notificationManager.error(error.message || t('admin:commonCode.msg.errCodeAddFailed'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCode = async(codeId) => {
        const confirmed = await confirm({
            message: t('admin:commonCode.msg.confirmDeleteCode'),
            variant: 'danger'
        });
        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);
            await deleteCommonCode(codeId, { codeGroup: selectedGroup });
            notificationManager.success(t('admin:commonCode.msg.successCodeDeleted'));
            loadGroupCodes(selectedGroup);
        } catch (error) {
            console.error('코드 삭제 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error(t('admin:commonCode.msg.errNoDeletePermission'));
            } else {
                notificationManager.error(error.message || t('admin:commonCode.msg.errCodeDeleteFailed'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async(codeId, currentStatus) => {
        try {
            setLoading(true);
            await toggleCommonCodeStatus(codeId, {
                codeGroup: selectedGroup,
                currentIsActive: currentStatus
            });
            notificationManager.success(t('admin:commonCode.msg.successCodeStatusChanged'));
            loadGroupCodes(selectedGroup);
        } catch (error) {
            console.error('코드 상태 토글 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error(t('admin:commonCode.msg.errNoTogglePermission'));
            } else {
                notificationManager.error(error.message || t('admin:commonCode.msg.errCodeToggleFailed'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditCode = (code) => {
        setEditingCode(code);
        const pg = code.parentCodeGroup || getParentCodeGroupForSubcategory(code.codeGroup) || '';
        setNewCodeData({
            codeGroup: code.codeGroup,
            codeValue: code.codeValue,
            codeLabel: code.codeLabel,
            codeDescription: code.codeDescription || '',
            sortOrder: code.sortOrder || 0,
            isActive: code.isActive,
            parentCodeGroup: pg,
            parentCodeValue: code.parentCodeValue || '',
            extraData: code.extraData,
            icon: code.icon,
            colorCode: code.colorCode,
            koreanName: code.koreanName
        });
        setShowAddForm(true);
    };

    const handleUpdateCode = async(e) => {
        e.preventDefault();
        
        if (!newCodeData.codeValue.trim() || !newCodeData.codeLabel.trim()) {
            notificationManager.error(t('admin:commonCode.msg.errCodeValueLabelRequired'));
            return;
        }

        const editGroup = editingCode?.codeGroup || selectedGroup;
        if (isSubcategoryCodeGroup(editGroup)) {
            if (!newCodeData.parentCodeValue || !String(newCodeData.parentCodeValue).trim()) {
                notificationManager.error(t('admin:commonCode.msg.errSelectParentCategory'));
                return;
            }
        }

        try {
            setLoading(true);
            const updateData = {
                codeLabel: newCodeData.codeLabel,
                koreanName: newCodeData.koreanName || newCodeData.codeLabel, // 한글명 필수
                codeDescription: newCodeData.codeDescription,
                sortOrder: newCodeData.sortOrder,
                isActive: newCodeData.isActive,
                extraData: newCodeData.extraData,
                icon: newCodeData.icon,
                colorCode: newCodeData.colorCode
            };
            const parentGroupForSub = getParentCodeGroupForSubcategory(editGroup);
            if (parentGroupForSub) {
                updateData.parentCodeGroup = parentGroupForSub;
                updateData.parentCodeValue = newCodeData.parentCodeValue;
            }

            await updateCommonCode(editingCode.id, updateData, {
                codeGroup: editingCode?.codeGroup || selectedGroup
            });
            notificationManager.success(t('admin:commonCode.msg.successCodeUpdated'));
            setShowAddForm(false);
            setEditingCode(null);
            setNewCodeData({
                codeGroup: '',
                codeValue: '',
                codeLabel: '',
                codeDescription: '',
                sortOrder: 0,
                isActive: true,
                parentCodeGroup: '',
                parentCodeValue: '',
                extraData: '',
                icon: '',
                colorCode: '',
                koreanName: ''
            });
            loadGroupCodes(selectedGroup);
        } catch (error) {
            console.error('코드 수정 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error(t('admin:commonCode.msg.errNoUpdatePermission'));
            } else {
                notificationManager.error(t('admin:commonCode.msg.errCodeUpdateFailed'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancelForm = () => {
        setShowAddForm(false);
        setEditingCode(null);
        setNewCodeData({
            codeGroup: '',
            codeValue: '',
            codeLabel: '',
            codeDescription: '',
            sortOrder: 0,
            isActive: true,
            parentCodeGroup: '',
            parentCodeValue: '',
            extraData: '',
            icon: '',
            colorCode: '',
            koreanName: ''
        });
    };

    const parentCategorySelectOptions = parentCategoryCodes.map((c) => ({
        value: c.codeValue,
        label: toDisplayString(c.codeLabel || c.koreanName || c.codeValue, c.codeValue)
    }));

    const resolveParentCategoryLabel = (code) => {
        if (!code?.parentCodeValue) {
            return t('admin:commonCode.ui.displayEmpty', '—');
        }
        const found = parentCategoryCodes.find((c) => c.codeValue === code.parentCodeValue);
        if (found) {
            return toDisplayString(found.codeLabel || found.koreanName || found.codeValue, t('admin:commonCode.ui.displayEmpty', '—'));
        }
        return toDisplayString(code.parentCodeValue, t('admin:commonCode.ui.displayEmpty', '—'));
    };

    const showParentColumn = isSubcategoryCodeGroup(selectedGroup);
    const tableColSpan = showParentColumn ? 7 : 6;

    const applySavedViewPayload = useCallback((payload) => {
        const storedFilters = payload?.filters ?? {};
        if (storedFilters.searchTerm != null) {
            setSearchTerm(storedFilters.searchTerm);
        }
        if (storedFilters.categoryFilter != null) {
            setCategoryFilter(storedFilters.categoryFilter);
        }
        if (storedFilters.selectedGroup !== undefined) {
            const group = storedFilters.selectedGroup;
            setShowAddForm(false);
            setEditingCode(null);
            if (group == null) {
                setSelectedGroup(null);
                setGroupCodes([]);
            } else if (hasCodeGroupPermission(group)) {
                setSelectedGroup(group);
                loadParentCategoryCodes(group);
                loadGroupCodes(group);
            } else {
                setSelectedGroup(null);
                setGroupCodes([]);
            }
        }
        savedViewMetaRef.current = {
            sort: payload?.sort ?? COMMON_CODE_DEFAULT_SAVED_VIEW.sort,
            density: payload?.density ?? COMMON_CODE_DEFAULT_SAVED_VIEW.density
        };
    }, [loadGroupCodes, loadParentCategoryCodes]);

    const handleSelectSavedView = useCallback((viewId) => {
        const payload = loadNamedView(viewId);
        applySavedViewPayload(payload);
    }, [loadNamedView, applySavedViewPayload]);

    const handleResetSavedView = useCallback(() => {
        const payload = resetToDefaultView();
        applySavedViewPayload(payload);
    }, [resetToDefaultView, applySavedViewPayload]);

    const handleSaveNamedView = useCallback((label) => {
        saveNamedView(label, {
            viewMode: COMMON_CODE_DEFAULT_SAVED_VIEW.viewMode,
            filters: { searchTerm, categoryFilter, selectedGroup },
            sort: savedViewMetaRef.current.sort,
            density: savedViewMetaRef.current.density
        });
    }, [saveNamedView, searchTerm, categoryFilter, selectedGroup]);

    const handleDeleteSavedView = useCallback((viewId) => {
        const fallbackPayload = deleteNamedView(viewId);
        if (fallbackPayload) {
            applySavedViewPayload(fallbackPayload);
        }
    }, [deleteNamedView, applySavedViewPayload]);

    useEffect(() => {
        if (savedViewFiltersRestoredRef.current) {
            return;
        }
        savedViewFiltersRestoredRef.current = true;
        savedViewMetaRef.current = {
            sort: savedView.sort ?? COMMON_CODE_DEFAULT_SAVED_VIEW.sort,
            density: savedView.density ?? COMMON_CODE_DEFAULT_SAVED_VIEW.density
        };
        applySavedViewPayload(savedView);
        savedViewPersistReadyRef.current = true;
    }, [savedView, applySavedViewPayload]);

    useEffect(() => {
        if (!savedViewPersistReadyRef.current) {
            return undefined;
        }

        if (savedViewPersistTimerRef.current) {
            clearTimeout(savedViewPersistTimerRef.current);
        }

        savedViewPersistTimerRef.current = setTimeout(() => {
            savedViewPersistTimerRef.current = null;
            setSavedView({
                viewMode: COMMON_CODE_DEFAULT_SAVED_VIEW.viewMode,
                filters: { searchTerm, categoryFilter, selectedGroup },
                sort: savedViewMetaRef.current.sort,
                density: savedViewMetaRef.current.density
            });
        }, COMMON_CODE_MANAGEMENT_SAVED_VIEW_PERSIST_DEBOUNCE_MS);

        return () => {
            if (savedViewPersistTimerRef.current) {
                clearTimeout(savedViewPersistTimerRef.current);
                savedViewPersistTimerRef.current = null;
            }
        };
    }, [searchTerm, categoryFilter, selectedGroup, setSavedView]);

    useEffect(() => {
        loadMetadata();
        loadCodeGroups();
    }, [loadMetadata, loadCodeGroups]);

    return (
        <AdminCommonLayout title={t('admin:commonCode.ui.pageTitle')}>
            <ContentArea>
                <ContentHeader title={t('admin:commonCode.ui.pageTitle')} subtitle={t('admin:commonCode.ui.headerSubtitle')} />

                <section
                    className="mg-v2-session-saved-view-row"
                    aria-label={COMMON_CODE_MANAGEMENT_SAVED_VIEW_ROW_ARIA_LABEL}
                >
                    <SavedViewControls
                        views={views}
                        activeViewId={activeViewId}
                        onSelectView={handleSelectSavedView}
                        onSaveView={handleSaveNamedView}
                        onResetToDefault={handleResetSavedView}
                        onDeleteView={handleDeleteSavedView}
                    />
                </section>

                <div className="mg-v2-ad-b0kla__common-code-container">
                    {/* 좌측: GroupListSection */}
                    <div className="mg-v2-ad-b0kla__group-list-section">
                        <div className="mg-v2-ad-b0kla__section-header">
                            {t('admin:commonCode.ui.groupListTitle')}
                        </div>

                        <div className="mg-v2-ad-b0kla__search-bar">
                            <div className="mg-v2-ad-b0kla__search-input-wrapper">
                                <input
                                    type="text"
                                    placeholder={t('admin:commonCode.ui.searchPlaceholder')}
                                    value={ searchTerm }
                                    onChange={ (e) => setSearchTerm(e.target.value) }
                                    className="mg-v2-ad-b0kla__search-input"
                                />
                                <i className="bi bi-search mg-v2-ad-b0kla__search-icon" />
                            </div>
                            <select
                                value={ categoryFilter }
                                onChange={ (e) => setCategoryFilter(e.target.value) }
                                className="mg-v2-ad-b0kla__filter-select"
                            >
                                <option value="all">{t('admin:commonCode.ui.categoryAll')}</option>
                                <option value="user">{t('admin:commonCode.ui.categoryUser')}</option>
                                <option value="system">{t('admin:commonCode.ui.categorySystem')}</option>
                                <option value="payment">{t('admin:commonCode.ui.categoryPayment')}</option>
                                <option value="consultation">{t('admin:commonCode.ui.categoryConsultation')}</option>
                                <option value="erp">{t('admin:commonCode.ui.categoryErp')}</option>
                            </select>
                        </div>

                        <div className="mg-v2-ad-b0kla__group-list">
                            {getFilteredCodeGroups().map((group) => (
                                <MGButton
                                    key={group}
                                    type="button"
                                    variant="outline"
                                    fullWidth
                                    className={buildErpMgButtonClassName({
                                        variant: 'outline',
                                        size: 'md',
                                        loading: false,
                                        className: `mg-v2-ad-b0kla__group-card ${selectedGroup === group ? 'mg-v2-ad-b0kla__group-card--selected' : ''}`
                                    })}
                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                    onClick={() => handleGroupSelect(group)}
                                    preventDoubleClick={false}
                                >
                                    <div className="mg-v2-ad-b0kla__group-card-header">
                                        <h3 className="mg-v2-ad-b0kla__group-title">
                                            { getGroupKoreanName(group) !== group ? getGroupKoreanName(group) : convertGroupNameToKorean(group) }
                                        </h3>
                                    </div>
                                    <span className="mg-v2-ad-b0kla__group-code">{ group }</span>
                                </MGButton>
                            ))}
                        </div>
                    </div>

                    {/* 우측: CodeDetailSection */}
                    <div className="mg-v2-ad-b0kla__detail-section">
                        {!selectedGroup ? (
                            <div className="mg-v2-ad-b0kla__detail-empty">
                                <i className="bi bi-folder-symlink" />
                                <h3>{t('admin:commonCode.ui.emptySelectTitle')}</h3>
                                <p>{t('admin:commonCode.ui.emptySelectDesc')}</p>
                            </div>
                        ) : (
                            <>
                                <div className="mg-v2-ad-b0kla__section-header">
                                    <span>
                                        {t('admin:commonCode.msg.detailTitle', { displayName: getGroupKoreanName(selectedGroup) !== selectedGroup
                                                ? getGroupKoreanName(selectedGroup)
                                                : convertGroupNameToKorean(selectedGroup), groupCode: selectedGroup
                                         })}
                                    </span>
                                    <div className="mg-v2-ad-b0kla__action-buttons">
                                        {!showAddForm && (
                                            <MGButton
                                                type="button"
                                                variant="primary"
                                                className={buildErpMgButtonClassName({
                                                    variant: 'primary',
                                                    size: 'md',
                                                    loading: loading
                                                })}
                                                loading={loading}
                                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                onClick={() => {
                                                    setEditingCode(null);
                                                    const pg = getParentCodeGroupForSubcategory(selectedGroup) || '';
                                                    setNewCodeData({
                                                        codeGroup: selectedGroup,
                                                        codeValue: '',
                                                        codeLabel: '',
                                                        codeDescription: '',
                                                        sortOrder: 0,
                                                        isActive: true,
                                                        parentCodeGroup: pg,
                                                        parentCodeValue: '',
                                                        extraData: '',
                                                        icon: '',
                                                        colorCode: '',
                                                        koreanName: ''
                                                    });
                                                    setShowAddForm(true);
                                                }}
                                                disabled={loading}
                                                preventDoubleClick={false}
                                            >
                                                {t('admin:commonCode.ui.btnNew')}
                                            </MGButton>
                                        )}
                                    </div>
                                </div>

                                {showAddForm && (
                                    <div className="mg-v2-ad-b0kla__form-container">
                                        <div className="mg-v2-ad-b0kla__form-header">
                                            <h3 className="mg-v2-ad-b0kla__form-title">{editingCode ? t('admin:commonCode.ui.formTitleEdit') : t('admin:commonCode.ui.formTitleNew')}</h3>
                                            <MGButton
                                                type="button"
                                                variant="secondary"
                                                className={buildErpMgButtonClassName({
                                                    variant: 'secondary',
                                                    size: 'md',
                                                    loading: false,
                                                    className: 'mg-v2-ad-b0kla__form-header-close'
                                                })}
                                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                onClick={handleCancelForm}
                                                preventDoubleClick={false}
                                            >
                                                {t('admin:commonCode.ui.btnClose')}
                                            </MGButton>
                                        </div>
                                        <form onSubmit={ editingCode ? handleUpdateCode : handleAddCode }>
                                            <div className="mg-v2-ad-b0kla__form-row">
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="codeValue" className="mg-v2-ad-b0kla__form-label">{t('admin:commonCode.ui.labelCodeValue')}</label>
                                                    <input
                                                        id="codeValue"
                                                        type="text"
                                                        value={ newCodeData.codeValue }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, codeValue: e.target.value })}
                                                        placeholder={t('admin:commonCode.ui.placeholderCodeValue')}
                                                        required
                                                        disabled={!!editingCode}
                                                        className="mg-v2-ad-b0kla__form-input"
                                                    />
                                                </div>
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="codeLabel" className="mg-v2-ad-b0kla__form-label">{t('admin:commonCode.ui.labelCodeLabel')}</label>
                                                    <input
                                                        id="codeLabel"
                                                        type="text"
                                                        value={ newCodeData.codeLabel }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, codeLabel: e.target.value })}
                                                        placeholder={t('admin:commonCode.ui.placeholderCodeLabel')}
                                                        required
                                                        className="mg-v2-ad-b0kla__form-input"
                                                    />
                                                </div>
                                            </div>
                                            {isSubcategoryCodeGroup(selectedGroup) && (
                                                <div className="mg-v2-ad-b0kla__form-row">
                                                    <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
                                                        <label htmlFor="parentCategorySelect" className="mg-v2-ad-b0kla__form-label">
                                                            {t('admin:commonCode.ui.labelParentCategory')}
                                                        </label>
                                                        <CustomSelect
                                                            className="mg-v2-ad-b0kla__custom-select"
                                                            options={parentCategorySelectOptions}
                                                            value={newCodeData.parentCodeValue || ''}
                                                            onChange={(v) => setNewCodeData({
                                                                ...newCodeData,
                                                                parentCodeGroup: getParentCodeGroupForSubcategory(selectedGroup) || '',
                                                                parentCodeValue: v
                                                            })}
                                                            placeholder={t('admin:commonCode.ui.placeholderParentCategory')}
                                                            disabled={loading || parentCategorySelectOptions.length === 0}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="mg-v2-ad-b0kla__form-row">
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="codeDescription" className="mg-v2-ad-b0kla__form-label">{t('admin:commonCode.ui.labelDescription')}</label>
                                                    <textarea
                                                        id="codeDescription"
                                                        value={ newCodeData.codeDescription }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, codeDescription: e.target.value })}
                                                        placeholder={t('admin:commonCode.ui.placeholderDescription')}
                                                        className="mg-v2-ad-b0kla__form-textarea"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mg-v2-ad-b0kla__form-row">
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="sortOrder" className="mg-v2-ad-b0kla__form-label">{t('admin:commonCode.ui.labelSortOrder')}</label>
                                                    <input
                                                        id="sortOrder"
                                                        type="number"
                                                        value={ newCodeData.sortOrder }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, sortOrder: Number.parseInt(e.target.value) || 0 })}
                                                        min="0"
                                                        className="mg-v2-ad-b0kla__form-input"
                                                    />
                                                </div>
                                                <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--inline-check">
                                                    <input
                                                        type="checkbox"
                                                        id="isActiveCheckbox"
                                                        checked={ newCodeData.isActive }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, isActive: e.target.checked })}
                                                    />
                                                    <label htmlFor="isActiveCheckbox" className="mg-v2-ad-b0kla__form-label mg-v2-ad-b0kla__form-label--clickable">{t('admin:commonCode.ui.labelActiveState')}</label>
                                                </div>
                                            </div>
                                            <div className="mg-v2-ad-b0kla__form-actions">
                                                <MGButton
                                                    type="button"
                                                    variant="secondary"
                                                    className={buildErpMgButtonClassName({
                                                        variant: 'secondary',
                                                        size: 'md',
                                                        loading: false
                                                    })}
                                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                    onClick={handleCancelForm}
                                                    preventDoubleClick={false}
                                                >
                                                    {t('admin:commonCode.ui.btnCancel')}
                                                </MGButton>
                                                <MGButton
                                                    type="submit"
                                                    variant="primary"
                                                    className={buildErpMgButtonClassName({
                                                        variant: 'primary',
                                                        size: 'md',
                                                        loading: loading
                                                    })}
                                                    disabled={loading}
                                                    loading={loading}
                                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                    preventDoubleClick={false}
                                                >
                                                    {editingCode ? t('admin:commonCode.ui.btnSubmitEdit') : t('admin:commonCode.ui.btnSubmitAdd')}
                                                </MGButton>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {loading && groupCodes.length === 0 ? (
                                    <div className="mg-v2-ad-b0kla__loading-message">{t('admin:commonCode.ui.loading')}</div>
                                ) : (
                                    <table className="mg-v2-ad-b0kla__data-table">
                                        <thead>
                                            <tr>
                                                <th>{t('admin:commonCode.ui.colCodeLabel')}</th>
                                                <th>{t('admin:commonCode.ui.colCodeValue')}</th>
                                                {showParentColumn && <th>{t('admin:commonCode.ui.colParentCategory')}</th>}
                                                <th>{t('admin:commonCode.ui.colStatus')}</th>
                                                <th>{t('admin:commonCode.ui.colSort')}</th>
                                                <th>{t('admin:commonCode.ui.colDescription')}</th>
                                                <th className="mg-v2-ad-b0kla__data-table-actions-col">{t('admin:commonCode.ui.colManage')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupCodes.length === 0 ? (
                                                <tr>
                                                    <td colSpan={tableColSpan} className="mg-v2-ad-b0kla__data-table-empty-cell">
                                                        {t('admin:commonCode.ui.emptyNoCodes')}
                                                    </td>
                                                </tr>
                                            ) : (
                                                groupCodes.map(code => (
                                                    <tr key={code.id} className={code.isActive ? '' : 'mg-v2-ad-b0kla__data-row--inactive'}>
                                                        <td className="mg-v2-ad-b0kla__data-cell--label">{toDisplayString(code.codeLabel, t('admin:commonCode.ui.displayEmpty', '—'))}</td>
                                                        <td><code className="mg-v2-ad-b0kla__code-inline">{toDisplayString(code.codeValue, t('admin:commonCode.ui.displayEmpty', '—'))}</code></td>
                                                        {showParentColumn && (
                                                            <td className="mg-v2-ad-b0kla__data-cell--secondary">
                                                                {resolveParentCategoryLabel(code)}
                                                            </td>
                                                        )}
                                                        <td>
                                                            <span className={`mg-v2-badge ${code.isActive ? 'mg-v2-badge--active' : 'mg-v2-badge--inactive'}`}>
                                                                {code.isActive ? t('admin:commonCode.ui.statusActive') : t('admin:commonCode.ui.statusInactive')}
                                                            </span>
                                                        </td>
                                                        <td>{toDisplayString(code.sortOrder, t('admin:commonCode.ui.displayEmpty', '—'))}</td>
                                                        <td className="mg-v2-ad-b0kla__data-cell--secondary">
                                                            {code.codeDescription ? toDisplayString(code.codeDescription, t('admin:commonCode.ui.displayEmpty', '—')) : t('admin:commonCode.ui.displayEmpty', '—')}
                                                        </td>
                                                        <td className="mg-v2-ad-b0kla__data-cell--center">
                                                            <div className="mg-v2-ad-b0kla__code-actions mg-v2-ad-b0kla__code-actions--centered">
                                                                <MGButton
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="small"
                                                                    className={buildErpMgButtonClassName({
                                                                        variant: 'outline',
                                                                        size: 'sm',
                                                                        loading: loading,
                                                                        className: 'mg-v2-ad-b0kla__action-btn--edit'
                                                                    })}
                                                                    loading={loading}
                                                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                                    onClick={() => handleEditCode(code)}
                                                                    title={t('admin:commonCode.ui.btnEdit')}
                                                                    preventDoubleClick={false}
                                                                >
                                                                    {t('admin:commonCode.ui.btnEdit')}
                                                                </MGButton>
                                                                <MGButton
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="small"
                                                                    className={buildErpMgButtonClassName({
                                                                        variant: 'outline',
                                                                        size: 'sm',
                                                                        loading: loading,
                                                                        className: code.isActive ? 'mg-v2-ad-b0kla__action-btn--toggle-active' : 'mg-v2-ad-b0kla__action-btn--toggle-inactive'
                                                                    })}
                                                                    loading={loading}
                                                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                                    onClick={() => handleToggleStatus(code.id, code.isActive)}
                                                                    title={code.isActive ? t('admin:commonCode.ui.actionDeactivate') : t('admin:commonCode.ui.actionActivate')}
                                                                    preventDoubleClick={false}
                                                                >
                                                                    {code.isActive ? t('admin:commonCode.ui.actionDeactivate') : t('admin:commonCode.ui.actionActivate')}
                                                                </MGButton>
                                                                <MGButton
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="small"
                                                                    className={buildErpMgButtonClassName({
                                                                        variant: 'outline',
                                                                        size: 'sm',
                                                                        loading: loading,
                                                                        className: 'mg-v2-ad-b0kla__action-btn--delete'
                                                                    })}
                                                                    loading={loading}
                                                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                                    onClick={() => handleDeleteCode(code.id)}
                                                                    title={t('admin:commonCode.ui.btnDelete')}
                                                                    preventDoubleClick={false}
                                                                >
                                                                    {t('admin:commonCode.ui.btnDelete')}
                                                                </MGButton>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </ContentArea>
            <ConfirmModal />
        </AdminCommonLayout>
    );
};

export default CommonCodeManagement;