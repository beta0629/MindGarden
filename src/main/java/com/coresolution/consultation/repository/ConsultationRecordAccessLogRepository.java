package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import com.coresolution.consultation.entity.ConsultationRecordAccessLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 상담일지 열람 감사 로그 리포지토리. 조회는 항상 테넌트 범위로만 수행한다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Repository
public interface ConsultationRecordAccessLogRepository extends JpaRepository<ConsultationRecordAccessLog, Long> {

    /**
     * 테넌트 범위 감사 로그 페이지 조회 (선택 필터: 일지·행위자·행위·기간).
     *
     * @param tenantId 테넌트 ID (필수)
     * @param recordId 상담일지 ID (null 이면 전체)
     * @param actorId 행위자 users.id (null 이면 전체)
     * @param action 행위 (null 이면 전체)
     * @param from 조회 시작 시각 (null 이면 하한 없음)
     * @param to 조회 종료 시각 (null 이면 상한 없음)
     * @param pageable 페이지 정보
     * @return 감사 로그 페이지 (최신순)
     */
    @Query("SELECT l FROM ConsultationRecordAccessLog l "
            + "WHERE l.tenantId = :tenantId "
            + "AND (:recordId IS NULL OR l.recordId = :recordId) "
            + "AND (:actorId IS NULL OR l.actorId = :actorId) "
            + "AND (:action IS NULL OR l.action = :action) "
            + "AND (:from IS NULL OR l.accessedAt >= :from) "
            + "AND (:to IS NULL OR l.accessedAt <= :to) "
            + "ORDER BY l.accessedAt DESC, l.id DESC")
    Page<ConsultationRecordAccessLog> searchByTenant(@Param("tenantId") String tenantId,
                                                     @Param("recordId") Long recordId,
                                                     @Param("actorId") Long actorId,
                                                     @Param("action") String action,
                                                     @Param("from") LocalDateTime from,
                                                     @Param("to") LocalDateTime to,
                                                     Pageable pageable);
}
