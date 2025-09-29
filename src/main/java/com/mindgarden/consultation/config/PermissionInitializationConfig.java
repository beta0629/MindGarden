package com.mindgarden.consultation.config;

import com.mindgarden.consultation.service.PermissionInitializationService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 권한 시스템 초기화 설정
 * 애플리케이션 시작 시 자동으로 권한 시스템을 초기화합니다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PermissionInitializationConfig implements ApplicationRunner {

    private final PermissionInitializationService permissionInitializationService;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("🚀 애플리케이션 시작 - 권한 시스템 초기화 시작...");
        
        try {
            permissionInitializationService.initializePermissionSystem();
            log.info("✅ 권한 시스템 초기화 완료");
        } catch (Exception e) {
            log.error("❌ 권한 시스템 초기화 실패", e);
            // 초기화 실패해도 애플리케이션은 계속 실행
        }
    }
}
