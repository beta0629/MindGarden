package com.coresolution.core.controller;

import com.coresolution.core.dto.ErdDiagramHistoryResponse;
import com.coresolution.core.dto.ErdDiagramResponse;
import com.coresolution.core.service.ErdGenerationService;
import com.coresolution.core.service.ErdHistoryService;
import com.coresolution.core.context.TenantContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/erd")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "테넌트 ERD", description = "테넌트 포털 ERD 조회 API")
public class ErdController {
    
    private final ErdGenerationService erdGenerationService;
    private final ErdHistoryService erdHistoryService;
    
    /**
     * 테넌트 ERD 목록 조회
     */
    @Operation(
            summary = "테넌트 ERD 목록 조회",
            description = "테넌트의 ERD 목록을 조회합니다. 공개된 ERD만 조회됩니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ErdDiagramResponse.class))),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @GetMapping
    public ResponseEntity<List<ErdDiagramResponse>> getTenantErds(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId) {
        
        log.debug("테넌트 ERD 목록 조회 요청: tenantId={}", tenantId);
        
        // 테넌트 권한 확인
        validateTenantAccess(tenantId);
        
        List<ErdDiagramResponse> erds = erdGenerationService.getTenantErds(tenantId);
        
        return ResponseEntity.ok(erds);
    }
    
    /**
     * ERD 상세 조회
     */
    @Operation(
            summary = "ERD 상세 조회",
            description = "특정 ERD의 상세 정보를 조회합니다. Mermaid 코드와 텍스트 ERD를 포함합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ErdDiagramResponse.class))),
            @ApiResponse(responseCode = "404", description = "ERD를 찾을 수 없음"),
            @ApiResponse(responseCode = "403", description = "권한 없음 (다른 테넌트의 ERD)")
    })
    @GetMapping("/{diagramId}")
    public ResponseEntity<ErdDiagramResponse> getErdDetail(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "ERD 다이어그램 ID", required = true) @PathVariable String diagramId) {
        
        log.debug("ERD 상세 조회 요청: tenantId={}, diagramId={}", tenantId, diagramId);
        
        // 테넌트 권한 확인
        validateTenantAccess(tenantId);
        
        ErdDiagramResponse erd = erdGenerationService.getErd(diagramId);
        
        // 테넌트 소유권 확인
        if (erd.getTenantId() != null && !erd.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("해당 테넌트의 ERD가 아닙니다");
        }
        
        // 공개 ERD인지 확인 (테넌트 ERD는 공개)
        if (erd.getTenantId() == null && !erd.getIsPublic()) {
            throw new IllegalArgumentException("공개되지 않은 ERD입니다");
        }
        
        return ResponseEntity.ok(erd);
    }
    
    /**
     * ERD 변경 이력 조회
     */
    @Operation(
            summary = "ERD 변경 이력 조회",
            description = "ERD의 변경 이력을 조회합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ErdDiagramHistoryResponse.class))),
            @ApiResponse(responseCode = "404", description = "ERD를 찾을 수 없음")
    })
    @GetMapping("/{diagramId}/history")
    public ResponseEntity<List<ErdDiagramHistoryResponse>> getErdHistory(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "ERD 다이어그램 ID", required = true) @PathVariable String diagramId) {
        
        log.debug("ERD 변경 이력 조회 요청: tenantId={}, diagramId={}", tenantId, diagramId);
        
        // 테넌트 권한 확인
        validateTenantAccess(tenantId);
        
        // ERD 존재 및 소유권 확인
        ErdDiagramResponse erd = erdGenerationService.getErd(diagramId);
        if (erd.getTenantId() != null && !erd.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("해당 테넌트의 ERD가 아닙니다");
        }
        
        List<ErdDiagramHistoryResponse> history = erdHistoryService.getHistoryByDiagramId(diagramId);
        
        return ResponseEntity.ok(history);
    }
    
    // ==================== Private Helper Methods ====================
    
    /**
     * 테넌트 접근 권한 확인
     */
    private void validateTenantAccess(String tenantId) {
        String currentTenantId = TenantContextHolder.getTenantId();
        
        if (currentTenantId == null) {
            throw new IllegalStateException("테넌트 컨텍스트가 설정되지 않았습니다");
        }
        
        if (!currentTenantId.equals(tenantId)) {
            throw new IllegalArgumentException("해당 테넌트에 대한 접근 권한이 없습니다");
        }
    }
}

