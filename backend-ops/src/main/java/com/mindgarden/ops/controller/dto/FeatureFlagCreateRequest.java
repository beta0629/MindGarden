package com.mindgarden.ops.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record FeatureFlagCreateRequest(
    @NotBlank String flagKey,
    String description,
    String targetScope,
    String expiresAt
) {}
