package com.coresolution.consultation.service;

/**
 * 커뮤니티 작성자 익명화 SSOT — Phase 4 옵션 b
 * (USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.12 Q12).
 *
 * <p>회원 익명화 ({@link UserAnonymizationService#anonymize}) 시점에 본인이 작성한
 * community_posts / community_comments 행에 대해:</p>
 * <ol>
 *   <li>{@code author_anonymized=true}, {@code author_anonymized_at=NOW()} UPDATE</li>
 *   <li>{@code community_anonymization_audit} 에 행마다 1건 INSERT
 *       (body SHA-256 hash + actor + reason)</li>
 *   <li>본문은 <b>절대 변경하지 않는다</b> (옵션 b 핵심 — 저작권 + 커뮤니티 유지)</li>
 * </ol>
 *
 * <p>토글: {@code mindgarden.lifecycle.community-anonymization.enabled} false 이면
 * 전체 흐름 SKIP (해당 community 테이블 미존재 등 운영 환경 대응).</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
public interface CommunityAnonymizationService {

    /**
     * 본인이 작성한 community_posts / community_comments 의 작성자를 익명화한다.
     *
     * <p>본 메서드는 {@code @Transactional} 동일 트랜잭션 안에서 호출되어야 한다 — 회원
     * 익명화 ({@link UserAnonymizationService#anonymize}) 와 함께 ALL-OR-NOTHING 보장.</p>
     *
     * @param userId   대상 users.id (원작성자)
     * @param tenantId 테넌트 ID (community_* 모든 조회·UPDATE·INSERT 필터)
     * @param reason   익명화 사유
     *                 (SELF_WITHDRAWAL | DELETED_BY_ADMIN | DORMANT_AUTO_4Y | ADMIN_FORCED)
     * @param actorUserId actor users.id (SYSTEM batch 면 null)
     * @param actorRole   actor role (SYSTEM | ADMIN | CLIENT | CONSULTANT 등)
     * @return 익명화 처리 결과 (게시글·댓글 건수, audit 건수)
     */
    Result anonymizeCommunityRecords(
            Long userId, String tenantId, String reason, Long actorUserId, String actorRole);

    /**
     * 본 service 의 처리 결과.
     *
     * @param postsAnonymized   익명화 처리된 community_posts 행 수
     * @param commentsAnonymized 익명화 처리된 community_comments 행 수
     * @param auditRecordsCreated 본 회차에 추가된 community_anonymization_audit 행 수
     * @param skipped 토글 / 미존재 등으로 SKIP 되었으면 true
     */
    record Result(
            int postsAnonymized,
            int commentsAnonymized,
            int auditRecordsCreated,
            boolean skipped) {

        /** SKIP 결과 인스턴스. */
        public static final Result SKIPPED = new Result(0, 0, 0, true);

        /** 모든 처리 대상이 0건일 때 반환되는 인스턴스. */
        public static final Result NONE = new Result(0, 0, 0, false);
    }
}
