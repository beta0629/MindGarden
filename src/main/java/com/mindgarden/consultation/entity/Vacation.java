package com.mindgarden.consultation.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사 휴가 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-09
 */
@Entity
@Table(name = "vacations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vacation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;
    
    @Column(name = "vacation_date", nullable = false)
    private LocalDate vacationDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "vacation_type", nullable = false)
    private VacationType vacationType;
    
    @Column(name = "reason", length = 500)
    private String reason;
    
    @Column(name = "start_time")
    private LocalTime startTime;
    
    @Column(name = "end_time")
    private LocalTime endTime;
    
    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false;
    
    @Column(name = "approved_by")
    private Long approvedBy;
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    /**
     * 휴가 타입 열거형
     */
    public enum VacationType {
        MORNING("오전 휴가 (09:00-13:00)"),
        MORNING_HALF_DAY("오전반차 (09:00-14:00)"),
        MORNING_HALF_1("오전 반반차 1 (09:00-11:00)"),
        MORNING_HALF_2("오전 반반차 2 (11:00-13:00)"),
        AFTERNOON("오후 휴가 (14:00-18:00)"),
        AFTERNOON_HALF_DAY("오후반차 (14:00-18:00)"),
        AFTERNOON_HALF_1("오후 반반차 1 (14:00-16:00)"),
        AFTERNOON_HALF_2("오후 반반차 2 (16:00-18:00)"),
        CUSTOM_TIME("사용자 정의 휴가"),
        ALL_DAY("하루 종일 휴가"),
        FULL_DAY("하루 종일 휴가");
        
        private final String description;
        
        VacationType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}
