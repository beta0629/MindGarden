package com.coresolution.consultation.repository;

import java.util.List;
import com.coresolution.consultation.constant.CommunityReportStatus;
import com.coresolution.consultation.entity.CommunityReport;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 커뮤니티 신고 저장소.
 *
 * <p>Apple T2 (1.2 UGC) — 어드민 큐 조회·SLA 카운터·3건 누적 자동 격리 트리거 쿼리 포함.</p>
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public interface CommunityReportRepository extends JpaRepository<CommunityReport, Long> {

    /**
     * 어드민 신고 큐 — 상태 필터 적용.
     *
     * <p>{@code status} 가 null 이면 전체 상태 반환. 정렬은 OPEN > UNDER_REVIEW > 그 외, 그 후 {@code createdAt ASC}
     * (SLA 임박 순)을 적용한다.</p>
     *
     * @param tenantId 테넌트 ID
     * @param status   상태 필터(null 이면 전체)
     * @param pageable 페이지
     * @return 신고 큐 항목 (post + reporter fetch join)
     */
    @Query("""
        SELECT DISTINCT r FROM CommunityReport r
        JOIN FETCH r.post p
        JOIN FETCH r.reporter rep
        WHERE r.tenantId = :tenantId AND r.isDeleted = false
        AND (:status IS NULL OR r.status = :status)
        ORDER BY
            CASE r.status WHEN com.coresolution.consultation.constant.CommunityReportStatus.OPEN THEN 0
                          WHEN com.coresolution.consultation.constant.CommunityReportStatus.UNDER_REVIEW THEN 1
                          ELSE 2 END,
            r.createdAt ASC
        """)
    List<CommunityReport> findAdminQueue(
        @Param("tenantId") String tenantId,
        @Param("status") CommunityReportStatus status,
        Pageable pageable);

    /**
     * 특정 게시물의 활성 신고 건수 — 3건 누적 자동 격리 트리거에 사용.
     *
     * <p>{@code commentId IS NULL} 인 경우 게시물 자체 신고만 카운트한다 (댓글 신고는 별도 카운터).</p>
     *
     * @param tenantId 테넌트 ID
     * @param postId   게시글 id
     * @return REJECTED 가 아닌 활성 신고 건수
     */
    @Query("""
        SELECT COUNT(r) FROM CommunityReport r
        WHERE r.tenantId = :tenantId AND r.isDeleted = false
        AND r.post.id = :postId
        AND r.comment IS NULL
        AND r.status <> com.coresolution.consultation.constant.CommunityReportStatus.REJECTED
        """)
    long countActiveByPost(@Param("tenantId") String tenantId, @Param("postId") Long postId);

    /**
     * 특정 댓글의 활성 신고 건수.
     *
     * @param tenantId  테넌트 ID
     * @param commentId 댓글 id
     * @return REJECTED 가 아닌 활성 신고 건수
     */
    @Query("""
        SELECT COUNT(r) FROM CommunityReport r
        WHERE r.tenantId = :tenantId AND r.isDeleted = false
        AND r.comment.id = :commentId
        AND r.status <> com.coresolution.consultation.constant.CommunityReportStatus.REJECTED
        """)
    long countActiveByComment(@Param("tenantId") String tenantId, @Param("commentId") Long commentId);

    /**
     * 동일 사용자가 같은 게시물/댓글에 이미 신고했는지 확인 — 중복 신고 차단.
     *
     * @param tenantId   테넌트 ID
     * @param reporterId 신고자 users.id
     * @param postId     게시글 id
     * @param commentId  댓글 id(없으면 게시물 신고)
     * @return 중복 신고 존재 여부
     */
    @Query("""
        SELECT COUNT(r) > 0 FROM CommunityReport r
        WHERE r.tenantId = :tenantId AND r.isDeleted = false
        AND r.reporter.id = :reporterId
        AND r.post.id = :postId
        AND ((:commentId IS NULL AND r.comment IS NULL)
              OR (r.comment.id = :commentId))
        """)
    boolean existsActiveByReporter(
        @Param("tenantId") String tenantId,
        @Param("reporterId") Long reporterId,
        @Param("postId") Long postId,
        @Param("commentId") Long commentId);
}
