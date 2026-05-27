package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.DestructionType;
import com.coresolution.consultation.entity.PersonalDataDestructionLog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * {@link PersonalDataDestructionLog} 리포지토리 — PIPA §16 파기 기록.
 *
 * <p>모든 조회 메서드는 {@code tenantId} 필터링 필수. 복구 윈도우 내인지 확인하기 위한
 * {@code recoveryWindowUntil} 비교 메서드도 제공.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Repository
public interface PersonalDataDestructionLogRepository extends JpaRepository<PersonalDataDestructionLog, Long> {

    List<PersonalDataDestructionLog> findByTenantIdAndTargetUserIdOrderByExecutedAtDesc(
            String tenantId, Long targetUserId);

    Page<PersonalDataDestructionLog> findByTenantIdAndDestructionTypeOrderByExecutedAtDesc(
            String tenantId, DestructionType destructionType, Pageable pageable);

    long countByTenantIdAndExecutedAtBetween(
            String tenantId, LocalDateTime start, LocalDateTime end);

    Optional<PersonalDataDestructionLog>
            findFirstByTenantIdAndTargetUserIdAndRecoveryWindowUntilAfterOrderByExecutedAtDesc(
            String tenantId, Long targetUserId, LocalDateTime now);
}
