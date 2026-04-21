import React, { useState, useEffect, useCallback } from 'react';
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
import { 
    loadCodeGroupMetadata, 
    getCodeGroupKoreanNameSync,
    getCodeGroupIconSync,
    clearCodeGroupCache
} from '../../utils/codeHelper';
import { useSession } from '../../contexts/SessionContext';
import { RoleUtils, USER_ROLES } from '../../constants/roles';
import {
    COMMON_CODE_MANAGEMENT_GROUP_KO_FALLBACK,
    COMMON_CODE_MANAGEMENT_MSG as CCM_MSG,
    COMMON_CODE_MANAGEMENT_UI as CCM_UI,
    formatCommonCodeManagementDetailTitle,
    formatCommonCodeManagementGroupCodesLoadError
} from '../../constants/commonCodeManagementStrings';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import './CommonCodeManagementB0KlA.css';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';

/**
 * - 2단 분할 구조 (마스터-디테일): 코드그룹 목록(좌) / 코드 관리(우)
 * - 아토믹 디자인 및 B0KlA 어드민 디자인 토큰 적용
 * 
 * @author Core Solution
 * @version 2.1.0
 * @since 2025-09-13
 */
const CommonCodeManagement = () => {
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
    
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [parentCategoryCodes, setParentCategoryCodes] = useState([]);

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
                const response = await apiGet('/api/v1/common-codes/groups/list');
                if (response && response.length > 0) {
                    const filteredGroups = response.filter(groupCode => {
                        return hasCodeGroupPermission(groupCode);
                    });
                    setCodeGroups(filteredGroups);
                } else {
                    notificationManager.error(CCM_MSG.ERR_LOAD_CODE_GROUPS);
                }
            }
        } catch (error) {
            console.error('코드그룹 로드 오류:', error);
            notificationManager.error(CCM_MSG.ERR_LOAD_CODE_GROUPS);
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
            if (codes && codes.length > 0) {
                setParentCategoryCodes(codes.filter((c) => c.isActive !== false));
            } else {
                const response = await apiGet(`/api/common-codes/${parentGroup}`);
                const list = response && response.length > 0 ? response : [];
                setParentCategoryCodes(list.filter((c) => c.isActive !== false));
            }
        } catch (error) {
            console.error('상위 카테고리 코드 로드 오류:', error);
            setParentCategoryCodes([]);
        }
    }, []);

    const loadGroupCodes = useCallback(async(groupName) => {
        try {
            setLoading(true);
            const codes = await getCommonCodes(groupName);
            if (codes && codes.length > 0) {
                setGroupCodes(codes);
            } else {
                const response = await apiGet(`/api/common-codes/${groupName}`);
                if (response && response.length > 0) {
                    setGroupCodes(response);
                } else {
                    notificationManager.error(formatCommonCodeManagementGroupCodesLoadError(groupName));
                }
            }
        } catch (error) {
            console.error('그룹 코드 로드 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error(CCM_MSG.ERR_NO_ACCESS_CODE_GROUP);
            } else {
                notificationManager.error(formatCommonCodeManagementGroupCodesLoadError(groupName));
            }
        } finally {
            setLoading(false);
        }
    }, [user?.role]);

    const handleGroupSelect = (group) => {
        if (!hasCodeGroupPermission(group)) {
            if (isBranchCodeGroup(group)) {
                notificationManager.error(CCM_MSG.ERR_BRANCH_CODE_GROUP_ADMIN_ONLY);
            } else if (isErpCodeGroup(group)) {
                notificationManager.error(CCM_MSG.ERR_ERP_CODE_GROUP_ADMIN_ONLY);
            } else if (isFinancialCodeGroup(group)) {
                notificationManager.error(CCM_MSG.ERR_FINANCIAL_CODE_GROUP_ADMIN_ONLY);
            } else {
                notificationManager.error(CCM_MSG.ERR_NO_ACCESS_CODE_GROUP);
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
        return COMMON_CODE_MANAGEMENT_GROUP_KO_FALLBACK[groupName] || groupName;
    };

    const handleAddCode = async(e) => {
        e.preventDefault();
        
        if (!newCodeData.codeValue.trim() || !newCodeData.codeLabel.trim()) {
            notificationManager.error(CCM_MSG.ERR_CODE_VALUE_LABEL_REQUIRED);
            return;
        }

        if (isSubcategoryCodeGroup(selectedGroup)) {
            if (!newCodeData.parentCodeValue || !String(newCodeData.parentCodeValue).trim()) {
                notificationManager.error(CCM_MSG.ERR_SELECT_PARENT_CATEGORY);
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
                notificationManager.success(CCM_MSG.SUCCESS_CODE_ADDED);
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
                notificationManager.error(CCM_MSG.ERR_CODE_ADD_FAILED);
            }
        } catch (error) {
            console.error('코드 추가 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error(CCM_MSG.ERR_NO_CREATE_PERMISSION);
            } else {
                notificationManager.error(error.message || CCM_MSG.ERR_CODE_ADD_FAILED);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCode = async(codeId) => {
        const confirmed = await new Promise((resolve) => {
            notificationManager.confirm(CCM_MSG.CONFIRM_DELETE_CODE, resolve);
        });
        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);
            await deleteCommonCode(codeId, { codeGroup: selectedGroup });
            notificationManager.success(CCM_MSG.SUCCESS_CODE_DELETED);
            loadGroupCodes(selectedGroup);
        } catch (error) {
            console.error('코드 삭제 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error(CCM_MSG.ERR_NO_DELETE_PERMISSION);
            } else {
                notificationManager.error(error.message || CCM_MSG.ERR_CODE_DELETE_FAILED);
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
            notificationManager.success(CCM_MSG.SUCCESS_CODE_STATUS_CHANGED);
            loadGroupCodes(selectedGroup);
        } catch (error) {
            console.error('코드 상태 토글 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error(CCM_MSG.ERR_NO_TOGGLE_PERMISSION);
            } else {
                notificationManager.error(error.message || CCM_MSG.ERR_CODE_TOGGLE_FAILED);
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
            notificationManager.error(CCM_MSG.ERR_CODE_VALUE_LABEL_REQUIRED);
            return;
        }

        const editGroup = editingCode?.codeGroup || selectedGroup;
        if (isSubcategoryCodeGroup(editGroup)) {
            if (!newCodeData.parentCodeValue || !String(newCodeData.parentCodeValue).trim()) {
                notificationManager.error(CCM_MSG.ERR_SELECT_PARENT_CATEGORY);
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
            notificationManager.success(CCM_MSG.SUCCESS_CODE_UPDATED);
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
                notificationManager.error(CCM_MSG.ERR_NO_UPDATE_PERMISSION);
            } else {
                notificationManager.error(CCM_MSG.ERR_CODE_UPDATE_FAILED);
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
            return CCM_UI.DISPLAY_EMPTY;
        }
        const found = parentCategoryCodes.find((c) => c.codeValue === code.parentCodeValue);
        if (found) {
            return toDisplayString(found.codeLabel || found.koreanName || found.codeValue, CCM_UI.DISPLAY_EMPTY);
        }
        return toDisplayString(code.parentCodeValue, CCM_UI.DISPLAY_EMPTY);
    };

    const showParentColumn = isSubcategoryCodeGroup(selectedGroup);
    const tableColSpan = showParentColumn ? 7 : 6;

    useEffect(() => {
        loadMetadata();
        loadCodeGroups();
    }, [loadMetadata, loadCodeGroups]);

    return (
        <AdminCommonLayout title={CCM_UI.PAGE_TITLE}>
            <ContentArea>
                <ContentHeader title={CCM_UI.PAGE_TITLE} subtitle={CCM_UI.HEADER_SUBTITLE} />
                
                <div className="mg-v2-ad-b0kla__common-code-container">
                    {/* 좌측: GroupListSection */}
                    <div className="mg-v2-ad-b0kla__group-list-section">
                        <div className="mg-v2-ad-b0kla__section-header">
                            {CCM_UI.GROUP_LIST_TITLE}
                        </div>

                        <div className="mg-v2-ad-b0kla__search-bar">
                            <div className="mg-v2-ad-b0kla__search-input-wrapper">
                                <input
                                    type="text"
                                    placeholder={CCM_UI.SEARCH_PLACEHOLDER}
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
                                <option value="all">{CCM_UI.CATEGORY_ALL}</option>
                                <option value="user">{CCM_UI.CATEGORY_USER}</option>
                                <option value="system">{CCM_UI.CATEGORY_SYSTEM}</option>
                                <option value="payment">{CCM_UI.CATEGORY_PAYMENT}</option>
                                <option value="consultation">{CCM_UI.CATEGORY_CONSULTATION}</option>
                                <option value="erp">{CCM_UI.CATEGORY_ERP}</option>
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
                                <h3>{CCM_UI.EMPTY_SELECT_TITLE}</h3>
                                <p>{CCM_UI.EMPTY_SELECT_DESC}</p>
                            </div>
                        ) : (
                            <>
                                <div className="mg-v2-ad-b0kla__section-header">
                                    <span>
                                        {formatCommonCodeManagementDetailTitle(
                                            getGroupKoreanName(selectedGroup) !== selectedGroup
                                                ? getGroupKoreanName(selectedGroup)
                                                : convertGroupNameToKorean(selectedGroup),
                                            selectedGroup
                                        )}
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
                                                {CCM_UI.BTN_NEW}
                                            </MGButton>
                                        )}
                                    </div>
                                </div>

                                {showAddForm && (
                                    <div className="mg-v2-ad-b0kla__form-container">
                                        <div className="mg-v2-ad-b0kla__form-header">
                                            <h3 className="mg-v2-ad-b0kla__form-title">{editingCode ? CCM_UI.FORM_TITLE_EDIT : CCM_UI.FORM_TITLE_NEW}</h3>
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
                                                {CCM_UI.BTN_CLOSE}
                                            </MGButton>
                                        </div>
                                        <form onSubmit={ editingCode ? handleUpdateCode : handleAddCode }>
                                            <div className="mg-v2-ad-b0kla__form-row">
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="codeValue" className="mg-v2-ad-b0kla__form-label">{CCM_UI.LABEL_CODE_VALUE}</label>
                                                    <input
                                                        id="codeValue"
                                                        type="text"
                                                        value={ newCodeData.codeValue }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, codeValue: e.target.value })}
                                                        placeholder={CCM_UI.PLACEHOLDER_CODE_VALUE}
                                                        required
                                                        disabled={!!editingCode}
                                                        className="mg-v2-ad-b0kla__form-input"
                                                    />
                                                </div>
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="codeLabel" className="mg-v2-ad-b0kla__form-label">{CCM_UI.LABEL_CODE_LABEL}</label>
                                                    <input
                                                        id="codeLabel"
                                                        type="text"
                                                        value={ newCodeData.codeLabel }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, codeLabel: e.target.value })}
                                                        placeholder={CCM_UI.PLACEHOLDER_CODE_LABEL}
                                                        required
                                                        className="mg-v2-ad-b0kla__form-input"
                                                    />
                                                </div>
                                            </div>
                                            {isSubcategoryCodeGroup(selectedGroup) && (
                                                <div className="mg-v2-ad-b0kla__form-row">
                                                    <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
                                                        <label htmlFor="parentCategorySelect" className="mg-v2-ad-b0kla__form-label">
                                                            {CCM_UI.LABEL_PARENT_CATEGORY}
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
                                                            placeholder={CCM_UI.PLACEHOLDER_PARENT_CATEGORY}
                                                            disabled={loading || parentCategorySelectOptions.length === 0}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="mg-v2-ad-b0kla__form-row">
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="codeDescription" className="mg-v2-ad-b0kla__form-label">{CCM_UI.LABEL_DESCRIPTION}</label>
                                                    <textarea
                                                        id="codeDescription"
                                                        value={ newCodeData.codeDescription }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, codeDescription: e.target.value })}
                                                        placeholder={CCM_UI.PLACEHOLDER_DESCRIPTION}
                                                        className="mg-v2-ad-b0kla__form-textarea"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mg-v2-ad-b0kla__form-row">
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="sortOrder" className="mg-v2-ad-b0kla__form-label">{CCM_UI.LABEL_SORT_ORDER}</label>
                                                    <input
                                                        id="sortOrder"
                                                        type="number"
                                                        value={ newCodeData.sortOrder }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, sortOrder: Number.parseInt(e.target.value) || 0 })}
                                                        min="0"
                                                        className="mg-v2-ad-b0kla__form-input"
                                                    />
                                                </div>
                                                <div className="mg-v2-ad-b0kla__form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
                                                    <input
                                                        type="checkbox"
                                                        id="isActiveCheckbox"
                                                        checked={ newCodeData.isActive }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, isActive: e.target.checked })}
                                                    />
                                                    <label htmlFor="isActiveCheckbox" className="mg-v2-ad-b0kla__form-label" style={{ cursor: 'pointer' }}>{CCM_UI.LABEL_ACTIVE_STATE}</label>
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
                                                    {CCM_UI.BTN_CANCEL}
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
                                                    {editingCode ? CCM_UI.BTN_SUBMIT_EDIT : CCM_UI.BTN_SUBMIT_ADD}
                                                </MGButton>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {loading && groupCodes.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 'var(--mg-spacing-xl)', color: 'var(--ad-b0kla-text-secondary)' }}>{CCM_UI.LOADING}</div>
                                ) : (
                                    <table className="mg-v2-ad-b0kla__data-table">
                                        <thead>
                                            <tr>
                                                <th>{CCM_UI.COL_CODE_LABEL}</th>
                                                <th>{CCM_UI.COL_CODE_VALUE}</th>
                                                {showParentColumn && <th>{CCM_UI.COL_PARENT_CATEGORY}</th>}
                                                <th>{CCM_UI.COL_STATUS}</th>
                                                <th>{CCM_UI.COL_SORT}</th>
                                                <th>{CCM_UI.COL_DESCRIPTION}</th>
                                                <th style={{ width: '120px', textAlign: 'center' }}>{CCM_UI.COL_MANAGE}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupCodes.length === 0 ? (
                                                <tr>
                                                    <td colSpan={tableColSpan} style={{ textAlign: 'center', color: 'var(--ad-b0kla-text-secondary)', padding: 'var(--mg-spacing-xl)' }}>
                                                        {CCM_UI.EMPTY_NO_CODES}
                                                    </td>
                                                </tr>
                                            ) : (
                                                groupCodes.map(code => (
                                                    <tr key={code.id} style={{ opacity: code.isActive ? 1 : 0.6 }}>
                                                        <td style={{ fontWeight: 500 }}>{toDisplayString(code.codeLabel, CCM_UI.DISPLAY_EMPTY)}</td>
                                                        <td><code style={{ fontSize: '12px', background: 'var(--mg-gray-100)', padding: '2px 4px', borderRadius: '4px' }}>{toDisplayString(code.codeValue, CCM_UI.DISPLAY_EMPTY)}</code></td>
                                                        {showParentColumn && (
                                                            <td style={{ color: 'var(--ad-b0kla-text-secondary)' }}>
                                                                {resolveParentCategoryLabel(code)}
                                                            </td>
                                                        )}
                                                        <td>
                                                            <span className={`mg-v2-badge ${code.isActive ? 'mg-v2-badge--active' : 'mg-v2-badge--inactive'}`}>
                                                                {code.isActive ? CCM_UI.STATUS_ACTIVE : CCM_UI.STATUS_INACTIVE}
                                                            </span>
                                                        </td>
                                                        <td>{toDisplayString(code.sortOrder, CCM_UI.DISPLAY_EMPTY)}</td>
                                                        <td style={{ color: 'var(--ad-b0kla-text-secondary)' }}>
                                                            {code.codeDescription ? toDisplayString(code.codeDescription, CCM_UI.DISPLAY_EMPTY) : CCM_UI.DISPLAY_EMPTY}
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <div className="mg-v2-ad-b0kla__code-actions" style={{ justifyContent: 'center' }}>
                                                                <MGButton
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="small"
                                                                    className={buildErpMgButtonClassName({
                                                                        variant: 'outline',
                                                                        size: 'sm',
                                                                        loading: loading
                                                                    })}
                                                                    loading={loading}
                                                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                                    onClick={() => handleEditCode(code)}
                                                                    title={CCM_UI.BTN_EDIT}
                                                                    style={{ color: 'var(--ad-b0kla-green)' }}
                                                                    preventDoubleClick={false}
                                                                >
                                                                    {CCM_UI.BTN_EDIT}
                                                                </MGButton>
                                                                <MGButton
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="small"
                                                                    className={buildErpMgButtonClassName({
                                                                        variant: 'outline',
                                                                        size: 'sm',
                                                                        loading: loading
                                                                    })}
                                                                    loading={loading}
                                                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                                    onClick={() => handleToggleStatus(code.id, code.isActive)}
                                                                    title={code.isActive ? CCM_UI.ACTION_DEACTIVATE : CCM_UI.ACTION_ACTIVATE}
                                                                    style={{ color: code.isActive ? 'var(--mg-warning-500)' : 'var(--ad-b0kla-green)' }}
                                                                    preventDoubleClick={false}
                                                                >
                                                                    {code.isActive ? CCM_UI.ACTION_DEACTIVATE : CCM_UI.ACTION_ACTIVATE}
                                                                </MGButton>
                                                                <MGButton
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="small"
                                                                    className={buildErpMgButtonClassName({
                                                                        variant: 'outline',
                                                                        size: 'sm',
                                                                        loading: loading
                                                                    })}
                                                                    loading={loading}
                                                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                                    onClick={() => handleDeleteCode(code.id)}
                                                                    title={CCM_UI.BTN_DELETE}
                                                                    style={{ color: 'var(--mg-error-500)' }}
                                                                    preventDoubleClick={false}
                                                                >
                                                                    {CCM_UI.BTN_DELETE}
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
        </AdminCommonLayout>
    );
};

export default CommonCodeManagement;