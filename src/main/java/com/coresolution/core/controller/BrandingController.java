package com.coresolution.core.controller;

import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.BrandingInfo;
import com.coresolution.core.dto.BrandingUpdateRequest;
import com.coresolution.core.service.BrandingService;
import com.coresolution.core.context.TenantContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.utils.SessionUtils;
import jakarta.servlet.http.HttpSession;

/**
 * 브랜딩 관리 API 컨트롤러
 * 테넌트별 로고, 상호명 등 브랜딩 정보를 관리하는 REST API
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-27
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/admin/branding", "/api/admin/branding"})
@RequiredArgsConstructor
@Tag(name = "Branding", description = "브랜딩 관리 API")
public class BrandingController extends BaseApiController {
    
    private final BrandingService brandingService;
    
    /**
     * 현재 테넌트의 브랜딩 정보 조회
     */
    @GetMapping
    @Operation(summary = "브랜딩 정보 조회", description = "현재 테넌트의 브랜딩 정보를 조회합니다")
    public ResponseEntity<ApiResponse<BrandingInfo>> getBrandingInfo(HttpSession session, Authentication authentication) {
        // 세션에서 사용자 정보를 통해 tenantId 조회 (가장 확실한 방법)
        User currentUser = SessionUtils.getCurrentUser(session);
        
        if (currentUser == null) {
            log.error("세션에 사용자 정보가 없습니다.");
            throw new IllegalStateException("로그인이 필요합니다.");
        }
        
        String tenantId = currentUser.getTenantId();
        
        if (tenantId == null || tenantId.isEmpty()) {
            log.error("사용자에게 tenantId가 없습니다: userId={}, email={}", 
                currentUser.getId(), currentUser.getEmail());
            throw new IllegalStateException("테넌트 정보를 찾을 수 없습니다. 관리자에게 문의해주세요.");
        }
        
        log.info("브랜딩 정보 조회 요청: tenantId={}", tenantId);
        
        BrandingInfo brandingInfo = brandingService.getBrandingInfo(tenantId);
        return success(brandingInfo);
    }
    
    /**
     * 특정 테넌트의 브랜딩 정보 조회 (관리자용)
     */
    @GetMapping("/{tenantId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('HQ_ADMIN')")
    @Operation(summary = "특정 테넌트 브랜딩 정보 조회", description = "관리자가 특정 테넌트의 브랜딩 정보를 조회합니다")
    public ResponseEntity<ApiResponse<BrandingInfo>> getBrandingInfoByTenantId(
            @Parameter(description = "테넌트 ID") @PathVariable String tenantId) {
        log.info("특정 테넌트 브랜딩 정보 조회 요청: tenantId={}", tenantId);
        
        BrandingInfo brandingInfo = brandingService.getBrandingInfo(tenantId);
        return success(brandingInfo);
    }
    
    /**
     * 브랜딩 정보 업데이트 (로고 제외)
     */
    @PutMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('BRANCH_ADMIN') or hasRole('BRANCH_SUPER_ADMIN')")
    @Operation(summary = "브랜딩 정보 업데이트", description = "테넌트의 브랜딩 정보를 업데이트합니다 (로고 제외)")
    public ResponseEntity<ApiResponse<BrandingInfo>> updateBrandingInfo(
            @Parameter(description = "브랜딩 정보 업데이트 요청") @Valid @RequestBody BrandingUpdateRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("브랜딩 정보 업데이트 요청: tenantId={}, request={}", tenantId, request);
        
        BrandingInfo updatedBranding = brandingService.updateBrandingInfo(tenantId, request);
        return updated(updatedBranding);
    }
    
    /**
     * 로고 업로드
     */
    @PostMapping(value = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('BRANCH_ADMIN') or hasRole('BRANCH_SUPER_ADMIN')")
    @Operation(summary = "로고 업로드", description = "테넌트의 로고를 업로드합니다")
    public ResponseEntity<ApiResponse<BrandingInfo>> uploadLogo(
            @Parameter(description = "로고 이미지 파일 (PNG, JPG, SVG, 최대 5MB)")
            @RequestParam("logo") MultipartFile logoFile) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("로고 업로드 요청: tenantId={}, fileName={}, size={}", 
            tenantId, logoFile.getOriginalFilename(), logoFile.getSize());
        
        BrandingInfo updatedBranding = brandingService.uploadLogo(tenantId, logoFile);
        return success("로고가 업로드되었습니다.", updatedBranding);
    }
    
    /**
     * 특정 테넌트의 로고 업로드 (관리자용)
     */
    @PostMapping(value = "/{tenantId}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('HQ_ADMIN')")
    @Operation(summary = "특정 테넌트 로고 업로드", description = "관리자가 특정 테넌트의 로고를 업로드합니다")
    public ResponseEntity<ApiResponse<BrandingInfo>> uploadLogoForTenant(
            @Parameter(description = "테넌트 ID") @PathVariable String tenantId,
            @Parameter(description = "로고 이미지 파일 (PNG, JPG, SVG, 최대 5MB)")
            @RequestParam("logo") MultipartFile logoFile) {
        log.info("특정 테넌트 로고 업로드 요청: tenantId={}, fileName={}, size={}", 
            tenantId, logoFile.getOriginalFilename(), logoFile.getSize());
        
        BrandingInfo updatedBranding = brandingService.uploadLogo(tenantId, logoFile);
        return success("로고가 업로드되었습니다.", updatedBranding);
    }
    
    /**
     * 특정 테넌트의 브랜딩 정보 업데이트 (관리자용)
     */
    @PutMapping("/{tenantId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('HQ_ADMIN')")
    @Operation(summary = "특정 테넌트 브랜딩 정보 업데이트", description = "관리자가 특정 테넌트의 브랜딩 정보를 업데이트합니다")
    public ResponseEntity<ApiResponse<BrandingInfo>> updateBrandingInfoForTenant(
            @Parameter(description = "테넌트 ID") @PathVariable String tenantId,
            @Parameter(description = "브랜딩 정보 업데이트 요청") @Valid @RequestBody BrandingUpdateRequest request) {
        log.info("특정 테넌트 브랜딩 정보 업데이트 요청: tenantId={}, request={}", tenantId, request);
        
        BrandingInfo updatedBranding = brandingService.updateBrandingInfo(tenantId, request);
        return updated(updatedBranding);
    }
}
