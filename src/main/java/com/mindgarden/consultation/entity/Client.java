package com.mindgarden.consultation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 클라이언트 엔티티
 * 상담을 받는 클라이언트 정보를 저장
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Entity
@Table(name = "clients")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Client {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
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
    
    public void updateEmergencyContact(String emergencyContact, String emergencyPhone) {
        this.emergencyContact = emergencyContact;
        this.emergencyPhone = emergencyPhone;
        this.isEmergencyContact = true;
        this.updatedAt = LocalDateTime.now();
        this.version++;
    }
    
    public int getAge() {
        if (birthDate == null) {
            return 0;
        }
        return LocalDate.now().getYear() - birthDate.getYear();
    }
}