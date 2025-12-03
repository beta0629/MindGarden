package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.CommonCodeCreateRequest;
import com.coresolution.consultation.dto.CommonCodeResponse;
import com.coresolution.consultation.dto.CommonCodeUpdateRequest;
import com.coresolution.consultation.entity.CodeGroupMetadata;
import com.coresolution.consultation.service.TenantCommonCodeService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 테넌트 공통코드 관리 API
 * 
 * 테넌트 관리자 전용 API
 * - 테넌트별 공통코드 CRUD
 * - 상담 패키지 관리 (금액 포함)
 * - 평가 유형 관리 (금액 포함)
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tenant/common-codes")
@RequiredArgsConstructor
@Tag(name = "Tenant Common Code", description = "테넌트 공통코드 관리 API (관리자 전용)")
public class TenantCommonCodeController {

    private final TenantCommonCodeService tenantCommonCodeService;

    @GetMapping("/groups")
    @Operation(summary = "테넌트 공통코드 그룹 목록 조회", description = "테넌트가 관리 가능한 공통코드 그룹 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<List<CodeGroupMetadata>>> getTenantCodeGroups(HttpSession session) {
        String tenantId = SessionUtils.getTenantId(session);
        
        if (tenantId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("테넌트 ID가 필요합니다."));
        }
        
        List<CodeGroupMetadata> groups = tenantCommonCodeService.getTenantCodeGroups(tenantId);
        return ResponseEntity.ok(ApiResponse.success(groups));
    }

    @GetMapping("/groups/{codeGroup}")
    @Operation(summary = "특정 그룹의 테넌트 공통코드 조회", description = "특정 코드 그룹에 속한 테넌트 공통코드 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<List<CommonCodeResponse>>> getTenantCodesByGroup(
        HttpSession session,
        @Parameter(description = "코드 그룹명 (예: CONSULTATION_PACKAGE)") 
        @PathVariable String codeGroup
    ) {
        String tenantId = SessionUtils.getTenantId(session);
        
        if (tenantId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("테넌트 ID가 필요합니다."));
        }
        
        List<CommonCodeResponse> codes = tenantCommonCodeService.getTenantCodesByGroup(tenantId, codeGroup);
        return ResponseEntity.ok(ApiResponse.success(codes));
    }

    @PostMapping
    @Operation(summary = "테넌트 공통코드 생성", description = "새로운 테넌트 공통코드를 생성합니다.")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> createTenantCode(
        HttpSession session,
        @RequestBody CommonCodeCreateRequest request
    ) {
        String tenantId = SessionUtils.getTenantId(session);
        
        if (tenantId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("테넌트 ID가 필요합니다."));
        }
        
        try {
            CommonCodeResponse response = tenantCommonCodeService.createTenantCode(tenantId, request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IllegalArgumentException e) {
            log.error("테넌트 공통코드 생성 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{codeId}")
    @Operation(summary = "테넌트 공통코드 수정", description = "기존 테넌트 공통코드를 수정합니다.")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> updateTenantCode(
        HttpSession session,
        @Parameter(description = "코드 ID") @PathVariable Long codeId,
        @RequestBody CommonCodeUpdateRequest request
    ) {
        String tenantId = SessionUtils.getTenantId(session);
        
        if (tenantId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("테넌트 ID가 필요합니다."));
        }
        
        try {
            CommonCodeResponse response = tenantCommonCodeService.updateTenantCode(tenantId, codeId, request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IllegalArgumentException e) {
            log.error("테넌트 공통코드 수정 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{codeId}")
    @Operation(summary = "테넌트 공통코드 삭제", description = "테넌트 공통코드를 삭제합니다 (소프트 삭제).")
    public ResponseEntity<ApiResponse<Void>> deleteTenantCode(
        HttpSession session,
        @Parameter(description = "코드 ID") @PathVariable Long codeId
    ) {
        String tenantId = SessionUtils.getTenantId(session);
        
        if (tenantId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("테넌트 ID가 필요합니다."));
        }
        
        try {
            tenantCommonCodeService.deleteTenantCode(tenantId, codeId);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            log.error("테넌트 공통코드 삭제 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{codeId}/active")
    @Operation(summary = "테넌트 공통코드 활성화/비활성화", description = "테넌트 공통코드의 활성 상태를 변경합니다.")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> toggleTenantCodeActive(
        HttpSession session,
        @Parameter(description = "코드 ID") @PathVariable Long codeId,
        @RequestBody Map<String, Boolean> request
    ) {
        String tenantId = SessionUtils.getTenantId(session);
        
        if (tenantId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("테넌트 ID가 필요합니다."));
        }
        
        Boolean isActive = request.get("isActive");
        if (isActive == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("isActive 값이 필요합니다."));
        }
        
        try {
            CommonCodeResponse response = tenantCommonCodeService.toggleTenantCodeActive(tenantId, codeId, isActive);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IllegalArgumentException e) {
            log.error("테넌트 공통코드 활성화 토글 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{codeId}/order")
    @Operation(summary = "테넌트 공통코드 정렬 순서 변경", description = "테넌트 공통코드의 정렬 순서를 변경합니다.")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> updateTenantCodeOrder(
        HttpSession session,
        @Parameter(description = "코드 ID") @PathVariable Long codeId,
        @RequestBody Map<String, Integer> request
    ) {
        String tenantId = SessionUtils.getTenantId(session);
        
        if (tenantId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("테넌트 ID가 필요합니다."));
        }
        
        Integer newOrder = request.get("sortOrder");
        if (newOrder == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("sortOrder 값이 필요합니다."));
        }
        
        try {
            CommonCodeResponse response = tenantCommonCodeService.updateTenantCodeOrder(tenantId, codeId, newOrder);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IllegalArgumentException e) {
            log.error("테넌트 공통코드 정렬 순서 변경 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/consultation-packages")
    @Operation(summary = "상담 패키지 생성", description = "금액 정보를 포함한 상담 패키지를 생성합니다.")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> createConsultationPackage(
        HttpSession session,
        @RequestBody Map<String, Object> request
    ) {
        String tenantId = SessionUtils.getTenantId(session);
        
        if (tenantId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("테넌트 ID가 필요합니다."));
        }
        
        try {
            String packageName = (String) request.get("packageName");
            Integer price = (Integer) request.get("price");
            Integer duration = (Integer) request.get("duration");
            Integer sessions = (Integer) request.get("sessions");
            String description = (String) request.get("description");
            
            CommonCodeResponse response = tenantCommonCodeService.createConsultationPackage(
                tenantId, packageName, price, duration, sessions, description
            );
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("상담 패키지 생성 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/assessment-types")
    @Operation(summary = "평가 유형 생성", description = "금액 정보를 포함한 평가 유형을 생성합니다.")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> createAssessmentType(
        HttpSession session,
        @RequestBody Map<String, Object> request
    ) {
        String tenantId = SessionUtils.getTenantId(session);
        
        if (tenantId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("테넌트 ID가 필요합니다."));
        }
        
        try {
            String assessmentName = (String) request.get("assessmentName");
            Integer price = (Integer) request.get("price");
            Integer duration = (Integer) request.get("duration");
            String description = (String) request.get("description");
            
            CommonCodeResponse response = tenantCommonCodeService.createAssessmentType(
                tenantId, assessmentName, price, duration, description
            );
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("평가 유형 생성 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        }
    }
}

