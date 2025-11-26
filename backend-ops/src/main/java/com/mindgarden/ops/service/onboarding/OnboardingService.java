package com.mindgarden.ops.service.onboarding;

import com.mindgarden.ops.controller.dto.OnboardingCreateRequest;
import com.mindgarden.ops.domain.onboarding.OnboardingRequest;
import com.mindgarden.ops.domain.onboarding.OnboardingStatus;
import com.mindgarden.ops.repository.onboarding.OnboardingRequestRepository;
import com.mindgarden.ops.service.audit.AuditService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class OnboardingService {

    private final OnboardingRequestRepository repository;
    private final AuditService auditService;
    private final RestTemplate restTemplate;
    private final String mainBackendUrl;

    public OnboardingService(
            OnboardingRequestRepository repository, 
            AuditService auditService,
            RestTemplate restTemplate,
            @Value("${main.backend.url:http://localhost:8080}") String mainBackendUrl) {
        this.repository = repository;
        this.auditService = auditService;
        this.restTemplate = restTemplate;
        this.mainBackendUrl = mainBackendUrl;
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

        // 승인인 경우 메인 백엔드 API 호출하여 실제 테넌트 생성
        if (status == OnboardingStatus.APPROVED) {
            try {
                log.info("메인 백엔드 API 호출: 테넌트 생성 프로시저 실행 - tenantId={}", request.getTenantId());
                
                // 메인 백엔드 API 호출
                String url = mainBackendUrl + "/api/v1/onboarding/requests/" + requestId + "/decision";
                
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                
                Map<String, Object> payload = new HashMap<>();
                payload.put("status", status.name());
                payload.put("actorId", actorId);
                payload.put("note", note);
                
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
                
                restTemplate.postForObject(url, entity, Object.class);
                
                log.info("✅ 메인 백엔드 API 호출 성공: 테넌트 생성 완료");
            } catch (Exception e) {
                log.error("❌ 메인 백엔드 API 호출 실패: {}", e.getMessage(), e);
                // 실패해도 OPS Portal의 상태는 업데이트 (수동 재시도 가능)
                status = OnboardingStatus.ON_HOLD;
                note = (note != null ? note + "\n\n" : "") + "[오류] 테넌트 생성 실패: " + e.getMessage();
            }
        }

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
