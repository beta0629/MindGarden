package com.coresolution.consultation.entity;

import com.coresolution.consultation.constant.CommunityReportPriority;
import com.coresolution.consultation.constant.CommunityReportResolutionAction;
import com.coresolution.consultation.constant.CommunityReportStatus;
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
 * 커뮤니티 신고.
 *
 * <p>Apple T2 (1.2 UGC) 확장 — 어드민 처리 큐를 위한 status/priority/resolved 컬럼이 추가되었다.
 * 기존 신고 row 는 V20260607_011 마이그레이션에서 {@code status=OPEN, priority=NORMAL} 로 백필된다.</p>
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Entity
@Table(name = "community_reports", indexes = {
    @Index(name = "idx_cr_tenant_post", columnList = "tenant_id,post_id"),
    @Index(name = "idx_cr_tenant_status_created", columnList = "tenant_id,status,created_at")
})
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class CommunityReport extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_user_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private CommunityPost post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id")
    private CommunityComment comment;

    @Column(name = "reason_code", nullable = false, length = 64)
    private String reasonCode;

    @Column(name = "detail_message", length = 1000)
    private String detailMessage;

    /** Apple T2 1.2 — 어드민 처리 상태. */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private CommunityReportStatus status;

    /** Apple T2 1.2 — 우선순위 (자동 격리 트리거 시 AUTO_QUARANTINE). */
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 32)
    private CommunityReportPriority priority;

    /** Apple T2 1.2 — 어드민 처리 시각. */
    @Column(name = "resolved_at")
    private java.time.LocalDateTime resolvedAt;

    /** Apple T2 1.2 — 처리한 관리자. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_admin_id")
    private User resolvedByAdmin;

    /** Apple T2 1.2 — 어드민 결정 액션. */
    @Enumerated(EnumType.STRING)
    @Column(name = "resolution_action", length = 64)
    private CommunityReportResolutionAction resolutionAction;
}
