/**
 * App.js에는 현재 import·라우트로 연결되지 않음(제거된 상태).
 * 세무 전용 개선 UI 참고 및 향후 Salary/ERP 흐름에 통합할 때 재사용하기 위해 저장소에 유지.
 */
import { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import StandardizedApi from '../../utils/standardizedApi';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentHeader, ContentArea } from '../dashboard-v2/content';
import {
  SALARY_API_ENDPOINTS,
  TAX_BREAKDOWN_ORDER,
  TAX_BREAKDOWN_LABELS,
  TAX_TYPE
} from '../../constants/salaryConstants';
import { COMMON_CODE_API } from '../../constants/api';
import { formatCurrency } from '../../utils/formatUtils';
import { FileText } from 'lucide-react';
import './ErpCommon.css';
import './ImprovedTaxManagement.css';
import notificationManager from '../../utils/notification';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import MGButton from '../common/MGButton';
import ErpPageShell from './shell/ErpPageShell';
import UnifiedModal from '../common/modals/UnifiedModal';
import {
  ErpKpiStatCard,
  ErpEmptyState,
  ErpSafeText,
  ErpSafeNumber,
  ERP_NUMBER_FORMAT,
  ERP_KPI_STAT_VARIANT,
  ErpFilterToolbar,
  useErpSilentRefresh
} from './common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';

/** 신고 탭 데모 문구(백엔드 연동 전) */
const REPORT_TAB_COPY = {
  VAT_NEXT_DATE: '2026-01-25',
  INCOME_RANGE_START: '2026-01-01',
  INCOME_RANGE_END: '2026-12-31'
};

const DATE_PAD_LEN = 2;

/** 현재 월 YYYY-MM */
const getDefaultPeriod = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(DATE_PAD_LEN, '0')}`;
};

/** period(YYYY-MM) → 해당 월의 startDate, endDate (YYYY-MM-DD) */
const periodToDateRange = (period) => {
  const [y, m] = period.split('-').map(Number);
  const startDate = `${period}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${period}-${String(lastDay).padStart(DATE_PAD_LEN, '0')}`;
  return { startDate, endDate };
};

/**
 * 공통코드 extraData에서 세율 표시 문자열
 * @param {object} category
 * @returns {string}
 */
const getCategoryTaxRateLabel = (category) => {
  try {
    if (category?.extraData) {
      const extraData = JSON.parse(category.extraData);
      const rate = extraData?.taxRate;
      if (rate != null && rate !== '') {
        return `${rate}%`;
      }
    }
  } catch {
    return 'N/A';
  }
  return 'N/A';
};

/**
 * 개선된 ERP 세무 관리 페이지 - 실데이터 /api/v1/admin/salary/tax/* 연동
 */
const ImprovedTaxManagement = () => {
  useSession();
  const sessionUser = sessionManager.getUser();
  const sessionIsLoggedIn = sessionManager.isLoggedIn();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState(() => getDefaultPeriod());
  const [statistics, setStatistics] = useState(null);
  const [calculationsList, setCalculationsList] = useState([]);
  const [taxCategories, setTaxCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { silentListRefreshing, setSilentListRefreshing } = useErpSilentRefresh();
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newTaxItem, setNewTaxItem] = useState({
    calculationId: '',
    grossAmount: '',
    taxType: TAX_TYPE.VAT,
    taxRate: '',
    taxName: '',
    description: ''
  });

  const loadData = async(options = {}) => {
    const silent = options.silent === true;
    try {
      if (silent) {
        setSilentListRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      switch (activeTab) {
        case 'overview':
          await loadTaxOverview();
          break;
        case 'calculations':
          await loadTaxCalculations();
          break;
        case 'reports':
          await loadTaxReports();
          break;
        case 'settings':
          await loadTaxSettings();
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      if (silent) {
        setSilentListRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (sessionIsLoggedIn && sessionUser?.id) {
      loadData({});
    }
  }, [sessionIsLoggedIn, sessionUser?.id, activeTab, selectedPeriod]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTaxOverview = async() => {
    try {
      const response = await StandardizedApi.get(SALARY_API_ENDPOINTS.TAX_STATISTICS, {
        period: selectedPeriod
      });
      const data = response?.data ?? response;
      setStatistics(data || null);
    } catch (err) {
      console.error('세금 개요 로드 실패:', err);
      setError('세금 개요를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadTaxCalculations = async() => {
    try {
      const statsRes = await StandardizedApi.get(SALARY_API_ENDPOINTS.TAX_STATISTICS, {
        period: selectedPeriod
      });
      const statsData = statsRes?.data ?? statsRes;
      setStatistics(statsData || null);
      const { startDate, endDate } = periodToDateRange(selectedPeriod);
      const calcRes = await StandardizedApi.get(SALARY_API_ENDPOINTS.CALCULATIONS, {
        startDate,
        endDate
      });
      const list = calcRes?.data ?? calcRes ?? [];
      setCalculationsList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('세금 계산 내역 로드 실패:', err);
      setError('세금 계산 내역을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadTaxReports = async() => {
    try {
      console.log('세금 보고서 데이터 로드');
    } catch (err) {
      console.error('세금 보고서 로드 실패:', err);
      setError('세금 보고서를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadTaxSettings = async() => {
    try {
      const response = await StandardizedApi.get(COMMON_CODE_API.BASE, {
        codeGroup: 'TAX_CATEGORY'
      });
      const data = response?.data ?? response ?? [];
      setTaxCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('세금 카테고리 로드 실패:', err);
      setError('세금 카테고리를 불러올 수 없습니다.');
    }
  };

  const handleCreateTaxItem = async() => {
    const calculationId = newTaxItem.calculationId ? Number(newTaxItem.calculationId) : null;
    const grossAmount = newTaxItem.grossAmount ? Number(newTaxItem.grossAmount) : null;
    const taxRate = newTaxItem.taxRate ? Number(newTaxItem.taxRate) : null;
    if (!calculationId || grossAmount == null || !newTaxItem.taxType || taxRate == null) {
      notificationManager.warning('급여 계산, 과세 금액, 세금 유형, 세율을 입력해 주세요.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await StandardizedApi.post(SALARY_API_ENDPOINTS.TAX_CALCULATE, {
        calculationId,
        grossAmount,
        taxType: newTaxItem.taxType,
        taxRate,
        taxName: newTaxItem.taxName || undefined,
        description: newTaxItem.description || undefined
      });
      notificationManager.success('추가 세금이 계산·반영되었습니다.');
      setShowCreateModal(false);
      setNewTaxItem({
        calculationId: '',
        grossAmount: '',
        taxType: TAX_TYPE.VAT,
        taxRate: '',
        taxName: '',
        description: ''
      });
      await loadTaxCalculations();
    } catch (err) {
      console.error('세금 항목 생성 실패:', err);
      setError(err?.message || '세금 항목 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /* 백엔드 PUT/DELETE /api/v1/admin/salary/tax/* 미지원. 기획 확정 시 추가 후 연동 */

  const renderBreakdownTable = (breakdown) => (
    <div className="im-tax-mgmt__breakdown-wrap">
      <h3 className="mg-v2-ad-b0kla__chart-title im-tax-mgmt__breakdown-title">세목별 breakdown</h3>
      <table className="im-tax-mgmt__table salary-table">
        <thead>
          <tr>
            <th className="im-tax-mgmt__th" scope="col">
              세목
            </th>
            <th className="im-tax-mgmt__th im-tax-mgmt__th--numeric" scope="col">
              금액
            </th>
          </tr>
        </thead>
        <tbody>
          {TAX_BREAKDOWN_ORDER.map((key) => (
            <tr key={key}>
              <td className="im-tax-mgmt__td">
                <ErpSafeText value={TAX_BREAKDOWN_LABELS[key] || key} />
              </td>
              <td className="im-tax-mgmt__td im-tax-mgmt__td--numeric">
                <ErpSafeNumber value={breakdown[key]} formatType={ERP_NUMBER_FORMAT.CURRENCY} tag="span" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!sessionIsLoggedIn || !sessionUser) {
    return (
      <AdminCommonLayout title="세무 관리">
        <ContentArea className="erp-system erp-container" ariaLabel="세무 관리">
          <ErpPageShell mainAriaLabel="세무 관리 로그인 안내">
            <div className="im-tax-mgmt__login-hint">
              <ErpEmptyState
                title="로그인이 필요합니다."
                description="세무 관리 기능을 사용하려면 로그인해 주세요."
              />
            </div>
          </ErpPageShell>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="세무 관리">
      <ContentArea className="erp-system erp-container" ariaLabel="세무 관리 콘텐츠">
        <ErpPageShell
          mainAriaLabel="세무 관리 본문"
          headerSlot={
            <>
              <ContentHeader
                title="세무 관리"
                subtitle="세금 계산, 신고, 납부를 체계적으로 관리할 수 있습니다."
              />
              <div className="mg-w-full mg-mb-md">
                <ErpFilterToolbar
                  ariaLabel="세무 조회 필터"
                  primaryRow={(
                    <div className="im-tax-mgmt__filter-toolbar-row">
                      <label className="mg-v2-content-header__period im-tax-mgmt__header-period">
                        <span className="im-tax-mgmt__header-period-label">기간</span>
                        <input
                          type="month"
                          value={selectedPeriod}
                          onChange={(e) => setSelectedPeriod(e.target.value)}
                          className="mg-v2-ad-b0kla__input im-tax-mgmt__month-input"
                        />
                      </label>
                      {activeTab === 'calculations' && (
                        <MGButton
                          variant="primary"
                          size="medium"
                          type="button"
                          className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__btn mg-v2-ad-b0kla__btn--primary'
                          })}
                          onClick={() => setShowCreateModal(true)}
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        >
                          추가 세금 계산
                        </MGButton>
                      )}
                    </div>
                  )}
                  secondaryRow={(
                    <div className="im-tax-mgmt__filter-toolbar-row">
                      <MGButton
                        variant="secondary"
                        size="small"
                        className={buildErpMgButtonClassName({
                          variant: 'secondary',
                          size: 'sm',
                          loading: silentListRefreshing
                        })}
                        onClick={() => loadData({ silent: true })}
                        loading={silentListRefreshing}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        disabled={loading || silentListRefreshing}
                        aria-label="데이터 새로고침"
                      >
                        데이터 새로고침
                      </MGButton>
                    </div>
                  )}
                />
              </div>
            </>
          }
          tabsSlot={
            <div className="mg-v2-ad-b0kla__pill-group" role="tablist">
              <MGButton
                type="button"
                variant="outline"
                size="small"
                className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-ad-b0kla__pill ${activeTab === 'overview' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                onClick={() => setActiveTab('overview')}
                preventDoubleClick={false}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              >
                개요
              </MGButton>
              <MGButton
                type="button"
                variant="outline"
                size="small"
                className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-ad-b0kla__pill ${activeTab === 'calculations' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                onClick={() => setActiveTab('calculations')}
                preventDoubleClick={false}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              >
                세금 계산
              </MGButton>
              <MGButton
                type="button"
                variant="outline"
                size="small"
                className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-ad-b0kla__pill ${activeTab === 'reports' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                onClick={() => setActiveTab('reports')}
                preventDoubleClick={false}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              >
                신고서
              </MGButton>
              <MGButton
                type="button"
                variant="outline"
                size="small"
                className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-ad-b0kla__pill ${activeTab === 'settings' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                onClick={() => setActiveTab('settings')}
                preventDoubleClick={false}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              >
                설정
              </MGButton>
            </div>
          }
        >
          <div className="im-tax-mgmt__shell-body" aria-busy={loading}>
            {loading && (
              <div role="status" aria-live="polite" aria-busy="true">
                <UnifiedLoading type="inline" text="로딩 중..." />
              </div>
            )}

            {error && (
              <div className="im-tax-mgmt__error-block erp-error">
                <SafeErrorDisplay error={error} variant="banner" />
                <MGButton
                  variant="outline"
                  size="small"
                  onClick={() => loadData({})}
                  loading={loading}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  disabled={loading || silentListRefreshing}
                  aria-label="다시 시도"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'sm',
                    loading
                  })}
                >
                  다시 시도
                </MGButton>
              </div>
            )}

            {!loading && !error && (
              <>
                {activeTab === 'overview' && (
                  <section className="im-tax-mgmt__section" aria-labelledby="im-tax-overview-heading">
                    <h2 id="im-tax-overview-heading" className="mg-v2-ad-b0kla__chart-title im-tax-mgmt__section-title">
                      세무 개요
                    </h2>
                    {statistics ? (
                      <>
                        <div className="im-tax-mgmt__kpi-grid">
                          <ErpKpiStatCard
                            title="총 세금액"
                            value={statistics.totalTaxAmount}
                            formatType={ERP_NUMBER_FORMAT.CURRENCY}
                            variant={ERP_KPI_STAT_VARIANT.PRIMARY}
                            trend={{ direction: 'neutral', label: selectedPeriod }}
                          />
                          <ErpKpiStatCard
                            title="계산 건수"
                            value={statistics.totalCalculations ?? 0}
                            formatType={ERP_NUMBER_FORMAT.COUNT}
                            trend={{ direction: 'neutral', label: '급여 계산 기준' }}
                          />
                          <ErpKpiStatCard
                            title="총 급여"
                            value={statistics.totalGrossSalary}
                            formatType={ERP_NUMBER_FORMAT.CURRENCY}
                            trend={{ direction: 'neutral', label: '총 지급액' }}
                          />
                          <ErpKpiStatCard
                            title="실지급액"
                            value={statistics.totalNetSalary}
                            formatType={ERP_NUMBER_FORMAT.CURRENCY}
                            trend={{ direction: 'neutral', label: '공제 후' }}
                          />
                        </div>
                        {statistics.breakdown ? renderBreakdownTable(statistics.breakdown) : null}
                      </>
                    ) : (
                      <ErpEmptyState
                        title="해당 기간 데이터가 없습니다."
                        description="다른 기간을 선택하거나 급여·세금 계산을 먼저 진행해 주세요."
                      />
                    )}
                  </section>
                )}

                {activeTab === 'calculations' && (
                  <section className="im-tax-mgmt__section" aria-labelledby="im-tax-calc-heading">
                    <h2 id="im-tax-calc-heading" className="mg-v2-ad-b0kla__chart-title im-tax-mgmt__section-title">
                      세금 계산 · 기간별 통계
                    </h2>
                    {statistics ? (
                      <>
                        <div className="im-tax-mgmt__kpi-grid im-tax-mgmt__kpi-grid--tight">
                          <ErpKpiStatCard
                            title="총 세금"
                            value={statistics.totalTaxAmount}
                            formatType={ERP_NUMBER_FORMAT.CURRENCY}
                            variant={ERP_KPI_STAT_VARIANT.PRIMARY}
                          />
                          <ErpKpiStatCard
                            title="계산 건수"
                            value={statistics.totalCalculations ?? 0}
                            formatType={ERP_NUMBER_FORMAT.COUNT}
                          />
                        </div>
                        {statistics.breakdown ? renderBreakdownTable(statistics.breakdown) : null}
                        <p className="im-tax-mgmt__hint">
                          상단 「추가 세금 계산」으로 급여 계산에 추가 세금을 반영할 수 있습니다.
                        </p>
                      </>
                    ) : (
                      <ErpEmptyState
                        title="해당 기간 데이터가 없습니다."
                        description="통계를 불러올 수 없거나 급여 계산 데이터가 없습니다."
                      />
                    )}
                  </section>
                )}

                {activeTab === 'reports' && (
                  <section className="im-tax-mgmt__section" aria-labelledby="im-tax-report-heading">
                    <h2 id="im-tax-report-heading" className="mg-v2-ad-b0kla__chart-title im-tax-mgmt__section-title">
                      세금 신고서
                    </h2>
                    <div className="im-tax-mgmt__report-grid">
                      <article className="im-tax-mgmt__report-card">
                        <div className="im-tax-mgmt__report-card-head">
                          <h3 className="im-tax-mgmt__report-card-title">부가가치세 신고</h3>
                          <FileText className="im-tax-mgmt__report-icon--primary" size={20} aria-hidden />
                        </div>
                        <p className="im-tax-mgmt__report-desc">분기별 부가가치세 신고서 작성 및 제출</p>
                        <div className="im-tax-mgmt__report-meta">
                          <div className="im-tax-mgmt__report-meta-row">
                            <span className="im-tax-mgmt__report-meta-label">다음 신고일:</span>
                            <ErpSafeText value={REPORT_TAB_COPY.VAT_NEXT_DATE} />
                          </div>
                          <div className="im-tax-mgmt__report-meta-row">
                            <span className="im-tax-mgmt__report-meta-label">상태:</span>
                            <ErpSafeText value="준비 중" />
                          </div>
                        </div>
                        <div className="im-tax-mgmt__report-actions">
                          <MGButton
                            variant="primary"
                            size="medium"
                            type="button"
                            className={buildErpMgButtonClassName({
                              variant: 'primary',
                              size: 'md',
                              loading: false,
                              className: 'mg-v2-ad-b0kla__btn mg-v2-ad-b0kla__btn--primary'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          >
                            신고서 작성
                          </MGButton>
                        </div>
                      </article>
                      <article className="im-tax-mgmt__report-card">
                        <div className="im-tax-mgmt__report-card-head">
                          <h3 className="im-tax-mgmt__report-card-title">소득세 신고</h3>
                          <FileText className="im-tax-mgmt__report-icon--success" size={20} aria-hidden />
                        </div>
                        <p className="im-tax-mgmt__report-desc">연말정산 및 소득세 신고서 작성</p>
                        <div className="im-tax-mgmt__report-meta">
                          <div className="im-tax-mgmt__report-meta-row">
                            <span className="im-tax-mgmt__report-meta-label">신고 기간:</span>
                            <ErpSafeText
                              value={`${REPORT_TAB_COPY.INCOME_RANGE_START} ~ ${REPORT_TAB_COPY.INCOME_RANGE_END}`}
                            />
                          </div>
                          <div className="im-tax-mgmt__report-meta-row">
                            <span className="im-tax-mgmt__report-meta-label">상태:</span>
                            <ErpSafeText value="진행 중" />
                          </div>
                        </div>
                        <div className="im-tax-mgmt__report-actions">
                          <MGButton
                            variant="primary"
                            size="medium"
                            type="button"
                            className={buildErpMgButtonClassName({
                              variant: 'primary',
                              size: 'md',
                              loading: false,
                              className: 'mg-v2-ad-b0kla__btn mg-v2-ad-b0kla__btn--primary'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          >
                            신고서 확인
                          </MGButton>
                        </div>
                      </article>
                    </div>
                  </section>
                )}

                {activeTab === 'settings' && (
                  <section className="im-tax-mgmt__section" aria-labelledby="im-tax-settings-heading">
                    <h2 id="im-tax-settings-heading" className="mg-v2-ad-b0kla__chart-title im-tax-mgmt__section-title">
                      세무 설정
                    </h2>
                    {taxCategories.length === 0 ? (
                      <ErpEmptyState
                        title="등록된 세금 카테고리가 없습니다."
                        description="공통코드(TAX_CATEGORY)를 확인하거나 관리자에게 문의해 주세요."
                      />
                    ) : (
                      <div className="im-tax-mgmt__settings-grid">
                        {taxCategories.map((category) => (
                          <article key={category.id} className="im-tax-mgmt__settings-card">
                            <div className="im-tax-mgmt__settings-card-head">
                              <h3 className="im-tax-mgmt__settings-card-title">
                                <ErpSafeText value={category.codeLabel} />
                              </h3>
                              <span className="im-tax-mgmt__settings-badge">
                                <ErpSafeText value="활성" />
                              </span>
                            </div>
                            <p className="im-tax-mgmt__settings-desc">
                              <ErpSafeText value={category.codeDescription} fallback="-" />
                            </p>
                            <div className="im-tax-mgmt__settings-meta">
                              <div>
                                <span className="im-tax-mgmt__report-meta-label">코드:</span>
                                <ErpSafeText value={category.codeValue} fallback="-" />
                              </div>
                              <div>
                                <span className="im-tax-mgmt__report-meta-label">세율:</span>
                                <ErpSafeText value={getCategoryTaxRateLabel(category)} />
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        </ErpPageShell>
      </ContentArea>

      <UnifiedModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="추가 세금 계산"
        subtitle="급여 계산에 추가 세금을 반영합니다."
        size="medium"
        variant="form"
        backdropClick={!loading}
        showCloseButton
        loading={loading}
        className="mg-v2-ad-b0kla"
        actions={
          <>
            <MGButton
              variant="secondary"
              size="medium"
              type="button"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
              onClick={() => setShowCreateModal(false)}
              disabled={loading}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            >
              취소
            </MGButton>
            <MGButton
              variant="primary"
              size="medium"
              type="button"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'md',
                loading
              })}
              onClick={handleCreateTaxItem}
              loading={loading}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            >
              계산 반영
            </MGButton>
          </>
        }
      >
        <div className="im-tax-mgmt-modal__field">
          <label className="im-tax-mgmt-modal__label" htmlFor="tax-modal-calculationId">
            급여 계산 *
          </label>
          <select
            id="tax-modal-calculationId"
            className="mg-v2-select"
            value={newTaxItem.calculationId}
            onChange={(e) => setNewTaxItem({ ...newTaxItem, calculationId: e.target.value })}
          >
            <option value="">선택</option>
            {calculationsList.map((c) => (
              <option key={c.id} value={c.id}>
                ID {c.id} · {c.consultant?.name ?? c.consultantId ?? '-'} ·{' '}
                {formatCurrency(c.grossSalary, { showCurrency: true })}
              </option>
            ))}
          </select>
          {calculationsList.length === 0 && (
            <small className="im-tax-mgmt-modal__hint">
              해당 기간 급여 계산이 없습니다. 급여 관리에서 먼저 계산해 주세요.
            </small>
          )}
        </div>
        <div className="im-tax-mgmt-modal__field">
          <label className="im-tax-mgmt-modal__label" htmlFor="tax-modal-grossAmount">
            과세 기준 금액 *
          </label>
          <input
            id="tax-modal-grossAmount"
            type="number"
            min="0"
            step="1"
            className="mg-v2-ad-b0kla__input"
            value={newTaxItem.grossAmount}
            onChange={(e) => setNewTaxItem({ ...newTaxItem, grossAmount: e.target.value })}
          />
        </div>
        <div className="im-tax-mgmt-modal__field">
          <label className="im-tax-mgmt-modal__label" htmlFor="tax-modal-taxType">
            세금 유형 *
          </label>
          <select
            id="tax-modal-taxType"
            className="mg-v2-select"
            value={newTaxItem.taxType}
            onChange={(e) => setNewTaxItem({ ...newTaxItem, taxType: e.target.value })}
          >
            {Object.entries(TAX_TYPE).map(([k, v]) => (
              <option key={k} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="im-tax-mgmt-modal__field">
          <label className="im-tax-mgmt-modal__label" htmlFor="tax-modal-taxRate">
            세율 (%) *
          </label>
          <input
            id="tax-modal-taxRate"
            type="number"
            min="0"
            step="0.01"
            className="mg-v2-ad-b0kla__input"
            value={newTaxItem.taxRate}
            onChange={(e) => setNewTaxItem({ ...newTaxItem, taxRate: e.target.value })}
          />
        </div>
        <div className="im-tax-mgmt-modal__field">
          <label className="im-tax-mgmt-modal__label" htmlFor="tax-modal-taxName">
            세금명 (선택)
          </label>
          <input
            id="tax-modal-taxName"
            type="text"
            className="mg-v2-ad-b0kla__input"
            value={newTaxItem.taxName}
            onChange={(e) => setNewTaxItem({ ...newTaxItem, taxName: e.target.value })}
          />
        </div>
        <div className="im-tax-mgmt-modal__field">
          <label className="im-tax-mgmt-modal__label" htmlFor="tax-modal-description">
            설명 (선택)
          </label>
          <textarea
            id="tax-modal-description"
            className="mg-v2-ad-b0kla__input"
            rows={2}
            value={newTaxItem.description}
            onChange={(e) => setNewTaxItem({ ...newTaxItem, description: e.target.value })}
          />
        </div>
      </UnifiedModal>
    </AdminCommonLayout>
  );
};

export default ImprovedTaxManagement;
