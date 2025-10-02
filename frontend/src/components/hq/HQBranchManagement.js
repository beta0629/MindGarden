import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Tab, Tabs } from 'react-bootstrap';
import { FaBuilding, FaChartBar, FaCog } from 'react-icons/fa';
import { useSession } from '../../contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from "../common/UnifiedLoading";
import BranchList from './BranchList';
import BranchForm from './BranchForm';
import BranchDetail from './BranchDetail';
import BranchStatisticsDashboard from './BranchStatisticsDashboard';
import { apiGet } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import './HQBranchManagement.css';

/**
 * HQ 권한 사용자용 지점관리 통합 화면
 * - 지점 목록 관리
 * - 지점 등록/수정
 * - 지점 상세 정보 및 관리
 * - 지점별 통계 대시보드
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const HQBranchManagement = () => {
    const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
    const navigate = useNavigate();

    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('list');
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [showBranchForm, setShowBranchForm] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [managers, setManagers] = useState([]);

    // 권한 체크
    useEffect(() => {
        if (sessionLoading) return;

        if (!isLoggedIn || !user) {
            navigate('/login', { replace: true });
            return;
        }

        // HQ 권한 체크
        const hqRoles = ['HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER'];
        if (!hqRoles.includes(user.role)) {
            showNotification('이 페이지에 접근할 권한이 없습니다.', 'error');
            navigate('/dashboard', { replace: true });
            return;
        }
    }, [sessionLoading, isLoggedIn, user, navigate]);

    // 초기 데이터 로드
    useEffect(() => {
        if (user && isLoggedIn) {
            loadInitialData();
        }
    }, [user, isLoggedIn]);

    // 초기 데이터 로드
    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [branchesRes, managersRes] = await Promise.all([
                apiGet('/api/hq/branches'),
                apiGet('/api/hq/managers')
            ]);
            
            console.log('🔍 API 응답 확인:', branchesRes);
            console.log('🔍 branchesRes 타입:', typeof branchesRes);
            console.log('🔍 branchesRes.data:', branchesRes.data);
            
            // API 응답이 배열인지 객체인지 확인
            const branchesData = Array.isArray(branchesRes) ? branchesRes : (branchesRes.data || []);
            const managersData = Array.isArray(managersRes) ? managersRes : (managersRes.data || []);
            
            console.log('🔍 최종 branchesData:', branchesData);
            console.log('🔍 최종 managersData:', managersData);
            
            setBranches(branchesData);
            setManagers(managersData);
        } catch (error) {
            console.error('초기 데이터 로드 실패:', error);
            showNotification('데이터를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // 지점 선택 핸들러
    const handleBranchSelect = (branch) => {
        setSelectedBranch(branch);
        setActiveTab('detail');
    };

    // 지점 추가 핸들러
    const handleAddBranch = () => {
        setEditingBranch(null);
        setShowBranchForm(true);
    };

    // 지점 수정 핸들러
    const handleEditBranch = (branch) => {
        setEditingBranch(branch);
        setShowBranchForm(true);
    };

    // 지점 폼 성공 핸들러
    const handleBranchFormSuccess = (newBranch) => {
        setShowBranchForm(false);
        setEditingBranch(null);
        
        if (editingBranch) {
            // 수정된 경우
            setBranches(prev => prev.map(branch => 
                branch.id === editingBranch.id ? { ...branch, ...newBranch } : branch
            ));
            if (selectedBranch?.id === editingBranch.id) {
                setSelectedBranch({ ...selectedBranch, ...newBranch });
            }
            showNotification('지점 정보가 수정되었습니다.', 'success');
        } else {
            // 새로 추가된 경우
            setBranches(prev => [newBranch, ...prev]);
            showNotification('새 지점이 등록되었습니다.', 'success');
        }
    };

    // 지점 업데이트 핸들러
    const handleBranchUpdate = (updatedBranch) => {
        setBranches(prev => prev.map(branch => 
            branch.id === updatedBranch.id ? updatedBranch : branch
        ));
        if (selectedBranch?.id === updatedBranch.id) {
            setSelectedBranch(updatedBranch);
        }
    };

    // 지점 삭제 핸들러
    const handleBranchDelete = (branchId) => {
        setBranches(prev => prev.filter(branch => branch.id !== branchId));
        if (selectedBranch?.id === branchId) {
            setSelectedBranch(null);
            setActiveTab('list');
        }
        showNotification('지점이 삭제되었습니다.', 'success');
    };

    // 사용자 이동 핸들러
    const handleUserTransfer = (userIds, targetBranchCode) => {
        // 통계 대시보드에서 선택된 지점 업데이트
        if (targetBranchCode) {
            const targetBranch = branches.find(b => b.code === targetBranchCode);
            if (targetBranch) {
                setSelectedBranch(targetBranch);
                setActiveTab('detail');
            }
        }
    };

    // 로딩 상태
    if (sessionLoading || loading) {
        return (
            <SimpleLayout>
                <div className="hq-branch-management-loading">
                    <UnifiedLoading text="지점 관리 시스템을 불러오는 중..." size="large" type="inline" />
                </div>
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout>
            <div className="hq-branch-management">
                <Container fluid className="py-4">
                    {/* 헤더 */}
                    <div className="management-header">
                        <h2 className="management-title">
                            <FaBuilding className="me-3" />
                            지점 관리 시스템
                        </h2>
                        <p className="management-subtitle">
                            본사에서 모든 지점을 통합 관리하고 모니터링합니다
                        </p>
                        <div className="user-info">
                            <span className="user-role">
                                {user?.role === 'HQ_MASTER' ? 'HQ 마스터' : 
                                 user?.role === 'SUPER_HQ_ADMIN' ? '수퍼 본사 관리자' : 
                                 '본사 관리자'}
                            </span>
                        </div>
                    </div>

                    {/* 메인 탭 */}
                    <Tabs
                        activeKey={activeTab}
                        onSelect={setActiveTab}
                        className="management-tabs"
                    >
                        {/* 지점 목록 탭 */}
                        <Tab eventKey="list" title={
                            <span><FaBuilding className="me-2" />지점 목록</span>
                        }>
                            <BranchList
                                onBranchSelect={handleBranchSelect}
                                selectedBranchId={selectedBranch?.id}
                                onAddBranch={handleAddBranch}
                                onEditBranch={handleEditBranch}
                            />
                        </Tab>

                        {/* 지점 상세 탭 */}
                        <Tab 
                            eventKey="detail" 
                            title={
                                <span><FaCog className="me-2" />지점 관리</span>
                            }
                            disabled={!selectedBranch}
                        >
                            {selectedBranch ? (
                                <BranchDetail
                                    branch={selectedBranch}
                                    branches={branches}
                                    onBranchUpdate={handleBranchUpdate}
                                    onUserTransfer={handleUserTransfer}
                                    onBranchDelete={handleBranchDelete}
                                />
                            ) : (
                                <div className="no-branch-selected">
                                    <div className="text-center py-5">
                                        <FaBuilding className="text-muted mb-3 hq-branch-empty-icon" />
                                        <h5 className="text-muted">지점을 선택해주세요</h5>
                                        <p className="text-muted">
                                            지점 목록에서 관리할 지점을 선택하면 상세 정보를 확인할 수 있습니다.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </Tab>

                        {/* 통계 대시보드 탭 */}
                        <Tab eventKey="statistics" title={
                            <span><FaChartBar className="me-2" />통계 대시보드</span>
                        }>
                            <BranchStatisticsDashboard
                                selectedBranchId={selectedBranch?.id}
                                onBranchSelect={handleBranchSelect}
                            />
                        </Tab>
                    </Tabs>

                    {/* 지점 폼 모달 */}
                    <BranchForm
                        show={showBranchForm}
                        onHide={() => {
                            setShowBranchForm(false);
                            setEditingBranch(null);
                        }}
                        onSuccess={handleBranchFormSuccess}
                        branch={editingBranch}
                        managers={managers}
                    />
                </Container>
            </div>
        </SimpleLayout>
    );
};

export default HQBranchManagement;
