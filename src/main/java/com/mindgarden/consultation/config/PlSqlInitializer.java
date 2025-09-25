package com.mindgarden.consultation.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * PL/SQL 프로시저 자동 초기화
 * 애플리케이션 시작시 필요한 PL/SQL 프로시저를 자동으로 생성
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Slf4j
@Component
public class PlSqlInitializer implements CommandLineRunner {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Override
    public void run(String... args) throws Exception {
        log.info("🚀 PL/SQL 프로시저 자동 초기화 시작");
        
        try {
            // 상담일지 알림 프로시저 초기화
            initializeConsultationRecordAlertProcedures();
            
            log.info("✅ PL/SQL 프로시저 자동 초기화 완료");
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 프로시저 자동 초기화 실패: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 상담일지 알림 프로시저 초기화
     */
    private void initializeConsultationRecordAlertProcedures() {
        try {
            log.info("📝 상담일지 알림 프로시저 초기화 시작");
            
            // UTF-8 인코딩 설정
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            // SQL 파일 읽기
            ClassPathResource resource = new ClassPathResource("sql/procedures/consultation_record_alert_procedures.sql");
            String sqlContent = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            
            // DELIMITER를 제거하고 개별 프로시저로 분리
            String[] procedures = sqlContent.split("DELIMITER ;");
            
            for (String procedure : procedures) {
                if (procedure.trim().isEmpty()) continue;
                
                // DELIMITER // 제거
                String cleanProcedure = procedure.replaceAll("DELIMITER //", "").trim();
                if (cleanProcedure.isEmpty()) continue;
                
                try {
                    // 프로시저 실행
                    jdbcTemplate.execute(cleanProcedure);
                    log.info("✅ PL/SQL 프로시저 생성 성공");
                } catch (Exception e) {
                    // 프로시저가 이미 존재하는 경우 무시
                    if (e.getMessage().contains("already exists") || 
                        e.getMessage().contains("Duplicate procedure")) {
                        log.info("ℹ️ PL/SQL 프로시저가 이미 존재합니다: {}", e.getMessage());
                    } else {
                        log.warn("⚠️ PL/SQL 프로시저 생성 중 오류 (무시됨): {}", e.getMessage());
                    }
                }
            }
            
            log.info("✅ 상담일지 알림 프로시저 초기화 완료");
            
        } catch (IOException e) {
            log.error("❌ SQL 파일 읽기 실패: {}", e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ 상담일지 알림 프로시저 초기화 실패: {}", e.getMessage(), e);
        }
    }
}
