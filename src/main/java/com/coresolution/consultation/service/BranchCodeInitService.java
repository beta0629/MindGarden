package com.coresolution.consultation.service;

// 표준화 2025-12-05: 브랜치/HQ 개념 제거, 역할 체크를 공통코드 기반 동적 조회로 통합 (TENANT_ROLE_SYSTEM_STANDARD.md 준수)

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 지점 코드 초기화 서비스
 * HQ 본사 코드 추가를 위한 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BranchCodeInitService {
    
    private final CommonCodeService commonCodeService;
    
    private final CommonCodeRepository commonCodeRepository;
    private final UserRepository userRepository;
    
    /**
     * HQ 본사 코드 초기화
     */
    public void initializeHQBranchCode() {
        try {
            log.info("HQ 본사 코드 초기화 시작");
            
            // 1. HQ 본사 코드가 이미 있는지 확인 (테넌트별)
            String tenantId = TenantContextHolder.getTenantId();
            var existingHQ = tenantId != null 
                ? commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(tenantId, "BRANCH", "HQ")
                : commonCodeRepository.findByCodeGroupAndCodeValue("BRANCH", "HQ");
            
            if (existingHQ.isEmpty()) {
                // 2. HQ 본사 코드 생성
                CommonCode hqCode = new CommonCode();
                hqCode.setCodeGroup("BRANCH");
                hqCode.setCodeValue("HQ");
                hqCode.setCodeLabel("본사");
                hqCode.setCodeDescription("마인드가든 본사");
                hqCode.setSortOrder(1);
                hqCode.setIsActive(true);
                hqCode.setIsDeleted(false);
                hqCode.setCreatedAt(LocalDateTime.now());
                hqCode.setUpdatedAt(LocalDateTime.now());
                hqCode.setVersion(0L);
                hqCode.setExtraData("{\"type\": \"headquarters\", \"address\": \"서울특별시 강남구 테헤란로 456\", \"phone\": \"02-1234-5678\", \"email\": \"hq@mindgarden.com\"}");
                
                commonCodeRepository.save(hqCode);
                log.info("HQ 본사 코드 생성 완료");
            } else {
                log.info("HQ 본사 코드가 이미 존재함");
            }
            
            // 표준화 2025-12-06: branchCode는 더 이상 사용하지 않음
            // 3. 본사 관리자 계정들의 지점 코드 업데이트 제거
            log.warn("⚠️ Deprecated: branchCode 설정은 더 이상 사용하지 않음. tenantId 기반으로만 동작합니다.");
            
            // 4. 본사 역할의 모든 사용자 확인 (branchCode 설정 제거)
            // tenantId는 이미 위에서 선언됨
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return;
            }
            
            List<String> roleList = List.of("ADMIN"); // 표준화 2025-12-05: 브랜치/HQ 개념 제거
            var hqUsers = userRepository.findByRoleIn(tenantId, roleList);
            
            log.info("HQ 본사 코드 초기화 완료. 확인된 관리자 사용자 수: {} (branchCode는 더 이상 사용하지 않음)", hqUsers.size());
            
        } catch (Exception e) {
            log.error("HQ 본사 코드 초기화 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("HQ 본사 코드 초기화 실패", e);
        }
    }

    /**
     * 공통코드에서 관리자 역할인지 확인 (표준화 2025-12-05: 브랜치/HQ 개념 제거, 동적 역할 조회)
     * 표준 관리자 역할: ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER
     * 레거시 역할(HQ_*, BRANCH_*)은 더 이상 사용하지 않음
     * 
     * @param role 사용자 역할
     * @return 관리자 역할 여부
     */
    private boolean isAdminRoleFromCommonCode(UserRole role) {
        if (role == null) {
            return false;
        }

        try {
            // 공통코드에서 관리자 역할 목록 조회 (codeGroup='ROLE', extraData에 isAdmin=true)
            List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");

            if (roleCodes == null || roleCodes.isEmpty()) {
                // 폴백: 표준 관리자 역할만 체크 (브랜치/HQ 개념 제거)
                return role == UserRole.ADMIN || 
                       role == UserRole.TENANT_ADMIN || 
                       role == UserRole.PRINCIPAL || 
                       role == UserRole.OWNER;
            }

            // 공통코드에서 관리자 역할인지 확인
            String roleName = role.name();

            return roleCodes.stream()
                .anyMatch(code -> code.getCodeValue().equals(roleName) && 
                              (code.getExtraData() != null && 
                               (code.getExtraData().contains("\"isAdmin\":true") || 
                                code.getExtraData().contains("\"roleType\":\"ADMIN\""))));

        } catch (Exception e) {
            log.warn("공통코드에서 관리자 역할 조회 실패, 폴백 사용: {}", role, e);
            // 폴백: 표준 관리자 역할만 체크
            return role == UserRole.ADMIN || 
                   role == UserRole.TENANT_ADMIN || 
                   role == UserRole.PRINCIPAL || 
                   role == UserRole.OWNER;
        }
    }

    /**
     * 공통코드에서 사무원 역할인지 확인 (표준화 2025-12-05: 브랜치/HQ 개념 제거, 동적 역할 조회)
     * BRANCH_MANAGER → STAFF로 통합
     * 
     * @param role 사용자 역할
     * @return 사무원 역할 여부
     */
    private boolean isStaffRoleFromCommonCode(UserRole role) {
        if (role == null) {
            return false;
        }

        try {
            // 공통코드에서 사무원 역할 목록 조회
            List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");

            if (roleCodes == null || roleCodes.isEmpty()) {
                return role == UserRole.STAFF;
            }

            // 공통코드에서 사무원 역할인지 확인
            String roleName = role.name();

            return roleCodes.stream()
                .anyMatch(code -> code.getCodeValue().equals(roleName) && 
                              (code.getExtraData() != null && 
                               (code.getExtraData().contains("\"isStaff\":true") || 
                                code.getExtraData().contains("\"roleType\":\"STAFF\""))));

        } catch (Exception e) {
            log.warn("공통코드에서 사무원 역할 조회 실패, 폴백 사용: {}", role, e);
            return role == UserRole.STAFF;
        }
    }
}
