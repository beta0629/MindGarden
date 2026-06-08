package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
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
 * Apple T2 — Guideline 1.2 UGC 안전장치: 사용자 차단 관계.
 *
 * <p>A 가 B 를 차단하면 A 의 커뮤니티 피드/댓글 조회에서 B 의 작성물이 비노출된다.
 * 단방향 정책 — B 는 차단 사실을 알 수 없으며 B 의 피드는 영향 없다.</p>
 *
 * <p>멀티테넌트 가드: {@code tenantId + blocker + blocked} UNIQUE.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Entity
@Table(
    name = "community_user_blocks",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_cub_tenant_blocker_blocked",
        columnNames = {"tenant_id", "blocker_user_id", "blocked_user_id"}
    ),
    indexes = {
        @Index(name = "idx_cub_tenant_blocker", columnList = "tenant_id,blocker_user_id,is_deleted"),
        @Index(name = "idx_cub_tenant_blocked", columnList = "tenant_id,blocked_user_id,is_deleted")
    }
)
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class CommunityUserBlock extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "blocker_user_id", nullable = false)
    private User blocker;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "blocked_user_id", nullable = false)
    private User blocked;

    @Column(name = "reason", length = 500)
    private String reason;
}
