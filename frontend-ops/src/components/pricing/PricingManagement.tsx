"use client";

import { useState } from "react";

import { PlanAddonAttachForm } from "@/components/pricing/PlanAddonAttachForm";
import { PlanCreateForm } from "@/components/pricing/PlanCreateForm";
import { AddonCreateForm } from "@/components/pricing/AddonCreateForm";
import { PlanEditForm } from "@/components/pricing/PlanEditForm";
import { AddonEditForm } from "@/components/pricing/AddonEditForm";
import { Modal } from "@/components/ui/Modal";
import { PricingAddon, PricingPlan } from "@/types/pricing";
import { FEE_TYPE_LABEL } from "@/constants/pricing";

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
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>요금제</th>
                  <th>기본 요금</th>
                  <th>통화</th>
                  <th>활성</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr>
                    <td className="data-table__empty" colSpan={5}>
                      등록된 요금제가 없습니다.
                    </td>
                  </tr>
                ) : (
                  plans.map((plan) => (
                    <tr key={plan.id}>
                      <td>
                        <div className="table-primary">
                          {plan.displayNameKo || plan.displayName}
                        </div>
                        <div className="table-secondary">
                          {plan.planCode} / {plan.displayName}
                        </div>
                      </td>
                      <td>{plan.baseFee.toLocaleString("ko-KR")}</td>
                      <td>{plan.currency}</td>
                      <td>{plan.active ? "Y" : "N"}</td>
                      <td>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => setEditingPlanId(plan.id)}
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pricing-grid__column">
          <h2>애드온 목록</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>애드온</th>
                  <th>카테고리</th>
                  <th>요금 방식</th>
                  <th>단가</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {addons.length === 0 ? (
                  <tr>
                    <td className="data-table__empty" colSpan={5}>
                      등록된 애드온이 없습니다.
                    </td>
                  </tr>
                ) : (
                  addons.map((addon) => (
                    <tr key={addon.id}>
                      <td>
                        <div className="table-primary">
                          {addon.displayNameKo || addon.displayName}
                        </div>
                        <div className="table-secondary">{addon.addonCode}</div>
                      </td>
                      <td>{addon.categoryKo || addon.category || "-"}</td>
                      <td>{FEE_TYPE_LABEL[addon.feeType]}</td>
                      <td>{addon.unitPrice.toLocaleString("ko-KR")}</td>
                      <td>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => setEditingAddonId(addon.id)}
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

