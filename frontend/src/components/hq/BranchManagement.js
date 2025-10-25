import React, { useState, useEffect, useCallback } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { 
    Container, Row, Col, Card, Button, Modal, Form, 
    Table, Badge, Alert, InputGroup, FormControl, 
    FormSelect, FormCheck, Spinner, ButtonGroup,
    Tabs, Tab
} from 'react-bootstrap';
import { 
    FaBuilding, FaUsers, FaUserTie, FaUser, FaCrown, 
    FaSearch, FaFilter, FaExchangeAlt, FaPlus, FaEdit,
    FaChartBar, FaMapMarkerAlt, FaEye
} from 'react-icons/fa';
import { apiGet, apiPost } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import { normalizeBranchList, getBranchNameByCode } from '../../utils/branchUtils';
import SimpleLayout from '../layout/SimpleLayout';
import BranchRegistrationModal from './BranchRegistrationModal';
import './BranchManagement.css';

/**
 * 본사 지점 관리 컴포넌트
 * 컴포넌트화된 지점 관리 및 사용자 지점 이동 기능
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const BranchManagement = () => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branchUsers, setBranchUsers] = useState([]);
    const [branchStatistics, setBranchStatistics] = useState({});
    
    // 필터 및 검색
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [includeInactive, setIncludeInactive] = useState(false);
    const [activeTab, setActiveTab] = useState('branches');
    
    // 모달 상태
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showBranchRegistrationModal, setShowBranchRegistrationModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [transferForm, setTransferForm] = useState({
        targetBranchCode: '',
        reason: ''
    });
    
    // 컴포넌트 로드
    useEffect(() => {
        loadBranches();
    }, []);
    
    useEffect(() => {
        console.log('🔍 useEffect 트리거 - selectedBranch:', selectedBranch);
        if (selectedBranch) {
            console.log(`📊 지점 ${selectedBranch.branchCode} 선택됨, 데이터 로드 시작`);
            loadBranchStatistics(selectedBranch.branchCode);
            loadBranchUsers(selectedBranch.branchCode);
        }
    }, [selectedBranch, selectedRole, includeInactive]);
    
    // 지점 목록 로드
    const loadBranches = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiGet('/api/hq/branch-management/branches');
            setBranches(response.data || []);
            if (response.data && response.data.length > 0 && !selectedBranch) {
                setSelectedBranch(response.data[0]);
            }
        } catch (error) {
            console.error('지점 목록 로드 실패:', error);
            showNotification('지점 목록을 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedBranch]);
    
    // 지점 통계 로드
    const loadBranchStatistics = useCallback(async (branchCode) => {
        try {
            console.log(`📊 지점 ${branchCode} 통계 로드 중...`);
            const response = await apiGet(`/api/hq/branch-management/branches/${branchCode}/statistics`);
            console.log(`📊 지점 ${branchCode} 통계 응답:`, response);
            setBranchStatistics(response || {});
        } catch (error) {
            console.error('지점 통계 로드 실패:', error);
            setBranchStatistics({});
        }
    }, []);
    
    // 지점 사용자 목록 로드
    const loadBranchUsers = useCallback(async (branchCode) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedRole) params.append('role', selectedRole);
            if (includeInactive) params.append('includeInactive', 'true');
            
            const response = await apiGet(`/api/hq/branch-management/branches/${branchCode}/users?${params}`);
            setBranchUsers(response.users || []);
        } catch (error) {
            console.error('지점 사용자 목록 로드 실패:', error);
            showNotification('사용자 목록을 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedRole, includeInactive]);
    
    // 사용자 선택/해제
    const handleUserSelection = (userId, isSelected) => {
        if (isSelected) {
            setSelectedUsers(prev => [...prev, userId]);
        } else {
            setSelectedUsers(prev => prev.filter(id => id !== userId));
        }
    };
    
    // 전체 선택/해제
    const handleSelectAll = (isSelected) => {
        if (isSelected) {
            setSelectedUsers(branchUsers.map(user => user.id));
        } else {
            setSelectedUsers([]);
        }
    };
    
    // 사용자 지점 이동
    const handleBulkTransfer = async () => {
        if (selectedUsers.length === 0) {
            showNotification('이동할 사용자를 선택해주세요.', 'warning');
            return;
        }
        
        if (!transferForm.targetBranchCode) {
            showNotification('대상 지점을 선택해주세요.', 'warning');
            return;
        }
        
        try {
            const requestData = {
                userIds: selectedUsers,
                targetBranchCode: transferForm.targetBranchCode,
                reason: transferForm.reason
            };
            
            const response = await apiPost('/api/hq/branch-management/users/bulk-transfer', requestData);
            
            if (response.success) {
                showNotification(response.message, 'success');
                setShowTransferModal(false);
                setSelectedUsers([]);
                setTransferForm({ targetBranchCode: '', reason: '' });
                if (selectedBranch) {
                    loadBranchUsers(selectedBranch.code);
                    loadBranchStatistics(selectedBranch.code);
                }
            } else {
                showNotification(response.message || '지점 이동에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('사용자 일괄 이동 실패:', error);
            showNotification('사용자 이동에 실패했습니다: ' + (error.message || '알 수 없는 오류'), 'error');
        }
    };
    
    // 지점 등록 완료 핸들러
    const handleBranchAdded = (newBranch) => {
        setBranches(prev => [...prev, newBranch]);
        showNotification('새 지점이 등록되었습니다.', 'success');
    };
    
    // 필터된 사용자 목록
    const filteredUsers = branchUsers.filter(user => {
        const matchesSearch = !searchTerm || 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });
    
    // 역할 아이콘 반환
    const getRoleIcon = (role) => {
        switch (role) {
            case 'CLIENT': return <FaUser className="text-primary" />;
            case 'CONSULTANT': return <FaUserTie className="text-success" />;
            case 'ADMIN': return <FaCrown className="text-warning" />;
            default: return <FaUsers className="text-secondary" />;
        }
    };
    
    // 역할 배지 색상 반환
    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'CLIENT': return 'primary';
            case 'CONSULTANT': return 'success';
            case 'ADMIN': return 'warning';
            default: return 'secondary';
        }
    };
    
    return (
        <SimpleLayout title="지점 관리">
            <div className="hq-branch-management">
                <Container fluid className="py-4">
                    <Tabs
                        activeKey={activeTab}
                        onSelect={setActiveTab}
                        className="mb-4"
                    >
                        <Tab eventKey="branches" title={
                            <span><FaBuilding className="me-2" />지점 목록</span>
                        }>
                            <Row>
                                <Col md={3}>
                                    <Card className="branch-management-card">
                                        <Card.Header>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h5 className="mb-0 d-flex align-items-center">
                                                    <FaBuilding className="me-2" style={{ color: 'var(--color-primary)' }} />
                                                    지점 목록 ({branches.length}개)
                                                </h5>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => setShowBranchRegistrationModal(true)}
                                                    className="branch-action-button branch-action-button--primary"
                                                >
                                                    <FaPlus className="me-1" />
                                                    지점 등록
                                                </Button>
                                            </div>
                                        </Card.Header>
                                        <Card.Body style={{
                                            padding: '0',
                                            height: 'calc(100% - 60px)',
                                            overflow: 'hidden'
                                        }}>
                                            {loading ? (
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    height: '200px',
                                                    flexDirection: 'column'
                                                }}>
                                                    <UnifiedLoading text="지점 목록을 불러오는 중..." size="small" type="inline" />
                                                </div>
                                            ) : (
                                                <div style={{
                                                    height: '100%',
                                                    overflowY: 'auto',
                                                    padding: '8px',
                                                    minWidth: '200px',
                                                    maxWidth: '250px'
                                                }}>
                                                    {branches.map((branch) => (
                                                        <button
                                                            key={branch.id}
                                                            style={{
                                                                width: '100%',
                                                                padding: '12px 16px',
                                                                marginBottom: '4px',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                background: selectedBranch?.id === branch.id ? '#e3f2fd' : '#ffffff',
                                                                borderLeft: selectedBranch?.id === branch.id ? '4px solid #007bff' : '4px solid #e9ecef',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                textAlign: 'left',
                                                                boxShadow: selectedBranch?.id === branch.id ? '0 2px 8px rgba(0,123,255,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
                                                                minHeight: '60px',
                                                                maxHeight: '80px'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (selectedBranch?.id !== branch.id) {
                                                                    e.target.style.background = '#f8f9fa';
                                                                    e.target.style.borderLeftColor = '#007bff';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (selectedBranch?.id !== branch.id) {
                                                                    e.target.style.background = '#ffffff';
                                                                    e.target.style.borderLeftColor = '#e9ecef';
                                                                }
                                                            }}
                                                            onClick={() => setSelectedBranch(branch)}
                                                        >
                                                            <div style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'flex-start'
                                                            }}>
                                                                <strong style={{
                                                                    fontSize: 'var(--font-size-sm)',
                                                                    color: selectedBranch?.id === branch.id ? '#007bff' : '#495057',
                                                                    fontWeight: '600',
                                                                    marginBottom: '2px',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    display: 'block',
                                                                    lineHeight: '1.2',
                                                                    maxWidth: '150px'
                                                                }}>
                                                                    {branch.branchName}
                                                                </strong>
                                                                <small style={{
                                                                    fontSize: 'var(--font-size-xs)',
                                                                    color: '#6c757d',
                                                                    fontFamily: 'monospace',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    maxWidth: '150px'
                                                                }}>
                                                                    {branch.branchCode}
                                                                </small>
                                                            </div>
                                                            <Badge 
                                                                bg={branch.isActive ? 'success' : 'secondary'}
                                                                style={{
                                                                    fontSize: 'var(--font-size-xs)',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '12px'
                                                                }}
                                                            >
                                                                {branch.isActive ? '활성' : '비활성'}
                                                            </Badge>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            
                            <Col md={9}>
                                {selectedBranch && (
                                    <>
                                        {/* 지점 통계 */}
                                        <Row style={{ marginBottom: '24px' }}>
                                            <Col>
                                                <Card style={{
                                                    border: '1px solid #e9ecef',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                    overflow: 'hidden'
                                                }}>
                                                    <Card.Header style={{
                                                        background: '#f8f9fa',
                                                        borderBottom: '1px solid #e9ecef',
                                                        padding: '16px 20px'
                                                    }}>
                                                        <h5 style={{
                                                            margin: 0,
                                                            color: '#495057',
                                                            fontSize: 'var(--font-size-base)',
                                                            fontWeight: '600',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}>
                                                            <FaChartBar style={{ marginRight: '8px', color: '#28a745' }} />
                                                            {selectedBranch.name} 통계
                                                        </h5>
                                                    </Card.Header>
                                                    <Card.Body style={{ padding: '20px' }}>
                                                        <Row>
                                                            <Col md={2}>
                                                                <div style={{
                                                                    textAlign: 'center',
                                                                    padding: '16px 8px',
                                                                    background: '#f8f9fa',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #e9ecef'
                                                                }}>
                                                                    <div style={{
                                                                        fontSize: 'var(--font-size-xxl)',
                                                                        fontWeight: '700',
                                                                        color: '#007bff',
                                                                        marginBottom: '4px'
                                                                    }}>
                                                                        {branchStatistics.totalUsers || 0}
                                                                    </div>
                                                                    <div style={{
                                                                        fontSize: 'var(--font-size-xs)',
                                                                        color: '#6c757d',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        전체 사용자
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                            <Col md={2}>
                                                                <div style={{
                                                                    textAlign: 'center',
                                                                    padding: '16px 8px',
                                                                    background: '#f8f9fa',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #e9ecef'
                                                                }}>
                                                                    <div style={{
                                                                        fontSize: 'var(--font-size-xxl)',
                                                                        fontWeight: '700',
                                                                        color: '#28a745',
                                                                        marginBottom: '4px'
                                                                    }}>
                                                                        {branchStatistics.consultants || 0}
                                                                    </div>
                                                                    <div style={{
                                                                        fontSize: 'var(--font-size-xs)',
                                                                        color: '#6c757d',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        상담사
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                            <Col md={2}>
                                                                <div style={{
                                                                    textAlign: 'center',
                                                                    padding: '16px 8px',
                                                                    background: '#f8f9fa',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #e9ecef'
                                                                }}>
                                                                    <div style={{
                                                                        fontSize: 'var(--font-size-xxl)',
                                                                        fontWeight: '700',
                                                                        color: '#007bff',
                                                                        marginBottom: '4px'
                                                                    }}>
                                                                        {branchStatistics.clients || 0}
                                                                    </div>
                                                                    <div style={{
                                                                        fontSize: 'var(--font-size-xs)',
                                                                        color: '#6c757d',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        내담자
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                            <Col md={2}>
                                                                <div style={{
                                                                    textAlign: 'center',
                                                                    padding: '16px 8px',
                                                                    background: '#f8f9fa',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #e9ecef'
                                                                }}>
                                                                    <div style={{
                                                                        fontSize: 'var(--font-size-xxl)',
                                                                        fontWeight: '700',
                                                                        color: '#ffc107',
                                                                        marginBottom: '4px'
                                                                    }}>
                                                                        {branchStatistics.admins || 0}
                                                                    </div>
                                                                    <div style={{
                                                                        fontSize: 'var(--font-size-xs)',
                                                                        color: '#6c757d',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        관리자
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                            <Col md={2}>
                                                                <div style={{
                                                                    textAlign: 'center',
                                                                    padding: '16px 8px',
                                                                    background: '#f8f9fa',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #e9ecef'
                                                                }}>
                                                                    <div style={{
                                                                        fontSize: 'var(--font-size-xxl)',
                                                                        fontWeight: '700',
                                                                        color: '#17a2b8',
                                                                        marginBottom: '4px'
                                                                    }}>
                                                                        {branchStatistics.activeUsers || 0}
                                                                    </div>
                                                                    <div style={{
                                                                        fontSize: 'var(--font-size-xs)',
                                                                        color: '#6c757d',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        활성
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                            <Col md={2}>
                                                                <div style={{
                                                                    textAlign: 'center',
                                                                    padding: '16px 8px',
                                                                    background: '#f8f9fa',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #e9ecef'
                                                                }}>
                                                                    <div style={{
                                                                        fontSize: 'var(--font-size-xxl)',
                                                                        fontWeight: '700',
                                                                        color: '#6c757d',
                                                                        marginBottom: '4px'
                                                                    }}>
                                                                        {branchStatistics.inactiveUsers || 0}
                                                                    </div>
                                                                    <div style={{
                                                                        fontSize: 'var(--font-size-xs)',
                                                                        color: '#6c757d',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        비활성
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                        
                                        {/* 사용자 목록 */}
                                        <Card style={{
                                            border: '1px solid #e9ecef',
                                            borderRadius: '12px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                            overflow: 'hidden'
                                        }}>
                                            <Card.Header style={{
                                                background: '#f8f9fa',
                                                borderBottom: '1px solid #e9ecef',
                                                padding: '16px 20px'
                                            }}>
                                                <Row style={{ alignItems: 'center' }}>
                                                    <Col>
                                                        <h5 style={{
                                                            margin: 0,
                                                            color: '#495057',
                                                            fontSize: 'var(--font-size-base)',
                                                            fontWeight: '600',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}>
                                                            <FaUsers style={{ marginRight: '8px', color: '#6f42c1' }} />
                                                            {selectedBranch.name} 사용자 목록
                                                        </h5>
                                                    </Col>
                                                    <Col xs="auto">
                                                        <ButtonGroup>
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={() => setShowTransferModal(true)}
                                                                disabled={selectedUsers.length === 0}
                                                                style={{
                                                                    marginRight: '8px',
                                                                    borderRadius: '6px',
                                                                    fontSize: 'var(--font-size-xs)',
                                                                    padding: '6px 12px'
                                                                }}
                                                            >
                                                                <FaExchangeAlt style={{ marginRight: '4px' }} />
                                                                지점 이동 ({selectedUsers.length})
                                                            </Button>
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={() => loadBranchUsers(selectedBranch.code)}
                                                                style={{
                                                                    borderRadius: '6px',
                                                                    fontSize: 'var(--font-size-xs)',
                                                                    padding: '6px 12px'
                                                                }}
                                                            >
                                                                <FaSearch style={{ marginRight: '4px' }} />
                                                                새로고침
                                                            </Button>
                                                        </ButtonGroup>
                                                    </Col>
                                                </Row>
                                            </Card.Header>
                                            <Card.Body style={{ padding: '20px' }}>
                                                {/* 필터 및 검색 */}
                                                <div style={{
                                                    marginBottom: '20px',
                                                    padding: '16px',
                                                    background: '#f8f9fa',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e9ecef'
                                                }}>
                                                    <Row>
                                                        <Col md={4}>
                                                            <InputGroup size="sm">
                                                                <InputGroup.Text style={{
                                                                    background: '#ffffff',
                                                                    border: '1px solid #ced4da',
                                                                    borderRight: 'none',
                                                                    borderRadius: '6px 0 0 6px'
                                                                }}>
                                                                    <FaSearch style={{ color: '#6c757d' }} />
                                                                </InputGroup.Text>
                                                                <FormControl
                                                                    placeholder="이름 또는 이메일로 검색..."
                                                                    value={searchTerm}
                                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                                    style={{
                                                                        border: '1px solid #ced4da',
                                                                        borderRadius: '0 6px 6px 0',
                                                                        fontSize: 'var(--font-size-sm)'
                                                                    }}
                                                                />
                                                            </InputGroup>
                                                        </Col>
                                                        <Col md={3}>
                                                            <FormSelect
                                                                size="sm"
                                                                value={selectedRole}
                                                                onChange={(e) => setSelectedRole(e.target.value)}
                                                                style={{
                                                                    border: '1px solid #ced4da',
                                                                    borderRadius: '6px',
                                                                    fontSize: 'var(--font-size-sm)'
                                                                }}
                                                            >
                                                                <option value="">모든 역할</option>
                                                                <option value="CLIENT">내담자</option>
                                                                <option value="CONSULTANT">상담사</option>
                                                                <option value="ADMIN">관리자</option>
                                                            </FormSelect>
                                                        </Col>
                                                        <Col md={3}>
                                                            <FormCheck
                                                                type="checkbox"
                                                                id="includeInactive"
                                                                label="비활성 사용자 포함"
                                                                checked={includeInactive}
                                                                onChange={(e) => setIncludeInactive(e.target.checked)}
                                                                style={{
                                                                    fontSize: 'var(--font-size-sm)',
                                                                    color: '#495057'
                                                                }}
                                                            />
                                                        </Col>
                                                        <Col md={2}>
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSearchTerm('');
                                                                    setSelectedRole('');
                                                                    setIncludeInactive(false);
                                                                }}
                                                                style={{
                                                                    borderRadius: '6px',
                                                                    fontSize: 'var(--font-size-xs)',
                                                                    padding: '6px 12px'
                                                                }}
                                                            >
                                                                <FaFilter style={{ marginRight: '4px' }} />
                                                                초기화
                                                            </Button>
                                                        </Col>
                                                    </Row>
                                                </div>
                                                
                                                {/* 사용자 테이블 */}
                                                {/* 사용자 선택 안내 */}
                                                {selectedUsers.length > 0 && (
                                                    <Alert variant="info" style={{
                                                        marginBottom: '16px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #b8daff',
                                                        background: '#d1ecf1',
                                                        color: '#0c5460'
                                                    }}>
                                                        <strong>{selectedUsers.length}명</strong>의 사용자가 선택되었습니다. 
                                                        "지점 이동" 버튼을 클릭하여 다른 지점으로 이동시킬 수 있습니다.
                                                    </Alert>
                                                )}
                                                
                                                <div style={{
                                                    border: '1px solid #e9ecef',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden'
                                                }}>
                                                    {loading ? (
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            height: '200px',
                                                            flexDirection: 'column'
                                                        }}>
                                                            <UnifiedLoading text="사용자 목록을 불러오는 중..." size="medium" type="inline" />
                                                        </div>
                                                    ) : filteredUsers.length === 0 ? (
                                                        <div style={{
                                                            textAlign: 'center',
                                                            padding: '40px 20px',
                                                            color: '#6c757d'
                                                        }}>
                                                            <FaUsers style={{ fontSize: '2rem', marginBottom: '12px', color: '#dee2e6' }} />
                                                            <p style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-base)' }}>이 지점에는 사용자가 없습니다.</p>
                                                            <small>다른 지점을 선택하거나 필터를 조정해보세요.</small>
                                                        </div>
                                                    ) : (
                                                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                                            <Table responsive hover style={{ margin: 0 }}>
                                                                <thead style={{
                                                                    position: 'sticky',
                                                                    top: 0,
                                                                    background: '#ffffff',
                                                                    zIndex: 10,
                                                                    borderBottom: '2px solid #e9ecef'
                                                                }}>
                                                                    <tr>
                                                                        <th style={{
                                                                            padding: '12px 16px',
                                                                            fontSize: 'var(--font-size-sm)',
                                                                            fontWeight: '600',
                                                                            color: '#495057',
                                                                            background: '#f8f9fa',
                                                                            borderBottom: '1px solid #e9ecef'
                                                                        }}>
                                                                            <FormCheck
                                                                                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                                                style={{ margin: 0 }}
                                                                            />
                                                                        </th>
                                                                        <th style={{
                                                                            padding: '12px 16px',
                                                                            fontSize: 'var(--font-size-sm)',
                                                                            fontWeight: '600',
                                                                            color: '#495057',
                                                                            background: '#f8f9fa',
                                                                            borderBottom: '1px solid #e9ecef'
                                                                        }}>사용자</th>
                                                                        <th style={{
                                                                            padding: '12px 16px',
                                                                            fontSize: 'var(--font-size-sm)',
                                                                            fontWeight: '600',
                                                                            color: '#495057',
                                                                            background: '#f8f9fa',
                                                                            borderBottom: '1px solid #e9ecef'
                                                                        }}>역할</th>
                                                                        <th style={{
                                                                            padding: '12px 16px',
                                                                            fontSize: 'var(--font-size-sm)',
                                                                            fontWeight: '600',
                                                                            color: '#495057',
                                                                            background: '#f8f9fa',
                                                                            borderBottom: '1px solid #e9ecef'
                                                                        }}>지점</th>
                                                                        <th style={{
                                                                            padding: '12px 16px',
                                                                            fontSize: 'var(--font-size-sm)',
                                                                            fontWeight: '600',
                                                                            color: '#495057',
                                                                            background: '#f8f9fa',
                                                                            borderBottom: '1px solid #e9ecef'
                                                                        }}>상태</th>
                                                                        <th style={{
                                                                            padding: '12px 16px',
                                                                            fontSize: 'var(--font-size-sm)',
                                                                            fontWeight: '600',
                                                                            color: '#495057',
                                                                            background: '#f8f9fa',
                                                                            borderBottom: '1px solid #e9ecef'
                                                                        }}>등록일</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                {filteredUsers.map((user) => (
                                                                    <tr 
                                                                        key={user.id} 
                                                                        style={{
                                                                            background: !user.isActive ? '#f8f9fa' : '#ffffff',
                                                                            borderBottom: '1px solid #e9ecef'
                                                                        }}
                                                                    >
                                                                        <td style={{ padding: '12px 16px' }}>
                                                                            <FormCheck
                                                                                checked={selectedUsers.includes(user.id)}
                                                                                onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                                                                                style={{ margin: 0 }}
                                                                            />
                                                                        </td>
                                                                        <td style={{ padding: '12px 16px' }}>
                                                                            <div style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center'
                                                                            }}>
                                                                                <div style={{ marginRight: '8px' }}>
                                                                                    {getRoleIcon(user.role)}
                                                                                </div>
                                                                                <div>
                                                                                    <div style={{
                                                                                        fontWeight: '600',
                                                                                        fontSize: 'var(--font-size-sm)',
                                                                                        color: '#495057',
                                                                                        marginBottom: '2px'
                                                                                    }}>
                                                                                        {user.name}
                                                                                    </div>
                                                                                    <small style={{ color: '#6c757d', fontSize: 'var(--font-size-xs)' }}>
                                                                                        {user.email}
                                                                                    </small>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td style={{ padding: '12px 16px' }}>
                                                                            <Badge 
                                                                                bg={getRoleBadgeVariant(user.role)}
                                                                                style={{
                                                                                    fontSize: 'var(--font-size-xs)',
                                                                                    padding: '4px 8px',
                                                                                    borderRadius: '12px'
                                                                                }}
                                                                            >
                                                                                {user.roleDisplayName}
                                                                            </Badge>
                                                                        </td>
                                                                        <td style={{ padding: '12px 16px' }}>
                                                                            <Badge 
                                                                                bg="info"
                                                                                style={{
                                                                                    fontSize: 'var(--font-size-xs)',
                                                                                    padding: '4px 8px',
                                                                                    borderRadius: '12px'
                                                                                }}
                                                                            >
                                                                                <FaMapMarkerAlt style={{ marginRight: '4px' }} />
                                                                                {user.branchCode}
                                                                            </Badge>
                                                                        </td>
                                                                        <td style={{ padding: '12px 16px' }}>
                                                                            <Badge 
                                                                                bg={user.isActive ? 'success' : 'secondary'}
                                                                                style={{
                                                                                    fontSize: 'var(--font-size-xs)',
                                                                                    padding: '4px 8px',
                                                                                    borderRadius: '12px'
                                                                                }}
                                                                            >
                                                                                {user.isActive ? '활성' : '비활성'}
                                                                            </Badge>
                                                                        </td>
                                                                        <td style={{ padding: '12px 16px' }}>
                                                                            <small style={{ color: '#6c757d', fontSize: 'var(--font-size-xs)' }}>
                                                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                                                            </small>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </>
                                )}
                            </Col>
                        </Row>
                    </Tab>
                    
                    <Tab eventKey="transfer" title={
                        <span><FaExchangeAlt className="me-2" />지점 이동</span>
                    }>
                        <Card style={{
                            border: '1px solid #e9ecef',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            overflow: 'hidden'
                        }}>
                            <Card.Header style={{
                                background: '#f8f9fa',
                                borderBottom: '1px solid #e9ecef',
                                padding: '16px 20px'
                            }}>
                                <h5 style={{
                                    margin: 0,
                                    color: '#495057',
                                    fontSize: 'var(--font-size-base)',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <FaExchangeAlt style={{ marginRight: '8px', color: '#6f42c1' }} />
                                    사용자 지점 이동 관리
                                </h5>
                            </Card.Header>
                            <Card.Body style={{ padding: '20px' }}>
                                <Alert variant="info" style={{
                                    marginBottom: '24px',
                                    borderRadius: '8px',
                                    border: '1px solid #b8daff',
                                    background: '#d1ecf1',
                                    color: '#0c5460'
                                }}>
                                    <strong>지점 이동 기능 사용법</strong><br />
                                    1. "지점 목록" 탭에서 원하는 지점을 선택하세요<br />
                                    2. 이동할 사용자들을 체크박스로 선택하세요<br />
                                    3. "지점 이동" 버튼을 클릭하여 대상 지점을 선택하고 이동하세요
                                </Alert>
                                
                                {selectedUsers.length > 0 ? (
                                    <Row>
                                        <Col md={6}>
                                            <Alert variant="success" style={{
                                                borderRadius: '8px',
                                                border: '1px solid #c3e6cb',
                                                background: '#d4edda',
                                                color: '#155724'
                                            }}>
                                                <h6 style={{
                                                    margin: '0 0 8px 0',
                                                    fontSize: 'var(--font-size-sm)',
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}>
                                                    <FaUsers style={{ marginRight: '8px' }} />
                                                    선택된 사용자
                                                </h6>
                                                <strong>{selectedUsers.length}명</strong>의 사용자가 선택되었습니다.
                                            </Alert>
                                        </Col>
                                        <Col md={6}>
                                            <div style={{ display: 'grid' }}>
                                                <Button 
                                                    variant="primary" 
                                                    size="lg"
                                                    onClick={() => setShowTransferModal(true)}
                                                    style={{
                                                        borderRadius: '8px',
                                                        fontSize: 'var(--font-size-base)',
                                                        padding: '12px 24px',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    <FaExchangeAlt style={{ marginRight: '8px' }} />
                                                    {selectedUsers.length}명 지점 이동
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                ) : (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '40px 20px'
                                    }}>
                                        <FaUsers style={{
                                            marginBottom: '16px',
                                            color: '#6c757d',
                                            fontSize: '3rem'
                                        }} />
                                        <h5 style={{
                                            color: '#6c757d',
                                            marginBottom: '12px',
                                            fontSize: 'var(--font-size-lg)'
                                        }}>
                                            이동할 사용자를 선택해주세요
                                        </h5>
                                        <p style={{
                                            color: '#6c757d',
                                            marginBottom: '20px',
                                            fontSize: 'var(--font-size-sm)'
                                        }}>
                                            "지점 목록" 탭에서 지점을 선택하고 사용자를 체크한 후<br />
                                            다시 이 탭으로 돌아오시면 이동 기능을 사용할 수 있습니다.
                                        </p>
                                        <Button 
                                            variant="outline-primary" 
                                            onClick={() => setActiveTab('branches')}
                                            style={{
                                                borderRadius: '8px',
                                                fontSize: 'var(--font-size-sm)',
                                                padding: '8px 16px'
                                            }}
                                        >
                                            <FaBuilding style={{ marginRight: '8px' }} />
                                            지점 목록으로 이동
                                        </Button>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Tab>
                </Tabs>
                
                {/* 지점 이동 모달 */}
                <Modal show={showTransferModal} onHide={() => setShowTransferModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>
                            <FaExchangeAlt className="me-2" />
                            사용자 지점 이동
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Alert variant="warning">
                            <strong>{selectedUsers.length}명의 사용자</strong>를 다른 지점으로 이동합니다.
                        </Alert>
                        
                        <Form>
                            <Row>
                                <Col md={6}>
                                    <Form.Label>대상 지점</Form.Label>
                                    <FormSelect
                                        value={transferForm.targetBranchCode}
                                        onChange={(e) => setTransferForm(prev => ({
                                            ...prev,
                                            targetBranchCode: e.target.value
                                        }))}
                                        required
                                    >
                                        <option value="">지점을 선택하세요</option>
                                        {branches
                                            .filter(branch => branch.branchCode !== selectedBranch?.branchCode)
                                            .map(branch => (
                                                <option key={branch.id} value={branch.branchCode}>
                                                    {branch.branchName} ({branch.branchCode})
                                                </option>
                                            ))
                                        }
                                    </FormSelect>
                                </Col>
                                <Col md={6}>
                                    <Form.Label>이동 사유</Form.Label>
                                    <FormControl
                                        type="text"
                                        placeholder="이동 사유를 입력하세요 (선택사항)"
                                        value={transferForm.reason}
                                        onChange={(e) => setTransferForm(prev => ({
                                            ...prev,
                                            reason: e.target.value
                                        }))}
                                    />
                                </Col>
                            </Row>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowTransferModal(false)}>
                            취소
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleBulkTransfer}
                            disabled={!transferForm.targetBranchCode}
                        >
                            <FaExchangeAlt className="me-2" />
                            이동 실행
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* 지점 등록 모달 */}
                <BranchRegistrationModal
                    show={showBranchRegistrationModal}
                    onHide={() => setShowBranchRegistrationModal(false)}
                    onBranchAdded={handleBranchAdded}
                />
                </Container>
            </div>
        </SimpleLayout>
    );
};

export default BranchManagement;
