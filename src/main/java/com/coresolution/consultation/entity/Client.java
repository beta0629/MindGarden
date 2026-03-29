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
    
    @Column(name = "name", nullable = false, length = 500) // users와 동일: 암호화된 값 복사 정합
    private String name;

    @Column(name = "email", nullable = false, unique = true, length = 500) // users와 동일: 암호화된 값 복사 정합
    private String email;

    @Column(name = "phone", length = 500) // users와 동일: 암호화된 값 복사 정합
    private String phone;
    
    @Column(name = "birth_date")
    private LocalDate birthDate;
    
    @Column(name = "gender", length = 500) // users와 동일: 암호화된 값 복사 정합
    private String gender; // MALE, FEMALE, OTHER

    @Column(name = "address", length = 500) // users와 동일: 암호화된 값 복사 정합
    private String address;

    @Column(name = "address_detail", length = 500)
    private String addressDetail;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    /** 차량번호 (선택, clients 테이블 전용) */
    @Column(name = "vehicle_plate", length = 32)
    private String vehiclePlate;

    @Column(name = "emergency_contact", length = 500) // users와 동일: 암호화된 값 복사 정합
    private String emergencyContact;

    @Column(name = "emergency_phone", length = 500) // users와 동일: 암호화된 값 복사 정합
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
     * @Deprecated - 🚨 레거시 호환: 브랜치 코드 기반 필터링 사용 금지
     * 레거시 데이터 호환을 위해 필드 유지 (NULL 허용)
     * 새로운 코드에서는 사용하지 마세요. 테넌트 ID만 사용하세요.
      * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
  * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
  * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
  * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
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