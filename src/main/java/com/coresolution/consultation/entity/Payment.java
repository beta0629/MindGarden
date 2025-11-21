package com.coresolution.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 결제 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment extends BaseEntity {
    
    /**
     * 결제 고유 ID (외부 결제 시스템에서 제공)
     */
    @Column(name = "payment_id", unique = true, nullable = false)
    private String paymentId;
    
    /**
     * 주문 ID (내부 주문 시스템과 연결)
     */
    @Column(name = "order_id", nullable = false)
    private String orderId;
    
    /**
     * 결제 금액
     */
    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;
    
    /**
     * 결제 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentStatus status;
    
    /**
     * 결제 방법
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "method", nullable = false)
    private PaymentMethod method;
    
    /**
     * 결제 대행사
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false)
    private PaymentProvider provider;
    
    /**
     * 가상계좌번호 (가상계좌 결제 시 사용)
     */
    @Column(name = "virtual_account_number", length = 50)
    private String virtualAccountNumber;
    
    /**
     * 결제자 ID (User 엔티티와 연결)
     */
    @Column(name = "payer_id", nullable = false)
    private Long payerId;
    
    /**
     * 수취인 ID (User 엔티티와 연결)
     */
    @Column(name = "recipient_id")
    private Long recipientId;
    
    /**
     * 지점 ID (Branch 엔티티와 연결)
     */
    @Column(name = "branch_id")
    private Long branchId;
    
    /**
     * 결제 설명
     */
    @Column(name = "description", length = 500)
    private String description;
    
    /**
     * 실패 사유
     */
    @Column(name = "failure_reason", length = 1000)
    private String failureReason;
    
    /**
     * 실패 시간
     */
    @Column(name = "failed_at")
    private LocalDateTime failedAt;
    
    /**
     * 결제 승인 시간
     */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    /**
     * 결제 취소 시간
     */
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
    
    /**
     * 환불 시간
     */
    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;
    
    /**
     * 외부 결제 시스템 응답 데이터 (JSON)
     */
    @Column(name = "external_response", columnDefinition = "TEXT")
    private String externalResponse;
    
    /**
     * Webhook 수신 데이터 (JSON)
     */
    @Column(name = "webhook_data", columnDefinition = "TEXT")
    private String webhookData;
    
    /**
     * 결제 만료 시간
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    /**
     * 결제 상태 열거형
     */
    public enum PaymentStatus {
        PENDING("대기중"),
        PROCESSING("처리중"),
        APPROVED("승인됨"),
        FAILED("실패"),
        CANCELLED("취소됨"),
        REFUNDED("환불됨"),
        EXPIRED("만료됨");
        
        private final String description;
        
        PaymentStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 결제 방법 열거형
     */
    public enum PaymentMethod {
        CARD("카드"),
        BANK_TRANSFER("계좌이체"),
        VIRTUAL_ACCOUNT("가상계좌"),
        MOBILE("모바일결제"),
        CASH("현금");
        
        private final String description;
        
        PaymentMethod(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 결제 대행사 열거형
     */
    public enum PaymentProvider {
        TOSS("토스페이먼츠"),
        IAMPORT("아임포트"),
        KAKAO("카카오페이"),
        NAVER("네이버페이"),
        PAYPAL("페이팔");
        
        private final String description;
        
        PaymentProvider(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}
