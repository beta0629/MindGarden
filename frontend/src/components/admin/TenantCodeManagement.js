/**
 * 테넌트 코드 관리 컴포넌트
/**
 * - 테넌트별 독립 코드 관리
/**
 * - 코어 코드와 테넌트 코드 구분 표시
/**
 * - 테넌트 독립성 보장
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
 * @since 2025-11-26
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { notificationManager } from '../../utils/notificationManager';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import UnifiedLoading from '../common/UnifiedLoading';
import { 
    FaBuilding, 
    FaGlobe, 
    FaEdit, 
    FaTrash, 
    FaPlus, 
    FaEye,
    FaShieldAlt,
    FaUsers,
    FaTag,
    FaFilter,
    FaSearch
} from 'react-icons/fa';
import {
    TENANT_CODE_GROUPS,
    CORE_CODE_GROUPS,
    TAB_TYPES,
    MODAL_TYPES,
    DEFAULT_FORM_DATA,
    UI_TEXT,
    NOTIFICATION_MESSAGES,
    API_ENDPOINTS,
    PERMISSIONS
} from '../../constants/tenantCodeConstants';
import {
    isTenantCodeGroup,
    getCodeGroupsByTab,
    validateFormData,
    filterCodes,
    checkUserPermissions,
    normalizeCodeData,
    transformMetadata,
    getGroupDisplayName,
    getGroupDescription,
    formatErrorMessage
} from '../../utils/tenantCodeUtils';
import './TenantCodeManagement.css';

const TenantCodeManagement = () => {
    const { user } = useSession();
    
    // 상태 관리
    const [activeTab, setActiveTab] = useState(TAB_TYPES.TENANT);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCode, setEditingCode] = useState(null);
    
    // 코드 그룹 메타데이터
    const [groupMetadata, setGroupMetadata] = useState({});
    
    // 폼 데이터
    const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

    // 컴포넌트 마운트 시 초기화
    useEffect(() => {
        loadGroupMetadata();
    }, []);

    // 코드 그룹 메타데이터 로드
    const loadGroupMetadata = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.METADATA);
            if (response.ok) {
                const data = await response.json();
                const metadata = transformMetadata(data);
                setGroupMetadata(metadata);
            }
        } catch (error) {
            console.error('코드 그룹 메타데이터 로드 실패:', error);
        }
    };

    // 선택된 그룹의 코드 목록 로드
    const loadCodes = useCallback(async (codeGroup) => {
        if (!codeGroup) return;
        
        setLoading(true);
        try {
            const { getCommonCodes, getTenantCodes } = await import('../../utils/commonCodeApi');
            
            let codesData = [];
            if (isTenantCodeGroup(codeGroup)) {
                // 테넌트 코드 조회 (독립성 보장)
                codesData = await getTenantCodes(codeGroup);
            } else {
                // 코어 코드 또는 일반 코드 조회
                codesData = await getCommonCodes(codeGroup);
            }
            
            setCodes(codesData || []);
        } catch (error) {
            console.error('코드 목록 로드 실패:', error);
            notificationManager.show(NOTIFICATION_MESSAGES.LOAD_ERROR, 'error');
            setCodes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // 그룹 선택 시 코드 로드
    useEffect(() => {
        if (selectedGroup) {
            loadCodes(selectedGroup);
        }
    }, [selectedGroup, loadCodes]);

    // 코드 추가/수정
    const handleSaveCode = async () => {
        // 폼 검증
        const validation = validateFormData(formData);
        if (!validation.isValid) {
            const firstError = Object.values(validation.errors)[0];
            notificationManager.show(firstError, 'error');
            return;
        }

        try {
            const { createCommonCode, updateCommonCode } = await import('../../utils/commonCodeApi');
            
            const codeData = normalizeCodeData(formData, selectedGroup, user?.tenantId);

            if (editingCode) {
                await updateCommonCode(editingCode.id, codeData);
                notificationManager.show(NOTIFICATION_MESSAGES.UPDATE_SUCCESS, 'success');
            } else {
                await createCommonCode(codeData);
                notificationManager.show(NOTIFICATION_MESSAGES.SAVE_SUCCESS, 'success');
            }

            // 목록 새로고침
            loadCodes(selectedGroup);
            handleCloseModal();
        } catch (error) {
            console.error('코드 저장 실패:', error);
            const errorMessage = editingCode ? NOTIFICATION_MESSAGES.UPDATE_ERROR : NOTIFICATION_MESSAGES.SAVE_ERROR;
            const userFriendlyMessage = formatErrorMessage(error);
            notificationManager.show(`${errorMessage}: ${userFriendlyMessage}`, 'error');
        }
    };

    // 코드 삭제
    const handleDeleteCode = async (codeId) => {
        const confirmed = await new Promise((resolve) => {
            notificationManager.confirm(NOTIFICATION_MESSAGES.DELETE_CONFIRM, resolve);
        });
        if (!confirmed) return;

        try {
            const { deleteCommonCode } = await import('../../utils/commonCodeApi');
            await deleteCommonCode(codeId);
            notificationManager.show(NOTIFICATION_MESSAGES.DELETE_SUCCESS, 'success');
            loadCodes(selectedGroup);
        } catch (error) {
            console.error('코드 삭제 실패:', error);
            const userFriendlyMessage = formatErrorMessage(error);
            notificationManager.show(`${NOTIFICATION_MESSAGES.DELETE_ERROR}: ${userFriendlyMessage}`, 'error');
        }
    };

    // 모달 열기
    const handleOpenModal = (code = null) => {
        if (code) {
            setEditingCode(code);
            setFormData({
                codeValue: code.codeValue || '',
                codeLabel: code.codeLabel || '',
                koreanName: code.koreanName || '',
                codeDescription: code.codeDescription || '',
                sortOrder: code.sortOrder || 1,
                isActive: code.isActive !== false,
                colorCode: code.colorCode || '',
                icon: code.icon || ''
            });
        } else {
            setEditingCode(null);
            setFormData(DEFAULT_FORM_DATA);
        }
        setShowAddModal(true);
    };

    // 모달 닫기
    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingCode(null);
        setFormData(DEFAULT_FORM_DATA);
    };

    // 검색 필터링
    const filteredCodes = filterCodes(codes, searchTerm);

    // 현재 탭의 코드 그룹 목록
    const getCurrentGroups = () => {
        return getCodeGroupsByTab(activeTab);
    };

    // 코드 그룹 카드 렌더링
    const renderGroupCard = (groupName) => {
        const isTenant = isTenantCodeGroup(groupName);
        const displayName = getGroupDisplayName(groupName, groupMetadata);
        const description = getGroupDescription(groupName, groupMetadata);
        
        return (
            <div 
                key={groupName}
                className={`group-card ${selectedGroup === groupName ? 'selected' : ''} ${isTenant ? 'tenant' : 'core'}`}
                onClick={() => setSelectedGroup(groupName)}
            >
                <div className="group-header">
                    <div className="group-icon">
                        {isTenant ? <FaBuilding /> : <FaGlobe />}
                    </div>
                    <div className="group-type">
                        {isTenant ? UI_TEXT.TENANT_CODE : UI_TEXT.CORE_CODE}
                    </div>
                </div>
                <div className="group-info">
                    <h3 className="group-name">{displayName}</h3>
                    <p className="group-description">{description}</p>
                </div>
                <div className="group-stats">
                    <span className="code-count">
                        {groupName === selectedGroup ? codes.length : '?'}개 코드
                    </span>
                </div>
            </div>
        );
    };

    // 코드 목록 렌더링
    const renderCodeList = () => {
        if (!selectedGroup) {
            return (
                <div className="no-selection">
                    <FaTag size={48} />
                    <h3>{UI_TEXT.SELECT_GROUP}</h3>
                    <p>{UI_TEXT.SELECT_GROUP_DESC}</p>
                </div>
            );
        }

        if (loading) {
            return (
                <AdminCommonLayout title="테넌트 코드 관리" loading={true} loadingText={UI_TEXT.LOADING_CODES}>
                    <UnifiedLoading type="page" text={UI_TEXT.LOADING_CODES} />
                </AdminCommonLayout>
            );
        }

        const isTenant = isTenantCodeGroup(selectedGroup);
        const permissions = checkUserPermissions(user, selectedGroup);
        const displayName = getGroupDisplayName(selectedGroup, groupMetadata);
        
        return (
            <div className="code-list-container">
                <div className="code-list-header">
                    <div className="header-info">
                        <h2>
                            {isTenant ? <FaBuilding /> : <FaGlobe />}
                            {displayName}
                        </h2>
                        <div className="code-type-badge">
                            {isTenant ? (
                                <span className="tenant-badge">
                                    <FaUsers /> {UI_TEXT.TENANT_BADGE}
                                </span>
                            ) : (
                                <span className="core-badge">
                                    <FaShieldAlt /> {UI_TEXT.CORE_BADGE}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="header-actions">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                type="text"
                                placeholder={UI_TEXT.SEARCH_PLACEHOLDER}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="mg-button"
                            variant="primary"
                            onClick={() => handleOpenModal()}
                            disabled={!permissions.canEdit}
                        >
                            <FaPlus /> {UI_TEXT.ADD_CODE}
                        </button>
                    </div>
                </div>

                <div className="codes-grid">
                    {filteredCodes.length === 0 ? (
                        <div className="empty-state">
                            <FaTag size={32} />
                            <p>{UI_TEXT.NO_CODES}</p>
                            {permissions.canEdit && (
                                <button className="mg-button"
                                    variant="outline"
                                    onClick={() => handleOpenModal()}
                                >
                                    {UI_TEXT.FIRST_CODE}
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredCodes.map(code => (
                            <div key={code.id} className={`code-card ${!code.isActive ? 'inactive' : ''}`}>
                                <div className="code-header">
                                    <div className="code-value">
                                        {code.icon && (
                                            <span 
                                                className="code-icon" 
                                                // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
                                                style={{ color: code.colorCode || '#6b7280' }}
                                            >
                                                {code.icon}
                                            </span>
                                        )}
                                        <code>{code.codeValue}</code>
                                    </div>
                                    <div className="code-status">
                                    <span className={`status-badge ${code.isActive ? 'active' : 'inactive'}`}>
                                        {code.isActive ? UI_TEXT.STATUS_ACTIVE : UI_TEXT.STATUS_INACTIVE}
                                    </span>
                                    </div>
                                </div>
                                <div className="code-content">
                                    <h4 className="code-label">{code.koreanName || code.codeLabel}</h4>
                                    {code.codeDescription && (
                                        <p className="code-description">{code.codeDescription}</p>
                                    )}
                                </div>
                                <div className="code-meta">
                                    <span className="tenant-info">
                                        {code.tenantId ? (
                                            <><FaBuilding /> {UI_TEXT.TENANT_CODE}</>
                                        ) : (
                                            <><FaGlobe /> {UI_TEXT.CORE_CODE}</>
                                        )}
                                    </span>
                                    <span className="sort-order">{UI_TEXT.SORT_ORDER}: {code.sortOrder}</span>
                                </div>
                                <div className="code-actions">
                                    <button
                                        className="action-btn view"
                                        onClick={() => handleOpenModal(code)}
                                        title={UI_TEXT.TOOLTIP_VIEW}
                                    >
                                        <FaEye />
                                    </button>
                                    {permissions.canEdit && (
                                        <button
                                            className="action-btn edit"
                                            onClick={() => handleOpenModal(code)}
                                            title={UI_TEXT.TOOLTIP_EDIT}
                                        >
                                            <FaEdit />
                                        </button>
                                    )}
                                    {permissions.canDelete && (
                                        <button
                                            className="action-btn delete"
                                            onClick={() => handleDeleteCode(code.id)}
                                            title={UI_TEXT.TOOLTIP_DELETE}
                                        >
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    // 코드 추가/수정 모달 렌더링
    const renderModal = () => {
        if (!showAddModal) return null;

        const isTenant = TENANT_CODE_GROUPS.includes(selectedGroup);

        return (
            <div className="modal-overlay" onClick={handleCloseModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>
                            {editingCode ? UI_TEXT.MODAL_EDIT_TITLE : UI_TEXT.MODAL_ADD_TITLE}
                            {isTenant && <span className="tenant-badge"><FaBuilding /> {UI_TEXT.TENANT_CODE}</span>}
                        </h3>
                        <button className="close-btn" onClick={handleCloseModal}>×</button>
                    </div>
                    
                    <div className="modal-body">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>{UI_TEXT.FORM_CODE_VALUE} *</label>
                                <input
                                    type="text"
                                    value={formData.codeValue}
                                    onChange={(e) => setFormData({...formData, codeValue: e.target.value})}
                                    placeholder={UI_TEXT.PLACEHOLDER_CODE_VALUE}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>{UI_TEXT.FORM_CODE_LABEL} *</label>
                                <input
                                    type="text"
                                    value={formData.codeLabel}
                                    onChange={(e) => setFormData({...formData, codeLabel: e.target.value})}
                                    placeholder={UI_TEXT.PLACEHOLDER_CODE_LABEL}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>{UI_TEXT.FORM_KOREAN_NAME} *</label>
                                <input
                                    type="text"
                                    value={formData.koreanName}
                                    onChange={(e) => setFormData({...formData, koreanName: e.target.value})}
                                    placeholder={UI_TEXT.PLACEHOLDER_KOREAN_NAME}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>{UI_TEXT.FORM_SORT_ORDER}</label>
                                <input
                                    type="number"
                                    value={formData.sortOrder}
                                    onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 1})}
                                    min="1"
                                />
                            </div>
                            
                            <div className="form-group full-width">
                                <label>{UI_TEXT.FORM_DESCRIPTION}</label>
                                <textarea
                                    value={formData.codeDescription}
                                    onChange={(e) => setFormData({...formData, codeDescription: e.target.value})}
                                    placeholder={UI_TEXT.PLACEHOLDER_DESCRIPTION}
                                    rows="3"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>{UI_TEXT.FORM_ICON}</label>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({...formData, icon: e.target.value})}
                                    placeholder={UI_TEXT.PLACEHOLDER_ICON}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>{UI_TEXT.FORM_COLOR}</label>
                                <input
                                    type="color"
                                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
                                    value={formData.colorCode || '#6b7280'}
                                    onChange={(e) => setFormData({...formData, colorCode: e.target.value})}
                                />
                            </div>
                            
                            <div className="form-group full-width">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                    />
                                    {UI_TEXT.FORM_ACTIVE}
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div className="modal-footer">
                        <button className="mg-button" variant="outline" onClick={handleCloseModal}>
                            {UI_TEXT.BTN_CANCEL}
                        </button>
                        <button className="mg-button" 
                            variant="primary" 
                            onClick={handleSaveCode}
                            disabled={!formData.codeValue || !formData.codeLabel || !formData.koreanName}
                        >
                            {editingCode ? UI_TEXT.BTN_EDIT : UI_TEXT.BTN_ADD}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AdminCommonLayout title="테넌트 코드 관리" loading={loading && codes.length === 0} loadingText="코드를 불러오는 중...">
            <div className="tenant-code-management">
                <div className="page-header">
                    <h1>{UI_TEXT.PAGE_TITLE}</h1>
                    <p>{UI_TEXT.PAGE_DESCRIPTION}</p>
                </div>

                <div className="tab-navigation">
                    <button
                        className={`tab-btn ${activeTab === TAB_TYPES.TENANT ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(TAB_TYPES.TENANT);
                            setSelectedGroup(null);
                            setCodes([]);
                        }}
                    >
                        <FaBuilding /> {UI_TEXT.TAB_TENANT}
                        <span className="tab-count">{TENANT_CODE_GROUPS.length}</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === TAB_TYPES.CORE ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(TAB_TYPES.CORE);
                            setSelectedGroup(null);
                            setCodes([]);
                        }}
                    >
                        <FaGlobe /> {UI_TEXT.TAB_CORE}
                        <span className="tab-count">{CORE_CODE_GROUPS.length}</span>
                    </button>
                </div>

                <div className="management-container">
                    <div className="groups-sidebar">
                        <div className="sidebar-header">
                            <h3>
                                {activeTab === TAB_TYPES.TENANT ? (
                                    <><FaBuilding /> {UI_TEXT.TAB_TENANT} 그룹</>
                                ) : (
                                    <><FaGlobe /> {UI_TEXT.TAB_CORE} 그룹</>
                                )}
                            </h3>
                            <p>
                                {activeTab === TAB_TYPES.TENANT 
                                    ? UI_TEXT.TENANT_DESCRIPTION
                                    : UI_TEXT.CORE_DESCRIPTION
                                }
                            </p>
                        </div>
                        <div className="groups-list">
                            {getCurrentGroups().map(renderGroupCard)}
                        </div>
                    </div>

                    <div className="codes-main">
                        {renderCodeList()}
                    </div>
                </div>

                {renderModal()}
            </div>
        </AdminCommonLayout>
    );
};

export default TenantCodeManagement;
