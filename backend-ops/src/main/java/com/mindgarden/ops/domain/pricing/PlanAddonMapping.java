package com.mindgarden.ops.domain.pricing;

import com.mindgarden.ops.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "ops_plan_addon")
public class PlanAddonMapping extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id")
    private PricingPlan plan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "addon_id")
    private PricingAddon addon;

    @Column(length = 255)
    private String notes;

    public PricingPlan getPlan() {
        return plan;
    }

    public void setPlan(PricingPlan plan) {
        this.plan = plan;
    }

    public PricingAddon getAddon() {
        return addon;
    }

    public void setAddon(PricingAddon addon) {
        this.addon = addon;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
