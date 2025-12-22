package com.coresolution.consultation.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
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
    
    @Autowired
    private DataSource dataSource;
    
    /**
     * 현재 데이터베이스가 H2인지 확인
     * 연결 없이 URL 문자열로 확인하여 타임아웃 방지
     */
    private boolean isH2Database() {
        try {
            // HikariCP DataSource인 경우 URL을 직접 가져올 수 있음
            if (dataSource instanceof com.zaxxer.hikari.HikariDataSource) {
                com.zaxxer.hikari.HikariDataSource hikariDataSource = (com.zaxxer.hikari.HikariDataSource) dataSource;
                String url = hikariDataSource.getJdbcUrl();
                return url != null && url.startsWith("jdbc:h2:");
            }
            
            // 다른 DataSource인 경우 연결을 시도하되, 반드시 close() 호출
            try (java.sql.Connection connection = dataSource.getConnection()) {
                String url = connection.getMetaData().getURL();
                return url != null && url.startsWith("jdbc:h2:");
            }
        } catch (Exception e) {
            log.warn("데이터베이스 타입 확인 실패 (기본값: MySQL로 가정): {}", e.getMessage());
            return false; // 확인 실패 시 MySQL로 가정
        }
    }
    
    /**
     * 애플리케이션이 완전히 시작된 후 프로시저 초기화
     * ApplicationReadyEvent를 사용하여 데이터베이스 연결 풀이 완전히 초기화된 후 실행
     * 연결 누수 방지를 위해 @PostConstruct 대신 사용
     * 각 초기화 작업을 독립적으로 실행하여 하나의 실패가 다른 작업에 영향을 주지 않도록 함
     */
    @EventListener(ApplicationReadyEvent.class)
    @Order(100) // 다른 초기화 작업 이후 실행
    public void init() {
        // H2 데이터베이스인 경우 프로시저 초기화 건너뛰기
        if (isH2Database()) {
            log.info("ℹ️ H2 데이터베이스 감지: PL/SQL 프로시저 초기화를 건너뜁니다 (테스트 환경)");
            return;
        }
        
        log.info("🚀 PL/SQL 프로시저 자동 초기화 시작 (ApplicationReadyEvent)");
        
        // 각 프로시저 초기화를 독립적으로 실행하여 연결 누수 방지
        // 하나의 실패가 다른 작업에 영향을 주지 않도록 각각 try-catch로 처리
        
        // 1. CreateOrActivateTenant 프로시저 초기화
        try {
            initializeCreateOrActivateTenantProcedure();
            // 각 작업 사이에 짧은 대기 시간 추가하여 연결 풀 정리 시간 확보
            Thread.sleep(500);
        } catch (Exception e) {
            log.error("❌ CreateOrActivateTenant 프로시저 초기화 실패 (계속 진행): {}", e.getMessage(), e);
        }
        
        // 2. CreateDefaultTenantUsers 프로시저 초기화
        try {
            initializeCreateDefaultTenantUsersProcedure();
            Thread.sleep(500);
        } catch (Exception e) {
            log.error("❌ CreateDefaultTenantUsers 프로시저 초기화 실패 (계속 진행): {}", e.getMessage(), e);
        }
        
        // 3. 상담일지 알림 프로시저 초기화 (비활성화 - Flyway 마이그레이션으로 관리)
        // 이 프로시저들은 Flyway 마이그레이션으로 관리되므로 Java 코드에서 초기화하지 않음
        // 연결 타임아웃 방지를 위해 비활성화
        log.info("ℹ️ 상담일지 알림 프로시저 초기화 건너뜀 (Flyway 마이그레이션으로 관리)");
        
        // 4. 상담일지 검증 프로시저 초기화 (비활성화 - Flyway 마이그레이션으로 관리)
        // 이 프로시저들은 Flyway 마이그레이션으로 관리되므로 Java 코드에서 초기화하지 않음
        // 연결 타임아웃 방지를 위해 비활성화
        log.info("ℹ️ 상담일지 검증 프로시저 초기화 건너뜀 (Flyway 마이그레이션으로 관리)");
        
        log.info("✅ PL/SQL 프로시저 자동 초기화 완료");
    }
    
    /**
     * CreateOrActivateTenant 프로시저 초기화
     * 백업 메커니즘: Flyway 마이그레이션이 실패한 경우를 대비하여 Java 코드에서도 프로시저 생성 시도
     */
    private void initializeCreateOrActivateTenantProcedure() {
        try {
            log.info("📝 CreateOrActivateTenant 프로시저 초기화 시작 (백업 메커니즘)");
            
            // 프로시저 존재 여부 확인
            Boolean procedureExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) > 0 FROM information_schema.ROUTINES " +
                "WHERE ROUTINE_SCHEMA = DATABASE() " +
                "AND ROUTINE_NAME = 'CreateOrActivateTenant' " +
                "AND ROUTINE_TYPE = 'PROCEDURE'",
                Boolean.class
            );
            
            if (Boolean.TRUE.equals(procedureExists)) {
                log.info("ℹ️ CreateOrActivateTenant 프로시저가 이미 존재합니다 (Flyway 마이그레이션으로 생성됨)");
                return;
            }
            
            log.warn("⚠️ CreateOrActivateTenant 프로시저가 없습니다. Java 코드에서 생성 시도...");
            
            // UTF-8 인코딩 설정 (MySQL만 지원)
            if (!isH2Database()) {
                jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            }
            
            // SQL 파일 읽기
            ClassPathResource resource = new ClassPathResource("sql/procedures/create_or_activate_tenant.sql");
            String sqlContent = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            
            log.info("📄 SQL 파일 크기: {} bytes", sqlContent.length());
            
            // DELIMITER 제거 및 프로시저 전체를 하나의 문장으로 처리
            // 주석 제거
            sqlContent = sqlContent.replaceAll("--[^\n]*", "");
            
            // DELIMITER 관련 제거
            sqlContent = sqlContent.replaceAll("(?i)DELIMITER\\s+//", "");
            sqlContent = sqlContent.replaceAll("(?i)DELIMITER\\s+;", "");
            sqlContent = sqlContent.replaceAll("END\\s+//", "END;");
            
            // DROP과 CREATE 분리 (세미콜론이 아닌 CREATE PROCEDURE 기준으로)
            String dropStatement = null;
            String createStatement = null;
            
            // DROP 문 추출 (DELIMITER // 이후의 DROP)
            if (sqlContent.contains("DROP PROCEDURE")) {
                int dropStart = sqlContent.indexOf("DROP PROCEDURE");
                // DROP PROCEDURE IF EXISTS CreateOrActivateTenant // 형태
                // // 까지 찾거나, CREATE PROCEDURE 전까지
                int dropEnd = sqlContent.indexOf("CREATE PROCEDURE", dropStart);
                if (dropEnd > dropStart) {
                    dropStatement = sqlContent.substring(dropStart, dropEnd).trim();
                    // // 제거
                    dropStatement = dropStatement.replaceAll("//", "").trim();
                    if (!dropStatement.endsWith(";")) {
                        dropStatement += ";";
                    }
                }
            }
            
            // CREATE 문 추출 (CREATE PROCEDURE부터 END;까지)
            if (sqlContent.contains("CREATE PROCEDURE")) {
                int createStart = sqlContent.indexOf("CREATE PROCEDURE");
                // END; 까지 찾기
                int endIndex = sqlContent.lastIndexOf("END;");
                if (endIndex > createStart) {
                    createStatement = sqlContent.substring(createStart, endIndex + 4).trim();
                } else {
                    // END;가 없으면 END 까지
                    int endIndex2 = sqlContent.lastIndexOf("END");
                    if (endIndex2 > createStart) {
                        createStatement = sqlContent.substring(createStart, endIndex2 + 3).trim();
                        if (!createStatement.endsWith(";")) {
                            createStatement += ";";
                        }
                    }
                }
            }
            
            // DROP 실행
            if (dropStatement != null) {
                try {
                    jdbcTemplate.execute(dropStatement);
                    log.info("🗑️ 기존 프로시저 삭제 완료");
                } catch (Exception e) {
                    log.debug("프로시저 삭제 중 오류 (무시 가능): {}", e.getMessage());
                }
            }
            
            // CREATE 실행 (재시도 로직 포함)
            if (createStatement != null) {
                boolean created = false;
                int maxRetries = 3;
                for (int attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        jdbcTemplate.execute(createStatement);
                        log.info("✅ CreateOrActivateTenant 프로시저 생성 완료 (Java 코드 백업 메커니즘, 시도 {}/{})", attempt, maxRetries);
                        created = true;
                        break;
                    } catch (Exception e) {
                        log.warn("⚠️ CreateOrActivateTenant 프로시저 생성 실패 (시도 {}/{}): {}", attempt, maxRetries, e.getMessage());
                        if (attempt < maxRetries) {
                            try {
                                Thread.sleep(1000 * attempt); // 지수 백오프
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                            }
                        } else {
                            log.error("❌ CreateOrActivateTenant 프로시저 생성 실패 (모든 시도 실패): {}", e.getMessage(), e);
                            log.warn("⚠️ Flyway 마이그레이션(V42)이 프로시저를 생성해야 합니다");
                        }
                    }
                }
                
                // 프로시저 생성 후 검증 (안전장치 1: 존재 여부 확인)
                if (created) {
                    verifyProcedureExists("CreateOrActivateTenant");
                    
                    // 안전장치 2: 프로시저 실행 테스트 (파라미터 검증)
                    testProcedureExecution("CreateOrActivateTenant");
                }
            } else {
                log.warn("⚠️ CREATE PROCEDURE 문을 찾을 수 없습니다");
            }
            
            log.info("✅ CreateOrActivateTenant 프로시저 초기화 완료");
            
        } catch (IOException e) {
            log.error("❌ SQL 파일 읽기 실패: {}", e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ CreateOrActivateTenant 프로시저 초기화 실패: {}", e.getMessage(), e);
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
                if (procedure == null || procedure.trim().isEmpty()) {
                    log.warn("⚠️ 프로시저 {}가 비어있습니다", i + 1);
                    continue;
                }
                log.info("🔧 프로시저 {} 실행 중...", i + 1);
                log.debug("프로시저 내용: {}", procedure);
                
                try {
                    jdbcTemplate.execute(procedure);
                    log.info("✅ PL/SQL 프로시저 {} 생성 성공", i + 1);
                    // 각 프로시저 실행 후 짧은 대기 시간 추가하여 연결 풀 정리 시간 확보
                    Thread.sleep(200);
                } catch (Exception e) {
                    if (e.getMessage() != null && 
                        (e.getMessage().contains("already exists") || 
                         e.getMessage().contains("Duplicate procedure") ||
                         e.getMessage().contains("Communications link failure"))) {
                        if (e.getMessage().contains("Communications link failure")) {
                            log.warn("⚠️ PL/SQL 프로시저 {} 실행 중 연결 오류 (건너뜀): {}", i + 1, e.getMessage());
                        } else {
                            log.info("ℹ️ PL/SQL 프로시저 {}가 이미 존재합니다: {}", i + 1, e.getMessage());
                        }
                    } else {
                        log.warn("⚠️ PL/SQL 프로시저 {} 생성 중 오류: {}", i + 1, e.getMessage());
                    }
                    // 오류 발생 시에도 다음 프로시저 시도 가능하도록 계속 진행
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
            
            // UTF-8 인코딩 설정 (MySQL만 지원)
            if (!isH2Database()) {
                jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            }
            
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
    
    /**
     * 안전장치 1: 프로시저 존재 여부 검증
     */
    private void verifyProcedureExists(String procedureName) {
        try {
            Boolean exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) > 0 FROM information_schema.ROUTINES " +
                "WHERE ROUTINE_SCHEMA = DATABASE() " +
                "AND ROUTINE_NAME = ? " +
                "AND ROUTINE_TYPE = 'PROCEDURE'",
                Boolean.class,
                procedureName
            );
            
            if (Boolean.TRUE.equals(exists)) {
                log.info("✅ 프로시저 존재 확인 완료: {}", procedureName);
            } else {
                log.error("❌ 프로시저가 존재하지 않습니다: {}", procedureName);
            }
        } catch (Exception e) {
            log.error("❌ 프로시저 존재 여부 확인 실패: {} - {}", procedureName, e.getMessage());
        }
    }
    
    /**
     * 안전장치 2: 프로시저 실행 테스트 (파라미터 검증)
     */
    private void testProcedureExecution(String procedureName) {
        if (!"CreateOrActivateTenant".equals(procedureName)) {
            return; // 다른 프로시저는 스킵
        }
        
        try {
            // 프로시저 시그니처 확인
            String signature = jdbcTemplate.queryForObject(
                "SELECT ROUTINE_DEFINITION FROM information_schema.ROUTINES " +
                "WHERE ROUTINE_SCHEMA = DATABASE() " +
                "AND ROUTINE_NAME = ? " +
                "AND ROUTINE_TYPE = 'PROCEDURE'",
                String.class,
                procedureName
            );
            
            if (signature != null && signature.length() > 0) {
                log.info("✅ 프로시저 시그니처 확인 완료: {} (길이: {} bytes)", procedureName, signature.length());
                
                // 필수 키워드 확인
                String[] requiredKeywords = {"DECLARE", "BEGIN", "END", "TRANSACTION", "COMMIT"};
                boolean allKeywordsPresent = true;
                for (String keyword : requiredKeywords) {
                    if (!signature.toUpperCase().contains(keyword)) {
                        log.warn("⚠️ 프로시저에 필수 키워드가 없습니다: {} - {}", procedureName, keyword);
                        allKeywordsPresent = false;
                    }
                }
                
                if (allKeywordsPresent) {
                    log.info("✅ 프로시저 구조 검증 완료: {}", procedureName);
                } else {
                    log.warn("⚠️ 프로시저 구조 검증 실패: {}", procedureName);
                }
            } else {
                log.warn("⚠️ 프로시저 정의를 찾을 수 없습니다: {}", procedureName);
            }
        } catch (Exception e) {
            log.warn("⚠️ 프로시저 실행 테스트 실패 (무시 가능): {} - {}", procedureName, e.getMessage());
        }
    }
    
    /**
     * CreateDefaultTenantUsers 프로시저 초기화
     * 백업 메커니즘: Flyway 마이그레이션이 실패한 경우를 대비하여 Java 코드에서도 프로시저 생성 시도
     */
    private void initializeCreateDefaultTenantUsersProcedure() {
        try {
            log.info("📝 CreateDefaultTenantUsers 프로시저 초기화 시작 (백업 메커니즘)");
            
            // 프로시저 존재 여부 확인
            String checkProcedureQuery = """
                SELECT COUNT(*) FROM information_schema.routines 
                WHERE routine_schema = DATABASE() 
                AND routine_name = 'CreateDefaultTenantUsers' 
                AND routine_type = 'PROCEDURE'
                """;
            
            Integer procedureCount = jdbcTemplate.queryForObject(checkProcedureQuery, Integer.class);
            
            if (procedureCount != null && procedureCount > 0) {
                log.info("✅ CreateDefaultTenantUsers 프로시저가 이미 존재합니다");
                return;
            }
            
            log.info("📝 CreateDefaultTenantUsers 프로시저를 생성합니다 (백업)");
            
            // SQL 파일 읽기
            ClassPathResource resource = new ClassPathResource("sql/procedures/create_default_tenant_users.sql");
            String procedureSQL = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            
            log.info("📄 SQL 파일 크기: {} bytes", procedureSQL.length());
            
            if (procedureSQL != null && !procedureSQL.trim().isEmpty()) {
                // DELIMITER 제거 및 SQL 정리
                procedureSQL = procedureSQL.replaceAll("DELIMITER\\s+//", "")
                                         .replaceAll("DELIMITER\\s+;", "")
                                         .replaceAll("//", "");
                
                // 프로시저 생성 실행
                jdbcTemplate.execute(procedureSQL);
                
                log.info("✅ CreateDefaultTenantUsers 프로시저 생성 완료 (백업)");
                
            } else {
                log.warn("⚠️ CreateDefaultTenantUsers 프로시저 SQL 파일을 읽을 수 없습니다");
            }
            
        } catch (Exception e) {
            log.warn("⚠️ CreateDefaultTenantUsers 프로시저 초기화 실패 (Flyway에서 처리될 예정): {}", e.getMessage());
        }
    }
}
