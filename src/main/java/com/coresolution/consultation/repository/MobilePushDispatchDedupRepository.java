package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.MobilePushDispatchDedup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 푸시 발송 멱등 저장소.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
@Repository
public interface MobilePushDispatchDedupRepository extends JpaRepository<MobilePushDispatchDedup, Long> {
}
