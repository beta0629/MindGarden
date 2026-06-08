package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * 커뮤니티 댓글.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Entity
@Table(name = "community_comments", indexes = {
    @Index(name = "idx_cc_tenant_post", columnList = "tenant_id,post_id,created_at")
})
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class CommunityComment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private CommunityPost post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_user_id", nullable = false)
    private User author;

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    /**
     * 작성자 익명화 여부 — Phase 4 옵션 b (USER_LIFECYCLE_TERMINATION_POLICY §10.12 Q12).
     *
     * <p>{@code true} 면 UI 가 작성자 이름 대신 "[삭제된 사용자]" 를 표시한다. 본문은 보존.</p>
     */
    @Column(name = "author_anonymized", nullable = false)
    private boolean authorAnonymized;

    /** 작성자 익명화 시각 — null 이면 미익명. */
    @Column(name = "author_anonymized_at")
    private java.time.LocalDateTime authorAnonymizedAt;

    /** Apple T2 1.2 — 댓글 숨김 시각(어드민 또는 자동 격리). */
    @Column(name = "hidden_at")
    private java.time.LocalDateTime hiddenAt;

    /** Apple T2 1.2 — 댓글 숨김 처리자. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hidden_by_user_id")
    private User hiddenBy;

    /** Apple T2 1.2 — 댓글 숨김 사유 메모. */
    @Column(name = "hidden_reason", length = 200)
    private String hiddenReason;

    /** Apple T2 1.2 — 댓글 자동 모더레이션(금칙어 등) 매칭 여부. */
    @Column(name = "auto_moderated", nullable = false)
    private boolean autoModerated;

    /** Apple T2 1.2 — 댓글 자동 필터 코드. */
    @Column(name = "auto_moderated_reason_code", length = 64)
    private String autoModeratedReasonCode;
}
