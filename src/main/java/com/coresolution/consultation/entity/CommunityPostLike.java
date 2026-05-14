package com.coresolution.consultation.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * 게시글 좋아요(사용자당 1건).
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Entity
@Table(name = "community_post_likes",
    uniqueConstraints = @UniqueConstraint(name = "uk_cpl_tenant_post_user", columnNames = {"tenant_id", "post_id", "user_id"}),
    indexes = @Index(name = "idx_cpl_post", columnList = "tenant_id,post_id"))
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class CommunityPostLike extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private CommunityPost post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
