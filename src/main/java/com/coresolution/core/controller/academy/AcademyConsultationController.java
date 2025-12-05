package com.coresolution.core.controller.academy;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.constant.AcademyPermissionConstants;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.academy.AcademyConsultationRequest;
import com.coresolution.core.dto.academy.AcademyConsultationResponse;
import com.coresolution.core.dto.academy.AcademyConsultationCompleteRequest;
import com.coresolution.core.dto.academy.ClassEnrollmentRequest;
import com.coresolution.core.dto.academy.ClassEnrollmentResponse;
import com.coresolution.core.service.academy.ClassEnrollmentService;
import com.coresolution.consultation.entity.Consultation;
import com.coresolution.consultation.service.ConsultationService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.util.PermissionCheckUtils;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.consultation.exception.EntityNotFoundException;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

 /**
 * 학원 시스템 상담 예약 컨트롤러
 /**
 * 신규생 상담 및 등록 프로세스 지원
 /**
 * 
 /**
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 /**
 * 
 /**
 * @author CoreSolution
 /**
 * @version 1.0.0
 /**
 * @since 2025-11-24
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/academy/consultations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AcademyConsultationController extends BaseApiController {
    
    private final ConsultationService consultationService;
    private final ScheduleService scheduleService;
    private final DynamicPermissionService dynamicPermissionService;
    private final ConsultationRecordService consultationRecordService;
    private final ClassEnrollmentService enrollmentService;
    
     /**
     * 학원 상담 예약 생성
     /**
     * POST /api/v1/academy/consultations
     */
    @PostMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<AcademyConsultationResponse>> createConsultation(
            @Valid @RequestBody AcademyConsultationRequest request,
            HttpSession session) {
        log.info("학원 상담 예약 생성 요청: clientId={}, branchId={}", request.getClientId(), request.getBranchId());
        
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CONSULTATION_CREATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<AcademyConsultationResponse>>) permissionResponse;
        }
        
        PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        Consultation consultation = new Consultation();
        consultation.setClientId(request.getClientId());
        consultation.setConsultantId(request.getConsultantId());
        consultation.setConsultationDate(request.getConsultationDate());
        consultation.setStartTime(request.getStartTime());
        consultation.setEndTime(request.getEndTime());
        consultation.setConsultationMethod(request.getConsultationMethod() != null ? request.getConsultationMethod() : "OFFLINE");
        consultation.setPriority(request.getPriority() != null ? request.getPriority() : "NORMAL");
        consultation.setRiskLevel(request.getRiskLevel() != null ? request.getRiskLevel() : "LOW");
        consultation.setIsEmergency(request.getIsEmergency() != null ? request.getIsEmergency() : false);
        consultation.setIsFirstSession(request.getIsFirstSession() != null ? request.getIsFirstSession() : true);
        if (request.getNotes() != null) {
            consultation.setConsultantNotes(request.getNotes());
        }
        consultation.setTenantId(tenantId);
        
        Consultation createdConsultation = consultationService.createConsultationRequest(consultation);
        
        if (request.getConsultantId() != null && request.getConsultationDate() != null 
            && request.getStartTime() != null && request.getEndTime() != null) {
            try {
                Schedule schedule = scheduleService.createConsultantSchedule(
                    request.getConsultantId(),
                    request.getClientId(),
                    request.getConsultationDate(),
                    request.getStartTime(),
                    request.getEndTime(),
                    "학원 상담 예약",
                    request.getNotes(),
                    "ACADEMY", // 학원 상담 유형
                    request.getBranchCode()
                );
                log.info("학원 상담 스케줄 생성 완료: scheduleId={}", schedule.getId());
            } catch (Exception e) {
                log.warn("스케줄 생성 실패 (상담 예약은 생성됨): {}", e.getMessage());
            }
        }
        
        AcademyConsultationResponse response = toResponse(createdConsultation);
        return created("상담 예약이 생성되었습니다.", response);
    }
    
     /**
     * 학원 상담 예약 목록 조회
     /**
     * GET /api/v1/academy/consultations
     */
    @GetMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<AcademyConsultationResponse>>> getConsultations(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long branchId,
            HttpSession session) {
        log.debug("학원 상담 예약 목록 조회: clientId={}, consultantId={}, status={}, branchId={}", 
            clientId, consultantId, status, branchId);
        
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CONSULTATION_VIEW_LIST, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<AcademyConsultationResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<Consultation> consultations;
        if (clientId != null) {
            consultations = consultationService.findByClientId(clientId);
        } else if (consultantId != null) {
            consultations = consultationService.findByConsultantId(consultantId);
        } else if (status != null) {
            consultations = consultationService.findByStatus(status);
        } else {
            consultations = consultationService.findAllActive();
        }
        
        List<AcademyConsultationResponse> responses = consultations.stream()
            .filter(c -> tenantId.equals(c.getTenantId()))
            .map(this::toResponse)
            .collect(Collectors.toList());
        
        return success(responses);
    }
    
     /**
     * 학원 상담 예약 상세 조회
     /**
     * GET /api/v1/academy/consultations/{consultationId}
     */
    @GetMapping("/{consultationId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<AcademyConsultationResponse>> getConsultation(
            @PathVariable Long consultationId,
            HttpSession session) {
        log.debug("학원 상담 예약 상세 조회: consultationId={}", consultationId);
        
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CONSULTATION_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<AcademyConsultationResponse>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        Consultation consultation = consultationService.findActiveByIdOrThrow(consultationId);
        
        if (!tenantId.equals(consultation.getTenantId())) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }
        
        AcademyConsultationResponse response = toResponse(consultation);
        return success(response);
    }
    
     /**
     * 학원 상담 예약 확정
     /**
     * POST /api/v1/academy/consultations/{consultationId}/confirm
     */
    @PostMapping("/{consultationId}/confirm")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<AcademyConsultationResponse>> confirmConsultation(
            @PathVariable Long consultationId,
            @RequestParam(required = false) Long consultantId,
            HttpSession session) {
        log.info("학원 상담 예약 확정: consultationId={}, consultantId={}", consultationId, consultantId);
        
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CONSULTATION_CONFIRM, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<AcademyConsultationResponse>>) permissionResponse;
        }
        
        PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        Consultation consultation = consultationService.findActiveById(consultationId)
            .orElseThrow(() -> new EntityNotFoundException("상담 예약을 찾을 수 없습니다: " + consultationId));
        
        if (!tenantId.equals(consultation.getTenantId())) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }
        
        Long finalConsultantId = consultantId != null ? consultantId : consultation.getConsultantId();
        Consultation confirmedConsultation = consultationService.confirmConsultation(consultationId, finalConsultantId);
        
        AcademyConsultationResponse response = toResponse(confirmedConsultation);
        return success("상담 예약이 확정되었습니다.", response);
    }
    
     /**
     * 학원 상담 예약 취소
     /**
     * POST /api/v1/academy/consultations/{consultationId}/cancel
     */
    @PostMapping("/{consultationId}/cancel")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<AcademyConsultationResponse>> cancelConsultation(
            @PathVariable Long consultationId,
            @RequestParam(required = false) String reason,
            HttpSession session) {
        log.info("학원 상담 예약 취소: consultationId={}, reason={}", consultationId, reason);
        
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CONSULTATION_CANCEL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<AcademyConsultationResponse>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        Consultation consultation = consultationService.findActiveByIdOrThrow(consultationId);
        
        if (!tenantId.equals(consultation.getTenantId())) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }
        
        Consultation cancelledConsultation = consultationService.cancelConsultation(
            consultationId, 
            reason != null ? reason : "학원 상담 예약 취소"
        );
        
        AcademyConsultationResponse response = toResponse(cancelledConsultation);
        return success("상담 예약이 취소되었습니다.", response);
    }
    
     /**
     * 학원 상담 완료 및 수강 등록 연계
     /**
     * POST /api/v1/academy/consultations/{consultationId}/complete
     */
    @PostMapping("/{consultationId}/complete")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Map<String, Object>>> completeConsultation(
            @PathVariable Long consultationId,
            @Valid @RequestBody AcademyConsultationCompleteRequest request,
            HttpSession session) {
        log.info("학원 상담 완료 요청: consultationId={}, createRecord={}, createEnrollment={}", 
            consultationId, request.getCreateRecord(), request.getCreateEnrollment());
        
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CONSULTATION_CONFIRM, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<Map<String, Object>>>) permissionResponse;
        }
        
        PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        Consultation consultation = consultationService.findActiveByIdOrThrow(consultationId);
        
        if (!tenantId.equals(consultation.getTenantId())) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }
        
        String notes = request.getNotes() != null ? request.getNotes() : "";
        int rating = request.getRating() != null ? request.getRating() : 5;
        Consultation completedConsultation = consultationService.completeConsultation(
            consultationId, notes, rating
        );
        
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("consultation", toResponse(completedConsultation));
        
        if (Boolean.TRUE.equals(request.getCreateRecord())) {
            try {
                Map<String, Object> recordData = new java.util.HashMap<>();
                recordData.put("consultationId", consultationId);
                recordData.put("clientId", consultation.getClientId());
                recordData.put("consultantId", consultation.getConsultantId());
                recordData.put("sessionDate", consultation.getConsultationDate());
                recordData.put("consultationContent", notes);
                recordData.put("sessionStatus", "COMPLETED");
                
                var consultationRecord = consultationRecordService.createConsultationRecord(recordData);
                result.put("consultationRecord", consultationRecord);
                log.info("상담 기록 생성 완료: recordId={}", consultationRecord.getId());
            } catch (Exception e) {
                log.warn("상담 기록 생성 실패: {}", e.getMessage());
                result.put("consultationRecordError", e.getMessage());
            }
        }
        
        if (Boolean.TRUE.equals(request.getCreateEnrollment()) && request.getEnrollmentInfo() != null) {
            try {
                AcademyConsultationCompleteRequest.EnrollmentFromConsultationRequest enrollmentInfo = 
                    request.getEnrollmentInfo();
                
                ClassEnrollmentRequest enrollmentRequest = ClassEnrollmentRequest.builder()
                    .branchId(enrollmentInfo.getBranchId())
                    .classId(enrollmentInfo.getClassId())
                    .consumerId(consultation.getClientId())
                    .startDate(enrollmentInfo.getStartDate())
                    .endDate(enrollmentInfo.getEndDate())
                    .tuitionPlanId(enrollmentInfo.getTuitionPlanId())
                    .tuitionAmount(enrollmentInfo.getTuitionAmount())
                    .notes(enrollmentInfo.getNotes() != null ? enrollmentInfo.getNotes() : 
                        "상담 완료 후 자동 등록: " + notes)
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    .status(com.coresolution.core.domain.academy.ClassEnrollment.EnrollmentStatus.ACTIVE)
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    .paymentStatus(com.coresolution.core.domain.academy.ClassEnrollment.PaymentStatus.PENDING)
                    .build();
                
                ClassEnrollmentResponse enrollment = enrollmentService.createEnrollment(
                    tenantId, 
                    enrollmentRequest, 
                    "SYSTEM" // 상담 완료 후 자동 생성
                );
                result.put("enrollment", enrollment);
                log.info("수강 등록 생성 완료: enrollmentId={}", enrollment.getEnrollmentId());
            } catch (Exception e) {
                log.warn("수강 등록 생성 실패: {}", e.getMessage());
                result.put("enrollmentError", e.getMessage());
            }
        }
        
        return success("상담이 완료되었습니다.", result);
    }
    
     /**
     * Consultation 엔티티를 AcademyConsultationResponse로 변환
     */
    private AcademyConsultationResponse toResponse(Consultation consultation) {
        return AcademyConsultationResponse.builder()
            .consultationId(consultation.getId())
            .clientId(consultation.getClientId())
            .consultantId(consultation.getConsultantId())
            .consultationDate(consultation.getConsultationDate())
            .startTime(consultation.getStartTime())
            .endTime(consultation.getEndTime())
            .status(consultation.getStatus())
            .consultationMethod(consultation.getConsultationMethod())
            .priority(consultation.getPriority())
            .riskLevel(consultation.getRiskLevel())
            .isEmergency(consultation.getIsEmergency())
            .isFirstSession(consultation.getIsFirstSession())
            .notes(consultation.getConsultantNotes())
            .createdAt(consultation.getCreatedAt())
            .updatedAt(consultation.getUpdatedAt())
            .build();
    }
}

