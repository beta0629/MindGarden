package com.coresolution.core.service.impl;
import com.coresolution.core.context.TenantContextHolder;

import com.coresolution.core.repository.RoleTemplateRepository;
import com.coresolution.core.service.RoleTemplateInitializationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 역할 템플릿 초기화 서비스 구현체
 * 시스템 메타데이터인 RoleTemplate의 초기화 상태를 검증
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoleTemplateInitializationServiceImpl implements RoleTemplateInitializationService {
    
    private final RoleTemplateRepository roleTemplateRepository;
    
    @Override
    public boolean isRoleTemplateSystemInitialized() {
        try {
            long templateCount = roleTemplateRepository.count();
            
            // 최소한의 템플릿이 있어야 초기화된 것으로 간주
            // ACADEMY와 CONSULTATION 업종 각각 최소 3개 이상
            boolean hasAcademyTemplates = roleTemplateRepository
                    .findByBusinessTypeAndActive("ACADEMY").size() >= 3;
            boolean hasConsultationTemplates = roleTemplateRepository
                    .findByBusinessTypeAndActive("CONSULTATION").size() >= 3;
            
            boolean initialized = templateCount >= 6 && hasAcademyTemplates && hasConsultationTemplates;
            
            if (initialized) {
                log.debug("✅ 역할 템플릿 시스템이 이미 초기화되어 있음 (템플릿={}개, ACADEMY={}, CONSULTATION={})", 
                    templateCount, hasAcademyTemplates, hasConsultationTemplates);
            } else {
                log.warn("⚠️ 역할 템플릿 시스템이 초기화되지 않음 (템플릿={}개, ACADEMY={}, CONSULTATION={})", 
                    templateCount, hasAcademyTemplates, hasConsultationTemplates);
            }
            
            return initialized;
            
        } catch (Exception e) {
            log.error("역할 템플릿 시스템 초기화 상태 확인 중 오류", e);
            return false;
        }
    }
    
    @Override
    public void validateRoleTemplateSystem() {
        log.info("🔍 역할 템플릿 시스템 메타데이터 검증 시작");
        
        if (!isRoleTemplateSystemInitialized()) {
            String errorMessage = 
                "역할 템플릿 시스템 메타데이터가 초기화되지 않았습니다. " +
                "V9__insert_initial_data.sql 마이그레이션을 실행하거나, " +
                "role_templates 테이블에 최소한의 템플릿 데이터를 추가해주세요. " +
                "필수 업종: ACADEMY, CONSULTATION (각각 최소 3개 이상의 템플릿 필요)";
            
            log.error("❌ {}", errorMessage);
            throw new IllegalStateException(errorMessage);
        }
        
        log.info("✅ 역할 템플릿 시스템 메타데이터 검증 완료");
    }
}

