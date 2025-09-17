package com.mindgarden.consultation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 상담사 평가 엔티티
 * - 내담자가 상담 후 상담사에게 하트 점수 평가
 * - 1-5 하트 점수 시스템
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
@Entity
@Table(name = "consultant_ratings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class ConsultantRating extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 평가받는 상담사
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id", nullable = false)
    private User consultant;

    /**
     * 평가하는 내담자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    /**
     * 관련 스케줄 (상담 세션)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    /**
     * 하트 점수 (1-5)
     */
    @Column(name = "heart_score", nullable = false)
    private Integer heartScore;

    /**
     * 평가 코멘트 (선택사항)
     */
    @Column(name = "comment", length = 500)
    private String comment;

    /**
     * 평가 태그들 (JSON 형태로 저장)
     * 예: ["친절해요", "전문적이에요", "도움이 되었어요"]
     */
    @Column(name = "rating_tags", columnDefinition = "JSON")
    private String ratingTags;

    /**
     * 익명 여부
     */
    @Column(name = "is_anonymous")
    @Builder.Default
    private Boolean isAnonymous = false;

    /**
     * 평가 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private RatingStatus status = RatingStatus.ACTIVE;

    /**
     * 평가 일시
     */
    @Column(name = "rated_at")
    @Builder.Default
    private LocalDateTime ratedAt = LocalDateTime.now();

    /**
     * 평가 상태 열거형
     */
    public enum RatingStatus {
        ACTIVE,     // 활성 평가
        HIDDEN,     // 숨김 처리
        REPORTED,   // 신고됨
        DELETED     // 삭제됨
    }

    /**
     * 하트 점수 유효성 검사
     */
    @PrePersist
    @PreUpdate
    private void validateHeartScore() {
        if (heartScore == null || heartScore < 1 || heartScore > 5) {
            throw new IllegalArgumentException("하트 점수는 1-5 사이여야 합니다.");
        }
    }
}
