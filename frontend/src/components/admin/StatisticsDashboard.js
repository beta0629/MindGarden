/**
 * 통계 대시보드 페이지 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Chart from '../common/Chart';
import DetailedStatsGrid from '../common/DetailedStatsGrid';
import StatsCardGrid from '../common/StatsCardGrid';
import { 
  CHART_TYPES, 
  CHART_COLORS, 
  CHART_HEIGHTS,
  FILTER_OPTIONS,
  FILTER_LABELS,
  SORT_OPTIONS,
  SORT_LABELS,
  PAGINATION,
  CHART_API
} from '../../constants/charts';
import { SCHEDULE_API } from '../../constants/api';
import { SCHEDULE_STATUS } from '../../constants/schedule';
import './StatisticsDashboard.css';

const StatisticsDashboard = ({ userRole = 'ADMIN', userId = 1 }) => {
  // 상태 관리
  const [statistics, setStatistics] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 필터 상태
  const [filters, setFilters] = useState({
    dateRange: FILTER_OPTIONS.DATE_RANGE.THIS_MONTH,
    chartType: FILTER_OPTIONS.CHART_TYPE.BAR,
    timePeriod: FILTER_OPTIONS.TIME_PERIOD.MONTHLY,
    status: 'all',
    consultant: 'all'
  });
  
  // 테이블 상태
  const [tableData, setTableData] = useState([]);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.DATE_DESC);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE);

  // 통계 데이터 로드
  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${SCHEDULE_API.STATISTICS}?userRole=${userRole}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      console.error('통계 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // 스케줄 데이터 로드
  const loadSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        userId,
        userRole,
        page: currentPage - 1,
        size: pageSize,
        sort: getSortParam(sortBy)
      });
      
      const response = await fetch(`${SCHEDULE_API.PAGED_SCHEDULES}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSchedules(data.content || []);
      setTableData(data.content || []);
    } catch (err) {
      console.error('스케줄 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userRole, currentPage, pageSize, sortBy]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadStatistics();
    loadSchedules();
  }, [loadStatistics, loadSchedules]);


  // 정렬 변경 핸들러
  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  // 정렬 파라미터를 Spring Boot Pageable 형식으로 변환
  const getSortParam = (sortBy) => {
    const sortMap = {
      'date_asc': 'date,asc',
      'date_desc': 'date,desc',
      'name_asc': 'title,asc',
      'name_desc': 'title,desc',
      'status_asc': 'status,asc',
      'status_desc': 'status,desc',
      'created_asc': 'createdAt,asc',
      'created_desc': 'createdAt,desc'
    };
    return sortMap[sortBy] || 'date,desc';
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    loadStatistics();
    loadSchedules();
  };

  // 날짜 범위 계산 함수
  const getDateRange = (dateRange) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    switch (dateRange) {
      case 'TODAY':
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'THIS_WEEK':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(currentDate - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(currentDate + (6 - today.getDay()));
        return {
          startDate: startOfWeek.toISOString().split('T')[0],
          endDate: endOfWeek.toISOString().split('T')[0]
        };
      case 'THIS_MONTH':
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0]
        };
      case 'THIS_YEAR':
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);
        return {
          startDate: startOfYear.toISOString().split('T')[0],
          endDate: endOfYear.toISOString().split('T')[0]
        };
      case 'LAST_MONTH':
        const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const lastMonthEnd = new Date(currentYear, currentMonth, 0);
        return {
          startDate: lastMonthStart.toISOString().split('T')[0],
          endDate: lastMonthEnd.toISOString().split('T')[0]
        };
      case 'LAST_YEAR':
        const lastYearStart = new Date(currentYear - 1, 0, 1);
        const lastYearEnd = new Date(currentYear - 1, 11, 31);
        return {
          startDate: lastYearStart.toISOString().split('T')[0],
          endDate: lastYearEnd.toISOString().split('T')[0]
        };
      default:
        return null;
    }
  };

  // 필터 적용 핸들러
  const handleFilterApply = () => {
    const dateRange = getDateRange(filters.dateRange);
    const params = new URLSearchParams();
    
    params.append('userRole', userRole);
    if (dateRange) {
      params.append('startDate', dateRange.startDate);
      params.append('endDate', dateRange.endDate);
    }
    
    // 통계 데이터 다시 로드
    loadStatisticsWithFilters(params);
  };

  // 필터가 적용된 통계 데이터 로드
  const loadStatisticsWithFilters = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${SCHEDULE_API.STATISTICS}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      console.error('통계 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // 필터 변경 핸들러
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // 차트 데이터 생성
  const getChartData = () => {
    if (!statistics) return null;

    const statusData = {
      labels: ['예약됨', '확정됨', '진행중', '완료됨', '취소됨'],
      datasets: [{
        label: '스케줄 상태별 통계',
        data: [
          statistics.bookedSchedules || 0,
          statistics.confirmedSchedules || 0,
          statistics.inProgressSchedules || 0,
          statistics.completedSchedules || 0,
          statistics.cancelledSchedules || 0
        ],
        backgroundColor: [
          CHART_COLORS.PRIMARY,
          CHART_COLORS.INFO,
          CHART_COLORS.WARNING,
          CHART_COLORS.SUCCESS,
          CHART_COLORS.DANGER
        ],
        borderColor: [
          CHART_COLORS.PRIMARY,
          CHART_COLORS.INFO,
          CHART_COLORS.WARNING,
          CHART_COLORS.SUCCESS,
          CHART_COLORS.DANGER
        ],
        borderWidth: 2
      }]
    };

    return statusData;
  };

  // 테이블 컬럼 정의
  const tableColumns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'date', label: '날짜', width: '120px' },
    { key: 'time', label: '시간', width: '100px' },
    { key: 'title', label: '제목', width: '200px' },
    { key: 'consultantName', label: '상담사', width: '120px' },
    { key: 'clientName', label: '내담자', width: '120px' },
    { key: 'status', label: '상태', width: '100px' },
    { key: 'duration', label: '소요시간', width: '100px' }
  ];

  // 상태 라벨 변환
  const getStatusLabel = (status) => {
    const statusMap = {
      'BOOKED': '예약됨',
      'CONFIRMED': '확정됨',
      'COMPLETED': '완료됨',
      'CANCELLED': '취소됨',
      'IN_PROGRESS': '진행중'
    };
    return statusMap[status] || status;
  };

  // 상태 배지 클래스
  const getStatusClass = (status) => {
    const statusClassMap = {
      'BOOKED': 'status-booked',
      'CONFIRMED': 'status-confirmed',
      'COMPLETED': 'status-completed',
      'CANCELLED': 'status-cancelled',
      'IN_PROGRESS': 'status-in-progress'
    };
    return statusClassMap[status] || 'status-default';
  };

  return (
    <div className="statistics-dashboard">
      {/* 헤더 */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h1 className="dashboard-title">
            <i className="bi bi-graph-up"></i>
            통계 대시보드
          </h1>
          <p className="dashboard-subtitle">
            상담소 전체 통계 및 상담 내역을 한눈에 확인하세요
          </p>
        </div>
        <div className="dashboard-actions">
          <button 
            className="btn btn-outline-primary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise"></i>
            새로고침
          </button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="filter-section">
        <div className="filter-group">
          <label className="filter-label">기간</label>
          <select 
            className="filter-input"
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            {Object.entries(FILTER_LABELS.DATE_RANGE).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label className="filter-label">차트 타입</label>
          <select 
            className="filter-input"
            value={filters.chartType}
            onChange={(e) => handleFilterChange('chartType', e.target.value)}
          >
            {Object.entries(FILTER_LABELS.CHART_TYPE).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label className="filter-label">상태</label>
          <select 
            className="filter-input"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">전체</option>
            {Object.entries(SCHEDULE_STATUS).map(([key, value]) => (
              <option key={key} value={value}>{getStatusLabel(value)}</option>
            ))}
          </select>
        </div>
        
        <button 
          className="filter-btn"
          onClick={handleFilterApply}
          disabled={loading}
        >
          <i className="bi bi-funnel"></i>
          필터 적용
        </button>
      </div>

      {/* 기본 통계 카드 그리드 - 컴포넌트화 */}
      <StatsCardGrid 
        statistics={statistics} 
        loading={loading}
        error={error}
        showChange={false}
      />

      {/* 상세 통계 카드 그리드 - 컴포넌트화 */}
      <DetailedStatsGrid statistics={statistics} />

      {/* 차트 섹션 */}
      <div className="charts-section">
        <div className="chart-card">
          <Chart
            type={filters.chartType}
            data={getChartData()}
            title="스케줄 상태별 통계"
            height={CHART_HEIGHTS.LARGE}
            loading={loading}
            error={error}
          />
        </div>
      </div>

      {/* 테이블 섹션 */}
      <div className="table-section">
        <div className="table-header">
          <h3 className="table-title">
            <i className="bi bi-table"></i>
            상담 내역
          </h3>
          <div className="table-controls">
            <select 
              className="table-sort"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              {Object.entries(SORT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {tableColumns.map(column => (
                  <th key={column.key} style={{ width: column.width }}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((schedule, index) => (
                <tr key={schedule.id || index}>
                  <td>{schedule.id}</td>
                  <td>{schedule.date}</td>
                  <td>{schedule.time}</td>
                  <td>{schedule.title}</td>
                  <td>{schedule.consultantName || '-'}</td>
                  <td>{schedule.clientName || '-'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(schedule.status)}`}>
                      {getStatusLabel(schedule.status)}
                    </span>
                  </td>
                  <td>{schedule.duration || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 페이지네이션 */}
        <div className="pagination-container">
          <div className="pagination-info">
            <span>
              {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, tableData.length)} / {tableData.length}개
            </span>
          </div>
          <div className="pagination-controls">
            <button 
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <span className="pagination-page">
              {currentPage} / {Math.ceil(tableData.length / pageSize)}
            </span>
            <button 
              className="pagination-btn"
              disabled={currentPage >= Math.ceil(tableData.length / pageSize)}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

StatisticsDashboard.propTypes = {
  userRole: PropTypes.string
};

StatisticsDashboard.defaultProps = {
  userRole: 'ADMIN'
};

export default StatisticsDashboard;
