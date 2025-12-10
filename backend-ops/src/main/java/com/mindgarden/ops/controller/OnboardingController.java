package com.mindgarden.ops.controller;

import com.mindgarden.ops.controller.dto.OnboardingCreateRequest;
import com.mindgarden.ops.controller.dto.OnboardingDecisionRequest;
import com.mindgarden.ops.controller.dto.OnboardingDecisionResponse;
import com.mindgarden.ops.domain.onboarding.OnboardingRequest;
import com.mindgarden.ops.domain.onboarding.OnboardingStatus;
import com.mindgarden.ops.service.onboarding.OnboardingService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/ops/onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @GetMapping("/requests/pending")
    public ResponseEntity<List<OnboardingRequest>> getPendingRequests() {
        return ResponseEntity.ok(onboardingService.findPending());
    }

    @GetMapping("/requests")
    public ResponseEntity<List<OnboardingRequest>> getRequests(
            @org.springframework.web.bind.annotation.RequestParam(required = false) OnboardingStatus status) {
        if (status != null) {
            return ResponseEntity.ok(onboardingService.findByStatus(status));
        }
        // status가 없으면 전체 조회 (모든 상태)
        return ResponseEntity.ok(onboardingService.findAll());
    }

    @GetMapping("/requests/{id}")
    public ResponseEntity<OnboardingRequest> getRequest(@PathVariable UUID id) {
        return ResponseEntity.ok(onboardingService.getById(id));
    }

    @PostMapping("/requests")
    public ResponseEntity<OnboardingRequest> create(@RequestBody @Valid OnboardingCreateRequest payload) {
        return ResponseEntity.ok(onboardingService.create(payload));
    }

    @PostMapping("/requests/{id}/decision")
    public ResponseEntity<OnboardingDecisionResponse> decide(
        @PathVariable UUID id,
        @RequestBody @Valid OnboardingDecisionRequest payload
    ) {
        log.info("[OnboardingController] 결정 저장 요청 - requestId={}, status={}, actorId={}, note={}", 
            id, payload.status(), payload.actorId(), payload.note() != null ? "있음" : "없음");
        
        try {
            OnboardingDecisionResponse response = onboardingService.decideWithAdminInfo(
                id, payload.status(), payload.actorId(), payload.note());
            log.info("[OnboardingController] 결정 저장 완료 - requestId={}, 최종 상태={}, adminAccount={}", 
                id, response.request().getStatus(), 
                response.adminAccount() != null ? response.adminAccount().email() : "없음");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[OnboardingController] 결정 저장 실패 - requestId={}, 오류={}", id, e.getMessage(), e);
            throw e;
        }
    }
}
