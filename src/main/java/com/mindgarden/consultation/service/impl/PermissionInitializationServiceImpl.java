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
            Permission.of("ACCESS_ERP_DASHBOARD", "ERP 대시보드 접근", "ERP"),
            Permission.of("ACCESS_INTEGRATED_FINANCE", "통합 회계 시스템 접근", "ERP"),
            Permission.of("ACCESS_SALARY_MANAGEMENT", "급여 관리 접근", "ERP"),
            Permission.of("ACCESS_TAX_MANAGEMENT", "세금 관리 접근", "ERP"),
            Permission.of("ACCESS_REFUND_MANAGEMENT", "환불 관리 접근", "ERP"),
            Permission.of("ACCESS_PURCHASE_REQUESTS", "구매 요청 접근", "ERP"),
            Permission.of("ACCESS_APPROVAL_MANAGEMENT", "승인 관리 접근", "ERP"),
            Permission.of("ACCESS_ITEM_MANAGEMENT", "아이템 관리 접근", "ERP"),
            Permission.of("ACCESS_BUDGET_MANAGEMENT", "예산 관리 접근", "ERP"),
            
            // 관리자 권한
            Permission.of("ACCESS_ADMIN_DASHBOARD", "관리자 대시보드 접근", "ADMIN"),
            Permission.of("MANAGE_USERS", "사용자 관리", "ADMIN"),
            Permission.of("MANAGE_CONSULTANTS", "상담사 관리", "ADMIN"),
            Permission.of("MANAGE_CLIENTS", "내담자 관리", "ADMIN"),
            Permission.of("MANAGE_MAPPINGS", "매핑 관리", "ADMIN"),
            Permission.of("VIEW_ALL_BRANCHES", "모든 지점 조회", "ADMIN"),
            Permission.of("VIEW_BRANCH_DETAILS", "지점 상세 조회", "ADMIN"),
            
            // 스케줄 관련 권한
            Permission.of("ACCESS_SCHEDULE_MANAGEMENT", "스케줄 관리 접근", "SCHEDULE"),
            Permission.of("CREATE_SCHEDULES", "스케줄 생성", "SCHEDULE"),
            Permission.of("MODIFY_SCHEDULES", "스케줄 수정", "SCHEDULE"),
            Permission.of("DELETE_SCHEDULES", "스케줄 삭제", "SCHEDULE"),
            
            // 상담일지 관련 권한
            Permission.of("ACCESS_CONSULTATION_RECORDS", "상담일지 접근", "CONSULTATION"),
            Permission.of("CREATE_CONSULTATION_RECORDS", "상담일지 작성", "CONSULTATION"),
            Permission.of("MODIFY_CONSULTATION_RECORDS", "상담일지 수정", "CONSULTATION"),
            
            // 통계 관련 권한
            Permission.of("ACCESS_STATISTICS", "통계 접근", "STATISTICS"),
            Permission.of("VIEW_FINANCIAL_STATISTICS", "재무 통계 조회", "STATISTICS"),
            Permission.of("VIEW_CONSULTATION_STATISTICS", "상담 통계 조회", "STATISTICS"),
            
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
            "ACCESS_ERP_DASHBOARD", "ACCESS_INTEGRATED_FINANCE", "ACCESS_SALARY_MANAGEMENT",
            "ACCESS_TAX_MANAGEMENT", "ACCESS_REFUND_MANAGEMENT", "ACCESS_PURCHASE_REQUESTS",
            "ACCESS_APPROVAL_MANAGEMENT", "ACCESS_ITEM_MANAGEMENT", "ACCESS_BUDGET_MANAGEMENT",
            "ACCESS_ADMIN_DASHBOARD", "MANAGE_USERS", "MANAGE_CONSULTANTS", "MANAGE_CLIENTS",
            "MANAGE_MAPPINGS", "VIEW_BRANCH_DETAILS", "ACCESS_SCHEDULE_MANAGEMENT",
            "CREATE_SCHEDULES", "MODIFY_SCHEDULES", "DELETE_SCHEDULES",
            "ACCESS_CONSULTATION_RECORDS", "ACCESS_STATISTICS", "VIEW_FINANCIAL_STATISTICS",
            "VIEW_CONSULTATION_STATISTICS"
        );
        
        // ADMIN 권한
        List<String> adminPermissions = List.of(
            "ACCESS_ERP_DASHBOARD", "ACCESS_INTEGRATED_FINANCE", "ACCESS_SALARY_MANAGEMENT",
            "ACCESS_TAX_MANAGEMENT", "ACCESS_REFUND_MANAGEMENT", "ACCESS_PURCHASE_REQUESTS",
            "ACCESS_APPROVAL_MANAGEMENT", "ACCESS_ITEM_MANAGEMENT", "ACCESS_BUDGET_MANAGEMENT",
            "ACCESS_ADMIN_DASHBOARD", "MANAGE_USERS", "MANAGE_CONSULTANTS", "MANAGE_CLIENTS",
            "MANAGE_MAPPINGS", "VIEW_ALL_BRANCHES", "VIEW_BRANCH_DETAILS",
            "ACCESS_SCHEDULE_MANAGEMENT", "CREATE_SCHEDULES", "MODIFY_SCHEDULES", "DELETE_SCHEDULES",
            "ACCESS_CONSULTATION_RECORDS", "ACCESS_STATISTICS", "VIEW_FINANCIAL_STATISTICS",
            "VIEW_CONSULTATION_STATISTICS"
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
