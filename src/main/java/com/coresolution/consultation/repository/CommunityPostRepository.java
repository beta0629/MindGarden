package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.CommunityModerationStatus;
import com.coresolution.consultation.constant.CommunityPostKind;
import com.coresolution.consultation.entity.CommunityPost;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 커뮤니티 게시글 저장소.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    Optional<CommunityPost> findByTenantIdAndIdAndIsDeletedFalse(String tenantId, Long id);

    /**
     * 특정 사용자가 작성한 모든 게시글 조회 (soft-deleted 포함, 익명화/sweep 용도).
     *
     * <p>USER_LIFECYCLE_TERMINATION_POLICY v1.1 §0.1 Q12-b — 자발 탈퇴 시 본인 옵션
     * "본문도 삭제" 가 선택된 경우 {@code UserAnonymizationService} 가 본 메서드로
     * 사용자의 모든 게시글을 수집하여 본문 익명화 + soft delete 한다.</p>
     *
     * @param authorUserId 작성자 users.id
     * @return 본인 작성 게시글 목록 (이미 isDeleted=true 인 행도 포함)
     */
    List<CommunityPost> findByAuthor_Id(Long authorUserId);

    /**
     * 승인 피드(전체) — Apple T2 (1.2 UGC) 차단/숨김 필터 포함.
     *
     * <p>{@code blockedUserIds} 가 비어 있으면 차단 필터를 우회한다 (JPQL 빈 IN 절 회피).
     * 숨김({@code hiddenAt IS NOT NULL}) 게시물은 사용자 피드에 노출되지 않는다.</p>
     *
     * @param tenantId        테넌트 ID
     * @param status          {@link CommunityModerationStatus#APPROVED}
     * @param blockedUserIds  차단 사용자 ID 목록 (비어 있으면 필터 우회)
     * @param applyBlock      true 면 차단 필터 적용, false 면 우회 (호출 측에서 제어)
     * @param pageable        페이지
     * @return 승인 + 미숨김 + 차단되지 않은 게시물 목록
     */
    @Query("""
        SELECT DISTINCT p FROM CommunityPost p
        JOIN FETCH p.author
        WHERE p.tenantId = :tenantId AND p.isDeleted = false
        AND p.moderationStatus = :status
        AND p.hiddenAt IS NULL
        AND (:applyBlock = false OR p.author.id NOT IN :blockedUserIds)
        ORDER BY p.createdAt DESC
        """)
    List<CommunityPost> findFeedApprovedAll(
            @Param("tenantId") String tenantId,
            @Param("status") CommunityModerationStatus status,
            @Param("blockedUserIds") List<Long> blockedUserIds,
            @Param("applyBlock") boolean applyBlock,
            Pageable pageable);

    @Query("""
        SELECT DISTINCT p FROM CommunityPost p
        JOIN FETCH p.author
        WHERE p.tenantId = :tenantId AND p.isDeleted = false
        AND p.moderationStatus = :status AND p.postKind = :kind
        AND p.hiddenAt IS NULL
        AND (:applyBlock = false OR p.author.id NOT IN :blockedUserIds)
        ORDER BY p.createdAt DESC
        """)
    List<CommunityPost> findFeedApprovedByKind(
            @Param("tenantId") String tenantId,
            @Param("status") CommunityModerationStatus status,
            @Param("kind") CommunityPostKind kind,
            @Param("blockedUserIds") List<Long> blockedUserIds,
            @Param("applyBlock") boolean applyBlock,
            Pageable pageable);

    @Query("""
        SELECT DISTINCT p FROM CommunityPost p
        JOIN FETCH p.author
        WHERE p.tenantId = :tenantId AND p.isDeleted = false
        AND p.moderationStatus = :status
        ORDER BY p.createdAt ASC
        """)
    List<CommunityPost> findModerationQueue(
            @Param("tenantId") String tenantId,
            @Param("status") CommunityModerationStatus status,
            Pageable pageable);

    /**
     * 검수 큐 전체 상태 조회 (PENDING / APPROVED / REJECTED) — 어드민 통합 필터용.
     *
     * <p>정렬: PENDING(검수 대기) 항상 상단 → 그 외는 {@code moderatedAt DESC}.
     * {@code moderatedAt} 이 NULL 인 행(검수 안 한 글)은 {@code createdAt DESC} 로 대체된다.
     * 운영자가 우선순위가 높은 「검수 대기」 를 먼저 보고 처리한 글은 최근순으로 확인할 수 있도록 한다.</p>
     *
     * @param tenantId      테넌트 식별자
     * @param pendingStatus 상단 고정 비교용 enum 값 (호출 측에서 {@link CommunityModerationStatus#PENDING} 전달)
     * @param pageable      페이지
     * @return 검수 큐 전체 (상태 무관)
     */
    @Query("""
        SELECT DISTINCT p FROM CommunityPost p
        JOIN FETCH p.author
        WHERE p.tenantId = :tenantId AND p.isDeleted = false
        ORDER BY
            CASE WHEN p.moderationStatus = :pendingStatus THEN 0 ELSE 1 END ASC,
            COALESCE(p.moderatedAt, p.createdAt) DESC
        """)
    List<CommunityPost> findModerationQueueAllStatuses(
            @Param("tenantId") String tenantId,
            @Param("pendingStatus") CommunityModerationStatus pendingStatus,
            Pageable pageable);
}
