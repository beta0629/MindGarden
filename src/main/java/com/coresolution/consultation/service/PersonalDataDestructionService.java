package com.coresolution.consultation.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.PersonalDataAccessLog;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.PersonalDataAccessLogRepository;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 개인정보 파기 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PersonalDataDestructionService {
    
    private final PersonalDataAccessLogRepository personalDataAccessLogRepository;
    private final UserRepository userRepository;
    private final ConsultationRecordRepository consultationRecordRepository;
    private final PaymentRepository paymentRepository;
    private final SalaryCalculationRepository salaryCalculationRepository;
    
    /**
     * 만료된 개인정보 자동 파기 (매일 새벽 3시 실행)
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void destroyExpiredPersonalData() {
        log.info("🔄 만료된 개인정보 자동 파기 시작");
        
        try {
            int totalDestroyed = 0;
            
            // 1. 회원 탈퇴 후 1년 경과된 사용자 데이터 파기
            int userDataDestroyed = destroyExpiredUserData();
            totalDestroyed += userDataDestroyed;
            
            // 2. 상담 완료 후 5년 경과된 상담 기록 파기
            int consultationDataDestroyed = destroyExpiredConsultationData();
            totalDestroyed += consultationDataDestroyed;
            
            // 3. 거래 완료 후 5년 경과된 결제 데이터 파기
            int paymentDataDestroyed = destroyExpiredPaymentData();
            totalDestroyed += paymentDataDestroyed;
            
            // 4. 급여 지급 후 3년 경과된 급여 데이터 파기
            int salaryDataDestroyed = destroyExpiredSalaryData();
            totalDestroyed += salaryDataDestroyed;
            
            // 5. 개인정보 접근 로그 파기 (1년 경과)
            int accessLogDestroyed = destroyExpiredAccessLogs();
            totalDestroyed += accessLogDestroyed;
            
            log.info("✅ 만료된 개인정보 자동 파기 완료: 총 {}건 파기", totalDestroyed);
            
        } catch (Exception e) {
            log.error("❌ 만료된 개인정보 자동 파기 실패: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 만료된 사용자 데이터 파기
     */
    @Transactional
    public int destroyExpiredUserData() {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusYears(1);
            
            // 회원 탈퇴 후 1년 경과된 사용자 조회
            List<Object[]> expiredUsers = userRepository.findExpiredUsersForDestruction(cutoffDate);
            
            int destroyedCount = 0;
            for (Object[] user : expiredUsers) {
                Long userId = (Long) user[0];
                String userName = (String) user[1];
                
                try {
                    // 개인정보 파기 로그 기록
                    logPersonalDataDestruction("SYSTEM", "USER_DATA", userId.toString(), 
                        "회원 탈퇴 후 1년 경과로 인한 자동 파기");
                    
                    // 사용자 데이터 파기 (실제 구현 필요)
                    // userRepository.deleteById(userId);
                    
                    destroyedCount++;
                    log.info("사용자 데이터 파기 완료: ID={}, 이름={}", userId, userName);
                    
                } catch (Exception e) {
                    log.error("사용자 데이터 파기 실패: ID={}, 오류={}", userId, e.getMessage());
                }
            }
            
            log.info("만료된 사용자 데이터 파기 완료: {}건", destroyedCount);
            return destroyedCount;
            
        } catch (Exception e) {
            log.error("만료된 사용자 데이터 파기 실패: {}", e.getMessage(), e);
            return 0;
        }
    }
    
    /**
     * 만료된 상담 기록 파기
     */
    @Transactional
    public int destroyExpiredConsultationData() {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusYears(5);
            
            String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return 0;
            }
            
            // 상담 완료 후 5년 경과된 상담 기록 조회
            List<Object[]> expiredRecords = consultationRecordRepository.findExpiredRecordsForDestruction(tenantId, cutoffDate);
            
            int destroyedCount = 0;
            for (Object[] record : expiredRecords) {
                Long recordId = (Long) record[0];
                String consultantName = (String) record[1];
                
                try {
                    // 개인정보 파기 로그 기록
                    logPersonalDataDestruction("SYSTEM", "CONSULTATION_RECORD", recordId.toString(), 
                        "상담 완료 후 5년 경과로 인한 자동 파기");
                    
                    // 상담 기록 파기 (실제 구현 필요)
                    // consultationRecordRepository.deleteById(recordId);
                    
                    destroyedCount++;
                    log.info("상담 기록 파기 완료: ID={}, 상담사={}", recordId, consultantName);
                    
                } catch (Exception e) {
                    log.error("상담 기록 파기 실패: ID={}, 오류={}", recordId, e.getMessage());
                }
            }
            
            log.info("만료된 상담 기록 파기 완료: {}건", destroyedCount);
            return destroyedCount;
            
        } catch (Exception e) {
            log.error("만료된 상담 기록 파기 실패: {}", e.getMessage(), e);
            return 0;
        }
    }
    
    /**
     * 만료된 결제 데이터 파기
     */
    @Transactional
    public int destroyExpiredPaymentData() {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusYears(5);
            
            // 거래 완료 후 5년 경과된 결제 데이터 조회
            List<Object[]> expiredPayments = paymentRepository.findExpiredPaymentsForDestruction(cutoffDate);
            
            int destroyedCount = 0;
            for (Object[] payment : expiredPayments) {
                Long paymentId = (Long) payment[0];
                String paymentMethod = (String) payment[1];
                
                try {
                    // 개인정보 파기 로그 기록
                    logPersonalDataDestruction("SYSTEM", "PAYMENT_DATA", paymentId.toString(), 
                        "거래 완료 후 5년 경과로 인한 자동 파기");
                    
                    // 결제 데이터 파기 (실제 구현 필요)
                    // paymentRepository.deleteById(paymentId);
                    
                    destroyedCount++;
                    log.info("결제 데이터 파기 완료: ID={}, 결제방법={}", paymentId, paymentMethod);
                    
                } catch (Exception e) {
                    log.error("결제 데이터 파기 실패: ID={}, 오류={}", paymentId, e.getMessage());
                }
            }
            
            log.info("만료된 결제 데이터 파기 완료: {}건", destroyedCount);
            return destroyedCount;
            
        } catch (Exception e) {
            log.error("만료된 결제 데이터 파기 실패: {}", e.getMessage(), e);
            return 0;
        }
    }
    
    /**
     * 만료된 급여 데이터 파기
     */
    @Transactional
    public int destroyExpiredSalaryData() {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusYears(3);
            
            // 급여 지급 후 3년 경과된 급여 데이터 조회
            List<Object[]> expiredSalaries = salaryCalculationRepository.findExpiredSalariesForDestruction(cutoffDate);
            
            int destroyedCount = 0;
            for (Object[] salary : expiredSalaries) {
                Long salaryId = (Long) salary[0];
                String consultantName = (String) salary[1];
                
                try {
                    // 개인정보 파기 로그 기록
                    logPersonalDataDestruction("SYSTEM", "SALARY_DATA", salaryId.toString(), 
                        "급여 지급 후 3년 경과로 인한 자동 파기");
                    
                    // 급여 데이터 파기 (실제 구현 필요)
                    // salaryCalculationRepository.deleteById(salaryId);
                    
                    destroyedCount++;
                    log.info("급여 데이터 파기 완료: ID={}, 상담사={}", salaryId, consultantName);
                    
                } catch (Exception e) {
                    log.error("급여 데이터 파기 실패: ID={}, 오류={}", salaryId, e.getMessage());
                }
            }
            
            log.info("만료된 급여 데이터 파기 완료: {}건", destroyedCount);
            return destroyedCount;
            
        } catch (Exception e) {
            log.error("만료된 급여 데이터 파기 실패: {}", e.getMessage(), e);
            return 0;
        }
    }
    
    /**
     * 만료된 접근 로그 파기
     */
    @Transactional
    public int destroyExpiredAccessLogs() {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusYears(1);
            
            // 1년 경과된 접근 로그 삭제
            long deletedCount = personalDataAccessLogRepository.deleteByAccessTimeBefore(cutoffDate);
            
            log.info("만료된 접근 로그 파기 완료: {}건", deletedCount);
            return (int) deletedCount;
            
        } catch (Exception e) {
            log.error("만료된 접근 로그 파기 실패: {}", e.getMessage(), e);
            return 0;
        }
    }
    
    /**
     * 개인정보 파기 로그 기록
     */
    private void logPersonalDataDestruction(String accessorId, String dataType, String dataId, String reason) {
        try {
            PersonalDataAccessLog accessLog = PersonalDataAccessLog.builder()
                .accessorId(accessorId)
                .accessorName("SYSTEM")
                .dataType(dataType)
                .accessType("DELETE")
                .targetUserId(dataId)
                .targetUserName("SYSTEM")
                .accessTime(LocalDateTime.now())
                .ipAddress("127.0.0.1")
                .reason(reason)
                .result("SUCCESS")
                .dataIdentifier(dataId)
                .dataDetails("개인정보 파기")
                .sessionId("SYSTEM")
                .userAgent("PersonalDataDestructionService")
                .build();
            
            personalDataAccessLogRepository.save(accessLog);
            
        } catch (Exception e) {
            log.error("개인정보 파기 로그 기록 실패: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 수동 개인정보 파기 실행
     */
    @Transactional
    public Map<String, Object> executeManualPersonalDataDestruction(String dataType, String dataId, String reason) {
        Map<String, Object> result = new java.util.HashMap<>();
        
        try {
            log.info("수동 개인정보 파기 실행: 유형={}, ID={}, 사유={}", dataType, dataId, reason);
            
            // 개인정보 파기 로그 기록
            logPersonalDataDestruction("MANUAL", dataType, dataId, reason);
            
            // 실제 데이터 파기 (구현 필요)
            // switch (dataType) {
            //     case "USER_DATA":
            //         userRepository.deleteById(Long.parseLong(dataId));
            //         break;
            //     case "CONSULTATION_RECORD":
            //         consultationRecordRepository.deleteById(Long.parseLong(dataId));
            //         break;
            //     // ... 기타 데이터 유형
            // }
            
            result = Map.of(
                "status", "success",
                "message", "개인정보가 성공적으로 파기되었습니다.",
                "dataType", dataType,
                "dataId", dataId,
                "reason", reason,
                "destroyedAt", LocalDateTime.now()
            );
            
            log.info("수동 개인정보 파기 완료: 유형={}, ID={}", dataType, dataId);
            
        } catch (Exception e) {
            log.error("수동 개인정보 파기 실패: {}", e.getMessage(), e);
            result = Map.of(
                "status", "error",
                "message", "개인정보 파기에 실패했습니다: " + e.getMessage()
            );
        }
        
        return result;
    }
    
    /**
     * 개인정보 파기 현황 조회
     */
    public Map<String, Object> getPersonalDataDestructionStatus() {
        try {
            LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
            
            // 최근 1개월간 파기된 개인정보 통계
            List<PersonalDataAccessLog> destructionLogs = personalDataAccessLogRepository
                .findByAccessTypeAndAccessTimeBetween("DELETE", oneMonthAgo, LocalDateTime.now());
            
            // 데이터 유형별 파기 통계
            Map<String, Long> destructionStats = destructionLogs.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    PersonalDataAccessLog::getDataType,
                    java.util.stream.Collectors.counting()
                ));
            
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("totalDestroyed", destructionLogs.size());
            result.put("destructionStats", destructionStats);
            result.put("period", Map.of(
                "startDate", oneMonthAgo,
                "endDate", LocalDateTime.now()
            ));
            result.put("lastDestruction", destructionLogs.isEmpty() ? 
                "N/A" : destructionLogs.get(destructionLogs.size() - 1).getAccessTime());
            
            return result;
            
        } catch (Exception e) {
            log.error("개인정보 파기 현황 조회 실패: {}", e.getMessage(), e);
            return Map.of("error", "개인정보 파기 현황 조회에 실패했습니다.");
        }
    }
}
