package com.mindgarden.consultation.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사-내담자 매핑 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "consultant_client_mappings", indexes = {
    @Index(name = "idx_mapping_consultant", columnList = "consultant_id"),
    @Index(name = "idx_mapping_client", columnList = "client_id"),
    @Index(name = "idx_mapping_status", columnList = "status"),
    @Index(name = "idx_mapping_start_date", columnList = "start_date")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantClientMapping extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id", nullable = false)
    private User consultant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private MappingStatus status = MappingStatus.ACTIVE;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "responsibility", length = 500)
    private String responsibility;

    @Column(name = "special_considerations", columnDefinition = "TEXT")
    private String specialConsiderations;

    @Column(name = "assigned_by", length = 100)
    private String assignedBy;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "termination_reason", length = 500)
    private String terminationReason;

    @Column(name = "terminated_by", length = 100)
    private String terminatedBy;

    @Column(name = "terminated_at")
    private LocalDateTime terminatedAt;

    /**
     * 매핑 상태 enum
     */
    public enum MappingStatus {
        ACTIVE, INACTIVE, SUSPENDED, TERMINATED
    }

    /**
     * 매핑 활성화
     */
    public void activate() {
        this.status = MappingStatus.ACTIVE;
        this.startDate = LocalDateTime.now();
    }

    /**
     * 매핑 비활성화
     */
    public void deactivate() {
        this.status = MappingStatus.INACTIVE;
        this.endDate = LocalDateTime.now();
    }

    /**
     * 매핑 중단
     */
    public void suspend(String reason) {
        this.status = MappingStatus.SUSPENDED;
        this.notes = reason;
    }

    /**
     * 매핑 종료
     */
    public void terminate(String reason, String terminatedBy) {
        this.status = MappingStatus.TERMINATED;
        this.terminationReason = reason;
        this.terminatedBy = terminatedBy;
        this.terminatedAt = LocalDateTime.now();
        this.endDate = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.assignedAt == null) {
            this.assignedAt = LocalDateTime.now();
        }
    }
}
