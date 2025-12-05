package com.coresolution.consultation.controller;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.dto.BranchCreateRequest;
import com.coresolution.consultation.dto.BranchResponse;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * HQ 지점 관리 컨트롤러 (간단 버전)
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/hq") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HQBranchController extends BaseApiController {

    private final BranchService branchService;
    private final UserService userService;
    private final DynamicPermissionService dynamicPermissionService;

    /**
     * 모든 지점 목록 조회 (branches 테이블 기반)
     */
    @GetMapping("/branches")
    public ResponseEntity<List<BranchResponse>> getAllBranches() {
        try {
            log.info("API 호출: 모든 지점 목록 조회 (branches 테이블 기반)");
            
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
     * 특정 지점 상세 조회
     */
    @GetMapping("/branches/{id}")
    public ResponseEntity<Branch> getBranchById(@PathVariable Long id) {
        try {
            log.info("API 호출: 지점 상세 조회 - ID: {}", id);
            var branchResponse = branchService.getBranchResponse(id);
            if (branchResponse != null) {
                Branch branch = new Branch();
                branch.setId(branchResponse.getId());
                branch.setBranchName(branchResponse.getBranchName());
                branch.setBranchCode(branchResponse.getBranchCode());
                branch.setAddress(branchResponse.getAddress());
                branch.setPhoneNumber(branchResponse.getPhoneNumber());
                branch.setEmail(branchResponse.getEmail());
                branch.setBranchStatus(branchResponse.getBranchStatus());
                return ResponseEntity.ok(branch);
            } else {
                log.warn("지점을 찾을 수 없음 - ID: {}", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("지점 상세 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 지점 관리자 후보 목록 조회
     */
    @GetMapping("/managers")
    public ResponseEntity<List<User>> getManagerCandidates() {
        try {
            log.info("API 호출: 지점 관리자 후보 목록 조회");
            // 표준화 2025-12-05: enum 활용
            List<User> managers = userService.findByRoleInAndIsDeletedFalse(
                java.util.Arrays.stream(new com.coresolution.consultation.constant.UserRole[]{
                    com.coresolution.consultation.constant.UserRole.HQ_ADMIN,
                    com.coresolution.consultation.constant.UserRole.SUPER_HQ_ADMIN,
                    com.coresolution.consultation.constant.UserRole.ADMIN
                }).map(com.coresolution.consultation.constant.UserRole::name).collect(java.util.stream.Collectors.toList())
            );
            return ResponseEntity.ok(managers);
        } catch (Exception e) {
            log.error("관리자 목록 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 지점 통계 - 전체 현황
     */
    @GetMapping("/statistics/overall")
    public ResponseEntity<Map<String, Object>> getOverallStatistics(
            @RequestParam(defaultValue = "month") String period) {
        try {
            log.info("API 호출: 지점 전체 통계 조회 - 기간: {}", period);
            Map<String, Object> stats = branchService.getAllBranchesStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("전체 통계 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 지점 통계 - 비교 분석
     */
    @GetMapping("/statistics/comparison")
    public ResponseEntity<List<Map<String, Object>>> getComparisonStatistics(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(defaultValue = "USERS") String metric) {
        try {
            log.info("API 호출: 지점 비교 통계 조회 - 기간: {}, 지표: {}", period, metric);
            List<Map<String, Object>> comparison = branchService.getBranchComparisonStatistics(period, metric);
            return ResponseEntity.ok(comparison);
        } catch (Exception e) {
            log.error("비교 통계 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 지점 통계 - 트렌드 분석
     */
    @GetMapping("/statistics/trend")
    public ResponseEntity<List<Map<String, Object>>> getTrendStatistics(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(defaultValue = "DAILY_USERS") String metric,
            @RequestParam(required = false) Long branchId) {
        try {
            log.info("API 호출: 지점 트렌드 통계 조회 - 기간: {}, 지표: {}, 지점ID: {}", period, metric, branchId);
            List<Map<String, Object>> trend = branchService.getBranchTrendStatistics(period, metric, branchId);
            return ResponseEntity.ok(trend);
        } catch (Exception e) {
            log.error("트렌드 통계 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 지점 등록
     */
    @PostMapping("/branches")
    public ResponseEntity<ApiResponse<BranchResponse>> createBranch(@RequestBody BranchCreateRequest request) {
        log.info("🏢 지점 등록 요청: {}", request.getBranchName());
        
        // 지점 생성 (branches 테이블에만 저장)
        BranchResponse response = branchService.createBranch(request);
        
        log.info("✅ 지점 등록 완료: {} ({})", request.getBranchName(), request.getBranchCode());
        
        return created("지점이 성공적으로 등록되었습니다", response);
    }
}
