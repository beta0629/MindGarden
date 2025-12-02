package com.coresolution.core.service;

import com.coresolution.core.domain.WidgetDefinition;
import com.coresolution.core.repository.WidgetDefinitionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 위젯 권한 서비스
 * 
 * 목적: 위젯 추가/삭제/수정 권한 검증
 * 표준: LOGGING_STANDARD.md 준수
 * 
 * @author CoreSolution Team
 * @since 2025-12-02
 */
@Service
@Slf4j
@Transactional(readOnly = true)
public class WidgetPermissionService {
    
    @Autowired
    private WidgetDefinitionRepository widgetDefinitionRepository;
    
    /**
     * 위젯 삭제 가능 여부 확인
     * 
     * @param widgetId 위젯 ID
     * @return 삭제 가능 여부
     */
    public boolean canDeleteWidget(String widgetId) {
        log.debug("위젯 삭제 권한 확인: widgetId={}", widgetId);
        
        WidgetDefinition widget = widgetDefinitionRepository
                .findByWidgetIdAndIsDeletedFalse(widgetId)
                .orElseThrow(() -> new IllegalArgumentException("위젯을 찾을 수 없습니다"));
        
        // 시스템 관리 위젯은 삭제 불가
        if (widget.getIsSystemManaged()) {
            log.warn("시스템 관리 위젯 삭제 시도: widgetId={}", widgetId);
            return false;
        }
        
        // 삭제 가능 플래그 확인
        boolean canDelete = widget.getIsDeletable();
        
        log.debug("위젯 삭제 권한 확인 완료: widgetId={}, canDelete={}", widgetId, canDelete);
        
        return canDelete;
    }
    
    /**
     * 위젯 추가 가능 여부 확인
     * 
     * @param widgetType 위젯 타입
     * @param businessType 업종
     * @return 추가 가능 여부
     */
    public boolean canAddWidget(String widgetType, String businessType) {
        log.debug("위젯 추가 권한 확인: widgetType={}, businessType={}", widgetType, businessType);
        
        // 독립 위젯만 추가 가능 (is_system_managed = false)
        boolean canAdd = widgetDefinitionRepository
                .findAvailableIndependentWidgets(businessType)
                .stream()
                .anyMatch(w -> w.getWidgetType().equals(widgetType));
        
        log.debug("위젯 추가 권한 확인 완료: widgetType={}, canAdd={}", widgetType, canAdd);
        
        return canAdd;
    }
    
    /**
     * 위젯 설정 변경 가능 여부 확인
     * 
     * @param widgetId 위젯 ID
     * @return 설정 변경 가능 여부
     */
    public boolean canConfigureWidget(String widgetId) {
        log.debug("위젯 설정 변경 권한 확인: widgetId={}", widgetId);
        
        WidgetDefinition widget = widgetDefinitionRepository
                .findByWidgetIdAndIsDeletedFalse(widgetId)
                .orElseThrow(() -> new IllegalArgumentException("위젯을 찾을 수 없습니다"));
        
        boolean canConfigure = widget.getIsConfigurable();
        
        log.debug("위젯 설정 변경 권한 확인 완료: widgetId={}, canConfigure={}", 
                widgetId, canConfigure);
        
        return canConfigure;
    }
    
    /**
     * 위젯 이동 가능 여부 확인
     * 
     * @param widgetId 위젯 ID
     * @return 이동 가능 여부
     */
    public boolean canMoveWidget(String widgetId) {
        log.debug("위젯 이동 권한 확인: widgetId={}", widgetId);
        
        WidgetDefinition widget = widgetDefinitionRepository
                .findByWidgetIdAndIsDeletedFalse(widgetId)
                .orElseThrow(() -> new IllegalArgumentException("위젯을 찾을 수 없습니다"));
        
        boolean canMove = widget.getIsMovable();
        
        log.debug("위젯 이동 권한 확인 완료: widgetId={}, canMove={}", widgetId, canMove);
        
        return canMove;
    }
    
    /**
     * 시스템 관리 위젯 여부 확인
     * 
     * @param widgetId 위젯 ID
     * @return 시스템 관리 위젯 여부
     */
    public boolean isSystemManagedWidget(String widgetId) {
        return widgetDefinitionRepository
                .isSystemManagedWidget(widgetId)
                .orElse(false);
    }
}

