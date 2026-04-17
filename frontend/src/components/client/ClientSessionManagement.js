import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';
import { redirectToDynamicDashboard } from '../../utils/dashboardUtils';
import { sessionManager } from '../../utils/sessionManager';
import { useSession } from '../../contexts/SessionContext';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import UnifiedLoading from '../common/UnifiedLoading';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ClientSessionManagement.css';
import notificationManager from '../../utils/notification';
import {
  isApiGetNullFailure,
  normalizeMappingsListPayload,
  normalizeScheduleListPayload
} from '../../utils/apiResponseNormalize';

const MAPPINGS_FETCH_ERROR_TEXT = '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';

const CLIENT_SESSION_MGMT_TITLE_ID = 'client-session-management-title';

const ClientSessionManagement = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryLoading, setRetryLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = async(opts = {}) => {
    const fromErrorRetry = opts.fromErrorRetry === true;
    try {
      if (fromErrorRetry) {
        setRetryLoading(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const userResponse = await apiGet('/api/v1/auth/current-user');
      if (!userResponse || !userResponse.id) {
        throw new Error('로그인이 필요합니다.');
      }

      const userId = userResponse.id;
      // 표준화 2025-12-08: /api/v1/admin 경로로 통일
      const mappingsResponse = await apiGet(`/api/v1/admin/mappings/client?clientId=${userId}`);
      if (isApiGetNullFailure(mappingsResponse)) {
        throw new Error(MAPPINGS_FETCH_ERROR_TEXT);
      }
      const mappings = normalizeMappingsListPayload(mappingsResponse);

      const schedulesResponse = await apiGet(`/api/v1/schedules?userId=${userId}&userRole=CLIENT`);
      const schedules = normalizeScheduleListPayload(schedulesResponse);

      const totalSessions = mappings.reduce((sum, mapping) => sum + (mapping.totalSessions || 0), 0);
      const usedSessions = schedules.filter(s => s.status === '완료').length;
      const remainingSessions = totalSessions - usedSessions;

      setSessionData({
        totalSessions,
        usedSessions,
        remainingSessions,
        mappings: mappings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        schedules: schedules.sort((a, b) => new Date(b.date) - new Date(a.date))
      });

    } catch (err) {
      console.error('회기 데이터 로드 실패:', err);
      setError(err.message || '회기 데이터를 불러오는데 실패했습니다.');
    } finally {
      if (fromErrorRetry) {
        setRetryLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleMenuAction = async(action) => {
    setIsMenuOpen(false);
    switch (action) {
      case 'dashboard':
        const authResponse = {
          user: user,
          currentTenantRole: sessionManager.getCurrentTenantRole()
        };
        await redirectToDynamicDashboard(authResponse, navigate);
        break;
      case 'session-management':
        navigate('/client/session-management');
        break;
      case 'payment-history':
        navigate('/client/payment-history');
        break;
      case 'consultation-guide':
        notificationManager.show('상담 가이드 페이지는 준비 중입니다.', 'info');
        break;
      default:
        break;
    }
  };

  const handleHamburgerClick = (isOpen) => {
    setIsMenuOpen(isOpen);
  };

  const getStatusText = (isCompleted) => {
    return isCompleted ? '완료' : '예정';
  };

  const getStatusColor = (isCompleted) => {
    return isCompleted ? 'var(--mg-success-500)' : 'var(--mg-warning-500)';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '알 수 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const pageShell = (body) => (
    <div className="mg-v2-ad-b0kla" data-testid="client-session-management-page">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="회기 관리">
          <ContentHeader
            title="회기 관리"
            subtitle="상담 회기 현황과 사용 내역을 확인하세요"
            titleId={CLIENT_SESSION_MGMT_TITLE_ID}
          />
          <main aria-labelledby={CLIENT_SESSION_MGMT_TITLE_ID}>
            {body}
          </main>
        </ContentArea>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <AdminCommonLayout title="회기 관리" className="mg-v2-dashboard-layout">
        {pageShell(
          <div aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text="회기 데이터를 불러오는 중..." />
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  if (error) {
    return (
      <AdminCommonLayout title="회기 관리" className="mg-v2-dashboard-layout">
        {pageShell(
          <div className="client-session-management">
            <div className="error-container">
              <div className="error-icon">
                <i className="bi bi-exclamation-triangle" />
              </div>
              <h3>오류가 발생했습니다</h3>
              <p>{error}</p>
              <MGButton
                variant="primary"
                className={buildErpMgButtonClassName({ variant: 'primary', loading: retryLoading })}
                onClick={() => loadSessionData({ fromErrorRetry: true })}
                loading={retryLoading}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
              >
                다시 시도
              </MGButton>
            </div>
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  if (!sessionData || sessionData.mappings.length === 0) {
    return (
      <AdminCommonLayout title="회기 관리" className="mg-v2-dashboard-layout">
        {pageShell(
          <div className="client-session-management">
            <div className="no-data-container">
              <div className="no-data-icon">
                <i className="bi bi-calendar-check" />
              </div>
              <h3>회기 정보가 없습니다</h3>
              <p>아직 상담사와 연결된 패키지가 없습니다.</p>
              <MGButton
                variant="primary"
                className={buildErpMgButtonClassName({ variant: 'primary', loading: false })}
                onClick={() => navigate('/client/wellness')}
                preventDoubleClick={false}
              >
                웰니스 가이드 보기
              </MGButton>
            </div>
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="회기 관리" className="mg-v2-dashboard-layout">
      {pageShell(
        <div className="client-session-management">
        {/* 햄버거 메뉴 드롭다운 */}
        {isMenuOpen && (
          <div className="client-session-menu-dropdown">
            <div className="client-session-menu-content">
              <MGButton
                variant="outline"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} client-session-menu-item`}
                onClick={() => handleMenuAction('dashboard')}
                preventDoubleClick={false}
              >
                <i className="bi bi-house client-session-menu-icon" />
                대시보드
              </MGButton>
              <MGButton
                variant="outline"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} client-session-menu-item`}
                onClick={() => handleMenuAction('session-management')}
                preventDoubleClick={false}
              >
                <i className="bi bi-clock-history client-session-menu-icon" />
                회기 관리
              </MGButton>
              <MGButton
                variant="outline"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} client-session-menu-item`}
                onClick={() => handleMenuAction('payment-history')}
                preventDoubleClick={false}
              >
                <i className="bi bi-credit-card client-session-menu-icon" />
                결제 내역
              </MGButton>
              <MGButton
                variant="outline"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} client-session-menu-item`}
                onClick={() => handleMenuAction('consultation-guide')}
                preventDoubleClick={false}
              >
                <i className="bi bi-book client-session-menu-icon" />
                상담 가이드
              </MGButton>
            </div>
          </div>
        )}

        {/* 요약 카드 */}
        <div className="summary-cards">
          <div className="summary-card total">
            <div className="card-icon">
              <i className="bi bi-calendar-check" />
            </div>
            <div className="card-content">
              <h3>총 회기</h3>
              <p className="number">{sessionData.totalSessions}</p>
              <span className="unit">회</span>
            </div>
          </div>

          <div className="summary-card used">
            <div className="card-icon">
              <i className="bi bi-check-circle" />
            </div>
            <div className="card-content">
              <h3>사용한 회기</h3>
              <p className="number">{sessionData.usedSessions}</p>
              <span className="unit">회</span>
            </div>
          </div>

          <div className="summary-card remaining">
            <div className="card-icon">
              <i className="bi bi-clock" />
            </div>
            <div className="card-content">
              <h3>남은 회기</h3>
              <p className="number">{sessionData.remainingSessions}</p>
              <span className="unit">회</span>
            </div>
          </div>
        </div>

        {/* 진행률 표시 */}
        <div className="progress-section">
          <div className="progress-header">
            <span>회기 사용률</span>
            <span className="progress-percentage">
              {sessionData.totalSessions > 0 
                ? Math.round((sessionData.usedSessions / sessionData.totalSessions) * 100)
                : 0}%
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{
                '--progress-width': sessionData.totalSessions > 0 
                  ? `${(sessionData.usedSessions / sessionData.totalSessions) * 100}%`
                  : '0%'
              }}
             />
          </div>
        </div>

        {/* 패키지 정보 */}
        <div className="package-info">
          <div className="package-info-content">
            {sessionData.mappings.map((mapping, index) => (
              <div key={mapping.id || index} className="package-card">
                <div className="package-card-header">
                  <div className="package-card-header-left">
                    <i className="bi bi-person package-card-icon" />
                    <span className="package-card-title">상담사: {mapping.consultant?.consultantName || '미지정'}</span>
                  </div>
                  <span className={`package-card-status ${mapping.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                    {mapping.status === 'ACTIVE' ? '활성' : '비활성'}
                  </span>
                </div>
                <div className="package-card-content">
                  <div className="detail-item">
                    <span className="label">총 회기</span>
                    <span className="value">{mapping.totalSessions}회</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">사용</span>
                    <span className="value">{mapping.usedSessions || 0}회</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">남은 회기</span>
                    <span className="value">{mapping.remainingSessions || 0}회</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">상담사</span>
                    <span className="value">{mapping.consultant?.consultantName || '미지정'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">연결일</span>
                    <span className="value">
                      {mapping.createdAt ? formatDate(mapping.createdAt) : '알 수 없음'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 상담 일정 */}
        <div className="consultation-history">
          <h3>
            <i className="bi bi-calendar3 mg-color-primary" />
            최근 상담 일정
          </h3>
          {sessionData.schedules && sessionData.schedules.length > 0 ? (
            <div className="consultation-list">
              {sessionData.schedules.slice(0, 5).map((schedule, index) => (
                <div key={schedule.id || index} className="consultation-item">
                  <div className="consultation-header">
                    <div className="consultation-date">
                      <i className="bi bi-calendar3" />
                      {formatDate(schedule.date)}
                    </div>
                    <div className="consultation-status">
                      {getStatusText(schedule.status === '완료')}
                    </div>
                  </div>
                  <div className="consultation-content">
                    <div className="consultation-title">
                      <i className="bi bi-chat-dots" />
                      {schedule.title || '상담'}
                    </div>
                    <div className="consultation-details">
                      <div className="consultation-duration">
                        <i className="bi bi-clock" />
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-consultations">
              <i className="bi bi-calendar-x" />
              <p>아직 상담 일정이 없습니다.</p>
            </div>
          )}
        </div>
        </div>
      )}
    </AdminCommonLayout>
  );
};

export default ClientSessionManagement;
