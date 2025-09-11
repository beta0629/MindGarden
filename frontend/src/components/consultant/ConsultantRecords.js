import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../../hooks/useSession';
import { apiGet } from '../../utils/ajax';
import { useNavigate } from 'react-router-dom';
import './ConsultantRecords.css';

const ConsultantRecords = () => {
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [statusOptions, setStatusOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  // 상태 코드 로드
  const loadStatusCodes = useCallback(async () => {
    try {
      setLoadingCodes(true);
      const response = await apiGet('/api/admin/common-codes/values?groupCode=STATUS');
      if (response && response.length > 0) {
        setStatusOptions(response.map(code => ({
          value: code.codeValue,
          label: code.codeLabel,
          icon: code.icon,
          color: code.colorCode,
          description: code.description
        })));
      }
    } catch (error) {
      console.error('상태 코드 로드 실패:', error);
      // 실패 시 기본값 설정
      setStatusOptions([
        { value: 'ALL', label: '전체 상태', icon: '📋', color: '#6b7280', description: '모든 상태' },
        { value: 'COMPLETED', label: '완료', icon: '✅', color: '#10b981', description: '완료된 상태' }
      ]);
    } finally {
      setLoadingCodes(false);
    }
  }, []);

  // 데이터 로드
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadRecords();
      loadStatusCodes();
    }
  }, [isLoggedIn, user?.id, loadStatusCodes]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('👤 상담사 상담 기록 로드:', user.id);

      // 상담사의 상담 기록 가져오기
      const response = await apiGet(`/api/consultant/${user.id}/consultation-records`);
      
      if (response.success) {
        console.log('✅ 상담 기록 로드 성공:', response.data);
        setRecords(response.data || []);
      } else {
        console.error('❌ 상담 기록 로드 실패:', response.message);
        setError(response.message || '상담 기록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 상담 기록 로드 중 오류:', err);
      setError('상담 기록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 필터링
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || record.status === filterStatus;
    
    const matchesDate = !filterDate || record.consultationDate?.startsWith(filterDate);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // 상담 기록 상세 보기
  const handleViewRecord = (recordId) => {
    navigate(`/consultant/consultation-record/${recordId}`);
  };

  // 상태별 색상 반환
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return '#28a745';
      case 'IN_PROGRESS':
        return '#ffc107';
      case 'CANCELLED':
        return '#dc3545';
      case 'PENDING':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  // 상태별 라벨 반환
  const getStatusLabel = (status) => {
    switch (status) {
      case 'COMPLETED':
        return '완료';
      case 'IN_PROGRESS':
        return '진행중';
      case 'CANCELLED':
        return '취소';
      case 'PENDING':
        return '대기';
      default:
        return '알 수 없음';
    }
  };

  if (sessionLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h3>로그인이 필요합니다.</h3>
      </div>
    );
  }

  return (
    <div className="consultant-records-container">
      {/* 헤더 */}
      <div className="records-header">
        <h1 className="records-title">
          <i className="bi bi-journal-text"></i>
          상담 기록 관리
        </h1>
        <p className="records-subtitle">
          작성한 상담 기록들을 확인하고 관리할 수 있습니다.
        </p>
      </div>

      {/* 검색 및 필터 */}
      <div className="records-controls">
        <div className="search-section">
          <div className="search-input-group">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="내담자명, 제목, 내용으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="filter-section">
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="date-filter-section">
          <input
            type="date"
            className="date-filter-input"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </div>
          <p>상담 기록을 불러오는 중...</p>
        </div>
      )}

      {/* 오류 상태 */}
      {error && (
        <div className="error-container">
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            {error}
          </div>
          <button className="btn btn-outline-primary" onClick={loadRecords}>
            <i className="bi bi-arrow-clockwise"></i>
            다시 시도
          </button>
        </div>
      )}

      {/* 상담 기록 목록 */}
      {!loading && !error && (
        <div className="records-content">
          {filteredRecords.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-journal"></i>
              <h3>상담 기록이 없습니다</h3>
              <p>아직 작성된 상담 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="records-grid">
              {filteredRecords.map((record) => (
                <div key={record.id} className="record-card">
                  <div className="record-card-header">
                    <div className="record-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(record.status) }}
                      >
                        {getStatusLabel(record.status)}
                      </span>
                    </div>
                    <div className="record-date">
                      {new Date(record.consultationDate).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  
                  <div className="record-card-body">
                    <h3 className="record-title">{record.title || '제목 없음'}</h3>
                    <div className="record-client">
                      <i className="bi bi-person"></i>
                      <span>{record.clientName || '미지정'}</span>
                    </div>
                    <div className="record-time">
                      <i className="bi bi-clock"></i>
                      <span>
                        {record.startTime?.split('T')[1]?.slice(0,5)} - {record.endTime?.split('T')[1]?.slice(0,5)}
                      </span>
                    </div>
                    <div className="record-notes">
                      <p>{record.notes?.substring(0, 100) || '메모 없음'}</p>
                      {record.notes && record.notes.length > 100 && <span>...</span>}
                    </div>
                  </div>
                  
                  <div className="record-card-footer">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleViewRecord(record.id)}
                    >
                      <i className="bi bi-eye"></i>
                      상세보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsultantRecords;
