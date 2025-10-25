import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import './SpecialtyManagementModal.css';

/**
 * 상담사 전문분야 관리 모달 컴포넌트
 * - 상담사별 전문분야 설정
 * - 전문분야별 필터링
 * - 전문분야 통계
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-30
 */
const SpecialtyManagementModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [consultants, setConsultants] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [newSpecialty, setNewSpecialty] = useState('');
    const [filterSpecialty, setFilterSpecialty] = useState('');
    const [statistics, setStatistics] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadConsultants();
            loadSpecialties();
            loadStatistics();
        }
    }, [isOpen]);

    /**
     * 상담사 목록 로드
     */
    const loadConsultants = async () => {
        try {
            setLoading(true);
            const response = await apiGet('/api/admin/consultants');
            if (response && response.success !== false) {
                setConsultants(response.data || []);
            }
        } catch (error) {
            console.error('상담사 목록 로드 실패:', error);
            notificationManager.error('상담사 목록을 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 전문분야 목록 로드
     */
    const loadSpecialties = async () => {
        try {
            const response = await apiGet('/api/common-codes/SPECIALTY');
            if (response && Array.isArray(response)) {
                setSpecialties(response);
            } else if (response && response.success !== false) {
                setSpecialties(response.data || []);
            }
        } catch (error) {
            console.error('전문분야 목록 로드 실패:', error);
        }
    };

    /**
     * 전문분야 통계 로드
     */
    const loadStatistics = async () => {
        try {
            const response = await apiGet('/api/admin/statistics/specialty');
            if (response && response.success !== false) {
                setStatistics(response.data);
            }
        } catch (error) {
            console.error('전문분야 통계 로드 실패:', error);
        }
    };

    /**
     * 상담사 선택
     */
    const handleConsultantSelect = (consultant) => {
        setSelectedConsultant(consultant);
        setNewSpecialty(consultant.specialty || '');
    };

    /**
     * 전문분야 추가/수정
     */
    const handleSaveSpecialty = async () => {
        if (!selectedConsultant || !newSpecialty.trim()) {
            notificationManager.error('전문분야를 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            
            const response = await apiPut(`/api/admin/consultants/${selectedConsultant.id}/specialty`, {
                specialty: newSpecialty.trim()
            });
            
            if (response && response.success !== false) {
                notificationManager.success('전문분야가 저장되었습니다.');
                
                // 상담사 목록 업데이트
                setConsultants(prev => 
                    prev.map(consultant => 
                        consultant.id === selectedConsultant.id 
                            ? { ...consultant, specialty: newSpecialty.trim() }
                            : consultant
                    )
                );
                
                // 통계 새로고침
                loadStatistics();
            } else {
                throw new Error(response?.message || '전문분야 저장에 실패했습니다.');
            }

        } catch (error) {
            console.error('❌ 전문분야 저장 실패:', error);
            notificationManager.error(error.message || '전문분야 저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 전문분야 추가 (공통 코드)
     */
    const handleAddSpecialty = async () => {
        if (!newSpecialty.trim()) {
            notificationManager.error('전문분야를 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            
            const response = await apiPost('/api/common-codes', {
                codeGroup: 'CONSULTANT_SPECIALTY',
                codeValue: newSpecialty.trim().toUpperCase().replace(/\s+/g, '_'),
                codeLabel: newSpecialty.trim(),
                codeDescription: `상담사 전문분야: ${newSpecialty.trim()}`,
                isActive: true,
                sortOrder: 0
            });
            
            if (response && response.success !== false) {
                notificationManager.success('새 전문분야가 추가되었습니다.');
                loadSpecialties();
                setNewSpecialty('');
            } else {
                throw new Error(response?.message || '전문분야 추가에 실패했습니다.');
            }

        } catch (error) {
            console.error('❌ 전문분야 추가 실패:', error);
            notificationManager.error(error.message || '전문분야 추가 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 필터링된 상담사 목록
     */
    const filteredConsultants = consultants.filter(consultant => {
        if (!filterSpecialty) return true;
        return consultant.specialty && consultant.specialty.includes(filterSpecialty);
    });

    /**
     * 모달 닫기
     */
    const handleClose = () => {
        if (loading) return;
        setSelectedConsultant(null);
        setNewSpecialty('');
        setFilterSpecialty('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="specialty-management-modal-overlay">
            <div className="specialty-management-modal">
                <div className="specialty-management-modal-header">
                    <h3>🎯 상담사 전문분야 관리</h3>
                    <button 
                        className="specialty-management-close-btn"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>

                <div className="specialty-management-modal-content">
                    {/* 통계 정보 */}
                    {statistics && (
                        <div className="specialty-statistics">
                            <h4>전문분야 통계</h4>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-label">총 상담사</span>
                                    <span className="stat-value">{statistics.totalConsultants || 0}명</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">전문분야 설정</span>
                                    <span className="stat-value">{statistics.specialtySet || 0}명</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">전문분야 종류</span>
                                    <span className="stat-value">{statistics.specialtyTypes || 0}개</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="specialty-content">
                        {/* 상담사 목록 */}
                        <div className="consultants-section">
                            <div className="section-header">
                                <h4>상담사 목록</h4>
                                <div className="filter-controls">
                                    <select
                                        value={filterSpecialty}
                                        onChange={(e) => setFilterSpecialty(e.target.value)}
                                        disabled={loading}
                                    >
                                        <option value="">전체 전문분야</option>
                                        {specialties.map(specialty => (
                                            <option key={specialty.codeValue} value={specialty.codeLabel}>
                                                {specialty.codeLabel}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="consultants-list">
                                {filteredConsultants.map(consultant => (
                                    <div 
                                        key={consultant.id} 
                                        className={`consultant-item ${selectedConsultant?.id === consultant.id ? 'selected' : ''}`}
                                        onClick={() => handleConsultantSelect(consultant)}
                                    >
                                        <div className="consultant-info">
                                            <div className="consultant-name">{consultant.name || consultant.username}</div>
                                            <div className="consultant-specialty">
                                                {consultant.specialty || '전문분야 미설정'}
                                            </div>
                                        </div>
                                        <div className="consultant-actions">
                                            <button 
                                                className="btn-edit"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleConsultantSelect(consultant);
                                                }}
                                            >
                                                ✏️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 전문분야 설정 */}
                        <div className="specialty-section">
                            <h4>전문분야 설정</h4>
                            
                            {selectedConsultant ? (
                                <div className="specialty-form">
                                    <div className="form-group">
                                        <label>선택된 상담사</label>
                                        <div className="selected-consultant">
                                            {selectedConsultant.name || selectedConsultant.username}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="specialty">전문분야</label>
                                        <div className="specialty-input-group">
                                            <select
                                                id="specialty"
                                                value={newSpecialty}
                                                onChange={(e) => setNewSpecialty(e.target.value)}
                                                disabled={loading}
                                            >
                                                <option value="">전문분야를 선택하세요</option>
                                                {specialties.map(specialty => (
                                                    <option key={specialty.codeValue} value={specialty.codeLabel}>
                                                        {specialty.codeLabel}
                                                    </option>
                                                ))}
                                            </select>
                                            <button 
                                                className="btn-save"
                                                onClick={handleSaveSpecialty}
                                                disabled={loading || !newSpecialty.trim()}
                                            >
                                                {loading ? '저장 중...' : '저장'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-selection">
                                    <p>상담사를 선택해주세요.</p>
                                </div>
                            )}

                            {/* 새 전문분야 추가 */}
                            <div className="add-specialty-form">
                                <h5>새 전문분야 추가</h5>
                                <div className="add-specialty-input-group">
                                    <input
                                        type="text"
                                        placeholder="새 전문분야를 입력하세요"
                                        value={newSpecialty}
                                        onChange={(e) => setNewSpecialty(e.target.value)}
                                        disabled={loading}
                                    />
                                    <button 
                                        className="btn-add"
                                        onClick={handleAddSpecialty}
                                        disabled={loading || !newSpecialty.trim()}
                                    >
                                        {loading ? '추가 중...' : '추가'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpecialtyManagementModal;
