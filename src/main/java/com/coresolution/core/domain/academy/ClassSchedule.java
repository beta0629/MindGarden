package com.coresolution.core.domain.academy;

import com.coresolution.consultation.entity.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 시간표 엔티티
 * 학원 시스템의 반별 시간표 정보를 관리하는 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Entity
@Table(name = "class_schedules", indexes = {
    @Index(name = "idx_schedule_id", columnList = "schedule_id"),
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_branch_id", columnList = "branch_id"),
    @Index(name = "idx_class_id", columnList = "class_id"),
    @Index(name = "idx_tenant_branch", columnList = "tenant_id,branch_id"),
    @Index(name = "idx_day_of_week", columnList = "day_of_week"),
    @Index(name = "idx_session_date", columnList = "session_date"),
    @Index(name = "idx_is_regular", columnList = "is_regular"),
    @Index(name = "idx_is_active", columnList = "is_active"),
    @Index(name = "idx_is_deleted", columnList = "is_deleted")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ClassSchedule extends BaseEntity {
    
    /**
     * 요일 상수
     */
    public static final int SUNDAY = 0;
    public static final int MONDAY = 1;
    public static final int TUESDAY = 2;
    public static final int WEDNESDAY = 3;
    public static final int THURSDAY = 4;
    public static final int FRIDAY = 5;
    public static final int SATURDAY = 6;
    
    // === 기본 정보 ===
    
    /**
     * 시간표 UUID (고유 식별자)
     */
    @NotBlank(message = "시간표 ID는 필수입니다")
    @Size(max = 36, message = "시간표 ID는 36자 이하여야 합니다")
    @Column(name = "schedule_id", nullable = false, unique = true, length = 36, updatable = false)
    private String scheduleId;
    
    /**
     * 지점 ID
     */
    @NotNull(message = "지점 ID는 필수입니다")
    @Column(name = "branch_id", nullable = false)
    private Long branchId;
    
    /**
     * 반 ID
     */
    @NotBlank(message = "반 ID는 필수입니다")
    @Size(max = 36, message = "반 ID는 36자 이하여야 합니다")
    @Column(name = "class_id", nullable = false, length = 36)
    private String classId;
    
    // === 시간표 정보 ===
    
    /**
     * 요일 (0=일요일, 1=월요일, ..., 6=토요일)
     */
    @NotNull(message = "요일은 필수입니다")
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;
    
    /**
     * 시작 시간
     */
    @NotNull(message = "시작 시간은 필수입니다")
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;
    
    /**
     * 종료 시간
     */
    @NotNull(message = "종료 시간은 필수입니다")
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
    
    /**
     * 강의실
     */
    @Size(max = 100, message = "강의실은 100자 이하여야 합니다")
    @Column(name = "room", length = 100)
    private String room;
    
    // === 수업 정보 ===
    
    /**
     * 회차 번호
     */
    @Column(name = "session_number")
    private Integer sessionNumber;
    
    /**
     * 특정 날짜 (정기 수업이 아닌 경우)
     */
    @Column(name = "session_date")
    private LocalDate sessionDate;
    
    /**
     * 정기 수업 여부
     */
    @Column(name = "is_regular", nullable = false)
    @Builder.Default
    private Boolean isRegular = true;
    
    // === 상태 정보 ===
    
    /**
     * 활성화 여부
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    /**
     * 생성자
     */
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    /**
     * 수정자
     */
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
    
    // === 연관 관계 ===
    
    /**
     * 반 (Many-to-One)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", referencedColumnName = "class_id", insertable = false, updatable = false)
    @JsonIgnore
    private Class classEntity;
    
    // === 비즈니스 메서드 ===
    
    /**
     * 시간표가 활성 상태인지 확인
     */
    public boolean isActiveSchedule() {
        return isActive != null && isActive && !isDeleted();
    }
    
    /**
     * 정기 수업인지 확인
     */
    public boolean isRegularSchedule() {
        return isRegular != null && isRegular;
    }
    
    /**
     * 특정 날짜 수업인지 확인
     */
    public boolean isSpecificDateSchedule() {
        return sessionDate != null;
    }
    
    /**
     * 수업 시간(분) 계산
     */
    public Integer getDurationMinutes() {
        if (startTime != null && endTime != null) {
            return (int) java.time.Duration.between(startTime, endTime).toMinutes();
        }
        return null;
    }
    
    /**
     * 요일명 반환
     */
    public String getDayOfWeekName() {
        if (dayOfWeek == null) {
            return null;
        }
        String[] dayNames = {"일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"};
        if (dayOfWeek >= 0 && dayOfWeek < dayNames.length) {
            return dayNames[dayOfWeek];
        }
        return "알 수 없음";
    }
}

