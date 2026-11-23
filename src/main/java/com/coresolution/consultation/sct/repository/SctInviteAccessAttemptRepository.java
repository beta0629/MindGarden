package com.coresolution.consultation.sct.repository;

import com.coresolution.consultation.sct.entity.SctInviteAccessAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * SCT 검증 시도 Repository.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public interface SctInviteAccessAttemptRepository extends JpaRepository<SctInviteAccessAttempt, Long> {
}
