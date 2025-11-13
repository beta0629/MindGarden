package com.mindgarden.ops.controller.dto;

public record DashboardMetricsResponse(
    long pendingOnboarding,
    long activePlans,
    long activeAddons,
    long activeFeatureFlags,
    long totalAuditEvents
) {}
