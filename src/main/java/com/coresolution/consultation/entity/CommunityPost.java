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
}
