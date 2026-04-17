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
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ClientPaymentHistory.css';

const CLIENT_PAYMENT_HISTORY_TITLE_ID = 'client-payment-history-title';

/**
 * 내담자 결제 내역 페이지
/**
 * 디자인 시스템 적용 버전
 */
const ClientPaymentHistory = () => {
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

      const userResponse = await StandardizedApi.get('/api/v1/auth/current-user');
      if (!userResponse || !userResponse.id) {
        throw new Error('로그인이 필요합니다.');
      }

      const userId = userResponse.id;
      // 표준화 2025-12-08: /api/v1/admin 경로로 통일
      const mappingsResponse = await StandardizedApi.get('/api/v1/admin/mappings/client', {
        clientId: userId
      });
      const mappings = mappingsResponse.data || [];

      const totalAmount = mappings.reduce((sum, mapping) => sum + (mapping.packagePrice || 0), 0);
      const totalSessions = mappings.reduce((sum, mapping) => sum + (mapping.totalSessions || 0), 0);
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      const completedPayments = mappings.filter(mapping => mapping.paymentStatus === 'CONFIRMED').length;
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
      setError(err.message || '결제 데이터를 불러오는데 실패했습니다.');
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
      'CONFIRMED': '결제완료',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'PENDING': '결제대기',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'REJECTED': '결제실패',
      'REFUNDED': '환불완료'
    };
    return statusMap[status] || '미결제';
  };

  const getStatusClass = (status) => {
    const classMap = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CONFIRMED': 'success',
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
      'CARD': '카드',
      'CASH': '현금',
      'BANK_TRANSFER': '계좌이체'
    };
    return methodMap[method] || '미지정';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
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
    <div className="mg-v2-ad-b0kla" data-testid="client-payment-history-page">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="결제 내역">
          <ContentHeader
            title="결제 내역"
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
    if (filter === 'completed') return mapping.paymentStatus === 'CONFIRMED';
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    if (filter === 'pending') return mapping.paymentStatus === 'PENDING';
    if (filter === 'refunded') return mapping.paymentStatus === 'REFUNDED';
    return true;
  }) || [];

  if (isLoading) {
    return (
      <AdminCommonLayout title="결제 내역" className="mg-v2-dashboard-layout">
        {pageShell(
          <div aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text="결제 이력을 불러오는 중..." />
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  if (error) {
    return (
      <AdminCommonLayout title="결제 내역" className="mg-v2-dashboard-layout">
        {pageShell(
          <div className="client-payment-history">
            <div className="payment-error">
              <div className="payment-error__icon">
                <AlertTriangle size={48} />
              </div>
              <h3 className="payment-error__title">오류가 발생했습니다</h3>
              <p className="payment-error__message">{error}</p>
              <MGButton
                variant="primary"
                className={buildErpMgButtonClassName({ variant: 'primary', loading: retryLoading })}
                onClick={() => loadPaymentData({ fromErrorRetry: true })}
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

  if (!paymentData || paymentData.mappings.length === 0) {
    return (
      <AdminCommonLayout title="결제 내역" className="mg-v2-dashboard-layout">
        {pageShell(
          <div className="client-payment-history">
            <div className="payment-empty">
              <div className="payment-empty__icon">
                <CreditCard size={48} />
              </div>
              <h3 className="payment-empty__title">결제 내역이 없습니다</h3>
              <p className="payment-empty__text">아직 결제한 패키지가 없습니다.</p>
              <MGButton
                variant="primary"
                className={buildErpMgButtonClassName({ variant: 'primary', loading: false })}
                onClick={() => {
                  const dashboardPath = getDashboardPath(user?.role);
                  navigate(dashboardPath || '/dashboard');
                }}
                preventDoubleClick={false}
              >
                대시보드로 이동
              </MGButton>
            </div>
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="결제 내역" className="mg-v2-dashboard-layout">
      {pageShell(
        <div className="client-payment-history">
        {/* 통계 카드 */}
        <div className="payment-stats">
          <div className="payment-stat-card payment-stat-card--total">
            <div className="payment-stat-icon">
              <DollarSign size={20} />
            </div>
            <div className="payment-stat-content">
              <div className="payment-stat-label">총 결제금액</div>
              <div className="payment-stat-value">{formatCurrency(paymentData.totalAmount)}</div>
            </div>
          </div>

          <div className="payment-stat-card payment-stat-card--sessions">
            <div className="payment-stat-icon">
              <CalendarCheck size={20} />
            </div>
            <div className="payment-stat-content">
              <div className="payment-stat-label">총 회기</div>
              <div className="payment-stat-value">{paymentData.totalSessions}회</div>
            </div>
          </div>

          <div className="payment-stat-card payment-stat-card--completed">
            <div className="payment-stat-icon">
              <CheckCircle size={20} />
            </div>
            <div className="payment-stat-content">
              <div className="payment-stat-label">결제완료</div>
              <div className="payment-stat-value">{paymentData.completedPayments}건</div>
            </div>
          </div>

          <div className="payment-stat-card payment-stat-card--pending">
            <div className="payment-stat-icon">
              <Clock size={20} />
            </div>
            <div className="payment-stat-content">
              <div className="payment-stat-label">결제대기</div>
              <div className="payment-stat-value">{paymentData.pendingPayments}건</div>
            </div>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div className="payment-filter">
          <h3 className="payment-filter__title">결제 내역</h3>
          <div className="payment-filter__buttons">
            <MGButton
              type="button"
              variant="outline"
              className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} payment-filter__button ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
              preventDoubleClick={false}
            >
              전체
            </MGButton>
            <MGButton
              type="button"
              variant="outline"
              className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} payment-filter__button ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
              preventDoubleClick={false}
            >
              결제완료
            </MGButton>
            <MGButton
              type="button"
              variant="outline"
              className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} payment-filter__button ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
              preventDoubleClick={false}
            >
              결제대기
            </MGButton>
            <MGButton
              type="button"
              variant="outline"
              className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} payment-filter__button ${filter === 'refunded' ? 'active' : ''}`}
              onClick={() => setFilter('refunded')}
              preventDoubleClick={false}
            >
              환불완료
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
                  <h4>{mapping.packageName || '상담 패키지'}</h4>
                </div>
                <div className="payment-item__amount">
                  {formatCurrency(mapping.packagePrice || 0)}
                </div>
              </div>

              <div className="payment-item__body">
                <div className="payment-item__detail">
                  <CalendarCheck size={16} />
                  <span className="payment-item__detail-label">회기 수:</span>
                  <span className="payment-item__detail-value">{mapping.totalSessions || 0}회</span>
                </div>
                <div className="payment-item__detail">
                  <User size={16} />
                  <span className="payment-item__detail-label">상담사:</span>
                  <span className="payment-item__detail-value">{mapping.consultant?.consultantName || '미지정'}</span>
                </div>
                <div className="payment-item__detail">
                  <Calendar size={16} />
                  <span className="payment-item__detail-label">결제일:</span>
                  <span className="payment-item__detail-value">{formatDate(mapping.paymentDate)}</span>
                </div>
                <div className="payment-item__detail">
                  <CreditCard size={16} />
                  <span className="payment-item__detail-label">결제방법:</span>
                  <span className="payment-item__detail-value">{getMethodText(mapping.paymentMethod)}</span>
                </div>
                {mapping.paymentReference && (
                  <div className="payment-item__detail">
                    <FileText size={16} />
                    <span className="payment-item__detail-label">참조번호:</span>
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
          <h3 className="payment-policy__title">환불 정책</h3>
          <div className="payment-policy__list">
            <div className="payment-policy__item">
              <div className="payment-policy__icon">
                <CheckCircle size={20} />
              </div>
              <span>사용하지 않은 회기는 100% 환불 가능합니다.</span>
            </div>
            <div className="payment-policy__item">
              <div className="payment-policy__icon">
                <Clock size={20} />
              </div>
              <span>환불 신청은 결제일로부터 7일 이내에 가능합니다.</span>
            </div>
            <div className="payment-policy__item">
              <div className="payment-policy__icon">
                <Phone size={20} />
              </div>
              <span>환불 문의는 고객센터로 연락해주세요.</span>
            </div>
          </div>
        </div>
        </div>
      )}
    </AdminCommonLayout>
  );
};

export default ClientPaymentHistory;
