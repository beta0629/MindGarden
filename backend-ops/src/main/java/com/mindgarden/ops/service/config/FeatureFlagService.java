package com.mindgarden.ops.service.config;

import com.mindgarden.ops.domain.config.FeatureFlag;
import com.mindgarden.ops.domain.config.FeatureFlagState;
import com.mindgarden.ops.repository.config.FeatureFlagRepository;
import com.mindgarden.ops.service.audit.AuditService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FeatureFlagService {

    private final FeatureFlagRepository featureFlagRepository;
    private final AuditService auditService;

    public FeatureFlagService(FeatureFlagRepository featureFlagRepository, AuditService auditService) {
        this.featureFlagRepository = featureFlagRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<FeatureFlag> findAll() {
        return featureFlagRepository.findAll();
    }

    @Transactional
    public FeatureFlag create(String flagKey, String description, String targetScope, Instant expiresAt, String actorId, String actorRole) {
        featureFlagRepository.findByFlagKey(flagKey).ifPresent(flag -> {
            throw new IllegalArgumentException("이미 존재하는 플래그입니다.");
        });

        FeatureFlag flag = new FeatureFlag();
        flag.setFlagKey(flagKey);
        flag.setDescription(description);
        flag.setTargetScope(targetScope);
        flag.setExpiresAt(expiresAt);
        flag.setState(FeatureFlagState.DISABLED);
        FeatureFlag saved = featureFlagRepository.save(flag);

        auditService.record(
            "FEATURE_FLAG_CREATED",
            "FEATURE_FLAG",
            saved.getId().toString(),
            actorId,
            actorRole,
            "Feature Flag 생성",
            Map.of("flagKey", flagKey)
        );

        return saved;
    }

    @Transactional
    public FeatureFlag toggle(UUID flagId, FeatureFlagState newState, String actorId, String actorRole) {
        FeatureFlag flag = featureFlagRepository.findById(flagId)
            .orElseThrow(() -> new IllegalArgumentException("Feature Flag를 찾을 수 없습니다."));

        flag.setState(newState);
        FeatureFlag saved = featureFlagRepository.save(flag);

        auditService.record(
            "FEATURE_FLAG_UPDATED",
            "FEATURE_FLAG",
            saved.getId().toString(),
            actorId,
            actorRole,
            "Feature Flag 상태 변경",
            Map.of("state", newState.name())
        );

        return saved;
    }
}
