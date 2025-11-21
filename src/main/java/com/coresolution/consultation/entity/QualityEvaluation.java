package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담 품질 평가 엔티티
 * 상담의 품질을 평가하는 정보를 저장
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Entity
@Table(name = "quality_evaluations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QualityEvaluation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "consultation_id", nullable = false)
    private Long consultationId;
    
    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;
    
    @Column(name = "evaluator_id", nullable = false)
    private String evaluatorId;
    
    @Column(name = "evaluator_type", nullable = false)
    private String evaluatorType; // ADMIN, SUPERVISOR, PEER
    
    @Column(name = "overall_score", nullable = false)
    private Double overallScore;
    
    @Column(name = "communication_score", nullable = false)
    private Double communicationScore;
    
    @Column(name = "professionalism_score", nullable = false)
    private Double professionalismScore;
    
    @Column(name = "effectiveness_score", nullable = false)
    private Double effectivenessScore;
    
    @Column(name = "client_satisfaction_score", nullable = false)
    private Double clientSatisfactionScore;
    
    @Column(name = "evaluation_notes", columnDefinition = "TEXT")
    private String evaluationNotes;
    
    @Column(name = "improvement_suggestions", columnDefinition = "TEXT")
    private String improvementSuggestions;
    
    @Column(name = "evaluation_status")
    private String evaluationStatus = "PENDING"; // PENDING, APPROVED, REJECTED
    
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    
    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    @Column(name = "version")
    private Long version = 1L;
    
    // 연관관계 매핑
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultation_id", insertable = false, updatable = false)
    private Consultation consultation;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id", insertable = false, updatable = false)
    private Consultant consultant;
    
    // 비즈니스 메서드
    public void softDelete() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.version++;
    }
    
    public void restore() {
        this.isDeleted = false;
        this.deletedAt = null;
        this.updatedAt = LocalDateTime.now();
        this.version++;
    }
    
    public void approve() {
        this.evaluationStatus = "APPROVED";
        this.updatedAt = LocalDateTime.now();
        this.version++;
    }
    
    public void reject() {
        this.evaluationStatus = "REJECTED";
        this.updatedAt = LocalDateTime.now();
        this.version++;
    }
    
    public Double getAverageScore() {
        return (overallScore + communicationScore + professionalismScore + 
                effectivenessScore + clientSatisfactionScore) / 5.0;
    }
}
