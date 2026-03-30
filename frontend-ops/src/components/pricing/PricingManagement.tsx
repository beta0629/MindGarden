"use client";

import { useState } from "react";

import { PlanAddonAttachForm } from "@/components/pricing/PlanAddonAttachForm";
import { PlanCreateForm } from "@/components/pricing/PlanCreateForm";
import { AddonCreateForm } from "@/components/pricing/AddonCreateForm";
import { PlanEditForm } from "@/components/pricing/PlanEditForm";
import { AddonEditForm } from "@/components/pricing/AddonEditForm";
import { Modal } from "@/components/ui/Modal";
import { PricingCardList } from "@/components/pricing/PricingCardList";
import { AddonCardList } from "@/components/pricing/AddonCardList";
import { PricingAddon, PricingPlan } from "@/types/pricing";

interface Props {
  plans: PricingPlan[];
  addons: PricingAddon[];
}

export function PricingManagement({ plans, addons }: Props) {
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);

  const editingPlan = editingPlanId
    ? plans.find((plan) => plan.id === editingPlanId) ?? null
    : null;
  const editingAddon = editingAddonId
    ? addons.find((addon) => addon.id === editingAddonId) ?? null
    : null;

  return (
    <section className="panel">
      <header className="panel__header">
        <h1>요금제 & 애드온 관리</h1>
        <p>Phase 1 핵심 요금제 데이터를 생성·연결하고 감사 로그를 남깁니다.</p>
      </header>

      <div className="pricing-grid">
        <div className="pricing-grid__column">
          <h2>요금제 목록</h2>
          <PricingCardList 
            plans={plans} 
            onEdit={(planId) => setEditingPlanId(planId)}
          />
        </div>

        <div className="pricing-grid__column">
          <h2>애드온 목록</h2>
          <AddonCardList 
            addons={addons} 
            onEdit={(addonId) => setEditingAddonId(addonId)}
          />
        </div>
      </div>

      <div className="form-stack">
        <PlanCreateForm />
        <AddonCreateForm />
        <PlanAddonAttachForm plans={plans} addons={addons} />
      </div>

      <Modal
        open={Boolean(editingPlan)}
        onClose={() => setEditingPlanId(null)}
        title={editingPlan?.displayNameKo || editingPlan?.displayName}
      >
        {editingPlan && (
          <PlanEditForm
            plan={editingPlan}
            onClose={() => setEditingPlanId(null)}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(editingAddon)}
        onClose={() => setEditingAddonId(null)}
        title={editingAddon?.displayNameKo || editingAddon?.displayName}
      >
        {editingAddon && (
          <AddonEditForm
            addon={editingAddon}
            onClose={() => setEditingAddonId(null)}
          />
        )}
      </Modal>
    </section>
  );
}

