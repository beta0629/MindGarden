package com.coresolution.core.controller;

import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.dto.*;
import com.coresolution.core.service.TenantPgConfigurationService;
import com.coresolution.core.security.TenantAccessControlService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 테넌트 PG 설정 API 컨트롤러
 * 테넌트 포털에서 사용하는 PG 설정 관리 API
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/pg-configurations")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "테넌트 PG 설정", description = "테넌트 포털 PG 설정 관리 API")
public class TenantPgConfigurationController {
    
    private final TenantPgConfigurationService pgConfigurationService;
    private final TenantAccessControlService accessControlService;
    
    /**
     * 테넌트 PG 설정 목록 조회
     */
    @Operation(
            summary = "PG 설정 목록 조회",
            description = "테넌트의 PG 설정 목록을 조회합니다. 상태 및 승인 상태로 필터링 가능합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @GetMapping
    public ResponseEntity<List<TenantPgConfigurationResponse>> getConfigurations(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 상태 (필터)") @RequestParam(required = false) PgConfigurationStatus status,
            @Parameter(description = "승인 상태 (필터)") @RequestParam(required = false) ApprovalStatus approvalStatus) {
        
        log.debug("PG 설정 목록 조회 요청: tenantId={}, status={}, approvalStatus={}", 
                tenantId, status, approvalStatus);
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        List<TenantPgConfigurationResponse> configurations = 
                pgConfigurationService.getConfigurations(tenantId, status, approvalStatus);
        
        return ResponseEntity.ok(configurations);
    }
    
    /**
     * 테넌트 PG 설정 상세 조회
     */
    @Operation(
            summary = "PG 설정 상세 조회",
            description = "특정 PG 설정의 상세 정보와 변경 이력을 조회합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationDetailResponse.class))),
            @ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @GetMapping("/{configId}")
    public ResponseEntity<TenantPgConfigurationDetailResponse> getConfigurationDetail(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        
        log.debug("PG 설정 상세 조회 요청: tenantId={}, configId={}", tenantId, configId);
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        TenantPgConfigurationDetailResponse response = 
                pgConfigurationService.getConfigurationDetail(tenantId, configId);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 테넌트 PG 설정 생성 (입력)
     */
    @Operation(
            summary = "PG 설정 생성",
            description = "새로운 PG 설정을 생성합니다. 생성 후 승인 대기 상태가 됩니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "생성 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (필수 필드 누락 등)"),
            @ApiResponse(responseCode = "409", description = "이미 활성화된 PG 설정 존재")
    })
    @PostMapping
    public ResponseEntity<TenantPgConfigurationResponse> createConfiguration(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Valid @RequestBody TenantPgConfigurationRequest request) {
        
        log.info("PG 설정 생성 요청: tenantId={}, pgProvider={}", tenantId, request.getPgProvider());
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        // 현재 사용자 정보 가져오기
        String requestedBy = accessControlService.getCurrentUserId();
        if (requestedBy == null) {
            requestedBy = "anonymous";
        }
        
        TenantPgConfigurationResponse response = 
                pgConfigurationService.createConfiguration(tenantId, request, requestedBy);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * 테넌트 PG 설정 수정
     */
    @Operation(
            summary = "PG 설정 수정",
            description = "기존 PG 설정을 수정합니다. 수정 시 재승인이 필요합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "수정 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PutMapping("/{configId}")
    public ResponseEntity<TenantPgConfigurationResponse> updateConfiguration(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId,
            @Valid @RequestBody TenantPgConfigurationRequest request) {
        
        log.info("PG 설정 수정 요청: tenantId={}, configId={}", tenantId, configId);
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        TenantPgConfigurationResponse response = 
                pgConfigurationService.updateConfiguration(tenantId, configId, request);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 테넌트 PG 설정 삭제
     */
    @Operation(
            summary = "PG 설정 삭제",
            description = "PG 설정을 삭제합니다. (소프트 삭제)"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "삭제 성공"),
            @ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @DeleteMapping("/{configId}")
    public ResponseEntity<Void> deleteConfiguration(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        
        log.info("PG 설정 삭제 요청: tenantId={}, configId={}", tenantId, configId);
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        pgConfigurationService.deleteConfiguration(tenantId, configId);
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * PG 연결 테스트
     */
    @Operation(
            summary = "PG 연결 테스트",
            description = "PG 설정의 연결을 테스트합니다. API Key와 Secret Key를 사용하여 실제 PG 서버와의 연결을 확인합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "테스트 완료",
                    content = @Content(schema = @Schema(implementation = ConnectionTestResponse.class))),
            @ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PostMapping("/{configId}/test-connection")
    public ResponseEntity<ConnectionTestResponse> testConnection(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        
        log.info("PG 연결 테스트 요청: tenantId={}, configId={}", tenantId, configId);
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        ConnectionTestResponse response = 
                pgConfigurationService.testConnection(tenantId, configId);
        
        return ResponseEntity.ok(response);
    }
    
}

