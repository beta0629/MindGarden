package com.coresolution.consultation.service.impl;

import java.util.List;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.repository.AuditLogRepository;
import com.coresolution.consultation.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link AuditLogService} 스켈레톤 구현체.
 *
 * <p>본 위임 범위는 컴파일 가능한 기본 CRUD/tenant 필터링 패스스루까지. UserLifecycleService /
 * UserSelfWithdrawalService 등 도메인 호출자가 작성될 때 본 구현 본문은 후속 위임에서 보강된다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public AuditLog record(AuditLog logEntry) {
        return auditLogRepository.save(logEntry);
    }

    @Override
    @Transactional
    public AuditLog log(
            String tenantId,
            Long actorUserId,
            String actorRole,
            Long targetUserId,
            AuditAction action,
            String entityType,
            Long entityId) {
        // TODO: 후속 위임에서 비즈니스 로직 작성 — before/after/metadata JSON 스냅샷, IP/UA 추출 등
        AuditLog entry = AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actorUserId)
                .actorRole(actorRole)
                .targetUserId(targetUserId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .build();
        return auditLogRepository.save(entry);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLog> findByTenantId(String tenantId, Pageable pageable) {
        return auditLogRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> findByTenantIdAndTargetUserId(String tenantId, Long targetUserId) {
        return auditLogRepository.findByTenantIdAndTargetUserIdOrderByCreatedAtDesc(tenantId, targetUserId);
    }
}
