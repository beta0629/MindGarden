package com.mindgarden.ops.domain.config;

import com.mindgarden.ops.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "ops_feature_flag")
public class FeatureFlag extends BaseEntity {

    @Column(nullable = false, unique = true, length = 64)
    private String flagKey;

    @Column(length = 200)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private FeatureFlagState state = FeatureFlagState.DISABLED;

    @Column(length = 64)
    private String targetScope;

    private Instant expiresAt;

    public String getFlagKey() {
        return flagKey;
    }

    public void setFlagKey(String flagKey) {
        this.flagKey = flagKey;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public FeatureFlagState getState() {
        return state;
    }

    public void setState(FeatureFlagState state) {
        this.state = state;
    }

    public String getTargetScope() {
        return targetScope;
    }

    public void setTargetScope(String targetScope) {
        this.targetScope = targetScope;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
}
