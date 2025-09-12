package com.mindgarden.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 반복 지출 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Entity
@Table(name = "recurring_expenses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecurringExpense {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "expense_name", nullable = false, length = 100)
    private String expenseName;
    
    @Column(name = "expense_type", nullable = false, length = 50)
    private String expenseType; // RENT, UTILITY, INSURANCE, SALARY, TAX, ETC
    
    @Column(name = "category", nullable = false, length = 50)
    private String category; // 임대료, 관리비, 보험료, 급여, 세금, 기타
    
    @Column(name = "subcategory", length = 50)
    private String subcategory; // 사무실임대료, 전기요금, 건강보험 등
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;
    
    @Column(name = "recurrence_type", nullable = false, length = 20)
    private String recurrenceType; // MONTHLY, QUARTERLY, YEARLY
    
    @Column(name = "recurrence_day", nullable = false)
    private Integer recurrenceDay; // 매월 몇 일에 처리할지 (1-31)
    
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    
    @Column(name = "end_date")
    private LocalDate endDate; // null이면 무제한 반복
    
    @Column(name = "next_due_date")
    private LocalDate nextDueDate; // 다음 처리 예정일
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "auto_process", nullable = false)
    @Builder.Default
    private Boolean autoProcess = true; // 자동 처리 여부
    
    @Column(name = "notification_days_before", nullable = false)
    @Builder.Default
    private Integer notificationDaysBefore = 3; // 처리 전 알림 일수
    
    @Column(name = "last_processed_date")
    private LocalDate lastProcessedDate; // 마지막 처리일
    
    @Column(name = "total_processed_count")
    @Builder.Default
    private Integer totalProcessedCount = 0; // 총 처리 횟수
    
    @Column(name = "supplier_name", length = 100)
    private String supplierName; // 공급업체명
    
    @Column(name = "supplier_contact", length = 200)
    private String supplierContact; // 공급업체 연락처
    
    @Column(name = "payment_method", length = 50)
    private String paymentMethod; // CARD, BANK_TRANSFER, CASH, AUTO_TRANSFER
    
    @Column(name = "account_number", length = 50)
    private String accountNumber; // 자동이체 계좌번호
    
    @Column(name = "is_vat_applicable", nullable = false)
    @Builder.Default
    private Boolean isVatApplicable = true; // 부가세 적용 여부
    
    @Column(name = "created_at", nullable = false)
    private LocalDate createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDate.now();
        updatedAt = LocalDateTime.now();
        if (nextDueDate == null) {
            nextDueDate = calculateNextDueDate(startDate, recurrenceDay);
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * 다음 처리 예정일 계산
     */
    private LocalDate calculateNextDueDate(LocalDate baseDate, Integer dayOfMonth) {
        LocalDate nextDate = baseDate.withDayOfMonth(Math.min(dayOfMonth, baseDate.lengthOfMonth()));
        
        // 이미 지난 날짜면 다음 달로 설정
        if (nextDate.isBefore(LocalDate.now())) {
            nextDate = nextDate.plusMonths(1);
            nextDate = nextDate.withDayOfMonth(Math.min(dayOfMonth, nextDate.lengthOfMonth()));
        }
        
        return nextDate;
    }
    
    /**
     * 지출 유형 열거형
     */
    public enum ExpenseType {
        RENT("임대료"),
        UTILITY("관리비"),
        INSURANCE("보험료"),
        SALARY("급여"),
        TAX("세금"),
        INTEREST("이자비용"),
        MAINTENANCE("유지보수비"),
        SUBSCRIPTION("구독료"),
        ETC("기타");
        
        private final String description;
        
        ExpenseType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 반복 유형 열거형
     */
    public enum RecurrenceType {
        MONTHLY("월간"),
        QUARTERLY("분기간"),
        YEARLY("연간");
        
        private final String description;
        
        RecurrenceType(String description) {
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
        CARD("카드결제"),
        BANK_TRANSFER("계좌이체"),
        CASH("현금"),
        AUTO_TRANSFER("자동이체"),
        CHECK("수표");
        
        private final String description;
        
        PaymentMethod(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}
