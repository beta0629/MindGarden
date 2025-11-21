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
import java.util.List;

/**
 * 반 엔티티
 * 학원 시스템의 반(Class) 정보를 관리하는 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Entity
@Table(name = "classes", indexes = {
    @Index(name = "idx_class_id", columnList = "class_id"),
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_branch_id", columnList = "branch_id"),
    @Index(name = "idx_course_id", columnList = "course_id"),
    @Index(name = "idx_tenant_branch", columnList = "tenant_id,branch_id"),
    @Index(name = "idx_teacher_id", columnList = "teacher_id"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_is_active", columnList = "is_active"),
    @Index(name = "idx_is_deleted", columnList = "is_deleted")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Class extends BaseEntity {
    
    /**
     * 반 상태 열거형
     */
    public enum ClassStatus {
        DRAFT("초안"),
        RECRUITING("모집중"),
        ACTIVE("진행중"),
        COMPLETED("완료"),
        CANCELLED("취소");
        
        private final String description;
        
        ClassStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // === 기본 정보 ===
    
    /**
     * 반 UUID (고유 식별자)
     */
    @NotBlank(message = "반 ID는 필수입니다")
    @Size(max = 36, message = "반 ID는 36자 이하여야 합니다")
    @Column(name = "class_id", nullable = false, unique = true, length = 36, updatable = false)
    private String classId;
    
    /**
     * 지점 ID
     */
    @NotNull(message = "지점 ID는 필수입니다")
    @Column(name = "branch_id", nullable = false)
    private Long branchId;
    
    /**
     * 강좌 ID
     */
    @NotBlank(message = "강좌 ID는 필수입니다")
    @Size(max = 36, message = "강좌 ID는 36자 이하여야 합니다")
    @Column(name = "course_id", nullable = false, length = 36)
    private String courseId;
    
    /**
     * 반명
     */
    @NotBlank(message = "반명은 필수입니다")
    @Size(max = 255, message = "반명은 255자 이하여야 합니다")
    @Column(name = "name", nullable = false, length = 255)
    private String name;
    
    /**
     * 반명 (한글)
     */
    @Size(max = 255, message = "반명(한글)은 255자 이하여야 합니다")
    @Column(name = "name_ko", length = 255)
    private String nameKo;
    
    /**
     * 반명 (영문)
     */
    @Size(max = 255, message = "반명(영문)은 255자 이하여야 합니다")
    @Column(name = "name_en", length = 255)
    private String nameEn;
    
    /**
     * 반 설명
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    // === 강사 정보 ===
    
    /**
     * 담당 강사 ID
     */
    @Column(name = "teacher_id")
    private Long teacherId;
    
    /**
     * 담당 강사명
     */
    @Size(max = 100, message = "강사명은 100자 이하여야 합니다")
    @Column(name = "teacher_name", length = 100)
    private String teacherName;
    
    // === 수용 인원 ===
    
    /**
     * 정원
     */
    @NotNull(message = "정원은 필수입니다")
    @Column(name = "capacity", nullable = false)
    @Builder.Default
    private Integer capacity = 10;
    
    /**
     * 현재 등록 인원
     */
    @Column(name = "current_enrollment", nullable = false)
    @Builder.Default
    private Integer currentEnrollment = 0;
    
    // === 수업 정보 ===
    
    /**
     * 수업 시작일
     */
    @Column(name = "start_date")
    private LocalDate startDate;
    
    /**
     * 수업 종료일
     */
    @Column(name = "end_date")
    private LocalDate endDate;
    
    /**
     * 강의실
     */
    @Size(max = 100, message = "강의실은 100자 이하여야 합니다")
    @Column(name = "room", length = 100)
    private String room;
    
    // === 상태 정보 ===
    
    /**
     * 반 상태
     */
    @NotNull(message = "반 상태는 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ClassStatus status = ClassStatus.DRAFT;
    
    /**
     * 활성화 여부
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    // === 설정 정보 ===
    
    /**
     * 반별 옵션 설정 (JSON)
     */
    @Column(name = "options_json", columnDefinition = "JSON")
    private String optionsJson;
    
    /**
     * 반별 설정 (JSON)
     */
    @Column(name = "settings_json", columnDefinition = "JSON")
    private String settingsJson;
    
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
     * 강좌 (Many-to-One)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", referencedColumnName = "course_id", insertable = false, updatable = false)
    @JsonIgnore
    private Course course;
    
    /**
     * 시간표 목록 (One-to-Many)
     */
    @OneToMany(mappedBy = "classEntity", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ClassSchedule> schedules;
    
    /**
     * 수강 등록 목록 (One-to-Many)
     */
    @OneToMany(mappedBy = "classEntity", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ClassEnrollment> enrollments;
    
    // === 비즈니스 메서드 ===
    
    /**
     * 반이 활성 상태인지 확인
     */
    public boolean isActiveClass() {
        return isActive != null && isActive && !isDeleted() && ClassStatus.ACTIVE.equals(status);
    }
    
    /**
     * 정원이 가득 찼는지 확인
     */
    public boolean isFull() {
        return currentEnrollment != null && capacity != null && currentEnrollment >= capacity;
    }
    
    /**
     * 추가 등록 가능 여부 확인
     */
    public boolean canEnroll() {
        return isActiveClass() && !isFull() && ClassStatus.RECRUITING.equals(status);
    }
    
    /**
     * 등록 인원 증가
     */
    public void incrementEnrollment() {
        if (currentEnrollment == null) {
            currentEnrollment = 0;
        }
        if (capacity == null || currentEnrollment < capacity) {
            currentEnrollment++;
        }
    }
    
    /**
     * 등록 인원 감소
     */
    public void decrementEnrollment() {
        if (currentEnrollment != null && currentEnrollment > 0) {
            currentEnrollment--;
        }
    }
}

