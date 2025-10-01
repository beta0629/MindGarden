import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { useNavigate } from 'react-router-dom';
import './ConsultantRecords.css';
import SimpleLayout from '../layout/SimpleLayout';

const ConsultantRecords = () => {
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('COMPLETED');
  const [statusOptions, setStatusOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  // 상태 코드 로드
  const loadStatusCodes = useCallback(async () => {
    try {
      setLoadingCodes(true);
      const response = await apiGet('/api/common-codes/group/STATUS');
      if (response && response.length > 0) {
        // 상담기록에 적합한 상태만 필터링
        const consultationStatuses = response.filter(code => 
          ['COMPLETED', 'PENDING'].includes(code.codeValue)
        );
        
        // 전체 옵션을 맨 앞에 추가
        const allOptions = [
          { value: 'ALL', label: '전체', icon: '📋', color: '#6b7280', description: '모든 상담기록' },
          ...consultationStatuses.map(code => ({
            value: code.codeValue,
            label: code.codeLabel,
            icon: code.icon || (code.codeValue === 'COMPLETED' ? '✅' : '⏳'),
            color: code.colorCode || (code.codeValue === 'COMPLETED' ? '#10b981' : '#ffc107'),
            description: code.description || `${code.codeLabel}된 상담기록`
          }))
        ];
        
        setStatusOptions(allOptions);
      }
    } catch (error) {
      console.error('상태 코드 로드 실패:', error);
      // 실패 시 기본값 설정 (상담기록에 맞는 상태)
      setStatusOptions([
        { value: 'ALL', label: '전체', icon: '📋', color: '#6b7280', description: '모든 상담기록' },
        { value: 'COMPLETED', label: '완료', icon: '✅', color: '#10b981', description: '완료된 상담기록' },
        { value: 'PENDING', label: '대기', icon: '⏳', color: '#ffc107', description: '대기 중인 상담기록' }
      ]);
    } finally {
      setLoadingCodes(false);
    }
  }, []);

  // 데이터 로드
  useEffect(() => {
    console.log('🔄 상담기록 useEffect 실행:', {
      sessionLoading,
      isLoggedIn,
      userId: user?.id,
      userRole: user?.role
    });
    
    if (!sessionLoading && isLoggedIn && user?.id) {
      console.log('✅ 조건 만족 - 데이터 로드 시작');
      loadRecords();
      loadStatusCodes();
    } else {
      console.log('❌ 조건 불만족 - 데이터 로드 건너뜀');
    }
  }, [sessionLoading, isLoggedIn, user?.id, loadStatusCodes]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('👤 상담사 상담 기록 로드:', user?.id);
      
      // 사용자 ID 확인
      if (!user?.id) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      // 상담사의 상담 기록 가져오기
      const response = await apiGet(`/api/consultant/${user.id}/consultation-records`);
      
      if (response.success) {
        console.log('✅ 상담 기록 로드 성공:', response.data);
        console.log('📊 상담 기록 데이터 구조:', response.data?.map(record => ({
          id: record.id,
          title: record.title,
          isSessionCompleted: record.isSessionCompleted,
          status: record.status,
          consultationDate: record.consultationDate
        })));
        setRecords(response.data || []);
      } else {
        console.error('❌ 상담 기록 로드 실패:', response.message);
        setError(response.message || '상담 기록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 상담 기록 로드 중 오류:', err);
      
      // 더 구체적인 오류 메시지 제공
      let errorMessage = '상담 기록을 불러오는 중 오류가 발생했습니다.';
      
      if (err.response?.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (err.response?.status === 403) {
        errorMessage = '접근 권한이 없습니다.';
      } else if (err.response?.status === 404) {
        errorMessage = '상담 기록을 찾을 수 없습니다.';
      } else if (err.response?.status >= 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (err.message) {
        errorMessage = `오류: ${err.message}`;
      }
      
      setError(errorMessage);
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
    
    return matchesSearch && matchesStatus;
  });

  // 상담 기록 상세 보기
  const handleViewRecord = (recordId) => {
    navigate(`/consultant/consultation-record-view/${recordId}`);
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
      <SimpleLayout title="상담 기록">
        <div className="consultant-records-loading">
          <div className="spinner-border text-primary consultant-records-spinner" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </div>
          <p className="consultant-records-loading-text">세션 정보를 불러오는 중...</p>
        </div>
      </SimpleLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <SimpleLayout title="상담 기록">
        <div className="consultant-records-login-required">
          <h3>로그인이 필요합니다.</h3>
          <p>상담 기록을 보려면 로그인해주세요.</p>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="상담 기록">
      <div className="consultant-records-container">
      {/* 헤더 */}
      <div className="records-header">
        <h1 className="records-title">
          <i className="bi bi-journal-text"></i>
          상담 기록 조회
        </h1>
        <p className="records-subtitle">
          작성된 상담 기록들을 확인할 수 있습니다. 상담 기록 작성은 일정 관리에서 가능합니다.
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
          <button 
            className="btn btn-outline-primary" 
            onClick={() => {
              console.log('🔄 재시도 버튼 클릭');
              loadRecords();
            }}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'spinning' : ''}`}></i>
            {loading ? '로딩 중...' : '다시 시도'}
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
              <p>아직 작성된 상담 기록이 없습니다. 상담 기록은 일정 관리에서 작성할 수 있습니다.</p>
              <button 
                className="btn btn-outline-primary"
                onClick={() => navigate('/consultant/schedule')}
                className="consultant-records-empty-button"
              >
                <i className="bi bi-calendar"></i>
                일정 관리로 이동
              </button>
            </div>
          ) : (
            <div className="records-grid">
              {filteredRecords.map((record) => (
                <div key={record.id} className="record-card">
                  <div className="record-card-header">
                    <div className="record-status">
                      <span 
                        className="status-badge"
                        data-status-color={getStatusColor(record.status)}
                      >
                        {getStatusLabel(record.status)}
                      </span>
                      {record.isSessionCompleted && (
                        <span className="completion-badge completion-badge-completed">
                          <i className="bi bi-check-circle"></i>
                          완료
                        </span>
                      )}
                    </div>
                    <div className="record-date">
                      <i className="bi bi-calendar-check record-date-icon"></i>
                      {record.consultationDate ? (() => {
                        try {
                          const date = new Date(record.consultationDate);
                          if (isNaN(date.getTime())) {
                            return record.consultationDate; // 파싱 실패 시 원본 문자열 반환
                          }
                          return date.toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short'
                          });
                        } catch (error) {
                          console.error('날짜 파싱 오류:', error);
                          return record.consultationDate; // 오류 시 원본 문자열 반환
                        }
                      })() : '날짜 정보 없음'}
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
                        {record.startTime && record.endTime ? (() => {
                          try {
                            const startTime = record.startTime.includes('T') ? 
                              record.startTime.split('T')[1]?.slice(0,5) : 
                              record.startTime;
                            const endTime = record.endTime.includes('T') ? 
                              record.endTime.split('T')[1]?.slice(0,5) : 
                              record.endTime;
                            return `${startTime || '00:00'} - ${endTime || '00:00'}`;
                          } catch (error) {
                            console.error('시간 파싱 오류:', error);
                            return '시간 정보 없음';
                          }
                        })() : '시간 정보 없음'}
                      </span>
                    </div>
                    <div className="record-notes">
                      <p>{record.notes?.substring(0, 100) || '메모 없음'}</p>
                      {record.notes && record.notes.length > 100 && <span>...</span>}
                    </div>
                  </div>
                  
                  <div className="record-card-footer">
                    {record.isSessionCompleted ? (
                      <button
                        className="mg-btn mg-btn--outline mg-btn--primary mg-btn--sm consultant-record-view-btn"
                        onClick={() => handleViewRecord(record.id)}
                      >
                        <i className="bi bi-eye"></i>
                        상담일지 조회
                      </button>
                    ) : (
                      <button
                        className="mg-btn mg-btn--primary mg-btn--sm consultant-record-detail-btn"
                        onClick={() => navigate(`/consultant/consultation-record/${record.id}`)}
                      >
                        <i className="bi bi-pencil-square"></i>
                        상담일지 작성
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </SimpleLayout>
  );
};

export default ConsultantRecords;
