package com.mindgarden.ops.service.pricing;

import com.mindgarden.ops.controller.dto.PlanAddonAttachRequest;
import com.mindgarden.ops.controller.dto.PricingAddonCreateRequest;
import com.mindgarden.ops.controller.dto.PricingPlanCreateRequest;
import com.mindgarden.ops.controller.dto.PricingAddonUpdateRequest;
import com.mindgarden.ops.controller.dto.PricingPlanUpdateRequest;
import com.mindgarden.ops.domain.pricing.PlanAddonMapping;
import com.mindgarden.ops.domain.pricing.PricingAddon;
import com.mindgarden.ops.domain.pricing.PricingPlan;
import com.mindgarden.ops.repository.pricing.PlanAddonRepository;
import com.mindgarden.ops.repository.pricing.PricingAddonRepository;
import com.mindgarden.ops.repository.pricing.PricingPlanRepository;
import com.mindgarden.ops.service.audit.AuditService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PricingPlanService {

    private final PricingPlanRepository planRepository;
    private final PricingAddonRepository addonRepository;
    private final PlanAddonRepository planAddonRepository;
    private final AuditService auditService;

    public PricingPlanService(PricingPlanRepository planRepository, PricingAddonRepository addonRepository, PlanAddonRepository planAddonRepository, AuditService auditService) {
        this.planRepository = planRepository;
        this.addonRepository = addonRepository;
        this.planAddonRepository = planAddonRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<PricingPlan> findAllPlans() {
        return planRepository.findAll();
    }

    @Transactional
    public PricingPlan createPlan(PricingPlanCreateRequest request, String actorId, String actorRole) {
        planRepository.findByPlanCode(request.planCode()).ifPresent(plan -> {
            throw new IllegalArgumentException("이미 존재하는 요금제 코드입니다.");
        });

        PricingPlan plan = new PricingPlan();
        plan.setPlanCode(request.planCode());
        plan.setDisplayName(request.displayName());
        plan.setDisplayNameKo(request.displayNameKo());
        plan.setBaseFee(request.baseFee());
        plan.setCurrency(request.currency());
        plan.setDescription(request.description());
        plan.setDescriptionKo(request.descriptionKo());
        PricingPlan saved = planRepository.save(plan);

        auditService.record(
            "PLAN_CREATED",
            "PRICING_PLAN",
            saved.getId().toString(),
            actorId,
            actorRole,
            "요금제 생성",
            Map.of("planCode", request.planCode())
        );

        return saved;
    }

    @Transactional
    public PricingAddon createAddon(PricingAddonCreateRequest request, String actorId, String actorRole) {
        addonRepository.findByAddonCode(request.addonCode()).ifPresent(addon -> {
            throw new IllegalArgumentException("이미 존재하는 애드온 코드입니다.");
        });

        PricingAddon addon = new PricingAddon();
        addon.setAddonCode(request.addonCode());
        addon.setDisplayName(request.displayName());
        addon.setDisplayNameKo(request.displayNameKo());
        addon.setCategory(request.category());
        addon.setCategoryKo(request.categoryKo());
        addon.setFeeType(request.feeType());
        addon.setUnitPrice(request.unitPrice());
        addon.setUnit(request.unit());
        PricingAddon saved = addonRepository.save(addon);

        auditService.record(
            "ADDON_CREATED",
            "PRICING_ADDON",
            saved.getId().toString(),
            actorId,
            actorRole,
            "애드온 생성",
            Map.of("addonCode", request.addonCode())
        );

        return saved;
    }

    @Transactional
    public void attachAddon(UUID planId, PlanAddonAttachRequest request, String actorId, String actorRole) {
        PricingPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("요금제를 찾을 수 없습니다."));
        PricingAddon addon = addonRepository.findByAddonCode(request.addonCode())
            .orElseThrow(() -> new IllegalArgumentException("애드온을 찾을 수 없습니다."));

        planAddonRepository.findByPlanIdAndAddonId(plan.getId(), addon.getId())
            .ifPresent(mapping -> {
                throw new IllegalStateException("이미 연결된 애드온입니다.");
            });

        PlanAddonMapping mapping = new PlanAddonMapping();
        mapping.setPlan(plan);
        mapping.setAddon(addon);
        mapping.setNotes(request.notes());
        planAddonRepository.save(mapping);

        auditService.record(
            "PLAN_ADDON_ATTACHED",
            "PRICING_PLAN",
            plan.getId().toString(),
            actorId,
            actorRole,
            "요금제에 애드온 연결",
            Map.of("addonCode", addon.getAddonCode())
        );
    }

    @Transactional(readOnly = true)
    public List<PricingAddon> findAllAddons() {
        return addonRepository.findAll();
    }

    @Transactional
    public PricingPlan updatePlan(UUID planId, PricingPlanUpdateRequest request, String actorId, String actorRole) {
        PricingPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("요금제를 찾을 수 없습니다."));

        plan.setDisplayName(request.displayName());
        plan.setDisplayNameKo(request.displayNameKo());
        plan.setBaseFee(request.baseFee());
        plan.setCurrency(request.currency());
        plan.setDescription(request.description());
        plan.setDescriptionKo(request.descriptionKo());
        if (request.active() != null) {
            plan.setActive(request.active());
        }

        PricingPlan updated = planRepository.save(plan);

        auditService.record(
            "PLAN_UPDATED",
            "PRICING_PLAN",
            updated.getId().toString(),
            actorId,
            actorRole,
            "요금제 수정",
            Map.of(
                "planCode", updated.getPlanCode(),
                "active", String.valueOf(updated.isActive())
            )
        );

        return updated;
    }

    @Transactional
    public void deactivatePlan(UUID planId, String actorId, String actorRole) {
        PricingPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("요금제를 찾을 수 없습니다."));

        if (!plan.isActive()) {
            return;
        }

        plan.setActive(false);
        planRepository.save(plan);

        auditService.record(
            "PLAN_DEACTIVATED",
            "PRICING_PLAN",
            plan.getId().toString(),
            actorId,
            actorRole,
            "요금제 비활성화",
            Map.of("planCode", plan.getPlanCode())
        );
    }

    @Transactional
    public PricingAddon updateAddon(UUID addonId, PricingAddonUpdateRequest request, String actorId, String actorRole) {
        PricingAddon addon = addonRepository.findById(addonId)
            .orElseThrow(() -> new IllegalArgumentException("애드온을 찾을 수 없습니다."));

        addon.setDisplayName(request.displayName());
        addon.setDisplayNameKo(request.displayNameKo());
        addon.setCategory(request.category());
        addon.setCategoryKo(request.categoryKo());
        addon.setFeeType(request.feeType());
        addon.setUnitPrice(request.unitPrice());
        addon.setUnit(request.unit());
        if (request.active() != null) {
            addon.setActive(request.active());
        }

        PricingAddon updated = addonRepository.save(addon);

        auditService.record(
            "ADDON_UPDATED",
            "PRICING_ADDON",
            updated.getId().toString(),
            actorId,
            actorRole,
            "애드온 수정",
            Map.of(
                "addonCode", updated.getAddonCode(),
                "active", String.valueOf(updated.isActive())
            )
        );

        return updated;
    }

    @Transactional
    public void deactivateAddon(UUID addonId, String actorId, String actorRole) {
        PricingAddon addon = addonRepository.findById(addonId)
            .orElseThrow(() -> new IllegalArgumentException("애드온을 찾을 수 없습니다."));

        if (!addon.isActive()) {
            return;
        }

        addon.setActive(false);
        addonRepository.save(addon);

        auditService.record(
            "ADDON_DEACTIVATED",
            "PRICING_ADDON",
            addon.getId().toString(),
            actorId,
            actorRole,
            "애드온 비활성화",
            Map.of("addonCode", addon.getAddonCode())
        );
    }
}
