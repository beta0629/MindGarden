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
import org.springframework.web.bind.annotation.RequestParam;
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

    /**
     * 온보딩 요청 단건 조회.
     * <p>
     * OPS 신뢰 경계: {@code tenantId} 쿼리를 생략하면 PK({@code id})만으로 조회한다(레거시 콘솔 호환).
     * 테넌트 격리가 필요한 호출자는 반드시 주체 테넌트 {@code tenantId}를 넘겨 복합 조회한다.
     * 스코프 불일치·미존재는 404로 동일하게 처리된다.
     * </p>
     *
     * @param id 요청 PK
     * @param tenantId 선택. 있으면 {@code tenantId}+{@code id}로 조회
     */
    @GetMapping("/requests/{id}")
    public ResponseEntity<OnboardingRequest> getRequest(
        @PathVariable UUID id,
        @RequestParam(required = false) String tenantId) {
        return ResponseEntity.ok(onboardingService.getById(id, tenantId));
    }

    @PostMapping("/requests")
    public ResponseEntity<OnboardingRequest> create(@RequestBody @Valid OnboardingCreateRequest payload) {
        return ResponseEntity.ok(onboardingService.create(payload));
    }

    /**
     * 온보딩 승인/거부 등 결정 저장.
     * <p>
     * OPS 신뢰 경계: {@code tenantId} 쿼리를 생략하면 PK만으로 대상을 조회한다(레거시).
     * 테넌트 스코프가 있는 호출 경로에서는 동일한 {@code tenantId}를 쿼리로 넘겨 복합 조회한다.
     * </p>
     *
     * @param tenantId 선택. GET 단건과 동일하게 쿼리 파라미터로 통일
     */
    @PostMapping("/requests/{id}/decision")
    public ResponseEntity<OnboardingDecisionResponse> decide(
        @PathVariable UUID id,
        @RequestParam(required = false) String tenantId,
        @RequestBody @Valid OnboardingDecisionRequest payload
    ) {
        log.info("[OnboardingController] 결정 저장 요청 - requestId={}, status={}, actorId={}, tenantScoped={}, note={}",
            id, payload.status(), payload.actorId(), tenantId != null && !tenantId.isBlank(),
            payload.note() != null ? "있음" : "없음");

        try {
            OnboardingDecisionResponse response = onboardingService.decideWithAdminInfo(
                id, payload.status(), payload.actorId(), payload.note(), tenantId);
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
