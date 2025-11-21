package com.coresolution.core.controller.ops;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.*;
import com.coresolution.core.service.TenantPgConfigurationService;
import com.coresolution.consultation.exception.EntityNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 운영 포털 PG 설정 승인 API 컨트롤러
 * 운영 포털에서 사용하는 PG 설정 승인/관리 API
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ops/pg-configurations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
@Tag(name = "운영 포털 PG 설정", description = "운영 포털 PG 설정 승인/관리 API (관리자 전용)")
public class TenantPgConfigurationOpsController extends BaseApiController {
    
    private final TenantPgConfigurationService pgConfigurationService;
    
    /**
     * 승인 대기 중인 PG 설정 목록 조회
     */
    @Operation(
            summary = "승인 대기 목록 조회",
            description = "승인 대기 중인 PG 설정 목록을 조회합니다. 테넌트 ID 또는 PG Provider로 필터링 가능합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음 (ADMIN 또는 OPS 역할 필요)")
    })
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<TenantPgConfigurationResponse>>> getPendingApprovals(
            @Parameter(description = "테넌트 ID (필터)") @RequestParam(required = false) String tenantId,
            @Parameter(description = "PG Provider (필터)") @RequestParam(required = false) PgProvider pgProvider) {
        
        log.debug("승인 대기 목록 조회 요청: tenantId={}, pgProvider={}", tenantId, pgProvider);
        
        List<TenantPgConfigurationResponse> configurations = 
                pgConfigurationService.getPendingApprovals(tenantId, pgProvider);
        
        return success(configurations);
    }
    
    /**
     * PG 설정 승인
     */
    @Operation(
            summary = "PG 설정 승인",
            description = "PG 설정을 승인합니다. 승인 시 연결 테스트를 수행할 수 있습니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "승인 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (이미 승인됨 등)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PostMapping("/{configId}/approve")
    public ResponseEntity<ApiResponse<TenantPgConfigurationResponse>> approveConfiguration(
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId,
            @Valid @RequestBody PgConfigurationApproveRequest request) {
        
        log.info("PG 설정 승인 요청: configId={}, approvedBy={}", configId, request.getApprovedBy());
        
        TenantPgConfigurationResponse response = 
                pgConfigurationService.approveConfiguration(configId, request);
        
        return updated("PG 설정이 승인되었습니다.", response);
    }
    
    /**
     * PG 설정 거부
     */
    @Operation(
            summary = "PG 설정 거부",
            description = "PG 설정을 거부합니다. 거부 사유는 필수입니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "거부 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (거부 사유 누락 등)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PostMapping("/{configId}/reject")
    public ResponseEntity<ApiResponse<TenantPgConfigurationResponse>> rejectConfiguration(
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId,
            @Valid @RequestBody PgConfigurationRejectRequest request) {
        
        log.info("PG 설정 거부 요청: configId={}, rejectedBy={}", configId, request.getRejectedBy());
        
        TenantPgConfigurationResponse response = 
                pgConfigurationService.rejectConfiguration(configId, request);
        
        return updated("PG 설정이 거부되었습니다.", response);
    }
    
    /**
     * PG 설정 활성화
     */
    @Operation(
            summary = "PG 설정 활성화",
            description = "승인된 PG 설정을 활성화합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "활성화 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (아직 승인되지 않음 등)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PostMapping("/{configId}/activate")
    public ResponseEntity<ApiResponse<TenantPgConfigurationResponse>> activateConfiguration(
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        
        log.info("PG 설정 활성화 요청: configId={}", configId);
        
        String activatedBy = getCurrentUserId();
        
        TenantPgConfigurationResponse response = 
                pgConfigurationService.activateConfiguration(configId, activatedBy);
        
        return updated("PG 설정이 활성화되었습니다.", response);
    }
    
    /**
     * PG 설정 비활성화
     */
    @Operation(
            summary = "PG 설정 비활성화",
            description = "활성화된 PG 설정을 비활성화합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "비활성화 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PostMapping("/{configId}/deactivate")
    public ResponseEntity<ApiResponse<TenantPgConfigurationResponse>> deactivateConfiguration(
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        
        log.info("PG 설정 비활성화 요청: configId={}", configId);
        
        String deactivatedBy = getCurrentUserId();
        
        TenantPgConfigurationResponse response = 
                pgConfigurationService.deactivateConfiguration(configId, deactivatedBy);
        
        return updated("PG 설정이 비활성화되었습니다.", response);
    }
    
    /**
     * PG 설정 변경 이력 조회
     */
    @Operation(
            summary = "PG 설정 변경 이력 조회",
            description = "PG 설정의 변경 이력을 조회합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationDetailResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @GetMapping("/{configId}/history")
    public ResponseEntity<ApiResponse<TenantPgConfigurationDetailResponse>> getConfigurationHistory(
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        
        log.debug("PG 설정 변경 이력 조회 요청: configId={}", configId);
        
        TenantPgConfigurationDetailResponse response = 
                pgConfigurationService.getConfigurationDetail(null, configId);
        
        if (response == null) {
            throw new EntityNotFoundException("PG 설정을 찾을 수 없습니다: " + configId);
        }
        
        return success(response);
    }
    
    /**
     * PG 연결 테스트 (운영 포털)
     */
    @Operation(
            summary = "PG 연결 테스트",
            description = "PG 설정의 연결을 테스트합니다. 운영 포털에서 모든 테넌트의 PG 설정을 테스트할 수 있습니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "테스트 완료",
                    content = @Content(schema = @Schema(implementation = ConnectionTestResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음 (ADMIN 또는 OPS 역할 필요)")
    })
    @PostMapping("/{configId}/test-connection")
    public ResponseEntity<ApiResponse<ConnectionTestResponse>> testConnection(
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        
        log.info("PG 연결 테스트 요청 (운영 포털): configId={}", configId);
        
        ConnectionTestResponse response = 
                pgConfigurationService.testConnectionBeforeApproval(configId);
        
        return success(response);
    }
    
    // ==================== Private Helper Methods ====================
    
    /**
     * 현재 사용자 ID 가져오기
     * SecurityContext에서 인증된 사용자 정보를 가져옵니다.
     */
    private String getCurrentUserId() {
        try {
            org.springframework.security.core.context.SecurityContext context = 
                    org.springframework.security.core.context.SecurityContextHolder.getContext();
            if (context != null && context.getAuthentication() != null) {
                String username = context.getAuthentication().getName();
                if (username != null && !username.equals("anonymousUser")) {
                    return username;
                }
            }
        } catch (Exception e) {
            log.warn("현재 사용자 정보를 가져오는 중 오류 발생: {}", e.getMessage());
        }
        // 인증 정보가 없는 경우 기본값 반환
        return "system";
    }
}

