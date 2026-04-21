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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
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
import {
    getParentCodeGroupForSubcategory,
    isSubcategoryCodeGroup
} from '../../utils/commonCodeParentGroups';
import { toDisplayString } from '../../utils/safeDisplay';
import {
    TENANT_COMMON_CODE_GROUP_KO_FALLBACK,
    TENANT_COMMON_CODE_MSG,
    TENANT_COMMON_CODE_UI,
    formatTenantCommonCodeCreateFailure,
    formatTenantCommonCodeQuickPackageDescription
} from '../../constants/tenantCommonCodeManagerStrings';

const TENANT_COMMON_CODE_TITLE_ID = 'tenant-common-code-title';

const TenantCommonCodeManager = () => {
    const [, setSearchParams] = useSearchParams();
    const urlGroupInitialisedRef = useRef(false);
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
        extraData: '',
        parentCodeGroup: '',
        parentCodeValue: ''
    });
    const [parentCategoryOptions, setParentCategoryOptions] = useState([]);
    const [parentOptionsLoading, setParentOptionsLoading] = useState(false);

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
            console.error(TENANT_COMMON_CODE_MSG.LOG_PARENT_OPTIONS_LOAD, err);
            setParentCategoryOptions([]);
        } finally {
            setParentOptionsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!selectedGroup) {
            setParentCategoryOptions([]);
            return;
        }
        const gn = selectedGroup.groupName || selectedGroup;
        if (!isSubcategoryCodeGroup(gn)) {
            setParentCategoryOptions([]);
            return;
        }
        loadParentCategoryOptions(gn);
    }, [selectedGroup, loadParentCategoryOptions]);

/**
     * 코드 그룹 목록 로드
     */
    const loadCodeGroups = useCallback(async() => {
        try {
            setLoading(true);
            setError(null);
            const response = await getTenantCodeGroups();
            if (response.success) {
                const groups = response.data || [];
                setCodeGroups(groups);
                const q = new URLSearchParams(window.location.search).get('group');
                if (q && !urlGroupInitialisedRef.current) {
                    const hit = groups.find((g) => (g.groupName || g) === q);
                    if (hit) {
                        setSelectedGroup(hit);
                        urlGroupInitialisedRef.current = true;
                    }
                }
            } else {
                setError(response.message || TENANT_COMMON_CODE_MSG.ERR_CODE_GROUPS_FETCH_FALLBACK);
            }
        } catch (err) {
            console.error(TENANT_COMMON_CODE_MSG.LOG_CODE_GROUPS_FETCH, err);
            setError(TENANT_COMMON_CODE_MSG.ERR_CODE_GROUPS_LOAD);
        } finally {
            setLoading(false);
        }
    }, []);

    // 초기 로드: 코드 그룹 목록 조회
    useEffect(() => {
        const init = async() => {
            await loadCodeGroupMetadata();
            loadCodeGroups();
        };
        init();
    }, [loadCodeGroups]);

    // 선택된 그룹 변경 시 코드 목록 조회
    useEffect(() => {
        if (selectedGroup) {
            loadCodes(selectedGroup.groupName);
        }
    }, [selectedGroup]);

/**
     * 특정 그룹의 코드 목록 로드
     */
    const loadCodes = async(groupName) => {
        try {
            setLoading(true);
            setError(null);
            const response = await getTenantCodesByGroup(groupName);
            if (response.success) {
                setCodes(response.data || []);
            } else {
                setError(response.message || TENANT_COMMON_CODE_MSG.ERR_CODES_FETCH_FALLBACK);
            }
        } catch (err) {
            console.error(TENANT_COMMON_CODE_MSG.LOG_CODES_FETCH, err);
            setError(TENANT_COMMON_CODE_MSG.ERR_CODES_LOAD);
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
        const gn = group?.groupName || group;
        if (gn) {
            setSearchParams({ group: gn }, { replace: true });
        } else {
            setSearchParams({}, { replace: true });
        }
    };

/**
     * 코드 생성 모달 열기
     */
    const handleCreateCode = () => {
        setModalMode('create');
        setCurrentCode(null);
        const gn = selectedGroup?.groupName || '';
        const pg = getParentCodeGroupForSubcategory(gn) || '';
        setFormData({
            codeGroup: gn,
            codeValue: '',
            codeLabel: '',
            koreanName: '',
            codeDescription: '',
            sortOrder: codes.length,
            isActive: true,
            extraData: '',
            parentCodeGroup: pg,
            parentCodeValue: ''
        });
        setShowModal(true);
    };

/**
     * 코드 수정 모달 열기
     */
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

/**
     * 폼 제출
     */
    const handleSubmit = async(e) => {
        e.preventDefault();
        
        const gn = selectedGroup?.groupName || selectedGroup;
        if (isSubcategoryCodeGroup(gn)) {
            if (!formData.parentCodeValue || !String(formData.parentCodeValue).trim()) {
                notificationManager.error(TENANT_COMMON_CODE_MSG.ERR_SELECT_PARENT_CATEGORY);
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

            let response;
            if (modalMode === 'create') {
                response = await createTenantCode(payload);
            } else {
                response = await updateTenantCode(currentCode.id, payload);
            }

            if (response.success) {
                setShowModal(false);
                loadCodes(selectedGroup.groupName);
                notificationManager.success(modalMode === 'create'
                    ? TENANT_COMMON_CODE_MSG.SUCCESS_CODE_CREATED
                    : TENANT_COMMON_CODE_MSG.SUCCESS_CODE_UPDATED);
            } else {
                setError(response.message || TENANT_COMMON_CODE_MSG.ERR_OPERATION_FALLBACK);
            }
        } catch (err) {
            console.error(TENANT_COMMON_CODE_MSG.LOG_CODE_SAVE, err);
            setError(TENANT_COMMON_CODE_MSG.ERR_CODE_SAVE);
        } finally {
            setLoading(false);
        }
    };

/**
     * 코드 삭제
     */
    const handleDeleteCode = async(codeId) => {
        const confirmed = await new Promise((resolve) => {
            notificationManager.confirm(TENANT_COMMON_CODE_MSG.CONFIRM_DELETE, resolve);
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
                notificationManager.success(TENANT_COMMON_CODE_MSG.SUCCESS_CODE_DELETED);
            } else {
                setError(response.message || TENANT_COMMON_CODE_MSG.ERR_DELETE_FALLBACK);
            }
        } catch (err) {
            console.error(TENANT_COMMON_CODE_MSG.LOG_CODE_DELETE, err);
            setError(TENANT_COMMON_CODE_MSG.ERR_CODE_DELETE);
        } finally {
            setLoading(false);
        }
    };

/**
     * 코드 활성화/비활성화 토글
     */
    const handleToggleActive = async(codeId, isActive) => {
        try {
            setLoading(true);
            setError(null);
            const response = await toggleTenantCodeActive(codeId, !isActive);
            if (response.success) {
                loadCodes(selectedGroup.groupName);
            } else {
                setError(response.message || TENANT_COMMON_CODE_MSG.ERR_TOGGLE_FALLBACK);
            }
        } catch (err) {
            console.error(TENANT_COMMON_CODE_MSG.LOG_TOGGLE, err);
            setError(TENANT_COMMON_CODE_MSG.ERR_TOGGLE);
        } finally {
            setLoading(false);
        }
    };

/**
     * 상담 패키지 빠른 생성
     */
    const handleQuickCreatePackage = () => {
        const packageName = prompt(TENANT_COMMON_CODE_MSG.PROMPT_PACKAGE_NAME);
        if (!packageName) return;

        const price = prompt(TENANT_COMMON_CODE_MSG.PROMPT_PRICE_WON);
        if (!price) return;

        const sessions = prompt(TENANT_COMMON_CODE_MSG.PROMPT_SESSIONS);
        if (!sessions) return;

        createConsultationPackage({
            packageName,
            price: parseInt(price, 10),
            duration: 50,
            sessions: parseInt(sessions, 10),
            description: formatTenantCommonCodeQuickPackageDescription(packageName, sessions)
        })
            .then(response => {
                if (response.success) {
                    loadCodes('CONSULTATION_PACKAGE');
                    notificationManager.success(TENANT_COMMON_CODE_MSG.SUCCESS_PACKAGE_CREATED);
                } else {
                    notificationManager.error(formatTenantCommonCodeCreateFailure(response.message));
                }
            })
            .catch(err => {
                console.error(TENANT_COMMON_CODE_MSG.LOG_PACKAGE_CREATE, err);
                notificationManager.error(TENANT_COMMON_CODE_MSG.ERR_PACKAGE_CREATE);
            });
    };

    const convertGroupNameToKorean = (groupName) => {
        return TENANT_COMMON_CODE_GROUP_KO_FALLBACK[groupName] || groupName;
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
        <AdminCommonLayout title={TENANT_COMMON_CODE_UI.LAYOUT_TITLE}>
            <div className="mg-v2-ad-b0kla">
                <div className="mg-v2-ad-b0kla__container">
                    <ContentArea ariaLabel={TENANT_COMMON_CODE_UI.CONTENT_ARIA_LABEL}>
                        <ContentHeader
                            title={TENANT_COMMON_CODE_UI.HEADER_TITLE}
                            subtitle={TENANT_COMMON_CODE_UI.HEADER_SUBTITLE}
                            titleId={TENANT_COMMON_CODE_TITLE_ID}
                        />
                        <main aria-labelledby={TENANT_COMMON_CODE_TITLE_ID}>
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
            parentCategoryOptions={parentCategoryOptions}
            parentOptionsLoading={parentOptionsLoading}
            
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
                        </main>
                    </ContentArea>
                </div>
            </div>
        </AdminCommonLayout>
    );
};

export default TenantCommonCodeManager;

