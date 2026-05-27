package com.coresolution.consultation.entity;

import com.coresolution.consultation.constant.CommunityModerationStatus;
import com.coresolution.consultation.constant.CommunityPostKind;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * 커뮤니티 게시글.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Entity
@Table(name = "community_posts", indexes = {
    @Index(name = "idx_cp_tenant_status_created", columnList = "tenant_id,moderation_status,created_at"),
    @Index(name = "idx_cp_tenant_author", columnList = "tenant_id,author_user_id")
})
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class CommunityPost extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_user_id", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_kind", nullable = false, length = 32)
    private CommunityPostKind postKind;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "specialty", length = 200)
    private String specialty;

    @Column(name = "is_anonymous", nullable = false)
    private boolean anonymous;

    @Enumerated(EnumType.STRING)
    @Column(name = "moderation_status", nullable = false, length = 32)
    private CommunityModerationStatus moderationStatus;

    @Column(name = "moderated_at")
    private java.time.LocalDateTime moderatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderated_by_user_id")
    private User moderatedBy;

    @Column(name = "moderation_reason_code", length = 64)
    private String moderationReasonCode;

    @Column(name = "moderation_note", length = 500)
    private String moderationNote;

    /**
     * 작성자 익명화 여부 — Phase 4 옵션 b (USER_LIFECYCLE_TERMINATION_POLICY §10.12 Q12).
     *
     * <p>{@code true} 면 UI 가 작성자 이름 대신 "[삭제된 사용자]" 를 표시하고 프로필 이미지를
     * placeholder 로 대체한다. 본문은 보존된다 (저작권 + 커뮤니티 유지). false 면 일반 노출.</p>
     */
    @Column(name = "author_anonymized", nullable = false)
    private boolean authorAnonymized;

    /** 작성자 익명화 시각 — null 이면 미익명. */
    @Column(name = "author_anonymized_at")
    private java.time.LocalDateTime authorAnonymizedAt;
}
