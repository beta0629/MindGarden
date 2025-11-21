package com.coresolution.consultation.entity;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * 클라이언트 엔티티
 * 상담을 받는 클라이언트 정보를 저장
 * BaseEntity를 상속하여 테넌트 시스템 지원
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-05
 */
@Entity
@Table(name = "clients")
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Client extends BaseEntity {
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "email", nullable = false, unique = true)
    private String email;
    
    @Column(name = "phone")
    private String phone;
    
    @Column(name = "birth_date")
    private LocalDate birthDate;
    
    @Column(name = "gender")
    private String gender; // MALE, FEMALE, OTHER
    
    @Column(name = "address")
    private String address;
    
    @Column(name = "emergency_contact")
    private String emergencyContact;
    
    @Column(name = "emergency_phone")
    private String emergencyPhone;
    
    @Column(name = "medical_history", columnDefinition = "TEXT")
    private String medicalHistory;
    
    @Column(name = "allergies", columnDefinition = "TEXT")
    private String allergies;
    
    @Column(name = "medications", columnDefinition = "TEXT")
    private String medications;
    
    @Column(name = "preferred_language")
    private String preferredLanguage = "ko";
    
    @Column(name = "is_emergency_contact")
    private Boolean isEmergencyContact = false;
    
    /**
     * 지점 코드 (등록 시 사용)
     */
    @Column(name = "branch_code", length = 20)
    private String branchCode;
    
    // 비즈니스 메서드
    // BaseEntity에서 상속받은 softDelete(), restore() 메서드 사용
    
    public void updateEmergencyContact(String emergencyContact, String emergencyPhone) {
        this.emergencyContact = emergencyContact;
        this.emergencyPhone = emergencyPhone;
        this.isEmergencyContact = true;
        // BaseEntity의 setUpdatedAt()과 setVersion() 메서드 사용
        setUpdatedAt(java.time.LocalDateTime.now());
        setVersion(getVersion() + 1);
    }
    
    public int getAge() {
        if (birthDate == null) {
            return 0;
        }
        return LocalDate.now().getYear() - birthDate.getYear();
    }
}