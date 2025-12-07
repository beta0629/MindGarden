package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "accounts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Account {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tenant_id", length = 100)
    private String tenantId;
    
    @Column(name = "bank_code", nullable = false, length = 10)
    private String bankCode;
    
    @Column(name = "bank_name", nullable = false, length = 50)
    private String bankName;
    
    @Column(name = "account_number", nullable = false, length = 50)
    private String accountNumber;
    
    @Column(name = "account_holder", nullable = false, length = 100)
    private String accountHolder;
    
    /**
     * @Deprecated - 🚨 레거시 호환: 브랜치 ID 기반 필터링 사용 금지
     * 레거시 데이터 호환을 위해 필드 유지 (NULL 허용)
     * 새로운 코드에서는 사용하지 마세요. 테넌트 ID만 사용하세요.
      * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
  * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
  * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
  * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
 */
    @Column(name = "branch_id")
    private Long branchId;
    
    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "description", length = 500)
    private String description;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
    
    // 은행 코드 상수
    public enum BankCode {
        KB("001", "국민은행"),
        SHINHAN("088", "신한은행"),
        WOORI("020", "우리은행"),
        HANA("081", "하나은행"),
        NH("011", "농협은행"),
        IBK("003", "기업은행"),
        KEB("004", "외환은행"),
        KDB("002", "산업은행"),
        SUHYUP("007", "수협은행"),
        POST("071", "우체국"),
        KAKAO("090", "카카오뱅크"),
        TOSS("092", "토스뱅크");
        
        private final String code;
        private final String name;
        
        BankCode(String code, String name) {
            this.code = code;
            this.name = name;
        }
        
        public String getCode() { return code; }
        public String getName() { return name; }
        
        public static BankCode fromCode(String code) {
            for (BankCode bank : values()) {
                if (bank.code.equals(code)) {
                    return bank;
                }
            }
            throw new IllegalArgumentException("Unknown bank code: " + code);
        }
    }
}
