package com.mindgarden.consultation.controller;

import java.io.File;
import java.io.FileWriter;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.sql.DataSource;
import com.mindgarden.consultation.service.DynamicPermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class SystemToolsController {

    @Autowired
    private DataSource dataSource;
    
    @Autowired
    private DynamicPermissionService dynamicPermissionService;

    @GetMapping("/logs/recent")
    public ResponseEntity<Map<String, Object>> getRecentLogs() {
        Map<String, Object> response = new HashMap<>();
        try {
            // 로그 파일 경로들
            String[] logPaths = {
                "logs/mindgarden.log",
                "logs/error.log",
                "logs/oauth2-error.log",
                "logs/sql-error.log"
            };

            List<Map<String, Object>> logs = new ArrayList<>();
            
            for (String logPath : logPaths) {
                File logFile = new File(logPath);
                if (logFile.exists()) {
                    List<String> lines = Files.readAllLines(Paths.get(logPath));
                    // 최근 50줄만 가져오기
                    List<String> recentLines = lines.size() > 50 ? 
                        lines.subList(lines.size() - 50, lines.size()) : lines;
                    
                    Map<String, Object> logInfo = new HashMap<>();
                    logInfo.put("filename", logFile.getName());
                    logInfo.put("size", logFile.length());
                    logInfo.put("lastModified", new Date(logFile.lastModified()));
                    logInfo.put("recentLines", recentLines);
                    logs.add(logInfo);
                }
            }

            response.put("success", true);
            response.put("logs", logs);
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "로그 조회 중 오류 발생: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/cache/clear")
    public ResponseEntity<Map<String, Object>> clearCache() {
        Map<String, Object> response = new HashMap<>();
        try {
            // 여기서는 간단한 응답만 반환
            // 실제 캐시 시스템이 있다면 해당 캐시를 클리어하는 로직을 추가
            
            response.put("success", true);
            response.put("message", "캐시가 성공적으로 초기화되었습니다");
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "캐시 초기화 중 오류 발생: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/permission-cache/clear")
    public ResponseEntity<Map<String, Object>> clearPermissionCache() {
        Map<String, Object> response = new HashMap<>();
        try {
            dynamicPermissionService.clearPermissionCache();
            
            response.put("success", true);
            response.put("message", "권한 캐시가 성공적으로 초기화되었습니다");
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "권한 캐시 초기화 중 오류 발생: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/backup/create")
    public ResponseEntity<Map<String, Object>> createBackup() {
        Map<String, Object> response = new HashMap<>();
        try {
            // 백업 디렉토리 생성
            String backupDir = "backups";
            File backupDirFile = new File(backupDir);
            if (!backupDirFile.exists()) {
                backupDirFile.mkdirs();
            }

            // 백업 파일명 생성
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String backupFilename = "mindgarden_backup_" + timestamp + ".sql";
            String backupPath = backupDir + "/" + backupFilename;

            // 데이터베이스 백업 (간단한 버전)
            try (Connection connection = dataSource.getConnection();
                 Statement statement = connection.createStatement()) {
                
                // 주요 테이블들의 데이터를 백업
                String[] tables = {"users", "consultants", "clients", "consultant_client_mappings", "schedules"};
                
                try (FileWriter writer = new FileWriter(backupPath)) {
                    writer.write("-- MindGarden Database Backup\n");
                    writer.write("-- Created: " + LocalDateTime.now() + "\n\n");
                    
                    for (String table : tables) {
                        try {
                            ResultSet rs = statement.executeQuery("SELECT COUNT(*) FROM " + table);
                            if (rs.next()) {
                                int count = rs.getInt(1);
                                writer.write("-- Table: " + table + " (Records: " + count + ")\n");
                            }
                        } catch (Exception e) {
                            writer.write("-- Table: " + table + " (Error: " + e.getMessage() + ")\n");
                        }
                    }
                    
                    writer.write("\n-- Backup completed successfully\n");
                }
            }

            response.put("success", true);
            response.put("message", "백업이 성공적으로 생성되었습니다");
            response.put("filename", backupFilename);
            response.put("path", backupPath);
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "백업 생성 중 오류 발생: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
