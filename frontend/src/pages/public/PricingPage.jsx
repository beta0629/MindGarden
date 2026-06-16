/**
 * PricingPage — 요금제 페이지
 *
 * 책임:
 * - 요금제 데이터 로드 (mock JSON → 추후 API 전환 가능 추상화)
 * - 선택된 요금제 상태 관리
 * - PricingTemplate에 데이터/핸들러 주입
 * - PublicErrorBoundary + PublicLayout wrapping
 *
 * 라우트: /pricing
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../components/public/layouts/PublicLayout';
import PublicErrorBoundary from '../../components/public/organisms/PublicErrorBoundary';
import PricingTemplate from '../../components/public/templates/PricingTemplate';
import { toDisplayString } from '../../utils/safeDisplay';
import mockPricingData from '../../data/pricingPlans.json';
import './PricingPage.css';

/**
 * 요금제 데이터 로드 함수.
 * 현재: mock JSON에서 직접 로드 (추후 API 전환 가능 추상화).
 * 추후: StandardizedApi를 통해 /api/v1/public/pricing 으로 전환.
 *
 * @returns {Promise<{plans: Array, matrix: {plans: Array, featureCategories: Array}}>}
 */
async function loadPricingData() {
  /* TODO: 2026-07-01 API 전환 시 StandardizedApi.get('/api/v1/public/pricing')으로 교체 */
  return Promise.resolve(mockPricingData);
}

/** 로딩 상태 표시 컴포넌트 (순수 표현) */
function PricingLoadingView({ message }) {
  return (
    <div className="mg-v2-pricing-page__loading" role="status" aria-live="polite">
      <div className="mg-v2-pricing-page__loading-spinner" aria-hidden="true" />
      <p className="mg-v2-pricing-page__loading-text">{toDisplayString(message)}</p>
    </div>
  );
}

/** 에러 상태 표시 컴포넌트 (순수 표현) */
function PricingErrorView({ message, onRetry }) {
  return (
    <div className="mg-v2-pricing-page__error" role="alert">
      <p className="mg-v2-pricing-page__error-text">{toDisplayString(message)}</p>
      {typeof onRetry === 'function' && (
        <button
          type="button"
          className="mg-v2-pricing-page__error-retry"
          onClick={onRetry}
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

const PricingPage = () => {
  const { t } = useTranslation('common');

  const [plans, setPlans] = useState([]);
  const [matrixPlans, setMatrixPlans] = useState([]);
  const [matrixCategories, setMatrixCategories] = useState([]);
  const [selectedPlanKey, setSelectedPlanKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await loadPricingData();
      setPlans(Array.isArray(data.plans) ? data.plans : []);
      setMatrixPlans(Array.isArray(data.matrix?.plans) ? data.matrix.plans : []);
      setMatrixCategories(Array.isArray(data.matrix?.featureCategories) ? data.matrix.featureCategories : []);
    } catch (err) {
      setLoadError('요금제 정보를 불러오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectPlan = useCallback((planKey) => {
    setSelectedPlanKey(planKey);
  }, []);

  const handleContactSales = useCallback(() => {
    /* TODO: 2026-07-01 Enterprise 문의 모달 또는 /contact 라우트로 전환 */
    window.location.assign('/onboarding');
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <PricingLoadingView message={t('pricing.loading', '요금제 정보를 불러오는 중...')} />;
    }
    if (loadError) {
      return <PricingErrorView message={loadError} onRetry={fetchData} />;
    }
    return (
      <PricingTemplate
        plans={plans}
        matrixPlans={matrixPlans}
        matrixCategories={matrixCategories}
        selectedPlanKey={selectedPlanKey}
        onSelectPlan={handleSelectPlan}
        onContactSales={handleContactSales}
      />
    );
  };

  return (
    <PublicErrorBoundary>
      <PublicLayout>
        <div className="mg-v2-pricing-page" data-testid="pricing-page">
          {renderContent()}
        </div>
      </PublicLayout>
    </PublicErrorBoundary>
  );
};

export default PricingPage;
