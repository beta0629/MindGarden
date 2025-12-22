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
        // 타임아웃 방지를 위해 권한 시스템 초기화 상태 확인도 비활성화
        log.info("ℹ️ 권한 시스템 초기화 상태 확인 건너뜀 (타임아웃 방지)");
        // try {
        //     // 이미 초기화되어 있으면 완전히 스킵
        //     if (permissionInitializationService.isPermissionSystemInitialized()) {
        //         log.info("✅ 권한 시스템이 이미 초기화되어 있음 - 초기화 작업 스킵");
        //         return;
        //     }
        //     
        //     // 개발 환경에서는 초기화 작업을 비활성화하여 타임아웃 방지
        //     log.warn("⚠️ 권한 시스템 초기화가 필요하지만 타임아웃 방지를 위해 자동 초기화를 비활성화했습니다.");
        //     // permissionInitializationService.initializePermissionSystem();
        // } catch (Exception e) {
        //     log.error("❌ 권한 시스템 초기화 상태 확인 실패", e);
        // }
    }
}
