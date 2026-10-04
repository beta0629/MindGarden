package com.coresolution.core.controller;

import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.ErdDiagramHistoryResponse;
import com.coresolution.core.dto.ErdDiagramResponse;
import com.coresolution.core.service.ErdGenerationService;
import com.coresolution.core.service.ErdHistoryService;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ERD 조회 API 컨트롤러
 * 테넌트 포털에서 사용하는 ERD 조회 API
 *
 * <p>세션 테넌트의 관리자만 자기 테넌트 ERD 를 본다. 경로 tenantId 는 세션 테넌트와 대조만 하며,
 * 다르거나 다른 테넌트 다이어그램이면 {@link ResourceOwnerAccessGuard} 공통 403 으로 거부한다.</p>
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/erd")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "테넌트 ERD", description = "테넌트 포털 ERD 조회 API")
public class ErdController extends BaseApiController {
    
    private final ErdGenerationService erdGenerationService;
    private final ErdHistoryService erdHistoryService;
    private final ResourceOwnerAccessGuard resourceOwnerAccessGuard;
    
    /**
     * 테넌트 ERD 목록 조회
     */
    @Operation(
            summary = "테넌트 ERD 목록 조회",
            description = "테넌트의 ERD 목록을 조회합니다. 공개된 ERD만 조회됩니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ErdDiagramResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 실패"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<List<ErdDiagramResponse>>> getTenantErds(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            HttpSession session) {
        String sessionTenantId = resourceOwnerAccessGuard.requireOwnTenantErdAccess(session, tenantId);
        List<ErdDiagramResponse> erds = erdGenerationService.getTenantErds(sessionTenantId);
        log.debug("테넌트 ERD 목록 조회 완료: count={}", erds.size());
        return success(erds);
    }
    
    /**
     * ERD 상세 조회
     */
    @Operation(
            summary = "ERD 상세 조회",
            description = "특정 ERD의 상세 정보를 조회합니다. Mermaid 코드와 텍스트 ERD를 포함합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ErdDiagramResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "없거나 다른 테넌트의 ERD")
    })
    @GetMapping("/{diagramId}")
    public ResponseEntity<ApiResponse<ErdDiagramResponse>> getErdDetail(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "ERD 다이어그램 ID", required = true) @PathVariable String diagramId,
            HttpSession session) {
        resourceOwnerAccessGuard.requireErdDiagramAccess(session, tenantId, diagramId);
        ErdDiagramResponse erd = erdGenerationService.getErd(diagramId);
        return success(erd);
    }
    
    /**
     * ERD 변경 이력 조회
     */
    @Operation(
            summary = "ERD 변경 이력 조회",
            description = "ERD의 변경 이력을 조회합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ErdDiagramHistoryResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "없거나 다른 테넌트의 ERD")
    })
    @GetMapping("/{diagramId}/history")
    public ResponseEntity<ApiResponse<List<ErdDiagramHistoryResponse>>> getErdHistory(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "ERD 다이어그램 ID", required = true) @PathVariable String diagramId,
            HttpSession session) {
        resourceOwnerAccessGuard.requireErdDiagramAccess(session, tenantId, diagramId);
        List<ErdDiagramHistoryResponse> history = erdHistoryService.getHistoryByDiagramId(diagramId);
        return success(history);
    }
}
