package com.mindgarden.ops.domain.pricing;

import com.mindgarden.ops.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "ops_pricing_addon")
public class PricingAddon extends BaseEntity {

    @Column(nullable = false, unique = true, length = 40)
    private String addonCode;

    @Column(nullable = false, length = 120)
    private String displayName;

    @Column(name = "display_name_ko", length = 120)
    private String displayNameKo;

    @Column(length = 60)
    private String category;

    @Column(name = "category_ko", length = 60)
    private String categoryKo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private FeeType feeType = FeeType.FLAT;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(length = 32)
    private String unit;

    @Column(nullable = false)
    private boolean active = true;

    public String getAddonCode() {
        return addonCode;
    }

    public void setAddonCode(String addonCode) {
        this.addonCode = addonCode;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getCategoryKo() {
        return categoryKo;
    }

    public void setCategoryKo(String categoryKo) {
        this.categoryKo = categoryKo;
    }

    public FeeType getFeeType() {
        return feeType;
    }

    public void setFeeType(FeeType feeType) {
        this.feeType = feeType;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
