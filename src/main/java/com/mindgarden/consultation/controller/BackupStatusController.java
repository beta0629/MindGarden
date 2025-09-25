package com.mindgarden.consultation.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 데이터베이스 백업 상태 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/backup")
@RequiredArgsConstructor
public class BackupStatusController {
    
    @Value("${backup.directory:/home/backup/database}")
    private String backupDirectory;
    
    @Value("${backup.log.directory:/home/backup/logs}")
    private String logDirectory;
    
    /**
     * 백업 상태 조회
     */
    @GetMapping("/status")
    public Map<String, Object> getBackupStatus() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 백업 디렉토리 확인
            Path backupPath = Paths.get(backupDirectory);
            if (!Files.exists(backupPath)) {
                result.put("status", "error");
                result.put("message", "백업 디렉토리가 존재하지 않습니다: " + backupDirectory);
                return result;
            }
            
            // 백업 파일 목록 조회
            File backupDir = backupPath.toFile();
            File[] backupFiles = backupDir.listFiles((dir, name) -> 
                name.startsWith("mindgarden_backup_") && name.endsWith(".sql.gz"));
            
            if (backupFiles == null || backupFiles.length == 0) {
                result.put("status", "warning");
                result.put("message", "백업 파일이 없습니다");
                result.put("backupCount", 0);
                return result;
            }
            
            // 최신 백업 파일 정보
            File latestBackup = Arrays.stream(backupFiles)
                .max(Comparator.comparing(File::lastModified))
                .orElse(null);
            
            if (latestBackup != null) {
                result.put("latestBackup", Map.of(
                    "fileName", latestBackup.getName(),
                    "fileSize", formatFileSize(latestBackup.length()),
                    "lastModified", formatDateTime(latestBackup.lastModified()),
                    "filePath", latestBackup.getAbsolutePath()
                ));
            }
            
            // 백업 파일 목록
            List<Map<String, Object>> backupList = new ArrayList<>();
            for (File file : backupFiles) {
                backupList.add(Map.of(
                    "fileName", file.getName(),
                    "fileSize", formatFileSize(file.length()),
                    "lastModified", formatDateTime(file.lastModified()),
                    "filePath", file.getAbsolutePath()
                ));
            }
            
            // 파일 크기순 정렬 (최신순)
            backupList.sort((a, b) -> 
                Long.compare((Long) b.get("lastModified"), (Long) a.get("lastModified")));
            
            result.put("backupList", backupList);
            result.put("backupCount", backupFiles.length);
            
            // 디스크 사용량
            long totalSize = Arrays.stream(backupFiles)
                .mapToLong(File::length)
                .sum();
            result.put("totalSize", formatFileSize(totalSize));
            
            // 백업 상태 파일 확인
            File statusFile = new File(backupDir, ".backup_status");
            if (statusFile.exists()) {
                try {
                    Properties props = new Properties();
                    props.load(Files.newInputStream(statusFile.toPath()));
                    result.put("lastBackupDate", props.getProperty("LAST_BACKUP_DATE"));
                    result.put("lastBackupFile", props.getProperty("LAST_BACKUP_FILE"));
                    result.put("lastBackupSize", props.getProperty("BACKUP_SIZE"));
                } catch (IOException e) {
                    log.warn("백업 상태 파일 읽기 실패: {}", e.getMessage());
                }
            }
            
            // 다음 백업 예정일 계산
            LocalDateTime nextBackup = LocalDateTime.now()
                .withDayOfMonth(1)
                .plusMonths(1)
                .withHour(2)
                .withMinute(0)
                .withSecond(0);
            result.put("nextBackupDate", nextBackup.format(DateTimeFormatter.ofPattern("yyyy년 MM월 dd일 HH:mm")));
            
            result.put("status", "success");
            result.put("message", "백업 상태 조회 완료");
            
        } catch (Exception e) {
            log.error("백업 상태 조회 중 오류 발생: {}", e.getMessage(), e);
            result.put("status", "error");
            result.put("message", "백업 상태 조회 실패: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 백업 로그 조회
     */
    @GetMapping("/logs")
    public Map<String, Object> getBackupLogs() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Path logPath = Paths.get(logDirectory);
            if (!Files.exists(logPath)) {
                result.put("status", "error");
                result.put("message", "로그 디렉토리가 존재하지 않습니다: " + logDirectory);
                return result;
            }
            
            // 로그 파일 목록 조회
            File logDir = logPath.toFile();
            File[] logFiles = logDir.listFiles((dir, name) -> 
                name.startsWith("db_backup_") && name.endsWith(".log"));
            
            if (logFiles == null || logFiles.length == 0) {
                result.put("status", "warning");
                result.put("message", "백업 로그 파일이 없습니다");
                result.put("logCount", 0);
                return result;
            }
            
            // 로그 파일 목록
            List<Map<String, Object>> logList = new ArrayList<>();
            for (File file : logFiles) {
                logList.add(Map.of(
                    "fileName", file.getName(),
                    "fileSize", formatFileSize(file.length()),
                    "lastModified", formatDateTime(file.lastModified()),
                    "filePath", file.getAbsolutePath()
                ));
            }
            
            // 최신순 정렬
            logList.sort((a, b) -> 
                Long.compare((Long) b.get("lastModified"), (Long) a.get("lastModified")));
            
            result.put("logList", logList);
            result.put("logCount", logFiles.length);
            result.put("status", "success");
            result.put("message", "백업 로그 조회 완료");
            
        } catch (Exception e) {
            log.error("백업 로그 조회 중 오류 발생: {}", e.getMessage(), e);
            result.put("status", "error");
            result.put("message", "백업 로그 조회 실패: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 백업 디렉토리 정보 조회
     */
    @GetMapping("/directory-info")
    public Map<String, Object> getDirectoryInfo() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 백업 디렉토리 정보
            Path backupPath = Paths.get(backupDirectory);
            if (Files.exists(backupPath)) {
                File backupDir = backupPath.toFile();
                result.put("backupDirectory", Map.of(
                    "path", backupDir.getAbsolutePath(),
                    "exists", true,
                    "writable", backupDir.canWrite(),
                    "readable", backupDir.canRead()
                ));
            } else {
                result.put("backupDirectory", Map.of(
                    "path", backupDirectory,
                    "exists", false,
                    "writable", false,
                    "readable", false
                ));
            }
            
            // 로그 디렉토리 정보
            Path logPath = Paths.get(logDirectory);
            if (Files.exists(logPath)) {
                File logDir = logPath.toFile();
                result.put("logDirectory", Map.of(
                    "path", logDir.getAbsolutePath(),
                    "exists", true,
                    "writable", logDir.canWrite(),
                    "readable", logDir.canRead()
                ));
            } else {
                result.put("logDirectory", Map.of(
                    "path", logDirectory,
                    "exists", false,
                    "writable", false,
                    "readable", false
                ));
            }
            
            result.put("status", "success");
            result.put("message", "디렉토리 정보 조회 완료");
            
        } catch (Exception e) {
            log.error("디렉토리 정보 조회 중 오류 발생: {}", e.getMessage(), e);
            result.put("status", "error");
            result.put("message", "디렉토리 정보 조회 실패: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 파일 크기 포맷팅
     */
    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
        return String.format("%.1f GB", bytes / (1024.0 * 1024.0 * 1024.0));
    }
    
    /**
     * 날짜/시간 포맷팅
     */
    private String formatDateTime(long timestamp) {
        return LocalDateTime.ofInstant(
            java.time.Instant.ofEpochMilli(timestamp),
            java.time.ZoneId.systemDefault()
        ).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
