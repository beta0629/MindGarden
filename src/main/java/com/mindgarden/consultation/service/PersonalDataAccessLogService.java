package com.mindgarden.consultation.service;

import com.mindgarden.consultation.entity.PersonalDataAccessLog;
import com.mindgarden.consultation.repository.PersonalDataAccessLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 개인정보 접근 로그 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PersonalDataAccessLogService {
    
    private final PersonalDataAccessLogRepository personalDataAccessLogRepository;
    
    /**
     * 개인정보 접근 로그 기록
     * 
     * @param accessorId 접근자 ID
     * @param accessorName 접근자 이름
     * @param dataType 개인정보 유형
     * @param accessType 접근 유형
     * @param targetUserId 대상 사용자 ID
     * @param targetUserName 대상 사용자 이름
     * @param reason 접근 사유
     * @param result 처리 결과
     * @param dataIdentifier 데이터 식별자
     * @param dataDetails 데이터 상세 정보
     * @param request HTTP 요청
     */
    @Transactional
    public void logPersonalDataAccess(String accessorId, String accessorName, String dataType, 
                                    String accessType, String targetUserId, String targetUserName,
                                    String reason, String result, String dataIdentifier, 
                                    String dataDetails, HttpServletRequest request) {
        
        try {
            PersonalDataAccessLog log = PersonalDataAccessLog.builder()
                .accessorId(accessorId)
                .accessorName(accessorName)
                .dataType(dataType)
                .accessType(accessType)
                .targetUserId(targetUserId)
                .targetUserName(targetUserName)
                .accessTime(LocalDateTime.now())
                .ipAddress(getClientIpAddress(request))
                .reason(reason)
                .result(result)
                .dataIdentifier(dataIdentifier)
                .dataDetails(dataDetails)
                .sessionId(request.getSession().getId())
                .userAgent(request.getHeader("User-Agent"))
                .build();
            
            personalDataAccessLogRepository.save(log);
            
            log.info("개인정보 접근 로그 기록 완료: 접근자={}, 유형={}, 대상={}", 
                    accessorId, dataType, targetUserId);
            
        } catch (Exception e) {
            log.error("개인정보 접근 로그 기록 실패: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 개인정보 접근 로그 조회
     * 
     * @param accessorId 접근자 ID
     * @param dataType 개인정보 유형
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 접근 로그 목록
     */
    public List<PersonalDataAccessLog> getPersonalDataAccessLogs(String accessorId, String dataType, 
                                                               LocalDateTime startDate, LocalDateTime endDate) {
        return personalDataAccessLogRepository.findByAccessorIdAndDataTypeAndAccessTimeBetween(
            accessorId, dataType, startDate, endDate);
    }
    
    /**
     * 특정 사용자의 개인정보 접근 이력 조회
     * 
     * @param targetUserId 대상 사용자 ID
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 접근 이력 목록
     */
    public List<PersonalDataAccessLog> getPersonalDataAccessHistory(String targetUserId, 
                                                                  LocalDateTime startDate, LocalDateTime endDate) {
        return personalDataAccessLogRepository.findByTargetUserIdAndAccessTimeBetween(
            targetUserId, startDate, endDate);
    }
    
    /**
     * 개인정보 접근 통계 조회
     * 
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 접근 통계
     */
    public Map<String, Object> getPersonalDataAccessStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        // 접근 유형별 통계
        Map<String, Long> accessTypeStats = personalDataAccessLogRepository.countByAccessTypeAndAccessTimeBetween(
            startDate, endDate);
        
        // 개인정보 유형별 통계
        Map<String, Long> dataTypeStats = personalDataAccessLogRepository.countByDataTypeAndAccessTimeBetween(
            startDate, endDate);
        
        // 접근자별 통계
        Map<String, Long> accessorStats = personalDataAccessLogRepository.countByAccessorIdAndAccessTimeBetween(
            startDate, endDate);
        
        return Map.of(
            "accessTypeStats", accessTypeStats,
            "dataTypeStats", dataTypeStats,
            "accessorStats", accessorStats,
            "totalAccessCount", personalDataAccessLogRepository.countByAccessTimeBetween(startDate, endDate)
        );
    }
    
    /**
     * 개인정보 접근 패턴 분석
     * 
     * @param accessorId 접근자 ID
     * @param days 분석 기간 (일)
     * @return 접근 패턴 분석 결과
     */
    public Map<String, Object> analyzePersonalDataAccessPattern(String accessorId, int days) {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusDays(days);
        
        List<PersonalDataAccessLog> logs = personalDataAccessLogRepository.findByAccessorIdAndAccessTimeBetween(
            accessorId, startDate, endDate);
        
        // 시간대별 접근 패턴
        Map<Integer, Long> hourlyPattern = logs.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                log -> log.getAccessTime().getHour(),
                java.util.stream.Collectors.counting()
            ));
        
        // 요일별 접근 패턴
        Map<String, Long> dailyPattern = logs.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                log -> log.getAccessTime().getDayOfWeek().toString(),
                java.util.stream.Collectors.counting()
            ));
        
        // 개인정보 유형별 접근 패턴
        Map<String, Long> dataTypePattern = logs.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                PersonalDataAccessLog::getDataType,
                java.util.stream.Collectors.counting()
            ));
        
        return Map.of(
            "hourlyPattern", hourlyPattern,
            "dailyPattern", dailyPattern,
            "dataTypePattern", dataTypePattern,
            "totalAccessCount", logs.size(),
            "analysisPeriod", days + "일"
        );
    }
    
    /**
     * 이상 접근 탐지
     * 
     * @param accessorId 접근자 ID
     * @param hours 탐지 기간 (시간)
     * @return 이상 접근 목록
     */
    public List<PersonalDataAccessLog> detectAnomalousAccess(String accessorId, int hours) {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusHours(hours);
        
        List<PersonalDataAccessLog> logs = personalDataAccessLogRepository.findByAccessorIdAndAccessTimeBetween(
            accessorId, startDate, endDate);
        
        // 이상 접근 기준
        long accessCount = logs.size();
        long threshold = 50; // 1시간에 50회 이상 접근 시 이상으로 판단
        
        if (accessCount > threshold) {
            log.warn("이상 접근 탐지: 접근자={}, 접근 횟수={}, 임계값={}", accessorId, accessCount, threshold);
            return logs;
        }
        
        return List.of();
    }
    
    /**
     * 개인정보 접근 로그 삭제 (보관 기간 만료)
     * 
     * @param retentionDays 보관 기간 (일)
     */
    @Transactional
    public void deleteExpiredAccessLogs(int retentionDays) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);
        
        long deletedCount = personalDataAccessLogRepository.deleteByAccessTimeBefore(cutoffDate);
        
        log.info("만료된 개인정보 접근 로그 삭제 완료: {}건", deletedCount);
    }
    
    /**
     * 클라이언트 IP 주소 추출
     * 
     * @param request HTTP 요청
     * @return 클라이언트 IP 주소
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}
