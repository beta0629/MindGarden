import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { DASHBOARD_API } from '../../constants/api';
import { USER_ROLES, LEGACY_USER_ROLES } from '../../constants/roles';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import './ConsultationReport.css';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_COMMON_CODES = '/api/v1/common-codes?codeGroup=REPORT_PERIOD';
const API_COMMON_CODES_2 = '/api/v1/common-codes?codeGroup=YEAR_RANGE';
const API_COMMON_CODES_3 = '/api/v1/common-codes?codeGroup=MONTH_RANGE';


const ConsultationReport = () => {
  const { t } = useTranslation(['report', 'common']);
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
    { value: 'MONTH', label: t('report:consultation.periodOption.monthly'), icon: '📅', color: 'var(--mg-primary-500)', description: t('report:consultation.periodOption.monthlyDesc') },
    { value: 'YEAR', label: t('report:consultation.periodOption.yearly'), icon: '📊', color: 'var(--mg-success-500)', description: t('report:consultation.periodOption.yearlyDesc') },
    { value: 'QUARTER', label: t('report:consultation.periodOption.quarterly'), icon: '📈', color: 'var(--mg-warning-500)', description: t('report:consultation.periodOption.quarterlyDesc') },
    { value: 'WEEK', label: t('report:consultation.periodOption.weekly'), icon: '📋', color: 'var(--mg-purple-500)', description: t('report:consultation.periodOption.weeklyDesc') }
  ]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [yearOptions, setYearOptions] = useState(() => {
    const baseYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
      value: baseYear - i,
      label: t('report:consultation.yearLabel', { year: baseYear - i }),
      icon: '📅',
      color: 'var(--mg-primary-500)',
      description: t('report:consultation.yearLabel', { year: baseYear - i })
    }));
  });
  const [monthOptions, setMonthOptions] = useState(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: t('report:consultation.monthLabel', { month: i + 1 }),
      icon: '📅',
      color: 'var(--mg-primary-500)',
      description: t('report:consultation.monthLabel', { month: i + 1 })
    }));
  });
  const [loadingYearCodes, setLoadingYearCodes] = useState(false);
  const [loadingMonthCodes, setLoadingMonthCodes] = useState(false);

  const loadPeriodCodes = useCallback(async() => {
    try {
      setLoadingCodes(true);
      const response = await apiGet(API_COMMON_CODES);
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

  const loadYearCodes = useCallback(async() => {
    try {
      setLoadingYearCodes(true);
      const response = await apiGet(API_COMMON_CODES_2);
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

  const loadMonthCodes = useCallback(async() => {
    try {
      setLoadingMonthCodes(true);
      const response = await apiGet(API_COMMON_CODES_3);
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

  const loadReportData = async() => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 상담 리포트 로드 시작 - 사용자 ID:', user.id, '역할:', user.role);

      let response;
      if (user.role === USER_ROLES.CLIENT) {
        response = await apiGet(DASHBOARD_API.CLIENT_SCHEDULES, {
          userId: user.id,
          userRole: USER_ROLES.CLIENT
        });
      } else if (user.role === USER_ROLES.CONSULTANT) {
        response = await apiGet(DASHBOARD_API.CONSULTANT_SCHEDULES, {
          userId: user.id,
          userRole: USER_ROLES.CONSULTANT
        });
      } else if (user.role === USER_ROLES.ADMIN || user.role === LEGACY_USER_ROLES.BRANCH_SUPER_ADMIN) {
        response = await apiGet(DASHBOARD_API.ADMIN_STATS, {
          userRole: USER_ROLES.ADMIN
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
      setError(t('report:consultation.loadFail'));
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
    if (user.role === USER_ROLES.CLIENT) {
      filteredConsultations.forEach(consultation => {
        const consultantName = consultation.consultantName || t('report:consultation.unknownClient');
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
    if (user.role === USER_ROLES.CONSULTANT) {
      filteredConsultations.forEach(consultation => {
        const clientName = consultation.clientName || t('report:consultation.unknownClient');
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
      return t('report:consultation.yearMonthLabel', { year: selectedYear, month: selectedMonth });
    } else if (selectedPeriod === 'YEAR') {
      return t('report:consultation.yearLabel', { year: selectedYear });
    }
    return t('common:labels.all');
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
      <AdminCommonLayout title={t('report:consultation.title')}>
        <div className="consultation-report-page">
          <div className="loading-container">
            <div className="mg-loading">{t('report:consultation.loading')}</div>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  if (loading) {
    return (
      <AdminCommonLayout title={t('report:consultation.title')}>
        <div className="consultation-report-page">
          <div className="loading-container">
            <div className="mg-loading">{t('report:consultation.loading')}</div>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title={t('report:consultation.title')}>
      <div className="consultation-report-page">
        <div className="page-header">
          <div className="header-content">
            <MGButton
              type="button"
              variant="outline"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'md',
                loading: false,
                className: 'back-button'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => navigate(-1)}
              title={t('report:consultation.back')}
            >
              <i className="bi bi-arrow-left" />
            </MGButton>
            <div className="header-text">
              <h1>📊 {t('report:consultation.title')}</h1>
              <p>{t('report:consultation.description')}</p>
            </div>
          </div>
        </div>

        <div className="page-content">
          {/* 기간 선택 */}
          <div className="period-selector">
            <div className="selector-group">
              <label htmlFor="period-select">{t('report:consultation.periodLabel')}</label>
              <select
                id="period-select"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="selector-input"
                disabled={loadingCodes}
              >
                <option value="">{t('report:consultation.selectPeriod')}</option>
                {periodOptions.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.icon} {period.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="selector-group">
              <label htmlFor="year-select">{t('report:consultation.yearFieldLabel')}</label>
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
                <label htmlFor="month-select">{t('report:consultation.monthFieldLabel')}</label>
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
              <i className="bi bi-exclamation-triangle" />
              <p>{error}</p>
              <MGButton
                variant="primary"
                className={buildErpMgButtonClassName({
                  variant: 'primary',
                  size: 'md',
                  loading: false,
                  className: 'retry-btn'
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={loadReportData}
              >
                {t('common:labels.retry')}
              </MGButton>
            </div>
          ) : !reportData ? (
            <div className="no-data">
              <i className="bi bi-file-text" />
              <p>{t('report:consultation.noData')}</p>
              <small>{t('report:consultation.noDataHint')}</small>
            </div>
          ) : (
            <div className="report-content">
              {/* 요약 통계 */}
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-icon">
                    <i className="bi bi-calendar-check" />
                  </div>
                  <div className="card-content">
                    <h3>{t('report:summary.totalConsultations')}</h3>
                    <p className="card-number">{reportData.totalConsultations}</p>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-icon">
                    <i className="bi bi-check-circle" />
                  </div>
                  <div className="card-content">
                    <h3>{t('report:summary.completed')}</h3>
                    <p className="card-number">{reportData.completedConsultations}</p>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-icon">
                    <i className="bi bi-clock" />
                  </div>
                  <div className="card-content">
                    <h3>{t('report:summary.scheduled')}</h3>
                    <p className="card-number">{reportData.confirmedConsultations}</p>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-icon">
                    <i className="bi bi-percent" />
                  </div>
                  <div className="card-content">
                    <h3>{t('report:summary.completionRate')}</h3>
                    <p className="card-number">{reportData.completionRate}%</p>
                  </div>
                </div>
              </div>

              {/* 상세 통계 */}
              <div className="detailed-stats">
                {user.role === USER_ROLES.CLIENT && Object.keys(reportData.consultantStats).length > 0 && (
                  <div className="stats-section">
                    <h3>{t('report:byConsultant.title')}</h3>
                    <div className="stats-table">
                      <div className="table-header">
                        <span>{t('common:labels.consultant')}</span>
                        <span>{t('report:byConsultant.totalLabel')}</span>
                        <span>{t('common:actions.done')}</span>
                        <span>{t('report:byConsultant.scheduledLabel')}</span>
                        <span>{t('common:actions.cancel')}</span>
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

                {user.role === USER_ROLES.CONSULTANT && Object.keys(reportData.clientStats).length > 0 && (
                  <div className="stats-section">
                    <h3>{t('report:byClient.title')}</h3>
                    <div className="stats-table">
                      <div className="table-header">
                        <span>{t('common:labels.client')}</span>
                        <span>{t('report:byClient.totalLabel')}</span>
                        <span>{t('common:actions.done')}</span>
                        <span>{t('report:byClient.scheduledLabel')}</span>
                        <span>{t('common:actions.cancel')}</span>
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
                  <h3>{t('report:summary.period')} {getPeriodLabel()}</h3>
                  <div className="period-info">
                    <p>{t('report:consultation.periodTotal', { count: reportData.totalConsultations })}</p>
                    <p>{t('report:consultation.completionRateInfo', { rate: reportData.completionRate })}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default ConsultationReport;
