package com.mindgarden.consultation.controller;

import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.constant.AdminConstants;
import com.mindgarden.consultation.dto.BranchCreateRequest;
import com.mindgarden.consultation.dto.BranchResponse;
import com.mindgarden.consultation.dto.BranchUpdateRequest;
import com.mindgarden.consultation.entity.Branch;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.BranchService;
import com.mindgarden.consultation.service.DynamicPermissionService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/branches")
@RequiredArgsConstructor
public class BranchController {
    
    private final BranchService branchService;
    private final DynamicPermissionService dynamicPermissionService;
    
    // === 기본 CRUD API ===
    
    /**
     * 지점 생성
     */
    @PostMapping
    public ResponseEntity<BranchResponse> createBranch(
            @Valid @RequestBody BranchCreateRequest request,
            jakarta.servlet.http.HttpSession session) {
        log.info("지점 생성 요청: {}", request.getBranchName());
        
        // 동적 권한 체크
        User currentUser = (User) session.getAttribute("user");
        if (currentUser == null) {
            return ResponseEntity.status(401).body(null);
        }
        
        if (!dynamicPermissionService.hasPermission(currentUser, "BRANCH_MANAGE")) {
            return ResponseEntity.status(403).body(null);
        }
        
        BranchResponse response = branchService.createBranch(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    
    /**
     * 테스트용 본점 생성 (권한 없음)
     */
    @PostMapping("/test-create-main")
    public ResponseEntity<?> createTestMainBranch() {
        try {
            log.info("테스트 본점 생성 요청");
            
            BranchCreateRequest request = new BranchCreateRequest();
            request.setBranchName("본점");
            request.setBranchCode(AdminConstants.DEFAULT_BRANCH_CODE);
            request.setBranchType(Branch.BranchType.MAIN);
            request.setAddress("서울시 강남구");
            request.setPhoneNumber("02-1234-5678");
            request.setEmail("main@mindgarden.com");
            
            BranchResponse response = branchService.createBranch(request);
            return ResponseEntity.ok(Map.of("success", true, "message", "본점이 생성되었습니다.", "data", response));
            
        } catch (Exception e) {
            log.error("테스트 본점 생성 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "본점 생성 실패: " + e.getMessage()));
        }
    }
    
    /**
     * 지점 조회
     */
    @GetMapping("/{branchId}")
    public ResponseEntity<BranchResponse> getBranch(@PathVariable Long branchId) {
        log.info("지점 조회 요청: ID={}", branchId);
        
        BranchResponse response = branchService.getBranchResponse(branchId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 지점 수정
     */
    @PutMapping("/{branchId}")
    public ResponseEntity<BranchResponse> updateBranch(
            @PathVariable Long branchId,
            @Valid @RequestBody BranchUpdateRequest request) {
        log.info("지점 수정 요청: ID={}", branchId);
        
        BranchResponse response = branchService.updateBranch(branchId, request);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 지점 삭제
     */
    @DeleteMapping("/{branchId}")
    public ResponseEntity<Void> deleteBranch(@PathVariable Long branchId) {
        log.info("지점 삭제 요청: ID={}", branchId);
        
        branchService.softDeleteById(branchId);
        return ResponseEntity.noContent().build();
    }
    
    // === 조회 API ===
    
    /**
     * 모든 활성 지점 조회 (모든 사용자 접근 가능)
     */
    @GetMapping("/active")
    public ResponseEntity<List<BranchResponse>> getActiveBranches() {
        log.info("활성 지점 목록 조회 요청");
        
        List<BranchResponse> branches = branchService.getAllActiveBranches();
        return ResponseEntity.ok(branches);
    }
    
    /**
     * 지점 페이징 조회 (branches 테이블 기반)
     */
    @GetMapping
    public ResponseEntity<List<BranchResponse>> getBranches() {
        log.info("지점 목록 조회 요청 (branches 테이블 기반)");
        
        try {
            // branches 테이블에서 지점 목록 조회
            List<BranchResponse> branches = branchService.getAllActiveBranches();
            
            log.info("지점 목록 조회 완료: {}개", branches.size());
            return ResponseEntity.ok(branches);
        } catch (Exception e) {
            log.error("지점 목록 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 지점 검색
     */
    @GetMapping("/search")
    public ResponseEntity<List<BranchResponse>> searchBranches(
            @RequestParam("keyword") String keyword) {
        log.info("지점 검색 요청: {}", keyword);
        
        List<BranchResponse> branches = branchService.searchBranches(keyword);
        return ResponseEntity.ok(branches);
    }
    
    /**
     * 지점 검색 (페이징)
     */
    @GetMapping("/search/paged")
    public ResponseEntity<Page<BranchResponse>> searchBranchesWithPaging(
            @RequestParam("keyword") String keyword,
            Pageable pageable) {
        log.info("지점 페이징 검색 요청: {}, {}", keyword, pageable);
        
        Page<BranchResponse> branches = branchService.searchBranchesWithPaging(keyword, pageable);
        return ResponseEntity.ok(branches);
    }
    
    /**
     * 지점 유형별 조회
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<BranchResponse>> getBranchesByType(
            @PathVariable Branch.BranchType type) {
        log.info("지점 유형별 조회 요청: {}", type);
        
        List<BranchResponse> branches = branchService.getBranchesByType(type);
        return ResponseEntity.ok(branches);
    }
    
    /**
     * 지점 상태별 조회
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<BranchResponse>> getBranchesByStatus(
            @PathVariable Branch.BranchStatus status) {
        log.info("지점 상태별 조회 요청: {}", status);
        
        List<BranchResponse> branches = branchService.getBranchesByStatus(status);
        return ResponseEntity.ok(branches);
    }
    
    /**
     * 본점들 조회
     */
    @GetMapping("/main")
    public ResponseEntity<List<BranchResponse>> getMainBranches() {
        log.info("본점 목록 조회 요청");
        
        List<BranchResponse> branches = branchService.getMainBranches();
        return ResponseEntity.ok(branches);
    }
    
    /**
     * 하위 지점들 조회
     */
    @GetMapping("/{branchId}/sub-branches")
    public ResponseEntity<List<BranchResponse>> getSubBranches(@PathVariable Long branchId) {
        log.info("하위 지점 목록 조회 요청: 상위 지점 ID={}", branchId);
        
        List<BranchResponse> branches = branchService.getSubBranches(branchId);
        return ResponseEntity.ok(branches);
    }
    
    /**
     * 지점 계층 구조 조회
     */
    @GetMapping("/hierarchy")
    public ResponseEntity<List<BranchResponse>> getBranchHierarchy() {
        log.info("지점 계층 구조 조회 요청");
        
        List<BranchResponse> hierarchy = branchService.getBranchHierarchy();
        return ResponseEntity.ok(hierarchy);
    }
    
    // === 지점 관리 API ===
    
    /**
     * 지점장 지정
     */
    @PostMapping("/{branchId}/manager/{managerId}")
    public ResponseEntity<Void> assignManager(
            @PathVariable Long branchId,
            @PathVariable Long managerId) {
        log.info("지점장 지정 요청: 지점 ID={}, 지점장 ID={}", branchId, managerId);
        
        branchService.assignManager(branchId, managerId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 지점장 해제
     */
    @DeleteMapping("/{branchId}/manager")
    public ResponseEntity<Void> removeManager(@PathVariable Long branchId) {
        log.info("지점장 해제 요청: 지점 ID={}", branchId);
        
        branchService.removeManager(branchId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 지점 상태 변경
     */
    @PutMapping("/{branchId}/status/{status}")
    public ResponseEntity<Void> changeBranchStatus(
            @PathVariable Long branchId,
            @PathVariable Branch.BranchStatus status) {
        log.info("지점 상태 변경 요청: 지점 ID={}, 새 상태={}", branchId, status);
        
        branchService.changeBranchStatus(branchId, status);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 지점 활성화
     */
    @PostMapping("/{branchId}/activate")
    public ResponseEntity<Void> activateBranch(@PathVariable Long branchId) {
        log.info("지점 활성화 요청: 지점 ID={}", branchId);
        
        branchService.activateBranch(branchId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 지점 비활성화
     */
    @PostMapping("/{branchId}/deactivate")
    public ResponseEntity<Void> deactivateBranch(@PathVariable Long branchId) {
        log.info("지점 비활성화 요청: 지점 ID={}", branchId);
        
        branchService.deactivateBranch(branchId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 지점 폐점
     */
    @PostMapping("/{branchId}/close")
    public ResponseEntity<Void> closeBranch(@PathVariable Long branchId) {
        log.info("지점 폐점 요청: 지점 ID={}", branchId);
        
        branchService.closeBranch(branchId);
        return ResponseEntity.ok().build();
    }
    
    // === 사용자 관리 API ===
    
    /**
     * 지점에 상담사 할당
     */
    @PostMapping("/{branchId}/consultants/{consultantId}")
    public ResponseEntity<Void> assignConsultant(
            @PathVariable Long branchId,
            @PathVariable Long consultantId) {
        log.info("상담사 지점 할당 요청: 지점 ID={}, 상담사 ID={}", branchId, consultantId);
        
        branchService.assignConsultantToBranch(branchId, consultantId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 지점에 내담자 할당
     */
    @PostMapping("/{branchId}/clients/{clientId}")
    public ResponseEntity<Void> assignClient(
            @PathVariable Long branchId,
            @PathVariable Long clientId) {
        log.info("내담자 지점 할당 요청: 지점 ID={}, 내담자 ID={}", branchId, clientId);
        
        branchService.assignClientToBranch(branchId, clientId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 지점에서 사용자 제거
     */
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> removeUserFromBranch(@PathVariable Long userId) {
        log.info("사용자 지점 제거 요청: 사용자 ID={}", userId);
        
        branchService.removeUserFromBranch(userId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 지점 간 사용자 이동
     */
    @PostMapping("/users/{userId}/transfer")
    public ResponseEntity<Void> transferUser(
            @PathVariable Long userId,
            @RequestParam("fromBranch") Long fromBranchId,
            @RequestParam("toBranch") Long toBranchId) {
        log.info("사용자 지점 이동 요청: 사용자 ID={}, {} -> {}", userId, fromBranchId, toBranchId);
        
        branchService.transferUserBetweenBranches(userId, fromBranchId, toBranchId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 지점 소속 상담사 목록 조회
     */
    @GetMapping("/{branchId}/consultants")
    public ResponseEntity<List<User>> getBranchConsultants(@PathVariable Long branchId) {
        log.info("지점 소속 상담사 목록 조회 요청: 지점 ID={}", branchId);
        
        List<User> consultants = branchService.getBranchConsultants(branchId);
        return ResponseEntity.ok(consultants);
    }
    
    /**
     * 지점 소속 내담자 목록 조회
     */
    @GetMapping("/{branchId}/clients")
    public ResponseEntity<List<User>> getBranchClients(@PathVariable Long branchId) {
        log.info("지점 소속 내담자 목록 조회 요청: 지점 ID={}", branchId);
        
        List<User> clients = branchService.getBranchClients(branchId);
        return ResponseEntity.ok(clients);
    }
    
    // === 통계 API ===
    
    /**
     * 지점 통계 조회
     */
    @GetMapping("/{branchId}/statistics")
    public ResponseEntity<Map<String, Object>> getBranchStatistics(@PathVariable Long branchId) {
        log.info("지점 통계 조회 요청: 지점 ID={}", branchId);
        
        Map<String, Object> statistics = branchService.getBranchStatistics(branchId);
        return ResponseEntity.ok(statistics);
    }
    
    /**
     * 전체 지점 통계 조회
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getAllBranchesStatistics() {
        log.info("전체 지점 통계 조회 요청");
        
        Map<String, Object> statistics = branchService.getAllBranchesStatistics();
        return ResponseEntity.ok(statistics);
    }
    
    /**
     * 지점별 상담사 수 조회
     */
    @GetMapping("/statistics/consultants")
    public ResponseEntity<Map<String, Integer>> getConsultantCountByBranch() {
        log.info("지점별 상담사 수 조회 요청");
        
        Map<String, Integer> consultantCounts = branchService.getConsultantCountByBranch();
        return ResponseEntity.ok(consultantCounts);
    }
    
    /**
     * 지점별 내담자 수 조회
     */
    @GetMapping("/statistics/clients")
    public ResponseEntity<Map<String, Integer>> getClientCountByBranch() {
        log.info("지점별 내담자 수 조회 요청");
        
        Map<String, Integer> clientCounts = branchService.getClientCountByBranch();
        return ResponseEntity.ok(clientCounts);
    }
    
    // === 유효성 검사 API ===
    
    /**
     * 지점 코드 중복 확인
     */
    @GetMapping("/validate/branch-code")
    public ResponseEntity<Map<String, Boolean>> validateBranchCode(
            @RequestParam("branchCode") String branchCode,
            @RequestParam(value = "excludeId", required = false) Long excludeId) {
        log.info("지점 코드 중복 확인 요청: {}", branchCode);
        
        boolean isDuplicate = excludeId != null 
                ? branchService.isBranchCodeDuplicate(branchCode, excludeId)
                : branchService.isBranchCodeDuplicate(branchCode);
        
        Map<String, Boolean> result = Map.of("isDuplicate", isDuplicate);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 지점명 중복 확인
     */
    @GetMapping("/validate/branch-name")
    public ResponseEntity<Map<String, Boolean>> validateBranchName(
            @RequestParam("branchName") String branchName,
            @RequestParam(value = "parentBranchId", required = false) Long parentBranchId,
            @RequestParam(value = "excludeId", required = false) Long excludeId) {
        log.info("지점명 중복 확인 요청: {}", branchName);
        
        boolean isDuplicate = excludeId != null 
                ? branchService.isBranchNameDuplicate(branchName, parentBranchId, excludeId)
                : branchService.isBranchNameDuplicate(branchName, parentBranchId);
        
        Map<String, Boolean> result = Map.of("isDuplicate", isDuplicate);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 지점 수용 인원 확인
     */
    @GetMapping("/{branchId}/validate/capacity")
    public ResponseEntity<Map<String, Boolean>> validateCapacity(@PathVariable Long branchId) {
        log.info("지점 수용 인원 확인 요청: 지점 ID={}", branchId);
        
        boolean isWithinCapacity = branchService.isWithinCapacity(branchId);
        boolean consultantCapacityAvailable = branchService.isConsultantCapacityAvailable(branchId);
        boolean clientCapacityAvailable = branchService.isClientCapacityAvailable(branchId);
        
        Map<String, Boolean> result = Map.of(
                "isWithinCapacity", isWithinCapacity,
                "consultantCapacityAvailable", consultantCapacityAvailable,
                "clientCapacityAvailable", clientCapacityAvailable
        );
        
        return ResponseEntity.ok(result);
    }
}
