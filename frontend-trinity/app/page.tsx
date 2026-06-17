"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import PricingCard from "../components/PricingCard";
import { FeatureCard } from "../components/ui/FeatureCard";
import { TRINITY_CONSTANTS } from "../constants/trinity";
import { COMPONENT_CSS } from "../constants/css-variables";
import { getActivePricingPlans, type PricingPlan } from "../utils/api";
import { parseAndConvertFeatures } from "../utils/feature-names";

const DEFAULT_CURRENCY = "KRW";
const DEFAULT_FEATURE_TEXT = "기본 기능 포함";
const POPULAR_PLAN_DISPLAY_ORDER = 1;

export default function HomePage() {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPricingPlans();
  }, []);

  const loadPricingPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const plans = await getActivePricingPlans();
      const sortedPlans = plans.sort((a, b) => {
        const orderA = (a as any).displayOrder ?? 999;
        const orderB = (b as any).displayOrder ?? 999;
        return orderA - orderB;
      });
      setPricingPlans(sortedPlans);
    } catch (err) {
      console.error("요금제 정보 로드 실패:", err);
      setError("요금제 정보를 불러오는데 실패했습니다.");
      setPricingPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const parseFeatures = (plan: PricingPlan): string[] => {
    const featuresJson = (plan as any).featuresJson;
    if (!featuresJson) {
      return plan.descriptionKo ? [plan.descriptionKo] : [];
    }
    const features = parseAndConvertFeatures(featuresJson);
    if (features.length > 0) return features;
    return plan.descriptionKo ? [plan.descriptionKo] : [];
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <Hero />
        
        {/* Features / Services Section */}
        <section id="services" className="py-24 bg-slate-900 border-b border-slate-800">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">서비스 소개</h2>
              <p className="text-lg text-slate-400">
                {TRINITY_CONSTANTS.COMPANY.NAME}는 복잡한 권한 관리 없이 간단하게 운영할 수 있는 맞춤형 시스템을 제공합니다.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {TRINITY_CONSTANTS.SERVICES.map((service) => (
                <div key={service.id} className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-2xl hover:bg-slate-800 transition-colors">
                  <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center text-2xl mb-6">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{service.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-slate-950">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">합리적인 요금제</h2>
              <p className="text-lg text-slate-400">
                비즈니스 규모에 맞는 최적의 플랜을 선택하세요.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : error && pricingPlans.length === 0 ? (
              <div className="text-center p-8 bg-red-900/20 rounded-xl border border-red-500/20 max-w-2xl mx-auto">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={loadPricingPlans}
                  className="px-4 py-2 bg-slate-800 text-red-400 border border-red-500/30 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  {TRINITY_CONSTANTS.MESSAGES.RETRY}
                </button>
              </div>
            ) : pricingPlans.length === 0 ? (
              <div className="text-center p-8 text-slate-500">
                {TRINITY_CONSTANTS.MESSAGES.NO_PRICING_PLANS}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
                  {pricingPlans.map((plan) => {
                    const features = parseFeatures(plan);
                    const isPopular = (plan as any).displayOrder === POPULAR_PLAN_DISPLAY_ORDER;
                    
                    return (
                      <div key={plan.planId || plan.id || plan.planCode} className={`relative bg-slate-900 border ${isPopular ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-slate-800'} rounded-2xl p-8 flex flex-col`}>
                        {isPopular && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            가장 인기있는 요금제
                          </div>
                        )}
                        <h3 className="text-xl font-semibold text-white mb-2">{plan.nameKo || plan.name || plan.displayNameKo || plan.displayName || plan.planCode}</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                          <span className="text-4xl font-bold text-white">
                            {new Intl.NumberFormat("ko-KR").format(Number(plan.baseFee))}
                          </span>
                          <span className="text-slate-400">원 / 월</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                          {(features.length > 0 ? features : [plan.descriptionKo || plan.description || DEFAULT_FEATURE_TEXT]).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-slate-300">
                              <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <a href="/onboarding" className={`block w-full py-3 px-4 rounded-xl text-center font-semibold transition-colors ${isPopular ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
                          선택하기
                        </a>
                      </div>
                    );
                  })}
                </div>
                {error && (
                  <div className="text-center mt-8 text-amber-400 bg-amber-900/20 border border-amber-500/20 p-4 rounded-lg max-w-2xl mx-auto text-sm">
                    ⚠️ {TRINITY_CONSTANTS.MESSAGES.WARNING_PRICING_PARTIAL}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
