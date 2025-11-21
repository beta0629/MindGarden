package com.coresolution.core.domain.academy;

import com.coresolution.consultation.entity.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

/**
 * 출결 엔티티
 * 학원 시스템의 출결 정보를 관리하는 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Entity
@Table(name = "attendances", indexes = {
    @Index(name = "idx_attendance_id", columnList = "attendance_id"),
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_branch_id", columnList = "branch_id"),
    @Index(name = "idx_enrollment_id", columnList = "enrollment_id"),
    @Index(name = "idx_schedule_id", columnList = "schedule_id"),
    @Index(name = "idx_tenant_branch", columnList = "tenant_id,branch_id"),
    @Index(name = "idx_attendance_date", columnList = "attendance_date"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_recorded_at", columnList = "recorded_at"),
    @Index(name = "idx_is_deleted", columnList = "is_deleted")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_enrollment_schedule_date", columnNames = {"enrollment_id", "schedule_id", "attendance_date"})
})
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Attendance extends BaseEntity {
    
    /**
     * 출결 상태 열거형
     */
    public enum AttendanceStatus {
        PRESENT("출석"),
        ABSENT("결석"),
        LATE("지각"),
        EARLY_LEAVE("조퇴"),
        EXCUSED("사유결석");
        
        private final String description;
        
        AttendanceStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 기록 방법 열거형
     */
    public enum RecordingMethod {
        MANUAL("수동"),
        QR_CODE("QR코드"),
        BIOMETRIC("생체인식"),
        AUTO("자동");
        
        private final String description;
        
        RecordingMethod(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // === 기본 정보 ===
    
    /**
     * 출결 UUID (고유 식별자)
     */
    @NotBlank(message = "출결 ID는 필수입니다")
    @Size(max = 36, message = "출결 ID는 36자 이하여야 합니다")
    @Column(name = "attendance_id", nullable = false, unique = true, length = 36, updatable = false)
    private String attendanceId;
    
    /**
     * 지점 ID
     */
    @NotNull(message = "지점 ID는 필수입니다")
    @Column(name = "branch_id", nullable = false)
    private Long branchId;
    
    /**
     * 수강 등록 ID
     */
    @NotBlank(message = "수강 등록 ID는 필수입니다")
    @Size(max = 36, message = "수강 등록 ID는 36자 이하여야 합니다")
    @Column(name = "enrollment_id", nullable = false, length = 36)
    private String enrollmentId;
    
    /**
     * 시간표 ID (정기 수업인 경우)
     */
    @Size(max = 36, message = "시간표 ID는 36자 이하여야 합니다")
    @Column(name = "schedule_id", length = 36)
    private String scheduleId;
    
    // === 출결 정보 ===
    
    /**
     * 출결 날짜
     */
    @NotNull(message = "출결 날짜는 필수입니다")
    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;
    
    /**
     * 출결 시간
     */
    @Column(name = "attendance_time")
    private LocalTime attendanceTime;
    
    /**
     * 출결 상태
     */
    @NotNull(message = "출결 상태는 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AttendanceStatus status;
    
    // === 기록 정보 ===
    
    /**
     * 기록 일시
     */
    @Column(name = "recorded_at")
    private java.time.LocalDateTime recordedAt;
    
    /**
     * 기록한 사용자
     */
    @Size(max = 100, message = "기록한 사용자는 100자 이하여야 합니다")
    @Column(name = "recorded_by", length = 100)
    private String recordedBy;
    
    /**
     * 기록 방법
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "recording_method", length = 50)
    private RecordingMethod recordingMethod;
    
    // === 메모 ===
    
    /**
     * 비고
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    /**
     * 사유 (결석/지각/조퇴인 경우)
     */
    @Column(name = "excuse_reason", columnDefinition = "TEXT")
    private String excuseReason;
    
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
     * 수강 등록 (Many-to-One)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", referencedColumnName = "enrollment_id", insertable = false, updatable = false)
    @JsonIgnore
    private ClassEnrollment enrollment;
    
    /**
     * 시간표 (Many-to-One)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", referencedColumnName = "schedule_id", insertable = false, updatable = false)
    @JsonIgnore
    private ClassSchedule schedule;
    
    // === 비즈니스 메서드 ===
    
    /**
     * 출석인지 확인
     */
    public boolean isPresent() {
        return AttendanceStatus.PRESENT.equals(status);
    }
    
    /**
     * 결석인지 확인
     */
    public boolean isAbsent() {
        return AttendanceStatus.ABSENT.equals(status);
    }
    
    /**
     * 지각인지 확인
     */
    public boolean isLate() {
        return AttendanceStatus.LATE.equals(status);
    }
    
    /**
     * 조퇴인지 확인
     */
    public boolean isEarlyLeave() {
        return AttendanceStatus.EARLY_LEAVE.equals(status);
    }
    
    /**
     * 사유결석인지 확인
     */
    public boolean isExcused() {
        return AttendanceStatus.EXCUSED.equals(status);
    }
    
    /**
     * 출석률 계산에 포함되는지 확인 (출석, 사유결석 포함)
     */
    public boolean isCountedForAttendanceRate() {
        return isPresent() || isExcused();
    }
    
    /**
     * 지각 시간 계산 (분 단위)
     * 시간표의 시작 시간과 실제 출결 시간 비교
     */
    public Integer getLateMinutes() {
        if (schedule != null && schedule.getStartTime() != null && attendanceTime != null) {
            if (attendanceTime.isAfter(schedule.getStartTime())) {
                return (int) ChronoUnit.MINUTES.between(schedule.getStartTime(), attendanceTime);
            }
        }
        return null;
    }
}

