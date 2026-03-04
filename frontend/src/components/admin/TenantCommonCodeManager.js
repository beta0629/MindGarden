/**
 * 테넌트 공통코드 관리 컨테이너 (Container Component)
 * 
 * 비즈니스 로직 담당:
/**
 * - API 호출
/**
 * - 상태 관리
/**
 * - 이벤트 핸들러
/**
 * 
/**
 * UI 렌더링은 TenantCommonCodeManagerUI에 위임
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0
/**
 * @since 2025-12-03
 */

import React, { useState, useEffect } from 'react';
import {
    getTenantCodeGroups,
    getTenantCodesByGroup,
    createTenantCode,
    updateTenantCode,
    deleteTenantCode,
    toggleTenantCodeActive,
    createConsultationPackage
} from '../../utils/tenantCommonCodeApi';
import { getCodeGroupKoreanNameSync, loadCodeGroupMetadata } from '../../utils/codeHelper';
import notificationManager from '../../utils/notification';
import TenantCommonCodeManagerUI from '../ui/TenantCommonCodeManagerUI';

const TenantCommonCodeManager = () => {
    const [codeGroups, setCodeGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
    const [currentCode, setCurrentCode] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        codeGroup: '',
        codeValue: '',
        codeLabel: '',
        koreanName: '',
        codeDescription: '',
        sortOrder: 0,
        isActive: true,
        extraData: ''
    });

    // 초기 로드: 코드 그룹 목록 조회
    useEffect(() => {
        const init = async () => {
            await loadCodeGroupMetadata();
            loadCodeGroups();
        };
        init();
    }, []);

    // 선택된 그룹 변경 시 코드 목록 조회
    useEffect(() => {
        if (selectedGroup) {
            loadCodes(selectedGroup.groupName);
        }
    }, [selectedGroup]);

/**
     * 코드 그룹 목록 로드
     */
    const loadCodeGroups = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getTenantCodeGroups();
            if (response.success) {
                setCodeGroups(response.data || []);
            } else {
                setError(response.message || '코드 그룹 조회 실패');
            }
        } catch (err) {
            console.error('코드 그룹 조회 오류:', err);
            setError('코드 그룹을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

/**
     * 특정 그룹의 코드 목록 로드
     */
    const loadCodes = async (groupName) => {
        try {
            setLoading(true);
            setError(null);
            const response = await getTenantCodesByGroup(groupName);
            if (response.success) {
                setCodes(response.data || []);
            } else {
                setError(response.message || '코드 조회 실패');
            }
        } catch (err) {
            console.error('코드 조회 오류:', err);
            setError('코드를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

/**
     * 그룹 선택
     */
    const handleGroupSelect = (group) => {
        setSelectedGroup(group);
        setCodes([]);
        setError(null);
    };

/**
     * 코드 생성 모달 열기
     */
    const handleCreateCode = () => {
        setModalMode('create');
        setCurrentCode(null);
        setFormData({
            codeGroup: selectedGroup?.groupName || '',
            codeValue: '',
            codeLabel: '',
            koreanName: '',
            codeDescription: '',
            sortOrder: codes.length,
            isActive: true,
            extraData: ''
        });
        setShowModal(true);
    };

/**
     * 코드 수정 모달 열기
     */
    const handleEditCode = (code) => {
        setModalMode('edit');
        setCurrentCode(code);
        setFormData({
            codeGroup: code.codeGroup,
            codeValue: code.codeValue,
            codeLabel: code.codeLabel,
            koreanName: code.koreanName || code.codeLabel,
            codeDescription: code.codeDescription || '',
            sortOrder: code.sortOrder || 0,
            isActive: code.isActive !== false,
            extraData: code.extraData || ''
        });
        setShowModal(true);
    };

/**
     * 폼 제출
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            setError(null);

            let response;
            if (modalMode === 'create') {
                response = await createTenantCode(formData);
            } else {
                response = await updateTenantCode(currentCode.id, formData);
            }

            if (response.success) {
                setShowModal(false);
                loadCodes(selectedGroup.groupName);
                notificationManager.success(modalMode === 'create' ? '코드가 생성되었습니다.' : '코드가 수정되었습니다.');
            } else {
                setError(response.message || '작업 실패');
            }
        } catch (err) {
            console.error('코드 저장 오류:', err);
            setError('코드 저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

/**
     * 코드 삭제
     */
    const handleDeleteCode = async (codeId) => {
        const confirmed = await new Promise((resolve) => {
            notificationManager.confirm('정말 삭제하시겠습니까?', resolve);
        });
        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await deleteTenantCode(codeId);
            if (response.success) {
                loadCodes(selectedGroup.groupName);
                notificationManager.success('코드가 삭제되었습니다.');
            } else {
                setError(response.message || '삭제 실패');
            }
        } catch (err) {
            console.error('코드 삭제 오류:', err);
            setError('코드 삭제 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

/**
     * 코드 활성화/비활성화 토글
     */
    const handleToggleActive = async (codeId, isActive) => {
        try {
            setLoading(true);
            setError(null);
            const response = await toggleTenantCodeActive(codeId, !isActive);
            if (response.success) {
                loadCodes(selectedGroup.groupName);
            } else {
                setError(response.message || '상태 변경 실패');
            }
        } catch (err) {
            console.error('상태 변경 오류:', err);
            setError('상태 변경 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

/**
     * 상담 패키지 빠른 생성
     */
    const handleQuickCreatePackage = () => {
        const packageName = prompt('패키지명을 입력하세요:');
        if (!packageName) return;

        const price = prompt('금액을 입력하세요 (원):');
        if (!price) return;

        const sessions = prompt('회기 수를 입력하세요:');
        if (!sessions) return;

        createConsultationPackage({
            packageName,
            price: parseInt(price, 10),
            duration: 50,
            sessions: parseInt(sessions, 10),
            description: `${packageName} (${sessions}회기)`
        })
            .then(response => {
                if (response.success) {
                    loadCodes('CONSULTATION_PACKAGE');
                    notificationManager.success('상담 패키지가 생성되었습니다.');
                } else {
                    notificationManager.error('생성 실패: ' + response.message);
                }
            })
            .catch(err => {
                console.error('패키지 생성 오류:', err);
                notificationManager.error('패키지 생성 중 오류가 발생했습니다.');
            });
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
            'ASSESSMENT_TYPE': '평가유형',
            
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
            'PRIORITY_LEVEL': '우선순위레벨'
        };
        
        return koreanMappings[groupName] || groupName;
    };

    const getFilteredCodeGroups = () => {
        let filtered = codeGroups;

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(group => {
                const groupName = group.groupName || group;
                const originalKoreanName = group.koreanName || '';
                const helperKoreanName = getCodeGroupKoreanNameSync(groupName);
                const convertedKorean = convertGroupNameToKorean(groupName);
                
                const groupMatch = groupName.toLowerCase().includes(searchLower);
                const originalMatch = originalKoreanName.toLowerCase().includes(searchLower);
                const helperMatch = helperKoreanName.toLowerCase().includes(searchLower);
                const convertedMatch = convertedKorean.toLowerCase().includes(searchLower);
                
                return groupMatch || originalMatch || helperMatch || convertedMatch;
            });
        }

        // Map the names so UI component doesn't have to
        return filtered.map(group => {
            const groupName = group.groupName || group;
            
            let displayKoreanName = group.koreanName;
            if (!displayKoreanName) {
                const helperName = getCodeGroupKoreanNameSync(groupName);
                if (helperName && helperName !== groupName) {
                    displayKoreanName = helperName;
                } else {
                    displayKoreanName = convertGroupNameToKorean(groupName);
                }
            }

            return {
                ...group,
                displayKoreanName
            };
        });
    };

    return (
        <TenantCommonCodeManagerUI
            // 데이터
            codeGroups={getFilteredCodeGroups()}
            selectedGroup={selectedGroup ? {
                ...selectedGroup,
                displayKoreanName: getCodeGroupKoreanNameSync(selectedGroup.groupName || selectedGroup) || convertGroupNameToKorean(selectedGroup.groupName || selectedGroup)
            } : null}
            searchTerm={searchTerm}
            codes={codes}
            loading={loading}
            error={error}
            showModal={showModal}
            modalMode={modalMode}
            formData={formData}
            
            // 이벤트 핸들러
            onSearchChange={setSearchTerm}
            onGroupSelect={handleGroupSelect}
            onCreateCode={handleCreateCode}
            onEditCode={handleEditCode}
            onDeleteCode={handleDeleteCode}
            onToggleActive={handleToggleActive}
            onQuickCreatePackage={handleQuickCreatePackage}
            onFormChange={setFormData}
            onFormSubmit={handleSubmit}
            onModalClose={() => setShowModal(false)}
        />
    );
};

export default TenantCommonCodeManager;

