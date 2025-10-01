import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
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
import SimpleLayout from '../layout/SimpleLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import './ImprovedCommonCodeManagement.css';

/**
 * 개선된 공통코드 관리 컴포넌트
 * - 2단계 구조: 코드그룹 선택 → 코드 목록 관리
 * - 직관적인 UI/UX 제공
 * - 관리자 친화적 인터페이스
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-09-13
 */
const CommonCodeManagement = () => {
    // 세션 정보
    const { user } = useSession();
    
    // 권한 체크 함수들
    const hasErpCodePermission = () => {
        return user?.role === 'BRANCH_SUPER_ADMIN' || 
               user?.role === 'HQ_MASTER';
    };
    
    const hasFinancialCodePermission = () => {
        return user?.role === 'BRANCH_SUPER_ADMIN' || 
               user?.role === 'HQ_MASTER';
    };
    
    const hasHqCodePermission = () => {
        return user?.role === 'HQ_MASTER' || 
               user?.role === 'SUPER_HQ_ADMIN' ||
               user?.role === 'HQ_ADMIN';
    };
    
    const hasBranchCodePermission = () => {
        return user?.role === 'BRANCH_SUPER_ADMIN' || 
               user?.role === 'HQ_MASTER';
    };
    
    const hasGeneralCodePermission = () => {
        return user?.role === 'ADMIN' || 
               user?.role === 'BRANCH_SUPER_ADMIN' || 
               user?.role === 'HQ_MASTER' || 
               user?.role === 'SUPER_HQ_ADMIN' ||
               user?.role === 'HQ_ADMIN';
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
    
    // 상태 관리
    const [currentStep, setCurrentStep] = useState(1); // 1: 그룹 선택, 2: 코드 관리
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [codeGroups, setCodeGroups] = useState([]);
    const [groupCodes, setGroupCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCode, setEditingCode] = useState(null);

    // 코드그룹 메타데이터 상태
    const [groupMetadata, setGroupMetadata] = useState([]);
    const [metadataLoaded, setMetadataLoaded] = useState(false);
    
    // 필터 상태
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // 코드그룹 메타데이터 로드
    const loadMetadata = useCallback(async () => {
        try {
            // 캐시 초기화 후 새 데이터 로드
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

    // 동적 코드그룹 한글명 조회
    const getGroupKoreanName = useCallback((groupName) => {
        return getCodeGroupKoreanNameSync(groupName);
    }, []);

    // 동적 코드그룹 아이콘 조회
    const getGroupIcon = useCallback((groupName) => {
        return getCodeGroupIconSync(groupName);
    }, []);

    // 새 코드 폼 데이터
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

    // 코드그룹 목록 로드
    const loadCodeGroups = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiGet('/api/common-codes/groups/list');
            if (response && response.length > 0) {
                // 권한에 따라 코드 그룹 필터링
                const filteredGroups = response.filter(groupCode => {
                    return hasCodeGroupPermission(groupCode);
                });
                setCodeGroups(filteredGroups);
            } else {
                notificationManager.error('코드그룹 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('코드그룹 로드 오류:', error);
            notificationManager.error('코드그룹 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [user?.role]);

    // 특정 그룹의 코드 목록 로드
    const loadGroupCodes = useCallback(async (groupName) => {
        try {
            setLoading(true);
            const response = await apiGet(`/api/common-codes/group/${groupName}`);
            if (response && response.length > 0) {
                setGroupCodes(response);
            } else {
                notificationManager.error(`${groupName} 그룹의 코드 목록을 불러오는데 실패했습니다.`);
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

    // 코드그룹 선택
    const handleGroupSelect = (group) => {
        // 권한 체크
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

    // 그룹 선택으로 돌아가기
    const handleBackToGroups = () => {
        setCurrentStep(1);
        setSelectedGroup(null);
        setGroupCodes([]);
        setShowAddForm(false);
        setEditingCode(null);
    };

    // 필터링된 코드 그룹 반환
    const getFilteredCodeGroups = () => {
        let filtered = codeGroups;

        // 검색어 필터링 (그룹명, 한글명, 변환된 한글명)
        if (searchTerm) {
            filtered = filtered.filter(group => {
                const koreanName = getCodeGroupKoreanNameSync(group);
                const convertedKorean = convertGroupNameToKorean(group);
                const searchLower = searchTerm.toLowerCase();
                
                // 영문 그룹명 검색
                const groupMatch = group.toLowerCase().includes(searchLower);
                
                // 메타데이터 한글명 검색
                const koreanMatch = koreanName.toLowerCase().includes(searchLower);
                
                // 변환된 한글명 검색
                const convertedMatch = convertedKorean.toLowerCase().includes(searchLower);
                
                return groupMatch || koreanMatch || convertedMatch;
            });
        }

        // 카테고리 필터링 (메타데이터 기반)
        if (categoryFilter !== 'all' && groupMetadata.length > 0) {
            filtered = filtered.filter(group => {
                const metadata = groupMetadata.find(m => m.groupName === group);
                if (!metadata) return false;
                
                // 카테고리별 필터링 로직
                switch (categoryFilter) {
                    case 'user':
                        return group.includes('USER') || group.includes('CLIENT') || group.includes('CONSULTANT');
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

    // 코드 그룹명을 한글로 변환하는 함수 (fallback용)
    const convertGroupNameToKorean = (groupName) => {
        const koreanMappings = {
            // 사용자 관련
            'USER_ROLE': '사용자역할',
            'USER_STATUS': '사용자상태',
            'USER_GRADE': '사용자등급',
            'CONSULTANT_GRADE': '상담사등급',
            'CLIENT_STATUS': '내담자상태',
            'GENDER': '성별',
            'RESPONSIBILITY': '담당분야',
            'SPECIALTY': '전문분야',
            
            // 시스템 관련
            'STATUS': '상태',
            'PRIORITY': '우선순위',
            'MAPPING_STATUS': '매핑상태',
            'ROLE': '역할',
            'PERMISSION': '권한',
            'ROLE_PERMISSION': '역할권한',
            
            // 결제/급여 관련
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
            
            // 상담 관련
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
            
            // ERP 관련
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
            
            // 휴가 관련
            'VACATION_TYPE': '휴가유형',
            'VACATION_STATUS': '휴가상태',
            
            // 보고서 관련
            'REPORT_PERIOD': '보고서기간',
            'YEAR_RANGE': '년도범위',
            'MONTH_RANGE': '월범위',
            'DATE_RANGE': '날짜범위',
            'DATE_RANGE_FILTER': '날짜범위필터',
            'CHART_TYPE_FILTER': '차트유형필터',
            
            // 메뉴 관련
            'MENU': '메뉴',
            'MENU_CATEGORY': '메뉴카테고리',
            'ADMIN_MENU': '관리자메뉴',
            'CLIENT_MENU': '내담자메뉴',
            'CONSULTANT_MENU': '상담사메뉴',
            'HQ_ADMIN_MENU': '본사관리자메뉴',
            'BRANCH_SUPER_ADMIN_MENU': '지점수퍼관리자메뉴',
            'COMMON_MENU': '공통메뉴',
            
            // 기타
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
            'COMMON_CODE_GROUP': '공통코드그룹',
            'PRIORITY_LEVEL': '우선순위레벨'
        };
        
        return koreanMappings[groupName] || groupName;
    };

    // 카테고리명 반환
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

    // 새 코드 추가
    const handleAddCode = async (e) => {
        e.preventDefault();
        
        if (!newCodeData.codeValue.trim() || !newCodeData.codeLabel.trim()) {
            notificationManager.error('코드 값과 라벨은 필수입니다.');
            return;
        }

        try {
            setLoading(true);
            const response = await apiPost(`/api/admin/common-codes?userRole=${user?.role || ''}`, {
                ...newCodeData,
                codeGroup: selectedGroup
            });

            if (response.success) {
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
                notificationManager.error(response.message || '코드 추가에 실패했습니다.');
            }
        } catch (error) {
            console.error('코드 추가 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error('해당 코드 그룹에 대한 생성 권한이 없습니다.');
            } else {
                notificationManager.error('코드 추가에 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    // 코드 삭제
    const handleDeleteCode = async (codeId) => {
        if (!window.confirm('정말로 이 코드를 삭제하시겠습니까?')) {
            return;
        }

        try {
            setLoading(true);
            const response = await apiDelete(`/api/common-codes/${codeId}`);
            
            if (response.success) {
                notificationManager.success('코드가 삭제되었습니다!');
                loadGroupCodes(selectedGroup);
            } else {
                notificationManager.error(response.message || '코드 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('코드 삭제 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error('해당 코드 그룹에 대한 삭제 권한이 없습니다.');
            } else {
                notificationManager.error('코드 삭제에 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    // 코드 상태 토글
    const handleToggleStatus = async (codeId, currentStatus) => {
        try {
            setLoading(true);
            const response = await apiPost(`/api/common-codes/${codeId}/toggle-status`);
            
            if (response.success) {
                notificationManager.success('코드 상태가 변경되었습니다!');
                loadGroupCodes(selectedGroup);
            } else {
                notificationManager.error(response.message || '코드 상태 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('코드 상태 토글 오류:', error);
            if (error.response?.status === 403) {
                notificationManager.error('해당 코드 그룹에 대한 상태 변경 권한이 없습니다.');
            } else {
                notificationManager.error('코드 상태 변경에 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    // 코드 수정
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

    // 코드 업데이트
    const handleUpdateCode = async (e) => {
        e.preventDefault();
        
        if (!newCodeData.codeValue.trim() || !newCodeData.codeLabel.trim()) {
            notificationManager.error('코드 값과 라벨은 필수입니다.');
            return;
        }

        try {
            setLoading(true);
            const response = await apiPut(`/api/common-codes/${editingCode.id}`, newCodeData);

            if (response.success) {
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
            } else {
                notificationManager.error(response.message || '코드 수정에 실패했습니다.');
            }
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

    // 폼 취소
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

    // 초기 로드
    useEffect(() => {
        loadMetadata();
        loadCodeGroups();
    }, [loadMetadata, loadCodeGroups]);

    // 1단계: 코드그룹 선택 화면
    const renderGroupSelection = () => (
        <div className="group-selection">
            <div className="step-header">
                <h2>📋 코드그룹 선택</h2>
                <p>관리하고자 하는 코드그룹을 선택하세요.</p>
            </div>

            {/* 필터 UI */}
            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '15px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginBottom: '15px'
                }}>
                    {/* 검색 입력 */}
                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <input
                            type="text"
                            placeholder="코드그룹명, 한글명, 영문명으로 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 40px 10px 12px',
                                border: '2px solid #e1e5e9',
                                borderRadius: '8px',
                                fontSize: 'var(--font-size-sm)',
                                outline: 'none',
                                transition: 'border-color 0.2s ease',
                                backgroundColor: '#f8f9fa'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#007bff'}
                            onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                        />
                        <i className="bi bi-search" style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#6c757d',
                            fontSize: 'var(--font-size-base)'
                        }}></i>
                    </div>
                    
                    {/* 카테고리 필터 */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        style={{
                            padding: '10px 12px',
                            border: '2px solid #e1e5e9',
                            borderRadius: '8px',
                            fontSize: 'var(--font-size-sm)',
                            backgroundColor: '#f8f9fa',
                            minWidth: '150px',
                            outline: 'none',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#007bff'}
                        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                    >
                        <option value="all">전체 카테고리</option>
                        <option value="user">사용자 관련</option>
                        <option value="system">시스템 관련</option>
                        <option value="payment">결제/급여</option>
                        <option value="consultation">상담 관련</option>
                        <option value="erp">ERP 관련</option>
                    </select>
                    
                    {/* 필터 초기화 */}
                    {(searchTerm || categoryFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setCategoryFilter('all');
                            }}
                            style={{
                                padding: '10px 16px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: 'var(--font-size-sm)',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                        >
                            <i className="bi bi-x-circle"></i>
                            초기화
                        </button>
                    )}
                </div>
                
                {/* 필터 상태 표시 */}
                <div style={{
                            fontSize: 'var(--font-size-sm)',
                    color: '#6c757d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <i className="bi bi-info-circle"></i>
                    {searchTerm || categoryFilter !== 'all' ? (
                        <span>
                            검색 결과: <strong>{getFilteredCodeGroups().length}개</strong>
                            {searchTerm && ` (검색어: "${searchTerm}")`}
                            {categoryFilter !== 'all' && ` (카테고리: ${getCategoryName(categoryFilter)})`}
                        </span>
                    ) : (
                        <span>
                            전체 <strong>{codeGroups.length}개</strong> 코드그룹
                        </span>
                    )}
                </div>
            </div>

            {loading ? (
                <LoadingSpinner text="코드그룹을 불러오는 중..." size="medium" />
            ) : (
                <div className="group-cards">
                    {getFilteredCodeGroups().map((group, index) => (
                        <div 
                            key={group} 
                            className="group-card"
                            onClick={() => handleGroupSelect(group)}
                        >
                            <div className="group-card-header">
                                <div className="group-icon">{getGroupIcon(group)}</div>
                                <h3>{getGroupKoreanName(group) || convertGroupNameToKorean(group)}</h3>
                                <span className="group-code">{group}</span>
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

    // 2단계: 코드 관리 화면
    const renderCodeManagement = () => (
        <div className="code-management">
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '32px',
                padding: '24px',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                flexWrap: 'wrap',
                gap: '16px',
                minHeight: '80px'
            }}>
                <button 
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        border: '2px solid #6c757d',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        color: '#6c757d',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        whiteSpace: 'nowrap'
                    }}
                    onClick={handleBackToGroups}
                >
                    ← 그룹 선택으로 돌아가기
                </button>
                <div style={{
                    flex: 1,
                    minWidth: 0,
                    margin: '0 16px'
                }}>
                    <h2 style={{
                        color: '#2c3e50',
                        margin: '0 0 4px 0',
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: '600',
                        lineHeight: '1.3'
                    }}>
                        📁 {getGroupKoreanName(selectedGroup) || convertGroupNameToKorean(selectedGroup)} 그룹 관리
                    </h2>
                    <p style={{
                        color: '#6c757d',
                        margin: '0',
                        fontSize: 'var(--font-size-sm)',
                        lineHeight: '1.4'
                    }}>
                        {selectedGroup} - 코드를 추가, 수정, 삭제할 수 있습니다.
                    </p>
                </div>
                <button 
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        whiteSpace: 'nowrap'
                    }}
                    onClick={() => setShowAddForm(true)}
                    disabled={loading}
                >
                    + 새 코드 추가
                </button>
            </div>

            {showAddForm && (
                <div className="add-code-form">
                    <div className="form-header">
                        <h3>{editingCode ? '코드 수정' : '새 코드 추가'}</h3>
                        <button 
                            className="mg-btn mg-btn--sm mg-btn--outline mg-btn--secondary"
                            onClick={handleCancelForm}
                        >
                            <i className="bi bi-x"></i>
                        </button>
                    </div>
                    <form onSubmit={editingCode ? handleUpdateCode : handleAddCode}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="codeValue">코드 값 *</label>
                                <input
                                    type="text"
                                    id="codeValue"
                                    value={newCodeData.codeValue}
                                    onChange={(e) => setNewCodeData({...newCodeData, codeValue: e.target.value})}
                                    className="form-control"
                                    placeholder="예: ACTIVE, INACTIVE"
                                    required
                                    style={{
                                        color: '#000',
                                        backgroundColor: '#fff',
                                        border: '2px solid #e9ecef'
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="codeLabel">코드 라벨 *</label>
                                <input
                                    type="text"
                                    id="codeLabel"
                                    value={newCodeData.codeLabel}
                                    onChange={(e) => setNewCodeData({...newCodeData, codeLabel: e.target.value})}
                                    className="form-control"
                                    placeholder="예: 활성, 비활성"
                                    required
                                    style={{
                                        color: '#000',
                                        backgroundColor: '#fff',
                                        border: '2px solid #e9ecef'
                                    }}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="codeDescription">설명</label>
                            <textarea
                                id="codeDescription"
                                value={newCodeData.codeDescription}
                                onChange={(e) => setNewCodeData({...newCodeData, codeDescription: e.target.value})}
                                className="form-control"
                                rows="3"
                                placeholder="코드에 대한 설명을 입력하세요."
                                style={{
                                    color: '#000',
                                    backgroundColor: '#fff',
                                    border: '2px solid #e9ecef'
                                }}
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="sortOrder">정렬 순서</label>
                                <input
                                    type="number"
                                    id="sortOrder"
                                    value={newCodeData.sortOrder}
                                    onChange={(e) => setNewCodeData({...newCodeData, sortOrder: parseInt(e.target.value) || 0})}
                                    className="form-control"
                                    min="0"
                                    style={{
                                        color: '#000',
                                        backgroundColor: '#fff',
                                        border: '2px solid #e9ecef'
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={newCodeData.isActive}
                                        onChange={(e) => setNewCodeData({...newCodeData, isActive: e.target.checked})}
                                    />
                                    <span>활성 상태</span>
                                </label>
                            </div>
                        </div>
                        <div className="form-actions">
                            <button 
                                type="button" 
                                className="btn btn-outline-secondary"
                                onClick={handleCancelForm}
                            >
                                취소
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {editingCode ? '수정' : '추가'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="codes-list">
                {loading ? (
                    <LoadingSpinner text="코드 목록을 불러오는 중..." size="medium" />
                ) : groupCodes.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <h3>코드가 없습니다</h3>
                        <p>새로운 코드를 추가해보세요.</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '16px'
                    }}>
                        {groupCodes.map((code) => (
                            <div 
                                key={code.id} 
                                style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    border: '2px solid #e9ecef',
                                    transition: 'all 0.3s ease',
                                    opacity: !code.isActive ? 0.6 : 1
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '12px'
                                }}>
                                    <div>
                                        <h4 style={{
                                            color: '#2c3e50',
                                            margin: '0 0 4px 0',
                                            fontSize: 'var(--font-size-base)',
                                            fontWeight: '600'
                                        }}>
                                            {code.codeLabel}
                                        </h4>
                                        <span style={{
                                            color: '#6c757d',
                                            fontSize: 'var(--font-size-xs)',
                                            background: '#e9ecef',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontFamily: 'monospace'
                                        }}>
                                            {code.codeValue}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: 'var(--font-size-xs)',
                                        fontWeight: '500',
                                        backgroundColor: code.isActive ? '#d4edda' : '#f8d7da',
                                        color: code.isActive ? '#155724' : '#721c24'
                                    }}>
                                        {code.isActive ? '활성' : '비활성'}
                                    </span>
                                </div>
                                {code.codeDescription && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <p style={{
                                            color: '#6c757d',
                                            margin: '0',
                                            fontSize: 'var(--font-size-sm)',
                                            lineHeight: '1.4'
                                        }}>
                                            {code.codeDescription}
                                        </p>
                                    </div>
                                )}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <span style={{
                                        color: '#6c757d',
                                        fontSize: 'var(--font-size-xs)'
                                    }}>
                                        정렬: {code.sortOrder}
                                    </span>
                                    <div style={{
                                        display: 'flex',
                                        gap: '6px'
                                    }}>
                                        <button 
                                            style={{
                                                padding: '6px 10px',
                                                border: '2px solid #007bff',
                                                borderRadius: '6px',
                                                backgroundColor: 'transparent',
                                                color: '#007bff',
                                                fontSize: 'var(--font-size-xs)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onClick={() => handleEditCode(code)}
                                            title="수정"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            style={{
                                                padding: '6px 10px',
                                                border: `2px solid ${code.isActive ? '#ffc107' : '#28a745'}`,
                                                borderRadius: '6px',
                                                backgroundColor: 'transparent',
                                                color: code.isActive ? '#ffc107' : '#28a745',
                                                fontSize: 'var(--font-size-xs)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onClick={() => handleToggleStatus(code.id, code.isActive)}
                                            title={code.isActive ? '비활성화' : '활성화'}
                                        >
                                            {code.isActive ? '⏸️' : '▶️'}
                                        </button>
                                        <button 
                                            style={{
                                                padding: '6px 10px',
                                                border: '2px solid #dc3545',
                                                borderRadius: '6px',
                                                backgroundColor: 'transparent',
                                                color: '#dc3545',
                                                fontSize: 'var(--font-size-xs)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onClick={() => handleDeleteCode(code.id)}
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
        <SimpleLayout>
            <div className="improved-common-code-management">
            <div className="page-header">
                    <h1>📋 공통코드 관리</h1>
                    <p>시스템에서 사용되는 공통코드를 직관적으로 관리합니다.</p>
            </div>

                <div className="step-indicator">
                    <div className={`step ${currentStep === 1 ? 'active' : 'completed'}`}>
                        <div className="step-number">1</div>
                        <div className="step-label">그룹 선택</div>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step ${currentStep === 2 ? 'active' : ''}`}>
                        <div className="step-number">2</div>
                        <div className="step-label">코드 관리</div>
                    </div>
                </div>

                {currentStep === 1 ? renderGroupSelection() : renderCodeManagement()}
            </div>
        </SimpleLayout>
    );
};

export default CommonCodeManagement;