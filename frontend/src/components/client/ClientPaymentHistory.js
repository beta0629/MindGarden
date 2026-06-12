import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  DollarSign, 
  CalendarCheck, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Package,
  User,
  Calendar,
  FileText,
  Phone
} from 'lucide-react';
import StandardizedApi from '../../utils/standardizedApi';
import { getDashboardPath } from '../../utils/session';
import { useSession } from '../../contexts/SessionContext';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import { isApiGetNullFailure, normalizeMappingsListPayload } from '../../utils/apiResponseNormalize';
import { isClientMappingPaymentSettled } from '../../constants/mapping';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ClientPaymentHistory.css';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
// B6 묶음 B 2026-06-12: API_AUTH_CURRENT_USER 제거 — useSession().user 직접 사용으로 dedup
const API_ADMIN_MAPPINGS_CLIENT = '/api/v1/admin/mappings/client';


const CLIENT_PAYMENT_HISTORY_TITLE_ID = 'client-payment-history-title';

/**
 * 내담자 결제 내역 페이지
/**
 * 디자인 시스템 적용 버전
 */
const ClientPaymentHistory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // B6 묶음 B 2026-06-12: useSession().user 직접 사용 — current-user 별도 fetch 제거.
  // hasCheckedSession 가드를 통해 세션 확인 완료 전 호출을 막아 빈 데이터 표시를 방지한다.
  const { user, hasCheckedSession } = useSession();
  const [paymentData, setPaymentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryLoading, setRetryLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!hasCheckedSession) {
      return;
    }
    loadPaymentData();
    // hasCheckedSession 만 의존 — user 변경 시는 SessionContext 재마운트 또는 별도 의도 필요.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCheckedSession, user?.id]);

  const loadPaymentData = async(opts = {}) => {
    const fromErrorRetry = opts.fromErrorRetry === true;
    try {
      if (fromErrorRetry) {
        setRetryLoading(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Context user 사용 — 별도 /api/v1/auth/current-user 호출 없음.
      if (!user || !user.id) {
        throw new Error(t('common:client.ClientPaymentHistory.t_5271ee34'));
      }

      const userId = user.id;
      // 표준화 2025-12-08: /api/v1/admin 경로로 통일
      const mappingsResponse = await StandardizedApi.get(API_ADMIN_MAPPINGS_CLIENT, {
        clientId: userId
      });
      if (isApiGetNullFailure(mappingsResponse)) {
        throw new Error(t('common:client.ClientPaymentHistory.t_3642c6bf'));
      }
      const mappings = normalizeMappingsListPayload(mappingsResponse);

      const totalAmount = mappings.reduce((sum, mapping) => sum + (mapping.packagePrice || 0), 0);
      const totalSessions = mappings.reduce((sum, mapping) => sum + (mapping.totalSessions || 0), 0);
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      const completedPayments = mappings.filter((mapping) => isClientMappingPaymentSettled(mapping.paymentStatus)).length;
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      const pendingPayments = mappings.filter(mapping => mapping.paymentStatus === 'PENDING').length;

      setPaymentData({
        totalAmount,
        totalSessions,
        completedPayments,
        pendingPayments,
        mappings: mappings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });

    } catch (err) {
      console.error('결제 데이터 로드 실패:', err);
      setError(err.message || t('common:client.ClientPaymentHistory.t_4e27bdaa'));
    } finally {
      if (fromErrorRetry) {
        setRetryLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CONFIRMED': t('common:client.ClientPaymentHistory.t_cd79fb92'),
      'PAY': t('common:client.ClientPaymentHistory.t_f8e2bb71'),
      'DEP': t('common:client.ClientPaymentHistory.t_a1b8faac'),
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'PENDING': t('common:client.ClientPaymentHistory.t_ffc400e0'),
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'REJECTED': t('common:client.ClientPaymentHistory.t_13b9aa71'),
      'REFUNDED': t('common:client.ClientPaymentHistory.t_43aa0bad')
    };
    return statusMap[status] || t('common:client.ClientPaymentHistory.t_8c5d2272');
  };

  const getStatusClass = (status) => {
    const classMap = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CONFIRMED': 'success',
      'PAY': 'success',
      'DEP': 'success',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'PENDING': 'warning',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'REJECTED': 'danger',
      'REFUNDED': 'secondary'
    };
    return classMap[status] || 'secondary';
  };

  const getMethodText = (method) => {
    const methodMap = {
      'CARD': t('common:client.ClientPaymentHistory.t_7dedeb82'),
      'CASH': t('common:client.ClientPaymentHistory.t_6102409b'),
      'BANK_TRANSFER': t('common:client.ClientPaymentHistory.t_72cb76b3')
    };
    return methodMap[method] || t('common:client.ClientPaymentHistory.t_5c1a705c');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('common:client.ClientPaymentHistory.t_8916b639');
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const pageShell = (body) => (
    <div className="mg-v2-ad-b0kla" data-testid="client-payment-history-page">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="결제 내역">
          <ContentHeader
            title={t('common:client.ClientPaymentHistory.t_42e677b1')}
            subtitle="결제 내역과 패키지 정보를 확인하세요"
            titleId={CLIENT_PAYMENT_HISTORY_TITLE_ID}
          />
          <main aria-labelledby={CLIENT_PAYMENT_HISTORY_TITLE_ID}>
            {body}
          </main>
        </ContentArea>
      </div>
    </div>
  );

  const filteredMappings = paymentData?.mappings?.filter(mapping => {
    if (filter === 'all') return true;
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    if (filter === 'completed') return isClientMappingPaymentSettled(mapping.paymentStatus);
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    if (filter === 'pending') return mapping.paymentStatus === 'PENDING';
    if (filter === 'refunded') return mapping.paymentStatus === 'REFUNDED';
    return true;
  }) || [];

  if (isLoading) {
    return (
      <AdminCommonLayout title={t('common:client.ClientPaymentHistory.t_42e677b1')} className="mg-v2-dashboard-layout">
        {pageShell(
          <div aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text={t('common:client.ClientPaymentHistory.t_c721f3cb')} />
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  if (error) {
    return (
      <AdminCommonLayout title={t('common:client.ClientPaymentHistory.t_42e677b1')} className="mg-v2-dashboard-layout">
        {pageShell(
          <div className="client-payment-history">
            <div className="payment-error">
              <div className="payment-error__icon">
                <AlertTriangle size={48} />
              </div>
              <h3 className="payment-error__title">{t('common:client.ClientPaymentHistory.t_11d2f578')}</h3>
              <p className="payment-error__message">{error}</p>
              <MGButton
                variant="primary"
                className={buildErpMgButtonClassName({ variant: 'primary', loading: retryLoading })}
                onClick={() => loadPaymentData({ fromErrorRetry: true })}
                loading={retryLoading}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
              >
                {t('common.labels.retry')}
              </MGButton>
            </div>
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  if (!paymentData || paymentData.mappings.length === 0) {
    return (
      <AdminCommonLayout title={t('common:client.ClientPaymentHistory.t_42e677b1')} className="mg-v2-dashboard-layout">
        {pageShell(
          <div className="client-payment-history">
            <div className="payment-empty">
              <div className="payment-empty__icon">
                <CreditCard size={48} />
              </div>
              <h3 className="payment-empty__title">{t('common:client.ClientPaymentHistory.t_2a891787')}</h3>
              <p className="payment-empty__text">{t('common:client.ClientPaymentHistory.t_9c4f45b8')}</p>
              <MGButton
                variant="primary"
                className={buildErpMgButtonClassName({ variant: 'primary', loading: false })}
                onClick={() => {
                  const dashboardPath = getDashboardPath(user?.role);
                  navigate(dashboardPath || '/dashboard');
                }}
                preventDoubleClick={false}
              >
                {t('common:client.ClientPaymentHistory.t_3898de91')}
              </MGButton>
            </div>
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title={t('common:client.ClientPaymentHistory.t_42e677b1')} className="mg-v2-dashboard-layout">
      {pageShell(
        <div className="client-payment-history">
        {/* 통계 카드 */}
        <div className="payment-stats">
          <div className="payment-stat-card payment-stat-card--total">
            <div className="payment-stat-icon">
              <DollarSign size={20} />
            </div>
            <div className="payment-stat-content">
              <div className="payment-stat-label">{t('common:client.ClientPaymentHistory.t_8594df96')}</div>
              <div className="payment-stat-value">{formatCurrency(paymentData.totalAmount)}</div>
            </div>
          </div>

          <div className="payment-stat-card payment-stat-card--sessions">
            <div className="payment-stat-icon">
              <CalendarCheck size={20} />
            </div>
            <div className="payment-stat-content">
              <div className="payment-stat-label">{t('common:client.ClientPaymentHistory.t_7a0890a2')}</div>
              <div className="payment-stat-value">{paymentData.totalSessions}회</div>
            </div>
          </div>

          <div className="payment-stat-card payment-stat-card--completed">
            <div className="payment-stat-icon">
              <CheckCircle size={20} />
            </div>
            <div className="payment-stat-content">
              <div className="payment-stat-label">{t('common:client.ClientPaymentHistory.t_cd79fb92')}</div>
              <div className="payment-stat-value">{paymentData.completedPayments}건</div>
            </div>
          </div>

          <div className="payment-stat-card payment-stat-card--pending">
            <div className="payment-stat-icon">
              <Clock size={20} />
            </div>
            <div className="payment-stat-content">
              <div className="payment-stat-label">{t('common:client.ClientPaymentHistory.t_ffc400e0')}</div>
              <div className="payment-stat-value">{paymentData.pendingPayments}건</div>
            </div>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div className="payment-filter">
          <h3 className="payment-filter__title">{t('common:client.ClientPaymentHistory.t_42e677b1')}</h3>
          <div className="payment-filter__buttons">
            <MGButton
              type="button"
              variant="outline"
              className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} payment-filter__button ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
              preventDoubleClick={false}
            >
              {t('common.labels.all')}
            </MGButton>
            <MGButton
              type="button"
              variant="outline"
              className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} payment-filter__button ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
              preventDoubleClick={false}
            >
              {t('common:client.ClientPaymentHistory.t_cd79fb92')}
            </MGButton>
            <MGButton
              type="button"
              variant="outline"
              className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} payment-filter__button ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
              preventDoubleClick={false}
            >
              {t('common:client.ClientPaymentHistory.t_ffc400e0')}
            </MGButton>
            <MGButton
              type="button"
              variant="outline"
              className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} payment-filter__button ${filter === 'refunded' ? 'active' : ''}`}
              onClick={() => setFilter('refunded')}
              preventDoubleClick={false}
            >
              {t('common:client.ClientPaymentHistory.t_43aa0bad')}
            </MGButton>
          </div>
        </div>

        {/* 결제 내역 목록 */}
        <div className="payment-list">
          {filteredMappings.map((mapping, index) => (
            <div key={mapping.id || index} className="payment-item">
              <div className="payment-item__header">
                <div className="payment-item__title">
                  <Package size={20} />
                  <h4>{mapping.packageName || t('common:client.ClientPaymentHistory.t_17cef764')}</h4>
                </div>
                <div className="payment-item__amount">
                  {formatCurrency(mapping.packagePrice || 0)}
                </div>
              </div>

              <div className="payment-item__body">
                <div className="payment-item__detail">
                  <CalendarCheck size={16} />
                  <span className="payment-item__detail-label">{t('common:client.ClientPaymentHistory.t_389ebf64')}</span>
                  <span className="payment-item__detail-value">{mapping.totalSessions || 0}회</span>
                </div>
                <div className="payment-item__detail">
                  <User size={16} />
                  <span className="payment-item__detail-label">{t('common:client.ClientPaymentHistory.t_a30d6da9')}</span>
                  <span className="payment-item__detail-value">{mapping.consultant?.consultantName || t('common:client.ClientPaymentHistory.t_5c1a705c')}</span>
                </div>
                <div className="payment-item__detail">
                  <Calendar size={16} />
                  <span className="payment-item__detail-label">{t('common:client.ClientPaymentHistory.t_58548549')}</span>
                  <span className="payment-item__detail-value">{formatDate(mapping.paymentDate)}</span>
                </div>
                <div className="payment-item__detail">
                  <CreditCard size={16} />
                  <span className="payment-item__detail-label">{t('common:client.ClientPaymentHistory.t_bbf114f3')}</span>
                  <span className="payment-item__detail-value">{getMethodText(mapping.paymentMethod)}</span>
                </div>
                {mapping.paymentReference && (
                  <div className="payment-item__detail">
                    <FileText size={16} />
                    <span className="payment-item__detail-label">{t('common:client.ClientPaymentHistory.t_9b0be667')}</span>
                    <span className="payment-item__detail-value">{mapping.paymentReference}</span>
                  </div>
                )}
              </div>

              <div className="payment-item__footer">
                <span className={`mg-badge mg-badge-${getStatusClass(mapping.paymentStatus)}`}>
                  {getStatusText(mapping.paymentStatus)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 환불 정책 */}
        <div className="payment-policy">
          <h3 className="payment-policy__title">{t('common:client.ClientPaymentHistory.t_e84a4b85')}</h3>
          <div className="payment-policy__list">
            <div className="payment-policy__item">
              <div className="payment-policy__icon">
                <CheckCircle size={20} />
              </div>
              <span>{t('common:client.ClientPaymentHistory.t_6ae660ec')}</span>
            </div>
            <div className="payment-policy__item">
              <div className="payment-policy__icon">
                <Clock size={20} />
              </div>
              <span>{t('common:client.ClientPaymentHistory.t_36cdd21f')}</span>
            </div>
            <div className="payment-policy__item">
              <div className="payment-policy__icon">
                <Phone size={20} />
              </div>
              <span>{t('common:client.ClientPaymentHistory.t_76dd1d3d')}</span>
            </div>
          </div>
        </div>
        </div>
      )}
    </AdminCommonLayout>
  );
};

export default ClientPaymentHistory;
