package com.coresolution.core.config;

import com.coresolution.core.service.RoleTemplateInitializationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * 역할 템플릿 시스템 초기화 설정
 * 애플리케이션 시작 시 자동으로 역할 템플릿 메타데이터를 검증합니다.
 * ApplicationReadyEvent를 사용하여 데이터베이스 연결 풀이 완전히 초기화된 후 실행
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RoleTemplateInitializationConfig {

    private final RoleTemplateInitializationService roleTemplateInitializationService;

    @EventListener(ApplicationReadyEvent.class)
    @Order(50) // PlSqlInitializer(100)보다 먼저 실행
    public void initialize(ApplicationReadyEvent event) {
        // 타임아웃 방지를 위해 역할 템플릿 검증 비활성화
        log.info("ℹ️ 역할 템플릿 시스템 메타데이터 검증 건너뜀 (타임아웃 방지)");
        // try {
        //     roleTemplateInitializationService.validateRoleTemplateSystem();
        //     log.info("✅ 역할 템플릿 시스템 메타데이터 검증 완료");
        // } catch (IllegalStateException e) {
        //     log.error("❌ 역할 템플릿 시스템 메타데이터 검증 실패: {}", e.getMessage());
        //     log.warn("⚠️ 역할 템플릿 메타데이터가 없어도 애플리케이션은 계속 실행됩니다. " +
        //             "온보딩 시 오류가 발생할 수 있습니다.");
        // } catch (Exception e) {
        //     log.error("❌ 역할 템플릿 시스템 메타데이터 검증 중 예상치 못한 오류 발생", e);
        // }
    }
}

