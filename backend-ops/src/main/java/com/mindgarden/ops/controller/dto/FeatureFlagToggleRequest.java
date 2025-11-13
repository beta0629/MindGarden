package com.mindgarden.ops.controller.dto;

import com.mindgarden.ops.domain.config.FeatureFlagState;
import jakarta.validation.constraints.NotNull;

public record FeatureFlagToggleRequest(
    @NotNull FeatureFlagState state
) {}
