"use client";

import { useEffect, useState } from "react";
import {
  fetchPricingAddons,
  fetchPricingPlans
} from "@/services/pricingService";
import { PricingManagement } from "@/components/pricing/PricingManagement";
import { PricingPlan, PricingAddon } from "@/types/pricing";

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [addons, setAddons] = useState<PricingAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [plansData, addonsData] = await Promise.all([
          fetchPricingPlans(),
          fetchPricingAddons()
        ]);
        setPlans(plansData);
        setAddons(addonsData);
      } catch (err) {
        console.error("요금제 데이터 로드 실패:", err);
        setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <section className="panel">
        <header className="panel__header">
          <h1>로딩 중...</h1>
        </header>
        <div className="loading-message">
          <p>데이터를 불러오는 중입니다...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <header className="panel__header">
          <h1>오류 발생</h1>
        </header>
        <div className="error-message">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  return <PricingManagement plans={plans} addons={addons} />;
}
