package com.coresolution.consultation.service.impl;

import java.util.List;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.Permission;
import com.coresolution.consultation.entity.RolePermission;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.PermissionRepository;
import com.coresolution.consultation.repository.LegacyRolePermissionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.coresolution.consultation.service.PermissionInitializationService;
import com.coresolution.core.context.TenantContextHolder;
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
    private final LegacyRolePermissionRepository rolePermissionRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final ObjectMapper objectMapper;
    
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
            Permission.of("ADMIN_CONSULTATION_VIEW", "관리자 상담 이력 조회", "CONSULTATION"),
            
            // 통계 관련 권한
            Permission.of("STATISTICS_VIEW", "통계 조회", "STATISTICS"),
            Permission.of("REPORT_VIEW", "보고서 조회", "STATISTICS"),
            Permission.of("FINANCIAL_VIEW", "재무 통계 조회", "STATISTICS"),
            Permission.of("CONSULTATION_STATISTICS_VIEW", "상담 통계 조회", "STATISTICS"),
            
            // 매핑 관련 권한
            Permission.of("MAPPING_VIEW", "매핑 조회", "MAPPING"),
            Permission.of("MAPPING_MANAGE", "매핑 관리", "MAPPING"),
            
            // 급여 관리 권한
            Permission.of("SALARY_MANAGE", "급여 관리", "SALARY"),
            Permission.of("SALARY_VIEW", "급여 조회", "SALARY"),
            Permission.of("SALARY_CALCULATE", "급여 계산", "SALARY"),
            
            // 시스템 관리 권한
            Permission.of("SYSTEM_CONFIGURATION", "시스템 설정", "SYSTEM"),
            Permission.of("USER_ROLE_MANAGEMENT", "사용자 역할 관리", "SYSTEM"),
            Permission.of("PERMISSION_MANAGEMENT", "권한 관리", "SYSTEM"),
            Permission.of("SYSTEM_NOTIFICATION_MANAGE", "시스템 공지 관리", "SYSTEM")
        );
        
        // 배치 저장으로 변경하여 트랜잭션 시간 단축
        List<Permission> permissionsToSave = new java.util.ArrayList<>();
        for (Permission permission : defaultPermissions) {
            if (!permissionRepository.existsByPermissionCode(permission.getPermissionCode())) {
                permissionsToSave.add(permission);
            }
        }
        
        if (!permissionsToSave.isEmpty()) {
            permissionRepository.saveAll(permissionsToSave);
            log.info("기본 권한 초기화 완료: {}개 생성", permissionsToSave.size());
        } else {
            log.info("기본 권한 초기화 완료: 모든 권한이 이미 존재함");
        }
    }
    
    @Override
    @Transactional
    public void initializeDefaultRolePermissions() {
        log.info("기본 역할별 권한 매핑 초기화 시작");
        
        // BRANCH_SUPER_ADMIN 권한 (지점 관련 모든 권한)
        List<String> branchSuperAdminPermissions = List.of(
            "ERP_ACCESS", "INTEGRATED_FINANCE_VIEW", "SALARY_MANAGE", "SALARY_VIEW", "SALARY_CALCULATE",
            "TAX_MANAGE", "REFUND_MANAGE", "PURCHASE_REQUEST_VIEW",
            "APPROVAL_MANAGE", "ITEM_MANAGE", "BUDGET_MANAGE",
            "ADMIN_DASHBOARD_VIEW", "USER_MANAGE", "CONSULTANT_MANAGE", "CLIENT_MANAGE",
            "MAPPING_VIEW", "MAPPING_MANAGE", "BRANCH_DETAILS_VIEW", 
            "ACCESS_SCHEDULE_MANAGEMENT", "SCHEDULE_MANAGE", "SCHEDULE_CREATE", "SCHEDULE_MODIFY", "SCHEDULE_DELETE",
            "CONSULTATION_RECORD_VIEW", "ADMIN_CONSULTATION_VIEW", "STATISTICS_VIEW", "REPORT_VIEW", "FINANCIAL_VIEW",
            "CONSULTATION_STATISTICS_VIEW", "ALL_BRANCHES_VIEW", "BRANCH_MANAGE",
            "PERMISSION_MANAGEMENT", "USER_ROLE_MANAGEMENT", "SYSTEM_CONFIGURATION", "SYSTEM_NOTIFICATION_MANAGE",
            "CREATE_CONSULTATION_RECORDS", "MODIFY_CONSULTATION_RECORDS", "DELETE_CONSULTATION_RECORDS",
            "VIEW_ALL_BRANCHES", "MANAGE_BRANCHES", "BRANCH_STATISTICS_VIEW"
        );
        
        // ADMIN 권한 (공통코드에서 동적 조회)
        List<String> adminPermissions = getPermissionsFromCommonCode("ADMIN_PERMISSIONS");
        
        // HQ_ADMIN 권한
        List<String> hqAdminPermissions = List.of(
            "ACCESS_ERP_DASHBOARD", "ACCESS_INTEGRATED_FINANCE", "ACCESS_SALARY_MANAGEMENT",
            "ACCESS_TAX_MANAGEMENT", "ACCESS_REFUND_MANAGEMENT", "ACCESS_PURCHASE_REQUESTS",
            "ACCESS_APPROVAL_MANAGEMENT", "ACCESS_ITEM_MANAGEMENT", "ACCESS_BUDGET_MANAGEMENT",
            "ACCESS_ADMIN_DASHBOARD", "MANAGE_USERS", "MANAGE_CONSULTANTS", "MANAGE_CLIENTS",
            "MANAGE_MAPPINGS", "VIEW_BRANCH_DETAILS", "ACCESS_SCHEDULE_MANAGEMENT",
            "ACCESS_STATISTICS", "REPORT_VIEW", "DASHBOARD_VIEW", "VIEW_FINANCIAL_STATISTICS", "VIEW_CONSULTATION_STATISTICS"
        );
        
        // SUPER_HQ_ADMIN 권한 (HQ_ADMIN과 동일 + 추가 권한)
        List<String> superHqAdminPermissions = List.of(
            "ACCESS_ERP_DASHBOARD", "ACCESS_INTEGRATED_FINANCE", "ACCESS_SALARY_MANAGEMENT",
            "ACCESS_TAX_MANAGEMENT", "ACCESS_REFUND_MANAGEMENT", "ACCESS_PURCHASE_REQUESTS",
            "ACCESS_APPROVAL_MANAGEMENT", "ACCESS_ITEM_MANAGEMENT", "ACCESS_BUDGET_MANAGEMENT",
            "ACCESS_ADMIN_DASHBOARD", "MANAGE_USERS", "MANAGE_CONSULTANTS", "MANAGE_CLIENTS",
            "MANAGE_MAPPINGS", "VIEW_ALL_BRANCHES", "VIEW_BRANCH_DETAILS", "REPORT_VIEW", "DASHBOARD_VIEW",
            "ACCESS_SCHEDULE_MANAGEMENT", "ACCESS_STATISTICS", "VIEW_FINANCIAL_STATISTICS",
            "VIEW_CONSULTATION_STATISTICS"
        );
        
        // HQ_MASTER 권한 (모든 권한) - 동적으로 관리되는 권한들은 제외
        List<String> hqMasterPermissions = List.of(
            "ACCESS_ERP_DASHBOARD", "ACCESS_INTEGRATED_FINANCE", "ACCESS_SALARY_MANAGEMENT",
            "ACCESS_TAX_MANAGEMENT", "ACCESS_REFUND_MANAGEMENT", "ACCESS_PURCHASE_REQUESTS",
            "ACCESS_APPROVAL_MANAGEMENT", "ACCESS_ITEM_MANAGEMENT", "ACCESS_BUDGET_MANAGEMENT",
            "ACCESS_ADMIN_DASHBOARD", "MANAGE_USERS", "MANAGE_CONSULTANTS", "MANAGE_CLIENTS",
            "MANAGE_MAPPINGS", "VIEW_ALL_BRANCHES", "VIEW_BRANCH_DETAILS",
            "ACCESS_SCHEDULE_MANAGEMENT", "CREATE_SCHEDULES", "MODIFY_SCHEDULES", "DELETE_SCHEDULES",
            "ACCESS_CONSULTATION_RECORDS", "CREATE_CONSULTATION_RECORDS", "MODIFY_CONSULTATION_RECORDS",
            "ACCESS_STATISTICS", "REPORT_VIEW", "DASHBOARD_VIEW", "VIEW_FINANCIAL_STATISTICS", "VIEW_CONSULTATION_STATISTICS",
            "SYSTEM_CONFIGURATION", "USER_ROLE_MANAGEMENT", "PERMISSION_MANAGEMENT"
        );
        
        // BRANCH_ADMIN 권한 (지점 관리자)
        List<String> branchAdminPermissions = List.of(
            "ADMIN_DASHBOARD_VIEW", "USER_MANAGE", "CONSULTANT_MANAGE", "CLIENT_MANAGE",
            "MAPPING_VIEW", "MAPPING_MANAGE", "BRANCH_DETAILS_VIEW",
            "ACCESS_SCHEDULE_MANAGEMENT", "SCHEDULE_MANAGE", "SCHEDULE_CREATE", "SCHEDULE_MODIFY", "SCHEDULE_DELETE",
            "CONSULTATION_RECORD_VIEW", "STATISTICS_VIEW", "CONSULTATION_STATISTICS_VIEW",
            "SYSTEM_NOTIFICATION_MANAGE"
        );
        
        // CONSULTANT 권한 (제한적)
        List<String> consultantPermissions = List.of(
            "ACCESS_SCHEDULE_MANAGEMENT", "CREATE_SCHEDULES", "MODIFY_SCHEDULES",
            "ACCESS_CONSULTATION_RECORDS", "CREATE_CONSULTATION_RECORDS",
            "ACCESS_STATISTICS", "VIEW_CONSULTATION_STATISTICS", "STATISTICS_VIEW", "MAPPING_VIEW"
        );
        
        // CLIENT 권한 (최소한)
        List<String> clientPermissions = List.of(
            "ACCESS_CONSULTATION_RECORDS"
        );
        
        // 권한 매핑 생성 (표준화 2025-12-05: 표준 역할만 사용)
        // 표준 관리자 역할 권한 설정
        createRolePermissions(UserRole.ADMIN.name(), adminPermissions);
        createRolePermissions(UserRole.TENANT_ADMIN.name(), adminPermissions); // 테넌트 관리자는 ADMIN과 동일 권한
        createRolePermissions(UserRole.PRINCIPAL.name(), adminPermissions); // 원장은 ADMIN과 동일 권한
        createRolePermissions(UserRole.OWNER.name(), hqMasterPermissions); // 사장은 모든 권한
        
        // 표준화 2025-12-05: 레거시 역할 제거
        // 레거시 역할은 더 이상 사용하지 않으므로 권한 설정도 제거
        // 하위 호환성이 필요한 경우 ADMIN 역할에 통합된 권한이 적용됨
        
        // 일반 역할 권한 설정
        createRolePermissions(UserRole.CONSULTANT.name(), consultantPermissions);
        createRolePermissions(UserRole.CLIENT.name(), clientPermissions);
        
        log.info("기본 역할별 권한 매핑 초기화 완료");
    }
    
    /**
     * 공통코드에서 권한 목록 동적 조회
     * @param codeGroup 권한 공통코드 그룹
     * @return 권한 코드 목록
     */
    private List<String> getPermissionsFromCommonCode(String codeGroup) {
        try {
            log.info("📋 공통코드에서 권한 조회: {}", codeGroup);
            
            List<CommonCode> permissions = commonCodeRepository.findByCodeGroupAndIsActiveTrueOrderBySortOrderAsc(codeGroup);
            
            List<String> permissionCodes = permissions.stream()
                .filter(code -> isAutoGrantPermission(code.getExtraData()))
                .map(CommonCode::getCodeValue)
                .collect(Collectors.toList());
            
            log.info("✅ 공통코드 권한 조회 완료: {} → {}개", codeGroup, permissionCodes.size());
            return permissionCodes;
            
        } catch (Exception e) {
            log.error("❌ 공통코드 권한 조회 실패: {}", codeGroup, e);
            
            // 폴백: 최소 필수 권한 반환
            return getMinimalAdminPermissions();
        }
    }
    
    /**
     * auto_grant 여부 확인
     */
    private boolean isAutoGrantPermission(String extraData) {
        if (extraData == null || extraData.trim().isEmpty()) {
            return true; // 기본값: 자동 부여
        }
        
        try {
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> data = objectMapper.readValue(extraData, java.util.Map.class);
            Object autoGrant = data.get("auto_grant");
            
            if (autoGrant instanceof Boolean) {
                return (Boolean) autoGrant;
            } else if (autoGrant instanceof String) {
                return Boolean.parseBoolean((String) autoGrant);
            }
            
            return true; // 기본값
            
        } catch (Exception e) {
            log.warn("extra_data 파싱 실패, 자동 부여로 처리: {}", extraData);
            return true;
        }
    }
    
    /**
     * 최소 필수 ADMIN 권한 (공통코드 실패 시 폴백)
     * 표준화 2025-12-08: ERP_ACCESS 권한 추가 (관리자는 ERP 접근 가능해야 함)
     */
    private List<String> getMinimalAdminPermissions() {
        return List.of(
            "DASHBOARD_VIEW",
            "USER_MANAGE", 
            "CLIENT_MANAGE",
            "CONSULTANT_MANAGE",
            "MAPPING_VIEW",
            "STATISTICS_VIEW",
            "ERP_ACCESS" // 표준화 2025-12-08: 관리자 ERP 접근 권한
        );
    }
    
    @Override
    @Transactional
    public void initializePermissionSystem() {
        log.info("🚀 권한 시스템 초기화 시작");
        
        try {
            // 이미 초기화되어 있으면 건너뛰기
            if (isPermissionSystemInitialized()) {
                log.info("✅ 권한 시스템이 이미 초기화되어 있음 - 건너뛰기");
                return;
            }
            
            log.info("🔄 권한 시스템 초기화 필요 - 기본 권한 생성 중...");
            
            initializeDefaultPermissions();
            initializeDefaultRolePermissions();
            
            log.info("✅ 권한 시스템 초기화 완료");
        } catch (Exception e) {
            log.error("❌ 권한 시스템 초기화 실패", e);
            throw e;
        }
    }
    
    @Override
    public boolean isPermissionSystemInitialized() {
        try {
            long permissionCount = permissionRepository.count();
            long rolePermissionCount = rolePermissionRepository.count();
            
            log.debug("권한 시스템 초기화 상태 확인: 권한={}개, 역할권한={}개", permissionCount, rolePermissionCount);
            
            // 최소한의 권한과 역할권한이 있어야 초기화된 것으로 간주
            // 추가: 특정 권한이 존재하는지도 확인 (더 정확한 판단)
            boolean hasSpecificPermission = permissionRepository.existsByPermissionCode("SYSTEM_NOTIFICATION_MANAGE");
            
            boolean initialized = permissionCount > 10 && rolePermissionCount > 20;
            
            if (initialized) {
                log.info("✅ 권한 시스템이 이미 초기화되어 있음 (권한={}개, 역할권한={}개, 시스템공지권한={})", 
                    permissionCount, rolePermissionCount, hasSpecificPermission);
            }
            
            return initialized;
            
        } catch (Exception e) {
            log.error("권한 시스템 초기화 상태 확인 중 오류", e);
            // 오류 발생 시 안전하게 초기화 진행
            return false;
        }
    }
    
    /**
     * 특정 역할에 권한들을 부여
     */
    private void createRolePermissions(String roleName, List<String> permissionCodes) {
        int createdCount = 0;
        int skippedCount = 0;
        List<RolePermission> permissionsToSave = new java.util.ArrayList<>();
        
        for (String permissionCode : permissionCodes) {
            // 권한이 존재하는지 확인 (is_active 상태와 관계없이)
            boolean exists = rolePermissionRepository.existsByRoleNameAndPermissionCode(roleName, permissionCode);
            
            if (!exists) {
                // 권한이 없으면 새로 생성 (배치 저장을 위해 리스트에 추가)
                RolePermission rolePermission = RolePermission.grant(roleName, permissionCode, "SYSTEM");
                permissionsToSave.add(rolePermission);
                createdCount++;
                log.debug("역할권한 생성 예정: {} - {}", roleName, permissionCode);
            } else {
                // 권한이 있으면 활성화 상태로 업데이트 (비활성화된 권한을 활성화)
                var existingPermission = rolePermissionRepository.findByRoleNameAndPermissionCode(roleName, permissionCode);
                if (existingPermission.isPresent() && !existingPermission.get().getIsActive()) {
                    existingPermission.get().setIsActive(true);
                    existingPermission.get().setUpdatedAt(java.time.LocalDateTime.now());
                    permissionsToSave.add(existingPermission.get());
                    createdCount++;
                    log.debug("역할권한 활성화 예정: {} - {}", roleName, permissionCode);
                } else {
                    skippedCount++;
                    log.debug("역할권한 이미 존재: {} - {}", roleName, permissionCode);
                }
            }
        }
        
        // 배치 저장
        if (!permissionsToSave.isEmpty()) {
            rolePermissionRepository.saveAll(permissionsToSave);
        }
        
        log.info("{} 권한 매핑 완료: {}개 생성/활성화, {}개 스킵", roleName, createdCount, skippedCount);
    }
}
