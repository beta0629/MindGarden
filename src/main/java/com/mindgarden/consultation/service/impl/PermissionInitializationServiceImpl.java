package com.mindgarden.consultation.service.impl;

import java.util.List;
import com.mindgarden.consultation.entity.Permission;
import com.mindgarden.consultation.entity.RolePermission;
import com.mindgarden.consultation.repository.PermissionRepository;
import com.mindgarden.consultation.repository.RolePermissionRepository;
import com.mindgarden.consultation.service.PermissionInitializationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 권한 초기화 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionInitializationServiceImpl implements PermissionInitializationService {
    
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    
    @Override
    @Transactional
    public void initializeDefaultPermissions() {
        log.info("기본 권한 초기화 시작");
        
        // 기본 권한 정의
        List<Permission> defaultPermissions = List.of(
            // ERP 관련 권한
            Permission.of("ERP_ACCESS", "ERP 접근", "ERP"),
            Permission.of("INTEGRATED_FINANCE_VIEW", "통합 재무 조회", "ERP"),
            Permission.of("SALARY_MANAGE", "급여 관리", "ERP"),
            Permission.of("TAX_MANAGE", "세금 관리", "ERP"),
            Permission.of("REFUND_MANAGE", "환불 관리", "ERP"),
            Permission.of("PURCHASE_REQUEST_VIEW", "구매 요청 조회", "ERP"),
            Permission.of("APPROVAL_MANAGE", "승인 관리", "ERP"),
            Permission.of("ITEM_MANAGE", "아이템 관리", "ERP"),
            Permission.of("BUDGET_MANAGE", "예산 관리", "ERP"),
            
            // 관리자 권한
            Permission.of("ADMIN_DASHBOARD_VIEW", "관리자 대시보드 조회", "ADMIN"),
            Permission.of("USER_MANAGE", "사용자 관리", "ADMIN"),
            Permission.of("CONSULTANT_MANAGE", "상담사 관리", "ADMIN"),
            Permission.of("CLIENT_MANAGE", "내담자 관리", "ADMIN"),
            Permission.of("MAPPING_MANAGE", "매핑 관리", "ADMIN"),
            Permission.of("ALL_BRANCHES_VIEW", "모든 지점 조회", "ADMIN"),
            Permission.of("BRANCH_DETAILS_VIEW", "지점 상세 조회", "ADMIN"),
            
            // 스케줄 관련 권한
            Permission.of("SCHEDULE_MANAGE", "스케줄 관리", "SCHEDULE"),
            Permission.of("SCHEDULE_CREATE", "스케줄 생성", "SCHEDULE"),
            Permission.of("SCHEDULE_MODIFY", "스케줄 수정", "SCHEDULE"),
            Permission.of("SCHEDULE_DELETE", "스케줄 삭제", "SCHEDULE"),
            
            // 상담일지 관련 권한
            Permission.of("CONSULTATION_RECORD_VIEW", "상담일지 조회", "CONSULTATION"),
            Permission.of("CONSULTATION_RECORD_CREATE", "상담일지 작성", "CONSULTATION"),
            Permission.of("CONSULTATION_RECORD_MODIFY", "상담일지 수정", "CONSULTATION"),
            
            // 통계 관련 권한
            Permission.of("STATISTICS_VIEW", "통계 조회", "STATISTICS"),
            Permission.of("FINANCIAL_VIEW", "재무 통계 조회", "STATISTICS"),
            Permission.of("CONSULTATION_STATISTICS_VIEW", "상담 통계 조회", "STATISTICS"),
            
            // 시스템 관리 권한
            Permission.of("SYSTEM_CONFIGURATION", "시스템 설정", "SYSTEM"),
            Permission.of("USER_ROLE_MANAGEMENT", "사용자 역할 관리", "SYSTEM"),
            Permission.of("PERMISSION_MANAGEMENT", "권한 관리", "SYSTEM")
        );
        
        int createdCount = 0;
        for (Permission permission : defaultPermissions) {
            if (!permissionRepository.existsByPermissionCode(permission.getPermissionCode())) {
                permissionRepository.save(permission);
                createdCount++;
                log.debug("권한 생성: {}", permission.getPermissionCode());
            }
        }
        
        log.info("기본 권한 초기화 완료: {}개 생성", createdCount);
    }
    
    @Override
    @Transactional
    public void initializeDefaultRolePermissions() {
        log.info("기본 역할별 권한 매핑 초기화 시작");
        
        // BRANCH_SUPER_ADMIN 권한
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
        
        // ADMIN 권한
        List<String> adminPermissions = List.of(
            "ERP_ACCESS", "INTEGRATED_FINANCE_VIEW", "SALARY_MANAGE",
            "TAX_MANAGE", "REFUND_MANAGE", "PURCHASE_REQUEST_VIEW",
            "APPROVAL_MANAGE", "ITEM_MANAGE", "BUDGET_MANAGE",
            "ADMIN_DASHBOARD_VIEW", "USER_MANAGE", "CONSULTANT_MANAGE", "CLIENT_MANAGE",
            "MAPPING_MANAGE", "ALL_BRANCHES_VIEW", "BRANCH_DETAILS_VIEW",
            "SCHEDULE_MANAGE", "SCHEDULE_CREATE", "SCHEDULE_MODIFY", "SCHEDULE_DELETE",
            "CONSULTATION_RECORD_VIEW", "STATISTICS_VIEW", "FINANCIAL_VIEW",
            "CONSULTATION_STATISTICS_VIEW"
        );
        
        // HQ_ADMIN 권한
        List<String> hqAdminPermissions = List.of(
            "ACCESS_ERP_DASHBOARD", "ACCESS_INTEGRATED_FINANCE", "ACCESS_SALARY_MANAGEMENT",
            "ACCESS_TAX_MANAGEMENT", "ACCESS_REFUND_MANAGEMENT", "ACCESS_PURCHASE_REQUESTS",
            "ACCESS_APPROVAL_MANAGEMENT", "ACCESS_ITEM_MANAGEMENT", "ACCESS_BUDGET_MANAGEMENT",
            "ACCESS_ADMIN_DASHBOARD", "MANAGE_USERS", "MANAGE_CONSULTANTS", "MANAGE_CLIENTS",
            "MANAGE_MAPPINGS", "VIEW_BRANCH_DETAILS", "ACCESS_SCHEDULE_MANAGEMENT",
            "ACCESS_STATISTICS", "VIEW_FINANCIAL_STATISTICS", "VIEW_CONSULTATION_STATISTICS"
        );
        
        // SUPER_HQ_ADMIN 권한 (HQ_ADMIN과 동일 + 추가 권한)
        List<String> superHqAdminPermissions = List.of(
            "ACCESS_ERP_DASHBOARD", "ACCESS_INTEGRATED_FINANCE", "ACCESS_SALARY_MANAGEMENT",
            "ACCESS_TAX_MANAGEMENT", "ACCESS_REFUND_MANAGEMENT", "ACCESS_PURCHASE_REQUESTS",
            "ACCESS_APPROVAL_MANAGEMENT", "ACCESS_ITEM_MANAGEMENT", "ACCESS_BUDGET_MANAGEMENT",
            "ACCESS_ADMIN_DASHBOARD", "MANAGE_USERS", "MANAGE_CONSULTANTS", "MANAGE_CLIENTS",
            "MANAGE_MAPPINGS", "VIEW_ALL_BRANCHES", "VIEW_BRANCH_DETAILS",
            "ACCESS_SCHEDULE_MANAGEMENT", "ACCESS_STATISTICS", "VIEW_FINANCIAL_STATISTICS",
            "VIEW_CONSULTATION_STATISTICS"
        );
        
        // HQ_MASTER 권한 (모든 권한)
        List<String> hqMasterPermissions = List.of(
            "ACCESS_ERP_DASHBOARD", "ACCESS_INTEGRATED_FINANCE", "ACCESS_SALARY_MANAGEMENT",
            "ACCESS_TAX_MANAGEMENT", "ACCESS_REFUND_MANAGEMENT", "ACCESS_PURCHASE_REQUESTS",
            "ACCESS_APPROVAL_MANAGEMENT", "ACCESS_ITEM_MANAGEMENT", "ACCESS_BUDGET_MANAGEMENT",
            "ACCESS_ADMIN_DASHBOARD", "MANAGE_USERS", "MANAGE_CONSULTANTS", "MANAGE_CLIENTS",
            "MANAGE_MAPPINGS", "VIEW_ALL_BRANCHES", "VIEW_BRANCH_DETAILS",
            "ACCESS_SCHEDULE_MANAGEMENT", "CREATE_SCHEDULES", "MODIFY_SCHEDULES", "DELETE_SCHEDULES",
            "ACCESS_CONSULTATION_RECORDS", "CREATE_CONSULTATION_RECORDS", "MODIFY_CONSULTATION_RECORDS",
            "ACCESS_STATISTICS", "VIEW_FINANCIAL_STATISTICS", "VIEW_CONSULTATION_STATISTICS",
            "SYSTEM_CONFIGURATION", "USER_ROLE_MANAGEMENT", "PERMISSION_MANAGEMENT"
        );
        
        // CONSULTANT 권한 (제한적)
        List<String> consultantPermissions = List.of(
            "ACCESS_SCHEDULE_MANAGEMENT", "CREATE_SCHEDULES", "MODIFY_SCHEDULES",
            "ACCESS_CONSULTATION_RECORDS", "CREATE_CONSULTATION_RECORDS",
            "ACCESS_STATISTICS", "VIEW_CONSULTATION_STATISTICS"
        );
        
        // CLIENT 권한 (최소한)
        List<String> clientPermissions = List.of(
            "ACCESS_CONSULTATION_RECORDS"
        );
        
        // 권한 매핑 생성
        createRolePermissions("BRANCH_SUPER_ADMIN", branchSuperAdminPermissions);
        createRolePermissions("ADMIN", adminPermissions);
        createRolePermissions("HQ_ADMIN", hqAdminPermissions);
        createRolePermissions("SUPER_HQ_ADMIN", superHqAdminPermissions);
        createRolePermissions("HQ_MASTER", hqMasterPermissions);
        createRolePermissions("CONSULTANT", consultantPermissions);
        createRolePermissions("CLIENT", clientPermissions);
        
        log.info("기본 역할별 권한 매핑 초기화 완료");
    }
    
    @Override
    @Transactional
    public void initializePermissionSystem() {
        log.info("권한 시스템 전체 초기화 시작");
        
        initializeDefaultPermissions();
        initializeDefaultRolePermissions();
        
        log.info("권한 시스템 전체 초기화 완료");
    }
    
    @Override
    public boolean isPermissionSystemInitialized() {
        try {
            long permissionCount = permissionRepository.count();
            long rolePermissionCount = rolePermissionRepository.count();
            
            log.debug("권한 시스템 초기화 상태 확인: 권한={}개, 역할권한={}개", permissionCount, rolePermissionCount);
            
            // 최소한의 권한과 역할권한이 있어야 초기화된 것으로 간주
            return permissionCount > 10 && rolePermissionCount > 20;
            
        } catch (Exception e) {
            log.error("권한 시스템 초기화 상태 확인 중 오류", e);
            return false;
        }
    }
    
    /**
     * 특정 역할에 권한들을 부여
     */
    private void createRolePermissions(String roleName, List<String> permissionCodes) {
        int createdCount = 0;
        for (String permissionCode : permissionCodes) {
            if (!rolePermissionRepository.existsByRoleNameAndPermissionCodeAndIsActiveTrue(roleName, permissionCode)) {
                RolePermission rolePermission = RolePermission.grant(roleName, permissionCode, "SYSTEM");
                rolePermissionRepository.save(rolePermission);
                createdCount++;
                log.debug("역할권한 생성: {} - {}", roleName, permissionCode);
            }
        }
        log.info("{} 권한 매핑 완료: {}개 생성", roleName, createdCount);
    }
}
