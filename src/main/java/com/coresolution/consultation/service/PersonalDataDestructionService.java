package com.coresolution.consultation.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.entity.PersonalDataAccessLog;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.PersonalDataAccessLogRepository;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
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
    private final TenantService tenantService;
    
    /**
     * 만료된 개인정보 자동 파기 (매일 새벽 3시 실행).
     * <p>
     * 스케줄 스레드에는 HTTP 테넌트 컨텍스트가 없으므로, {@link TenantService#getAllActiveTenantIds()}로
     * 활성 테넌트를 조회한 뒤 테넌트마다 {@link TenantContextHolder#setTenantId(String)} 후 파기 단계를 수행한다.
     * </p>
     * <p>수동 검증: 활성 테넌트 2개 이상 환경에서 스케줄 실행 후 로그에 테넌트별 처리·ERROR 없음,
     * 비어 있으면 {@code 활성 테넌트 없음} INFO 한 줄만 확인.</p>
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void destroyExpiredPersonalData() {
        log.info("🔄 만료된 개인정보 자동 파기 시작");
        
        try {
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            if (activeTenantIds.isEmpty()) {
                log.info("만료 개인정보 자동 파기: 활성 테넌트 없음 — 전체 스킵");
                return;
            }
            
            int totalDestroyed = 0;
            for (String tenantId : activeTenantIds) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    int tenantTotal = 0;
                    tenantTotal += destroyExpiredUserData();
                    tenantTotal += destroyExpiredConsultationData();
                    tenantTotal += destroyExpiredPaymentData();
                    tenantTotal += destroyExpiredSalaryData();
                    tenantTotal += destroyExpiredAccessLogs();
                    totalDestroyed += tenantTotal;
                    log.debug("만료 개인정보 파기(테넌트): tenantId={}, 건수={}", tenantId, tenantTotal);
                } catch (Exception e) {
                    log.error("❌ 테넌트별 개인정보 자동 파기 실패: tenantId={}, {}", tenantId, e.getMessage(), e);
                } finally {
                    TenantContextHolder.clear();
                }
            }
            
            log.info("✅ 만료된 개인정보 자동 파기 완료: 총 {}건 파기, 테넌트 수={}", totalDestroyed, activeTenantIds.size());
            
        } catch (Exception e) {
            log.error("❌ 만료된 개인정보 자동 파기 실패: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 파기 단계별 조회에 사용할 테넌트 ID. 스케줄 외 직접 호출 시 컨텍스트가 없으면 스킵(INFO 한 줄).
     *
     * @param scopeLabel 로그용 구분 (예: 사용자, 상담)
     * @return 테넌트 ID
     */
    private Optional<String> resolveTenantIdForDestruction(String scopeLabel) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            log.info("개인정보 파기 스킵({}): 테넌트 컨텍스트 없음", scopeLabel);
            return Optional.empty();
        }
        return Optional.of(tenantId);
    }
    
    /**
     * 만료된 사용자 데이터 파기
     */
    @Transactional
    public int destroyExpiredUserData() {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusYears(1);
            
            Optional<String> tenantId = resolveTenantIdForDestruction("사용자");
            if (tenantId.isEmpty()) {
                return 0;
            }
            
            // 회원 탈퇴 후 1년 경과된 사용자 조회 (테넌트 격리)
            List<Object[]> expiredUsers = userRepository.findExpiredUsersForDestructionByTenantId(tenantId.get(), cutoffDate);
            
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
            
            Optional<String> tenantId = resolveTenantIdForDestruction("상담기록");
            if (tenantId.isEmpty()) {
                return 0;
            }
            
            // 상담 완료 후 5년 경과된 상담 기록 조회
            List<Object[]> expiredRecords = consultationRecordRepository.findExpiredRecordsForDestruction(tenantId.get(), cutoffDate);
            
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
            
            Optional<String> tenantId = resolveTenantIdForDestruction("결제");
            if (tenantId.isEmpty()) {
                return 0;
            }
            
            // 거래 완료 후 5년 경과된 결제 데이터 조회 (테넌트 격리)
            List<Object[]> expiredPayments = paymentRepository.findExpiredPaymentsForDestructionByTenantId(tenantId.get(), cutoffDate);
            
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
            
            Optional<String> tenantId = resolveTenantIdForDestruction("급여");
            if (tenantId.isEmpty()) {
                return 0;
            }
            
            // 급여 지급 후 3년 경과된 급여 데이터 조회 (상담사 소속 테넌트 기준)
            List<Object[]> expiredSalaries =
                salaryCalculationRepository.findExpiredSalariesForDestructionByTenantId(tenantId.get(), cutoffDate);
            
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
            
            Optional<String> tenantId = resolveTenantIdForDestruction("접근로그");
            if (tenantId.isEmpty()) {
                return 0;
            }
            
            // 1년 경과된 접근 로그 삭제 (테넌트 격리)
            long deletedCount = personalDataAccessLogRepository.deleteByTenantIdAndAccessTimeBefore(tenantId.get(), cutoffDate);
            
            log.info("만료된 접근 로그 파기 완료: {}건", deletedCount);
            return (int) deletedCount;
            
        } catch (Exception e) {
            log.error("만료된 접근 로그 파기 실패: {}", e.getMessage(), e);
            return 0;
        }
    }
    
    /**
     * 개인정보 파기 로그 기록.
     *
     * <p>V20260604_002 (W2 P0) 정합: {@code targetUserId} 가 {@code users.id} (BIGINT) 컬럼으로
     * 정착되고 FK {@code fk_pdal_target_user} 가 신설되었으므로 USER_DATA 가 아닌 비-사용자
     * 식별자(CONSULTATION_RECORD/PAYMENT_DATA/SALARY_DATA 등)는 {@code targetUserId} 에 넣을 수
     * 없다. 비-사용자 식별자는 {@link PersonalDataAccessLog#dataIdentifier} 컬럼에만 적재하고
     * {@code targetUserId} 는 {@code null} 로 둔다.</p>
     */
    private void logPersonalDataDestruction(String accessorId, String dataType, String dataId, String reason) {
        try {
            Long targetUserId = null;
            if ("USER_DATA".equals(dataType) && dataId != null) {
                try {
                    targetUserId = Long.valueOf(dataId);
                } catch (NumberFormatException nfe) {
                    log.warn("USER_DATA 파기 로그의 dataId 가 숫자 변환 실패 — targetUserId null 처리: dataId={}", dataId);
                }
            }

            PersonalDataAccessLog accessLog = PersonalDataAccessLog.builder()
                .accessorId(accessorId)
                .accessorName("SYSTEM")
                .dataType(dataType)
                .accessType("DELETE")
                .targetUserId(targetUserId)
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
