package com.mindgarden.ops.controller;

import com.mindgarden.ops.controller.dto.PlanAddonAttachRequest;
import com.mindgarden.ops.controller.dto.PricingAddonCreateRequest;
import com.mindgarden.ops.controller.dto.PricingAddonUpdateRequest;
import com.mindgarden.ops.controller.dto.PricingPlanCreateRequest;
import com.mindgarden.ops.controller.dto.PricingPlanUpdateRequest;
import com.mindgarden.ops.domain.pricing.PricingAddon;
import com.mindgarden.ops.domain.pricing.PricingPlan;
import com.mindgarden.ops.service.pricing.PricingPlanService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/plans")
public class PricingPlanController {

    private final PricingPlanService pricingPlanService;

    public PricingPlanController(PricingPlanService pricingPlanService) {
        this.pricingPlanService = pricingPlanService;
    }

    @GetMapping
    public ResponseEntity<List<PricingPlan>> getPlans() {
        return ResponseEntity.ok(pricingPlanService.findAllPlans());
    }

    @GetMapping("/addons")
    public ResponseEntity<List<PricingAddon>> getAddons() {
        return ResponseEntity.ok(pricingPlanService.findAllAddons());
    }

    @PostMapping
    public ResponseEntity<PricingPlan> createPlan(
        @RequestHeader("X-Actor-Id") String actorId,
        @RequestHeader(value = "X-Actor-Role", defaultValue = "HQ_ADMIN") String actorRole,
        @RequestBody @Valid PricingPlanCreateRequest request
    ) {
        return ResponseEntity.ok(pricingPlanService.createPlan(request, actorId, actorRole));
    }

    @PostMapping("/addons")
    public ResponseEntity<PricingAddon> createAddon(
        @RequestHeader("X-Actor-Id") String actorId,
        @RequestHeader(value = "X-Actor-Role", defaultValue = "HQ_ADMIN") String actorRole,
        @RequestBody @Valid PricingAddonCreateRequest request
    ) {
        return ResponseEntity.ok(pricingPlanService.createAddon(request, actorId, actorRole));
    }

    @PostMapping("/{planId}/addons")
    public ResponseEntity<Void> attachAddon(
        @PathVariable UUID planId,
        @RequestHeader("X-Actor-Id") String actorId,
        @RequestHeader(value = "X-Actor-Role", defaultValue = "HQ_ADMIN") String actorRole,
        @RequestBody @Valid PlanAddonAttachRequest request
    ) {
        pricingPlanService.attachAddon(planId, request, actorId, actorRole);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{planId}")
    public ResponseEntity<PricingPlan> updatePlan(
        @PathVariable UUID planId,
        @RequestHeader("X-Actor-Id") String actorId,
        @RequestHeader(value = "X-Actor-Role", defaultValue = "HQ_ADMIN") String actorRole,
        @RequestBody @Valid PricingPlanUpdateRequest request
    ) {
        return ResponseEntity.ok(pricingPlanService.updatePlan(planId, request, actorId, actorRole));
    }

    @DeleteMapping("/{planId}")
    public ResponseEntity<Void> deactivatePlan(
        @PathVariable UUID planId,
        @RequestHeader("X-Actor-Id") String actorId,
        @RequestHeader(value = "X-Actor-Role", defaultValue = "HQ_ADMIN") String actorRole
    ) {
        pricingPlanService.deactivatePlan(planId, actorId, actorRole);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/addons/{addonId}")
    public ResponseEntity<PricingAddon> updateAddon(
        @PathVariable UUID addonId,
        @RequestHeader("X-Actor-Id") String actorId,
        @RequestHeader(value = "X-Actor-Role", defaultValue = "HQ_ADMIN") String actorRole,
        @RequestBody @Valid PricingAddonUpdateRequest request
    ) {
        return ResponseEntity.ok(pricingPlanService.updateAddon(addonId, request, actorId, actorRole));
    }

    @DeleteMapping("/addons/{addonId}")
    public ResponseEntity<Void> deactivateAddon(
        @PathVariable UUID addonId,
        @RequestHeader("X-Actor-Id") String actorId,
        @RequestHeader(value = "X-Actor-Role", defaultValue = "HQ_ADMIN") String actorRole
    ) {
        pricingPlanService.deactivateAddon(addonId, actorId, actorRole);
        return ResponseEntity.noContent().build();
    }
}
