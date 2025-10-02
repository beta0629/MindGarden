/**
 * 스케줄 리스트 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { apiGet } from '../../utils/ajax';
import { SCHEDULE_API } from '../../constants/api';
import UnifiedLoading from './UnifiedLoading';
import CustomSelect from './CustomSelect';
import { 
  SORT_OPTIONS, 
  SORT_OPTION_LABELS, 
  FILTER_OPTIONS, 
  FILTER_OPTION_LABELS,
  PAGINATION,
  PAGINATION_LABELS,
  SCHEDULE_LOADING_STATES,
  SCHEDULE_ERROR_MESSAGES
} from '../../constants/schedule';
import ScheduleCard from './ScheduleCard';
import './ScheduleList.css';

const ScheduleList = ({ 
  userRole = 'ADMIN',
  userId = null, // 기본값 제거, 호출하는 컴포넌트에서 전달해야 함
  onScheduleView,
  onScheduleEdit,
  onScheduleDelete,
  onScheduleConfirm,
  onScheduleCancel,
  onScheduleComplete
}) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.DATE_DESC);
  const [filterBy, setFilterBy] = useState(FILTER_OPTIONS.ALL);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  
  // 필터 옵션 상태
  const [filterOptions, setFilterOptions] = useState([]);
  const [sortOptions, setSortOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  
  // 상담사 필터링 상태
  const [consultants, setConsultants] = useState([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState('');
  const [loadingConsultants, setLoadingConsultants] = useState(false);

  // 필터 옵션 로드
  const loadFilterOptions = useCallback(async () => {
    try {
      setLoadingCodes(true);
      const response = await apiGet('/api/common-codes/group/SCHEDULE_FILTER');
      if (response && response.length > 0) {
        setFilterOptions(response.map(code => ({
          value: code.codeValue,
          label: code.codeLabel,
          icon: code.icon,
          color: code.colorCode,
          description: code.codeDescription
        })));
      }
    } catch (error) {
      console.error('필터 옵션 로드 실패:', error);
      // 실패 시 기본값 설정
      setFilterOptions([
        { value: 'ALL', label: '전체', icon: '📋', color: '#6b7280', description: '모든 일정' },
        { value: 'TODAY', label: '오늘', icon: '📅', color: '#3b82f6', description: '오늘 일정' },
        { value: 'THIS_WEEK', label: '이번 주', icon: '📅', color: '#10b981', description: '이번 주 일정' },
        { value: 'THIS_MONTH', label: '이번 달', icon: '📅', color: '#f59e0b', description: '이번 달 일정' },
        { value: 'UPCOMING', label: '예정된 일정', icon: '⏰', color: '#8b5cf6', description: '예정된 일정' },
        { value: 'COMPLETED', label: '완료된 일정', icon: '✅', color: '#059669', description: '완료된 일정' }
      ]);
    } finally {
      setLoadingCodes(false);
    }
  }, []);

  // 정렬 옵션 로드
  const loadSortOptions = useCallback(async () => {
    try {
      setLoadingCodes(true);
      const response = await apiGet('/api/common-codes/group/SCHEDULE_SORT');
      if (response && response.length > 0) {
        setSortOptions(response.map(code => ({
          value: code.codeValue,
          label: code.codeLabel,
          icon: code.icon,
          color: code.colorCode,
          description: code.codeDescription
        })));
      }
    } catch (error) {
      console.error('정렬 옵션 로드 실패:', error);
      // 실패 시 기본값 설정
      setSortOptions([
        { value: 'DATE_ASC', label: '날짜 오름차순', icon: '📅', color: '#3b82f6', description: '날짜 오름차순 정렬' },
        { value: 'DATE_DESC', label: '날짜 내림차순', icon: '📅', color: '#ef4444', description: '날짜 내림차순 정렬' },
        { value: 'TITLE_ASC', label: '제목 오름차순', icon: '🔤', color: '#10b981', description: '제목 오름차순 정렬' },
        { value: 'TITLE_DESC', label: '제목 내림차순', icon: '🔤', color: '#f59e0b', description: '제목 내림차순 정렬' },
        { value: 'STATUS_ASC', label: '상태 오름차순', icon: '🔄', color: '#8b5cf6', description: '상태 오름차순 정렬' },
        { value: 'STATUS_DESC', label: '상태 내림차순', icon: '🔄', color: '#06b6d4', description: '상태 내림차순 정렬' }
      ]);
    } finally {
      setLoadingCodes(false);
    }
  }, []);

  // 상담사 목록 로드
  const loadConsultants = useCallback(async () => {
    try {
      setLoadingConsultants(true);
      const response = await apiGet('/api/admin/consultants');
      
      if (response && response.success) {
        setConsultants(response.data || []);
      }
    } catch (error) {
      console.error('상담사 목록 로드 실패:', error);
      setConsultants([]);
    } finally {
      setLoadingConsultants(false);
    }
  }, []);

  // 스케줄 데이터 로드
  const loadSchedules = async () => {
    setLoading(true);
    setError(false);
    
    console.log('🔍 ScheduleList 로드 시작:', { userId, userRole, selectedConsultantId });
    
    try {
      let url = SCHEDULE_API.SCHEDULES;
      let params = {
        userId: userId,
        userRole: userRole
      };
      
      // 어드민인 경우 상담사 필터링 지원
      if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN' || userRole === 'BRANCH_BRANCH_SUPER_ADMIN' || 
          userRole === 'BRANCH_MANAGER' || userRole === 'HQ_ADMIN' || userRole === 'SUPER_HQ_ADMIN') {
        url = '/api/admin/schedules';
        params = {};
        
        if (selectedConsultantId) {
          params.consultantId = selectedConsultantId;
        }
      }
      
      const response = await apiGet(url, params);
      
      if (response.success) {
        setSchedules(response.data || []);
        setTotalCount(response.data?.length || 0);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('스케줄 로드 실패:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 스케줄 로드
  useEffect(() => {
    loadSchedules();
    loadFilterOptions();
    loadSortOptions();
    
    // 어드민인 경우 상담사 목록도 로드
    if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN' || userRole === 'BRANCH_BRANCH_SUPER_ADMIN' || 
        userRole === 'BRANCH_MANAGER' || userRole === 'HQ_ADMIN' || userRole === 'SUPER_HQ_ADMIN') {
      loadConsultants();
    }
  }, [userId, userRole, loadFilterOptions, loadSortOptions, loadConsultants]);

  // 상담사 선택 변경 시 스케줄 다시 로드
  useEffect(() => {
    if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN' || userRole === 'BRANCH_BRANCH_SUPER_ADMIN' || 
        userRole === 'BRANCH_MANAGER' || userRole === 'HQ_ADMIN' || userRole === 'SUPER_HQ_ADMIN') {
      loadSchedules();
    }
  }, [selectedConsultantId]);

  // 검색 및 필터링된 스케줄 계산
  const getFilteredSchedules = () => {
    let filtered = [...schedules];

    // 검색어 필터링
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(schedule => 
        schedule.title?.toLowerCase().includes(term) ||
        schedule.consultantName?.toLowerCase().includes(term) ||
        schedule.clientName?.toLowerCase().includes(term) ||
        schedule.description?.toLowerCase().includes(term)
      );
    }

    // 상태별 필터링
    if (filterBy !== FILTER_OPTIONS.ALL) {
      if (filterBy === FILTER_OPTIONS.TODAY) {
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(schedule => schedule.date === today);
      } else if (filterBy === FILTER_OPTIONS.THIS_WEEK) {
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        filtered = filtered.filter(schedule => {
          const scheduleDate = new Date(schedule.date);
          return scheduleDate >= weekStart && scheduleDate <= weekEnd;
        });
      } else if (filterBy === FILTER_OPTIONS.THIS_MONTH) {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        filtered = filtered.filter(schedule => {
          const scheduleDate = new Date(schedule.date);
          return scheduleDate >= monthStart && scheduleDate <= monthEnd;
        });
      } else {
        filtered = filtered.filter(schedule => schedule.status === filterBy);
      }
    }

    return filtered;
  };

  // 정렬된 스케줄 계산
  const getSortedSchedules = (schedules) => {
    const sorted = [...schedules];
    
    sorted.sort((a, b) => {
      switch (sortBy) {
        case SORT_OPTIONS.DATE_ASC:
          return new Date(a.date) - new Date(b.date);
        case SORT_OPTIONS.DATE_DESC:
          return new Date(b.date) - new Date(a.date);
        case SORT_OPTIONS.TITLE_ASC:
          return (a.title || '').localeCompare(b.title || '');
        case SORT_OPTIONS.TITLE_DESC:
          return (b.title || '').localeCompare(a.title || '');
        case SORT_OPTIONS.STATUS_ASC:
          return (a.status || '').localeCompare(b.status || '');
        case SORT_OPTIONS.STATUS_DESC:
          return (b.status || '').localeCompare(a.status || '');
        case SORT_OPTIONS.CONSULTANT_ASC:
          return (a.consultantName || '').localeCompare(b.consultantName || '');
        case SORT_OPTIONS.CONSULTANT_DESC:
          return (b.consultantName || '').localeCompare(a.consultantName || '');
        default:
          return 0;
      }
    });
    
    return sorted;
  };

  // 페이지네이션된 스케줄 계산
  const getPaginatedSchedules = (schedules) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return schedules.slice(startIndex, endIndex);
  };

  // 최종 표시할 스케줄 계산
  const getDisplaySchedules = () => {
    const filtered = getFilteredSchedules();
    const sorted = getSortedSchedules(filtered);
    const paginated = getPaginatedSchedules(sorted);
    return paginated;
  };

  // 페이지 수 계산
  const getTotalPages = () => {
    const filtered = getFilteredSchedules();
    return Math.ceil(filtered.length / pageSize);
  };

  // 검색 핸들러
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // 정렬 핸들러
  const handleSort = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  // 필터 핸들러
  const handleFilter = (e) => {
    setFilterBy(e.target.value);
    setCurrentPage(1);
  };

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    loadSchedules();
  };

  const displaySchedules = getDisplaySchedules();
  const totalPages = getTotalPages();
  const filteredCount = getFilteredSchedules().length;

  if (error) {
    return (
      <div className="schedule-list">
        <div className="schedule-error">
          <i className="bi bi-exclamation-triangle"></i>
          <p>{SCHEDULE_ERROR_MESSAGES.LOAD_FAILED}</p>
          <button className="btn btn-primary" onClick={handleRefresh}>
            <i className="bi bi-arrow-clockwise"></i>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-list">
      <div className="schedule-list-header">
        <h2>전체 스케줄</h2>
        <button className="btn btn-outline-primary" onClick={handleRefresh} disabled={loading}>
          <i className="bi bi-arrow-clockwise"></i>
          새로고침
        </button>
      </div>

      <div className="schedule-filters">
        <div className="schedule-search">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="스케줄 검색..."
            value={searchTerm}
            onChange={handleSearch}
            className="schedule-search-input"
          />
        </div>
        
        <div className="schedule-controls">
          {/* 상담사 선택 (어드민/수퍼어드민만) */}
          {(userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') && (
            <CustomSelect
              value={selectedConsultantId}
              onChange={(value) => setSelectedConsultantId(value)}
              placeholder="👥 전체 상담사"
              className="schedule-consultant-select"
              loading={loadingConsultants}
              options={[
                { value: '', label: '👥 전체 상담사' },
                ...consultants.map(consultant => ({
                  value: consultant.id,
                  label: `👤 ${consultant.name}`
                }))
              ]}
            />
          )}
          
          <select
            value={filterBy}
            onChange={handleFilter}
            className="schedule-filter-select"
          >
            {loadingCodes ? (
              <option disabled>필터 옵션을 불러오는 중...</option>
            ) : (
              filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))
            )}
          </select>
          
          <select
            value={sortBy}
            onChange={handleSort}
            className="schedule-sort-select"
          >
            {loadingCodes ? (
              <option disabled>정렬 옵션을 불러오는 중...</option>
            ) : (
              sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="schedule-content">
        {loading ? (
          <UnifiedLoading text="스케줄을 불러오는 중..." size="medium" type="inline" />
        ) : displaySchedules.length === 0 ? (
          <div className="schedule-empty">
            <i className="bi bi-calendar-x"></i>
            <p>표시할 스케줄이 없습니다.</p>
          </div>
        ) : (
          <div className="schedule-grid">
            {displaySchedules.map(schedule => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onView={onScheduleView}
                onEdit={onScheduleEdit}
                onDelete={onScheduleDelete}
                onConfirm={onScheduleConfirm}
                onCancel={onScheduleCancel}
                onComplete={onScheduleComplete}
              />
            ))}
          </div>
        )}
      </div>

      {!loading && displaySchedules.length > 0 && (
        <div className="schedule-pagination">
          <div className="pagination-info">
            <span>
              {PAGINATION_LABELS.TOTAL} {filteredCount}개 {PAGINATION_LABELS.OF} {totalCount}개
            </span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="pagination-size-select"
            >
              {PAGINATION.PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>
                  {size}개씩 보기
                </option>
              ))}
            </select>
          </div>
          
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              {PAGINATION_LABELS.FIRST}
            </button>
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {PAGINATION_LABELS.PREVIOUS}
            </button>
            
            <span className="pagination-pages">
              {currentPage} / {totalPages}
            </span>
            
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {PAGINATION_LABELS.NEXT}
            </button>
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              {PAGINATION_LABELS.LAST}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

ScheduleList.propTypes = {
  userRole: PropTypes.string,
  userId: PropTypes.number,
  onScheduleView: PropTypes.func,
  onScheduleEdit: PropTypes.func,
  onScheduleDelete: PropTypes.func,
  onScheduleConfirm: PropTypes.func,
  onScheduleCancel: PropTypes.func,
  onScheduleComplete: PropTypes.func
};

ScheduleList.defaultProps = {
  userRole: 'ADMIN',
  userId: 1,
  onScheduleView: null,
  onScheduleEdit: null,
  onScheduleDelete: null,
  onScheduleConfirm: null,
  onScheduleCancel: null,
  onScheduleComplete: null
};

export default ScheduleList;
