package com.coresolution.core.tenant;

import java.time.LocalDateTime;
import java.util.Optional;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

/**
 * {@code suspended_at} 컬럼이 생기기 전까지 정지 시각은
 * 가장 최근 {@link AuditAction#TENANT_SUSPENDED} 행의 {@code created_at} 이다.
 *
 * <p>감사 행이 없는 기존 정지 테넌트는 시각을 알 수 없으므로 empty 를 반환하고,
 * 종료 판정은 유예 미경과로 거절한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Component
@RequiredArgsConstructor
public class AuditTenantSuspendedAtResolver {

    private final AuditLogRepository auditLogRepository;

    /**
     * @param tenantId 테넌트 ID
     * @return 최근 정지 감사 시각
     */
    public Optional<LocalDateTime> findSuspendedAt(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return Optional.empty();
        }
        return auditLogRepository
                .findByTenantIdAndActionOrderByCreatedAtDesc(
                        tenantId.trim(),
                        AuditAction.TENANT_SUSPENDED,
                        PageRequest.of(0, 1))
                .stream()
                .findFirst()
                .map(AuditLog::getCreatedAt);
    }
}
