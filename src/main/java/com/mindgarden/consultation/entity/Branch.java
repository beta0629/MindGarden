package com.mindgarden.consultation.entity;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * 지점 엔티티
 * 프랜차이즈 지점 정보를 관리하는 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */
@Entity
@Table(name = "branches")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Branch extends BaseEntity {
    
    /**
     * 지점 상태 열거형
     */
    public enum BranchStatus {
        PLANNING("계획중"),
        PREPARING("준비중"),
        ACTIVE("운영중"),
        SUSPENDED("일시정지"),
        CLOSED("폐점");
        
        private final String description;
        
        BranchStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 지점 유형 열거형
     */
    public enum BranchType {
        MAIN("본점"),
        FRANCHISE("가맹점"),
        DIRECT("직영점"),
        PARTNER("제휴점");
        
        private final String description;
        
        BranchType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // === 기본 정보 ===
    
    /**
     * 테넌트 ID (Multi-tenant 지원)
     */
    @Column(name = "tenant_id", length = 36)
    private String tenantId;
    
    /**
     * 지점 코드 (고유 식별자)
     */
    @NotBlank(message = "지점 코드는 필수입니다")
    @Size(min = 3, max = 10, message = "지점 코드는 3-10자 사이여야 합니다")
    @Pattern(regexp = "^[A-Z0-9]+$", message = "지점 코드는 영대문자와 숫자만 사용 가능합니다")
    @Column(name = "branch_code", nullable = false, unique = true, length = 10)
    private String branchCode;
    
    /**
     * 지점명
     */
    @NotBlank(message = "지점명은 필수입니다")
    @Size(max = 100, message = "지점명은 100자 이하여야 합니다")
    @Column(name = "branch_name", nullable = false, length = 100)
    private String branchName;
    
    /**
     * 지점 유형
     */
    @NotNull(message = "지점 유형은 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "branch_type", nullable = false, length = 20)
    private BranchType branchType;
    
    /**
     * 지점 상태
     */
    @NotNull(message = "지점 상태는 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "branch_status", nullable = false, length = 20)
    private BranchStatus branchStatus;
    
    // === 주소 정보 ===
    
    /**
     * 우편번호
     */
    @Pattern(regexp = "^\\d{5}$", message = "우편번호는 5자리 숫자여야 합니다")
    @Column(name = "postal_code", length = 5)
    private String postalCode;
    
    /**
     * 주소
     */
    @Size(max = 200, message = "주소는 200자 이하여야 합니다")
    @Column(name = "address", length = 200)
    private String address;
    
    /**
     * 상세 주소
     */
    @Size(max = 100, message = "상세 주소는 100자 이하여야 합니다")
    @Column(name = "address_detail", length = 100)
    private String addressDetail;
    
    // === 연락처 정보 ===
    
    /**
     * 대표 전화번호
     */
    @Pattern(regexp = "^\\d{2,3}-\\d{3,4}-\\d{4}$", message = "올바른 전화번호 형식이 아닙니다")
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;
    
    /**
     * 팩스 번호
     */
    @Pattern(regexp = "^\\d{2,3}-\\d{3,4}-\\d{4}$", message = "올바른 팩스번호 형식이 아닙니다")
    @Column(name = "fax_number", length = 20)
    private String faxNumber;
    
    /**
     * 이메일
     */
    @Email(message = "올바른 이메일 형식이 아닙니다")
    @Size(max = 100, message = "이메일은 100자 이하여야 합니다")
    @Column(name = "email", length = 100)
    private String email;
    
    // === 운영 정보 ===
    
    /**
     * 개설일
     */
    @Column(name = "opening_date")
    private LocalDate openingDate;
    
    /**
     * 폐점일
     */
    @Column(name = "closing_date")
    private LocalDate closingDate;
    
    /**
     * 운영 시작 시간
     */
    @Column(name = "operating_start_time")
    private LocalTime operatingStartTime;
    
    /**
     * 운영 종료 시간
     */
    @Column(name = "operating_end_time")
    private LocalTime operatingEndTime;
    
    /**
     * 휴무일 (JSON 형태로 저장: ["SUNDAY", "MONDAY"])
     */
    @Column(name = "closed_days", columnDefinition = "TEXT")
    private String closedDays;
    
    // === 관리 정보 ===
    
    /**
     * 지점장
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;
    
    /**
     * 상위 지점 (본점의 경우 null)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_branch_id")
    private Branch parentBranch;
    
    /**
     * 하위 지점들
     */
    @OneToMany(mappedBy = "parentBranch", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Branch> subBranches;
    
    // === 설정 정보 ===
    
    /**
     * 최대 상담사 수
     */
    @Column(name = "max_consultants")
    private Integer maxConsultants;
    
    /**
     * 최대 내담자 수
     */
    @Column(name = "max_clients")
    private Integer maxClients;
    
    /**
     * 지점별 설정 (JSON 형태로 저장)
     */
    @Column(name = "branch_settings", columnDefinition = "TEXT")
    private String branchSettings;
    
    /**
     * 지점 설명
     */
    @Size(max = 1000, message = "지점 설명은 1000자 이하여야 합니다")
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * 지점 로고 URL
     */
    @Size(max = 500, message = "로고 URL은 500자 이하여야 합니다")
    @Column(name = "logo_url", length = 500)
    private String logoUrl;
    
    /**
     * 웹사이트 URL
     */
    @Size(max = 200, message = "웹사이트 URL은 200자 이하여야 합니다")
    @Column(name = "website_url", length = 200)
    private String websiteUrl;
    
    // === 연관 관계 ===
    
    /**
     * 지점 소속 상담사들
     */
    @OneToMany(mappedBy = "branch", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<User> consultants;
    
    /**
     * 지점 소속 내담자들
     */
    @OneToMany(mappedBy = "branch", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<User> clients;
    
    // === 비즈니스 메서드 ===
    
    /**
     * 지점이 운영 중인지 확인
     */
    public boolean isActive() {
        return BranchStatus.ACTIVE.equals(this.branchStatus);
    }
    
    /**
     * 지점이 폐점되었는지 확인
     */
    public boolean isClosed() {
        return BranchStatus.CLOSED.equals(this.branchStatus);
    }
    
    /**
     * 본점인지 확인
     */
    public boolean isMainBranch() {
        return BranchType.MAIN.equals(this.branchType);
    }
    
    /**
     * 가맹점인지 확인
     */
    public boolean isFranchise() {
        return BranchType.FRANCHISE.equals(this.branchType);
    }
    
    /**
     * 지점 전체 이름 (상위 지점명 포함)
     */
    public String getFullBranchName() {
        if (parentBranch != null) {
            return parentBranch.getBranchName() + " > " + this.branchName;
        }
        return this.branchName;
    }
    
    /**
     * 지점 주소 전체
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
    
    /**
     * 운영 시간 문자열
     */
    public String getOperatingHours() {
        if (operatingStartTime != null && operatingEndTime != null) {
            return operatingStartTime.toString() + " ~ " + operatingEndTime.toString();
        }
        return null;
    }
}
