package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.CommunityReport;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 커뮤니티 신고 저장소.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public interface CommunityReportRepository extends JpaRepository<CommunityReport, Long> {
}
