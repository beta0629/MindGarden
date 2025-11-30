package com.coresolution.core.service.academy.impl;
import com.coresolution.core.context.TenantContextHolder;

import com.coresolution.core.domain.academy.*;
import com.coresolution.core.dto.academy.*;
import com.coresolution.core.repository.academy.*;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.academy.AcademyBillingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 학원 청구 서비스 구현체
 * 학원 시스템의 수강료 청구 및 결제 관리 비즈니스 로직 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AcademyBillingServiceImpl implements AcademyBillingService {
    
    private final AcademyBillingScheduleRepository billingScheduleRepository;
    private final AcademyInvoiceRepository invoiceRepository;
    private final AcademyTuitionPaymentRepository paymentRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final TenantAccessControlService accessControlService;
    
    // ==================== 청구 스케줄 관리 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<BillingScheduleResponse> getBillingSchedules(String tenantId, Long branchId) {
        accessControlService.validateTenantAccess(tenantId);
        
        List<AcademyBillingSchedule> schedules;
        if (branchId != null) {
            schedules = billingScheduleRepository.findByTenantIdAndBranchIdAndIsDeletedFalse(tenantId, branchId);
        } else {
            schedules = billingScheduleRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        }
        
        return schedules.stream()
            .map(this::toBillingScheduleResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public BillingScheduleResponse getBillingSchedule(String tenantId, String billingScheduleId) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademyBillingSchedule schedule = billingScheduleRepository.findByBillingScheduleIdAndIsDeletedFalse(billingScheduleId)
            .orElseThrow(() -> new RuntimeException("청구 스케줄을 찾을 수 없습니다: " + billingScheduleId));
        
        if (!tenantId.equals(schedule.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        return toBillingScheduleResponse(schedule);
    }
    
    @Override
    public BillingScheduleResponse createBillingSchedule(String tenantId, BillingScheduleRequest request, String createdBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademyBillingSchedule schedule = AcademyBillingSchedule.builder()
            .billingScheduleId(UUID.randomUUID().toString())
            .branchId(request.getBranchId())
            .name(request.getName())
            .description(request.getDescription())
            .billingCycle(request.getBillingCycle())
            .dayOfMonth(request.getDayOfMonth())
            .dayOfWeek(request.getDayOfWeek())
            .billingDateOffset(request.getBillingDateOffset() != null ? request.getBillingDateOffset() : 0)
            .targetFiltersJson(request.getTargetFiltersJson())
            .billingMethod(request.getBillingMethod())
            .fixedAmount(request.getFixedAmount())
            .calculationRuleJson(request.getCalculationRuleJson())
            .isActive(request.getIsActive() != null ? request.getIsActive() : true)
            .build();
        
        schedule.setTenantId(tenantId);
        schedule.setIsDeleted(false);
        
        // 다음 청구일 계산
        schedule.setNextBillingDate(calculateNextBillingDate(schedule));
        
        AcademyBillingSchedule saved = billingScheduleRepository.save(schedule);
        log.info("청구 스케줄 생성 완료: billingScheduleId={}, name={}", saved.getBillingScheduleId(), saved.getName());
        
        return toBillingScheduleResponse(saved);
    }
    
    @Override
    public BillingScheduleResponse updateBillingSchedule(String tenantId, String billingScheduleId, BillingScheduleRequest request, String updatedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademyBillingSchedule schedule = billingScheduleRepository.findByBillingScheduleIdAndIsDeletedFalse(billingScheduleId)
            .orElseThrow(() -> new RuntimeException("청구 스케줄을 찾을 수 없습니다: " + billingScheduleId));
        
        if (!tenantId.equals(schedule.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        schedule.setBranchId(request.getBranchId());
        schedule.setName(request.getName());
        schedule.setDescription(request.getDescription());
        schedule.setBillingCycle(request.getBillingCycle());
        schedule.setDayOfMonth(request.getDayOfMonth());
        schedule.setDayOfWeek(request.getDayOfWeek());
        if (request.getBillingDateOffset() != null) {
            schedule.setBillingDateOffset(request.getBillingDateOffset());
        }
        schedule.setTargetFiltersJson(request.getTargetFiltersJson());
        schedule.setBillingMethod(request.getBillingMethod());
        schedule.setFixedAmount(request.getFixedAmount());
        schedule.setCalculationRuleJson(request.getCalculationRuleJson());
        if (request.getIsActive() != null) {
            schedule.setIsActive(request.getIsActive());
        }
        schedule.setUpdatedBy(updatedBy);
        schedule.setUpdatedAt(LocalDateTime.now());
        
        // 다음 청구일 재계산
        schedule.setNextBillingDate(calculateNextBillingDate(schedule));
        
        AcademyBillingSchedule saved = billingScheduleRepository.save(schedule);
        log.info("청구 스케줄 수정 완료: billingScheduleId={}", saved.getBillingScheduleId());
        
        return toBillingScheduleResponse(saved);
    }
    
    @Override
    public void deleteBillingSchedule(String tenantId, String billingScheduleId, String deletedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademyBillingSchedule schedule = billingScheduleRepository.findByBillingScheduleIdAndIsDeletedFalse(billingScheduleId)
            .orElseThrow(() -> new RuntimeException("청구 스케줄을 찾을 수 없습니다: " + billingScheduleId));
        
        if (!tenantId.equals(schedule.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        schedule.setIsDeleted(true);
        schedule.setDeletedAt(LocalDateTime.now());
        schedule.setUpdatedBy(deletedBy);
        schedule.setUpdatedAt(LocalDateTime.now());
        
        billingScheduleRepository.save(schedule);
        log.info("청구 스케줄 삭제 완료: billingScheduleId={}", billingScheduleId);
    }
    
    @Override
    public List<InvoiceResponse> executeBillingSchedule(String tenantId, String billingScheduleId, String executedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademyBillingSchedule schedule = billingScheduleRepository.findByBillingScheduleIdAndIsDeletedFalse(billingScheduleId)
            .orElseThrow(() -> new RuntimeException("청구 스케줄을 찾을 수 없습니다: " + billingScheduleId));
        
        if (!tenantId.equals(schedule.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        if (!schedule.isActiveSchedule()) {
            throw new RuntimeException("비활성화된 청구 스케줄은 실행할 수 없습니다.");
        }
        
        log.info("청구 스케줄 실행 시작: billingScheduleId={}, name={}", schedule.getBillingScheduleId(), schedule.getName());
        
        // 청구 대상 수강 등록 조회
        List<ClassEnrollment> enrollments = findTargetEnrollments(tenantId, schedule);
        
        List<InvoiceResponse> generatedInvoices = new java.util.ArrayList<>();
        LocalDate billingDate = LocalDate.now();
        
        for (ClassEnrollment enrollment : enrollments) {
            try {
                // 청구 금액 계산
                BigDecimal billingAmount = calculateBillingAmount(enrollment, schedule);
                
                if (billingAmount.compareTo(BigDecimal.ZERO) <= 0) {
                    log.debug("청구 금액이 0원 이하이므로 청구서 생성 건너뜀: enrollmentId={}", enrollment.getEnrollmentId());
                    continue;
                }
                
                // 청구서 생성
                InvoiceRequest invoiceRequest = InvoiceRequest.builder()
                    .branchId(enrollment.getBranchId())
                    .enrollmentId(enrollment.getEnrollmentId())
                    .consumerId(enrollment.getConsumerId())
                    .billingScheduleId(billingScheduleId)
                    .invoiceNumber(null) // 자동 생성
                    .invoiceDate(billingDate)
                    .dueDate(billingDate.plusDays(7)) // 기본 7일 후 납기
                    .billingPeriodStart(enrollment.getStartDate())
                    .billingPeriodEnd(enrollment.getEndDate())
                    .subtotalAmount(billingAmount)
                    .discountAmount(BigDecimal.ZERO)
                    .taxAmount(BigDecimal.ZERO)
                    .totalAmount(billingAmount)
                    .currency("KRW")
                    .build();
                
                InvoiceResponse invoice = createInvoice(tenantId, invoiceRequest, executedBy);
                generatedInvoices.add(invoice);
                
            } catch (Exception e) {
                log.error("청구서 생성 실패: enrollmentId={}", enrollment.getEnrollmentId(), e);
            }
        }
        
        log.info("청구 스케줄 실행 완료: billingScheduleId={}, generatedInvoices={}", 
            schedule.getBillingScheduleId(), generatedInvoices.size());
        
        return generatedInvoices;
    }
    
    // ==================== 청구서 관리 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoices(String tenantId, Long branchId, String enrollmentId, Long consumerId, InvoiceResponse.InvoiceStatus status) {
        accessControlService.validateTenantAccess(tenantId);
        
        List<AcademyInvoice> invoices;
        
        if (enrollmentId != null) {
            invoices = invoiceRepository.findByTenantIdAndEnrollmentIdAndIsDeletedFalse(tenantId, enrollmentId);
        } else if (consumerId != null) {
            invoices = invoiceRepository.findByTenantIdAndConsumerIdAndIsDeletedFalse(tenantId, consumerId);
        } else if (branchId != null) {
            invoices = invoiceRepository.findByTenantIdAndBranchIdAndIsDeletedFalse(tenantId, branchId);
        } else {
            invoices = invoiceRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        }
        
        // 상태 필터링
        if (status != null) {
            invoices = invoices.stream()
                .filter(i -> convertInvoiceStatus(i.getStatus()) == status)
                .collect(Collectors.toList());
        }
        
        return invoices.stream()
            .map(this::toInvoiceResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(String tenantId, String invoiceId) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademyInvoice invoice = invoiceRepository.findByInvoiceIdAndIsDeletedFalse(invoiceId)
            .orElseThrow(() -> new RuntimeException("청구서를 찾을 수 없습니다: " + invoiceId));
        
        if (!tenantId.equals(invoice.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        return toInvoiceResponse(invoice);
    }
    
    @Override
    public InvoiceResponse createInvoice(String tenantId, InvoiceRequest request, String createdBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        // 청구서 번호 중복 체크
        if (request.getInvoiceNumber() != null && !request.getInvoiceNumber().isEmpty()) {
            Optional<AcademyInvoice> existing = invoiceRepository.findByTenantIdAndInvoiceNumberAndIsDeletedFalse(
                tenantId, request.getInvoiceNumber());
            if (existing.isPresent()) {
                throw new RuntimeException("이미 존재하는 청구서 번호입니다: " + request.getInvoiceNumber());
            }
        }
        
        // 수강 등록 정보 확인
        if (request.getEnrollmentId() != null && !request.getEnrollmentId().isEmpty()) {
            ClassEnrollment enrollment = enrollmentRepository.findByEnrollmentIdAndIsDeletedFalse(request.getEnrollmentId())
                .orElseThrow(() -> new RuntimeException("수강 등록을 찾을 수 없습니다: " + request.getEnrollmentId()));
            
            if (!tenantId.equals(enrollment.getTenantId())) {
                throw new RuntimeException("접근 권한이 없습니다.");
            }
        }
        
        // 청구서 번호 자동 생성 (없는 경우)
        String invoiceNumber = request.getInvoiceNumber();
        if (invoiceNumber == null || invoiceNumber.isEmpty()) {
            invoiceNumber = generateInvoiceNumber(tenantId, request.getBranchId());
        }
        
        AcademyInvoice invoice = AcademyInvoice.builder()
            .invoiceId(UUID.randomUUID().toString())
            .branchId(request.getBranchId())
            .enrollmentId(request.getEnrollmentId())
            .consumerId(request.getConsumerId())
            .billingScheduleId(request.getBillingScheduleId())
            .invoiceNumber(invoiceNumber)
            .invoiceDate(request.getInvoiceDate())
            .dueDate(request.getDueDate())
            .billingPeriodStart(request.getBillingPeriodStart())
            .billingPeriodEnd(request.getBillingPeriodEnd())
            .subtotalAmount(request.getSubtotalAmount())
            .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
            .taxAmount(request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO)
            .totalAmount(request.getTotalAmount())
            .currency(request.getCurrency() != null ? request.getCurrency() : "KRW")
            .lineItemsJson(request.getLineItemsJson())
            .notes(request.getNotes())
            .status(AcademyInvoice.InvoiceStatus.DRAFT)
            .paidAmount(BigDecimal.ZERO)
            .build();
        
        invoice.setTenantId(tenantId);
        invoice.setIsDeleted(false);
        
        AcademyInvoice saved = invoiceRepository.save(invoice);
        log.info("청구서 생성 완료: invoiceId={}, invoiceNumber={}", saved.getInvoiceId(), saved.getInvoiceNumber());
        
        return toInvoiceResponse(saved);
    }
    
    @Override
    public InvoiceResponse issueInvoice(String tenantId, String invoiceId, String issuedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademyInvoice invoice = invoiceRepository.findByInvoiceIdAndIsDeletedFalse(invoiceId)
            .orElseThrow(() -> new RuntimeException("청구서를 찾을 수 없습니다: " + invoiceId));
        
        if (!tenantId.equals(invoice.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        if (invoice.getStatus() != AcademyInvoice.InvoiceStatus.DRAFT) {
            throw new RuntimeException("초안 상태의 청구서만 발행할 수 있습니다.");
        }
        
        invoice.setStatus(AcademyInvoice.InvoiceStatus.ISSUED);
        invoice.setIssuedAt(LocalDateTime.now());
        invoice.setUpdatedAt(LocalDateTime.now());
        
        AcademyInvoice saved = invoiceRepository.save(invoice);
        log.info("청구서 발행 완료: invoiceId={}", saved.getInvoiceId());
        
        return toInvoiceResponse(saved);
    }
    
    @Override
    public InvoiceResponse sendInvoice(String tenantId, String invoiceId, String sentBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademyInvoice invoice = invoiceRepository.findByInvoiceIdAndIsDeletedFalse(invoiceId)
            .orElseThrow(() -> new RuntimeException("청구서를 찾을 수 없습니다: " + invoiceId));
        
        if (!tenantId.equals(invoice.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        if (invoice.getStatus() != AcademyInvoice.InvoiceStatus.ISSUED && 
            invoice.getStatus() != AcademyInvoice.InvoiceStatus.DRAFT) {
            throw new RuntimeException("발행 또는 초안 상태의 청구서만 발송할 수 있습니다.");
        }
        
        invoice.setStatus(AcademyInvoice.InvoiceStatus.SENT);
        invoice.setSentAt(LocalDateTime.now());
        invoice.setUpdatedAt(LocalDateTime.now());
        
        // TODO: 학부모에게 알림 발송
        
        AcademyInvoice saved = invoiceRepository.save(invoice);
        log.info("청구서 발송 완료: invoiceId={}", saved.getInvoiceId());
        
        return toInvoiceResponse(saved);
    }
    
    @Override
    public InvoiceResponse cancelInvoice(String tenantId, String invoiceId, String cancelledBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademyInvoice invoice = invoiceRepository.findByInvoiceIdAndIsDeletedFalse(invoiceId)
            .orElseThrow(() -> new RuntimeException("청구서를 찾을 수 없습니다: " + invoiceId));
        
        if (!tenantId.equals(invoice.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        if (invoice.getStatus() == AcademyInvoice.InvoiceStatus.PAID) {
            throw new RuntimeException("이미 결제 완료된 청구서는 취소할 수 없습니다.");
        }
        
        invoice.setStatus(AcademyInvoice.InvoiceStatus.CANCELLED);
        invoice.setUpdatedAt(LocalDateTime.now());
        
        AcademyInvoice saved = invoiceRepository.save(invoice);
        log.info("청구서 취소 완료: invoiceId={}", saved.getInvoiceId());
        
        return toInvoiceResponse(saved);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getOverdueInvoices(String tenantId, Long branchId) {
        accessControlService.validateTenantAccess(tenantId);
        
        List<AcademyInvoice> invoices = invoiceRepository.findOverdueInvoices(tenantId, LocalDate.now());
        
        // 지점 필터링
        if (branchId != null) {
            invoices = invoices.stream()
                .filter(i -> branchId.equals(i.getBranchId()))
                .collect(Collectors.toList());
        }
        
        return invoices.stream()
            .map(this::toInvoiceResponse)
            .collect(Collectors.toList());
    }
    
    // ==================== 결제 관리 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<TuitionPaymentResponse> getPayments(String tenantId, Long branchId, String invoiceId, String enrollmentId, Long consumerId) {
        accessControlService.validateTenantAccess(tenantId);
        
        List<AcademyTuitionPayment> payments;
        
        if (invoiceId != null && !invoiceId.isEmpty()) {
            payments = paymentRepository.findByTenantIdAndInvoiceIdAndIsDeletedFalse(tenantId, invoiceId);
        } else if (enrollmentId != null && !enrollmentId.isEmpty()) {
            payments = paymentRepository.findByTenantIdAndEnrollmentIdAndIsDeletedFalse(tenantId, enrollmentId);
        } else if (consumerId != null) {
            payments = paymentRepository.findByTenantIdAndConsumerIdAndIsDeletedFalse(tenantId, consumerId);
        } else if (branchId != null) {
            payments = paymentRepository.findByTenantIdAndBranchIdAndIsDeletedFalse(tenantId, branchId);
        } else {
            payments = paymentRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        }
        
        return payments.stream()
            .map(this::toTuitionPaymentResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public TuitionPaymentResponse getPayment(String tenantId, String paymentId) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademyTuitionPayment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId)
            .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다: " + paymentId));
        
        if (!tenantId.equals(payment.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        return toTuitionPaymentResponse(payment);
    }
    
    @Override
    public TuitionPaymentResponse createPayment(String tenantId, TuitionPaymentRequest request, String createdBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        // 청구서 확인
        AcademyInvoice invoice = invoiceRepository.findByInvoiceIdAndIsDeletedFalse(request.getInvoiceId())
            .orElseThrow(() -> new RuntimeException("청구서를 찾을 수 없습니다: " + request.getInvoiceId()));
        
        if (!tenantId.equals(invoice.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        // 결제 금액 검증
        if (request.getAmount().compareTo(invoice.getTotalAmount().subtract(invoice.getPaidAmount() != null ? invoice.getPaidAmount() : BigDecimal.ZERO)) > 0) {
            throw new RuntimeException("결제 금액이 청구서 미결제 금액을 초과할 수 없습니다.");
        }
        
        AcademyTuitionPayment payment = AcademyTuitionPayment.builder()
            .paymentId(UUID.randomUUID().toString())
            .branchId(request.getBranchId())
            .invoiceId(request.getInvoiceId())
            .enrollmentId(request.getEnrollmentId())
            .consumerId(request.getConsumerId())
            .amount(request.getAmount())
            .currency(request.getCurrency() != null ? request.getCurrency() : "KRW")
            .paymentMethod(request.getPaymentMethod())
            .pgProvider(request.getPgProvider())
            .pgTransactionId(request.getPgTransactionId())
            .pgStatus(request.getPgStatus())
            .status(AcademyTuitionPayment.PaymentStatus.PENDING)
            .refundAmount(BigDecimal.ZERO)
            .notes(request.getNotes())
            .build();
        
        payment.setTenantId(tenantId);
        payment.setIsDeleted(false);
        
        AcademyTuitionPayment saved = paymentRepository.save(payment);
        log.info("결제 생성 완료: paymentId={}, invoiceId={}, amount={}", 
            saved.getPaymentId(), saved.getInvoiceId(), saved.getAmount());
        
        return toTuitionPaymentResponse(saved);
    }
    
    @Override
    public TuitionPaymentResponse completePayment(String tenantId, String paymentId, String completedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademyTuitionPayment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId)
            .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다: " + paymentId));
        
        if (!tenantId.equals(payment.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        if (payment.getStatus() != AcademyTuitionPayment.PaymentStatus.PENDING) {
            throw new RuntimeException("대기 중인 결제만 완료 처리할 수 있습니다.");
        }
        
        payment.setStatus(AcademyTuitionPayment.PaymentStatus.COMPLETED);
        payment.setPaidAt(LocalDateTime.now());
        payment.setUpdatedAt(LocalDateTime.now());
        
        AcademyTuitionPayment saved = paymentRepository.save(payment);
        
        // 청구서 결제 상태 업데이트
        updateInvoicePaymentStatus(payment.getInvoiceId());
        
        log.info("결제 완료 처리 완료: paymentId={}", saved.getPaymentId());
        
        return toTuitionPaymentResponse(saved);
    }
    
    @Override
    public TuitionPaymentResponse cancelPayment(String tenantId, String paymentId, String cancelledBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademyTuitionPayment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId)
            .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다: " + paymentId));
        
        if (!tenantId.equals(payment.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        if (payment.getStatus() == AcademyTuitionPayment.PaymentStatus.COMPLETED) {
            throw new RuntimeException("이미 완료된 결제는 취소할 수 없습니다. 환불을 사용하세요.");
        }
        
        payment.setStatus(AcademyTuitionPayment.PaymentStatus.CANCELLED);
        payment.setUpdatedAt(LocalDateTime.now());
        
        AcademyTuitionPayment saved = paymentRepository.save(payment);
        log.info("결제 취소 완료: paymentId={}", saved.getPaymentId());
        
        return toTuitionPaymentResponse(saved);
    }
    
    @Override
    public TuitionPaymentResponse refundPayment(String tenantId, String paymentId, RefundRequest request, String refundedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademyTuitionPayment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId)
            .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다: " + paymentId));
        
        if (!tenantId.equals(payment.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        if (payment.getStatus() != AcademyTuitionPayment.PaymentStatus.COMPLETED) {
            throw new RuntimeException("완료된 결제만 환불할 수 있습니다.");
        }
        
        if (request.getRefundAmount().compareTo(payment.getAmount().subtract(payment.getRefundAmount() != null ? payment.getRefundAmount() : BigDecimal.ZERO)) > 0) {
            throw new RuntimeException("환불 금액이 환불 가능 금액을 초과할 수 없습니다.");
        }
        
        payment.setStatus(AcademyTuitionPayment.PaymentStatus.REFUNDED);
        payment.setRefundAmount(request.getRefundAmount());
        payment.setRefundedAt(LocalDateTime.now());
        payment.setRefundReason(request.getRefundReason());
        payment.setUpdatedAt(LocalDateTime.now());
        
        AcademyTuitionPayment saved = paymentRepository.save(payment);
        
        // 청구서 결제 상태 업데이트
        updateInvoicePaymentStatus(payment.getInvoiceId());
        
        log.info("환불 처리 완료: paymentId={}, refundAmount={}", saved.getPaymentId(), saved.getRefundAmount());
        
        return toTuitionPaymentResponse(saved);
    }
    
    @Override
    public TuitionPaymentResponse issueReceipt(String tenantId, String paymentId, String issuedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademyTuitionPayment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId)
            .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다: " + paymentId));
        
        if (!tenantId.equals(payment.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        if (payment.getStatus() != AcademyTuitionPayment.PaymentStatus.COMPLETED) {
            throw new RuntimeException("완료된 결제만 영수증을 발급할 수 있습니다.");
        }
        
        // 영수증 번호 생성
        String receiptNumber = generateReceiptNumber(tenantId, payment.getBranchId());
        
        payment.setReceiptNumber(receiptNumber);
        payment.setReceiptIssuedAt(LocalDateTime.now());
        payment.setUpdatedAt(LocalDateTime.now());
        
        AcademyTuitionPayment saved = paymentRepository.save(payment);
        log.info("영수증 발급 완료: paymentId={}, receiptNumber={}", saved.getPaymentId(), saved.getReceiptNumber());
        
        return toTuitionPaymentResponse(saved);
    }
    
    // ==================== 배치 작업 ====================
    
    @Override
    public int generateMonthlyInvoices(String tenantId, LocalDate billingDate) {
        accessControlService.validateTenantAccess(tenantId);
        
        log.info("월별 청구서 자동 생성 시작: tenantId={}, billingDate={}", tenantId, billingDate);
        
        // 청구 예정인 스케줄 조회
        List<AcademyBillingSchedule> schedules = billingScheduleRepository.findSchedulesDueForBilling(tenantId, billingDate);
        
        int totalGenerated = 0;
        
        for (AcademyBillingSchedule schedule : schedules) {
            try {
                List<InvoiceResponse> invoices = executeBillingSchedule(tenantId, schedule.getBillingScheduleId(), "SYSTEM");
                totalGenerated += invoices.size();
                
                // 다음 청구일 업데이트
                schedule.setLastBillingDate(billingDate);
                schedule.setNextBillingDate(calculateNextBillingDate(schedule));
                billingScheduleRepository.save(schedule);
                
                log.info("청구 스케줄 실행 완료: billingScheduleId={}, generatedInvoices={}", 
                    schedule.getBillingScheduleId(), invoices.size());
            } catch (Exception e) {
                log.error("청구 스케줄 실행 실패: billingScheduleId={}", schedule.getBillingScheduleId(), e);
            }
        }
        
        log.info("월별 청구서 자동 생성 완료: tenantId={}, totalGenerated={}", tenantId, totalGenerated);
        return totalGenerated;
    }
    
    @Override
    public int updateOverdueInvoices(String tenantId) {
        accessControlService.validateTenantAccess(tenantId);
        
        log.info("연체 청구서 상태 업데이트 시작: tenantId={}", tenantId);
        
        List<AcademyInvoice> overdueInvoices = invoiceRepository.findOverdueInvoices(tenantId, LocalDate.now());
        
        int updatedCount = 0;
        for (AcademyInvoice invoice : overdueInvoices) {
            if (invoice.getStatus() != AcademyInvoice.InvoiceStatus.OVERDUE &&
                invoice.getStatus() != AcademyInvoice.InvoiceStatus.PAID &&
                invoice.getStatus() != AcademyInvoice.InvoiceStatus.CANCELLED) {
                invoice.setStatus(AcademyInvoice.InvoiceStatus.OVERDUE);
                invoice.setUpdatedAt(LocalDateTime.now());
                invoiceRepository.save(invoice);
                updatedCount++;
            }
        }
        
        log.info("연체 청구서 상태 업데이트 완료: tenantId={}, updatedCount={}", tenantId, updatedCount);
        return updatedCount;
    }
    
    // ==================== 내부 헬퍼 메서드 ====================
    
    /**
     * 다음 청구일 계산
     */
    private LocalDate calculateNextBillingDate(AcademyBillingSchedule schedule) {
        LocalDate today = LocalDate.now();
        LocalDate nextDate = today;
        
        if (schedule.getBillingCycle() == AcademyBillingSchedule.BillingCycle.MONTHLY) {
            if (schedule.getDayOfMonth() != null) {
                int dayOfMonth = schedule.getDayOfMonth();
                nextDate = today.withDayOfMonth(Math.min(dayOfMonth, today.lengthOfMonth()));
                if (nextDate.isBefore(today) || nextDate.equals(today)) {
                    nextDate = nextDate.plusMonths(1).withDayOfMonth(Math.min(dayOfMonth, nextDate.plusMonths(1).lengthOfMonth()));
                }
            } else {
                nextDate = today.plusMonths(1);
            }
        } else if (schedule.getBillingCycle() == AcademyBillingSchedule.BillingCycle.WEEKLY) {
            if (schedule.getDayOfWeek() != null) {
                int dayOfWeek = schedule.getDayOfWeek();
                int currentDayOfWeek = today.getDayOfWeek().getValue() % 7;
                int daysUntilNext = (dayOfWeek - currentDayOfWeek + 7) % 7;
                if (daysUntilNext == 0) {
                    daysUntilNext = 7;
                }
                nextDate = today.plusDays(daysUntilNext);
            } else {
                nextDate = today.plusWeeks(1);
            }
        }
        
        // 오프셋 적용
        if (schedule.getBillingDateOffset() != null && schedule.getBillingDateOffset() != 0) {
            nextDate = nextDate.plusDays(schedule.getBillingDateOffset());
        }
        
        return nextDate;
    }
    
    /**
     * AcademyBillingSchedule을 BillingScheduleResponse로 변환
     */
    private BillingScheduleResponse toBillingScheduleResponse(AcademyBillingSchedule schedule) {
        return BillingScheduleResponse.builder()
            .billingScheduleId(schedule.getBillingScheduleId())
            .tenantId(schedule.getTenantId())
            .branchId(schedule.getBranchId())
            .name(schedule.getName())
            .description(schedule.getDescription())
            .billingCycle(schedule.getBillingCycle())
            .dayOfMonth(schedule.getDayOfMonth())
            .dayOfWeek(schedule.getDayOfWeek())
            .billingDateOffset(schedule.getBillingDateOffset())
            .targetFiltersJson(schedule.getTargetFiltersJson())
            .billingMethod(schedule.getBillingMethod())
            .fixedAmount(schedule.getFixedAmount())
            .calculationRuleJson(schedule.getCalculationRuleJson())
            .isActive(schedule.getIsActive())
            .lastBillingDate(schedule.getLastBillingDate())
            .nextBillingDate(schedule.getNextBillingDate())
            .createdAt(schedule.getCreatedAt())
            .updatedAt(schedule.getUpdatedAt())
            .build();
    }
    
    /**
     * AcademyInvoice를 InvoiceResponse로 변환
     */
    private InvoiceResponse toInvoiceResponse(AcademyInvoice invoice) {
        return InvoiceResponse.builder()
            .invoiceId(invoice.getInvoiceId())
            .tenantId(invoice.getTenantId())
            .branchId(invoice.getBranchId())
            .enrollmentId(invoice.getEnrollmentId())
            .consumerId(invoice.getConsumerId())
            .billingScheduleId(invoice.getBillingScheduleId())
            .invoiceNumber(invoice.getInvoiceNumber())
            .invoiceDate(invoice.getInvoiceDate())
            .dueDate(invoice.getDueDate())
            .billingPeriodStart(invoice.getBillingPeriodStart())
            .billingPeriodEnd(invoice.getBillingPeriodEnd())
            .subtotalAmount(invoice.getSubtotalAmount())
            .discountAmount(invoice.getDiscountAmount())
            .taxAmount(invoice.getTaxAmount())
            .totalAmount(invoice.getTotalAmount())
            .currency(invoice.getCurrency())
            .lineItemsJson(invoice.getLineItemsJson())
            .notes(invoice.getNotes())
            .status(convertInvoiceStatus(invoice.getStatus()))
            .issuedAt(invoice.getIssuedAt())
            .sentAt(invoice.getSentAt())
            .paidAt(invoice.getPaidAt())
            .paidAmount(invoice.getPaidAmount())
            .paymentMethod(invoice.getPaymentMethod())
            .createdAt(invoice.getCreatedAt())
            .updatedAt(invoice.getUpdatedAt())
            .build();
    }
    
    /**
     * AcademyTuitionPayment를 TuitionPaymentResponse로 변환
     */
    private TuitionPaymentResponse toTuitionPaymentResponse(AcademyTuitionPayment payment) {
        return TuitionPaymentResponse.builder()
            .paymentId(payment.getPaymentId())
            .tenantId(payment.getTenantId())
            .branchId(payment.getBranchId())
            .invoiceId(payment.getInvoiceId())
            .enrollmentId(payment.getEnrollmentId())
            .consumerId(payment.getConsumerId())
            .amount(payment.getAmount())
            .currency(payment.getCurrency())
            .paymentMethod(payment.getPaymentMethod())
            .pgProvider(payment.getPgProvider())
            .pgTransactionId(payment.getPgTransactionId())
            .pgStatus(payment.getPgStatus())
            .status(payment.getStatus())
            .paidAt(payment.getPaidAt())
            .failedAt(payment.getFailedAt())
            .failureReason(payment.getFailureReason())
            .refundAmount(payment.getRefundAmount())
            .refundedAt(payment.getRefundedAt())
            .refundReason(payment.getRefundReason())
            .receiptNumber(payment.getReceiptNumber())
            .receiptIssuedAt(payment.getReceiptIssuedAt())
            .notes(payment.getNotes())
            .createdAt(payment.getCreatedAt())
            .updatedAt(payment.getUpdatedAt())
            .build();
    }
    
    /**
     * InvoiceStatus 변환
     */
    private InvoiceResponse.InvoiceStatus convertInvoiceStatus(AcademyInvoice.InvoiceStatus status) {
        if (status == null) {
            return null;
        }
        return InvoiceResponse.InvoiceStatus.valueOf(status.name());
    }
    
    /**
     * 청구서 번호 생성
     */
    private String generateInvoiceNumber(String tenantId, Long branchId) {
        String yearMonth = LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMM"));
        
        // 해당 월의 청구서 수 조회
        LocalDate startDate = LocalDate.now().withDayOfMonth(1);
        LocalDate endDate = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());
        
        List<AcademyInvoice> existingInvoices = invoiceRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
            .filter(i -> i.getInvoiceDate() != null && 
                        !i.getInvoiceDate().isBefore(startDate) && 
                        !i.getInvoiceDate().isAfter(endDate))
            .collect(Collectors.toList());
        
        int sequence = existingInvoices.size() + 1;
        String invoiceNumber = String.format("INV-%s-%05d", yearMonth, sequence);
        
        // 중복 체크
        while (invoiceRepository.findByTenantIdAndInvoiceNumberAndIsDeletedFalse(tenantId, invoiceNumber).isPresent()) {
            sequence++;
            invoiceNumber = String.format("INV-%s-%05d", yearMonth, sequence);
        }
        
        return invoiceNumber;
    }
    
    /**
     * 영수증 번호 생성
     */
    private String generateReceiptNumber(String tenantId, Long branchId) {
        String yearMonth = LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMM"));
        
        // 해당 월의 영수증 수 조회
        LocalDate startDate = LocalDate.now().withDayOfMonth(1);
        LocalDate endDate = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());
        
        List<AcademyTuitionPayment> existingPayments = paymentRepository.findPaymentsByDateRange(tenantId, startDate, endDate).stream()
            .filter(p -> p.getReceiptNumber() != null && !p.getReceiptNumber().isEmpty())
            .collect(Collectors.toList());
        
        int sequence = existingPayments.size() + 1;
        String receiptNumber = String.format("RCP-%s-%05d", yearMonth, sequence);
        
        return receiptNumber;
    }
    
    /**
     * 청구 대상 수강 등록 조회
     */
    private List<ClassEnrollment> findTargetEnrollments(String tenantId, AcademyBillingSchedule schedule) {
        List<ClassEnrollment> enrollments;
        
        if (schedule.getBranchId() != null) {
            enrollments = enrollmentRepository.findByTenantIdAndBranchIdAndIsDeletedFalse(tenantId, schedule.getBranchId());
        } else {
            enrollments = enrollmentRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        }
        
        // 활성 수강 등록만 필터링
        enrollments = enrollments.stream()
            .filter(e -> e.getStatus() == ClassEnrollment.EnrollmentStatus.ACTIVE && 
                        e.getIsActive() != null && e.getIsActive())
            .collect(Collectors.toList());
        
        // TODO: targetFiltersJson 기반 추가 필터링
        
        return enrollments;
    }
    
    /**
     * 청구 금액 계산
     */
    private BigDecimal calculateBillingAmount(ClassEnrollment enrollment, AcademyBillingSchedule schedule) {
        if (schedule.getBillingMethod() == AcademyBillingSchedule.BillingMethod.TUITION_AMOUNT) {
            return enrollment.getTuitionAmount() != null ? enrollment.getTuitionAmount() : BigDecimal.ZERO;
        } else if (schedule.getBillingMethod() == AcademyBillingSchedule.BillingMethod.FIXED) {
            return schedule.getFixedAmount() != null ? schedule.getFixedAmount() : BigDecimal.ZERO;
        } else if (schedule.getBillingMethod() == AcademyBillingSchedule.BillingMethod.CALCULATED) {
            // TODO: 계산 규칙 기반 금액 계산
            return enrollment.getTuitionAmount() != null ? enrollment.getTuitionAmount() : BigDecimal.ZERO;
        }
        return BigDecimal.ZERO;
    }
    
    /**
     * 청구서 결제 상태 업데이트
     */
    private void updateInvoicePaymentStatus(String invoiceId) {
        AcademyInvoice invoice = invoiceRepository.findByInvoiceIdAndIsDeletedFalse(invoiceId)
            .orElseThrow(() -> new RuntimeException("청구서를 찾을 수 없습니다: " + invoiceId));
        
        // 해당 청구서의 결제 내역 조회
        List<AcademyTuitionPayment> payments = paymentRepository.findByTenantIdAndInvoiceIdAndIsDeletedFalse(
            invoice.getTenantId(), invoiceId);
        
        BigDecimal totalPaid = payments.stream()
            .filter(p -> p.getStatus() == AcademyTuitionPayment.PaymentStatus.COMPLETED)
            .map(p -> p.getAmount().subtract(p.getRefundAmount() != null ? p.getRefundAmount() : BigDecimal.ZERO))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        invoice.setPaidAmount(totalPaid);
        
        // 상태 업데이트
        if (totalPaid.compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setStatus(AcademyInvoice.InvoiceStatus.PAID);
            invoice.setPaidAt(LocalDateTime.now());
        } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
            invoice.setStatus(AcademyInvoice.InvoiceStatus.PARTIAL);
        }
        
        invoice.setUpdatedAt(LocalDateTime.now());
        invoiceRepository.save(invoice);
    }
}

