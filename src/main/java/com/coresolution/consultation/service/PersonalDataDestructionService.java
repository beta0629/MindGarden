package com.coresolution.consultation.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.config.LifecycleCutoffProperties;
import com.coresolution.consultation.entity.PersonalDataAccessLog;
import com.coresolution.consultation.lifecycle.LifecycleDataCategory;
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
 * 개인정보 파기 서비스.
 *
 * <p>본 합의서 {@code docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md} v1.2 §0.1 Q9~Q10
 * 결재 결과 채택 — 카테고리별 cutoff 보존 연수를 {@link LifecycleCutoffProperties} 에서 조회하고,
 * destruction 로그({@code personal_data_access_logs.metadata}) 에 {@code business_mode} +
 * {@code policy_version} 을 stamp 한다.
 *
 * @author MindGarden
 * @version 1.1.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PersonalDataDestructionService {

    /** destruction 로그 metadata 키 — 정책 버전. */
    static final String METADATA_KEY_POLICY_VERSION = "policyVersion";

    /** destruction 로그 metadata 키 — 비즈니스 모드(NON_MEDICAL/MEDICAL). */
    static final String METADATA_KEY_BUSINESS_MODE = "businessMode";

    /** destruction 로그 metadata 키 — 적용 카테고리. */
    static final String METADATA_KEY_CATEGORY = "category";

    /** destruction 로그 metadata 키 — 적용 cutoff(연수). */
    static final String METADATA_KEY_RETENTION_YEARS = "retentionYears";

    /** destruction 사유 메시지 포맷 — {0}: 카테고리 라벨, {1}: 연수. */
    private static final String DESTRUCTION_REASON_FORMAT = "%s 보존기간 %d년 경과로 인한 자동 파기";

    /** 시스템 접근자 ID. */
    private static final String SYSTEM_ACCESSOR_ID = "SYSTEM";

    /** 시스템 접근자 이름. */
    private static final String SYSTEM_ACCESSOR_NAME = "SYSTEM";

    /** 시스템 IP (로컬). */
    private static final String SYSTEM_IP = "127.0.0.1";

    /** 시스템 세션 ID. */
    private static final String SYSTEM_SESSION_ID = "SYSTEM";

    /** 시스템 User-Agent. */
    private static final String SYSTEM_USER_AGENT = "PersonalDataDestructionService";

    /** destruction 접근 유형 라벨. */
    private static final String ACCESS_TYPE_DELETE = "DELETE";

    /** destruction 결과 라벨. */
    private static final String RESULT_SUCCESS = "SUCCESS";

    /** destruction 데이터 상세 라벨. */
    private static final String DATA_DETAILS_LABEL = "개인정보 파기";

    private final PersonalDataAccessLogRepository personalDataAccessLogRepository;
    private final UserRepository userRepository;
    private final ConsultationRecordRepository consultationRecordRepository;
    private final PaymentRepository paymentRepository;
    private final SalaryCalculationRepository salaryCalculationRepository;
    private final TenantService tenantService;
    private final LifecycleCutoffProperties cutoffProperties;

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
        log.info("🔄 만료된 개인정보 자동 파기 시작 (businessMode={}, policyVersion={})",
            cutoffProperties.getBusinessMode(), cutoffProperties.getPolicyVersion());

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
     * 카테고리별 cutoff(LocalDateTime) 계산. 정책에서 보존 연수를 읽어 현재 시각에서 차감한다.
     */
    private LocalDateTime cutoffFor(LifecycleDataCategory category) {
        int years = cutoffProperties.getRetentionYears(category);
        return LocalDateTime.now().minusYears(years);
    }

    /**
     * 만료된 사용자 데이터 파기.
     */
    @Transactional
    public int destroyExpiredUserData() {
        try {
            int years = cutoffProperties.getRetentionYears(LifecycleDataCategory.USER_DATA);
            LocalDateTime cutoffDate = cutoffFor(LifecycleDataCategory.USER_DATA);

            Optional<String> tenantId = resolveTenantIdForDestruction("사용자");
            if (tenantId.isEmpty()) {
                return 0;
            }

            List<Object[]> expiredUsers = userRepository.findExpiredUsersForDestructionByTenantId(tenantId.get(), cutoffDate);

            int destroyedCount = 0;
            for (Object[] user : expiredUsers) {
                Long userId = (Long) user[0];
                String userName = (String) user[1];

                try {
                    logPersonalDataDestruction(
                        SYSTEM_ACCESSOR_ID, "USER_DATA", userId.toString(),
                        String.format(DESTRUCTION_REASON_FORMAT, "회원 탈퇴", years),
                        LifecycleDataCategory.USER_DATA, years);

                    destroyedCount++;
                    log.info("사용자 데이터 파기 완료: ID={}, 이름={}", userId, userName);

                } catch (Exception e) {
                    log.error("사용자 데이터 파기 실패: ID={}, 오류={}", userId, e.getMessage());
                }
            }

            log.info("만료된 사용자 데이터 파기 완료: {}건 (cutoff={}년)", destroyedCount, years);
            return destroyedCount;

        } catch (Exception e) {
            log.error("만료된 사용자 데이터 파기 실패: {}", e.getMessage(), e);
            return 0;
        }
    }

    /**
     * 만료된 상담 기록 파기. v1.2 — businessMode=NON_MEDICAL 시 3년, MEDICAL 시 10년 자동 분기.
     */
    @Transactional
    public int destroyExpiredConsultationData() {
        try {
            int years = cutoffProperties.getRetentionYears(LifecycleDataCategory.CONSULTATION_RECORDS);
            LocalDateTime cutoffDate = cutoffFor(LifecycleDataCategory.CONSULTATION_RECORDS);

            Optional<String> tenantId = resolveTenantIdForDestruction("상담기록");
            if (tenantId.isEmpty()) {
                return 0;
            }

            List<Object[]> expiredRecords = consultationRecordRepository.findExpiredRecordsForDestruction(tenantId.get(), cutoffDate);

            int destroyedCount = 0;
            for (Object[] record : expiredRecords) {
                Long recordId = (Long) record[0];
                String consultantName = (String) record[1];

                try {
                    logPersonalDataDestruction(
                        SYSTEM_ACCESSOR_ID, "CONSULTATION_RECORD", recordId.toString(),
                        String.format(DESTRUCTION_REASON_FORMAT, "상담 완료", years),
                        LifecycleDataCategory.CONSULTATION_RECORDS, years);

                    destroyedCount++;
                    log.info("상담 기록 파기 완료: ID={}, 상담사={}", recordId, consultantName);

                } catch (Exception e) {
                    log.error("상담 기록 파기 실패: ID={}, 오류={}", recordId, e.getMessage());
                }
            }

            log.info("만료된 상담 기록 파기 완료: {}건 (businessMode={}, cutoff={}년)",
                destroyedCount, cutoffProperties.getBusinessMode(), years);
            return destroyedCount;

        } catch (Exception e) {
            log.error("만료된 상담 기록 파기 실패: {}", e.getMessage(), e);
            return 0;
        }
    }

    /**
     * 만료된 결제 데이터 파기.
     */
    @Transactional
    public int destroyExpiredPaymentData() {
        try {
            int years = cutoffProperties.getRetentionYears(LifecycleDataCategory.PAYMENTS);
            LocalDateTime cutoffDate = cutoffFor(LifecycleDataCategory.PAYMENTS);

            Optional<String> tenantId = resolveTenantIdForDestruction("결제");
            if (tenantId.isEmpty()) {
                return 0;
            }

            List<Object[]> expiredPayments = paymentRepository.findExpiredPaymentsForDestructionByTenantId(tenantId.get(), cutoffDate);

            int destroyedCount = 0;
            for (Object[] payment : expiredPayments) {
                Long paymentId = (Long) payment[0];
                String paymentMethod = (String) payment[1];

                try {
                    logPersonalDataDestruction(
                        SYSTEM_ACCESSOR_ID, "PAYMENT_DATA", paymentId.toString(),
                        String.format(DESTRUCTION_REASON_FORMAT, "거래 완료", years),
                        LifecycleDataCategory.PAYMENTS, years);

                    destroyedCount++;
                    log.info("결제 데이터 파기 완료: ID={}, 결제방법={}", paymentId, paymentMethod);

                } catch (Exception e) {
                    log.error("결제 데이터 파기 실패: ID={}, 오류={}", paymentId, e.getMessage());
                }
            }

            log.info("만료된 결제 데이터 파기 완료: {}건 (cutoff={}년)", destroyedCount, years);
            return destroyedCount;

        } catch (Exception e) {
            log.error("만료된 결제 데이터 파기 실패: {}", e.getMessage(), e);
            return 0;
        }
    }

    /**
     * 만료된 급여 데이터 파기.
     */
    @Transactional
    public int destroyExpiredSalaryData() {
        try {
            int years = cutoffProperties.getRetentionYears(LifecycleDataCategory.SALARY_DATA);
            LocalDateTime cutoffDate = cutoffFor(LifecycleDataCategory.SALARY_DATA);

            Optional<String> tenantId = resolveTenantIdForDestruction("급여");
            if (tenantId.isEmpty()) {
                return 0;
            }

            List<Object[]> expiredSalaries =
                salaryCalculationRepository.findExpiredSalariesForDestructionByTenantId(tenantId.get(), cutoffDate);

            int destroyedCount = 0;
            for (Object[] salary : expiredSalaries) {
                Long salaryId = (Long) salary[0];
                String consultantName = (String) salary[1];

                try {
                    logPersonalDataDestruction(
                        SYSTEM_ACCESSOR_ID, "SALARY_DATA", salaryId.toString(),
                        String.format(DESTRUCTION_REASON_FORMAT, "급여 지급", years),
                        LifecycleDataCategory.SALARY_DATA, years);

                    destroyedCount++;
                    log.info("급여 데이터 파기 완료: ID={}, 상담사={}", salaryId, consultantName);

                } catch (Exception e) {
                    log.error("급여 데이터 파기 실패: ID={}, 오류={}", salaryId, e.getMessage());
                }
            }

            log.info("만료된 급여 데이터 파기 완료: {}건 (cutoff={}년)", destroyedCount, years);
            return destroyedCount;

        } catch (Exception e) {
            log.error("만료된 급여 데이터 파기 실패: {}", e.getMessage(), e);
            return 0;
        }
    }

    /**
     * 만료된 접근 로그 파기.
     */
    @Transactional
    public int destroyExpiredAccessLogs() {
        try {
            int years = cutoffProperties.getRetentionYears(LifecycleDataCategory.ACCESS_LOGS);
            LocalDateTime cutoffDate = cutoffFor(LifecycleDataCategory.ACCESS_LOGS);

            Optional<String> tenantId = resolveTenantIdForDestruction("접근로그");
            if (tenantId.isEmpty()) {
                return 0;
            }

            long deletedCount = personalDataAccessLogRepository.deleteByTenantIdAndAccessTimeBefore(tenantId.get(), cutoffDate);

            log.info("만료된 접근 로그 파기 완료: {}건 (cutoff={}년)", deletedCount, years);
            return (int) deletedCount;

        } catch (Exception e) {
            log.error("만료된 접근 로그 파기 실패: {}", e.getMessage(), e);
            return 0;
        }
    }

    /**
     * 개인정보 파기 로그 기록. v1.2 — metadata 에 {@code businessMode}/{@code policyVersion}/
     * {@code category}/{@code retentionYears} 를 stamp 하여 정책 추적성을 확보한다.
     *
     * <p>스키마 마이그레이션 없이 기존 {@code personal_data_access_logs.metadata TEXT} 컬럼만 사용한다.
     *
     * <p>V20260604_002 (W2 P0) 정합: {@code targetUserId} 가 {@code users.id} (BIGINT) 컬럼으로
     * 정착되고 FK {@code fk_pdal_target_user} 가 신설되었으므로 USER_DATA 가 아닌 비-사용자
     * 식별자(CONSULTATION_RECORD/PAYMENT_DATA/SALARY_DATA 등)는 {@code targetUserId} 에 넣을 수
     * 없다. 비-사용자 식별자는 {@link PersonalDataAccessLog#dataIdentifier} 컬럼에만 적재하고
     * {@code targetUserId} 는 {@code null} 로 둔다.
     */
    private void logPersonalDataDestruction(String accessorId, String dataType, String dataId, String reason,
        LifecycleDataCategory category, int retentionYears) {
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
                .accessorName(SYSTEM_ACCESSOR_NAME)
                .dataType(dataType)
                .accessType(ACCESS_TYPE_DELETE)
                .targetUserId(targetUserId)
                .targetUserName(SYSTEM_ACCESSOR_NAME)
                .accessTime(LocalDateTime.now())
                .ipAddress(SYSTEM_IP)
                .reason(reason)
                .result(RESULT_SUCCESS)
                .dataIdentifier(dataId)
                .dataDetails(DATA_DETAILS_LABEL)
                .sessionId(SYSTEM_SESSION_ID)
                .userAgent(SYSTEM_USER_AGENT)
                .metadata(buildDestructionMetadata(category, retentionYears))
                .build();

            personalDataAccessLogRepository.save(accessLog);

        } catch (Exception e) {
            log.error("개인정보 파기 로그 기록 실패: {}", e.getMessage(), e);
        }
    }

    /**
     * destruction 로그 metadata JSON 구성 (간단한 key:value 직렬화 — 외부 라이브러리 의존성 없음).
     */
    private String buildDestructionMetadata(LifecycleDataCategory category, int retentionYears) {
        return String.format(
            "{\"%s\":\"%s\",\"%s\":\"%s\",\"%s\":\"%s\",\"%s\":%d}",
            METADATA_KEY_POLICY_VERSION, escapeJson(cutoffProperties.getPolicyVersion()),
            METADATA_KEY_BUSINESS_MODE, cutoffProperties.getBusinessMode().name(),
            METADATA_KEY_CATEGORY, category.name(),
            METADATA_KEY_RETENTION_YEARS, retentionYears);
    }

    /** 최소한의 JSON 문자열 이스케이프 (큰따옴표·역슬래시만). null 은 빈 문자열로 안전 처리. */
    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    /**
     * 수동 개인정보 파기 실행.
     *
     * <p>운영자가 특정 데이터를 즉시 파기할 때 호출. destruction 로그에는 카테고리 분기 없이
     * 호출자가 지정한 {@code dataType} 만 stamp 되고, metadata 에는 현재 정책 버전/모드가 stamp 된다.
     */
    @Transactional
    public Map<String, Object> executeManualPersonalDataDestruction(String dataType, String dataId, String reason) {
        Map<String, Object> result;

        try {
            log.info("수동 개인정보 파기 실행: 유형={}, ID={}, 사유={}", dataType, dataId, reason);

            // 수동 파기는 카테고리를 추정하지 않고 dataType 그대로 stamp. retentionYears=0 (수동 즉시 파기 의미).
            logPersonalDataDestruction(
                "MANUAL", dataType, dataId, reason,
                LifecycleDataCategory.USER_DATA, 0);

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
     * 개인정보 파기 현황 조회.
     */
    public Map<String, Object> getPersonalDataDestructionStatus() {
        try {
            LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);

            List<PersonalDataAccessLog> destructionLogs = personalDataAccessLogRepository
                .findByAccessTypeAndAccessTimeBetween(ACCESS_TYPE_DELETE, oneMonthAgo, LocalDateTime.now());

            Map<String, Long> destructionStats = destructionLogs.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    PersonalDataAccessLog::getDataType,
                    java.util.stream.Collectors.counting()
                ));

            Map<String, Object> result = new java.util.HashMap<>();
            result.put("totalDestroyed", destructionLogs.size());
            result.put("destructionStats", destructionStats);
            result.put("policyVersion", cutoffProperties.getPolicyVersion());
            result.put("businessMode", cutoffProperties.getBusinessMode().name());
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
