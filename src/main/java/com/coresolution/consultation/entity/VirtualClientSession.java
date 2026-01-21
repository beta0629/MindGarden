package com.coresolution.consultation.entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 가상 내담자 시뮬레이션 세션 엔티티
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Entity
@Table(name = "virtual_client_sessions")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class VirtualClientSession extends BaseEntity {

    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;

    // 시나리오 정보
    @Column(name = "scenario_type", length = 100)
    private String scenarioType;

    @Column(name = "difficulty_level", length = 20)
    private String difficultyLevel;

    // 가상 내담자 프로필
    @Column(name = "virtual_client_profile", columnDefinition = "JSON")
    private String virtualClientProfile;

    @Lob
    @Column(name = "presenting_problem", columnDefinition = "TEXT")
    private String presentingProblem;

    @Lob
    @Column(name = "background_story", columnDefinition = "TEXT")
    private String backgroundStory;

    // 대화 기록
    @Column(name = "conversation_history", columnDefinition = "JSON")
    private String conversationHistory;

    @Column(name = "turn_count")
    private Integer turnCount;

    // 평가 결과
    @Column(name = "counselor_performance_score", precision = 3, scale = 2)
    private BigDecimal counselorPerformanceScore;

    @Column(name = "technique_used", columnDefinition = "JSON")
    private String techniqueUsed;

    @Column(name = "mistakes_made", columnDefinition = "JSON")
    private String mistakesMade;

    @Column(name = "good_responses", columnDefinition = "JSON")
    private String goodResponses;

    // AI 평가
    @Lob
    @Column(name = "ai_evaluation_summary", columnDefinition = "TEXT")
    private String aiEvaluationSummary;

    @Column(name = "learning_points", columnDefinition = "JSON")
    private String learningPoints;

    // 세션 상태
    @Column(name = "session_status", length = 20)
    private String sessionStatus;  // IN_PROGRESS, COMPLETED, ABANDONED

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
