package com.coresolution.core.domain;

import com.coresolution.consultation.entity.BaseEntity;
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

 /**
 * 테넌트 엔티티
 /**
 * 멀티테넌시의 최상위 엔티티로, 각 사업장(입점사)을 나타냄
 /**
 * 
 /**
 * @author CoreSolution
 /**
 * @version 1.0.0
 /**
 * @since 2025-01-XX
 */
@Entity
@Table(name = "tenants", indexes = {
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_business_type", columnList = "business_type"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_tenant_status", columnList = "tenant_id,status"),
    @Index(name = "idx_is_deleted", columnList = "is_deleted")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Tenant extends BaseEntity {
    
     /**
     * 테넌트 상태 열거형
     */
    public enum TenantStatus {
        PENDING("대기중"),
        ACTIVE("활성"),
        SUSPENDED("일시정지"),
        CLOSED("종료");
        
        private final String description;
        
        TenantStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    
     /**
     * 테넌트 UUID (고유 식별자)
     * 표준 형식: tenant-{지역코드}-{업종코드}-{순번} (예: tenant-seoul-consultation-001)
     * 또는 UUID 형식 (레거시 호환)
     */
    @NotBlank(message = "테넌트 ID는 필수입니다")
    @Size(max = 100, message = "테넌트 ID는 100자 이하여야 합니다")
    @Column(name = "tenant_id", nullable = false, unique = true, length = 100, updatable = false)
    private String tenantId;
    
    /**
     * 서브도메인 (와일드카드 도메인용)
     * 예: mycompany.dev.core-solution.co.kr의 "mycompany" 부분
     * 선택적 필드 (온보딩 시 입력받음)
     */
    @Size(max = 100, message = "서브도메인은 100자 이하여야 합니다")
    @Column(name = "subdomain", length = 100, unique = true)
    private String subdomain;
    
     /**
     * 테넌트명
     */
    @NotBlank(message = "테넌트명은 필수입니다")
    @Size(max = 255, message = "테넌트명은 255자 이하여야 합니다")
    @Column(name = "name", nullable = false, length = 255)
    private String name;
    
     /**
     * 업종 타입 (동적으로 business_categories 테이블에서 조회)
     /**
     * business_category_items.business_type과 매핑됨
     */
    @NotBlank(message = "업종 타입은 필수입니다")
    @Size(max = 50, message = "업종 타입은 50자 이하여야 합니다")
    @Column(name = "business_type", nullable = false, length = 50)
    private String businessType;
    
     /**
     * 테넌트 상태
     */
    @NotNull(message = "테넌트 상태는 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
    private TenantStatus status = TenantStatus.PENDING;
    
    
     /**
     * 구독 요금제 ID
     */
    @Column(name = "subscription_plan_id")
    private Long subscriptionPlanId;
    
     /**
     * 구독 상태
     */
    @Column(name = "subscription_status", length = 20)
    @Builder.Default
    private String subscriptionStatus = "INACTIVE";
    
     /**
     * 구독 시작일
     */
    @Column(name = "subscription_start_date")
    private LocalDate subscriptionStartDate;
    
     /**
     * 구독 종료일
     */
    @Column(name = "subscription_end_date")
    private LocalDate subscriptionEndDate;
    
    
     /**
     * 연락 이메일
     */
    @Size(max = 100, message = "이메일은 100자 이하여야 합니다")
    @Column(name = "contact_email", length = 100)
    private String contactEmail;
    
     /**
     * 연락 전화번호
     */
    @Size(max = 20, message = "전화번호는 20자 이하여야 합니다")
    @Column(name = "contact_phone", length = 20)
    private String contactPhone;
    
     /**
     * 담당자명
     */
    @Size(max = 100, message = "담당자명은 100자 이하여야 합니다")
    @Column(name = "contact_person", length = 100)
    private String contactPerson;
    
    
     /**
     * 우편번호
     */
    @Size(max = 10, message = "우편번호는 10자 이하여야 합니다")
    @Column(name = "postal_code", length = 10)
    private String postalCode;
    
     /**
     * 주소
     */
    @Size(max = 255, message = "주소는 255자 이하여야 합니다")
    @Column(name = "address", length = 255)
    private String address;
    
     /**
     * 상세 주소
     */
    @Size(max = 255, message = "상세 주소는 255자 이하여야 합니다")
    @Column(name = "address_detail", length = 255)
    private String addressDetail;
    
    
     /**
     * 테넌트별 설정 (JSON)
     */
    @Column(name = "settings_json", columnDefinition = "JSON")
    private String settingsJson;
    
     /**
     * 브랜딩 정보 (로고, 색상 등, JSON)
     */
    @Column(name = "branding_json", columnDefinition = "JSON")
    private String brandingJson;
    
    
     /**
     * 테넌트 소속 지점들
     /**
     * 주의: Branch 엔티티는 아직 tenant_id 필드가 추가되지 않았을 수 있음
     /**
     * 점진적 마이그레이션을 위해 @OneToMany는 나중에 추가 가능
     */
    
    
     /**
     * 테넌트가 활성 상태인지 확인
     */
    public boolean isActive() {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        return TenantStatus.ACTIVE.equals(this.status);
    }
    
     /**
     * 테넌트가 종료되었는지 확인
     */
    public boolean isClosed() {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        return TenantStatus.CLOSED.equals(this.status);
    }
    
     /**
     * 테넌트가 일시정지 상태인지 확인
     */
    public boolean isSuspended() {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        return TenantStatus.SUSPENDED.equals(this.status);
    }
    
     /**
     * 테넌트 주소 전체
     */
    public String getFullAddress() {
        StringBuilder sb = new StringBuilder();
        if (postalCode != null) {
            sb.append("(").append(postalCode).append(") ");
        }
        if (address != null) {
            sb.append(address);
        }
        if (addressDetail != null) {
            sb.append(" ").append(addressDetail);
        }
        return sb.toString().trim();
    }
}

