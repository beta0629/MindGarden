import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../utils/ajax';
import { notification } from '../../../utils/scripts';
import SimpleLayout from '../../layout/SimpleLayout';
import LoadingSpinner from '../../common/LoadingSpinner';
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
const ImprovedCommonCodeManagement = () => {
    // 상태 관리
    const [currentStep, setCurrentStep] = useState(1); // 1: 그룹 선택, 2: 코드 관리
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [codeGroups, setCodeGroups] = useState([]);
    const [groupCodes, setGroupCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCode, setEditingCode] = useState(null);

    // 새 코드 폼 데이터
    const [newCodeData, setNewCodeData] = useState({
        codeValue: '',
        codeLabel: '',
        codeDescription: '',
        sortOrder: 0,
        isActive: true
    });

    // 코드그룹 목록 로드
    const loadCodeGroups = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiGet('/api/admin/common-codes/groups');
            if (response.success && response.data) {
                setCodeGroups(response.data);
            } else {
                notification.error('코드그룹 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('코드그룹 로드 오류:', error);
            notification.error('코드그룹 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    // 특정 그룹의 코드 목록 로드
    const loadGroupCodes = useCallback(async (groupName) => {
        try {
            setLoading(true);
            const response = await apiGet(`/api/admin/common-codes/group/${groupName}`);
            if (response.success && response.data) {
                setGroupCodes(response.data);
            } else {
                notification.error(`${groupName} 그룹의 코드 목록을 불러오는데 실패했습니다.`);
            }
        } catch (error) {
            console.error('그룹 코드 로드 오류:', error);
            notification.error(`${groupName} 그룹의 코드 목록을 불러오는데 실패했습니다.`);
        } finally {
            setLoading(false);
        }
    }, []);

    // 코드그룹 선택
    const handleGroupSelect = (group) => {
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

    // 새 코드 추가
    const handleAddCode = async (e) => {
        e.preventDefault();
        
        if (!newCodeData.codeValue.trim() || !newCodeData.codeLabel.trim()) {
            notification.error('코드 값과 라벨은 필수입니다.');
            return;
        }

        try {
            setLoading(true);
            const response = await apiPost('/api/admin/common-codes', {
                ...newCodeData,
                codeGroup: selectedGroup
            });

            if (response.success) {
                notification.success('새 코드가 추가되었습니다!');
                setShowAddForm(false);
                setNewCodeData({
                    codeValue: '',
                    codeLabel: '',
                    codeDescription: '',
                    sortOrder: 0,
                    isActive: true
                });
                loadGroupCodes(selectedGroup);
            } else {
                notification.error(response.message || '코드 추가에 실패했습니다.');
            }
        } catch (error) {
            console.error('코드 추가 오류:', error);
            notification.error('코드 추가에 실패했습니다.');
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
            const response = await apiDelete(`/api/admin/common-codes/${codeId}`);
            
            if (response.success) {
                notification.success('코드가 삭제되었습니다!');
                loadGroupCodes(selectedGroup);
            } else {
                notification.error(response.message || '코드 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('코드 삭제 오류:', error);
            notification.error('코드 삭제에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 코드 상태 토글
    const handleToggleStatus = async (codeId, currentStatus) => {
        try {
            setLoading(true);
            const response = await apiPost(`/api/admin/common-codes/${codeId}/toggle-status`);
            
            if (response.success) {
                notification.success('코드 상태가 변경되었습니다!');
                loadGroupCodes(selectedGroup);
            } else {
                notification.error(response.message || '코드 상태 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('코드 상태 토글 오류:', error);
            notification.error('코드 상태 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 코드 수정
    const handleEditCode = (code) => {
        setEditingCode(code);
        setNewCodeData({
            codeValue: code.codeValue,
            codeLabel: code.codeLabel,
            codeDescription: code.codeDescription || '',
            sortOrder: code.sortOrder || 0,
            isActive: code.isActive
        });
        setShowAddForm(true);
    };

    // 코드 업데이트
    const handleUpdateCode = async (e) => {
        e.preventDefault();
        
        if (!newCodeData.codeValue.trim() || !newCodeData.codeLabel.trim()) {
            notification.error('코드 값과 라벨은 필수입니다.');
            return;
        }

        try {
            setLoading(true);
            const response = await apiPut(`/api/admin/common-codes/${editingCode.id}`, newCodeData);

            if (response.success) {
                notification.success('코드가 수정되었습니다!');
                setShowAddForm(false);
                setEditingCode(null);
                setNewCodeData({
                    codeValue: '',
                    codeLabel: '',
                    codeDescription: '',
                    sortOrder: 0,
                    isActive: true
                });
                loadGroupCodes(selectedGroup);
            } else {
                notification.error(response.message || '코드 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('코드 수정 오류:', error);
            notification.error('코드 수정에 실패했습니다.');
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
        loadCodeGroups();
    }, [loadCodeGroups]);

    // 1단계: 코드그룹 선택 화면
    const renderGroupSelection = () => (
        <div className="group-selection">
            <div className="step-header">
                <h2>📋 코드그룹 선택</h2>
                <p>관리하고자 하는 코드그룹을 선택하세요.</p>
            </div>

            {loading ? (
                <LoadingSpinner text="코드그룹을 불러오는 중..." size="medium" />
            ) : (
                <div className="group-cards">
                    {codeGroups.map((group, index) => (
                        <div 
                            key={group} 
                            className="group-card"
                            onClick={() => handleGroupSelect(group)}
                        >
                            <div className="group-card-header">
                                <div className="group-icon">📁</div>
                                <h3>{group}</h3>
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
            <div className="step-header">
                <button 
                    className="btn btn-outline-secondary back-btn"
                    onClick={handleBackToGroups}
                >
                    <i className="bi bi-arrow-left"></i>
                    그룹 선택으로 돌아가기
                </button>
                <div className="header-content">
                    <h2>📁 {selectedGroup} 그룹 관리</h2>
                    <p>코드를 추가, 수정, 삭제할 수 있습니다.</p>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowAddForm(true)}
                    disabled={loading}
                >
                    <i className="bi bi-plus-circle"></i>
                    새 코드 추가
                </button>
            </div>

            {showAddForm && (
                <div className="add-code-form">
                    <div className="form-header">
                        <h3>{editingCode ? '코드 수정' : '새 코드 추가'}</h3>
                        <button 
                            className="btn btn-sm btn-outline-secondary"
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
                    <div className="codes-grid">
                        {groupCodes.map((code) => (
                            <div key={code.id} className={`code-card ${!code.isActive ? 'inactive' : ''}`}>
                                <div className="code-card-header">
                                    <div className="code-info">
                                        <h4>{code.codeLabel}</h4>
                                        <span className="code-value">{code.codeValue}</span>
                                    </div>
                                    <div className="code-status">
                                        <span className={`status-badge ${code.isActive ? 'active' : 'inactive'}`}>
                                            {code.isActive ? '활성' : '비활성'}
                                        </span>
                                    </div>
                                </div>
                                {code.codeDescription && (
                                    <div className="code-description">
                                        <p>{code.codeDescription}</p>
                                    </div>
                                )}
                                <div className="code-card-footer">
                                    <div className="code-meta">
                                        <span>정렬: {code.sortOrder}</span>
                                    </div>
                                    <div className="code-actions">
                                        <button 
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleEditCode(code)}
                                            title="수정"
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </button>
                                        <button 
                                            className={`btn btn-sm ${code.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                            onClick={() => handleToggleStatus(code.id, code.isActive)}
                                            title={code.isActive ? '비활성화' : '활성화'}
                                        >
                                            <i className={`bi ${code.isActive ? 'bi-pause' : 'bi-play'}`}></i>
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDeleteCode(code.id)}
                                            title="삭제"
                                        >
                                            <i className="bi bi-trash"></i>
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

export default ImprovedCommonCodeManagement;
