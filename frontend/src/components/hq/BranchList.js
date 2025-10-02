import React, { useState, useEffect, useCallback } from 'react';
import { 
    Container, Row, Col, Card, Button, Badge, 
    InputGroup, FormControl, FormSelect, Alert
} from 'react-bootstrap';
import { 
    FaBuilding, FaSearch, FaFilter, FaPlus, FaEdit, 
    FaEye, FaMapMarkerAlt, FaUsers, FaToggleOn, FaToggleOff
} from 'react-icons/fa';
import { apiGet } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import { normalizeBranchList, getBranchNameByCode } from '../../utils/branchUtils';
import UnifiedLoading from "../common/UnifiedLoading";
import './BranchList.css';

/**
 * 지점 목록 컴포넌트
 * - 지점 목록 조회 및 표시
 * - 지점 상태 필터링 및 검색
 * - 지점 선택 및 상세보기
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const BranchList = ({ 
    onBranchSelect, 
    selectedBranchId, 
    onAddBranch,
    onEditBranch 
}) => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('name');

    // 지점 목록 로드
    const loadBranches = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiGet('/api/hq/branches');
            setBranches(response.data || []);
        } catch (error) {
            console.error('지점 목록 로드 실패:', error);
            showNotification('지점 목록을 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        loadBranches();
    }, [loadBranches]);

    // 필터링된 지점 목록
    const filteredBranches = branches.filter(branch => {
        const matchesSearch = !searchTerm || 
            branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.branchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.address?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || 
            (statusFilter === 'ACTIVE' && branch.isActive) ||
            (statusFilter === 'INACTIVE' && !branch.isActive);
        
        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'code':
                return a.code.localeCompare(b.code);
            case 'createdAt':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'userCount':
                return (b.userCount || 0) - (a.userCount || 0);
            default:
                return 0;
        }
    });

    // 지점 선택 핸들러
    const handleBranchSelect = (branch) => {
        onBranchSelect(branch);
    };

    // 필터 초기화
    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('ALL');
        setSortBy('name');
    };

    return (
        <div className="branch-list">
            {/* 헤더 및 필터 */}
            <Card className="branch-list-header">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-1">
                                <FaBuilding className="me-2" />
                                지점 목록 ({filteredBranches.length}개)
                            </h5>
                            <small className="text-muted">
                                전체 {branches.length}개 지점 중 표시
                            </small>
                        </div>
                        <Button 
                            variant="primary" 
                            size="sm"
                            onClick={onAddBranch}
                            className="branch-add-button"
                        >
                            <FaPlus className="me-1" />
                            지점 추가
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {/* 검색 및 필터 */}
                    <Row className="mb-3">
                        <Col md={4}>
                            <InputGroup size="sm">
                                <InputGroup.Text>
                                    <FaSearch />
                                </InputGroup.Text>
                                <FormControl
                                    placeholder="지점명, 코드, 주소로 검색..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={2}>
                            <FormSelect
                                size="sm"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">모든 상태</option>
                                <option value="ACTIVE">활성</option>
                                <option value="INACTIVE">비활성</option>
                            </FormSelect>
                        </Col>
                        <Col md={2}>
                            <FormSelect
                                size="sm"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="name">이름순</option>
                                <option value="code">코드순</option>
                                <option value="createdAt">등록일순</option>
                                <option value="userCount">사용자수순</option>
                            </FormSelect>
                        </Col>
                        <Col md={2}>
                            <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={resetFilters}
                                className="w-100"
                            >
                                <FaFilter className="me-1" />
                                초기화
                            </Button>
                        </Col>
                        <Col md={2}>
                            <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={loadBranches}
                                className="w-100"
                            >
                                새로고침
                            </Button>
                        </Col>
                    </Row>

                    {/* 검색 결과 안내 */}
                    {searchTerm && (
                        <Alert variant="info" className="py-2">
                            <small>
                                <strong>"{searchTerm}"</strong> 검색 결과: {filteredBranches.length}개 지점
                            </small>
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            {/* 지점 목록 */}
            <Card className="branch-list-content">
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <UnifiedLoading text="지점 목록을 불러오는 중..." size="medium" type="inline" />
                        </div>
                    ) : filteredBranches.length === 0 ? (
                        <div className="text-center py-5">
                            <FaBuilding className="text-muted mb-3 branch-list-empty-icon" />
                            <h6 className="text-muted mb-2">
                                {searchTerm ? '검색 결과가 없습니다' : '등록된 지점이 없습니다'}
                            </h6>
                            <p className="text-muted small mb-3">
                                {searchTerm ? '다른 검색어를 시도해보세요' : '새로운 지점을 등록해보세요'}
                            </p>
                            {!searchTerm && (
                                <Button variant="primary" onClick={onAddBranch}>
                                    <FaPlus className="me-1" />
                                    첫 번째 지점 등록
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="branch-grid">
                            {filteredBranches.map((branch) => (
                                <div 
                                    key={branch.id}
                                    className={`branch-card ${selectedBranchId === branch.id ? 'selected' : ''}`}
                                    onClick={() => handleBranchSelect(branch)}
                                >
                                    <div className="branch-card-header">
                                        <div className="branch-status">
                                            <Badge 
                                                bg={branch.isActive ? 'success' : 'secondary'}
                                                className="branch-status-badge"
                                            >
                                                {branch.isActive ? (
                                                    <>
                                                        <FaToggleOn className="me-1" />
                                                        활성
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaToggleOff className="me-1" />
                                                        비활성
                                                    </>
                                                )}
                                            </Badge>
                                        </div>
                                        <div className="branch-actions">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditBranch(branch);
                                                }}
                                                className="branch-action-btn"
                                            >
                                                <FaEdit />
                                            </Button>
                                            <Button
                                                variant="outline-info"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onBranchSelect(branch);
                                                }}
                                                className="branch-action-btn"
                                            >
                                                <FaEye />
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="branch-card-body">
                                        <h6 className="branch-name">
                                            <FaBuilding className="me-2" />
                                            {branch.branchName}
                                        </h6>
                                        <div className="branch-code">
                                            <FaMapMarkerAlt className="me-1" />
                                            <code>{branch.code}</code>
                                        </div>
                                        {branch.address && (
                                            <div className="branch-address text-muted">
                                                <small>{branch.address}</small>
                                            </div>
                                        )}
                                        
                                        <div className="branch-stats">
                                            <div className="stat-item">
                                                <FaUsers className="me-1" />
                                                <span>{branch.userCount || 0}명</span>
                                            </div>
                                            {branch.consultantCount && (
                                                <div className="stat-item">
                                                    <span className="stat-label">상담사:</span>
                                                    <span>{branch.consultantCount}명</span>
                                                </div>
                                            )}
                                            {branch.clientCount && (
                                                <div className="stat-item">
                                                    <span className="stat-label">내담자:</span>
                                                    <span>{branch.clientCount}명</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="branch-card-footer">
                                        <small className="text-muted">
                                            등록일: {branch.createdAt ? 
                                                new Date(branch.createdAt).toLocaleDateString() : 
                                                '-'
                                            }
                                        </small>
                                        {branch.managerName && (
                                            <small className="text-muted d-block">
                                                지점장: {branch.managerName}
                                            </small>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default BranchList;
