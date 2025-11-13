package com.mindgarden.ops.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record PlanAddonAttachRequest(
    @NotBlank String addonCode,
    String notes
) {}
