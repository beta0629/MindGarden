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
import { useTranslation } from 'react-i18next';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import './CommonCodeManagementB0KlA.css';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_COMMON_CODES_GROUPS_LIST = '/api/v1/common-codes/groups/list';


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
                const response = await apiGet(API_COMMON_CODES_GROUPS_LIST);
                if (response && response.length > 0) {
                    const filteredGroups = response.filter(groupCode => {
                        return hasCodeGroupPermission(groupCode);
                    });
                    setCodeGroups(filteredGroups);
                } else {
                    notificationManager.error(t('admin:commonCode.msg.errLoadCodeGroups', '코드그룹 목록을 불러오는데 실패했습니다.'));
                }
            }
        } catch (error) {
            console.error('코드그룹 로드 오류:', error);
            notificationManager.error(t('admin:commonCode.msg.errLoadCodeGroups', '코드그룹 목록을 불러오는데 실패했습니다.'));
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
                notificationManager.error(t('admin:commonCode.msg.groupCodesLoadError', '{{groupName}} 그룹의 코드 목록을 불러오는데 실패했습니다.', { groupName: groupName }));
            }
        } catch (error) {
            console.error('그룹 코드 로드 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error(t('admin:commonCode.msg.errNoAccessCodeGroup', '해당 코드 그룹에 대한 접근 권한이 없습니다.'));
            } else {
                notificationManager.error(t('admin:commonCode.msg.groupCodesLoadError', '{{groupName}} 그룹의 코드 목록을 불러오는데 실패했습니다.', { groupName: groupName }));
            }
        } finally {
            setLoading(false);
        }
    }, [user?.role]);

    const handleGroupSelect = (group) => {
        if (!hasCodeGroupPermission(group)) {
            if (isBranchCodeGroup(group)) {
                notificationManager.error(t('admin:commonCode.msg.errBranchCodeGroupAdminOnly', '지점 관련 코드 그룹은 관리자만 접근할 수 있습니다.'));
            } else if (isErpCodeGroup(group)) {
                notificationManager.error(t('admin:commonCode.msg.errErpCodeGroupAdminOnly', 'ERP 관련 코드 그룹은 관리자만 접근할 수 있습니다.'));
            } else if (isFinancialCodeGroup(group)) {
                notificationManager.error(t('admin:commonCode.msg.errFinancialCodeGroupAdminOnly', '수입지출 관련 코드 그룹은 관리자만 접근할 수 있습니다.'));
            } else {
                notificationManager.error(t('admin:commonCode.msg.errNoAccessCodeGroup', '해당 코드 그룹에 대한 접근 권한이 없습니다.'));
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
            notificationManager.error(t('admin:commonCode.msg.errCodeValueLabelRequired', '코드 값과 라벨은 필수입니다.'));
            return;
        }

        if (isSubcategoryCodeGroup(selectedGroup)) {
            if (!newCodeData.parentCodeValue || !String(newCodeData.parentCodeValue).trim()) {
                notificationManager.error(t('admin:commonCode.msg.errSelectParentCategory', '상위 카테고리를 선택하세요.'));
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
                notificationManager.success(t('admin:commonCode.msg.successCodeAdded', '새 코드가 추가되었습니다!'));
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
                notificationManager.error(t('admin:commonCode.msg.errCodeAddFailed', '코드 추가에 실패했습니다.'));
            }
        } catch (error) {
            console.error('코드 추가 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error(t('admin:commonCode.msg.errNoCreatePermission', '해당 코드 그룹에 대한 생성 권한이 없습니다.'));
            } else {
                notificationManager.error(error.message || t('admin:commonCode.msg.errCodeAddFailed', '코드 추가에 실패했습니다.'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCode = async(codeId) => {
        const confirmed = await confirm({
            message: t('admin:commonCode.msg.confirmDeleteCode', '정말로 이 코드를 삭제하시겠습니까?'),
            variant: 'danger'
        });
        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);
            await deleteCommonCode(codeId, { codeGroup: selectedGroup });
            notificationManager.success(t('admin:commonCode.msg.successCodeDeleted', '코드가 삭제되었습니다!'));
            loadGroupCodes(selectedGroup);
        } catch (error) {
            console.error('코드 삭제 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error(t('admin:commonCode.msg.errNoDeletePermission', '해당 코드 그룹에 대한 삭제 권한이 없습니다.'));
            } else {
                notificationManager.error(error.message || t('admin:commonCode.msg.errCodeDeleteFailed', '코드 삭제에 실패했습니다.'));
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
            notificationManager.success(t('admin:commonCode.msg.successCodeStatusChanged', '코드 상태가 변경되었습니다!'));
            loadGroupCodes(selectedGroup);
        } catch (error) {
            console.error('코드 상태 토글 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error(t('admin:commonCode.msg.errNoTogglePermission', '해당 코드 그룹에 대한 상태 변경 권한이 없습니다.'));
            } else {
                notificationManager.error(error.message || t('admin:commonCode.msg.errCodeToggleFailed', '코드 상태 변경에 실패했습니다.'));
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
            notificationManager.error(t('admin:commonCode.msg.errCodeValueLabelRequired', '코드 값과 라벨은 필수입니다.'));
            return;
        }

        const editGroup = editingCode?.codeGroup || selectedGroup;
        if (isSubcategoryCodeGroup(editGroup)) {
            if (!newCodeData.parentCodeValue || !String(newCodeData.parentCodeValue).trim()) {
                notificationManager.error(t('admin:commonCode.msg.errSelectParentCategory', '상위 카테고리를 선택하세요.'));
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
            notificationManager.success(t('admin:commonCode.msg.successCodeUpdated', '코드가 수정되었습니다!'));
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
                notificationManager.error(t('admin:commonCode.msg.errNoUpdatePermission', '해당 코드 그룹에 대한 수정 권한이 없습니다.'));
            } else {
                notificationManager.error(t('admin:commonCode.msg.errCodeUpdateFailed', '코드 수정에 실패했습니다.'));
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

    useEffect(() => {
        loadMetadata();
        loadCodeGroups();
    }, [loadMetadata, loadCodeGroups]);

    return (
        <AdminCommonLayout title={t('admin:commonCode.ui.pageTitle', '공통코드 관리')}>
            <ContentArea>
                <ContentHeader title={t('admin:commonCode.ui.pageTitle', '공통코드 관리')} subtitle={t('admin:commonCode.ui.headerSubtitle', '코드그룹을 선택한 뒤 해당 그룹의 세부 코드를 관리합니다.')} />
                
                <div className="mg-v2-ad-b0kla__common-code-container">
                    {/* 좌측: GroupListSection */}
                    <div className="mg-v2-ad-b0kla__group-list-section">
                        <div className="mg-v2-ad-b0kla__section-header">
                            {t('admin:commonCode.ui.groupListTitle', '코드그룹 목록')}
                        </div>

                        <div className="mg-v2-ad-b0kla__search-bar">
                            <div className="mg-v2-ad-b0kla__search-input-wrapper">
                                <input
                                    type="text"
                                    placeholder={t('admin:commonCode.ui.searchPlaceholder', '코드그룹 검색...')}
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
                                <option value="all">{t('admin:commonCode.ui.categoryAll', '전체 카테고리')}</option>
                                <option value="user">{t('admin:commonCode.ui.categoryUser', '사용자 관련')}</option>
                                <option value="system">{t('admin:commonCode.ui.categorySystem', '시스템 관련')}</option>
                                <option value="payment">{t('admin:commonCode.ui.categoryPayment', '결제/급여')}</option>
                                <option value="consultation">{t('admin:commonCode.ui.categoryConsultation', '상담 관련')}</option>
                                <option value="erp">{t('admin:commonCode.ui.categoryErp', 'ERP 관련')}</option>
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
                                <h3>{t('admin:commonCode.ui.emptySelectTitle', '코드그룹을 선택하세요')}</h3>
                                <p>{t('admin:commonCode.ui.emptySelectDesc', '좌측 목록에서 코드그룹을 선택하여 상세 코드를 관리할 수 있습니다.')}</p>
                            </div>
                        ) : (
                            <>
                                <div className="mg-v2-ad-b0kla__section-header">
                                    <span>
                                        {t('admin:commonCode.msg.detailTitle', '{{displayName}} ({{groupCode}}) 세부 코드', { displayName: getGroupKoreanName(selectedGroup) !== selectedGroup
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
                                                {t('admin:commonCode.ui.btnNew', '신규 추가')}
                                            </MGButton>
                                        )}
                                    </div>
                                </div>

                                {showAddForm && (
                                    <div className="mg-v2-ad-b0kla__form-container">
                                        <div className="mg-v2-ad-b0kla__form-header">
                                            <h3 className="mg-v2-ad-b0kla__form-title">{editingCode ? t('admin:commonCode.ui.formTitleEdit', '코드 수정') : t('admin:commonCode.ui.formTitleNew', '새 코드 추가')}</h3>
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
                                                {t('admin:commonCode.ui.btnClose', '닫기')}
                                            </MGButton>
                                        </div>
                                        <form onSubmit={ editingCode ? handleUpdateCode : handleAddCode }>
                                            <div className="mg-v2-ad-b0kla__form-row">
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="codeValue" className="mg-v2-ad-b0kla__form-label">{t('admin:commonCode.ui.labelCodeValue', '코드 값 *')}</label>
                                                    <input
                                                        id="codeValue"
                                                        type="text"
                                                        value={ newCodeData.codeValue }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, codeValue: e.target.value })}
                                                        placeholder={t('admin:commonCode.ui.placeholderCodeValue', '예: ACTIVE, INACTIVE')}
                                                        required
                                                        disabled={!!editingCode}
                                                        className="mg-v2-ad-b0kla__form-input"
                                                    />
                                                </div>
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="codeLabel" className="mg-v2-ad-b0kla__form-label">{t('admin:commonCode.ui.labelCodeLabel', '코드 라벨 *')}</label>
                                                    <input
                                                        id="codeLabel"
                                                        type="text"
                                                        value={ newCodeData.codeLabel }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, codeLabel: e.target.value })}
                                                        placeholder={t('admin:commonCode.ui.placeholderCodeLabel', '예: 활성, 비활성')}
                                                        required
                                                        className="mg-v2-ad-b0kla__form-input"
                                                    />
                                                </div>
                                            </div>
                                            {isSubcategoryCodeGroup(selectedGroup) && (
                                                <div className="mg-v2-ad-b0kla__form-row">
                                                    <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
                                                        <label htmlFor="parentCategorySelect" className="mg-v2-ad-b0kla__form-label">
                                                            {t('admin:commonCode.ui.labelParentCategory', '상위 카테고리 *')}
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
                                                            placeholder={t('admin:commonCode.ui.placeholderParentCategory', '상위 카테고리를 선택하세요')}
                                                            disabled={loading || parentCategorySelectOptions.length === 0}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="mg-v2-ad-b0kla__form-row">
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="codeDescription" className="mg-v2-ad-b0kla__form-label">{t('admin:commonCode.ui.labelDescription', '설명')}</label>
                                                    <textarea
                                                        id="codeDescription"
                                                        value={ newCodeData.codeDescription }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, codeDescription: e.target.value })}
                                                        placeholder={t('admin:commonCode.ui.placeholderDescription', '코드에 대한 설명을 입력하세요.')}
                                                        className="mg-v2-ad-b0kla__form-textarea"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mg-v2-ad-b0kla__form-row">
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="sortOrder" className="mg-v2-ad-b0kla__form-label">{t('admin:commonCode.ui.labelSortOrder', '정렬 순서')}</label>
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
                                                    <label htmlFor="isActiveCheckbox" className="mg-v2-ad-b0kla__form-label mg-v2-ad-b0kla__form-label--clickable">{t('admin:commonCode.ui.labelActiveState', '활성 상태')}</label>
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
                                                    {t('admin:commonCode.ui.btnCancel', '취소')}
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
                                                    {editingCode ? t('admin:commonCode.ui.btnSubmitEdit', '수정') : t('admin:commonCode.ui.btnSubmitAdd', '추가')}
                                                </MGButton>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {loading && groupCodes.length === 0 ? (
                                    <div className="mg-v2-ad-b0kla__loading-message">{t('admin:commonCode.ui.loading', '로딩중...')}</div>
                                ) : (
                                    <table className="mg-v2-ad-b0kla__data-table">
                                        <thead>
                                            <tr>
                                                <th>{t('admin:commonCode.ui.colCodeLabel', '코드 라벨')}</th>
                                                <th>{t('admin:commonCode.ui.colCodeValue', '코드 값')}</th>
                                                {showParentColumn && <th>{t('admin:commonCode.ui.colParentCategory', '상위 카테고리')}</th>}
                                                <th>{t('admin:commonCode.ui.colStatus', '상태')}</th>
                                                <th>{t('admin:commonCode.ui.colSort', '정렬')}</th>
                                                <th>{t('admin:commonCode.ui.colDescription', '설명')}</th>
                                                <th className="mg-v2-ad-b0kla__data-table-actions-col">{t('admin:commonCode.ui.colManage', '관리')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupCodes.length === 0 ? (
                                                <tr>
                                                    <td colSpan={tableColSpan} className="mg-v2-ad-b0kla__data-table-empty-cell">
                                                        {t('admin:commonCode.ui.emptyNoCodes', '등록된 세부 코드가 없습니다.')}
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
                                                                {code.isActive ? t('admin:commonCode.ui.statusActive', '활성') : t('admin:commonCode.ui.statusInactive', '비활성')}
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
                                                                    title={t('admin:commonCode.ui.btnEdit', '수정')}
                                                                    preventDoubleClick={false}
                                                                >
                                                                    {t('admin:commonCode.ui.btnEdit', '수정')}
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
                                                                    title={code.isActive ? t('admin:commonCode.ui.actionDeactivate', '비활성화') : t('admin:commonCode.ui.actionActivate', '활성화')}
                                                                    preventDoubleClick={false}
                                                                >
                                                                    {code.isActive ? t('admin:commonCode.ui.actionDeactivate', '비활성화') : t('admin:commonCode.ui.actionActivate', '활성화')}
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
                                                                    title={t('admin:commonCode.ui.btnDelete', '삭제')}
                                                                    preventDoubleClick={false}
                                                                >
                                                                    {t('admin:commonCode.ui.btnDelete', '삭제')}
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