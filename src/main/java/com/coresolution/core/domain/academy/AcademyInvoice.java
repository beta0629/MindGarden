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
import java.time.LocalDate;
import java.time.LocalDateTime;

 /**
 * 학원 청구서 엔티티
 /**
 * 학원 시스템의 수강료 청구서 정보를 관리하는 엔티티
 /**
 * 
 /**
 * @author CoreSolution
 /**
 * @version 1.0.0
 /**
 * @since 2025-11-24
 */
@Entity
@Table(name = "academy_invoices", indexes = {
    @Index(name = "idx_invoice_id", columnList = "invoice_id"),
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_branch_id", columnList = "branch_id"),
    @Index(name = "idx_enrollment_id", columnList = "enrollment_id"),
    @Index(name = "idx_consumer_id", columnList = "consumer_id"),
    @Index(name = "idx_billing_schedule_id", columnList = "billing_schedule_id"),
    @Index(name = "idx_invoice_number", columnList = "invoice_number"),
    @Index(name = "idx_invoice_date", columnList = "invoice_date"),
    @Index(name = "idx_due_date", columnList = "due_date"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_tenant_branch", columnList = "tenant_id,branch_id"),
    @Index(name = "idx_is_deleted", columnList = "is_deleted")
})
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AcademyInvoice extends BaseEntity {
    
     /**
     * 청구서 상태 열거형
     */
    public enum InvoiceStatus {
        DRAFT("초안"),
        ISSUED("발행"),
        SENT("발송"),
        PAID("결제완료"),
        PARTIAL("부분결제"),
        OVERDUE("연체"),
        CANCELLED("취소");
        
        private final String description;
        
        InvoiceStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    
     /**
     * 청구서 UUID (고유 식별자)
     */
    @NotBlank(message = "청구서 ID는 필수입니다")
    @Size(max = 36, message = "청구서 ID는 36자 이하여야 합니다")
    @Column(name = "invoice_id", nullable = false, unique = true, length = 36, updatable = false)
    private String invoiceId;
    
     /**
     * 지점 ID
     */
    @NotNull(message = "지점 ID는 필수입니다")
    @Column(name = "branch_id", nullable = false)
    private Long branchId;
    
     /**
     * 청구 대상
     */
    @Size(max = 36, message = "수강 등록 ID는 36자 이하여야 합니다")
    @Column(name = "enrollment_id", length = 36)
    private String enrollmentId;
    
    @Column(name = "consumer_id")
    private Long consumerId;
    
    @Size(max = 36, message = "청구 스케줄 ID는 36자 이하여야 합니다")
    @Column(name = "billing_schedule_id", length = 36)
    private String billingScheduleId;
    
    
     /**
     * 청구서 번호
     */
    @NotBlank(message = "청구서 번호는 필수입니다")
    @Size(max = 50, message = "청구서 번호는 50자 이하여야 합니다")
    @Column(name = "invoice_number", nullable = false, length = 50)
    private String invoiceNumber;
    
     /**
     * 청구일
     */
    @NotNull(message = "청구일은 필수입니다")
    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;
    
     /**
     * 납기일
     */
    @NotNull(message = "납기일은 필수입니다")
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;
    
     /**
     * 청구 기간 시작일
     */
    @Column(name = "billing_period_start")
    private LocalDate billingPeriodStart;
    
     /**
     * 청구 기간 종료일
     */
    @Column(name = "billing_period_end")
    private LocalDate billingPeriodEnd;
    
    
     /**
     * 소계 금액
     */
    @NotNull(message = "소계 금액은 필수입니다")
    @Column(name = "subtotal_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotalAmount;
    
     /**
     * 할인 금액
     */
    @Column(name = "discount_amount", precision = 15, scale = 2)
    private BigDecimal discountAmount;
    
     /**
     * 세금
     */
    @Column(name = "tax_amount", precision = 15, scale = 2)
    private BigDecimal taxAmount;
    
     /**
     * 총 금액
     */
    @NotNull(message = "총 금액은 필수입니다")
    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;
    
     /**
     * 통화
     */
    @Size(max = 10, message = "통화는 10자 이하여야 합니다")
    @Column(name = "currency", length = 10)
    private String currency;
    
    
     /**
     * 청구 항목 상세 (JSON)
     */
    @Column(name = "line_items_json", columnDefinition = "JSON")
    private String lineItemsJson;
    
     /**
     * 비고
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    
     /**
     * 상태
     */
    @NotNull(message = "상태는 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private InvoiceStatus status;
    
     /**
     * 발행 일시
     */
    @Column(name = "issued_at")
    private LocalDateTime issuedAt;
    
     /**
     * 발송 일시
     */
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
    
     /**
     * 결제 완료 일시
     */
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
    
    
     /**
     * 결제 완료 금액
     */
    @Column(name = "paid_amount", precision = 15, scale = 2)
    private BigDecimal paidAmount;
    
     /**
     * 결제 수단
     */
    @Size(max = 50, message = "결제 수단은 50자 이하여야 합니다")
    @Column(name = "payment_method", length = 50)
    private String paymentMethod;
    
    
     /**
     * 결제 완료 여부 확인
     */
    public boolean isPaid() {
        return InvoiceStatus.PAID.equals(status);
    }
    
     /**
     * 연체 여부 확인
     */
    public boolean isOverdue() {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        if (InvoiceStatus.PAID.equals(status) || InvoiceStatus.CANCELLED.equals(status)) {
            return false;
        }
        return LocalDate.now().isAfter(dueDate);
    }
    
     /**
     * 미결제 금액 계산
     */
    public BigDecimal getUnpaidAmount() {
        if (paidAmount == null) {
            return totalAmount;
        }
        return totalAmount.subtract(paidAmount);
    }
}

