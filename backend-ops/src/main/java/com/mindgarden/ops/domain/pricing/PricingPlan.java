package com.mindgarden.ops.domain.pricing;

import com.mindgarden.ops.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "ops_pricing_plan")
public class PricingPlan extends BaseEntity {

    @Column(nullable = false, unique = true, length = 40)
    private String planCode;

    @Column(nullable = false, length = 120)
    private String displayName;

    @Column(name = "display_name_ko", length = 120)
    private String displayNameKo;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal baseFee;

    @Column(nullable = false, length = 8)
    private String currency = "KRW";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "description_ko", columnDefinition = "TEXT")
    private String descriptionKo;

    @Column(nullable = false)
    private boolean active = true;

    public String getPlanCode() {
        return planCode;
    }

    public void setPlanCode(String planCode) {
        this.planCode = planCode;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayNameKo() {
        return displayNameKo;
    }

    public void setDisplayNameKo(String displayNameKo) {
        this.displayNameKo = displayNameKo;
    }

    public BigDecimal getBaseFee() {
        return baseFee;
    }

    public void setBaseFee(BigDecimal baseFee) {
        this.baseFee = baseFee;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDescriptionKo() {
        return descriptionKo;
    }

    public void setDescriptionKo(String descriptionKo) {
        this.descriptionKo = descriptionKo;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
