package com.mindgarden.ops.service.onboarding;

import com.mindgarden.ops.controller.dto.OnboardingCreateRequest;
import com.mindgarden.ops.domain.onboarding.OnboardingRequest;
import com.mindgarden.ops.domain.onboarding.OnboardingStatus;
import com.mindgarden.ops.repository.onboarding.OnboardingRequestRepository;
import com.mindgarden.ops.service.audit.AuditService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OnboardingService {

    private final OnboardingRequestRepository repository;
    private final AuditService auditService;

    public OnboardingService(OnboardingRequestRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<OnboardingRequest> findPending() {
        return repository.findByStatusOrderByCreatedAtDesc(OnboardingStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<OnboardingRequest> findByStatus(OnboardingStatus status) {
        return repository.findByStatusOrderByCreatedAtDesc(status);
    }

    @Transactional(readOnly = true)
    public List<OnboardingRequest> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public OnboardingRequest getById(UUID id) {
        return repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("요청을 찾을 수 없습니다."));
    }

    @Transactional
    public OnboardingRequest create(OnboardingCreateRequest request) {
        OnboardingRequest entity = new OnboardingRequest();
        entity.setTenantId(request.tenantId());
        entity.setTenantName(request.tenantName());
        entity.setRequestedBy(request.requestedBy());
        entity.setRiskLevel(request.riskLevel());
        entity.setChecklistJson(request.checklistJson());
        entity.setStatus(OnboardingStatus.PENDING);
        OnboardingRequest saved = repository.save(entity);

        auditService.record(
            "ONBOARDING_CREATED",
            "ONBOARDING_REQUEST",
            saved.getId().toString(),
            request.requestedBy(),
            "REQUESTER",
            "온보딩 요청 생성",
            Map.of("tenantId", request.tenantId(), "riskLevel", request.riskLevel().name())
        );

        return saved;
    }

    @Transactional
    public OnboardingRequest decide(UUID requestId, OnboardingStatus status, String actorId, String note) {
        OnboardingRequest request = repository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("요청을 찾을 수 없습니다."));

        request.setStatus(status);
        request.setDecidedBy(actorId);
        request.setDecisionAt(DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
        request.setDecisionNote(note);
        OnboardingRequest saved = repository.save(request);

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("tenantId", request.getTenantId());
        metadata.put("status", status.name());
        if (note != null && !note.isBlank()) {
            metadata.put("note", note);
        }

        auditService.record(
            "ONBOARDING_DECISION",
            "ONBOARDING_REQUEST",
            saved.getId().toString(),
            actorId,
            "APPROVER",
            "온보딩 결정",
            metadata
        );

        return saved;
    }
}
