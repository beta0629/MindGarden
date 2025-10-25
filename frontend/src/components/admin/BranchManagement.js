import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import notificationManager from '../../utils/notification';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/css';
import { MESSAGES } from '../../constants/messages';
import { Modal } from '../common/Modal';
import { LoadingBar } from '../common/LoadingBar';
import { showAlert } from '../../utils/alert';
import { useSession } from '../../contexts/SessionContext';
import { getDashboardPath } from '../../utils/session';
import csrfTokenManager from '../../utils/csrfTokenManager';
import './BranchManagement.css';

/**
 * 지점 관리 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */
const BranchManagement = () => {
    const navigate = useNavigate();
    const { user, hasPermission } = useSession();
    
    // === 권한 체크 ===
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        // 동적 권한 시스템으로 지점 관리 권한 확인
        const checkBranchManagementPermission = async () => {
            const hasPermissionResult = await hasPermission('MANAGE_BRANCH');
            
            if (!hasPermissionResult) {
                showAlert('접근 권한이 없습니다.', 'error');
                navigate(getDashboardPath(user?.role || 'ADMIN'));
                return;
            }
        };
        
        checkBranchManagementPermission();
    }, [user, navigate]);
    
    // 권한이 없는 경우 로딩 표시
    if (!user || (user.role !== 'HQ_ADMIN' && user.role !== 'SUPER_HQ_ADMIN')) {
        return <LoadingBar />;
    }
    
    // === 상태 관리 ===
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterType, setFilterType] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [sortBy, setSortBy] = useState('branchName');
    const [sortDirection, setSortDirection] = useState('asc');

    // === 상수 정의 ===
    const BRANCH_STATUS = {
        PLANNING: '계획중',
        PREPARING: '준비중',
        ACTIVE: '운영중',
        SUSPENDED: '일시정지',
        CLOSED: '폐점'
    };

    const BRANCH_TYPE = {
        MAIN: '본점',
        FRANCHISE: '가맹점',
        DIRECT: '직영점',
        PARTNER: '제휴점'
    };

    const PAGE_SIZE = 10;

    // === 초기 로딩 ===
    useEffect(() => {
        loadBranches();
    }, [currentPage, sortBy, sortDirection, filterStatus, filterType]);

    // === API 호출 함수들 ===
    
    /**
     * 지점 목록 조회
     */
    const loadBranches = async () => {
        try {
            setLoading(true);
            setError(null);

            let url = `${API_ENDPOINTS.BRANCHES}?page=${currentPage}&size=${PAGE_SIZE}&sort=${sortBy},${sortDirection}`;
            
            // 필터 조건 추가
            if (filterStatus !== 'ALL') {
                url += `&status=${filterStatus}`;
            }
            if (filterType !== 'ALL') {
                url += `&type=${filterType}`;
            }
            if (searchKeyword.trim()) {
                url = `${API_ENDPOINTS.BRANCHES}/search/paged?keyword=${encodeURIComponent(searchKeyword)}&page=${currentPage}&size=${PAGE_SIZE}&sort=${sortBy},${sortDirection}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('지점 목록을 불러오는데 실패했습니다.');
            }

            const data = await response.json();
            setBranches(data.content || []);
            setTotalPages(data.totalPages || 0);
        } catch (err) {
            console.error('지점 목록 조회 오류:', err);
            setError(err.message);
            showAlert(MESSAGES.ERROR.LOAD_FAILED);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 지점 생성
     */
    const createBranch = async (branchData) => {
        try {
            setLoading(true);

            const response = await csrfTokenManager.post(API_ENDPOINTS.BRANCHES, branchData);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '지점 생성에 실패했습니다.');
            }

            showAlert('지점이 성공적으로 생성되었습니다.', 'success');
            setIsCreateModalOpen(false);
            loadBranches();
        } catch (err) {
            console.error('지점 생성 오류:', err);
            showAlert(err.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 지점 수정
     */
    const updateBranch = async (branchId, branchData) => {
        try {
            setLoading(true);

            const response = await fetch(`${API_ENDPOINTS.BRANCHES}/${branchId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(branchData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '지점 수정에 실패했습니다.');
            }

            showAlert('지점이 성공적으로 수정되었습니다.', 'success');
            setIsEditModalOpen(false);
            loadBranches();
        } catch (err) {
            console.error('지점 수정 오류:', err);
            showAlert(err.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 지점 삭제
     */
    const deleteBranch = async (branchId) => {
        const confirmed = await new Promise((resolve) => {
      notificationManager.confirm('정말로 이 지점을 삭제하시겠습니까?', resolve);
    });
    if (!confirmed) {
        return;
    }

        try {
            setLoading(true);

            const response = await fetch(`${API_ENDPOINTS.BRANCHES}/${branchId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('지점 삭제에 실패했습니다.');
            }

            showAlert('지점이 성공적으로 삭제되었습니다.', 'success');
            loadBranches();
        } catch (err) {
            console.error('지점 삭제 오류:', err);
            showAlert(err.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 지점 상태 변경
     */
    const changeBranchStatus = async (branchId, newStatus) => {
        try {
            setLoading(true);

            const response = await fetch(`${API_ENDPOINTS.BRANCHES}/${branchId}/status/${newStatus}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('지점 상태 변경에 실패했습니다.');
            }

            showAlert('지점 상태가 성공적으로 변경되었습니다.', 'success');
            loadBranches();
        } catch (err) {
            console.error('지점 상태 변경 오류:', err);
            showAlert(err.message);
        } finally {
            setLoading(false);
        }
    };

    // === 이벤트 핸들러 ===

    const handleSearch = () => {
        setCurrentPage(0);
        loadBranches();
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
        setCurrentPage(0);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleCreateClick = () => {
        setIsCreateModalOpen(true);
    };

    const handleEditClick = (branch) => {
        setSelectedBranch(branch);
        setIsEditModalOpen(true);
    };

    const handleDetailClick = (branch) => {
        setSelectedBranch(branch);
        setIsDetailModalOpen(true);
    };

    const handleStatusChange = (branch, status) => {
        changeBranchStatus(branch.id, status);
    };

    // === 렌더링 ===

    return (
        <div className="branch-management">
            <div className="branch-management-header">
                <h2>지점 관리</h2>
                <MGButton variant="primary" className="btn-primary" onClick={handleCreateClick} disabled={loading}>새 지점 추가
                </MGButton>
            </div>

            {/* 검색 및 필터 */}
            <div className="branch-search-section">
                <div className="search-filters">
                    <div className="search-input-group">
                        <input
                            type="text"
                            placeholder="지점명 또는 주소로 검색..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="search-input"
                        />
                        <button 
                            onClick={handleSearch} 
                            className="search-button"
                            disabled={loading}
                        >
                            검색
                        </button>
                    </div>

                    <div className="filter-group">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="filter-select"
                        >
                            <option value="ALL">모든 상태</option>
                            {Object.entries(BRANCH_STATUS).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="filter-select"
                        >
                            <option value="ALL">모든 유형</option>
                            {Object.entries(BRANCH_TYPE).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading && <LoadingBar />}

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={loadBranches} className="retry-button">
                        다시 시도
                    </button>
                </div>
            )}

            {/* 지점 목록 테이블 */}
            <div className="branch-table-container">
                <table className="branch-table mg-v2-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('branchCode')} className="sortable">
                                지점코드 {sortBy === 'branchCode' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('branchName')} className="sortable">
                                지점명 {sortBy === 'branchName' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('branchType')} className="sortable">
                                유형 {sortBy === 'branchType' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('branchStatus')} className="sortable">
                                상태 {sortBy === 'branchStatus' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>주소</th>
                            <th>연락처</th>
                            <th>지점장</th>
                            <th>상담사/내담자</th>
                            <th>액션</th>
                        </tr>
                    </thead>
                    <tbody>
                        {branches.map((branch) => (
                            <tr key={branch.id}>
                                <td data-label="지점코드">{branch.branchCode}</td>
                                <td data-label="지점명">
                                    <span 
                                        className="branch-name-link"
                                        onClick={() => handleDetailClick(branch)}
                                    >
                                        {branch.branchName}
                                    </span>
                                </td>
                                <td data-label="유형">
                                    <span className={`branch-type-badge ${branch.branchType.toLowerCase()}`}>
                                        {BRANCH_TYPE[branch.branchType]}
                                    </span>
                                </td>
                                <td data-label="상태">
                                    <span className={`branch-status-badge ${branch.branchStatus.toLowerCase()}`}>
                                        {BRANCH_STATUS[branch.branchStatus]}
                                    </span>
                                </td>
                                <td data-label="주소">{branch.fullAddress || '-'}</td>
                                <td data-label="연락처">{branch.phoneNumber || '-'}</td>
                                <td data-label="지점장">{branch.managerName || '미지정'}</td>
                                <td data-label="상담사/내담자">
                                    {branch.currentConsultants || 0} / {branch.currentClients || 0}
                                </td>
                                <td data-label="액션">
                                    <div className="action-buttons">
                                        <button 
                                            onClick={() => handleEditClick(branch)}
                                            className="btn-edit"
                                            title="수정"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            onClick={() => deleteBranch(branch.id)}
                                            className="btn-delete"
                                            title="삭제"
                                        >
                                            🗑️
                                        </button>
                                        <select
                                            value={branch.branchStatus}
                                            onChange={(e) => handleStatusChange(branch, e.target.value)}
                                            className="status-select"
                                            title="상태 변경"
                                        >
                                            {Object.entries(BRANCH_STATUS).map(([key, value]) => (
                                                <option key={key} value={key}>{value}</option>
                                            ))}
                                        </select>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0 || loading}
                        className="pagination-button"
                    >
                        이전
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i).map((page) => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`pagination-button ${page === currentPage ? 'active' : ''}`}
                            disabled={loading}
                        >
                            {page + 1}
                        </button>
                    ))}
                    
                    <button 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages - 1 || loading}
                        className="pagination-button"
                    >
                        다음
                    </button>
                </div>
            )}

            {/* 지점 생성 모달 */}
            {isCreateModalOpen && (
                <BranchCreateModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSubmit={createBranch}
                />
            )}

            {/* 지점 수정 모달 */}
            {isEditModalOpen && selectedBranch && (
                <BranchEditModal
                    isOpen={isEditModalOpen}
                    branch={selectedBranch}
                    onClose={() => setIsEditModalOpen(false)}
                    onSubmit={(data) => updateBranch(selectedBranch.id, data)}
                />
            )}

            {/* 지점 상세 모달 */}
            {isDetailModalOpen && selectedBranch && (
                <BranchDetailModal
                    isOpen={isDetailModalOpen}
                    branch={selectedBranch}
                    onClose={() => setIsDetailModalOpen(false)}
                />
            )}
        </div>
    );
};

/**
 * 지점 생성 모달 컴포넌트
 */
const BranchCreateModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        branchCode: '',
        branchName: '',
        branchType: 'FRANCHISE',
        postalCode: '',
        address: '',
        addressDetail: '',
        phoneNumber: '',
        faxNumber: '',
        email: '',
        operatingStartTime: '09:00',
        operatingEndTime: '18:00',
        maxConsultants: 10,
        maxClients: 100,
        description: ''
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // 에러 초기화
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.branchCode.trim()) {
            newErrors.branchCode = '지점 코드는 필수입니다.';
        }
        if (!formData.branchName.trim()) {
            newErrors.branchName = '지점명은 필수입니다.';
        }
        if (formData.phoneNumber && !/^\d{2,3}-\d{3,4}-\d{4}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = '올바른 전화번호 형식이 아닙니다.';
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '올바른 이메일 형식이 아닙니다.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="새 지점 추가"
            size="large"
        >
            <form onSubmit={handleSubmit} className="branch-form">
                <div className="form-row">
                    <div className="form-group">
                        <label>지점 코드 *</label>
                        <input
                            type="text"
                            name="branchCode"
                            value={formData.branchCode}
                            onChange={handleChange}
                            className={errors.branchCode ? 'error' : ''}
                            placeholder="예: BR001"
                            maxLength="10"
                        />
                        {errors.branchCode && <span className="error-text">{errors.branchCode}</span>}
                    </div>
                    
                    <div className="form-group">
                        <label>지점명 *</label>
                        <input
                            type="text"
                            name="branchName"
                            value={formData.branchName}
                            onChange={handleChange}
                            className={errors.branchName ? 'error' : ''}
                            placeholder="지점명을 입력하세요"
                            maxLength="100"
                        />
                        {errors.branchName && <span className="error-text">{errors.branchName}</span>}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>지점 유형 *</label>
                        <select
                            name="branchType"
                            value={formData.branchType}
                            onChange={handleChange}
                        >
                            <option value="MAIN">본점</option>
                            <option value="FRANCHISE">가맹점</option>
                            <option value="DIRECT">직영점</option>
                            <option value="PARTNER">제휴점</option>
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>우편번호</label>
                        <input
                            type="text"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleChange}
                            placeholder="12345"
                            maxLength="5"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>주소</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="기본 주소를 입력하세요"
                            maxLength="200"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>상세 주소</label>
                        <input
                            type="text"
                            name="addressDetail"
                            value={formData.addressDetail}
                            onChange={handleChange}
                            placeholder="상세 주소를 입력하세요"
                            maxLength="100"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>전화번호</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className={errors.phoneNumber ? 'error' : ''}
                            placeholder="02-1234-5678"
                        />
                        {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
                    </div>
                    
                    <div className="form-group">
                        <label>팩스번호</label>
                        <input
                            type="text"
                            name="faxNumber"
                            value={formData.faxNumber}
                            onChange={handleChange}
                            placeholder="02-1234-5679"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>이메일</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'error' : ''}
                            placeholder="branch@example.com"
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>운영 시작 시간</label>
                        <input
                            type="time"
                            name="operatingStartTime"
                            value={formData.operatingStartTime}
                            onChange={handleChange}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>운영 종료 시간</label>
                        <input
                            type="time"
                            name="operatingEndTime"
                            value={formData.operatingEndTime}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>최대 상담사 수</label>
                        <input
                            type="number"
                            name="maxConsultants"
                            value={formData.maxConsultants}
                            onChange={handleChange}
                            min="1"
                            max="100"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>최대 내담자 수</label>
                        <input
                            type="number"
                            name="maxClients"
                            value={formData.maxClients}
                            onChange={handleChange}
                            min="1"
                            max="1000"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>지점 설명</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            placeholder="지점에 대한 설명을 입력하세요"
                            maxLength="1000"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={onClose} className="btn-cancel">
                        취소
                    </button>
                    <button type="submit" className="btn-primary">
                        생성
                    </button>
                </div>
            </form>
        </Modal>
    );
};

/**
 * 지점 수정 모달 컴포넌트 (생성 모달과 유사하지만 기존 데이터로 초기화)
 */
const BranchEditModal = ({ isOpen, branch, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        branchName: branch?.branchName || '',
        branchType: branch?.branchType || 'FRANCHISE',
        postalCode: branch?.postalCode || '',
        address: branch?.address || '',
        addressDetail: branch?.addressDetail || '',
        phoneNumber: branch?.phoneNumber || '',
        faxNumber: branch?.faxNumber || '',
        email: branch?.email || '',
        operatingStartTime: branch?.operatingStartTime || '09:00',
        operatingEndTime: branch?.operatingEndTime || '18:00',
        maxConsultants: branch?.maxConsultants || 10,
        maxClients: branch?.maxClients || 100,
        description: branch?.description || ''
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.branchName.trim()) {
            newErrors.branchName = '지점명은 필수입니다.';
        }
        if (formData.phoneNumber && !/^\d{2,3}-\d{3,4}-\d{4}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = '올바른 전화번호 형식이 아닙니다.';
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '올바른 이메일 형식이 아닙니다.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="지점 정보 수정"
            size="large"
        >
            <form onSubmit={handleSubmit} className="branch-form">
                {/* 지점 코드는 수정 불가 */}
                <div className="form-row">
                    <div className="form-group">
                        <label>지점 코드</label>
                        <input
                            type="text"
                            value={branch?.branchCode || ''}
                            disabled
                            className="disabled"
                        />
                        <small className="form-help">지점 코드는 수정할 수 없습니다.</small>
                    </div>
                    
                    <div className="form-group">
                        <label>지점명 *</label>
                        <input
                            type="text"
                            name="branchName"
                            value={formData.branchName}
                            onChange={handleChange}
                            className={errors.branchName ? 'error' : ''}
                            placeholder="지점명을 입력하세요"
                            maxLength="100"
                        />
                        {errors.branchName && <span className="error-text">{errors.branchName}</span>}
                    </div>
                </div>

                {/* 나머지 필드는 생성 모달과 동일 */}
                <div className="form-row">
                    <div className="form-group">
                        <label>지점 유형 *</label>
                        <select
                            name="branchType"
                            value={formData.branchType}
                            onChange={handleChange}
                        >
                            <option value="MAIN">본점</option>
                            <option value="FRANCHISE">가맹점</option>
                            <option value="DIRECT">직영점</option>
                            <option value="PARTNER">제휴점</option>
                        </select>
                    </div>
                </div>

                {/* 주소 관련 필드들 */}
                <div className="form-row">
                    <div className="form-group">
                        <label>우편번호</label>
                        <input
                            type="text"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleChange}
                            placeholder="12345"
                            maxLength="5"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>주소</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="기본 주소를 입력하세요"
                            maxLength="200"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>상세 주소</label>
                        <input
                            type="text"
                            name="addressDetail"
                            value={formData.addressDetail}
                            onChange={handleChange}
                            placeholder="상세 주소를 입력하세요"
                            maxLength="100"
                        />
                    </div>
                </div>

                {/* 연락처 필드들 */}
                <div className="form-row">
                    <div className="form-group">
                        <label>전화번호</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className={errors.phoneNumber ? 'error' : ''}
                            placeholder="02-1234-5678"
                        />
                        {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
                    </div>
                    
                    <div className="form-group">
                        <label>팩스번호</label>
                        <input
                            type="text"
                            name="faxNumber"
                            value={formData.faxNumber}
                            onChange={handleChange}
                            placeholder="02-1234-5679"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>이메일</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'error' : ''}
                            placeholder="branch@example.com"
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>
                </div>

                {/* 운영시간 필드들 */}
                <div className="form-row">
                    <div className="form-group">
                        <label>운영 시작 시간</label>
                        <input
                            type="time"
                            name="operatingStartTime"
                            value={formData.operatingStartTime}
                            onChange={handleChange}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>운영 종료 시간</label>
                        <input
                            type="time"
                            name="operatingEndTime"
                            value={formData.operatingEndTime}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* 수용인원 필드들 */}
                <div className="form-row">
                    <div className="form-group">
                        <label>최대 상담사 수</label>
                        <input
                            type="number"
                            name="maxConsultants"
                            value={formData.maxConsultants}
                            onChange={handleChange}
                            min="1"
                            max="100"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>최대 내담자 수</label>
                        <input
                            type="number"
                            name="maxClients"
                            value={formData.maxClients}
                            onChange={handleChange}
                            min="1"
                            max="1000"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>지점 설명</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            placeholder="지점에 대한 설명을 입력하세요"
                            maxLength="1000"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={onClose} className="btn-cancel">
                        취소
                    </button>
                    <button type="submit" className="btn-primary">
                        수정
                    </button>
                </div>
            </form>
        </Modal>
    );
};

/**
 * 지점 상세 정보 모달 컴포넌트
 */
const BranchDetailModal = ({ isOpen, branch, onClose }) => {
    const BRANCH_STATUS = {
        PLANNING: '계획중',
        PREPARING: '준비중',
        ACTIVE: '운영중',
        SUSPENDED: '일시정지',
        CLOSED: '폐점'
    };

    const BRANCH_TYPE = {
        MAIN: '본점',
        FRANCHISE: '가맹점',
        DIRECT: '직영점',
        PARTNER: '제휴점'
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="지점 상세 정보"
            size="large"
        >
            <div className="branch-detail">
                <div className="detail-section">
                    <h3>기본 정보</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>지점 코드</label>
                            <span>{branch?.branchCode}</span>
                        </div>
                        <div className="detail-item">
                            <label>지점명</label>
                            <span>{branch?.branchName}</span>
                        </div>
                        <div className="detail-item">
                            <label>지점 유형</label>
                            <span className={`branch-type-badge ${branch?.branchType?.toLowerCase()}`}>
                                {BRANCH_TYPE[branch?.branchType]}
                            </span>
                        </div>
                        <div className="detail-item">
                            <label>상태</label>
                            <span className={`branch-status-badge ${branch?.branchStatus?.toLowerCase()}`}>
                                {BRANCH_STATUS[branch?.branchStatus]}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3>연락처 정보</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>전화번호</label>
                            <span>{branch?.phoneNumber || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <label>팩스번호</label>
                            <span>{branch?.faxNumber || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <label>이메일</label>
                            <span>{branch?.email || '-'}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3>주소 정보</h3>
                    <div className="detail-grid">
                        <div className="detail-item full-width">
                            <label>전체 주소</label>
                            <span>{branch?.fullAddress || '-'}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3>운영 정보</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>운영 시간</label>
                            <span>{branch?.operatingHours || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <label>개설일</label>
                            <span>{branch?.openingDate || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <label>지점장</label>
                            <span>{branch?.managerName || '미지정'}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3>수용 현황</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>현재 상담사 수</label>
                            <span>{branch?.currentConsultants || 0} / {branch?.maxConsultants || 0}</span>
                        </div>
                        <div className="detail-item">
                            <label>현재 내담자 수</label>
                            <span>{branch?.currentClients || 0} / {branch?.maxClients || 0}</span>
                        </div>
                        <div className="detail-item">
                            <label>상담사 이용률</label>
                            <span>{branch?.consultantUtilization || 0}%</span>
                        </div>
                        <div className="detail-item">
                            <label>내담자 이용률</label>
                            <span>{branch?.clientUtilization || 0}%</span>
                        </div>
                    </div>
                </div>

                {branch?.description && (
                    <div className="detail-section">
                        <h3>지점 설명</h3>
                        <p className="branch-description">{branch.description}</p>
                    </div>
                )}

                <div className="detail-section">
                    <h3>등록 정보</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>생성일</label>
                            <span>{new Date(branch?.createdAt).toLocaleString('ko-KR')}</span>
                        </div>
                        <div className="detail-item">
                            <label>수정일</label>
                            <span>{new Date(branch?.updatedAt).toLocaleString('ko-KR')}</span>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button onClick={onClose} className="btn-primary">
                        닫기
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default BranchManagement;
