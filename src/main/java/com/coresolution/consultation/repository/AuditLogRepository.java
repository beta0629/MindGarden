package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.entity.AuditLog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * {@link AuditLog} 리포지토리 — append-only 감사 로그 SSOT.
 *
 * <p>모든 조회 메서드는 {@code tenantId} 필터링 필수 (테넌트 격리 정책). 후속 위임에서
 * actor/target/entity/action 별 추가 메서드 확장 가능.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByTenantIdOrderByCreatedAtDesc(String tenantId, Pageable pageable);

    List<AuditLog> findByTenantIdAndTargetUserIdOrderByCreatedAtDesc(
            String tenantId, Long targetUserId);

    Page<AuditLog> findByTenantIdAndActionOrderByCreatedAtDesc(
            String tenantId, AuditAction action, Pageable pageable);

    long countByTenantIdAndActionAndCreatedAtBetween(
            String tenantId, AuditAction action, LocalDateTime start, LocalDateTime end);
}
