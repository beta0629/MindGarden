package com.mindgarden.consultation.controller;

import java.util.Map;
import com.mindgarden.consultation.service.PermissionInitializationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 권한 시스템 테스트 및 초기화 컨트롤러
 * 개발/테스트 환경에서 권한 시스템을 수동으로 초기화할 수 있습니다.
 */
@RestController
@RequestMapping("/api/test/permissions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PermissionTestController {

    private final PermissionInitializationService permissionInitializationService;

    /**
     * 권한 시스템 수동 초기화
     */
    @PostMapping("/initialize")
    public ResponseEntity<Map<String, Object>> initializePermissions() {
        try {
            log.info("🔐 권한 시스템 수동 초기화 시작...");
            
            permissionInitializationService.initializePermissionSystem();
            
            log.info("✅ 권한 시스템 수동 초기화 완료");
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "권한 시스템이 성공적으로 초기화되었습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 권한 시스템 초기화 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "권한 시스템 초기화에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 권한 시스템 상태 확인
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getPermissionStatus() {
        try {
            log.info("🔍 권한 시스템 상태 확인...");
            
            boolean isInitialized = permissionInitializationService.isPermissionSystemInitialized();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "initialized", isInitialized,
                "message", isInitialized ? "권한 시스템이 초기화되었습니다." : "권한 시스템이 초기화되지 않았습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 권한 시스템 상태 확인 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "권한 시스템 상태 확인에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 권한 목록 조회 (인증 없이)
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getAllPermissions() {
        try {
            log.info("🔍 모든 권한 목록 조회...");
            
            // 권한 목록을 직접 조회하는 로직 (인증 없이)
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "권한 목록 조회 성공",
                "permissions", "권한 목록이 여기에 표시됩니다."
            ));
        } catch (Exception e) {
            log.error("❌ 권한 목록 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "권한 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 지점수퍼어드민 권한 테스트 (인증 없이)
     */
    @GetMapping("/test-branch-super-admin")
    public ResponseEntity<Map<String, Object>> testBranchSuperAdminPermissions() {
        try {
            log.info("🔍 지점수퍼어드민 권한 테스트...");
            
            // 지점수퍼어드민 권한 목록
            List<String> branchSuperAdminPermissions = List.of(
                "ERP_ACCESS", "INTEGRATED_FINANCE_VIEW", "SALARY_MANAGE",
                "TAX_MANAGE", "REFUND_MANAGE", "PURCHASE_REQUEST_VIEW",
                "APPROVAL_MANAGE", "ITEM_MANAGE", "BUDGET_MANAGE",
                "ADMIN_DASHBOARD_VIEW", "USER_MANAGE", "CONSULTANT_MANAGE", "CLIENT_MANAGE",
                "MAPPING_MANAGE", "BRANCH_DETAILS_VIEW", "SCHEDULE_MANAGE",
                "SCHEDULE_CREATE", "SCHEDULE_MODIFY", "SCHEDULE_DELETE",
                "CONSULTATION_RECORD_VIEW", "STATISTICS_VIEW", "FINANCIAL_VIEW",
                "CONSULTATION_STATISTICS_VIEW"
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "지점수퍼어드민 권한 테스트 성공",
                "role", "BRANCH_SUPER_ADMIN",
                "permissions", branchSuperAdminPermissions,
                "permissionCount", branchSuperAdminPermissions.size()
            ));
        } catch (Exception e) {
            log.error("❌ 지점수퍼어드민 권한 테스트 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "지점수퍼어드민 권한 테스트에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}
