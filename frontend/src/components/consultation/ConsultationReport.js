import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { DASHBOARD_API } from '../../constants/api';
import SimpleLayout from '../layout/SimpleLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import './ConsultationReport.css';

const ConsultationReport = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    if (!sessionLoading && !isLoggedIn) {
      navigate('/login', { replace: true });
      return;
    }

    if (user) {
      loadReportData();
    }
  }, [user, sessionLoading, isLoggedIn, selectedPeriod, selectedYear, selectedMonth]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 상담 리포트 로드 시작 - 사용자 ID:', user.id, '역할:', user.role);

      // 사용자 역할에 따라 다른 API 호출
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
      } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
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
    
    // 선택된 기간에 따른 필터링
    let filteredConsultations = consultations;
    
    if (selectedPeriod === 'month') {
      filteredConsultations = consultations.filter(consultation => {
        const consultationDate = new Date(consultation.date);
        return consultationDate.getFullYear() === selectedYear && 
               consultationDate.getMonth() + 1 === selectedMonth;
      });
    } else if (selectedPeriod === 'year') {
      filteredConsultations = consultations.filter(consultation => {
        const consultationDate = new Date(consultation.date);
        return consultationDate.getFullYear() === selectedYear;
      });
    }

    // 통계 계산
    const totalConsultations = filteredConsultations.length;
    const completedConsultations = filteredConsultations.filter(c => c.status === 'COMPLETED').length;
    const confirmedConsultations = filteredConsultations.filter(c => c.status === 'CONFIRMED').length;
    const cancelledConsultations = filteredConsultations.filter(c => c.status === 'CANCELLED').length;
    
    // 상담사별 통계 (내담자용)
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
        if (consultation.status === 'COMPLETED') consultantStats[consultantName].completed++;
        if (consultation.status === 'CONFIRMED') consultantStats[consultantName].confirmed++;
        if (consultation.status === 'CANCELLED') consultantStats[consultantName].cancelled++;
      });
    }

    // 내담자별 통계 (상담사용)
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
        if (consultation.status === 'COMPLETED') clientStats[clientName].completed++;
        if (consultation.status === 'CONFIRMED') clientStats[clientName].confirmed++;
        if (consultation.status === 'CANCELLED') clientStats[clientName].cancelled++;
      });
    }

    // 월별 통계
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
      if (consultation.status === 'COMPLETED') monthlyStats[monthKey].completed++;
      if (consultation.status === 'CONFIRMED') monthlyStats[monthKey].confirmed++;
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
    if (selectedPeriod === 'month') {
      return `${selectedYear}년 ${selectedMonth}월`;
    } else if (selectedPeriod === 'year') {
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
            <LoadingSpinner text="세션 확인 중..." size="medium" />
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
            <LoadingSpinner text="상담 리포트를 생성하는 중..." size="medium" />
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
              >
                <option value="month">월별</option>
                <option value="year">년별</option>
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
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            </div>
            
            {selectedPeriod === 'month' && (
              <div className="selector-group">
                <label htmlFor="month-select">월</label>
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="selector-input"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{month}월</option>
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
