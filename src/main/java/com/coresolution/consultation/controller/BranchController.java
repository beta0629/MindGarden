package com.coresolution.consultation.controller;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.constant.AdminConstants;
import com.coresolution.consultation.dto.BranchCreateRequest;
import com.coresolution.consultation.dto.BranchResponse;
import com.coresolution.consultation.dto.BranchUpdateRequest;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 지점 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/branches", "/api/branches"}) // v1 경로 추가, 레거시 경로 유지
@RequiredArgsConstructor
public class BranchController extends BaseApiController {
    
    private final BranchService branchService;
    private final DynamicPermissionService dynamicPermissionService;
    
    // === 기본 CRUD API ===
    
    /**
     * 지점 생성
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BranchResponse>> createBranch(
            @Valid @RequestBody BranchCreateRequest request,
            jakarta.servlet.http.HttpSession session) {
        log.info("지점 생성 요청: {}", request.getBranchName());
        
        // 동적 권한 체크
        User currentUser = (User) session.getAttribute("user");
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("인증이 필요합니다.");
        }
        
        if (!dynamicPermissionService.hasPermission(currentUser, "BRANCH_MANAGE")) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }
        
        BranchResponse response = branchService.createBranch(request);
        return created("지점이 생성되었습니다.", response);
    }
    
    
    /**
     * 테스트용 본점 생성 (권한 없음)
     */
    @PostMapping("/test-create-main")
    public ResponseEntity<ApiResponse<BranchResponse>> createTestMainBranch() {
        log.info("테스트 본점 생성 요청");
        
        BranchCreateRequest request = new BranchCreateRequest();
        request.setBranchName("본점");
        request.setBranchCode(AdminConstants.DEFAULT_BRANCH_CODE);
        request.setBranchType(Branch.BranchType.MAIN);
        request.setAddress("서울시 강남구");
        request.setPhoneNumber("02-1234-5678");
        request.setEmail("main@mindgarden.com");
        
        BranchResponse response = branchService.createBranch(request);
        return created("본점이 생성되었습니다.", response);
    }
    
    /**
     * 지점 조회
     */
    @GetMapping("/{branchId}")
    public ResponseEntity<ApiResponse<BranchResponse>> getBranch(@PathVariable Long branchId) {
        log.info("지점 조회 요청: ID={}", branchId);
        
        BranchResponse response = branchService.getBranchResponse(branchId);
        return success(response);
    }
    
    /**
     * 지점 수정
     */
    @PutMapping("/{branchId}")
    public ResponseEntity<ApiResponse<BranchResponse>> updateBranch(
            @PathVariable Long branchId,
            @Valid @RequestBody BranchUpdateRequest request) {
        log.info("지점 수정 요청: ID={}", branchId);
        
        BranchResponse response = branchService.updateBranch(branchId, request);
        return updated("지점이 수정되었습니다.", response);
    }
    
    /**
     * 지점 삭제
     */
    @DeleteMapping("/{branchId}")
    public ResponseEntity<ApiResponse<Void>> deleteBranch(@PathVariable Long branchId) {
        log.info("지점 삭제 요청: ID={}", branchId);
        
        branchService.softDeleteById(branchId);
        return deleted("지점이 삭제되었습니다.");
    }
    
    // === 조회 API ===
    
    /**
     * 모든 활성 지점 조회 (모든 사용자 접근 가능)
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getActiveBranches() {
        log.info("활성 지점 목록 조회 요청");
        
        List<BranchResponse> branches = branchService.getAllActiveBranches();
        return success(branches);
    }
    
    /**
     * 지점 페이징 조회 (branches 테이블 기반)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getBranches() {
        log.info("지점 목록 조회 요청 (branches 테이블 기반)");
        
        // branches 테이블에서 지점 목록 조회
        List<BranchResponse> branches = branchService.getAllActiveBranches();
        
        log.info("지점 목록 조회 완료: {}개", branches.size());
        return success(branches);
    }
    
    /**
     * 지점 검색
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> searchBranches(
            @RequestParam("keyword") String keyword) {
        log.info("지점 검색 요청: {}", keyword);
        
        List<BranchResponse> branches = branchService.searchBranches(keyword);
        return success(branches);
    }
    
    /**
     * 지점 검색 (페이징)
     */
    @GetMapping("/search/paged")
    public ResponseEntity<ApiResponse<Page<BranchResponse>>> searchBranchesWithPaging(
            @RequestParam("keyword") String keyword,
            Pageable pageable) {
        log.info("지점 페이징 검색 요청: {}, {}", keyword, pageable);
        
        Page<BranchResponse> branches = branchService.searchBranchesWithPaging(keyword, pageable);
        return success(branches);
    }
    
    /**
     * 지점 유형별 조회
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getBranchesByType(
            @PathVariable Branch.BranchType type) {
        log.info("지점 유형별 조회 요청: {}", type);
        
        List<BranchResponse> branches = branchService.getBranchesByType(type);
        return success(branches);
    }
    
    /**
     * 지점 상태별 조회
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getBranchesByStatus(
            @PathVariable Branch.BranchStatus status) {
        log.info("지점 상태별 조회 요청: {}", status);
        
        List<BranchResponse> branches = branchService.getBranchesByStatus(status);
        return success(branches);
    }
    
    /**
     * 본점들 조회
     */
    @GetMapping("/main")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getMainBranches() {
        log.info("본점 목록 조회 요청");
        
        List<BranchResponse> branches = branchService.getMainBranches();
        return success(branches);
    }
    
    /**
     * 하위 지점들 조회
     */
    @GetMapping("/{branchId}/sub-branches")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getSubBranches(@PathVariable Long branchId) {
        log.info("하위 지점 목록 조회 요청: 상위 지점 ID={}", branchId);
        
        List<BranchResponse> branches = branchService.getSubBranches(branchId);
        return success(branches);
    }
    
    /**
     * 지점 계층 구조 조회
     */
    @GetMapping("/hierarchy")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getBranchHierarchy() {
        log.info("지점 계층 구조 조회 요청");
        
        List<BranchResponse> hierarchy = branchService.getBranchHierarchy();
        return success(hierarchy);
    }
    
    // === 지점 관리 API ===
    
    /**
     * 지점장 지정
     */
    @PostMapping("/{branchId}/manager/{managerId}")
    public ResponseEntity<ApiResponse<Void>> assignManager(
            @PathVariable Long branchId,
            @PathVariable Long managerId) {
        log.info("지점장 지정 요청: 지점 ID={}, 지점장 ID={}", branchId, managerId);
        
        branchService.assignManager(branchId, managerId);
        return success("지점장이 지정되었습니다.");
    }
    
    /**
     * 지점장 해제
     */
    @DeleteMapping("/{branchId}/manager")
    public ResponseEntity<ApiResponse<Void>> removeManager(@PathVariable Long branchId) {
        log.info("지점장 해제 요청: 지점 ID={}", branchId);
        
        branchService.removeManager(branchId);
        return success("지점장이 해제되었습니다.");
    }
    
    /**
     * 지점 상태 변경
     */
    @PutMapping("/{branchId}/status/{status}")
    public ResponseEntity<ApiResponse<Void>> changeBranchStatus(
            @PathVariable Long branchId,
            @PathVariable Branch.BranchStatus status) {
        log.info("지점 상태 변경 요청: 지점 ID={}, 새 상태={}", branchId, status);
        
        branchService.changeBranchStatus(branchId, status);
        return success("지점 상태가 변경되었습니다.");
    }
    
    /**
     * 지점 활성화
     */
    @PostMapping("/{branchId}/activate")
    public ResponseEntity<ApiResponse<Void>> activateBranch(@PathVariable Long branchId) {
        log.info("지점 활성화 요청: 지점 ID={}", branchId);
        
        branchService.activateBranch(branchId);
        return success("지점이 활성화되었습니다.");
    }
    
    /**
     * 지점 비활성화
     */
    @PostMapping("/{branchId}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateBranch(@PathVariable Long branchId) {
        log.info("지점 비활성화 요청: 지점 ID={}", branchId);
        
        branchService.deactivateBranch(branchId);
        return success("지점이 비활성화되었습니다.");
    }
    
    /**
     * 지점 폐점
     */
    @PostMapping("/{branchId}/close")
    public ResponseEntity<ApiResponse<Void>> closeBranch(@PathVariable Long branchId) {
        log.info("지점 폐점 요청: 지점 ID={}", branchId);
        
        branchService.closeBranch(branchId);
        return success("지점이 폐점되었습니다.");
    }
    
    // === 사용자 관리 API ===
    
    /**
     * 지점에 상담사 할당
     */
    @PostMapping("/{branchId}/consultants/{consultantId}")
    public ResponseEntity<ApiResponse<Void>> assignConsultant(
            @PathVariable Long branchId,
            @PathVariable Long consultantId) {
        log.info("상담사 지점 할당 요청: 지점 ID={}, 상담사 ID={}", branchId, consultantId);
        
        branchService.assignConsultantToBranch(branchId, consultantId);
        return success("상담사가 지점에 할당되었습니다.");
    }
    
    /**
     * 지점에 내담자 할당
     */
    @PostMapping("/{branchId}/clients/{clientId}")
    public ResponseEntity<ApiResponse<Void>> assignClient(
            @PathVariable Long branchId,
            @PathVariable Long clientId) {
        log.info("내담자 지점 할당 요청: 지점 ID={}, 내담자 ID={}", branchId, clientId);
        
        branchService.assignClientToBranch(branchId, clientId);
        return success("내담자가 지점에 할당되었습니다.");
    }
    
    /**
     * 지점에서 사용자 제거
     */
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeUserFromBranch(@PathVariable Long userId) {
        log.info("사용자 지점 제거 요청: 사용자 ID={}", userId);
        
        branchService.removeUserFromBranch(userId);
        return success("사용자가 지점에서 제거되었습니다.");
    }
    
    /**
     * 지점 간 사용자 이동
     */
    @PostMapping("/users/{userId}/transfer")
    public ResponseEntity<ApiResponse<Void>> transferUser(
            @PathVariable Long userId,
            @RequestParam("fromBranch") Long fromBranchId,
            @RequestParam("toBranch") Long toBranchId) {
        log.info("사용자 지점 이동 요청: 사용자 ID={}, {} -> {}", userId, fromBranchId, toBranchId);
        
        branchService.transferUserBetweenBranches(userId, fromBranchId, toBranchId);
        return success("사용자가 지점 간 이동되었습니다.");
    }
    
    /**
     * 지점 소속 상담사 목록 조회
     */
    @GetMapping("/{branchId}/consultants")
    public ResponseEntity<ApiResponse<List<User>>> getBranchConsultants(@PathVariable Long branchId) {
        log.info("지점 소속 상담사 목록 조회 요청: 지점 ID={}", branchId);
        
        List<User> consultants = branchService.getBranchConsultants(branchId);
        return success(consultants);
    }
    
    /**
     * 지점 소속 내담자 목록 조회
     */
    @GetMapping("/{branchId}/clients")
    public ResponseEntity<ApiResponse<List<User>>> getBranchClients(@PathVariable Long branchId) {
        log.info("지점 소속 내담자 목록 조회 요청: 지점 ID={}", branchId);
        
        List<User> clients = branchService.getBranchClients(branchId);
        return success(clients);
    }
    
    // === 통계 API ===
    
    /**
     * 지점 통계 조회
     */
    @GetMapping("/{branchId}/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBranchStatistics(@PathVariable Long branchId) {
        log.info("지점 통계 조회 요청: 지점 ID={}", branchId);
        
        Map<String, Object> statistics = branchService.getBranchStatistics(branchId);
        return success(statistics);
    }
    
    /**
     * 전체 지점 통계 조회
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllBranchesStatistics() {
        log.info("전체 지점 통계 조회 요청");
        
        Map<String, Object> statistics = branchService.getAllBranchesStatistics();
        return success(statistics);
    }
    
    /**
     * 지점별 상담사 수 조회
     */
    @GetMapping("/statistics/consultants")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getConsultantCountByBranch() {
        log.info("지점별 상담사 수 조회 요청");
        
        Map<String, Integer> consultantCounts = branchService.getConsultantCountByBranch();
        return success(consultantCounts);
    }
    
    /**
     * 지점별 내담자 수 조회
     */
    @GetMapping("/statistics/clients")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getClientCountByBranch() {
        log.info("지점별 내담자 수 조회 요청");
        
        Map<String, Integer> clientCounts = branchService.getClientCountByBranch();
        return success(clientCounts);
    }
    
    // === 유효성 검사 API ===
    
    /**
     * 지점 코드 중복 확인
     */
    @GetMapping("/validate/branch-code")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> validateBranchCode(
            @RequestParam("branchCode") String branchCode,
            @RequestParam(value = "excludeId", required = false) Long excludeId) {
        log.info("지점 코드 중복 확인 요청: {}", branchCode);
        
        boolean isDuplicate = excludeId != null 
                ? branchService.isBranchCodeDuplicate(branchCode, excludeId)
                : branchService.isBranchCodeDuplicate(branchCode);
        
        Map<String, Boolean> result = Map.of("isDuplicate", isDuplicate);
        return success(result);
    }
    
    /**
     * 지점명 중복 확인
     */
    @GetMapping("/validate/branch-name")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> validateBranchName(
            @RequestParam("branchName") String branchName,
            @RequestParam(value = "parentBranchId", required = false) Long parentBranchId,
            @RequestParam(value = "excludeId", required = false) Long excludeId) {
        log.info("지점명 중복 확인 요청: {}", branchName);
        
        boolean isDuplicate = excludeId != null 
                ? branchService.isBranchNameDuplicate(branchName, parentBranchId, excludeId)
                : branchService.isBranchNameDuplicate(branchName, parentBranchId);
        
        Map<String, Boolean> result = Map.of("isDuplicate", isDuplicate);
        return success(result);
    }
    
    /**
     * 지점 수용 인원 확인
     */
    @GetMapping("/{branchId}/validate/capacity")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> validateCapacity(@PathVariable Long branchId) {
        log.info("지점 수용 인원 확인 요청: 지점 ID={}", branchId);
        
        boolean isWithinCapacity = branchService.isWithinCapacity(branchId);
        boolean consultantCapacityAvailable = branchService.isConsultantCapacityAvailable(branchId);
        boolean clientCapacityAvailable = branchService.isClientCapacityAvailable(branchId);
        
        Map<String, Boolean> result = Map.of(
                "isWithinCapacity", isWithinCapacity,
                "consultantCapacityAvailable", consultantCapacityAvailable,
                "clientCapacityAvailable", clientCapacityAvailable
        );
        
        return success(result);
    }
}
