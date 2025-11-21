"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Section from "../components/Section";
import Card from "../components/Card";
import PricingCard from "../components/PricingCard";
import Footer from "../components/Footer";
import { TRINITY_CONSTANTS } from "../constants/trinity";
import { COMPONENT_CSS } from "../constants/css-variables";
import { getActivePricingPlans, type PricingPlan } from "../utils/api";
import { parseAndConvertFeatures } from "../utils/feature-names";

// 상수 정의
const DEFAULT_CURRENCY = "KRW";
const DEFAULT_FEATURE_TEXT = "기본 기능 포함";
const POPULAR_PLAN_DISPLAY_ORDER = 1;

export default function HomePage() {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 실시간 요금제 정보 로드
  useEffect(() => {
    loadPricingPlans();
  }, []);

  const loadPricingPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const plans = await getActivePricingPlans();
      // displayOrder로 정렬
      const sortedPlans = plans.sort((a, b) => {
        // displayOrder가 있으면 사용, 없으면 기본 순서 유지
        const orderA = (a as any).displayOrder ?? 999;
        const orderB = (b as any).displayOrder ?? 999;
        return orderA - orderB;
      });
      setPricingPlans(sortedPlans);
    } catch (err) {
      console.error("요금제 정보 로드 실패:", err);
      setError("요금제 정보를 불러오는데 실패했습니다.");
      // 에러 시 기본 요금제 정보 사용
      setPricingPlans([]);
    } finally {
      setLoading(false);
    }
  };

  // features_json 파싱 (JSON 문자열 또는 배열) 및 한글 변환
  const parseFeatures = (plan: PricingPlan): string[] => {
    const featuresJson = (plan as any).featuresJson;
    if (!featuresJson) {
      // features_json이 없으면 descriptionKo를 사용
      if (plan.descriptionKo) {
        return [plan.descriptionKo];
      }
      return [];
    }
    
    const features = parseAndConvertFeatures(featuresJson);
    if (features.length > 0) {
      return features;
    }
    
    // 파싱 실패 시 descriptionKo 사용
    return plan.descriptionKo ? [plan.descriptionKo] : [];
  };

  return (
    <div>
      <Header />
      <Hero />
      
      <Section id="about" title="회사 소개">
        <div className="trinity-section__text">
          <strong>{TRINITY_CONSTANTS.COMPANY.NAME}</strong>는 소상공인을 위한 혁신적인 솔루션을 제공하는 기업입니다.
        </div>
        <div className="trinity-section__text">
          <strong>{TRINITY_CONSTANTS.BRANDING.CORESOLUTION_NAME}</strong>은 대기업 수준의 ERP 시스템을 저렴한 비용으로 제공하여, 
          소상공인도 전문적인 시스템을 활용할 수 있도록 지원합니다.
        </div>
        <div className="trinity-section__text">
          복잡한 권한 관리 없이 간단하게 운영할 수 있으며, 업종별 맞춤 기능을 제공합니다.
        </div>
      </Section>

      <Section id="services" title="서비스 소개" bgSecondary wide>
        <div className="trinity-pricing">
          {TRINITY_CONSTANTS.SERVICES.map((service) => (
            <Card
              key={service.id}
              icon={service.icon}
              iconColor={service.color as "primary" | "success" | "warning"}
              title={service.title}
              description={service.description}
            />
          ))}
        </div>
      </Section>

      <Section id="pricing" title="가격 정보" wide>
        {loading ? (
          <div className={COMPONENT_CSS.PRICING.MESSAGE}>
            {TRINITY_CONSTANTS.MESSAGES.LOADING_PRICING_HOMEPAGE}
          </div>
        ) : error && pricingPlans.length === 0 ? (
          <div className={`${COMPONENT_CSS.PRICING.MESSAGE} ${COMPONENT_CSS.PRICING.MESSAGE_ERROR}`}>
            {error}
            <br />
            <button
              onClick={loadPricingPlans}
              className={COMPONENT_CSS.PRICING.RETRY_BUTTON}
            >
              {TRINITY_CONSTANTS.MESSAGES.RETRY}
            </button>
          </div>
        ) : pricingPlans.length === 0 ? (
          <div className={COMPONENT_CSS.PRICING.MESSAGE}>
            {TRINITY_CONSTANTS.MESSAGES.NO_PRICING_PLANS}
          </div>
        ) : (
          <>
            <div className={COMPONENT_CSS.PRICING.CONTAINER}>
              {pricingPlans.map((plan) => {
                const features = parseFeatures(plan);
                const isPopular = (plan as any).displayOrder === POPULAR_PLAN_DISPLAY_ORDER;
                
                return (
                  <PricingCard
                    key={plan.planId}
                    id={plan.planId}
                    name={plan.nameKo || plan.name || plan.displayNameKo || plan.displayName || plan.planCode}
                    price={Number(plan.baseFee)}
                    currency={plan.currency || DEFAULT_CURRENCY}
                    features={features.length > 0 ? features : [plan.descriptionKo || plan.description || DEFAULT_FEATURE_TEXT]}
                    popular={isPopular}
                  />
                );
              })}
            </div>
            {error && (
              <div className={`${COMPONENT_CSS.PRICING.MESSAGE} ${COMPONENT_CSS.PRICING.MESSAGE_WARNING}`}>
                ⚠️ {TRINITY_CONSTANTS.MESSAGES.WARNING_PRICING_PARTIAL}
              </div>
            )}
          </>
        )}
      </Section>

      <Footer />
    </div>
  );
}
