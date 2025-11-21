package com.coresolution.core.controller.ops;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.controller.dto.ops.FeatureFlagCreateRequest;
import com.coresolution.core.controller.dto.ops.FeatureFlagToggleRequest;
import com.coresolution.core.domain.ops.FeatureFlag;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.ops.FeatureFlagService;
import com.coresolution.consultation.exception.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

/**
 * Ops 포털 Feature Flag 관리 API 컨트롤러
 * Feature Flag CRUD 및 상태 관리 API
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ops/feature-flags")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
public class FeatureFlagOpsController extends BaseApiController {
    
    private final FeatureFlagService featureFlagService;
    
    /**
     * 모든 Feature Flag 목록 조회
     * GET /api/ops/feature-flags
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FeatureFlag>>> getAll() {
        log.debug("모든 Feature Flag 목록 조회");
        List<FeatureFlag> flags = featureFlagService.findAll();
        return success(flags);
    }
    
    /**
     * 활성화된 Feature Flag 목록 조회
     * GET /api/v1/ops/feature-flags/enabled
     */
    @GetMapping("/enabled")
    public ResponseEntity<ApiResponse<List<FeatureFlag>>> getEnabled() {
        log.debug("활성화된 Feature Flag 목록 조회");
        List<FeatureFlag> flags = featureFlagService.findAllEnabled();
        return success(flags);
    }
    
    /**
     * flag_key로 Feature Flag 조회
     * GET /api/v1/ops/feature-flags/key/{flagKey}
     */
    @GetMapping("/key/{flagKey}")
    public ResponseEntity<ApiResponse<FeatureFlag>> getByFlagKey(@PathVariable String flagKey) {
        log.debug("Feature Flag 조회: flagKey={}", flagKey);
        FeatureFlag flag = featureFlagService.findByFlagKey(flagKey)
            .orElseThrow(() -> new EntityNotFoundException("Feature Flag를 찾을 수 없습니다: " + flagKey));
        return success(flag);
    }
    
    /**
     * Feature Flag 생성
     * POST /api/v1/ops/feature-flags
     */
    @PostMapping
    public ResponseEntity<ApiResponse<FeatureFlag>> create(@RequestBody @Valid FeatureFlagCreateRequest request) {
        log.info("Feature Flag 생성 요청: flagKey={}", request.flagKey());
        
        Instant expiresAt = null;
        if (request.expiresAt() != null && !request.expiresAt().isBlank()) {
            try {
                expiresAt = Instant.parse(request.expiresAt());
            } catch (java.time.format.DateTimeParseException e) {
                throw new IllegalArgumentException("expiresAt은 ISO-8601 형식이어야 합니다.");
            }
        }
        
        FeatureFlag created = featureFlagService.create(
            request.flagKey(),
            request.description(),
            request.targetScope(),
            expiresAt
        );
        
        return created("Feature Flag가 생성되었습니다.", created);
    }
    
    /**
     * Feature Flag 상태 변경
     * POST /api/v1/ops/feature-flags/{flagId}/toggle
     */
    @PostMapping("/{flagId}/toggle")
    public ResponseEntity<ApiResponse<FeatureFlag>> toggle(
            @PathVariable Long flagId,
            @RequestBody @Valid FeatureFlagToggleRequest request) {
        log.info("Feature Flag 상태 변경 요청: flagId={}, state={}", flagId, request.state());
        
        FeatureFlag updated = featureFlagService.toggle(flagId, request.state());
        
        return updated("Feature Flag 상태가 변경되었습니다.", updated);
    }
}

