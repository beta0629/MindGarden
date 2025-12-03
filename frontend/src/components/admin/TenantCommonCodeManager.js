/**
 * 테넌트 공통코드 관리 컨테이너 (Container Component)
 * 
 * 비즈니스 로직 담당:
 * - API 호출
 * - 상태 관리
 * - 이벤트 핸들러
 * 
 * UI 렌더링은 TenantCommonCodeManagerUI에 위임
 * 
 * @author MindGarden
 * @version 2.0.0
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
        loadCodeGroups();
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
                alert(modalMode === 'create' ? '코드가 생성되었습니다.' : '코드가 수정되었습니다.');
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
        if (!window.confirm('정말 삭제하시겠습니까?')) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await deleteTenantCode(codeId);
            if (response.success) {
                loadCodes(selectedGroup.groupName);
                alert('코드가 삭제되었습니다.');
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
                    alert('상담 패키지가 생성되었습니다.');
                } else {
                    alert('생성 실패: ' + response.message);
                }
            })
            .catch(err => {
                console.error('패키지 생성 오류:', err);
                alert('패키지 생성 중 오류가 발생했습니다.');
            });
    };

    return (
        <TenantCommonCodeManagerUI
            // 데이터
            codeGroups={codeGroups}
            selectedGroup={selectedGroup}
            codes={codes}
            loading={loading}
            error={error}
            showModal={showModal}
            modalMode={modalMode}
            formData={formData}
            
            // 이벤트 핸들러
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

