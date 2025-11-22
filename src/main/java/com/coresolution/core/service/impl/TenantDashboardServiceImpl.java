package com.coresolution.core.service.impl;

import com.coresolution.core.constant.DashboardConstants;
import com.coresolution.core.constant.RoleConstants;
import com.coresolution.core.domain.RoleTemplate;
import com.coresolution.core.domain.TenantDashboard;
import com.coresolution.core.domain.TenantRole;
import com.coresolution.core.dto.TenantDashboardRequest;
import com.coresolution.core.dto.TenantDashboardResponse;
import com.coresolution.core.repository.RoleTemplateRepository;
import com.coresolution.core.repository.TenantDashboardRepository;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.TenantDashboardService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.MessageFormat;
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
                .orElseThrow(() -> new RuntimeException(MessageFormat.format(DashboardConstants.ERROR_DASHBOARD_NOT_FOUND, dashboardId)));
        
        if (!dashboard.getTenantId().equals(tenantId)) {
            throw new RuntimeException(DashboardConstants.ERROR_ACCESS_DENIED);
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
                .orElseThrow(() -> new RuntimeException(RoleConstants.formatError(RoleConstants.ERROR_ROLE_NOT_FOUND, request.getTenantRoleId())));
        
        if (!role.getTenantId().equals(tenantId)) {
            throw new RuntimeException(RoleConstants.ERROR_ACCESS_DENIED);
        }
        
        // 중복 확인 (같은 역할에 대시보드가 이미 있는지)
        dashboardRepository.findByTenantIdAndTenantRoleId(tenantId, request.getTenantRoleId())
                .ifPresent(existing -> {
                    throw new RuntimeException(DashboardConstants.ERROR_DASHBOARD_ALREADY_EXISTS);
                });
        
        // dashboardConfig 검증
        if (request.getDashboardConfig() != null && !request.getDashboardConfig().trim().isEmpty()) {
            validateDashboardConfig(request.getDashboardConfig());
        }
        
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
                .orElseThrow(() -> new RuntimeException(MessageFormat.format(DashboardConstants.ERROR_DASHBOARD_NOT_FOUND, dashboardId)));
        
        if (!dashboard.getTenantId().equals(tenantId)) {
            throw new RuntimeException(DashboardConstants.ERROR_ACCESS_DENIED);
        }
        
        // 대시보드 정보 업데이트 (이름 등)
        if (request.getDashboardName() != null) dashboard.setDashboardName(request.getDashboardName());
        if (request.getDashboardNameKo() != null) dashboard.setDashboardNameKo(request.getDashboardNameKo());
        if (request.getDashboardNameEn() != null) dashboard.setDashboardNameEn(request.getDashboardNameEn());
        if (request.getDescription() != null) dashboard.setDescription(request.getDescription());
        if (request.getDashboardType() != null) dashboard.setDashboardType(request.getDashboardType());
        if (request.getIsActive() != null) dashboard.setIsActive(request.getIsActive());
        if (request.getDisplayOrder() != null) dashboard.setDisplayOrder(request.getDisplayOrder());
        if (request.getDashboardConfig() != null) {
            // dashboardConfig 검증
            if (!request.getDashboardConfig().trim().isEmpty()) {
                validateDashboardConfig(request.getDashboardConfig());
            }
            dashboard.setDashboardConfig(request.getDashboardConfig());
        }
        
        // 역할 변경 시 중복 확인
        if (request.getTenantRoleId() != null && !request.getTenantRoleId().equals(dashboard.getTenantRoleId())) {
            dashboardRepository.findByTenantIdAndTenantRoleId(tenantId, request.getTenantRoleId())
                    .ifPresent(existing -> {
                        if (!existing.getDashboardId().equals(dashboardId)) {
                            throw new RuntimeException(DashboardConstants.ERROR_DASHBOARD_ALREADY_EXISTS);
                        }
                    });
            
            TenantRole role = tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(request.getTenantRoleId())
                    .orElseThrow(() -> new RuntimeException(RoleConstants.formatError(RoleConstants.ERROR_ROLE_NOT_FOUND, request.getTenantRoleId())));
            
            if (!role.getTenantId().equals(tenantId)) {
                throw new RuntimeException(RoleConstants.ERROR_ACCESS_DENIED);
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
                .orElseThrow(() -> new RuntimeException(MessageFormat.format(DashboardConstants.ERROR_DASHBOARD_NOT_FOUND, dashboardId)));
        
        if (!dashboard.getTenantId().equals(tenantId)) {
            throw new RuntimeException(DashboardConstants.ERROR_ACCESS_DENIED);
        }
        
        // 기본 대시보드는 삭제 불가 (필수 대시보드)
        if (dashboard.getIsDefault() != null && dashboard.getIsDefault()) {
            throw new RuntimeException(DashboardConstants.ERROR_DEFAULT_DASHBOARD_CANNOT_DELETE);
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
        List<RoleTemplate> templates = roleTemplateRepository
                .findByBusinessTypeAndActive(businessType);
        
        // 학원(ACADEMY) 기준 기본 역할: 학생(STUDENT), 선생님(TEACHER), 관리자(ADMIN)
        // 다른 업종도 동일한 패턴으로 확장 가능
        String[] defaultRoleCodes;
        String[] defaultRoleNames;
        String[] defaultDashboardNames;
        
        // 업종별 기본 역할 코드 매핑 (확장 가능)
        if (DashboardConstants.BUSINESS_TYPE_ACADEMY.equalsIgnoreCase(businessType)) {
            defaultRoleCodes = new String[]{
                DashboardConstants.ROLE_CODE_STUDENT,
                DashboardConstants.ROLE_CODE_TEACHER,
                DashboardConstants.ROLE_CODE_ADMIN
            };
            defaultRoleNames = new String[]{
                DashboardConstants.ROLE_NAME_STUDENT,
                DashboardConstants.ROLE_NAME_TEACHER,
                DashboardConstants.ROLE_NAME_ADMIN
            };
            defaultDashboardNames = new String[]{
                DashboardConstants.DASHBOARD_NAME_STUDENT,
                DashboardConstants.DASHBOARD_NAME_TEACHER,
                DashboardConstants.DASHBOARD_NAME_ADMIN
            };
        } else {
            // 상담소(CONSULTATION) 등 다른 업종의 경우
            defaultRoleCodes = new String[]{
                DashboardConstants.ROLE_CODE_CLIENT,
                DashboardConstants.ROLE_CODE_CONSULTANT,
                DashboardConstants.ROLE_CODE_ADMIN
            };
            defaultRoleNames = new String[]{
                DashboardConstants.ROLE_NAME_CLIENT,
                DashboardConstants.ROLE_NAME_CONSULTANT,
                DashboardConstants.ROLE_NAME_ADMIN
            };
            defaultDashboardNames = new String[]{
                DashboardConstants.DASHBOARD_NAME_CLIENT,
                DashboardConstants.DASHBOARD_NAME_CONSULTANT,
                DashboardConstants.DASHBOARD_NAME_ADMIN
            };
        }
        
        List<TenantDashboardResponse> createdDashboards = new java.util.ArrayList<>();
        
        // 각 기본 역할에 대해 대시보드 생성
        for (int i = 0; i < defaultRoleCodes.length; i++) {
            String roleCode = defaultRoleCodes[i];
            String roleName = defaultRoleNames[i];
            String dashboardName = defaultDashboardNames[i];
            
            // 템플릿 코드로 역할 템플릿 찾기
            RoleTemplate template = templates.stream()
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
                    .description(MessageFormat.format(DashboardConstants.DASHBOARD_DESCRIPTION_TEMPLATE, roleName))
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
    
    /**
     * dashboardConfig JSON 스키마 검증
     * 
     * @param dashboardConfig JSON 문자열
     * @throws IllegalArgumentException 스키마 검증 실패 시
     */
    private void validateDashboardConfig(String dashboardConfig) {
        if (dashboardConfig == null || dashboardConfig.trim().isEmpty()) {
            return; // null 또는 빈 문자열은 허용 (기본 설정 사용)
        }
        
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode config = mapper.readTree(dashboardConfig);
            
            // 필수 필드 검증
            if (!config.has("version")) {
                throw new IllegalArgumentException("dashboardConfig에 version 필드가 없습니다.");
            }
            
            if (!config.has("layout")) {
                throw new IllegalArgumentException("dashboardConfig에 layout 필드가 없습니다.");
            }
            
            JsonNode layout = config.get("layout");
            if (!layout.has("type")) {
                throw new IllegalArgumentException("dashboardConfig.layout에 type 필드가 없습니다.");
            }
            
            String layoutType = layout.get("type").asText();
            if (!isValidLayoutType(layoutType)) {
                throw new IllegalArgumentException("지원되지 않는 layout.type: " + layoutType);
            }
            
            // 위젯 검증
            if (config.has("widgets") && config.get("widgets").isArray()) {
                for (JsonNode widget : config.get("widgets")) {
                    validateWidget(widget);
                }
            }
            
            log.debug("dashboardConfig 검증 완료");
            
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("dashboardConfig JSON 파싱 실패: " + e.getMessage(), e);
        }
    }
    
    /**
     * 레이아웃 타입 검증
     */
    private boolean isValidLayoutType(String layoutType) {
        return layoutType != null && (
            "grid".equalsIgnoreCase(layoutType) ||
            "list".equalsIgnoreCase(layoutType) ||
            "masonry".equalsIgnoreCase(layoutType) ||
            "custom".equalsIgnoreCase(layoutType)
        );
    }
    
    /**
     * 위젯 검증
     */
    private void validateWidget(JsonNode widget) {
        if (!widget.has("id")) {
            throw new IllegalArgumentException("위젯에 id 필드가 없습니다.");
        }
        if (!widget.has("type")) {
            throw new IllegalArgumentException("위젯에 type 필드가 없습니다.");
        }
        if (!widget.has("position")) {
            throw new IllegalArgumentException("위젯에 position 필드가 없습니다.");
        }
        
        JsonNode position = widget.get("position");
        if (!position.has("row") || !position.has("col")) {
            throw new IllegalArgumentException("위젯 position에 row 또는 col 필드가 없습니다.");
        }
        
        // 타입 검증
        int row = position.get("row").asInt();
        int col = position.get("col").asInt();
        if (row < 0 || col < 0) {
            throw new IllegalArgumentException("위젯 position의 row와 col은 0 이상이어야 합니다.");
        }
        
        if (position.has("span")) {
            int span = position.get("span").asInt();
            if (span < 1 || span > 12) {
                throw new IllegalArgumentException("위젯 position의 span은 1-12 사이여야 합니다.");
            }
        }
    }
}

