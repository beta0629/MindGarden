import React, { useState, useEffect, useCallback } from 'react';
import Button from '../ui/Button/Button';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import {
    getCommonCodes,
    getCommonCodeById,
    createCommonCode,
    updateCommonCode,
    deleteCommonCode,
    toggleCommonCodeStatus,
    getCodeGroups
} from '../../utils/commonCodeApi';
import notificationManager from '../../utils/notification';
import { 
    loadCodeGroupMetadata, 
    getCodeGroupKoreanName, 
    getCodeGroupIcon,
    getCodeGroupKoreanNameSync,
    getCodeGroupIconSync,
    clearCodeGroupCache
} from '../../utils/codeHelper';
import { useSession } from '../../contexts/SessionContext';
import { RoleUtils, USER_ROLES } from '../../constants/roles';
import { usePermissions } from '../../hooks/usePermissions';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import './ImprovedCommonCodeManagement.css';

/**
 * - 2단계 구조: 코드그룹 선택 → 코드 목록 관리
 * - 직관적인 UI/UX 제공
 * - 관리자 친화적 인터페이스
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-09-13
 */
const CommonCodeManagement = () => {
    const { user } = useSession();
    const { canManageCodeGroup } = usePermissions();
    
    const hasErpCodePermission = () => {
        return RoleUtils.isAdmin(user);
    };
    
    const hasFinancialCodePermission = () => {
        return RoleUtils.isAdmin(user);
    };
    
    const hasHqCodePermission = () => {
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
    
    const isHqCodeGroup = (codeGroup) => {
        return ['HQ_SETTING', 'HQ_MANAGEMENT', 'HQ_PERMISSION', 'HQ_STATISTICS', 
                'HQ_CONFIG'].includes(codeGroup);
    };
    
    const isBranchCodeGroup = (codeGroup) => {
        return ['BRANCH_STATUS', 'BRANCH_TYPE', 'BRANCH_PERMISSION', 'BRANCH_STATISTICS', 
                'BRANCH_SETTING', 'BRANCH_CODE', 'BRANCH_MANAGEMENT'].includes(codeGroup);
    };
    
    const hasCodeGroupPermission = (codeGroup) => {
        if (isHqCodeGroup(codeGroup)) {
            return hasHqCodePermission();
        }
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
    
    const [currentStep, setCurrentStep] = useState(1); // 1: 그룹 선택, 2: 코드 관리
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [codeGroups, setCodeGroups] = useState([]);
    const [groupCodes, setGroupCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCode, setEditingCode] = useState(null);

    const [groupMetadata, setGroupMetadata] = useState([]);
    const [metadataLoaded, setMetadataLoaded] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const loadMetadata = useCallback(async() => {
        try {
            clearCodeGroupCache();
            const metadata = await loadCodeGroupMetadata();
            setGroupMetadata(metadata);
            setMetadataLoaded(true);
            console.log('코드그룹 메타데이터 로드 완료:', metadata.length, '개');
        } catch (error) {
            console.error('코드그룹 메타데이터 로드 실패:', error);
            setMetadataLoaded(true); // 실패해도 로딩 상태는 해제
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

    const loadGroupCodes = useCallback(async (groupName) => {
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
            if (isHqCodeGroup(group)) {
                notificationManager.error('HQ 관련 코드 그룹은 HQ 역할만 접근할 수 있습니다.');
            } else if (isBranchCodeGroup(group)) {
                notificationManager.error('지점 관련 코드 그룹은 지점수퍼어드민 또는 HQ_MASTER만 접근할 수 있습니다.');
            } else if (isErpCodeGroup(group)) {
                notificationManager.error('ERP 관련 코드 그룹은 지점수퍼어드민 또는 HQ_MASTER만 접근할 수 있습니다.');
            } else if (isFinancialCodeGroup(group)) {
                notificationManager.error('수입지출 관련 코드 그룹은 지점수퍼어드민 또는 HQ_MASTER만 접근할 수 있습니다.');
            } else {
                notificationManager.error('해당 코드 그룹에 대한 접근 권한이 없습니다.');
            }
            return;
        }
        
        setSelectedGroup(group);
        setCurrentStep(2);
        loadGroupCodes(group);
    };

    const handleBackToGroups = () => {
        setCurrentStep(1);
        setSelectedGroup(null);
        setGroupCodes([]);
        setShowAddForm(false);
        setEditingCode(null);
    };

    const getFilteredCodeGroups = () => {
        let filtered = codeGroups;

        if (searchTerm) {
            filtered = filtered.filter(group => {
                const koreanName = getCodeGroupKoreanNameSync(group);
                const convertedKorean = convertGroupNameToKorean(group);
                const searchLower = searchTerm.toLowerCase();
                
                const groupMatch = group.toLowerCase().includes(searchLower);
                
                const koreanMatch = koreanName.toLowerCase().includes(searchLower);
                
                const convertedMatch = convertedKorean.toLowerCase().includes(searchLower);
                
                return groupMatch || koreanMatch || convertedMatch;
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
            'ADMIN_MENU': '관리자메뉴',
            'CLIENT_MENU': '내담자메뉴',
            'CONSULTANT_MENU': '상담사메뉴',
            'HQ_ADMIN_MENU': '본사관리자메뉴',
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
            'PRIORITY_LEVEL': '우선순위레벨'
        };
        
        return koreanMappings[groupName] || groupName;
    };

    const getCategoryName = (category) => {
        const categoryNames = {
            'all': '전체',
            'user': '사용자 관련',
            'system': '시스템 관련',
            'payment': '결제/급여',
            'consultation': '상담 관련',
            'erp': 'ERP 관련'
        };
        return categoryNames[category] || category;
    };

    const handleAddCode = async (e) => {
        e.preventDefault();
        
        if (!newCodeData.codeValue.trim() || !newCodeData.codeLabel.trim()) {
            notificationManager.error('코드 값과 라벨은 필수입니다.');
            return;
        }

        try {
            setLoading(true);
            const codeData = {
                codeGroup: selectedGroup,
                codeValue: newCodeData.codeValue,
                codeLabel: newCodeData.codeLabel,
                koreanName: newCodeData.koreanName || newCodeData.codeLabel, // 한글명 필수
                codeDescription: newCodeData.codeDescription,
                sortOrder: newCodeData.sortOrder,
                isActive: newCodeData.isActive,
                parentCodeGroup: newCodeData.parentCodeGroup,
                parentCodeValue: newCodeData.parentCodeValue,
                extraData: newCodeData.extraData,
                icon: newCodeData.icon,
                colorCode: newCodeData.colorCode
            };
            
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

    const handleDeleteCode = async (codeId) => {
        const confirmed = await new Promise((resolve) => {
      notificationManager.confirm('정말로 이 코드를 삭제하시겠습니까?', resolve);
    });
    if (!confirmed) {
        return;
    }

        try {
            setLoading(true);
            await deleteCommonCode(codeId);
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

    const handleToggleStatus = async (codeId, currentStatus) => {
        try {
            setLoading(true);
            await toggleCommonCodeStatus(codeId);
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
        setNewCodeData({
            codeGroup: code.codeGroup,
            codeValue: code.codeValue,
            codeLabel: code.codeLabel,
            codeDescription: code.codeDescription || '',
            sortOrder: code.sortOrder || 0,
            isActive: code.isActive,
            parentCodeGroup: code.parentCodeGroup,
            parentCodeValue: code.parentCodeValue,
            extraData: code.extraData,
            icon: code.icon,
            colorCode: code.colorCode,
            koreanName: code.koreanName
        });
        setShowAddForm(true);
    };

    const handleUpdateCode = async (e) => {
        e.preventDefault();
        
        if (!newCodeData.codeValue.trim() || !newCodeData.codeLabel.trim()) {
            notificationManager.error('코드 값과 라벨은 필수입니다.');
            return;
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
            
            await updateCommonCode(editingCode.id, updateData);
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
            codeValue: '',
            codeLabel: '',
            codeDescription: '',
            sortOrder: 0,
            isActive: true
        });
    };

    useEffect(() => {
        loadMetadata();
        loadCodeGroups();
    }, [loadMetadata, loadCodeGroups]);

    const renderGroupSelection = () => (
        <div className="group-selection">
            <div className="step-header">
                <h2>📋 코드그룹 선택</h2>
                <p>관리하고자 하는 코드그룹을 선택하세요.</p>
            </div>

            { /* 필터 UI */ }
            <div className="common-code-management-filter">
                <div className="mg-v2-flex mg-gap-md mg-align-center mg-mb-md" className="mg-v2-filter-container">
                    { /* 검색 입력 */ }
                    <div className="mg-v2-form-group" className="mg-v2-search-group">
                        <input
                            type="text"
                            placeholder="코드그룹명, 한글명, 영문명으로 검색..."
                            value={ searchTerm }
                            onChange={ (e) => setSearchTerm(e.target.value) }
                            className="mg-v2-input"
                            onFocus={ (e) => e.target.style.borderColor = 'var(--mg-primary-500)' }
                            onBlur={ (e) => e.target.style.borderColor = 'var(--mg-gray-300)' }
                        />
                        <i className="bi bi-search mg-search-icon"></i>
                    </div>
                    
                    { /* 카테고리 필터 */ }
                    <select
                        value={ categoryFilter }
                        onChange={ (e) => setCategoryFilter(e.target.value) }
                        className="mg-v2-filter-select"
                    >
                        <option value="all">전체 카테고리</option>
                        <option value="user">사용자 관련</option>
                        <option value="system">시스템 관련</option>
                        <option value="payment">결제/급여</option>
                        <option value="consultation">상담 관련</option>
                        <option value="erp">ERP 관련</option>
                    </select>
                    
                    { /* 필터 초기화 */ }
                    {(searchTerm || categoryFilter !== 'all') && (
                        <Button
                            variant="secondary"
                            size="small"
                            onClick={() => {
                                setSearchTerm('');
                                setCategoryFilter('all');
                            }}
                            className="mg-v2-filter-reset-btn"
                            preventDoubleClick={true}
                        >
                            <i className="bi bi-x-circle"></i>
                            초기화
                        </Button>
                    )}
                </div>
                
                { /* 필터 상태 표시 */ }
                <div className="mg-filter-status">
                    <i className="bi bi-info-circle"></i>
                    {searchTerm || categoryFilter !== 'all' ? (
                        <span>
                            검색 결과: <strong>{getFilteredCodeGroups().length}개</strong>
                            { searchTerm && ` (검색어: "${searchTerm }")`}
                            { categoryFilter !== 'all' && ` (카테고리: ${getCategoryName(categoryFilter) })`}
                        </span>
                    ) : (
                        <span>
                            전체 <strong>{ codeGroups.length }개</strong> 코드그룹
                        </span>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="mg-loading">로딩중...</div>
            ) : (
                <div className="group-cards">
                    {getFilteredCodeGroups().map((group, index) => (
                        <div 
                            key={group} 
                            className="group-card"
                            onClick={ () => handleGroupSelect(group) }
                        >
                            <div className="group-card-header">
                                <div className="group-icon">{ getGroupIcon(group) }</div>
                                <h3>{ getGroupKoreanName(group) || convertGroupNameToKorean(group) }</h3>
                                <span className="group-code">{ group }</span>
                            </div>
                            <div className="group-card-body">
                                <p>코드 그룹 관리</p>
                                <div className="group-actions">
                                    <span className="action-text">클릭하여 관리</span>
                                    <i className="bi bi-arrow-right"></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderCodeManagement = () => (
        <div className="code-management">
            <div className="mg-v2-header-bar">
                <button 
                    className="mg-v2-button mg-v2-button-outline"
                    onClick={ handleBackToGroups }
                >
                    ← 그룹 선택으로 돌아가기
                </button>
                <div className="mg-v2-group-info">
                    <h2 className="mg-v2-group-title">
                        📁 { getGroupKoreanName(selectedGroup) || convertGroupNameToKorean(selectedGroup) } 그룹 관리
                    </h2>
                    <p className="mg-v2-group-description">
                        { selectedGroup } - 코드를 추가, 수정, 삭제할 수 있습니다.
                    </p>
                </div>
                <Button 
                    variant="primary"
                    onClick={() => setShowAddForm(true)}
                    disabled={loading}
                    className="mg-v2-add-code-btn"
                    preventDoubleClick={true}
                >
                    + 새 코드 추가
                </Button>
            </div>

            {showAddForm && (
                <div className="add-code-form">
                    <div className="form-header">
                        <h3>{editingCode ? '코드 수정' : '새 코드 추가'}</h3>
                        <Button 
                            variant="secondary"
                            size="small"
                            onClick={handleCancelForm}
                            preventDoubleClick={true}
                        >
                            <i className="bi bi-x"></i>
                        </Button>
                    </div>
                    <form onSubmit={ editingCode ? handleUpdateCode : handleAddCode }>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="codeValue">코드 값 *</label>
                                <input
                                    type="text"
                                    id="codeValue"
                                    value={ newCodeData.codeValue }
                                    onChange={ (e) => setNewCodeData({...newCodeData, codeValue: e.target.value })}
                                    className="form-control"
                                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                    placeholder="예: ACTIVE, INACTIVE"
                                    required
                                    className="mg-v2-form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="codeLabel">코드 라벨 *</label>
                                <input
                                    type="text"
                                    id="codeLabel"
                                    value={ newCodeData.codeLabel }
                                    onChange={ (e) => setNewCodeData({...newCodeData, codeLabel: e.target.value })}
                                    className="form-control"
                                    placeholder="예: 활성, 비활성"
                                    required
                                    className="form-control mg-form-input--legacy"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="codeDescription">설명</label>
                            <textarea
                                id="codeDescription"
                                value={ newCodeData.codeDescription }
                                onChange={ (e) => setNewCodeData({...newCodeData, codeDescription: e.target.value })}
                                className="form-control"
                                rows="3"
                                placeholder="코드에 대한 설명을 입력하세요."
                                className="form-control mg-form-input"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="sortOrder">정렬 순서</label>
                                <input
                                    type="number"
                                    id="sortOrder"
                                    value={ newCodeData.sortOrder }
                                    onChange={ (e) => setNewCodeData({...newCodeData, sortOrder: parseInt(e.target.value) || 0 })}
                                    className="form-control"
                                    min="0"
                                    className="form-control mg-form-input--legacy"
                                />
                            </div>
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={ newCodeData.isActive }
                                        onChange={ (e) => setNewCodeData({...newCodeData, isActive: e.target.checked })}
                                    />
                                    <span>활성 상태</span>
                                </label>
                            </div>
                        </div>
                        <div className="form-actions">
                            <Button 
                                type="button" 
                                variant="secondary"
                                onClick={handleCancelForm}
                                preventDoubleClick={true}
                            >
                                취소
                            </Button>
                            <Button 
                                type="submit" 
                                variant="primary"
                                disabled={loading}
                                preventDoubleClick={true}
                                loading={loading}
                            >
                                {editingCode ? '수정' : '추가'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="codes-list">
                {loading ? (
                    <div className="mg-loading">로딩중...</div>
                ) : groupCodes.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <h3>코드가 없습니다</h3>
                        <p>새로운 코드를 추가해보세요.</p>
                    </div>
                ) : (
                    <div className="mg-v2-code-grid">
                        {groupCodes.map((code) => (
                            <div 
                                key={code.id} 
                                style={{
                                    backgroundColor: 'var(--mg-gray-100)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    border: '2px solid var(--mg-gray-200)',
                                    transition: 'all 0.3s ease',
                                    opacity: !code.isActive ? 0.6 : 1
                                }}
                            >
                                <div className="mg-v2-code-card-header">
                                    <div>
                                        <h4 className="mg-v2-code-label">
                                            { code.codeLabel }
                                        </h4>
                                        <span style={{
                                            color: 'var(--mg-secondary-500)',
                                            fontSize: 'var(--font-size-xs)',
                                            background: 'var(--mg-gray-200)',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontFamily: 'monospace'
                                        }}>
                                            { code.codeValue }
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: 'var(--font-size-xs)',
                                        fontWeight: '500',
                                        backgroundColor: code.isActive ? 'var(--mg-success-100)' : 'var(--mg-error-100)',
                                        color: code.isActive ? 'var(--mg-success-700)' : 'var(--mg-error-700)'
                                    }}>
                                        { code.isActive ? '활성' : '비활성' }
                                    </span>
                                </div>
                                {code.codeDescription && (
                                    <div className="mg-v2-code-description-container">
                                        <p className="mg-v2-code-description">
                                            { code.codeDescription }
                                        </p>
                                    </div>
                                )}
                                <div className="mg-v2-code-card-footer">
                                    <span className="mg-v2-sort-order">
                                        정렬: { code.sortOrder }
                                    </span>
                                    <div className="mg-v2-code-actions">
                                        <button 
                                            style={{
                                                padding: '6px 10px',
                                                border: '2px solid var(--mg-primary-500)',
                                                borderRadius: '6px',
                                                backgroundColor: 'transparent',
                                                color: 'var(--mg-primary-500)',
                                                fontSize: 'var(--font-size-xs)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onClick={ () => handleEditCode(code) }
                                            title="수정"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            style={{
                                                padding: '6px 10px',
                                                border: `2px solid ${code.isActive ? 'var(--mg-warning-500)' : 'var(--mg-success-500)'}`,
                                                borderRadius: '6px',
                                                backgroundColor: 'transparent',
                                                color: code.isActive ? 'var(--mg-warning-500)' : 'var(--mg-success-500)',
                                                fontSize: 'var(--font-size-xs)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onClick={ () => handleToggleStatus(code.id, code.isActive) }
                                            title={ code.isActive ? '비활성화' : '활성화' }
                                        >
                                            { code.isActive ? '⏸️' : '▶️' }
                                        </button>
                                        <button 
                                            style={{
                                                padding: '6px 10px',
                                                border: '2px solid var(--mg-error-500)',
                                                borderRadius: '6px',
                                                backgroundColor: 'transparent',
                                                color: 'var(--mg-error-500)',
                                                fontSize: 'var(--font-size-xs)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onClick={ () => handleDeleteCode(code.id) }
                                            title="삭제"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <AdminCommonLayout>
            <div className="improved-common-code-management">
            <div className="page-header">
            </div>

                <div className="mg-step-indicator improved-common-code-step-wrapper">
                    <div className={ `step ${currentStep === 1 ? 'active' : 'completed' }`}>
                        <div className="step-number">1</div>
                        <div className="step-label">그룹 선택</div>
                    </div>
                    <div className="step-line"></div>
                    <div className={ `step ${currentStep === 2 ? 'active' : '' }`}>
                        <div className="step-number">2</div>
                        <div className="step-label">코드 관리</div>
                    </div>
                </div>

                { currentStep === 1 ? renderGroupSelection() : renderCodeManagement() }
            </div>
        </AdminCommonLayout>
    );
};

export default CommonCodeManagement;