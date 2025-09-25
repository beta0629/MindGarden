package com.mindgarden.consultation.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

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
public class PlSqlInitializer {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @PostConstruct
    public void init() {
        log.info("🚀 PL/SQL 프로시저 자동 초기화 시작");
        
        try {
            // 상담일지 알림 프로시저 초기화
            initializeConsultationRecordAlertProcedures();
            
            // 상담일지 검증 프로시저 초기화
            initializeConsultationRecordValidationProcedures();
            
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
            
            log.info("📄 SQL 파일 크기: {} bytes", sqlContent.length());
            
            // 간단한 프로시저 생성 (테스트용)
            String[] testProcedures = {
                "DROP PROCEDURE IF EXISTS GetConsultationRecordMissingStatistics",
                "CREATE PROCEDURE GetConsultationRecordMissingStatistics(" +
                "IN p_check_date DATE," +
                "IN p_branch_code VARCHAR(20)," +
                "OUT p_missing_count INT," +
                "OUT p_alerts_created INT," +
                "OUT p_success BOOLEAN," +
                "OUT p_message TEXT" +
                ") " +
                "BEGIN " +
                "SET p_missing_count = 0;" +
                "SET p_alerts_created = 0;" +
                "SET p_success = TRUE;" +
                "SET p_message = '테스트 프로시저';" +
                "END"
            };
            
            for (int i = 0; i < testProcedures.length; i++) {
                String procedure = testProcedures[i];
                log.info("🔧 프로시저 {} 실행 중...", i + 1);
                log.debug("프로시저 내용: {}", procedure);
                
                try {
                    jdbcTemplate.execute(procedure);
                    log.info("✅ PL/SQL 프로시저 {} 생성 성공", i + 1);
                } catch (Exception e) {
                    if (e.getMessage().contains("already exists") || 
                        e.getMessage().contains("Duplicate procedure")) {
                        log.info("ℹ️ PL/SQL 프로시저 {}가 이미 존재합니다: {}", i + 1, e.getMessage());
                    } else {
                        log.warn("⚠️ PL/SQL 프로시저 {} 생성 중 오류: {}", i + 1, e.getMessage());
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
    
    /**
     * 상담일지 검증 프로시저 초기화
     */
    private void initializeConsultationRecordValidationProcedures() {
        try {
            log.info("🔍 상담일지 검증 프로시저 초기화 시작");
            
            // UTF-8 인코딩 설정
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            // SQL 파일 읽기
            ClassPathResource resource = new ClassPathResource("sql/consultation_record_validation_procedures.sql");
            String sqlContent = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            
            // DELIMITER 구분자로 프로시저 분리
            String[] procedures = sqlContent.split("DELIMITER \\$\\$");
            
            for (int i = 0; i < procedures.length; i++) {
                String procedure = procedures[i].trim();
                if (procedure.isEmpty() || procedure.startsWith("--") || procedure.startsWith("/*")) {
                    continue;
                }
                
                // DELIMITER $$ 제거
                procedure = procedure.replaceAll("DELIMITER \\$\\$", "").trim();
                if (procedure.isEmpty()) {
                    continue;
                }
                
                try {
                    jdbcTemplate.execute(procedure);
                    log.info("✅ 상담일지 검증 프로시저 {} 생성 완료", i + 1);
                } catch (Exception e) {
                    if (e.getMessage().contains("already exists") || 
                        e.getMessage().contains("Duplicate procedure")) {
                        log.info("ℹ️ 상담일지 검증 프로시저 {}가 이미 존재합니다: {}", i + 1, e.getMessage());
                    } else {
                        log.warn("⚠️ 상담일지 검증 프로시저 {} 생성 중 오류: {}", i + 1, e.getMessage());
                    }
                }
            }
            
            log.info("✅ 상담일지 검증 프로시저 초기화 완료");
            
        } catch (IOException e) {
            log.error("❌ SQL 파일 읽기 실패: {}", e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ 상담일지 검증 프로시저 초기화 실패: {}", e.getMessage(), e);
        }
    }
}
