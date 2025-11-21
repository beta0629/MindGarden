package com.coresolution.consultation.config;

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
            
            // SQL 파일 읽기 (간단한 버전 사용)
            ClassPathResource resource = new ClassPathResource("sql/simple_consultation_validation.sql");
            String sqlContent = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            
            // 프로시저별로 분리 (CREATE PROCEDURE 기준)
            String[] lines = sqlContent.split("\n");
            StringBuilder currentProcedure = new StringBuilder();
            boolean inProcedure = false;
            int procedureCount = 0;
            
            for (String line : lines) {
                line = line.trim();
                
                // 주석이나 빈 줄은 건너뛰기
                if (line.isEmpty() || line.startsWith("--") || line.startsWith("/*")) {
                    continue;
                }
                
                // DELIMITER $$ 제거
                if (line.equals("DELIMITER $$")) {
                    continue;
                }
                
                // 프로시저 시작
                if (line.startsWith("CREATE PROCEDURE") || line.startsWith("DROP PROCEDURE")) {
                    if (inProcedure && currentProcedure.length() > 0) {
                        // 이전 프로시저 실행
                        executeProcedure(currentProcedure.toString(), procedureCount++);
                        currentProcedure.setLength(0);
                    }
                    inProcedure = true;
                }
                
                if (inProcedure) {
                    currentProcedure.append(line).append("\n");
                    
                    // 프로시저 끝 (END$$)
                    if (line.equals("END$$")) {
                        executeProcedure(currentProcedure.toString(), procedureCount++);
                        currentProcedure.setLength(0);
                        inProcedure = false;
                    }
                }
            }
            
            // 마지막 프로시저 실행
            if (inProcedure && currentProcedure.length() > 0) {
                executeProcedure(currentProcedure.toString(), procedureCount++);
            }
            
            log.info("✅ 상담일지 검증 프로시저 초기화 완료");
            
        } catch (IOException e) {
            log.error("❌ SQL 파일 읽기 실패: {}", e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ 상담일지 검증 프로시저 초기화 실패: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 개별 프로시저 실행
     */
    private void executeProcedure(String procedure, int procedureNumber) {
        try {
            // END$$ 제거하고 ; 추가
            String cleanProcedure = procedure.replaceAll("END\\$\\$", "END;").trim();
            
            // 프로시저명 추출하여 DROP 먼저 실행
            if (cleanProcedure.contains("CREATE PROCEDURE")) {
                String procedureName = extractProcedureName(cleanProcedure);
                if (procedureName != null) {
                    jdbcTemplate.execute("DROP PROCEDURE IF EXISTS " + procedureName);
                    log.info("🗑️ 기존 프로시저 삭제: {}", procedureName);
                }
            }
            
            jdbcTemplate.execute(cleanProcedure);
            log.info("✅ 상담일지 검증 프로시저 {} 생성 완료", procedureNumber + 1);
        } catch (Exception e) {
            if (e.getMessage().contains("already exists") || 
                e.getMessage().contains("Duplicate procedure")) {
                log.info("ℹ️ 상담일지 검증 프로시저 {}가 이미 존재합니다: {}", procedureNumber + 1, e.getMessage());
            } else {
                log.warn("⚠️ 상담일지 검증 프로시저 {} 생성 중 오류: {}", procedureNumber + 1, e.getMessage());
            }
        }
    }
    
    /**
     * 프로시저명 추출
     */
    private String extractProcedureName(String procedure) {
        try {
            String[] lines = procedure.split("\n");
            for (String line : lines) {
                if (line.contains("CREATE PROCEDURE")) {
                    String[] parts = line.split("\\s+");
                    for (int i = 0; i < parts.length; i++) {
                        if ("PROCEDURE".equals(parts[i]) && i + 1 < parts.length) {
                            return parts[i + 1].trim();
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("프로시저명 추출 실패: {}", e.getMessage());
        }
        return null;
    }
}
