package com.coresolution.core.domain.academy;

import com.coresolution.consultation.entity.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

 * 학원 수강료 결제 엔티티
 * 학원 시스템의 수강료 결제 내역을 관리하는 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Entity
@Table(name = "academy_tuition_payments", indexes = {
    @Index(name = "idx_payment_id", columnList = "payment_id"),
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_branch_id", columnList = "branch_id"),
    @Index(name = "idx_invoice_id", columnList = "invoice_id"),
    @Index(name = "idx_enrollment_id", columnList = "enrollment_id"),
    @Index(name = "idx_consumer_id", columnList = "consumer_id"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_paid_at", columnList = "paid_at"),
    @Index(name = "idx_tenant_branch", columnList = "tenant_id,branch_id"),
    @Index(name = "idx_is_deleted", columnList = "is_deleted")
})
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AcademyTuitionPayment extends BaseEntity {
    
     * 결제 상태 열거형
     */
    public enum PaymentStatus {
        PENDING("대기중"),
        COMPLETED("완료"),
        FAILED("실패"),
        REFUNDED("환불"),
        CANCELLED("취소");
        
        private final String description;
        
        PaymentStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
     * 결제 수단 열거형
     */
    public enum PaymentMethod {
        CARD("카드"),
        BANK_TRANSFER("계좌이체"),
        CASH("현금"),
        ETC("기타");
        
        private final String description;
        
        PaymentMethod(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    
     * 결제 UUID (고유 식별자)
     */
    @NotBlank(message = "결제 ID는 필수입니다")
    @Size(max = 36, message = "결제 ID는 36자 이하여야 합니다")
    @Column(name = "payment_id", nullable = false, unique = true, length = 36, updatable = false)
    private String paymentId;
    
     * 지점 ID
     */
    @NotNull(message = "지점 ID는 필수입니다")
    @Column(name = "branch_id", nullable = false)
    private Long branchId;
    
    
     * 청구서 ID
     */
    @NotBlank(message = "청구서 ID는 필수입니다")
    @Size(max = 36, message = "청구서 ID는 36자 이하여야 합니다")
    @Column(name = "invoice_id", nullable = false, length = 36)
    private String invoiceId;
    
     * 수강 등록 ID
     */
    @Size(max = 36, message = "수강 등록 ID는 36자 이하여야 합니다")
    @Column(name = "enrollment_id", length = 36)
    private String enrollmentId;
    
     * 수강생 ID
     */
    @Column(name = "consumer_id")
    private Long consumerId;
    
    
     * 결제 금액
     */
    @NotNull(message = "결제 금액은 필수입니다")
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
    
     * 통화
     */
    @Size(max = 10, message = "통화는 10자 이하여야 합니다")
    @Column(name = "currency", length = 10)
    private String currency;
    
     * 결제 수단
     */
    @NotNull(message = "결제 수단은 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 50)
    private PaymentMethod paymentMethod;
    
    
     * PG 제공자
     */
    @Size(max = 50, message = "PG 제공자는 50자 이하여야 합니다")
    @Column(name = "pg_provider", length = 50)
    private String pgProvider;
    
     * PG 거래 ID
     */
    @Size(max = 100, message = "PG 거래 ID는 100자 이하여야 합니다")
    @Column(name = "pg_transaction_id", length = 100)
    private String pgTransactionId;
    
     * PG 상태
     */
    @Size(max = 50, message = "PG 상태는 50자 이하여야 합니다")
    @Column(name = "pg_status", length = 50)
    private String pgStatus;
    
    
     * 상태
     */
    @NotNull(message = "상태는 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PaymentStatus status;
    
     * 결제 완료 일시
     */
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
    
     * 결제 실패 일시
     */
    @Column(name = "failed_at")
    private LocalDateTime failedAt;
    
     * 실패 사유
     */
    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;
    
    
     * 환불 금액
     */
    @Column(name = "refund_amount", precision = 15, scale = 2)
    private BigDecimal refundAmount;
    
     * 환불 일시
     */
    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;
    
     * 환불 사유
     */
    @Column(name = "refund_reason", columnDefinition = "TEXT")
    private String refundReason;
    
    
     * 영수증 번호
     */
    @Size(max = 50, message = "영수증 번호는 50자 이하여야 합니다")
    @Column(name = "receipt_number", length = 50)
    private String receiptNumber;
    
     * 영수증 발급 일시
     */
    @Column(name = "receipt_issued_at")
    private LocalDateTime receiptIssuedAt;
    
    
     * 비고
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    
     * 결제 완료 여부 확인
     */
    public boolean isCompleted() {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        return PaymentStatus.COMPLETED.equals(status);
    }
    
     * 환불 여부 확인
     */
    public boolean isRefunded() {
        return PaymentStatus.REFUNDED.equals(status);
    }
    
     * 영수증 발급 여부 확인
     */
    public boolean isReceiptIssued() {
        return receiptNumber != null && receiptIssuedAt != null;
    }
}

