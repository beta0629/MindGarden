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
                    notificationManager.error('코드그룹 목록을 불러오는데 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('코드그룹 로드 오류:', error);
            notificationManager.error('코드그룹 목록을 불러오는데 실패했습니다.');
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
                    notificationManager.error(`${groupName} 그룹의 코드 목록을 불러오는데 실패했습니다.`);
                }
            }
        } catch (error) {
            console.error('그룹 코드 로드 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error('해당 코드 그룹에 대한 접근 권한이 없습니다.');
            } else {
                notificationManager.error(`${groupName} 그룹의 코드 목록을 불러오는데 실패했습니다.`);
            }
        } finally {
            setLoading(false);
        }
    }, [user?.role]);

    const handleGroupSelect = (group) => {
        if (!hasCodeGroupPermission(group)) {
            if (isBranchCodeGroup(group)) {
                notificationManager.error('지점 관련 코드 그룹은 관리자만 접근할 수 있습니다.');
            } else if (isErpCodeGroup(group)) {
                notificationManager.error('ERP 관련 코드 그룹은 관리자만 접근할 수 있습니다.');
            } else if (isFinancialCodeGroup(group)) {
                notificationManager.error('수입지출 관련 코드 그룹은 관리자만 접근할 수 있습니다.');
            } else {
                notificationManager.error('해당 코드 그룹에 대한 접근 권한이 없습니다.');
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
        const koreanMappings = {
            'USER_ROLE': '사용자역할',
            'USER_STATUS': '사용자상태',
            'USER_GRADE': '사용자등급',
            'CONSULTANT_GRADE': '상담사등급',
            'CLIENT_STATUS': '내담자상태',
            'GENDER': '성별',
            'RESPONSIBILITY': '담당분야',
            'SPECIALTY': '전문분야',
            
            'STATUS': '상태',
            'PRIORITY': '우선순위',
            'MAPPING_STATUS': '매핑상태',
            'ROLE': '역할',
            'PERMISSION': '권한',
            'ROLE_PERMISSION': '역할권한',
            
            'PAYMENT_METHOD': '결제방법',
            'PAYMENT_STATUS': '결제상태',
            'PAYMENT_PROVIDER': '결제제공자',
            'SALARY_TYPE': '급여유형',
            'SALARY_PAY_DAY': '급여지급일',
            'SALARY_OPTION_TYPE': '급여옵션유형',
            'CONSULTANT_GRADE_SALARY': '상담사등급급여',
            'FREELANCE_BASE_RATE': '프리랜서기본요율',
            'BUDGET_CATEGORY': '예산카테고리',
            'BUDGET_STATUS': '예산상태',
            
            'CONSULTATION_PACKAGE': '상담패키지',
            'CONSULTATION_STATUS': '상담상태',
            'CONSULTATION_TYPE': '상담유형',
            'CONSULTATION_METHOD': '상담방법',
            'CONSULTATION_LOCATION': '상담장소',
            'CONSULTATION_SESSION': '상담세션',
            'CONSULTATION_FEE': '상담료',
            'CONSULTATION_MODE': '상담모드',
            'SCHEDULE_STATUS': '스케줄상태',
            'SCHEDULE_TYPE': '스케줄유형',
            'SCHEDULE_FILTER': '스케줄필터',
            'SCHEDULE_SORT': '스케줄정렬',
            'SESSION_PACKAGE': '회기패키지',
            'PACKAGE_TYPE': '패키지유형',
            
            'PURCHASE_STATUS': '구매상태',
            'PURCHASE_CATEGORY': '구매카테고리',
            'FINANCIAL_CATEGORY': '재무카테고리',
            'TAX_CATEGORY': '세무카테고리',
            'TAX_CALCULATION': '세금계산',
            'VAT_APPLICABLE': '부가세적용',
            'EXPENSE_CATEGORY': '지출카테고리',
            'EXPENSE_SUBCATEGORY': '지출하위카테고리',
            'INCOME_CATEGORY': '수입카테고리',
            'INCOME_SUBCATEGORY': '수입하위카테고리',
            'ITEM_CATEGORY': '항목카테고리',
            'TRANSACTION_TYPE': '거래유형',
            
            'VACATION_TYPE': '휴가유형',
            'VACATION_STATUS': '휴가상태',
            
            'REPORT_PERIOD': '보고서기간',
            'YEAR_RANGE': '년도범위',
            'MONTH_RANGE': '월범위',
            'DATE_RANGE': '날짜범위',
            'DATE_RANGE_FILTER': '날짜범위필터',
            'CHART_TYPE_FILTER': '차트유형필터',
            
            'MENU': '메뉴',
            'MENU_CATEGORY': '메뉴카테고리',
            'ADMIN_MENU': '어드민메뉴',
            'CLIENT_MENU': '내담자메뉴',
            'CONSULTANT_MENU': '상담사메뉴',
            'HQ_ADMIN_MENU': '관리자메뉴',
            'BRANCH_SUPER_ADMIN_MENU': '지점수퍼관리자메뉴',
            'COMMON_MENU': '공통메뉴',
            
            'APPROVAL_STATUS': '승인상태',
            'BANK': '은행',
            'CURRENCY': '통화',
            'LANGUAGE': '언어',
            'TIMEZONE': '시간대',
            'ADDRESS_TYPE': '주소유형',
            'FILE_TYPE': '파일유형',
            'MESSAGE_TYPE': '메시지유형',
            'NOTIFICATION_TYPE': '알림유형',
            'NOTIFICATION_CHANNEL': '알림채널',
            'DURATION': '기간',
            'SORT_OPTION': '정렬옵션',
            'PRIORITY_LEVEL': '우선순위레벨',
            'ADMIN_PERMISSIONS': '어드민권한',
            'AGE_GROUP': '연령대',
            'ALIMTALK_TEMPLATE': '알림톡템플릿'
        };
        
        return koreanMappings[groupName] || groupName;
    };

    const handleAddCode = async(e) => {
        e.preventDefault();
        
        if (!newCodeData.codeValue.trim() || !newCodeData.codeLabel.trim()) {
            notificationManager.error('코드 값과 라벨은 필수입니다.');
            return;
        }

        if (isSubcategoryCodeGroup(selectedGroup)) {
            if (!newCodeData.parentCodeValue || !String(newCodeData.parentCodeValue).trim()) {
                notificationManager.error('상위 카테고리를 선택하세요.');
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
                notificationManager.success('새 코드가 추가되었습니다!');
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
                notificationManager.error('코드 추가에 실패했습니다.');
            }
        } catch (error) {
            console.error('코드 추가 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error('해당 코드 그룹에 대한 생성 권한이 없습니다.');
            } else {
                notificationManager.error(error.message || '코드 추가에 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCode = async(codeId) => {
        const confirmed = await new Promise((resolve) => {
            notificationManager.confirm('정말로 이 코드를 삭제하시겠습니까?', resolve);
        });
        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);
            await deleteCommonCode(codeId, { codeGroup: selectedGroup });
            notificationManager.success('코드가 삭제되었습니다!');
            loadGroupCodes(selectedGroup);
        } catch (error) {
            console.error('코드 삭제 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error('해당 코드 그룹에 대한 삭제 권한이 없습니다.');
            } else {
                notificationManager.error(error.message || '코드 삭제에 실패했습니다.');
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
            notificationManager.success('코드 상태가 변경되었습니다!');
            loadGroupCodes(selectedGroup);
        } catch (error) {
            console.error('코드 상태 토글 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error('해당 코드 그룹에 대한 상태 변경 권한이 없습니다.');
            } else {
                notificationManager.error(error.message || '코드 상태 변경에 실패했습니다.');
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
            notificationManager.error('코드 값과 라벨은 필수입니다.');
            return;
        }

        const editGroup = editingCode?.codeGroup || selectedGroup;
        if (isSubcategoryCodeGroup(editGroup)) {
            if (!newCodeData.parentCodeValue || !String(newCodeData.parentCodeValue).trim()) {
                notificationManager.error('상위 카테고리를 선택하세요.');
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
            notificationManager.success('코드가 수정되었습니다!');
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
                notificationManager.error('해당 코드 그룹에 대한 수정 권한이 없습니다.');
            } else {
                notificationManager.error('코드 수정에 실패했습니다.');
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
            return '—';
        }
        const found = parentCategoryCodes.find((c) => c.codeValue === code.parentCodeValue);
        if (found) {
            return toDisplayString(found.codeLabel || found.koreanName || found.codeValue, '—');
        }
        return toDisplayString(code.parentCodeValue, '—');
    };

    const showParentColumn = isSubcategoryCodeGroup(selectedGroup);
    const tableColSpan = showParentColumn ? 7 : 6;

    useEffect(() => {
        loadMetadata();
        loadCodeGroups();
    }, [loadMetadata, loadCodeGroups]);

    return (
        <AdminCommonLayout title="공통코드 관리">
            <ContentArea>
                <ContentHeader title="공통코드 관리" subtitle="코드그룹을 선택한 뒤 해당 그룹의 세부 코드를 관리합니다." />
                
                <div className="mg-v2-ad-b0kla__common-code-container">
                    {/* 좌측: GroupListSection */}
                    <div className="mg-v2-ad-b0kla__group-list-section">
                        <div className="mg-v2-ad-b0kla__section-header">
                            코드그룹 목록
                        </div>

                        <div className="mg-v2-ad-b0kla__search-bar">
                            <div className="mg-v2-ad-b0kla__search-input-wrapper">
                                <input
                                    type="text"
                                    placeholder="코드그룹 검색..."
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
                                <option value="all">전체 카테고리</option>
                                <option value="user">사용자 관련</option>
                                <option value="system">시스템 관련</option>
                                <option value="payment">결제/급여</option>
                                <option value="consultation">상담 관련</option>
                                <option value="erp">ERP 관련</option>
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
                                <h3>코드그룹을 선택하세요</h3>
                                <p>좌측 목록에서 코드그룹을 선택하여 상세 코드를 관리할 수 있습니다.</p>
                            </div>
                        ) : (
                            <>
                                <div className="mg-v2-ad-b0kla__section-header">
                                    <span>
                                        { getGroupKoreanName(selectedGroup) !== selectedGroup ? getGroupKoreanName(selectedGroup) : convertGroupNameToKorean(selectedGroup) } 
                                        ({ selectedGroup }) 세부 코드
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
                                                신규 추가
                                            </MGButton>
                                        )}
                                    </div>
                                </div>

                                {showAddForm && (
                                    <div className="mg-v2-ad-b0kla__form-container">
                                        <div className="mg-v2-ad-b0kla__form-header">
                                            <h3 className="mg-v2-ad-b0kla__form-title">{editingCode ? '코드 수정' : '새 코드 추가'}</h3>
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
                                                닫기
                                            </MGButton>
                                        </div>
                                        <form onSubmit={ editingCode ? handleUpdateCode : handleAddCode }>
                                            <div className="mg-v2-ad-b0kla__form-row">
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="codeValue" className="mg-v2-ad-b0kla__form-label">코드 값 *</label>
                                                    <input
                                                        id="codeValue"
                                                        type="text"
                                                        value={ newCodeData.codeValue }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, codeValue: e.target.value })}
                                                        placeholder="예: ACTIVE, INACTIVE"
                                                        required
                                                        disabled={!!editingCode}
                                                        className="mg-v2-ad-b0kla__form-input"
                                                    />
                                                </div>
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="codeLabel" className="mg-v2-ad-b0kla__form-label">코드 라벨 *</label>
                                                    <input
                                                        id="codeLabel"
                                                        type="text"
                                                        value={ newCodeData.codeLabel }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, codeLabel: e.target.value })}
                                                        placeholder="예: 활성, 비활성"
                                                        required
                                                        className="mg-v2-ad-b0kla__form-input"
                                                    />
                                                </div>
                                            </div>
                                            {isSubcategoryCodeGroup(selectedGroup) && (
                                                <div className="mg-v2-ad-b0kla__form-row">
                                                    <div className="mg-v2-ad-b0kla__form-group mg-v2-ad-b0kla__form-group--full-width">
                                                        <label htmlFor="parentCategorySelect" className="mg-v2-ad-b0kla__form-label">
                                                            상위 카테고리 *
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
                                                            placeholder="상위 카테고리를 선택하세요"
                                                            disabled={loading || parentCategorySelectOptions.length === 0}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="mg-v2-ad-b0kla__form-row">
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="codeDescription" className="mg-v2-ad-b0kla__form-label">설명</label>
                                                    <textarea
                                                        id="codeDescription"
                                                        value={ newCodeData.codeDescription }
                                                        onChange={ (e) => setNewCodeData({ ...newCodeData, codeDescription: e.target.value })}
                                                        placeholder="코드에 대한 설명을 입력하세요."
                                                        className="mg-v2-ad-b0kla__form-textarea"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mg-v2-ad-b0kla__form-row">
                                                <div className="mg-v2-ad-b0kla__form-group">
                                                    <label htmlFor="sortOrder" className="mg-v2-ad-b0kla__form-label">정렬 순서</label>
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
                                                    <label htmlFor="isActiveCheckbox" className="mg-v2-ad-b0kla__form-label" style={{ cursor: 'pointer' }}>활성 상태</label>
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
                                                    취소
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
                                                    {editingCode ? '수정' : '추가'}
                                                </MGButton>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {loading && groupCodes.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 'var(--mg-spacing-xl)', color: 'var(--ad-b0kla-text-secondary)' }}>로딩중...</div>
                                ) : (
                                    <table className="mg-v2-ad-b0kla__data-table">
                                        <thead>
                                            <tr>
                                                <th>코드 라벨</th>
                                                <th>코드 값</th>
                                                {showParentColumn && <th>상위 카테고리</th>}
                                                <th>상태</th>
                                                <th>정렬</th>
                                                <th>설명</th>
                                                <th style={{ width: '120px', textAlign: 'center' }}>관리</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupCodes.length === 0 ? (
                                                <tr>
                                                    <td colSpan={tableColSpan} style={{ textAlign: 'center', color: 'var(--ad-b0kla-text-secondary)', padding: 'var(--mg-spacing-xl)' }}>
                                                        등록된 세부 코드가 없습니다.
                                                    </td>
                                                </tr>
                                            ) : (
                                                groupCodes.map(code => (
                                                    <tr key={code.id} style={{ opacity: code.isActive ? 1 : 0.6 }}>
                                                        <td style={{ fontWeight: 500 }}>{toDisplayString(code.codeLabel, '—')}</td>
                                                        <td><code style={{ fontSize: '12px', background: 'var(--mg-gray-100)', padding: '2px 4px', borderRadius: '4px' }}>{toDisplayString(code.codeValue, '—')}</code></td>
                                                        {showParentColumn && (
                                                            <td style={{ color: 'var(--ad-b0kla-text-secondary)' }}>
                                                                {resolveParentCategoryLabel(code)}
                                                            </td>
                                                        )}
                                                        <td>
                                                            <span className={`mg-v2-badge ${code.isActive ? 'mg-v2-badge--active' : 'mg-v2-badge--inactive'}`}>
                                                                {code.isActive ? '활성' : '비활성'}
                                                            </span>
                                                        </td>
                                                        <td>{toDisplayString(code.sortOrder, '—')}</td>
                                                        <td style={{ color: 'var(--ad-b0kla-text-secondary)' }}>
                                                            {code.codeDescription ? toDisplayString(code.codeDescription, '—') : '—'}
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
                                                                    title="수정"
                                                                    style={{ color: 'var(--ad-b0kla-green)' }}
                                                                    preventDoubleClick={false}
                                                                >
                                                                    수정
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
                                                                    title={code.isActive ? '비활성화' : '활성화'}
                                                                    style={{ color: code.isActive ? 'var(--mg-warning-500)' : 'var(--ad-b0kla-green)' }}
                                                                    preventDoubleClick={false}
                                                                >
                                                                    {code.isActive ? '비활성화' : '활성화'}
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
                                                                    title="삭제"
                                                                    style={{ color: 'var(--mg-error-500)' }}
                                                                    preventDoubleClick={false}
                                                                >
                                                                    삭제
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