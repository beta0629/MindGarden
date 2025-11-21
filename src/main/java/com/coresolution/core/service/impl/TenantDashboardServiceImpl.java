package com.coresolution.core.service.impl;

import com.coresolution.core.domain.TenantDashboard;
import com.coresolution.core.domain.TenantRole;
import com.coresolution.core.dto.TenantDashboardRequest;
import com.coresolution.core.dto.TenantDashboardResponse;
import com.coresolution.core.repository.TenantDashboardRepository;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.RoleTemplateRepository;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.TenantDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 테넌트 대시보드 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TenantDashboardServiceImpl implements TenantDashboardService {
    
    private final TenantDashboardRepository dashboardRepository;
    private final TenantRoleRepository tenantRoleRepository;
    private final RoleTemplateRepository roleTemplateRepository;
    private final TenantAccessControlService accessControlService;
    
    @Override
    @Transactional(readOnly = true)
    public List<TenantDashboardResponse> getDashboardsByTenant(String tenantId) {
        log.debug("테넌트별 대시보드 목록 조회: tenantId={}", tenantId);
        
        accessControlService.validateTenantAccess(tenantId);
        
        List<TenantDashboard> dashboards = dashboardRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        
        return dashboards.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public TenantDashboardResponse getDashboard(String tenantId, String dashboardId) {
        log.debug("대시보드 상세 조회: tenantId={}, dashboardId={}", tenantId, dashboardId);
        
        accessControlService.validateTenantAccess(tenantId);
        
        TenantDashboard dashboard = dashboardRepository.findByDashboardIdAndIsDeletedFalse(dashboardId)
                .orElseThrow(() -> new RuntimeException("대시보드를 찾을 수 없습니다: " + dashboardId));
        
        if (!dashboard.getTenantId().equals(tenantId)) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        return toResponse(dashboard);
    }
    
    @Override
    public TenantDashboardResponse createDashboard(String tenantId, TenantDashboardRequest request, String createdBy) {
        log.info("대시보드 생성: tenantId={}, dashboardName={}, createdBy={}", 
                tenantId, request.getDashboardNameKo(), createdBy);
        
        accessControlService.validateTenantAccess(tenantId);
        
        // 역할 존재 확인
        TenantRole role = tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(request.getTenantRoleId())
                .orElseThrow(() -> new RuntimeException("역할을 찾을 수 없습니다: " + request.getTenantRoleId()));
        
        if (!role.getTenantId().equals(tenantId)) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        // 중복 확인 (같은 역할에 대시보드가 이미 있는지)
        dashboardRepository.findByTenantIdAndTenantRoleId(tenantId, request.getTenantRoleId())
                .ifPresent(existing -> {
                    throw new RuntimeException("해당 역할에 이미 대시보드가 존재합니다.");
                });
        
        // 대시보드 생성
        String dashboardId = UUID.randomUUID().toString();
        TenantDashboard dashboard = TenantDashboard.builder()
                .dashboardId(dashboardId)
                .tenantId(tenantId)
                .tenantRoleId(request.getTenantRoleId())
                .dashboardName(request.getDashboardName() != null ? request.getDashboardName() : request.getDashboardNameKo())
                .dashboardNameKo(request.getDashboardNameKo())
                .dashboardNameEn(request.getDashboardNameEn())
                .description(request.getDescription())
                .dashboardType(request.getDashboardType())
                .isDefault(false) // 관리자가 생성한 대시보드는 기본 대시보드 아님
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .dashboardConfig(request.getDashboardConfig())
                .build();
        
        TenantDashboard saved = dashboardRepository.save(dashboard);
        
        log.info("대시보드 생성 완료: dashboardId={}", dashboardId);
        return toResponse(saved);
    }
    
    @Override
    public TenantDashboardResponse updateDashboard(String tenantId, String dashboardId, TenantDashboardRequest request, String updatedBy) {
        log.info("대시보드 수정: tenantId={}, dashboardId={}, updatedBy={}", tenantId, dashboardId, updatedBy);
        
        accessControlService.validateTenantAccess(tenantId);
        
        TenantDashboard dashboard = dashboardRepository.findByDashboardIdAndIsDeletedFalse(dashboardId)
                .orElseThrow(() -> new RuntimeException("대시보드를 찾을 수 없습니다: " + dashboardId));
        
        if (!dashboard.getTenantId().equals(tenantId)) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        // 대시보드 정보 업데이트 (이름 등)
        if (request.getDashboardName() != null) dashboard.setDashboardName(request.getDashboardName());
        if (request.getDashboardNameKo() != null) dashboard.setDashboardNameKo(request.getDashboardNameKo());
        if (request.getDashboardNameEn() != null) dashboard.setDashboardNameEn(request.getDashboardNameEn());
        if (request.getDescription() != null) dashboard.setDescription(request.getDescription());
        if (request.getDashboardType() != null) dashboard.setDashboardType(request.getDashboardType());
        if (request.getIsActive() != null) dashboard.setIsActive(request.getIsActive());
        if (request.getDisplayOrder() != null) dashboard.setDisplayOrder(request.getDisplayOrder());
        if (request.getDashboardConfig() != null) dashboard.setDashboardConfig(request.getDashboardConfig());
        
        // 역할 변경 시 중복 확인
        if (request.getTenantRoleId() != null && !request.getTenantRoleId().equals(dashboard.getTenantRoleId())) {
            dashboardRepository.findByTenantIdAndTenantRoleId(tenantId, request.getTenantRoleId())
                    .ifPresent(existing -> {
                        if (!existing.getDashboardId().equals(dashboardId)) {
                            throw new RuntimeException("해당 역할에 이미 대시보드가 존재합니다.");
                        }
                    });
            
            TenantRole role = tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(request.getTenantRoleId())
                    .orElseThrow(() -> new RuntimeException("역할을 찾을 수 없습니다: " + request.getTenantRoleId()));
            
            if (!role.getTenantId().equals(tenantId)) {
                throw new RuntimeException("접근 권한이 없습니다.");
            }
            
            dashboard.setTenantRoleId(request.getTenantRoleId());
        }
        
        TenantDashboard updated = dashboardRepository.save(dashboard);
        
        log.info("대시보드 수정 완료: dashboardId={}", dashboardId);
        return toResponse(updated);
    }
    
    @Override
    public void deleteDashboard(String tenantId, String dashboardId, String deletedBy) {
        log.info("대시보드 삭제: tenantId={}, dashboardId={}, deletedBy={}", tenantId, dashboardId, deletedBy);
        
        accessControlService.validateTenantAccess(tenantId);
        
        TenantDashboard dashboard = dashboardRepository.findByDashboardIdAndIsDeletedFalse(dashboardId)
                .orElseThrow(() -> new RuntimeException("대시보드를 찾을 수 없습니다: " + dashboardId));
        
        if (!dashboard.getTenantId().equals(tenantId)) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        // 기본 대시보드는 삭제 불가 (필수 대시보드)
        if (dashboard.getIsDefault() != null && dashboard.getIsDefault()) {
            throw new RuntimeException("기본 대시보드는 삭제할 수 없습니다. 비활성화만 가능합니다.");
        }
        
        // 소프트 삭제
        dashboard.delete();
        dashboardRepository.save(dashboard);
        
        log.info("대시보드 삭제 완료: dashboardId={}", dashboardId);
    }
    
    @Override
    public List<TenantDashboardResponse> createDefaultDashboards(String tenantId, String businessType, String createdBy) {
        log.info("기본 대시보드 생성: tenantId={}, businessType={}, createdBy={}", tenantId, businessType, createdBy);
        
        accessControlService.validateTenantAccess(tenantId);
        
        // 업종별 기본 역할 템플릿 조회
        List<com.coresolution.core.domain.RoleTemplate> templates = roleTemplateRepository
                .findByBusinessTypeAndActive(businessType);
        
        // 학원(ACADEMY) 기준 기본 역할: 학생(STUDENT), 선생님(TEACHER), 관리자(ADMIN)
        // 다른 업종도 동일한 패턴으로 확장 가능
        String[] defaultRoleCodes = {"STUDENT", "TEACHER", "ADMIN"};
        String[] defaultRoleNames = {"학생", "선생님", "관리자"};
        String[] defaultDashboardNames = {"학생 대시보드", "선생님 대시보드", "관리자 대시보드"};
        
        // 업종별 기본 역할 코드 매핑 (확장 가능)
        if (!"ACADEMY".equalsIgnoreCase(businessType)) {
            // 상담소(CONSULTATION) 등 다른 업종의 경우
            defaultRoleCodes = new String[]{"CLIENT", "CONSULTANT", "ADMIN"};
            defaultRoleNames = new String[]{"내담자", "상담사", "관리자"};
            defaultDashboardNames = new String[]{"내담자 대시보드", "상담사 대시보드", "관리자 대시보드"};
        }
        
        List<TenantDashboardResponse> createdDashboards = new java.util.ArrayList<>();
        
        // 각 기본 역할에 대해 대시보드 생성
        for (int i = 0; i < defaultRoleCodes.length; i++) {
            String roleCode = defaultRoleCodes[i];
            String roleName = defaultRoleNames[i];
            String dashboardName = defaultDashboardNames[i];
            
            // 템플릿 코드로 역할 템플릿 찾기
            com.coresolution.core.domain.RoleTemplate template = templates.stream()
                    .filter(t -> roleCode.equals(t.getTemplateCode()))
                    .findFirst()
                    .orElse(null);
            
            if (template == null) {
                log.warn("기본 역할 템플릿을 찾을 수 없음: roleCode={}, businessType={}", roleCode, businessType);
                continue;
            }
            
            // 템플릿 기반 역할이 이미 생성되었는지 확인
            List<TenantRole> tenantRoles = tenantRoleRepository.findByTenantIdAndRoleTemplateId(
                    tenantId, template.getRoleTemplateId());
            
            if (tenantRoles.isEmpty()) {
                log.warn("테넌트 역할이 아직 생성되지 않음: roleTemplateId={}", template.getRoleTemplateId());
                continue;
            }
            
            TenantRole tenantRole = tenantRoles.get(0);
            
            // 이미 대시보드가 있는지 확인
            Optional<TenantDashboard> existing = dashboardRepository.findByTenantIdAndTenantRoleId(
                    tenantId, tenantRole.getTenantRoleId());
            
            if (existing.isPresent()) {
                log.info("대시보드가 이미 존재함: tenantRoleId={}", tenantRole.getTenantRoleId());
                createdDashboards.add(toResponse(existing.get()));
                continue;
            }
            
            // 기본 대시보드 생성
            String dashboardId = UUID.randomUUID().toString();
            TenantDashboard dashboard = TenantDashboard.builder()
                    .dashboardId(dashboardId)
                    .tenantId(tenantId)
                    .tenantRoleId(tenantRole.getTenantRoleId())
                    .dashboardName(dashboardName)
                    .dashboardNameKo(dashboardName)
                    .dashboardNameEn(roleCode + " Dashboard")
                    .description(roleName + "용 기본 대시보드입니다.")
                    .dashboardType(roleCode)
                    .isDefault(true) // 기본 대시보드
                    .isActive(true)
                    .displayOrder(i + 1)
                    .dashboardConfig(null) // 기본 설정은 나중에 추가 가능
                    .build();
            
            TenantDashboard saved = dashboardRepository.save(dashboard);
            createdDashboards.add(toResponse(saved));
            
            log.info("기본 대시보드 생성 완료: dashboardId={}, roleName={}", dashboardId, roleName);
        }
        
        log.info("기본 대시보드 생성 완료: tenantId={}, count={}", tenantId, createdDashboards.size());
        return createdDashboards;
    }
    
    @Override
    @Transactional(readOnly = true)
    public TenantDashboardResponse getDashboardByRole(String tenantId, String tenantRoleId) {
        log.debug("역할별 대시보드 조회: tenantId={}, tenantRoleId={}", tenantId, tenantRoleId);
        
        accessControlService.validateTenantAccess(tenantId);
        
        TenantDashboard dashboard = dashboardRepository
                .findByTenantIdAndTenantRoleId(tenantId, tenantRoleId)
                .orElse(null);
        
        if (dashboard == null || !dashboard.getIsActive()) {
            log.debug("활성 대시보드를 찾을 수 없음: tenantId={}, tenantRoleId={}", tenantId, tenantRoleId);
            return null;
        }
        
        return toResponse(dashboard);
    }
    
    /**
     * TenantDashboard를 TenantDashboardResponse로 변환
     */
    private TenantDashboardResponse toResponse(TenantDashboard dashboard) {
        // 역할 정보 조회
        TenantRole role = tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(dashboard.getTenantRoleId())
                .orElse(null);
        
        return TenantDashboardResponse.builder()
                .dashboardId(dashboard.getDashboardId())
                .tenantId(dashboard.getTenantId())
                .tenantRoleId(dashboard.getTenantRoleId())
                .roleName(role != null ? role.getName() : null)
                .roleNameKo(role != null ? role.getNameKo() : null)
                .dashboardName(dashboard.getDashboardName())
                .dashboardNameKo(dashboard.getDashboardNameKo())
                .dashboardNameEn(dashboard.getDashboardNameEn())
                .description(dashboard.getDescription())
                .dashboardType(dashboard.getDashboardType())
                .isDefault(dashboard.getIsDefault())
                .isActive(dashboard.getIsActive())
                .displayOrder(dashboard.getDisplayOrder())
                .dashboardConfig(dashboard.getDashboardConfig())
                .build();
    }
}

