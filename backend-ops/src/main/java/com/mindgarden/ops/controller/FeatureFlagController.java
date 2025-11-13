package com.mindgarden.ops.controller;

import com.mindgarden.ops.controller.dto.FeatureFlagCreateRequest;
import com.mindgarden.ops.controller.dto.FeatureFlagToggleRequest;
import com.mindgarden.ops.domain.config.FeatureFlag;
import com.mindgarden.ops.domain.config.FeatureFlagState;
import com.mindgarden.ops.service.config.FeatureFlagService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/feature-flags")
public class FeatureFlagController {

    private final FeatureFlagService featureFlagService;

    public FeatureFlagController(FeatureFlagService featureFlagService) {
        this.featureFlagService = featureFlagService;
    }

    @GetMapping
    public ResponseEntity<List<FeatureFlag>> getAll() {
        return ResponseEntity.ok(featureFlagService.findAll());
    }

    @PostMapping
    public ResponseEntity<FeatureFlag> create(
        @RequestHeader("X-Actor-Id") String actorId,
        @RequestHeader(value = "X-Actor-Role", defaultValue = "HQ_ADMIN") String actorRole,
        @RequestBody @Valid FeatureFlagCreateRequest request
    ) {
        Instant expiresAt = null;
        if (request.expiresAt() != null && !request.expiresAt().isBlank()) {
            try {
                expiresAt = Instant.parse(request.expiresAt());
            } catch (DateTimeParseException e) {
                throw new IllegalArgumentException("expiresAt은 ISO-8601 형식이어야 합니다.");
            }
        }
        FeatureFlag created = featureFlagService.create(
            request.flagKey(),
            request.description(),
            request.targetScope(),
            expiresAt,
            actorId,
            actorRole
        );
        return ResponseEntity.ok(created);
    }

    @PostMapping("/{flagId}/toggle")
    public ResponseEntity<FeatureFlag> toggle(
        @PathVariable UUID flagId,
        @RequestHeader("X-Actor-Id") String actorId,
        @RequestHeader(value = "X-Actor-Role", defaultValue = "HQ_ADMIN") String actorRole,
        @RequestBody @Valid FeatureFlagToggleRequest request
    ) {
        FeatureFlagState newState = request.state();
        FeatureFlag updated = featureFlagService.toggle(flagId, newState, actorId, actorRole);
        return ResponseEntity.ok(updated);
    }
}
