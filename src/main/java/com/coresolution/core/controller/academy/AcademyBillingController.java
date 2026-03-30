package com.coresolution.core.controller.academy;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.constant.AcademyPermissionConstants;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.academy.*;
import com.coresolution.core.service.academy.AcademyBillingService;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.util.PermissionCheckUtils;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 학원 수강료 청구 및 결제 관리 컨트롤러
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/academy/billing")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AcademyBillingController extends BaseApiController {
    
    private final AcademyBillingService billingService;
    private final DynamicPermissionService dynamicPermissionService;
    
    // ==================== 청구 스케줄 관리 ====================
    
    /**
     * 청구 스케줄 목록 조회
     * GET /api/v1/academy/billing/schedules
     */
    @GetMapping("/schedules")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<BillingScheduleResponse>>> getBillingSchedules(
            @RequestParam(required = false) Long branchId,
            HttpSession session) {
        log.debug("청구 스케줄 목록 조회 요청: branchId={}", branchId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<BillingScheduleResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<BillingScheduleResponse> schedules = billingService.getBillingSchedules(tenantId, branchId);
        return success(schedules);
    }
    
    /**
     * 청구 스케줄 상세 조회
     * GET /api/v1/academy/billing/schedules/{billingScheduleId}
     */
    @GetMapping("/schedules/{billingScheduleId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<BillingScheduleResponse>> getBillingSchedule(
            @PathVariable String billingScheduleId,
            HttpSession session) {
        log.debug("청구 스케줄 상세 조회: billingScheduleId={}", billingScheduleId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<BillingScheduleResponse>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        BillingScheduleResponse schedule = billingService.getBillingSchedule(tenantId, billingScheduleId);
        return success(schedule);
    }
    
    /**
     * 청구 스케줄 생성
     * POST /api/v1/academy/billing/schedules
     */
    @PostMapping("/schedules")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<BillingScheduleResponse>> createBillingSchedule(
            @Valid @RequestBody BillingScheduleRequest request,
            HttpSession session) {
        log.info("청구 스케줄 생성 요청: name={}", request.getName());
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<BillingScheduleResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        BillingScheduleResponse schedule = billingService.createBillingSchedule(
            tenantId, 
            request, 
            currentUser.getEmail()
        );
        return created("청구 스케줄이 생성되었습니다.", schedule);
    }
    
    /**
     * 청구 스케줄 수정
     * PUT /api/v1/academy/billing/schedules/{billingScheduleId}
     */
    @PutMapping("/schedules/{billingScheduleId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<BillingScheduleResponse>> updateBillingSchedule(
            @PathVariable String billingScheduleId,
            @Valid @RequestBody BillingScheduleRequest request,
            HttpSession session) {
        log.info("청구 스케줄 수정 요청: billingScheduleId={}", billingScheduleId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<BillingScheduleResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        BillingScheduleResponse schedule = billingService.updateBillingSchedule(
            tenantId, 
            billingScheduleId, 
            request, 
            currentUser.getEmail()
        );
        return success("청구 스케줄이 수정되었습니다.", schedule);
    }
    
    /**
     * 청구 스케줄 삭제
     * DELETE /api/v1/academy/billing/schedules/{billingScheduleId}
     */
    @DeleteMapping("/schedules/{billingScheduleId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Void>> deleteBillingSchedule(
            @PathVariable String billingScheduleId,
            HttpSession session) {
        log.info("청구 스케줄 삭제 요청: billingScheduleId={}", billingScheduleId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<Void>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        billingService.deleteBillingSchedule(tenantId, billingScheduleId, currentUser.getEmail());
        return success("청구 스케줄이 삭제되었습니다.", null);
    }
    
    /**
     * 청구 스케줄 실행 (청구서 생성)
     * POST /api/v1/academy/billing/schedules/{billingScheduleId}/execute
     */
    @PostMapping("/schedules/{billingScheduleId}/execute")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> executeBillingSchedule(
            @PathVariable String billingScheduleId,
            HttpSession session) {
        log.info("청구 스케줄 실행 요청: billingScheduleId={}", billingScheduleId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<InvoiceResponse>>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<InvoiceResponse> invoices = billingService.executeBillingSchedule(
            tenantId, 
            billingScheduleId, 
            currentUser.getEmail()
        );
        return success("청구서가 생성되었습니다.", invoices);
    }
    
    // ==================== 청구서 관리 ====================
    
    /**
     * 청구서 목록 조회
     * GET /api/v1/academy/billing/invoices
     */
    @GetMapping("/invoices")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getInvoices(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String enrollmentId,
            @RequestParam(required = false) Long consumerId,
            @RequestParam(required = false) InvoiceResponse.InvoiceStatus status,
            HttpSession session) {
        log.debug("청구서 목록 조회 요청: branchId={}, enrollmentId={}, consumerId={}, status={}", 
            branchId, enrollmentId, consumerId, status);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<InvoiceResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<InvoiceResponse> invoices = billingService.getInvoices(tenantId, branchId, enrollmentId, consumerId, status);
        return success(invoices);
    }
    
    /**
     * 청구서 상세 조회
     * GET /api/v1/academy/billing/invoices/{invoiceId}
     */
    @GetMapping("/invoices/{invoiceId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoice(
            @PathVariable String invoiceId,
            HttpSession session) {
        log.debug("청구서 상세 조회: invoiceId={}", invoiceId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<InvoiceResponse>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        InvoiceResponse invoice = billingService.getInvoice(tenantId, invoiceId);
        return success(invoice);
    }
    
    /**
     * 청구서 생성
     * POST /api/v1/academy/billing/invoices
     */
    @PostMapping("/invoices")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(
            @Valid @RequestBody InvoiceRequest request,
            HttpSession session) {
        log.info("청구서 생성 요청: invoiceNumber={}", request.getInvoiceNumber());
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<InvoiceResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        InvoiceResponse invoice = billingService.createInvoice(tenantId, request, currentUser.getEmail());
        return created("청구서가 생성되었습니다.", invoice);
    }
    
    /**
     * 청구서 발행
     * POST /api/v1/academy/billing/invoices/{invoiceId}/issue
     */
    @PostMapping("/invoices/{invoiceId}/issue")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<InvoiceResponse>> issueInvoice(
            @PathVariable String invoiceId,
            HttpSession session) {
        log.info("청구서 발행 요청: invoiceId={}", invoiceId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<InvoiceResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        InvoiceResponse invoice = billingService.issueInvoice(tenantId, invoiceId, currentUser.getEmail());
        return success("청구서가 발행되었습니다.", invoice);
    }
    
    /**
     * 청구서 발송
     * POST /api/v1/academy/billing/invoices/{invoiceId}/send
     */
    @PostMapping("/invoices/{invoiceId}/send")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<InvoiceResponse>> sendInvoice(
            @PathVariable String invoiceId,
            HttpSession session) {
        log.info("청구서 발송 요청: invoiceId={}", invoiceId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<InvoiceResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        InvoiceResponse invoice = billingService.sendInvoice(tenantId, invoiceId, currentUser.getEmail());
        return success("청구서가 발송되었습니다.", invoice);
    }
    
    /**
     * 청구서 취소
     * POST /api/v1/academy/billing/invoices/{invoiceId}/cancel
     */
    @PostMapping("/invoices/{invoiceId}/cancel")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<InvoiceResponse>> cancelInvoice(
            @PathVariable String invoiceId,
            HttpSession session) {
        log.info("청구서 취소 요청: invoiceId={}", invoiceId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<InvoiceResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        InvoiceResponse invoice = billingService.cancelInvoice(tenantId, invoiceId, currentUser.getEmail());
        return success("청구서가 취소되었습니다.", invoice);
    }
    
    /**
     * 연체 청구서 조회
     * GET /api/v1/academy/billing/invoices/overdue
     */
    @GetMapping("/invoices/overdue")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getOverdueInvoices(
            @RequestParam(required = false) Long branchId,
            HttpSession session) {
        log.debug("연체 청구서 조회 요청: branchId={}", branchId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<InvoiceResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<InvoiceResponse> invoices = billingService.getOverdueInvoices(tenantId, branchId);
        return success(invoices);
    }
    
    // ==================== 결제 관리 ====================
    
    /**
     * 결제 목록 조회
     * GET /api/v1/academy/billing/payments
     */
    @GetMapping("/payments")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<TuitionPaymentResponse>>> getPayments(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String invoiceId,
            @RequestParam(required = false) String enrollmentId,
            @RequestParam(required = false) Long consumerId,
            HttpSession session) {
        log.debug("결제 목록 조회 요청: branchId={}, invoiceId={}, enrollmentId={}, consumerId={}", 
            branchId, invoiceId, enrollmentId, consumerId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<TuitionPaymentResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<TuitionPaymentResponse> payments = billingService.getPayments(tenantId, branchId, invoiceId, enrollmentId, consumerId);
        return success(payments);
    }
    
    /**
     * 결제 상세 조회
     * GET /api/v1/academy/billing/payments/{paymentId}
     */
    @GetMapping("/payments/{paymentId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<TuitionPaymentResponse>> getPayment(
            @PathVariable String paymentId,
            HttpSession session) {
        log.debug("결제 상세 조회: paymentId={}", paymentId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<TuitionPaymentResponse>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        TuitionPaymentResponse payment = billingService.getPayment(tenantId, paymentId);
        return success(payment);
    }
    
    /**
     * 결제 생성
     * POST /api/v1/academy/billing/payments
     */
    @PostMapping("/payments")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<TuitionPaymentResponse>> createPayment(
            @Valid @RequestBody TuitionPaymentRequest request,
            HttpSession session) {
        log.info("결제 생성 요청: invoiceId={}, amount={}", request.getInvoiceId(), request.getAmount());
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<TuitionPaymentResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        TuitionPaymentResponse payment = billingService.createPayment(tenantId, request, currentUser.getEmail());
        return created("결제가 생성되었습니다.", payment);
    }
    
    /**
     * 결제 완료 처리
     * POST /api/v1/academy/billing/payments/{paymentId}/complete
     */
    @PostMapping("/payments/{paymentId}/complete")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<TuitionPaymentResponse>> completePayment(
            @PathVariable String paymentId,
            HttpSession session) {
        log.info("결제 완료 처리 요청: paymentId={}", paymentId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<TuitionPaymentResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        TuitionPaymentResponse payment = billingService.completePayment(tenantId, paymentId, currentUser.getEmail());
        return success("결제가 완료되었습니다.", payment);
    }
    
    /**
     * 결제 취소
     * POST /api/v1/academy/billing/payments/{paymentId}/cancel
     */
    @PostMapping("/payments/{paymentId}/cancel")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<TuitionPaymentResponse>> cancelPayment(
            @PathVariable String paymentId,
            HttpSession session) {
        log.info("결제 취소 요청: paymentId={}", paymentId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<TuitionPaymentResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        TuitionPaymentResponse payment = billingService.cancelPayment(tenantId, paymentId, currentUser.getEmail());
        return success("결제가 취소되었습니다.", payment);
    }
    
    /**
     * 환불 처리
     * POST /api/v1/academy/billing/payments/{paymentId}/refund
     */
    @PostMapping("/payments/{paymentId}/refund")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<TuitionPaymentResponse>> refundPayment(
            @PathVariable String paymentId,
            @Valid @RequestBody RefundRequest request,
            HttpSession session) {
        log.info("환불 처리 요청: paymentId={}, refundAmount={}", paymentId, request.getRefundAmount());
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<TuitionPaymentResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        TuitionPaymentResponse payment = billingService.refundPayment(tenantId, paymentId, request, currentUser.getEmail());
        return success("환불이 처리되었습니다.", payment);
    }
    
    /**
     * 영수증 발급
     * POST /api/v1/academy/billing/payments/{paymentId}/receipt
     */
    @PostMapping("/payments/{paymentId}/receipt")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<TuitionPaymentResponse>> issueReceipt(
            @PathVariable String paymentId,
            HttpSession session) {
        log.info("영수증 발급 요청: paymentId={}", paymentId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<TuitionPaymentResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        TuitionPaymentResponse payment = billingService.issueReceipt(tenantId, paymentId, currentUser.getEmail());
        return success("영수증이 발급되었습니다.", payment);
    }
}

