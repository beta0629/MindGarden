package com.mindgarden.ops.service.onboarding;

import com.mindgarden.ops.controller.dto.OnboardingCreateRequest;
import com.mindgarden.ops.domain.onboarding.OnboardingRequest;
import com.mindgarden.ops.domain.onboarding.OnboardingStatus;
import com.mindgarden.ops.repository.onboarding.OnboardingRequestRepository;
import com.mindgarden.ops.service.audit.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.Types;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final OnboardingRequestRepository repository;
    private final AuditService auditService;
    private final JdbcTemplate jdbcTemplate;

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

        // 승인인 경우 프로시저 직접 호출하여 테넌트 생성
        if (status == OnboardingStatus.APPROVED) {
            try {
                log.info("테넌트 생성 프로시저 실행 - tenantId={}, tenantName={}", 
                    request.getTenantId(), request.getTenantName());
                
                // CreateOrActivateTenant 프로시저 호출
                Connection connection = jdbcTemplate.getDataSource().getConnection();
                CallableStatement cs = connection.prepareCall(
                    "{CALL CreateOrActivateTenant(?, ?, ?, ?, ?, ?)}"
                );
                
                // IN 파라미터
                cs.setString(1, request.getTenantId());
                cs.setString(2, request.getTenantName());
                cs.setString(3, "CONSULTATION"); // 기본 업종
                cs.setString(4, actorId);
                
                // OUT 파라미터
                cs.registerOutParameter(5, Types.BOOLEAN); // p_success
                cs.registerOutParameter(6, Types.VARCHAR); // p_message
                
                cs.execute();
                
                boolean success = cs.getBoolean(5);
                String message = cs.getString(6);
                
                cs.close();
                connection.close();
                
                if (success) {
                    log.info("✅ 테넌트 생성 완료: {}", message);
                } else {
                    log.error("❌ 테넌트 생성 실패: {}", message);
                    status = OnboardingStatus.ON_HOLD;
                    note = (note != null ? note + "\n\n" : "") + "[오류] " + message;
                }
                
            } catch (Exception e) {
                log.error("❌ 프로시저 실행 실패: {}", e.getMessage(), e);
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
