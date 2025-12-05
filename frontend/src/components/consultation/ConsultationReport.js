import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { DASHBOARD_API } from '../../constants/api';
import SimpleLayout from '../layout/SimpleLayout';
import './ConsultationReport.css';

const ConsultationReport = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('MONTH');
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [periodOptions, setPeriodOptions] = useState([
    { value: 'MONTH', label: '월별', icon: '📅', color: 'var(--mg-primary-500)', description: '월별 보고서' },
    { value: 'YEAR', label: '년별', icon: '📊', color: 'var(--mg-success-500)', description: '년별 보고서' },
    { value: 'QUARTER', label: '분기별', icon: '📈', color: 'var(--mg-warning-500)', description: '분기별 보고서' },
    { value: 'WEEK', label: '주별', icon: '📋', color: 'var(--mg-purple-500)', description: '주별 보고서' }
  ]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [yearOptions, setYearOptions] = useState(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
      value: currentYear - i,
      label: `${currentYear - i}년`,
      icon: '📅',
      color: 'var(--mg-primary-500)',
      description: `${currentYear - i}년`
    }));
  });
  const [monthOptions, setMonthOptions] = useState(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}월`,
      icon: '📅',
      color: 'var(--mg-primary-500)',
      description: `${i + 1}월`
    }));
  });
  const [loadingYearCodes, setLoadingYearCodes] = useState(false);
  const [loadingMonthCodes, setLoadingMonthCodes] = useState(false);

  const loadPeriodCodes = useCallback(async () => {
    try {
      setLoadingCodes(true);
      const response = await apiGet('/api/common-codes/REPORT_PERIOD');
      if (response && response.length > 0) {
        const uniqueCodes = response.reduce((acc, code) => {
          if (!acc.find(item => item.codeValue === code.codeValue)) {
            acc.push(code);
          }
          return acc;
        }, []);
        
        const options = uniqueCodes.map(code => ({
          value: code.codeValue,
          label: code.codeLabel,
          icon: code.icon,
          color: code.colorCode,
          description: code.codeDescription
        }));
        setPeriodOptions(options);
      }
    } catch (error) {
      console.error('보고서 기간 코드 로드 실패:', error);
    } finally {
      setLoadingCodes(false);
    }
  }, []);

  const loadYearCodes = useCallback(async () => {
    try {
      setLoadingYearCodes(true);
      const response = await apiGet('/api/common-codes/YEAR_RANGE');
      if (response && response.length > 0) {
        const uniqueCodes = response.reduce((acc, code) => {
          if (!acc.find(item => item.codeValue === code.codeValue)) {
            acc.push(code);
          }
          return acc;
        }, []);
        
        setYearOptions(uniqueCodes.map(code => ({
          value: parseInt(code.codeValue),
          label: code.codeLabel,
          icon: code.icon,
          color: code.colorCode,
          description: code.codeDescription
        })));
      }
    } catch (error) {
      console.error('년도 코드 로드 실패:', error);
    } finally {
      setLoadingYearCodes(false);
    }
  }, []);

  const loadMonthCodes = useCallback(async () => {
    try {
      setLoadingMonthCodes(true);
      const response = await apiGet('/api/common-codes/MONTH_RANGE');
      if (response && response.length > 0) {
        const uniqueCodes = response.reduce((acc, code) => {
          if (!acc.find(item => item.codeValue === code.codeValue)) {
            acc.push(code);
          }
          return acc;
        }, []);
        
        setMonthOptions(uniqueCodes.map(code => ({
          value: parseInt(code.codeValue),
          label: code.codeLabel,
          icon: code.icon,
          color: code.colorCode,
          description: code.codeDescription
        })));
      }
    } catch (error) {
      console.error('월 코드 로드 실패:', error);
    } finally {
      setLoadingMonthCodes(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && !isLoggedIn) {
      navigate('/login', { replace: true });
      return;
    }

    if (user) {
      loadReportData();
      loadPeriodCodes();
      loadYearCodes();
      loadMonthCodes();
    }
  }, [user, sessionLoading, isLoggedIn, selectedPeriod, selectedYear, selectedMonth, loadPeriodCodes, loadYearCodes, loadMonthCodes]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 상담 리포트 로드 시작 - 사용자 ID:', user.id, '역할:', user.role);

      let response;
      if (user.role === 'CLIENT') {
        response = await apiGet(DASHBOARD_API.CLIENT_SCHEDULES, {
          userId: user.id,
          userRole: 'CLIENT'
        });
      } else if (user.role === 'CONSULTANT') {
        response = await apiGet(DASHBOARD_API.CONSULTANT_SCHEDULES, {
          userId: user.id,
          userRole: 'CONSULTANT'
        });
      } else if (user.role === 'ADMIN' || user.role === 'BRANCH_SUPER_ADMIN') {
        response = await apiGet(DASHBOARD_API.ADMIN_STATS, {
          userRole: 'ADMIN'
        });
      }

      if (response?.success && response?.data) {
        const consultations = response.data;
        const processedData = processReportData(consultations);
        setReportData(processedData);
        console.log('✅ 상담 리포트 로드 완료');
      } else {
        setReportData(null);
        console.log('⚠️ 상담 리포트 데이터 없음');
      }
    } catch (error) {
      console.error('❌ 상담 리포트 로드 오류:', error);
      setError('상담 리포트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (consultations) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    
    let filteredConsultations = consultations;
    
    if (selectedPeriod === 'MONTH') {
      filteredConsultations = consultations.filter(consultation => {
        const consultationDate = new Date(consultation.date);
        return consultationDate.getFullYear() === selectedYear && 
               consultationDate.getMonth() + 1 === selectedMonth;
      });
    } else if (selectedPeriod === 'YEAR') {
      filteredConsultations = consultations.filter(consultation => {
        const consultationDate = new Date(consultation.date);
        return consultationDate.getFullYear() === selectedYear;
      });
    }

    const totalConsultations = filteredConsultations.length;
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    const completedConsultations = filteredConsultations.filter(c => c.status === 'COMPLETED').length;
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    const confirmedConsultations = filteredConsultations.filter(c => c.status === 'CONFIRMED').length;
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    const cancelledConsultations = filteredConsultations.filter(c => c.status === 'CANCELLED').length;
    
    const consultantStats = {};
    if (user.role === 'CLIENT') {
      filteredConsultations.forEach(consultation => {
        const consultantName = consultation.consultantName || '알 수 없음';
        if (!consultantStats[consultantName]) {
          consultantStats[consultantName] = {
            total: 0,
            completed: 0,
            confirmed: 0,
            cancelled: 0
          };
        }
        consultantStats[consultantName].total++;
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        if (consultation.status === 'COMPLETED') consultantStats[consultantName].completed++;
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        if (consultation.status === 'CONFIRMED') consultantStats[consultantName].confirmed++;
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        if (consultation.status === 'CANCELLED') consultantStats[consultantName].cancelled++;
      });
    }

    const clientStats = {};
    if (user.role === 'CONSULTANT') {
      filteredConsultations.forEach(consultation => {
        const clientName = consultation.clientName || '알 수 없음';
        if (!clientStats[clientName]) {
          clientStats[clientName] = {
            total: 0,
            completed: 0,
            confirmed: 0,
            cancelled: 0
          };
        }
        clientStats[clientName].total++;
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        if (consultation.status === 'COMPLETED') clientStats[clientName].completed++;
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        if (consultation.status === 'CONFIRMED') clientStats[clientName].confirmed++;
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        if (consultation.status === 'CANCELLED') clientStats[clientName].cancelled++;
      });
    }

    const monthlyStats = {};
    filteredConsultations.forEach(consultation => {
      const date = new Date(consultation.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          total: 0,
          completed: 0,
          confirmed: 0,
          cancelled: 0
        };
      }
      monthlyStats[monthKey].total++;
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      if (consultation.status === 'COMPLETED') monthlyStats[monthKey].completed++;
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      if (consultation.status === 'CONFIRMED') monthlyStats[monthKey].confirmed++;
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      if (consultation.status === 'CANCELLED') monthlyStats[monthKey].cancelled++;
    });

    return {
      totalConsultations,
      completedConsultations,
      confirmedConsultations,
      cancelledConsultations,
      completionRate: totalConsultations > 0 ? Math.round((completedConsultations / totalConsultations) * 100) : 0,
      consultantStats,
      clientStats,
      monthlyStats,
      period: selectedPeriod,
      year: selectedYear,
      month: selectedMonth
    };
  };

  const getPeriodLabel = () => {
    if (selectedPeriod === 'MONTH') {
      return `${selectedYear}년 ${selectedMonth}월`;
    } else if (selectedPeriod === 'YEAR') {
      return `${selectedYear}년`;
    }
    return '전체';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (sessionLoading) {
    return (
      <SimpleLayout>
        <div className="consultation-report-page">
          <div className="loading-container">
            <div className="mg-loading">로딩중...</div>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  if (loading) {
    return (
      <SimpleLayout>
        <div className="consultation-report-page">
          <div className="loading-container">
            <div className="mg-loading">로딩중...</div>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="consultation-report-page">
        <div className="page-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left"></i>
            </button>
            <div className="header-text">
              <h1>📊 상담 리포트</h1>
              <p>상담 현황을 분석한 리포트를 확인할 수 있습니다</p>
            </div>
          </div>
        </div>

        <div className="page-content">
          {/* 기간 선택 */}
          <div className="period-selector">
            <div className="selector-group">
              <label htmlFor="period-select">기간</label>
              <select
                id="period-select"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="selector-input"
                disabled={loadingCodes}
              >
                <option value="">기간을 선택하세요</option>
                {periodOptions.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.icon} {period.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="selector-group">
              <label htmlFor="year-select">년도</label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="selector-input"
              >
                {yearOptions.map(year => (
                  <option key={year.value} value={year.value}>
                    {year.icon} {year.label}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedPeriod === 'MONTH' && (
              <div className="selector-group">
                <label htmlFor="month-select">월</label>
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="selector-input"
                >
                  {monthOptions.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.icon} {month.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error ? (
            <div className="error-message">
              <i className="bi bi-exclamation-triangle"></i>
              <p>{error}</p>
              <button onClick={loadReportData} className="retry-btn">
                다시 시도
              </button>
            </div>
          ) : !reportData ? (
            <div className="no-data">
              <i className="bi bi-file-text"></i>
              <p>상담 데이터가 없습니다</p>
              <small>새로운 상담을 예약해보세요</small>
            </div>
          ) : (
            <div className="report-content">
              {/* 요약 통계 */}
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-icon">
                    <i className="bi bi-calendar-check"></i>
                  </div>
                  <div className="card-content">
                    <h3>총 상담 수</h3>
                    <p className="card-number">{reportData.totalConsultations}</p>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-icon">
                    <i className="bi bi-check-circle"></i>
                  </div>
                  <div className="card-content">
                    <h3>완료된 상담</h3>
                    <p className="card-number">{reportData.completedConsultations}</p>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-icon">
                    <i className="bi bi-clock"></i>
                  </div>
                  <div className="card-content">
                    <h3>예정된 상담</h3>
                    <p className="card-number">{reportData.confirmedConsultations}</p>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-icon">
                    <i className="bi bi-percent"></i>
                  </div>
                  <div className="card-content">
                    <h3>완료율</h3>
                    <p className="card-number">{reportData.completionRate}%</p>
                  </div>
                </div>
              </div>

              {/* 상세 통계 */}
              <div className="detailed-stats">
                {user.role === 'CLIENT' && Object.keys(reportData.consultantStats).length > 0 && (
                  <div className="stats-section">
                    <h3>상담사별 상담 현황</h3>
                    <div className="stats-table">
                      <div className="table-header">
                        <span>상담사</span>
                        <span>총 상담</span>
                        <span>완료</span>
                        <span>예정</span>
                        <span>취소</span>
                      </div>
                      {Object.entries(reportData.consultantStats).map(([consultant, stats]) => (
                        <div key={consultant} className="table-row">
                          <span className="consultant-name">{consultant}</span>
                          <span>{stats.total}</span>
                          <span className="completed">{stats.completed}</span>
                          <span className="confirmed">{stats.confirmed}</span>
                          <span className="cancelled">{stats.cancelled}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {user.role === 'CONSULTANT' && Object.keys(reportData.clientStats).length > 0 && (
                  <div className="stats-section">
                    <h3>내담자별 상담 현황</h3>
                    <div className="stats-table">
                      <div className="table-header">
                        <span>내담자</span>
                        <span>총 상담</span>
                        <span>완료</span>
                        <span>예정</span>
                        <span>취소</span>
                      </div>
                      {Object.entries(reportData.clientStats).map(([client, stats]) => (
                        <div key={client} className="table-row">
                          <span className="client-name">{client}</span>
                          <span>{stats.total}</span>
                          <span className="completed">{stats.completed}</span>
                          <span className="confirmed">{stats.confirmed}</span>
                          <span className="cancelled">{stats.cancelled}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="stats-section">
                  <h3>기간: {getPeriodLabel()}</h3>
                  <div className="period-info">
                    <p>이 기간 동안 총 <strong>{reportData.totalConsultations}</strong>건의 상담이 있었습니다.</p>
                    <p>완료율은 <strong>{reportData.completionRate}%</strong>입니다.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SimpleLayout>
  );
};

export default ConsultationReport;
