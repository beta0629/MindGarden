package com.coresolution.core.controller;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.dto.*;
import com.coresolution.core.service.TenantPgConfigurationService;
import com.coresolution.core.security.TenantAccessControlService;
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
 * 테넌트 PG 설정 API 컨트롤러
 * 테넌트 포털에서 사용하는 PG 설정 관리 API
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/pg-configurations")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "테넌트 PG 설정", description = "테넌트 포털 PG 설정 관리 API")
public class TenantPgConfigurationController extends BaseApiController {
    
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
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 실패"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<List<TenantPgConfigurationResponse>>> getConfigurations(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 상태 (필터)") @RequestParam(required = false) PgConfigurationStatus status,
            @Parameter(description = "승인 상태 (필터)") @RequestParam(required = false) ApprovalStatus approvalStatus) {
        
        log.debug("PG 설정 목록 조회 요청: tenantId={}, status={}, approvalStatus={}", 
                tenantId, status, approvalStatus);
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        List<TenantPgConfigurationResponse> configurations = 
                pgConfigurationService.getConfigurations(tenantId, status, approvalStatus);
        
        return success(configurations);
    }
    
    /**
     * 테넌트 PG 설정 상세 조회
     */
    @Operation(
            summary = "PG 설정 상세 조회",
            description = "특정 PG 설정의 상세 정보와 변경 이력을 조회합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationDetailResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @GetMapping("/{configId}")
    public ResponseEntity<ApiResponse<TenantPgConfigurationDetailResponse>> getConfigurationDetail(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        
        log.debug("PG 설정 상세 조회 요청: tenantId={}, configId={}", tenantId, configId);
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        TenantPgConfigurationDetailResponse response = 
                pgConfigurationService.getConfigurationDetail(tenantId, configId);
        
        if (response == null) {
            throw new EntityNotFoundException("PG 설정을 찾을 수 없습니다: " + configId);
        }
        
        return success(response);
    }
    
    /**
     * 테넌트 PG 설정 생성 (입력)
     */
    @Operation(
            summary = "PG 설정 생성",
            description = "새로운 PG 설정을 생성합니다. 생성 후 승인 대기 상태가 됩니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "생성 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (필수 필드 누락 등)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "이미 활성화된 PG 설정 존재")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<TenantPgConfigurationResponse>> createConfiguration(
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
        
        return created("PG 설정이 생성되었습니다.", response);
    }
    
    /**
     * 테넌트 PG 설정 수정
     */
    @Operation(
            summary = "PG 설정 수정",
            description = "기존 PG 설정을 수정합니다. 수정 시 재승인이 필요합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "수정 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PutMapping("/{configId}")
    public ResponseEntity<ApiResponse<TenantPgConfigurationResponse>> updateConfiguration(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId,
            @Valid @RequestBody TenantPgConfigurationRequest request) {
        
        log.info("PG 설정 수정 요청: tenantId={}, configId={}", tenantId, configId);
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        TenantPgConfigurationResponse response = 
                pgConfigurationService.updateConfiguration(tenantId, configId, request);
        
        return updated("PG 설정이 수정되었습니다.", response);
    }

    /**
     * PG 설정 테스트 모드 즉시 반영 (승인 리셋 없음)
     */
    @Operation(
            summary = "PG 테스트 모드 변경",
            description = "testMode 만 즉시 갱신합니다. 전체 수정(PUT)과 달리 재승인 대기로 되돌리지 않습니다. "
                    + "IAMPORT 에서 테스트 모드 OFF 시 라이브 channelKey 가 없으면 거부합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "변경 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "검증 실패 (라이브 channelKey 누락 등)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PatchMapping("/{configId}/test-mode")
    public ResponseEntity<ApiResponse<TenantPgConfigurationResponse>> patchTestMode(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId,
            @Valid @RequestBody PgConfigurationTestModePatchRequest request) {

        log.info("PG 테스트 모드 변경 요청: tenantId={}, configId={}, testMode={}",
                tenantId, configId, request.getTestMode());

        accessControlService.validateTenantAccess(tenantId);

        TenantPgConfigurationResponse response =
                pgConfigurationService.patchTestMode(tenantId, configId, request.getTestMode());

        return updated("테스트 모드가 반영되었습니다.", response);
    }
    
    /**
     * 테넌트 PG 설정 삭제
     */
    @Operation(
            summary = "PG 설정 삭제",
            description = "PG 설정을 삭제합니다. (소프트 삭제)"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "삭제 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @DeleteMapping("/{configId}")
    public ResponseEntity<ApiResponse<Void>> deleteConfiguration(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        
        log.info("PG 설정 삭제 요청: tenantId={}, configId={}", tenantId, configId);
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        pgConfigurationService.deleteConfiguration(tenantId, configId);
        
        return deleted("PG 설정이 삭제되었습니다.");
    }
    
    /**
     * PG 연결 테스트
     */
    @Operation(
            summary = "PG 연결 테스트",
            description = "PG 설정의 연결을 테스트합니다. API Key와 Secret Key를 사용하여 실제 PG 서버와의 연결을 확인합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "테스트 완료",
                    content = @Content(schema = @Schema(implementation = ConnectionTestResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PostMapping("/{configId}/test-connection")
    public ResponseEntity<ApiResponse<ConnectionTestResponse>> testConnection(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        
        log.info("PG 연결 테스트 요청: tenantId={}, configId={}", tenantId, configId);
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        ConnectionTestResponse response = 
                pgConfigurationService.testConnection(tenantId, configId);
        
        return success(response);
    }

    /**
     * 포트원 V2 브라우저 SDK 용 공개 클라이언트 설정(시크릿 미포함).
     * ACTIVE+APPROVED IAMPORT 설정의 storeId·channelKey(testMode 해석)·testMode 만 반환한다.
     */
    @Operation(
            summary = "포트원 클라이언트 설정 조회",
            description = "브라우저 requestPayment 에 필요한 storeId·channelKey 를 반환합니다. API Secret/웹훅 시크릿은 포함하지 않습니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = PortOneClientConfigResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "ACTIVE 설정 또는 channelKey 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @GetMapping("/active/portone-client-config")
    public ResponseEntity<ApiResponse<PortOneClientConfigResponse>> getActivePortOneClientConfig(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId) {

        log.debug("포트원 클라이언트 설정 조회 요청: tenantId={}", tenantId);
        accessControlService.validateTenantAccess(tenantId);

        PortOneClientConfigResponse response =
                pgConfigurationService.getActivePortOneClientConfig(tenantId);
        return success(response);
    }
    
}

