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
import ClientWebPageShell from './ClientWebPageShell';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import { isApiGetNullFailure, normalizeMappingsListPayload } from '../../utils/apiResponseNormalize';
import { isClientMappingPaymentSettled } from '../../constants/mapping';
import {
  resolveClientPaymentHistoryAmount,
  resolveClientPaymentHistoryMethodLabel,
  resolveClientPaymentHistoryStatus,
  resolveClientPaymentHistoryTitle,
  shouldIncludeInClientPaymentHistoryTotals
} from '../../utils/clientPaymentHistoryDisplay';
import { toDisplayString, toSafeNumber } from '../../utils/safeDisplay';
import '../../styles/unified-design-tokens.css';
import './clientDashboard/ClientLobby.css';
import './ClientPaymentHistory.css';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 치환 P0)
const API_AUTH_CURRENT_USER = '/api/v1/auth/current-user';
const API_ADMIN_MAPPINGS_CLIENT = '/api/v1/admin/mappings/client';
// TODO(P1, 2026-07-28): TERMINATED·회기추가 누락 해소 — API_ENDPOINTS.ADMIN.CLIENTS.PACKAGE_PAYMENT_HISTORY
//   + PackagePaymentHistoryList(showAdminDetails=false) 로 교체. 현재는 mappings/client(TERMINATED 제외) 축.

const CLIENT_PAYMENT_HISTORY_TITLE_ID = 'client-payment-history-title';

/**
 * 내담자 결제 내역 페이지 (#1101 client-lobby 톤 · money-path SSOT)
 *
 * @author CoreSolution
 * @since 2026-09-17
 */
const ClientPaymentHistory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSession();
  const [paymentData, setPaymentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryLoading, setRetryLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async(opts = {}) => {
    const fromErrorRetry = opts.fromErrorRetry === true;
    try {
      if (fromErrorRetry) {
        setRetryLoading(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const userResponse = await StandardizedApi.get(API_AUTH_CURRENT_USER);
      if (!userResponse || !userResponse.id) {
        throw new Error(t('common:client.ClientPaymentHistory.t_5271ee34'));
      }

      const userId = userResponse.id;
      const mappingsResponse = await StandardizedApi.get(API_ADMIN_MAPPINGS_CLIENT, {
        clientId: userId
      });
      if (isApiGetNullFailure(mappingsResponse)) {
        throw new Error(t('common:client.ClientPaymentHistory.t_3642c6bf'));
      }
      const mappings = normalizeMappingsListPayload(mappingsResponse);

      const totalsEligible = mappings.filter(shouldIncludeInClientPaymentHistoryTotals);
      const totalAmount = totalsEligible.reduce(
        (sum, mapping) => sum + resolveClientPaymentHistoryAmount(mapping),
        0
      );
      const totalSessions = totalsEligible.reduce(
        (sum, mapping) => sum + toSafeNumber(mapping.totalSessions, 0),
        0
      );
      const completedPayments = totalsEligible.filter((mapping) =>
        isClientMappingPaymentSettled(resolveClientPaymentHistoryStatus(mapping))).length;
      const pendingPayments = mappings.filter(
        (mapping) => resolveClientPaymentHistoryStatus(mapping) === 'PENDING'
      ).length;

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
      CONFIRMED: t('common:client.ClientPaymentHistory.t_cd79fb92'),
      PAY: t('common:client.ClientPaymentHistory.t_f8e2bb71'),
      DEP: t('common:client.ClientPaymentHistory.t_a1b8faac'),
      PENDING: t('common:client.ClientPaymentHistory.t_ffc400e0'),
      REJECTED: t('common:client.ClientPaymentHistory.t_13b9aa71'),
      REFUNDED: t('common:client.ClientPaymentHistory.t_43aa0bad'),
      CANCELLED: t('common:client.ClientPaymentHistory.t_b6dcb84f')
    };
    return statusMap[status] || t('common:client.ClientPaymentHistory.t_8c5d2272');
  };

  const getStatusClass = (status) => {
    const classMap = {
      CONFIRMED: 'success',
      PAY: 'success',
      DEP: 'success',
      PENDING: 'warning',
      REJECTED: 'danger',
      REFUNDED: 'secondary',
      CANCELLED: 'secondary'
    };
    return classMap[status] || 'secondary';
  };

  const getMethodText = (method, paymentProvider) =>
    resolveClientPaymentHistoryMethodLabel(
      method,
      paymentProvider,
      t('common:client.ClientPaymentHistory.t_5c1a705c')
    );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(toSafeNumber(amount, 0));
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
    <ClientWebPageShell activeNavId="payment">
      <div className="client-payment-history-page" data-testid="client-payment-history-page">
        <div className="client-payment-history-page__container">
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
    </ClientWebPageShell>
  );

  const filteredMappings = paymentData?.mappings?.filter((mapping) => {
    if (filter === 'all') return true;
    const status = resolveClientPaymentHistoryStatus(mapping);
    if (filter === 'completed') return isClientMappingPaymentSettled(status);
    if (filter === 'pending') return status === 'PENDING';
    if (filter === 'refunded') return status === 'REFUNDED';
    return true;
  }) || [];

  if (isLoading) {
    return pageShell(
      <div aria-busy="true" aria-live="polite">
        <UnifiedLoading type="inline" text={t('common:client.ClientPaymentHistory.t_c721f3cb')} />
      </div>
    );
  }

  if (error) {
    return pageShell(
      <div className="client-payment-history">
        <div className="payment-error">
          <div className="payment-error__icon">
            <AlertTriangle size={48} />
          </div>
          <h3 className="payment-error__title">{t('common:client.ClientPaymentHistory.t_11d2f578')}</h3>
          <p className="payment-error__message">{toDisplayString(error, '')}</p>
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
    );
  }

  if (!paymentData || paymentData.mappings.length === 0) {
    return pageShell(
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
    );
  }

  return pageShell(
        <div className="client-payment-history">
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
                <div className="payment-stat-value">{toSafeNumber(paymentData.totalSessions, 0)}회</div>
              </div>
            </div>

            <div className="payment-stat-card payment-stat-card--completed">
              <div className="payment-stat-icon">
                <CheckCircle size={20} />
              </div>
              <div className="payment-stat-content">
                <div className="payment-stat-label">{t('common:client.ClientPaymentHistory.t_cd79fb92')}</div>
                <div className="payment-stat-value">{toSafeNumber(paymentData.completedPayments, 0)}건</div>
              </div>
            </div>

            <div className="payment-stat-card payment-stat-card--pending">
              <div className="payment-stat-icon">
                <Clock size={20} />
              </div>
              <div className="payment-stat-content">
                <div className="payment-stat-label">{t('common:client.ClientPaymentHistory.t_ffc400e0')}</div>
                <div className="payment-stat-value">{toSafeNumber(paymentData.pendingPayments, 0)}건</div>
              </div>
            </div>
          </div>

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

          <div className="payment-list">
            {filteredMappings.map((mapping, index) => (
              <div key={mapping.id || index} className="payment-item">
                <div className="payment-item__header">
                  <div className="payment-item__title">
                    <Package size={20} />
                    <h4>
                      {resolveClientPaymentHistoryTitle(
                        mapping,
                        t('common:client.ClientPaymentHistory.t_17cef764')
                      )}
                    </h4>
                  </div>
                  <div className="payment-item__amount">
                    {formatCurrency(resolveClientPaymentHistoryAmount(mapping))}
                  </div>
                </div>

                <div className="payment-item__body">
                  <div className="payment-item__detail">
                    <CalendarCheck size={16} />
                    <span className="payment-item__detail-label">{t('common:client.ClientPaymentHistory.t_389ebf64')}</span>
                    <span className="payment-item__detail-value">
                      {toSafeNumber(mapping.totalSessions, 0)}회
                    </span>
                  </div>
                  <div className="payment-item__detail">
                    <User size={16} />
                    <span className="payment-item__detail-label">{t('common:client.ClientPaymentHistory.t_a30d6da9')}</span>
                    <span className="payment-item__detail-value">
                      {toDisplayString(
                        mapping.consultant?.consultantName,
                        t('common:client.ClientPaymentHistory.t_5c1a705c')
                      )}
                    </span>
                  </div>
                  <div className="payment-item__detail">
                    <Calendar size={16} />
                    <span className="payment-item__detail-label">{t('common:client.ClientPaymentHistory.t_58548549')}</span>
                    <span className="payment-item__detail-value">{formatDate(mapping.paymentDate)}</span>
                  </div>
                  <div className="payment-item__detail">
                    <CreditCard size={16} />
                    <span className="payment-item__detail-label">{t('common:client.ClientPaymentHistory.t_bbf114f3')}</span>
                    <span className="payment-item__detail-value">
                      {getMethodText(mapping.paymentMethod, mapping.paymentProvider)}
                    </span>
                  </div>
                  {mapping.paymentReference ? (
                    <div className="payment-item__detail">
                      <FileText size={16} />
                      <span className="payment-item__detail-label">{t('common:client.ClientPaymentHistory.t_9b0be667')}</span>
                      <span className="payment-item__detail-value">
                        {toDisplayString(mapping.paymentReference, '')}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="payment-item__footer">
                  <span className={`mg-badge mg-badge-${getStatusClass(resolveClientPaymentHistoryStatus(mapping))}`}>
                    {getStatusText(resolveClientPaymentHistoryStatus(mapping))}
                  </span>
                </div>
              </div>
            ))}
          </div>

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
  );
};

export default ClientPaymentHistory;
