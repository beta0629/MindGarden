/**
 * 통계 대시보드 페이지 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */

import React, { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../../utils/ajax';
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
import { STATUS } from '../../constants/schedule';
import './StatisticsDashboard.css';

const StatisticsDashboard = ({ userRole = 'ADMIN', userId = null }) => { // 기본값 제거, 호출하는 컴포넌트에서 전달해야 함
  // 상태 관리
  const [statistics, setStatistics] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 필터 상태
  const [filters, setFilters] = useState({
    dateRange: 'THIS_MONTH',
    chartType: 'BAR',
    timePeriod: 'MONTHLY',
    status: 'all',
    consultant: 'all'
  });
  
  // 테이블 상태
  const [tableData, setTableData] = useState([]);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.DATE_DESC);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE);
  
  // 일정 상태 옵션
  const [scheduleStatusOptions, setScheduleStatusOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  
  // 필터 옵션 상태
  const [dateRangeOptions, setDateRangeOptions] = useState([]);
  const [chartTypeOptions, setChartTypeOptions] = useState([]);
  const [sortOptions, setSortOptions] = useState([]);
  const [loadingFilterCodes, setLoadingFilterCodes] = useState(false);

  // 일정 상태 코드 로드 (주요 상태값만 필터링)
  const loadScheduleStatusCodes = useCallback(async () => {
    try {
      setLoadingCodes(true);
      const response = await fetch('/api/common-codes/group/STATUS');
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          // 주요 상태값만 필터링 (통계에서 자주 사용되는 상태들)
          const mainStatuses = [
            'AVAILABLE', 'BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'VACATION',
            'PENDING', 'ACTIVE', 'INACTIVE', 'APPROVED', 'REJECTED'
          ];
          
          const filteredData = data.filter(code => mainStatuses.includes(code.codeValue));
          
          // 기본 "전체" 옵션 추가
          const statusOptions = [
            { value: 'all', label: '전체', icon: '📋', color: '#6b7280', description: '모든 상태' },
            ...filteredData.map(code => ({
              value: code.codeValue,
              label: code.codeLabel,
              icon: code.icon || '📋',
              color: code.colorCode || '#6b7280',
              description: code.codeDescription
            }))
          ];
          
          setScheduleStatusOptions(statusOptions);
        }
      }
    } catch (error) {
      console.error('일정 상태 코드 로드 실패:', error);
      // 실패 시 기본값 설정 (주요 상태만)
      setScheduleStatusOptions([
        { value: 'all', label: '전체', icon: '📋', color: '#6b7280', description: '모든 상태' },
        { value: 'AVAILABLE', label: '가능', icon: '✅', color: '#28a745', description: '사용 가능한 상태' },
        { value: 'BOOKED', label: '예약됨', icon: '📅', color: '#007bff', description: '예약된 상태' },
        { value: 'CONFIRMED', label: '확인됨', icon: '✅', color: '#17a2b8', description: '확인된 상태' },
        { value: 'COMPLETED', label: '완료', icon: '✅', color: '#6c757d', description: '완료된 상태' },
        { value: 'CANCELLED', label: '취소됨', icon: '❌', color: '#dc3545', description: '취소된 상태' },
        { value: 'VACATION', label: '휴가', icon: '🏖️', color: '#ffc107', description: '휴가 상태' },
        { value: 'PENDING', label: '대기중', icon: '⏳', color: '#ffc107', description: '대기 중인 상태' },
        { value: 'ACTIVE', label: '활성', icon: '🟢', color: '#28a745', description: '활성 상태' },
        { value: 'INACTIVE', label: '비활성', icon: '🔴', color: '#dc3545', description: '비활성 상태' },
        { value: 'APPROVED', label: '승인됨', icon: '✅', color: '#28a745', description: '승인된 상태' },
        { value: 'REJECTED', label: '거부됨', icon: '❌', color: '#dc3545', description: '거부된 상태' }
      ]);
    } finally {
      setLoadingCodes(false);
    }
  }, []);

  // 날짜 범위 필터 코드 로드
  const loadDateRangeFilterCodes = useCallback(async () => {
    try {
      setLoadingFilterCodes(true);
      const response = await fetch('/api/common-codes/group/DATE_RANGE_FILTER');
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setDateRangeOptions(data.map(code => ({
            value: code.codeValue,
            label: code.codeLabel,
            icon: code.icon,
            color: code.colorCode,
            description: code.codeDescription
          })));
        }
      }
    } catch (error) {
      console.error('날짜 범위 필터 코드 로드 실패:', error);
      // 실패 시 기본값 설정
      setDateRangeOptions([
        { value: 'TODAY', label: '오늘', icon: '📅', color: '#3b82f6', description: '오늘' },
        { value: 'YESTERDAY', label: '어제', icon: '📅', color: '#6b7280', description: '어제' },
        { value: 'THIS_WEEK', label: '이번 주', icon: '📅', color: '#10b981', description: '이번 주' },
        { value: 'LAST_WEEK', label: '지난 주', icon: '📅', color: '#f59e0b', description: '지난 주' },
        { value: 'THIS_MONTH', label: '이번 달', icon: '📅', color: '#8b5cf6', description: '이번 달' },
        { value: 'LAST_MONTH', label: '지난 달', icon: '📅', color: '#ef4444', description: '지난 달' },
        { value: 'THIS_YEAR', label: '올해', icon: '📅', color: '#06b6d4', description: '올해' },
        { value: 'CUSTOM', label: '사용자 정의', icon: '⚙️', color: '#6b7280', description: '사용자 정의 날짜 범위' }
      ]);
    } finally {
      setLoadingFilterCodes(false);
    }
  }, []);

  // 차트 유형 필터 코드 로드
  const loadChartTypeFilterCodes = useCallback(async () => {
    try {
      setLoadingFilterCodes(true);
      const response = await fetch('/api/common-codes/group/CHART_TYPE_FILTER');
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setChartTypeOptions(data.map(code => ({
            value: code.codeValue,
            label: code.codeLabel,
            icon: code.icon,
            color: code.colorCode,
            description: code.codeDescription
          })));
        }
      }
    } catch (error) {
      console.error('차트 유형 필터 코드 로드 실패:', error);
      // 실패 시 기본값 설정
      setChartTypeOptions([
        { value: 'BAR', label: '막대 차트', icon: '📊', color: '#3b82f6', description: '막대 차트' },
        { value: 'LINE', label: '선 차트', icon: '📈', color: '#10b981', description: '선 차트' },
        { value: 'PIE', label: '원형 차트', icon: '🥧', color: '#f59e0b', description: '원형 차트' },
        { value: 'DOUGHNUT', label: '도넛 차트', icon: '🍩', color: '#8b5cf6', description: '도넛 차트' },
        { value: 'AREA', label: '영역 차트', icon: '📊', color: '#ef4444', description: '영역 차트' },
        { value: 'SCATTER', label: '산점도', icon: '🔵', color: '#06b6d4', description: '산점도' },
        { value: 'RADAR', label: '레이더 차트', icon: '🕸️', color: '#f97316', description: '레이더 차트' },
        { value: 'TABLE', label: '테이블', icon: '📋', color: '#6b7280', description: '테이블 형태' }
      ]);
    } finally {
      setLoadingFilterCodes(false);
    }
  }, []);

  // 정렬 옵션 코드 로드
  const loadSortOptionCodes = useCallback(async () => {
    try {
      setLoadingFilterCodes(true);
      const response = await fetch('/api/common-codes/group/SORT_OPTION');
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setSortOptions(data.map(code => ({
            value: code.codeValue,
            label: code.codeLabel,
            icon: code.icon,
            color: code.colorCode,
            description: code.codeDescription
          })));
        }
      }
    } catch (error) {
      console.error('정렬 옵션 코드 로드 실패:', error);
      // 실패 시 기본값 설정
      setSortOptions([
        { value: 'DATE_ASC', label: '날짜 오름차순', icon: '📅', color: '#3b82f6', description: '날짜 오름차순 정렬' },
        { value: 'DATE_DESC', label: '날짜 내림차순', icon: '📅', color: '#ef4444', description: '날짜 내림차순 정렬' },
        { value: 'NAME_ASC', label: '이름 오름차순', icon: '🔤', color: '#10b981', description: '이름 오름차순 정렬' },
        { value: 'NAME_DESC', label: '이름 내림차순', icon: '🔤', color: '#f59e0b', description: '이름 내림차순 정렬' },
        { value: 'VALUE_ASC', label: '값 오름차순', icon: '📊', color: '#8b5cf6', description: '값 오름차순 정렬' },
        { value: 'VALUE_DESC', label: '값 내림차순', icon: '📊', color: '#06b6d4', description: '값 내림차순 정렬' },
        { value: 'STATUS_ASC', label: '상태 오름차순', icon: '🔄', color: '#f97316', description: '상태 오름차순 정렬' },
        { value: 'STATUS_DESC', label: '상태 내림차순', icon: '🔄', color: '#6b7280', description: '상태 내림차순 정렬' }
      ]);
    } finally {
      setLoadingFilterCodes(false);
    }
  }, []);

  // 통계 데이터 로드
  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        userRole,
        status: filters.status !== 'all' ? filters.status : '',
        dateRange: filters.dateRange,
        chartType: filters.chartType
      });
      
      console.log('📊 통계 API 호출 파라미터:', params.toString());
      const response = await apiGet(`${SCHEDULE_API.STATISTICS}?${params}`);
      console.log('📊 통계 API 응답:', response);
      setStatistics(response.data || response);
    } catch (err) {
      console.error('통계 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userRole, filters]);

  // 스케줄 데이터 로드
  const loadSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        userId: userId || 0, // null인 경우 0으로 설정
        userRole,
        page: currentPage - 1,
        size: pageSize,
        sort: getSortParam(sortBy),
        status: filters.status !== 'all' ? filters.status : '',
        dateRange: filters.dateRange
      });
      
      console.log('📋 스케줄 API 호출 파라미터:', params.toString());
      const data = await apiGet(`${SCHEDULE_API.PAGED_SCHEDULES}?${params}`);
      setSchedules(data.content || []);
      setTableData(data.content || []);
    } catch (err) {
      console.error('스케줄 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userRole, currentPage, pageSize, sortBy, filters]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadStatistics();
    loadSchedules();
    loadScheduleStatusCodes();
    loadDateRangeFilterCodes();
    loadChartTypeFilterCodes();
    loadSortOptionCodes();
  }, [loadStatistics, loadSchedules, loadScheduleStatusCodes, loadDateRangeFilterCodes, loadChartTypeFilterCodes, loadSortOptionCodes]);

  // 필터 변경 시 데이터 재로드
  useEffect(() => {
    console.log('🔄 필터 변경 감지:', filters);
    // 필터가 변경될 때마다 데이터 재로드
    loadStatistics();
    loadSchedules();
  }, [filters, loadStatistics, loadSchedules]);


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
    console.log(`🔍 필터 변경: ${filterType} = ${value}`);
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // 차트 타입 매핑 함수
  const getChartType = (type) => {
    const typeMap = {
      'BAR': 'bar',
      'LINE': 'line',
      'PIE': 'pie',
      'DOUGHNUT': 'doughnut',
      'AREA': 'area',
      'SCATTER': 'scatter',
      'RADAR': 'radar',
      'TABLE': 'bar' // 테이블은 막대 차트로 대체
    };
    return typeMap[type] || 'bar';
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
    <div style={{
      padding: '24px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
        paddingBottom: '16px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <h1 style={{
            margin: '0',
            fontSize: '32px',
            fontWeight: '700',
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <i className="bi bi-graph-up" style={{
              color: '#4CAF50',
              fontSize: '28px'
            }}></i>
            통계 대시보드
          </h1>
          <p style={{
            margin: '0',
            fontSize: '16px',
            color: '#6c757d',
            fontWeight: '400'
          }}>
            상담소 전체 통계 및 상담 내역을 한눈에 확인하세요
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button 
            style={{
              padding: '12px 24px',
              border: '2px solid #667eea',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#667eea',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onClick={handleRefresh}
            disabled={loading}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#667eea';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#667eea';
            }}
          >
            <i className="bi bi-arrow-clockwise"></i>
            새로고침
          </button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e9ecef',
        display: 'flex',
        gap: '20px',
        alignItems: 'end',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: '150px'
        }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#495057',
            margin: '0'
          }}>기간</label>
          <select 
            style={{
              padding: '12px 16px',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: '#ffffff',
              color: '#495057',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e9ecef';
              e.target.style.boxShadow = 'none';
            }}
          >
            {loadingFilterCodes ? (
              <option disabled>날짜 범위 옵션을 불러오는 중...</option>
            ) : (
              dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))
            )}
          </select>
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: '150px'
        }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#495057',
            margin: '0'
          }}>차트 타입</label>
          <select 
            style={{
              padding: '12px 16px',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: '#ffffff',
              color: '#495057',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            value={filters.chartType}
            onChange={(e) => handleFilterChange('chartType', e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e9ecef';
              e.target.style.boxShadow = 'none';
            }}
          >
            {loadingFilterCodes ? (
              <option disabled>차트 유형 옵션을 불러오는 중...</option>
            ) : (
              chartTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))
            )}
          </select>
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: '200px'
        }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#495057',
            margin: '0'
          }}>상태</label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            padding: '8px',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa',
            minHeight: '44px',
            alignItems: 'center'
          }}>
            {scheduleStatusOptions.slice(0, 8).map(option => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('status', option.value)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: filters.status === option.value ? option.color || '#667eea' : '#ffffff',
                  color: filters.status === option.value ? '#ffffff' : '#495057',
                  border: `1px solid ${filters.status === option.value ? option.color || '#667eea' : '#e9ecef'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (filters.status !== option.value) {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.borderColor = option.color || '#667eea';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filters.status !== option.value) {
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.borderColor = '#e9ecef';
                  }
                }}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
            {scheduleStatusOptions.length > 8 && (
              <select 
                style={{
                  padding: '6px 8px',
                  border: '1px solid #e9ecef',
                  borderRadius: '16px',
                  fontSize: '12px',
                  backgroundColor: '#ffffff',
                  color: '#495057',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '80px'
                }}
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">전체</option>
                {scheduleStatusOptions.slice(8).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        <button 
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#667eea',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            height: '44px'
          }}
          onClick={handleFilterApply}
          disabled={loading}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#5a67d8';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#667eea';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          <i className="bi bi-funnel"></i>
          필터 적용
        </button>
      </div>

      {/* 기본 통계 카드 그리드 - 컴포넌트화 */}
      <StatsCardGrid 
        statistics={statistics} 
        loading={loading}
        error={!!error}
        showChange={false}
      />

      {/* 상세 통계 카드 그리드 - 컴포넌트화 */}
      <DetailedStatsGrid statistics={statistics} />

      {/* 차트 섹션 */}
      <div style={{
        marginBottom: '32px',
        width: '100%'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          border: '2px dashed #e9ecef',
          width: '100%',
          minHeight: '550px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Chart
            type={getChartType(filters.chartType)}
            data={getChartData()}
            title="스케줄 상태별 통계"
            height="500px"
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
              {loadingFilterCodes ? (
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
