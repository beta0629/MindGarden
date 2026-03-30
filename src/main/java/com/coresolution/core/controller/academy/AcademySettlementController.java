package com.coresolution.core.controller.academy;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.constant.AcademyPermissionConstants;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.academy.*;
import com.coresolution.core.service.academy.AcademySettlementService;
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
 * 학원 정산 관리 컨트롤러
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/academy/settlements")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AcademySettlementController extends BaseApiController {
    
    private final AcademySettlementService settlementService;
    private final DynamicPermissionService dynamicPermissionService;
    
    // ==================== 정산 관리 ====================
    
    /**
     * 정산 목록 조회
     * GET /api/v1/academy/settlements
     */
    @GetMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<SettlementResponse>>> getSettlements(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String settlementPeriod,
            @RequestParam(required = false) SettlementResponse.SettlementStatus status,
            HttpSession session) {
        log.debug("정산 목록 조회 요청: branchId={}, period={}, status={}", branchId, settlementPeriod, status);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<SettlementResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<SettlementResponse> settlements = settlementService.getSettlements(tenantId, branchId, settlementPeriod, status);
        return success(settlements);
    }
    
    /**
     * 정산 상세 조회
     * GET /api/v1/academy/settlements/{settlementId}
     */
    @GetMapping("/{settlementId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<SettlementResponse>> getSettlement(
            @PathVariable String settlementId,
            HttpSession session) {
        log.debug("정산 상세 조회: settlementId={}", settlementId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<SettlementResponse>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        SettlementResponse settlement = settlementService.getSettlement(tenantId, settlementId);
        return success(settlement);
    }
    
    /**
     * 정산 계산 및 생성
     * POST /api/v1/academy/settlements/calculate
     */
    @PostMapping("/calculate")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<SettlementResponse>> calculateSettlement(
            @Valid @RequestBody SettlementCalculateRequest request,
            HttpSession session) {
        log.info("정산 계산 요청: period={}, branchId={}", request.getSettlementPeriod(), request.getBranchId());
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<SettlementResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        SettlementResponse settlement = settlementService.calculateSettlement(
            tenantId, 
            request, 
            currentUser.getEmail()
        );
        return created("정산이 계산되었습니다.", settlement);
    }
    
    /**
     * 정산 승인
     * POST /api/v1/academy/settlements/{settlementId}/approve
     */
    @PostMapping("/{settlementId}/approve")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<SettlementResponse>> approveSettlement(
            @PathVariable String settlementId,
            HttpSession session) {
        log.info("정산 승인 요청: settlementId={}", settlementId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<SettlementResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        SettlementResponse settlement = settlementService.approveSettlement(tenantId, settlementId, currentUser.getEmail());
        return success("정산이 승인되었습니다.", settlement);
    }
    
    /**
     * 정산 지급 완료 처리
     * POST /api/v1/academy/settlements/{settlementId}/pay
     */
    @PostMapping("/{settlementId}/pay")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<SettlementResponse>> markSettlementAsPaid(
            @PathVariable String settlementId,
            HttpSession session) {
        log.info("정산 지급 완료 처리 요청: settlementId={}", settlementId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<SettlementResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        SettlementResponse settlement = settlementService.markSettlementAsPaid(tenantId, settlementId, currentUser.getEmail());
        return success("정산 지급이 완료되었습니다.", settlement);
    }
    
    /**
     * 정산 취소
     * POST /api/v1/academy/settlements/{settlementId}/cancel
     */
    @PostMapping("/{settlementId}/cancel")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<SettlementResponse>> cancelSettlement(
            @PathVariable String settlementId,
            HttpSession session) {
        log.info("정산 취소 요청: settlementId={}", settlementId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<SettlementResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        SettlementResponse settlement = settlementService.cancelSettlement(tenantId, settlementId, currentUser.getEmail());
        return success("정산이 취소되었습니다.", settlement);
    }
    
    // ==================== 정산 항목 관리 ====================
    
    /**
     * 정산 항목 목록 조회
     * GET /api/v1/academy/settlements/{settlementId}/items
     */
    @GetMapping("/{settlementId}/items")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<SettlementItemResponse>>> getSettlementItems(
            @PathVariable String settlementId,
            HttpSession session) {
        log.debug("정산 항목 목록 조회: settlementId={}", settlementId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<SettlementItemResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<SettlementItemResponse> items = settlementService.getSettlementItems(tenantId, settlementId);
        return success(items);
    }
    
    /**
     * 정산 항목 상세 조회
     * GET /api/v1/academy/settlements/items/{settlementItemId}
     */
    @GetMapping("/items/{settlementItemId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<SettlementItemResponse>> getSettlementItem(
            @PathVariable String settlementItemId,
            HttpSession session) {
        log.debug("정산 항목 상세 조회: settlementItemId={}", settlementItemId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<SettlementItemResponse>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        SettlementItemResponse item = settlementService.getSettlementItem(tenantId, settlementItemId);
        return success(item);
    }
}

