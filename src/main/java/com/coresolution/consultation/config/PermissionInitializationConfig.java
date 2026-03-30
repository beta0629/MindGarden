package com.coresolution.consultation.config;

import com.coresolution.consultation.service.PermissionInitializationService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 권한 시스템 초기화 설정
 * 애플리케이션 시작 시 자동으로 권한 시스템을 초기화합니다.
 * ApplicationReadyEvent를 사용하여 데이터베이스 연결 풀이 완전히 초기화된 후 실행
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PermissionInitializationConfig {

    private final PermissionInitializationService permissionInitializationService;

    @EventListener(ApplicationReadyEvent.class)
    @Order(50) // PlSqlInitializer(100)보다 먼저 실행
    public void initialize(ApplicationReadyEvent event) {
        log.info("🚀 애플리케이션 시작 - 권한 시스템 초기화 상태 확인...");
        
        try {
            // 이미 초기화되어 있으면 완전히 스킵
            if (permissionInitializationService.isPermissionSystemInitialized()) {
                log.info("✅ 권한 시스템이 이미 초기화되어 있음 - 초기화 작업 스킵");
                return;
            }
            
            // 권한 시스템 초기화 실행
            log.info("🔧 권한 시스템 초기화 시작...");
            permissionInitializationService.initializePermissionSystem();
            log.info("✅ 권한 시스템 초기화 완료");
        } catch (Exception e) {
            log.error("❌ 권한 시스템 초기화 실패", e);
            // 초기화 실패해도 애플리케이션은 계속 실행
        }
    }
}
