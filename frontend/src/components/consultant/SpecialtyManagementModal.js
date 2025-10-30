import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Briefcase, XCircle, Edit2, Save, Plus, Users, Target } from 'lucide-react';
import UnifiedLoading from '../common/UnifiedLoading';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import { getAllConsultantsWithStats } from '../../utils/consultantHelper';
import { useSession } from '../../contexts/SessionContext';
import { getSpecialtyKoreanName } from '../../utils/codeHelper';

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
    const { user } = useSession();
    const [loading, setLoading] = useState(false);
    const [consultants, setConsultants] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [newSpecialty, setNewSpecialty] = useState('');
    const [filterSpecialty, setFilterSpecialty] = useState('');
    const [statistics, setStatistics] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadSpecialties().then(() => {
                loadConsultants(); // specialties 로드 후 실행
            });
            // loadStatistics(); // 제거: loadConsultants에서 calculateStatistics로 자동 계산됨
        }
    }, [isOpen]);

    /**
     * 상담사 목록 로드 (통합 API 사용, 지점별 + 삭제 제외)
     */
    const loadConsultants = async () => {
        try {
            setLoading(true);
            const consultantsList = await getAllConsultantsWithStats();
            
            if (consultantsList && consultantsList.length > 0) {
                // 응답 데이터 변환: Map.of() 구조 파싱
                const consultantsData = consultantsList.map(item => {
                    const consultantEntity = item.consultant || {};
                    
                    // username 필드도 추가 (name이 없을 경우 대체)
                    const consultantName = consultantEntity.name || consultantEntity.username || '이름 없음';
                    const consultantEmail = consultantEntity.email || '';
                    
                    // 전문분야 데이터 확인 (공통코드에서 동적으로 가져오기)
                    const rawSpecialty = consultantEntity.specialty || consultantEntity.specialization || '';
                    console.log('📋 전문분야 원본 데이터:', rawSpecialty);
                    
                    // specialties 배열에서 한글명 찾기
                    let specialtyDisplay = '미설정';
                    if (rawSpecialty) {
                        // 쉼표로 구분된 전문분야들을 배열로 변환
                        const specialtyArray = rawSpecialty.includes(',') 
                            ? rawSpecialty.split(',').map(s => s.trim())
                            : [rawSpecialty.trim()];
                        
                        // 각 전문분야를 한글로 변환
                        const koreanSpecialties = specialtyArray.map(specialty => {
                            let korean = getSpecialtyKoreanName(specialty); // fallback
                            
                            // specialties 배열에서 더 정확한 한글명 찾기
                            if (specialties.length > 0) {
                                const foundSpecialty = specialties.find(s => 
                                    s.codeValue === specialty || 
                                    s.codeValue === specialty.toUpperCase() ||
                                    s.codeLabel === specialty
                                );
                                if (foundSpecialty) {
                                    korean = foundSpecialty.koreanName || foundSpecialty.codeLabel || korean;
                                }
                            }
                            return korean;
                        });
                        
                        specialtyDisplay = koreanSpecialties.join(', '); // 쉼표로 연결
                    }
                    
                    console.log('📋 전문분야 한글 변환:', specialtyDisplay);
                    
                    return {
                        id: consultantEntity.id,
                        name: consultantName,
                        username: consultantEntity.username || consultantName,
                        email: consultantEmail,
                        phone: consultantEntity.phone || '',
                        role: consultantEntity.role || 'CONSULTANT',
                        isActive: consultantEntity.isActive !== undefined ? consultantEntity.isActive : true,
                        branchCode: consultantEntity.branchCode || '',
                        specialty: rawSpecialty, // 원본 저장
                        specialtyDisplay: specialtyDisplay, // 동적으로 조회한 한글명
                        specialtyDetails: consultantEntity.specialtyDetails || consultantEntity.specializationDetails || '',
                        specialization: consultantEntity.specialization || consultantEntity.specialty || '',
                        specializationDetails: consultantEntity.specializationDetails || consultantEntity.specialtyDetails || '',
                        yearsOfExperience: consultantEntity.yearsOfExperience || 0,
                        maxClients: consultantEntity.maxClients || 0,
                        currentClients: item.currentClients || 0,
                        totalClients: item.totalClients || 0,
                        isDeleted: consultantEntity.isDeleted || false
                    };
                });
                
                // 삭제된 상담사 필터링
                const filteredData = consultantsData.filter(consultant => !consultant.isDeleted);
                setConsultants(filteredData);
                
                // 통계 자동 계산
                calculateStatistics(filteredData);
            } else {
                setConsultants([]);
                setStatistics({
                    totalConsultants: 0,
                    specialtySet: 0,
                    specialtyTypes: 0
                });
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
     * 전문분야 통계 로드 (Deprecated - calculateStatistics로 대체됨)
     */
    // const loadStatistics = async () => {
    //     try {
    //         const response = await apiGet('/api/admin/statistics/specialty');
    //         if (response && response.success !== false) {
    //             setStatistics(response.data);
    //         }
    //     } catch (error) {
    //         console.error('전문분야 통계 로드 실패:', error);
    //     }
    // };

    /**
     * 통계 자동 계산
     */
    const calculateStatistics = (consultantsList) => {
        const totalConsultants = consultantsList.length;
        const specialtySetCount = consultantsList.filter(c => c.specialty || c.specialization).length;
        
        // 전문분야 종류 계산
        const specialtyTypesSet = new Set();
        consultantsList.forEach(consultant => {
            if (consultant.specialty) {
                specialtyTypesSet.add(consultant.specialty);
            }
            if (consultant.specialization) {
                const specialties = consultant.specialization.split(',');
                specialties.forEach(s => specialtyTypesSet.add(s.trim()));
            }
        });
        
        setStatistics({
            totalConsultants,
            specialtySet: specialtySetCount,
            specialtyTypes: specialtyTypesSet.size
        });
    };

    /**
     * 상담사 선택
     */
    const handleConsultantSelect = (consultant) => {
        setSelectedConsultant(consultant);
        // specialty 또는 specialization 둘 중 하나를 선택
        const specialtyValue = consultant.specialty || consultant.specialization || '';
        setNewSpecialty(specialtyValue);
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
                const updatedConsultants = consultants.map(consultant => 
                    consultant.id === selectedConsultant.id 
                        ? { ...consultant, specialty: newSpecialty.trim() }
                        : consultant
                );
                setConsultants(updatedConsultants);
                
                // 통계 새로고침 (로컬 계산)
                calculateStatistics(updatedConsultants);
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

    const portalTarget = document.body || document.createElement('div');

    return ReactDOM.createPortal(
        <div className="mg-v2-modal-overlay" onClick={handleClose}>
            <div className="mg-v2-modal mg-v2-modal-large" onClick={(e) => e.stopPropagation()}>
                <div className="mg-v2-modal-header">
                    <div className="mg-v2-modal-title-wrapper">
                        <Target size={28} className="mg-v2-modal-title-icon" />
                        <h2 className="mg-v2-modal-title">상담사 전문분야 관리</h2>
                    </div>
                    <button className="mg-v2-modal-close" onClick={handleClose} disabled={loading} aria-label="닫기">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="mg-v2-modal-body">
                    {/* 통계 정보 */}
                    {statistics && (
                        <div className="mg-v2-info-box">
                            <h4 className="mg-v2-info-box-title">
                                <Briefcase size={20} className="mg-v2-section-title-icon" />
                                전문분야 통계
                            </h4>
                            <div className="mg-v2-info-grid">
                                <div className="mg-v2-info-item">
                                    <span className="mg-v2-info-label">총 상담사</span>
                                    <span className="mg-v2-info-value">{statistics.totalConsultants || 0}명</span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <span className="mg-v2-info-label">전문분야 설정</span>
                                    <span className="mg-v2-info-value">{statistics.specialtySet || 0}명</span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <span className="mg-v2-info-label">전문분야 종류</span>
                                    <span className="mg-v2-info-value">{statistics.specialtyTypes || 0}개</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mg-v2-form-row">
                        {/* 상담사 목록 */}
                        <div className="mg-v2-form-section">
                            <h3 className="mg-v2-section-title">
                                <Users size={20} className="mg-v2-section-title-icon" />
                                상담사 목록
                            </h3>
                            <div className="mg-v2-form-group">
                                <label className="mg-v2-form-label">필터</label>
                                <select
                                    value={filterSpecialty}
                                    onChange={(e) => setFilterSpecialty(e.target.value)}
                                    disabled={loading}
                                    className="mg-v2-form-select"
                                >
                                    <option value="">전체 전문분야</option>
                                    {specialties.map(specialty => (
                                        <option key={specialty.codeValue} value={specialty.codeLabel}>
                                            {getSpecialtyKoreanName(specialty.codeValue) || specialty.codeLabel}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mg-v2-list-container">
                                {filteredConsultants.map(consultant => (
                                    <div 
                                        key={consultant.id} 
                                        className={`mg-v2-list-item ${selectedConsultant?.id === consultant.id ? 'mg-v2-list-item--active' : ''}`}
                                        onClick={() => handleConsultantSelect(consultant)}
                                    >
                                        <div className="mg-v2-list-item-content">
                                            <div className="mg-v2-list-item-title">{consultant.name || consultant.username}</div>
                                            <div className="mg-v2-list-item-subtitle">
                                                {consultant.specialtyDisplay || getSpecialtyKoreanName(consultant.specialty || consultant.specialization)}
                                            </div>
                                        </div>
                                        <button 
                                            className="mg-v2-button mg-v2-button--icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleConsultantSelect(consultant);
                                            }}
                                        >
                                            <Edit2 size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 전문분야 설정 */}
                        <div className="mg-v2-form-section">
                            <h3 className="mg-v2-section-title">
                                <Briefcase size={20} className="mg-v2-section-title-icon" />
                                전문분야 설정
                            </h3>
                            
                            {selectedConsultant ? (
                                <div className="mg-v2-form-container">
                                    <div className="mg-v2-form-group">
                                        <label className="mg-v2-form-label">선택된 상담사</label>
                                        <div className="mg-v2-info-box">
                                            <div className="mg-v2-info-text">
                                                {selectedConsultant.name || selectedConsultant.username}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mg-v2-form-group">
                                        <label className="mg-v2-form-label" htmlFor="specialty">전문분야</label>
                                        <div className="mg-v2-form-row">
                                            <select
                                                id="specialty"
                                                value={newSpecialty}
                                                onChange={(e) => setNewSpecialty(e.target.value)}
                                                disabled={loading}
                                                className="mg-v2-form-select mg-v2-form-select--flex-1"
                                            >
                                                <option value="">전문분야를 선택하세요</option>
                                                {specialties.map(specialty => (
                                                    <option key={specialty.codeValue} value={specialty.codeLabel}>
                                                        {getSpecialtyKoreanName(specialty.codeValue) || specialty.codeLabel}
                                                    </option>
                                                ))}
                                            </select>
                                            <button 
                                                className="mg-v2-button mg-v2-button--primary"
                                                onClick={handleSaveSpecialty}
                                                disabled={loading || !newSpecialty.trim()}
                                            >
                                                <Save size={20} className="mg-v2-icon-inline" />
                                                {loading ? '저장 중...' : '저장'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mg-v2-empty-state">
                                    <p>상담사를 선택해주세요.</p>
                                </div>
                            )}

                            {/* 새 전문분야 추가 */}
                            <div className="mg-v2-form-section mg-v2-mt-lg">
                                <h4 className="mg-v2-section-title">
                                    <Plus size={20} className="mg-v2-section-title-icon" />
                                    새 전문분야 추가
                                </h4>
                                <div className="mg-v2-form-group">
                                    <div className="mg-v2-form-row">
                                        <input
                                            type="text"
                                            placeholder="새 전문분야를 입력하세요"
                                            value={newSpecialty}
                                            onChange={(e) => setNewSpecialty(e.target.value)}
                                            disabled={loading}
                                            className="mg-v2-form-input mg-v2-form-input--flex-1"
                                        />
                                        <button 
                                            className="mg-v2-button mg-v2-button--secondary"
                                            onClick={handleAddSpecialty}
                                            disabled={loading || !newSpecialty.trim()}
                                        >
                                            <Plus size={20} className="mg-v2-icon-inline" />
                                            {loading ? '추가 중...' : '추가'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        portalTarget
    );
};

export default SpecialtyManagementModal;
