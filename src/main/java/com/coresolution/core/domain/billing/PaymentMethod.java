package com.coresolution.core.domain.billing;

import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * 결제 수단 엔티티
 * PG 토큰화 기반 결제 수단 저장 (PCI DSS 준수)
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "ops_payment_method")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class PaymentMethod extends BaseEntity {
    
    /**
     * 결제 수단 UUID (고유 식별자)
     */
    @Column(name = "payment_method_id", length = 36, unique = true, nullable = false)
    private String paymentMethodId;
    
    /**
     * 테넌트 ID (온보딩 중이면 NULL)
     */
    @Column(name = "tenant_id", length = 36)
    private String tenantId;
    
    /**
     * PG에서 받은 토큰 (암호화 저장)
     */
    @Column(name = "payment_method_token", columnDefinition = "TEXT", nullable = false)
    private String paymentMethodToken;
    
    /**
     * PG 제공자
     */
    @Column(name = "pg_provider", length = 50, nullable = false)
    private String pgProvider;
    
    /**
     * 카드 브랜드
     */
    @Column(name = "card_brand", length = 50)
    private String cardBrand;
    
    /**
     * 카드 마지막 4자리
     */
    @Column(name = "card_last4", length = 4)
    private String cardLast4;
    
    /**
     * 만료 월
     */
    @Column(name = "card_exp_month")
    private Integer cardExpMonth;
    
    /**
     * 만료 년도
     */
    @Column(name = "card_exp_year")
    private Integer cardExpYear;
    
    /**
     * 카드 소유자 이름
     */
    @Column(name = "cardholder_name", length = 100)
    private String cardholderName;
    
    /**
     * 기본 결제 수단 여부
     */
    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;
    
    /**
     * 활성화 여부
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}

