package com.mindgarden.consultation.entity;

import java.time.LocalDate;
import com.mindgarden.consultation.constant.UserRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;

/**
 * 상담사 상세 엔티티
 * User 엔티티를 상속받아 상담사 전용 정보를 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "consultants", indexes = {
    @Index(name = "idx_consultants_grade", columnList = "grade"),
    @Index(name = "idx_consultants_specialty", columnList = "specialty"),
    @Index(name = "idx_consultants_is_deleted", columnList = "is_deleted")
})
public class Consultant extends User {
    
    @Size(max = 100, message = "전문 분야는 100자 이하여야 합니다.")
    @Column(name = "specialty", length = 100)
    private String specialty;
    
    @Size(max = 500, message = "전문 분야 상세는 500자 이하여야 합니다.")
    @Column(name = "specialty_details", columnDefinition = "TEXT")
    private String specialtyDetails;
    
    @Column(name = "years_of_experience")
    private Integer yearsOfExperience = 0;
    
    @Column(name = "total_clients")
    private Integer totalClients = 0;
    
    @Column(name = "total_consultations")
    private Integer totalConsultations = 0;
    
    @Column(name = "success_rate")
    private Double successRate = 0.0; // 0.0 - 100.0
    
    @Column(name = "average_rating")
    private Double averageRating = 0.0; // 0.0 - 5.0
    
    @Column(name = "total_ratings")
    private Integer totalRatings = 0;
    
    @Size(max = 100, message = "자격증은 100자 이하여야 합니다.")
    @Column(name = "certification", length = 100)
    private String certification;
    
    @Size(max = 500, message = "학력은 500자 이하여야 합니다.")
    @Column(name = "education", columnDefinition = "TEXT")
    private String education;
    
    @Size(max = 1000, message = "전문 배경은 1000자 이하여야 합니다.")
    @Column(name = "professional_background", columnDefinition = "TEXT")
    private String professionalBackground;
    
    @Size(max = 1000, message = "업무 경력은 1000자 이하여야 합니다.")
    @Column(name = "work_history", columnDefinition = "TEXT")
    private String workHistory;
    
    @Size(max = 500, message = "수상 및 성과는 500자 이하여야 합니다.")
    @Column(name = "awards_achievements", columnDefinition = "TEXT")
    private String awardsAchievements;
    
    @Size(max = 500, message = "연구 및 논문은 500자 이하여야 합니다.")
    @Column(name = "research_publications", columnDefinition = "TEXT")
    private String researchPublications;
    
    @Column(name = "max_clients")
    private Integer maxClients = 20; // 최대 담당 내담자 수
    
    @Column(name = "current_clients")
    private Integer currentClients = 0; // 현재 담당 내담자 수
    
    @Column(name = "is_available")
    private Boolean isAvailable = true; // 상담 가능 여부
    
    @Column(name = "preferred_consultation_methods")
    private String preferredConsultationMethods; // "FACE_TO_FACE,ONLINE,PHONE"
    
    @Column(name = "consultation_hours")
    private String consultationHours; // "09:00-18:00"
    
    @Column(name = "break_time")
    private String breakTime; // "12:00-13:00"
    
    @Column(name = "session_duration")
    private Integer sessionDuration = 50; // 상담 세션 시간 (분)
    
    @Column(name = "break_between_sessions")
    private Integer breakBetweenSessions = 10; // 세션 간 휴식 시간 (분)
    
    @Column(name = "last_consultation_date")
    private LocalDate lastConsultationDate;
    
    @Column(name = "next_available_date")
    private LocalDate nextAvailableDate;
    
    @Column(name = "supervisor_id")
    private Long supervisorId; // 지도자 ID (시니어 상담사)
    
    @Column(name = "is_supervisor")
    private Boolean isSupervisor = false; // 지도자 여부
    
    @Column(name = "supervision_required")
    private Boolean supervisionRequired = false; // 지도 필요 여부
    
    // 생성자
    public Consultant() {
        super();
        setRole(UserRole.CONSULTANT);
        setGrade("CONSULTANT_JUNIOR");
        this.yearsOfExperience = 0;
        this.totalClients = 0;
        this.totalConsultations = 0;
        this.successRate = 0.0;
        this.averageRating = 0.0;
        this.totalRatings = 0;
        this.maxClients = 20;
        this.currentClients = 0;
        this.isAvailable = true;
        this.sessionDuration = 50;
        this.breakBetweenSessions = 10;
        this.isSupervisor = false;
        this.supervisionRequired = false;
    }
    
    // 비즈니스 메서드
    /**
     * 내담자 추가
     */
    public boolean addClient() {
        if (currentClients < maxClients) {
            this.currentClients++;
            return true;
        }
        return false;
    }
    
    /**
     * 내담자 제거
     */
    public boolean removeClient() {
        if (currentClients > 0) {
            this.currentClients--;
            return true;
        }
        return false;
    }
    
    /**
     * 상담 완료 처리
     */
    public void completeConsultation(boolean isSuccessful) {
        this.totalConsultations++;
        updateSuccessRate(isSuccessful);
    }
    
    /**
     * 성공률 업데이트
     */
    private void updateSuccessRate(boolean isSuccessful) {
        // 간단한 성공률 계산 (실제로는 더 복잡한 로직 필요)
        if (totalConsultations > 0) {
            // 실제 구현에서는 성공/실패 카운트를 별도로 관리해야 함
            // 여기서는 단순화된 예시
        }
    }
    
    /**
     * 평점 추가
     */
    public void addRating(Double rating) {
        if (rating != null && rating >= 0.0 && rating <= 5.0) {
            double totalRatingSum = averageRating * totalRatings + rating;
            this.totalRatings++;
            this.averageRating = totalRatingSum / totalRatings;
        }
    }
    
    /**
     * 상담 가능 여부 확인
     */
    public boolean canAcceptNewClient() {
        return isAvailable && currentClients < maxClients;
    }
    
    /**
     * 전문 분야 설정
     */
    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }
    
    /**
     * 경력 연차 업데이트
     */
    public void updateExperienceYears() {
        // 실제 구현에서는 입사일 또는 자격 취득일 기준으로 계산
        // 여기서는 단순화된 예시
    }
    
    // Getter & Setter
    public String getSpecialty() {
        return specialty;
    }
    
    public String getSpecialtyDetails() {
        return specialtyDetails;
    }
    
    public void setSpecialtyDetails(String specialtyDetails) {
        this.specialtyDetails = specialtyDetails;
    }
    
    public Integer getYearsOfExperience() {
        return yearsOfExperience;
    }
    
    public void setYearsOfExperience(Integer yearsOfExperience) {
        this.yearsOfExperience = yearsOfExperience;
    }
    
    public Integer getTotalClients() {
        return totalClients;
    }
    
    public Integer getTotalConsultations() {
        return totalConsultations;
    }
    
    public Double getSuccessRate() {
        return successRate;
    }
    
    public Double getAverageRating() {
        return averageRating;
    }
    
    public Integer getTotalRatings() {
        return totalRatings;
    }
    
    public String getCertification() {
        return certification;
    }
    
    public void setCertification(String certification) {
        this.certification = certification;
    }
    
    public String getEducation() {
        return education;
    }
    
    public void setEducation(String education) {
        this.education = education;
    }
    
    public String getProfessionalBackground() {
        return professionalBackground;
    }
    
    public void setProfessionalBackground(String professionalBackground) {
        this.professionalBackground = professionalBackground;
    }
    
    public String getWorkHistory() {
        return workHistory;
    }
    
    public void setWorkHistory(String workHistory) {
        this.workHistory = workHistory;
    }
    
    public String getAwardsAchievements() {
        return awardsAchievements;
    }
    
    public void setAwardsAchievements(String awardsAchievements) {
        this.awardsAchievements = awardsAchievements;
    }
    
    public String getResearchPublications() {
        return researchPublications;
    }
    
    public void setResearchPublications(String researchPublications) {
        this.researchPublications = researchPublications;
    }
    
    public Integer getMaxClients() {
        return maxClients;
    }
    
    public void setMaxClients(Integer maxClients) {
        this.maxClients = maxClients;
    }
    
    public Integer getCurrentClients() {
        return currentClients;
    }
    
    public Boolean getIsAvailable() {
        return isAvailable;
    }
    
    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
    }
    
    public String getPreferredConsultationMethods() {
        return preferredConsultationMethods;
    }
    
    public void setPreferredConsultationMethods(String preferredConsultationMethods) {
        this.preferredConsultationMethods = preferredConsultationMethods;
    }
    
    public String getConsultationHours() {
        return consultationHours;
    }
    
    public void setConsultationHours(String consultationHours) {
        this.consultationHours = consultationHours;
    }
    
    public String getBreakTime() {
        return breakTime;
    }
    
    public void setBreakTime(String breakTime) {
        this.breakTime = breakTime;
    }
    
    public Integer getSessionDuration() {
        return sessionDuration;
    }
    
    public void setSessionDuration(Integer sessionDuration) {
        this.sessionDuration = sessionDuration;
    }
    
    public Integer getBreakBetweenSessions() {
        return breakBetweenSessions;
    }
    
    public void setBreakBetweenSessions(Integer breakBetweenSessions) {
        this.breakBetweenSessions = breakBetweenSessions;
    }
    
    public LocalDate getLastConsultationDate() {
        return lastConsultationDate;
    }
    
    public void setLastConsultationDate(LocalDate lastConsultationDate) {
        this.lastConsultationDate = lastConsultationDate;
    }
    
    public LocalDate getNextAvailableDate() {
        return nextAvailableDate;
    }
    
    public void setNextAvailableDate(LocalDate nextAvailableDate) {
        this.nextAvailableDate = nextAvailableDate;
    }
    
    public Long getSupervisorId() {
        return supervisorId;
    }
    
    public void setSupervisorId(Long supervisorId) {
        this.supervisorId = supervisorId;
    }
    
    public Boolean getIsSupervisor() {
        return isSupervisor;
    }
    
    public void setIsSupervisor(Boolean isSupervisor) {
        this.isSupervisor = isSupervisor;
    }
    
    public Boolean getSupervisionRequired() {
        return supervisionRequired;
    }
    
    public void setSupervisionRequired(Boolean supervisionRequired) {
        this.supervisionRequired = supervisionRequired;
    }
    
    // toString
    @Override
    public String toString() {
        return "Consultant{" +
                "id=" + getId() +
                ", name='" + getName() + '\'' +
                ", email='" + getEmail() + '\'' +
                ", grade='" + getGrade() + '\'' +
                ", specialty='" + specialty + '\'' +
                ", yearsOfExperience=" + yearsOfExperience +
                ", totalClients=" + totalClients +
                ", totalConsultations=" + totalConsultations +
                ", averageRating=" + averageRating +
                ", isAvailable=" + isAvailable +
                '}';
    }
}
