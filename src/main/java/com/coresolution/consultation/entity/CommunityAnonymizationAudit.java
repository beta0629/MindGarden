package com.coresolution.consultation.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 커뮤니티 작성자 익명화 audit — Phase 4 옵션 b
 * (USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.12 Q12).
 *
 * <p>Flyway V20260606_005 의 {@code community_anonymization_audit} 테이블과 1:1 정합.
 * 사용자 익명화 시점에 본인이 작성한 community_posts / community_comments 각 행마다
 * 한 줄씩 INSERT 되어 누가/언제/어떤 글이 익명화되었는지 추적한다. append-only 로그.</p>
 *
 * <p>본문은 보존되므로 {@link #bodyHash} 는 변경 추적용으로만 사용된다 (이후 본문이
 * 다른 경로로 수정될 경우 hash 불일치 감지 가능).</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Entity
@Table(
    name = "community_anonymization_audit",
    indexes = {
        @Index(name = "idx_caa_tenant", columnList = "tenant_id"),
        @Index(name = "idx_caa_original_user", columnList = "original_user_id"),
        @Index(name = "idx_caa_anonymized_at", columnList = "anonymized_at"),
        @Index(name = "idx_caa_record", columnList = "community_table, record_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityAnonymizationAudit {

    /** community_posts 대응 community_table 값. */
    public static final String TABLE_COMMUNITY_POSTS = "community_posts";

    /** community_comments 대응 community_table 값. */
    public static final String TABLE_COMMUNITY_COMMENTS = "community_comments";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "original_user_id", nullable = false)
    private Long originalUserId;

    @Column(name = "community_table", nullable = false, length = 64)
    private String communityTable;

    @Column(name = "record_id", nullable = false)
    private Long recordId;

    @Column(name = "anonymized_at", nullable = false)
    private LocalDateTime anonymizedAt;

    @Column(name = "anonymization_reason", nullable = false, length = 64)
    private String anonymizationReason;

    @Column(name = "body_hash", nullable = false, length = 64)
    private String bodyHash;

    @Column(name = "actor_user_id")
    private Long actorUserId;

    @Column(name = "actor_role", length = 32)
    private String actorRole;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
