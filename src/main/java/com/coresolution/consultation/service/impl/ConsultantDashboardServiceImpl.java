package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import com.coresolution.consultation.dto.response.HighPriorityClientResponse;
import com.coresolution.consultation.dto.response.IncompleteRecordResponse;
import com.coresolution.consultation.dto.response.UpcomingPreparationResponse;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ConsultantDashboardService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 상담사 대시보드 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-03-09
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConsultantDashboardServiceImpl implements ConsultantDashboardService {
    
    private final ScheduleRepository scheduleRepository;
    private final ConsultationRecordRepository consultationRecordRepository;
    private final UserRepository userRepository;
    private final UserPersonalDataCacheService userPersonalDataCacheService;
    
    @Override
    public List<IncompleteRecordResponse> getIncompleteRecords(Long consultantId, Integer limit) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.error("❌ tenantId 없음 - 미작성 상담일지 조회 거부");
            throw new IllegalStateException("테넌트 정보가 없습니다.");
        }
        
        log.info("📝 미작성 상담일지 조회: consultantId={}, tenantId={}, limit={}", 
                consultantId, tenantId, limit);
        
        Integer actualLimit = (limit != null && limit > 0) ? limit : 10;
        Pageable pageable = PageRequest.of(0, actualLimit);
        
        List<Schedule> incompleteSchedules = scheduleRepository.findIncompleteRecords(
            tenantId, consultantId, pageable);
        
        log.info("✅ 미작성 상담일지 조회 완료: count={}", incompleteSchedules.size());
        
        return incompleteSchedules.stream()
            .map(schedule -> {
                String clientName = getClientName(schedule.getClientId());
                Long elapsedHours = IncompleteRecordResponse.calculateElapsedHours(schedule.getDate());
                
                return IncompleteRecordResponse.builder()
                    .scheduleId(schedule.getId())
                    .clientName(clientName)
                    .sessionDate(schedule.getDate())
                    .elapsedHours(elapsedHours)
                    .sessionNumber(null)
                    .build();
            })
            .collect(Collectors.toList());
    }
    
    @Override
    public List<HighPriorityClientResponse> getHighPriorityClients(Long consultantId, Integer limit) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.error("❌ tenantId 없음 - 긴급 내담자 조회 거부");
            throw new IllegalStateException("테넌트 정보가 없습니다.");
        }
        
        log.info("🚨 긴급 확인 필요 내담자 조회: consultantId={}, tenantId={}, limit={}", 
                consultantId, tenantId, limit);
        
        Integer actualLimit = (limit != null && limit > 0) ? limit : 5;
        Pageable pageable = PageRequest.of(0, actualLimit);
        
        List<ConsultationRecord> highPriorityRecords = consultationRecordRepository.findHighPriorityClients(
            tenantId, consultantId, pageable);
        
        log.info("✅ 긴급 내담자 조회 완료: count={}", highPriorityRecords.size());
        
        return highPriorityRecords.stream()
            .map(record -> {
                String clientName = getClientName(record.getClientId());
                
                return HighPriorityClientResponse.builder()
                    .clientId(record.getClientId())
                    .clientName(clientName)
                    .riskLevel(record.getRiskAssessment())
                    .lastSessionDate(record.getSessionDate())
                    .emergencyPlan(record.getEmergencyResponsePlan())
                    .sessionNumber(record.getSessionNumber())
                    .mainIssue(record.getMainIssues())
                    .build();
            })
            .collect(Collectors.toList());
    }
    
    @Override
    public List<UpcomingPreparationResponse> getUpcomingPreparation(Long consultantId, Integer hoursAhead) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.error("❌ tenantId 없음 - 다음 상담 준비 조회 거부");
            throw new IllegalStateException("테넌트 정보가 없습니다.");
        }
        
        log.info("📅 다음 상담 준비 정보 조회: consultantId={}, tenantId={}, hoursAhead={}", 
                consultantId, tenantId, hoursAhead);
        
        Integer actualHoursAhead = (hoursAhead != null && hoursAhead > 0) ? hoursAhead : 2;
        
        LocalDate today = LocalDate.now();
        LocalTime currentTime = LocalTime.now();
        LocalDate endDate = today.plusDays(1);
        
        Pageable pageable = PageRequest.of(0, 10);
        
        List<Schedule> upcomingSchedules = scheduleRepository.findUpcomingPreparation(
            tenantId, consultantId, today, endDate, currentTime, pageable);
        
        log.info("✅ 다음 상담 준비 정보 조회 완료: count={}", upcomingSchedules.size());
        
        List<UpcomingPreparationResponse> responses = new ArrayList<>();
        
        for (Schedule schedule : upcomingSchedules) {
            String clientName = getClientName(schedule.getClientId());
            
            Pageable latestPageable = PageRequest.of(0, 1);
            List<ConsultationRecord> latestRecords = consultationRecordRepository.findLatestByClientId(
                tenantId, schedule.getClientId(), latestPageable);
            
            String lastIssues = null;
            String riskLevel = null;
            Integer sessionNumber = null;
            
            if (!latestRecords.isEmpty()) {
                ConsultationRecord latestRecord = latestRecords.get(0);
                lastIssues = latestRecord.getMainIssues();
                riskLevel = latestRecord.getRiskAssessment();
                sessionNumber = latestRecord.getSessionNumber();
            }
            
            responses.add(UpcomingPreparationResponse.builder()
                .scheduleId(schedule.getId())
                .clientName(clientName)
                .sessionDate(schedule.getDate())
                .sessionTime(schedule.getStartTime())
                .sessionNumber(sessionNumber)
                .lastIssues(lastIssues)
                .riskLevel(riskLevel)
                .build());
        }
        
        return responses;
    }
    
    /**
     * 내담자 이름 조회 (개인정보 캐시 서비스 활용)
     */
    private String getClientName(Long clientId) {
        if (clientId == null) {
            return "알 수 없음";
        }
        
        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            User client = userRepository.findByTenantIdAndId(tenantId, clientId).orElse(null);
            if (client != null) {
                java.util.Map<String, String> decryptedData = userPersonalDataCacheService.getDecryptedUserData(client);
                if (decryptedData != null && decryptedData.get("name") != null) {
                    return decryptedData.get("name");
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ 내담자 이름 조회 실패: clientId={}, error={}", clientId, e.getMessage());
        }
        
        return "알 수 없음";
    }
}
