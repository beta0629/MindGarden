package com.coresolution.core.service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.coresolution.core.domain.WidgetDefinition;
import com.coresolution.core.domain.WidgetGroup;
import com.coresolution.core.dto.WidgetDefinitionResponse;
import com.coresolution.core.dto.WidgetGroupResponse;
import com.coresolution.core.repository.WidgetDefinitionRepository;
import com.coresolution.core.repository.WidgetGroupRepository;
import com.coresolution.core.security.TenantAccessControlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * 위젯 그룹 서비스
 * 
 * 목적: 위젯 그룹 관리 및 조회
 * 표준: LOGGING_STANDARD.md 준수
 * 
 * @author CoreSolution Team
 * @since 2025-12-02
 */
@Service
@Slf4j
@Transactional(readOnly = true)
public class WidgetGroupService {
    
    @Autowired
    private WidgetGroupRepository widgetGroupRepository;
    
    @Autowired
    private WidgetDefinitionRepository widgetDefinitionRepository;
    
    @Autowired
    private TenantAccessControlService accessControlService;
    
    /**
     * 업종 + 역할별 위젯 그룹 조회
     */
    public List<WidgetGroupResponse> getWidgetGroups(
            String tenantId,
            String businessType,
            String roleCode) {
        
        // ✅ 표준: 테넌트 접근 권한 검증
        accessControlService.validateTenantAccess(tenantId);
        
        // ✅ 표준: 구조화된 로깅
        log.debug("위젯 그룹 조회: tenantId={}, businessType={}, roleCode={}", 
                tenantId, businessType, roleCode);
        
        List<WidgetGroup> groups = widgetGroupRepository
                .findByTenantAndBusinessTypeAndRoleCode(tenantId, businessType, roleCode);
        
        log.debug("위젯 그룹 조회 완료: count={}", groups.size());
        
        return WidgetGroupResponse.fromList(groups);
    }
    
    /**
     * 그룹별 위젯 정의 조회
     */
    public List<WidgetDefinitionResponse> getWidgetsByGroup(String groupId) {
        log.debug("그룹별 위젯 조회: groupId={}", groupId);
        
        List<WidgetDefinition> widgets = widgetDefinitionRepository
                .findByGroupIdAndIsDeletedFalseAndIsActiveTrueOrderByDisplayOrderAsc(groupId);
        
        log.debug("그룹별 위젯 조회 완료: groupId={}, count={}", groupId, widgets.size());
        
        return WidgetDefinitionResponse.fromList(widgets);
    }
    
    /**
     * 업종 + 역할별 모든 위젯 조회 (그룹화됨)
     */
    public Map<String, List<WidgetDefinitionResponse>> getGroupedWidgets(
            String tenantId,
            String businessType,
            String roleCode) {
        
        accessControlService.validateTenantAccess(tenantId);
        
        log.debug("그룹화된 위젯 조회: tenantId={}, businessType={}, roleCode={}", 
                tenantId, businessType, roleCode);
        
        // 1. 위젯 그룹 조회
        List<WidgetGroup> groups = widgetGroupRepository
                .findByTenantAndBusinessTypeAndRoleCode(tenantId, businessType, roleCode);
        
        // 2. 각 그룹별 위젯 조회
        Map<String, List<WidgetDefinitionResponse>> result = new LinkedHashMap<>();
        
        for (WidgetGroup group : groups) {
            List<WidgetDefinition> widgets = widgetDefinitionRepository
                    .findByGroupIdAndIsDeletedFalseAndIsActiveTrueOrderByDisplayOrderAsc(
                            group.getGroupId());
            
            result.put(group.getGroupName(), WidgetDefinitionResponse.fromList(widgets));
        }
        
        log.debug("그룹화된 위젯 조회 완료: groupCount={}, totalWidgets={}", 
                result.size(), 
                result.values().stream().mapToInt(List::size).sum());
        
        return result;
    }
    
    /**
     * 독립 위젯 조회 (사용자가 추가 가능한 위젯)
     */
    public List<WidgetDefinitionResponse> getAvailableIndependentWidgets(String businessType) {
        log.debug("독립 위젯 조회: businessType={}", businessType);
        
        List<WidgetDefinition> widgets = widgetDefinitionRepository
                .findAvailableIndependentWidgets(businessType);
        
        log.debug("독립 위젯 조회 완료: count={}", widgets.size());
        
        return WidgetDefinitionResponse.fromList(widgets);
    }
    
    /**
     * 위젯 그룹 생성
     */
    @Transactional
    public WidgetGroupResponse createWidgetGroup(
            String tenantId,
            String groupName,
            String businessType,
            String roleCode,
            Integer displayOrder,
            String description,
            String createdBy) {
        
        accessControlService.validateTenantAccess(tenantId);
        
        log.info("위젯 그룹 생성: tenantId={}, groupName={}, businessType={}, roleCode={}, createdBy={}", 
                tenantId, groupName, businessType, roleCode, createdBy);
        
        // 중복 확인
        boolean exists = widgetGroupRepository
                .existsByTenantIdAndBusinessTypeAndRoleCodeAndGroupNameAndIsDeletedFalse(
                        tenantId, businessType, roleCode, groupName);
        
        if (exists) {
            throw new IllegalArgumentException("이미 존재하는 위젯 그룹입니다");
        }
        
        WidgetGroup group = WidgetGroup.builder()
                .groupId(UUID.randomUUID().toString())
                .tenantId(tenantId)
                .groupName(groupName)
                .groupNameKo(groupName)
                .businessType(businessType)
                .roleCode(roleCode)
                .displayOrder(displayOrder)
                .description(description)
                .createdBy(createdBy)
                .build();
        
        WidgetGroup saved = widgetGroupRepository.save(group);
        
        log.info("위젯 그룹 생성 완료: groupId={}", saved.getGroupId());
        
        return WidgetGroupResponse.from(saved);
    }
    
    /**
     * 위젯 그룹 삭제 (소프트 삭제)
     */
    @Transactional
    public void deleteWidgetGroup(String tenantId, String groupId, String deletedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        log.info("위젯 그룹 삭제: tenantId={}, groupId={}, deletedBy={}", 
                tenantId, groupId, deletedBy);
        
        WidgetGroup group = widgetGroupRepository
                .findByGroupIdAndTenantIdAndIsDeletedFalse(groupId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("위젯 그룹을 찾을 수 없습니다"));
        
        // 시스템 그룹은 삭제 불가
        if (group.isSystemGroup()) {
            throw new IllegalStateException("시스템 위젯 그룹은 삭제할 수 없습니다");
        }
        
        // ✅ 표준: 소프트 삭제
        group.setIsDeleted(true);
        group.setDeletedAt(LocalDateTime.now());
        group.setDeletedBy(deletedBy);
        
        widgetGroupRepository.save(group);
        
        log.info("위젯 그룹 삭제 완료: groupId={}", groupId);
    }
}

