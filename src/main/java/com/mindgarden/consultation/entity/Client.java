package com.mindgarden.consultation.entity;

import java.time.LocalDate;
import com.mindgarden.consultation.constant.UserGrade;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 내담자 상세 엔티티
 * User 엔티티를 상속받아 내담자 전용 정보를 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "clients", indexes = {
    @Index(name = "idx_clients_grade", columnList = "grade"),
    @Index(name = "idx_clients_risk_level", columnList = "risk_level"),
    @Index(name = "idx_clients_is_deleted", columnList = "is_deleted")
})
@Data
public class Client extends User {
    
    @Column(name = "emergency_contact_name", length = 50)
    private String emergencyContactName;
    
    @Pattern(regexp = "^01[0-9]-[0-9]{4}-[0-9]{4}$", message = "올바른 휴대폰 번호 형식이 아닙니다.")
    @Column(name = "emergency_contact_phone", length = 20)
    private String emergencyContactPhone;
    
    @Size(max = 200, message = "긴급연락처 관계는 200자 이하여야 합니다.")
    @Column(name = "emergency_contact_relationship", length = 200)
    private String emergencyContactRelationship;
    
    @Size(max = 20, message = "위험도는 20자 이하여야 합니다.")
    @Column(name = "risk_level", length = 20)
    private String riskLevel = "LOW"; // LOW, MEDIUM, HIGH, CRITICAL
    
    @Size(max = 20, message = "상담 우선순위는 20자 이하여야 합니다.")
    @Column(name = "consultation_priority", length = 20)
    private String consultationPriority = "NORMAL"; // LOW, NORMAL, HIGH, URGENT
    
    @Column(name = "first_consultation_date")
    private LocalDate firstConsultationDate;
    
    @Column(name = "last_consultation_date")
    private LocalDate lastConsultationDate;
    
    @Column(name = "next_consultation_date")
    private LocalDate nextConsultationDate;
    
    @Column(name = "total_sessions")
    private Integer totalSessions = 0;
    
    @Column(name = "completed_sessions")
    private Integer completedSessions = 0;
    
    @Column(name = "cancelled_sessions")
    private Integer cancelledSessions = 0;
    
    @Column(name = "progress_score")
    private Integer progressScore = 0; // 0-100
    
    @Column(name = "goal_achievement_rate")
    private Integer goalAchievementRate = 0; // 0-100
    
    @Size(max = 1000, message = "상담 목표는 1000자 이하여야 합니다.")
    @Column(name = "consultation_goals", columnDefinition = "TEXT")
    private String consultationGoals;
    
    @Size(max = 1000, message = "특별 고려사항은 1000자 이하여야 합니다.")
    @Column(name = "special_considerations", columnDefinition = "TEXT")
    private String specialConsiderations;
    
    @Size(max = 1000, message = "의료 정보는 1000자 이하여야 합니다.")
    @Column(name = "medical_information", columnDefinition = "TEXT")
    private String medicalInformation;
    
    @Size(max = 1000, message = "복용 중인 약물은 1000자 이하여야 합니다.")
    @Column(name = "current_medications", columnDefinition = "TEXT")
    private String currentMedications;
    
    @Size(max = 1000, message = "알레르기 정보는 1000자 이하여야 합니다.")
    @Column(name = "allergies", columnDefinition = "TEXT")
    private String allergies;
    
    @Column(name = "preferred_consultation_time")
    private String preferredConsultationTime; // "MORNING", "AFTERNOON", "EVENING"
    
    @Column(name = "preferred_consultation_method")
    private String preferredConsultationMethod; // "FACE_TO_FACE", "ONLINE", "PHONE"
    
    @Column(name = "is_insurance_covered")
    private Boolean isInsuranceCovered = false;
    
    @Size(max = 100, message = "보험 정보는 100자 이하여야 합니다.")
    @Column(name = "insurance_info", length = 100)
    private String insuranceInfo;
    
    @Column(name = "referral_source")
    private String referralSource; // "SELF", "DOCTOR", "FAMILY", "FRIEND", "OTHER"
    
    @Size(max = 500, message = "추천인 정보는 500자 이하여야 합니다.")
    @Column(name = "referral_details", length = 500)
    private String referralDetails;
    
    // 생성자
    public Client() {
        super();
        setRole("CLIENT");
        setGrade(UserGrade.CLIENT_BRONZE);
        this.riskLevel = "LOW";
        this.consultationPriority = "NORMAL";
        this.totalSessions = 0;
        this.completedSessions = 0;
        this.cancelledSessions = 0;
        this.progressScore = 0;
        this.goalAchievementRate = 0;
        this.isInsuranceCovered = false;
    }
    
    // 비즈니스 메서드
    /**
     * 상담 세션 완료
     */
    public void completeSession() {
        this.completedSessions++;
        this.totalSessions++;
        updateProgressScore();
    }
    
    /**
     * 상담 세션 취소
     */
    public void cancelSession() {
        this.cancelledSessions++;
        this.totalSessions++;
    }
    
    /**
     * 진행도 점수 업데이트
     */
    public void updateProgressScore() {
        if (this.totalSessions > 0) {
            this.progressScore = Math.min(100, (this.completedSessions * 100) / this.totalSessions);
        }
    }
    
    /**
     * 목표 달성률 업데이트
     */
    public void updateGoalAchievementRate(Integer newRate) {
        if (newRate != null && newRate >= 0 && newRate <= 100) {
            this.goalAchievementRate = newRate;
        }
    }
    
    /**
     * 첫 상담일 설정 (한 번만 설정 가능)
     */
    public void setFirstConsultationDate(LocalDate date) {
        if (this.firstConsultationDate == null) {
            this.firstConsultationDate = date;
        }
    }
    
    /**
     * 마지막 상담일 업데이트
     */
    public void updateLastConsultationDate() {
        this.lastConsultationDate = LocalDate.now();
    }
    
    /**
     * 위험도 설정 (유효성 검증 포함)
     */
    public void setRiskLevel(String riskLevel) {
        if (riskLevel != null && (riskLevel.equals("LOW") || riskLevel.equals("MEDIUM") || 
                                 riskLevel.equals("HIGH") || riskLevel.equals("CRITICAL"))) {
            this.riskLevel = riskLevel;
        }
    }
    
    /**
     * 상담 우선순위 설정 (유효성 검증 포함)
     */
    public void setConsultationPriority(String priority) {
        if (priority != null && (priority.equals("LOW") || priority.equals("NORMAL") || 
                                priority.equals("HIGH") || priority.equals("URGENT"))) {
            this.consultationPriority = priority;
        }
    }
    
    // Getter & Setter
    public String getEmergencyContactName() {
        return emergencyContactName;
    }
    
    public void setEmergencyContactName(String emergencyContactName) {
        this.emergencyContactName = emergencyContactName;
    }
    
    public String getEmergencyContactPhone() {
        return emergencyContactPhone;
    }
    
    public void setEmergencyContactPhone(String emergencyContactPhone) {
        this.emergencyContactPhone = emergencyContactPhone;
    }
    
    public String getEmergencyContactRelationship() {
        return emergencyContactRelationship;
    }
    
    public void setEmergencyContactRelationship(String emergencyContactRelationship) {
        this.emergencyContactRelationship = emergencyContactRelationship;
    }
    
    public String getRiskLevel() {
        return riskLevel;
    }
    
    public String getConsultationPriority() {
        return consultationPriority;
    }
    
    public LocalDate getFirstConsultationDate() {
        return firstConsultationDate;
    }
    
    public LocalDate getLastConsultationDate() {
        return lastConsultationDate;
    }
    
    public LocalDate getNextConsultationDate() {
        return nextConsultationDate;
    }
    
    public void setNextConsultationDate(LocalDate nextConsultationDate) {
        this.nextConsultationDate = nextConsultationDate;
    }
    
    public Integer getTotalSessions() {
        return totalSessions;
    }
    
    public Integer getCompletedSessions() {
        return completedSessions;
    }
    
    public Integer getCancelledSessions() {
        return cancelledSessions;
    }
    
    public Integer getProgressScore() {
        return progressScore;
    }
    
    public Integer getGoalAchievementRate() {
        return goalAchievementRate;
    }
    
    public String getConsultationGoals() {
        return consultationGoals;
    }
    
    public void setConsultationGoals(String consultationGoals) {
        this.consultationGoals = consultationGoals;
    }
    
    public String getSpecialConsiderations() {
        return specialConsiderations;
    }
    
    public void setSpecialConsiderations(String specialConsiderations) {
        this.specialConsiderations = specialConsiderations;
    }
    
    public String getMedicalInformation() {
        return medicalInformation;
    }
    
    public void setMedicalInformation(String medicalInformation) {
        this.medicalInformation = medicalInformation;
    }
    
    public String getCurrentMedications() {
        return currentMedications;
    }
    
    public void setCurrentMedications(String currentMedications) {
        this.currentMedications = currentMedications;
    }
    
    public String getAllergies() {
        return allergies;
    }
    
    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }
    
    public String getPreferredConsultationTime() {
        return preferredConsultationTime;
    }
    
    public void setPreferredConsultationTime(String preferredConsultationTime) {
        this.preferredConsultationTime = preferredConsultationTime;
    }
    
    public String getPreferredConsultationMethod() {
        return preferredConsultationMethod;
    }
    
    public void setPreferredConsultationMethod(String preferredConsultationMethod) {
        this.preferredConsultationMethod = preferredConsultationMethod;
    }
    
    public Boolean getIsInsuranceCovered() {
        return isInsuranceCovered;
    }
    
    public void setIsInsuranceCovered(Boolean isInsuranceCovered) {
        this.isInsuranceCovered = isInsuranceCovered;
    }
    
    public String getInsuranceInfo() {
        return insuranceInfo;
    }
    
    public void setInsuranceInfo(String insuranceInfo) {
        this.insuranceInfo = insuranceInfo;
    }
    
    public String getReferralSource() {
        return referralSource;
    }
    
    public void setReferralSource(String referralSource) {
        this.referralSource = referralSource;
    }
    
    public String getReferralDetails() {
        return referralDetails;
    }
    
    public void setReferralDetails(String referralDetails) {
        this.referralDetails = referralDetails;
    }
    
    // toString
    @Override
    public String toString() {
        return "Client{" +
                "id=" + getId() +
                ", name='" + getName() + '\'' +
                ", email='" + getEmail() + '\'' +
                ", grade='" + getGrade() + '\'' +
                ", riskLevel='" + riskLevel + '\'' +
                ", consultationPriority='" + consultationPriority + '\'' +
                ", totalSessions=" + totalSessions +
                ", completedSessions=" + completedSessions +
                ", progressScore=" + progressScore +
                '}';
    }
}
