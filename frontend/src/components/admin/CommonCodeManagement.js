import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import { notification } from '../../utils/scripts';
import SimpleLayout from '../layout/SimpleLayout';
import CommonCodeList from './commoncode/CommonCodeList';
import CommonCodeForm from './commoncode/CommonCodeForm';
import CommonCodeStats from './commoncode/CommonCodeStats';
import CommonCodeFilters from './commoncode/CommonCodeFilters';
import './CommonCodeManagement.css';

/**
 * 공통코드 관리 메인 컴포넌트
 * - 공통코드 CRUD 기능 제공
 * - 코드 그룹별 관리
 * - 통계 및 필터링 기능
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const CommonCodeManagement = () => {
    const [commonCodes, setCommonCodes] = useState([]);
    const [codeGroups, setCodeGroups] = useState([]);
    const [filteredCodes, setFilteredCodes] = useState([]);
    const [selectedCode, setSelectedCode] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        codeGroup: '',
        isActive: '',
        searchTerm: ''
    });

    // 공통코드 목록 로드
    const loadCommonCodes = async () => {
        setLoading(true);
        try {
            const response = await apiGet('/api/admin/common-codes');
            if (response.success) {
                setCommonCodes(response.data);
                setFilteredCodes(response.data);
            } else {
                notification.error('공통코드 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('공통코드 로드 오류:', error);
            // 백엔드 연결 실패 시 테스트 데이터 사용
            const testData = [
                {
                    id: 1,
                    codeGroup: 'PACKAGE_TYPE',
                    codeValue: 'basic_10',
                    codeLabel: '기본 10회기 패키지',
                    codeDescription: '기본적인 10회기 상담 패키지',
                    sortOrder: 1,
                    isActive: true,
                    createdAt: '2024-12-19T10:00:00',
                    updatedAt: '2024-12-19T10:00:00'
                },
                {
                    id: 2,
                    codeGroup: 'PACKAGE_TYPE',
                    codeValue: 'premium_20',
                    codeLabel: '프리미엄 20회기 패키지',
                    codeDescription: '프리미엄 20회기 상담 패키지',
                    sortOrder: 2,
                    isActive: true,
                    createdAt: '2024-12-19T10:00:00',
                    updatedAt: '2024-12-19T10:00:00'
                },
                {
                    id: 3,
                    codeGroup: 'PAYMENT_METHOD',
                    codeValue: 'card',
                    codeLabel: '신용카드',
                    codeDescription: '신용카드 결제',
                    sortOrder: 1,
                    isActive: true,
                    createdAt: '2024-12-19T10:00:00',
                    updatedAt: '2024-12-19T10:00:00'
                },
                {
                    id: 4,
                    codeGroup: 'PAYMENT_METHOD',
                    codeValue: 'bank_transfer',
                    codeLabel: '계좌이체',
                    codeDescription: '계좌이체 결제',
                    sortOrder: 2,
                    isActive: true,
                    createdAt: '2024-12-19T10:00:00',
                    updatedAt: '2024-12-19T10:00:00'
                },
                {
                    id: 5,
                    codeGroup: 'RESPONSIBILITY',
                    codeValue: 'mental_health',
                    codeLabel: '정신건강 상담',
                    codeDescription: '정신건강 관련 상담',
                    sortOrder: 1,
                    isActive: true,
                    createdAt: '2024-12-19T10:00:00',
                    updatedAt: '2024-12-19T10:00:00'
                }
            ];
            setCommonCodes(testData);
            setFilteredCodes(testData);
            console.log('테스트 데이터로 공통코드 로드됨');
        } finally {
            setLoading(false);
        }
    };

    // 코드 그룹 목록 로드
    const loadCodeGroups = async () => {
        try {
            const response = await apiGet('/api/admin/common-codes/groups');
            if (response.success) {
                setCodeGroups(response.data);
            }
        } catch (error) {
            console.error('코드 그룹 로드 오류:', error);
            // 백엔드 연결 실패 시 테스트 데이터 사용
            const testGroups = [
                { codeGroup: 'PACKAGE_TYPE', count: 2, description: '패키지 타입' },
                { codeGroup: 'PAYMENT_METHOD', count: 2, description: '결제 방법' },
                { codeGroup: 'RESPONSIBILITY', count: 1, description: '담당 업무' }
            ];
            setCodeGroups(testGroups);
            console.log('테스트 데이터로 코드 그룹 로드됨');
        }
    };

    // 공통코드 생성
    const handleCreateCode = async (codeData) => {
        try {
            const response = await apiPost('/api/admin/common-codes', codeData);
            if (response.success) {
                notification.success('공통코드가 성공적으로 생성되었습니다!');
                setShowForm(false);
                loadCommonCodes();
                loadCodeGroups();
            } else {
                notification.error(response.message || '공통코드 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('공통코드 생성 오류:', error);
            notification.error('공통코드 생성에 실패했습니다.');
        }
    };

    // 공통코드 수정
    const handleUpdateCode = async (id, codeData) => {
        try {
            const response = await apiPut(`/api/admin/common-codes/${id}`, codeData);
            if (response.success) {
                notification.success('공통코드가 성공적으로 수정되었습니다!');
                setShowForm(false);
                setSelectedCode(null);
                loadCommonCodes();
            } else {
                notification.error(response.message || '공통코드 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('공통코드 수정 오류:', error);
            notification.error('공통코드 수정에 실패했습니다.');
        }
    };

    // 공통코드 삭제
    const handleDeleteCode = async (id) => {
        if (!window.confirm('정말로 이 공통코드를 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await apiDelete(`/api/admin/common-codes/${id}`);
            if (response.success) {
                notification.success('공통코드가 성공적으로 삭제되었습니다!');
                loadCommonCodes();
                loadCodeGroups();
            } else {
                notification.error(response.message || '공통코드 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('공통코드 삭제 오류:', error);
            notification.error('공통코드 삭제에 실패했습니다.');
        }
    };

    // 공통코드 상태 토글
    const handleToggleStatus = async (id) => {
        try {
            const response = await apiPost(`/api/admin/common-codes/${id}/toggle-status`);
            if (response.success) {
                notification.success('공통코드 상태가 변경되었습니다!');
                loadCommonCodes();
            } else {
                notification.error(response.message || '공통코드 상태 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('공통코드 상태 토글 오류:', error);
            notification.error('공통코드 상태 변경에 실패했습니다.');
        }
    };

    // 필터 적용
    const applyFilters = () => {
        let filtered = [...commonCodes];

        if (filters.codeGroup) {
            filtered = filtered.filter(code => code.codeGroup === filters.codeGroup);
        }

        if (filters.isActive !== '') {
            const isActive = filters.isActive === 'true';
            filtered = filtered.filter(code => code.isActive === isActive);
        }

        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(code => 
                code.codeLabel?.toLowerCase().includes(searchLower) ||
                code.codeValue?.toLowerCase().includes(searchLower) ||
                code.codeDescription?.toLowerCase().includes(searchLower)
            );
        }

        setFilteredCodes(filtered);
    };

    // 편집 모드 열기
    const handleEditCode = (code) => {
        setSelectedCode(code);
        setShowForm(true);
    };

    // 새 코드 생성 모드 열기
    const handleNewCode = () => {
        setSelectedCode(null);
        setShowForm(true);
    };

    // 폼 닫기
    const handleCloseForm = () => {
        setShowForm(false);
        setSelectedCode(null);
    };

    // 초기 로드
    useEffect(() => {
        loadCommonCodes();
        loadCodeGroups();
    }, []);

    // 필터 변경 시 적용
    useEffect(() => {
        applyFilters();
    }, [filters, commonCodes]);

    return (
        <SimpleLayout>
            <div className="common-code-management">
            <div className="page-header">
                <h1>공통코드 관리</h1>
                <p>시스템에서 사용되는 공통코드를 관리합니다.</p>
            </div>

            <CommonCodeStats 
                totalCodes={commonCodes.length}
                activeCodes={commonCodes.filter(code => code.isActive).length}
                codeGroups={codeGroups.length}
            />

            <CommonCodeFilters 
                filters={filters}
                onFiltersChange={setFilters}
                codeGroups={codeGroups}
                onNewCode={handleNewCode}
            />

            <CommonCodeList 
                commonCodes={filteredCodes}
                loading={loading}
                onEdit={handleEditCode}
                onDelete={handleDeleteCode}
                onToggleStatus={handleToggleStatus}
            />

            {showForm && (
                <CommonCodeForm 
                    code={selectedCode}
                    codeGroups={codeGroups}
                    onSubmit={selectedCode ? 
                        (data) => handleUpdateCode(selectedCode.id, data) : 
                        handleCreateCode
                    }
                    onClose={handleCloseForm}
                />
            )}
            </div>
        </SimpleLayout>
    );
};

export default CommonCodeManagement;
