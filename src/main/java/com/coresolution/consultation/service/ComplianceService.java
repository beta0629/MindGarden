package com.coresolution.consultation.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.compliance.ComplianceDashboardSampleContent;
import com.coresolution.consultation.constant.compliance.ComplianceServiceErrorMessages;
import com.coresolution.consultation.repository.PersonalDataAccessLogRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 컴플라이언스 관리 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ComplianceService {

    /** 교육 대상 인원 집계 역할 (내담자 제외 임직원) */
    private static final Set<UserRole> EDUCATION_TARGET_ROLES =
        Collections.unmodifiableSet(EnumSet.of(UserRole.ADMIN, UserRole.CONSULTANT, UserRole.STAFF));

    /** 개인정보 처리방침 준수 점검 항목. 실측 데이터가 없으면 전 항목 「미점검」. */
    private static final List<String> POLICY_COMPLIANCE_ITEMS = List.of(
        "policyExists", "policyUpdated", "userConsent", "dataMinimization", "purposeLimitation",
        "storageLimitation", "accuracy", "security", "transparency", "accountability");

    private final PersonalDataAccessLogRepository personalDataAccessLogRepository;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    
    /**
     * 개인정보 처리 현황 조회
     * 
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 개인정보 처리 현황
     */
    public Map<String, Object> getPersonalDataProcessingStatus(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            result.put("error", ComplianceServiceErrorMessages.MSG_TENANT_CONTEXT_MISSING);
            return result;
        }
        
        try {
            long totalCount = personalDataAccessLogRepository.countByTenantIdAndAccessTimeBetween(
                tenantId, startDate, endDate);

            Map<String, Long> dataTypeStats = countStatsOrEmpty("dataType",
                () -> personalDataAccessLogRepository.countByTenantIdAndDataTypeAndAccessTimeBetween(
                    tenantId, startDate, endDate));
            Map<String, Long> accessTypeStats = countStatsOrEmpty("accessType",
                () -> personalDataAccessLogRepository.countByTenantIdAndAccessTypeAndAccessTimeBetween(
                    tenantId, startDate, endDate));
            Map<String, Long> accessorStats = countStatsOrEmpty("accessorId",
                () -> personalDataAccessLogRepository.countByTenantIdAndAccessorIdAndAccessTimeBetween(
                    tenantId, startDate, endDate));
            
            result.put("dataTypeStats", dataTypeStats);
            result.put("accessTypeStats", accessTypeStats);
            result.put("accessorStats", accessorStats);
            result.put("totalCount", totalCount);
            result.put("period", Map.of(
                "startDate", startDate,
                "endDate", endDate
            ));
            
            log.info("개인정보 처리 현황 조회 완료: 총 {}건", totalCount);
            
        } catch (Exception e) {
            log.error("개인정보 처리 현황 조회 실패: {}", e.getMessage(), e);
            result.put("error", ComplianceServiceErrorMessages.MSG_PERSONAL_DATA_PROCESSING_STATUS_QUERY_FAILED);
        }
        
        return result;
    }
    
    /**
     * 개인정보 영향평가 결과 조회
     * 
     * @return 개인정보 영향평가 결과
     */
    public Map<String, Object> getPersonalDataImpactAssessment() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 영향평가 실측 저장소가 없으므로 표본 위험도·개선영역을 내보내지 않고 「미점검」 빈 상태만 응답
            Map<String, Object> overallAssessment = new LinkedHashMap<>();
            overallAssessment.put("overallRiskLevel", ComplianceServiceErrorMessages.STATUS_NOT_REVIEWED);
            overallAssessment.put("complianceStatus", ComplianceServiceErrorMessages.STATUS_NOT_REVIEWED);
            overallAssessment.put("improvementAreas", Collections.emptyList());
            overallAssessment.put("nextAssessmentDate", null);
            
            result.put("riskAssessment", Collections.emptyMap());
            result.put("overallAssessment", overallAssessment);
            result.put("assessmentDate", null);
            result.put("status", "success");
            
        } catch (Exception e) {
            log.error("개인정보 영향평가 조회 실패: {}", e.getMessage(), e);
            result.put("error", ComplianceServiceErrorMessages.MSG_PERSONAL_DATA_IMPACT_ASSESSMENT_QUERY_FAILED);
        }
        
        return result;
    }
    
    /**
     * 개인정보 침해사고 대응 현황 조회
     * 
     * @return 침해사고 대응 현황
     */
    public Map<String, Object> getPersonalDataBreachResponseStatus() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Map<String, Object> responseProcedures = ComplianceDashboardSampleContent.breachResponseProcedures();
            Map<String, Object> responseTeam =
                ComplianceDashboardSampleContent.breachResponseTeam(buildTenantContactInfo());
            
            result.put("responseProcedures", responseProcedures);
            result.put("responseTeam", responseTeam);
            result.put("lastUpdated", LocalDateTime.now());
            result.put("status", "success");
            
        } catch (Exception e) {
            log.error("개인정보 침해사고 대응 현황 조회 실패: {}", e.getMessage(), e);
            result.put("error", ComplianceServiceErrorMessages.MSG_PERSONAL_DATA_BREACH_RESPONSE_STATUS_QUERY_FAILED);
        }
        
        return result;
    }
    
    /**
     * 개인정보보호 교육 현황 조회
     * 
     * @return 교육 현황
     */
    public Map<String, Object> getPersonalDataProtectionEducationStatus() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 교육 프로그램 저장소가 없으므로 표본 프로그램을 내보내지 않는다 (화면은 빈 상태 안내)
            Map<String, Object> educationPrograms = Collections.emptyMap();
            
            // 이수 기록 저장소가 없으므로 이수 인원·이수율은 비워 두고(화면 '—'), 대상 인원만 실제 집계
            Map<String, Object> completionStatus = new LinkedHashMap<>();
            completionStatus.put("totalEmployees", countEducationTargets());
            completionStatus.put("basicEducationCompleted", null);
            completionStatus.put("medicalDataEducationCompleted", null);
            completionStatus.put("technicalEducationCompleted", null);
            completionStatus.put("completionRate", null);
            
            result.put("educationPrograms", educationPrograms);
            result.put("completionStatus", completionStatus);
            result.put("nextEducationDate", null);
            result.put("status", "success");
            
        } catch (Exception e) {
            log.error("개인정보보호 교육 현황 조회 실패: {}", e.getMessage(), e);
            result.put("error", ComplianceServiceErrorMessages.MSG_PERSONAL_DATA_PROTECTION_EDUCATION_STATUS_QUERY_FAILED);
        }
        
        return result;
    }
    
    /**
     * 개인정보 처리방침 현황 조회
     * 
     * @return 처리방침 현황
     */
    public Map<String, Object> getPersonalDataProcessingPolicyStatus() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 처리방침 구성 요소
            Map<String, Object> policyComponents = Map.of(
                "basicInfo", buildTenantBasicInfo(),
                "dataTypes", Map.of(
                    "userInfo", List.of("이름", "이메일", "전화번호", "주소", "생년월일"),
                    "consultationInfo", List.of("상담 내용", "상담 일지", "상담사 정보"),
                    "paymentInfo", List.of("결제 내역", "환불 정보", "금융 거래 내역"),
                    "salaryInfo", List.of("급여 정보", "세금 정보", "근로자 정보")
                ),
                "processingPurposes", Map.of(
                    "userManagement", "회원가입 및 서비스 이용",
                    "consultationService", "상담 서비스 제공",
                    "paymentProcessing", "결제 및 환불 처리",
                    "salaryManagement", "급여 계산 및 세금 처리"
                ),
                "retentionPeriods", Map.of(
                    "userInfo", "회원 탈퇴 시까지",
                    "consultationInfo", "상담 완료 후 5년",
                    "paymentInfo", "거래 완료 후 5년",
                    "salaryInfo", "급여 지급 후 3년"
                )
            );
            
            // 처리방침 준수 현황 — 실측 점검 데이터가 없으므로 전 항목 「미점검」
            Map<String, Object> complianceStatus = buildNotReviewedComplianceStatus();
            
            result.put("policyComponents", policyComponents);
            result.put("complianceStatus", complianceStatus);
            result.put("lastReviewDate", null);
            result.put("nextReviewDate", null);
            result.put("status", "success");
            
        } catch (Exception e) {
            log.error("개인정보 처리방침 현황 조회 실패: {}", e.getMessage(), e);
            result.put("error", ComplianceServiceErrorMessages.MSG_PERSONAL_DATA_PROCESSING_POLICY_STATUS_QUERY_FAILED);
        }
        
        return result;
    }
    
    /**
     * 컴플라이언스 종합 현황 조회
     * 
     * @return 컴플라이언스 종합 현황
     */
    public Map<String, Object> getComplianceOverallStatus() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 개인정보 처리 현황
            Map<String, Object> processingStatus = getPersonalDataProcessingStatus(
                LocalDateTime.now().minusMonths(1), LocalDateTime.now());
            
            // 개인정보 영향평가
            Map<String, Object> impactAssessment = getPersonalDataImpactAssessment();
            
            // 침해사고 대응 현황
            Map<String, Object> breachResponse = getPersonalDataBreachResponseStatus();
            
            // 교육 현황
            Map<String, Object> educationStatus = getPersonalDataProtectionEducationStatus();
            
            // 처리방침 현황
            Map<String, Object> policyStatus = getPersonalDataProcessingPolicyStatus();
            
            result.put("processingStatus", processingStatus);
            result.put("impactAssessment", impactAssessment);
            result.put("breachResponse", breachResponse);
            result.put("educationStatus", educationStatus);
            result.put("policyStatus", policyStatus);
            // 실측 평가 기준이 없어 점수·등급은 산출하지 않음 (응답 키 존재 여부로 만점이 나오던 고정값 제거)
            result.put("overallScore", null);
            result.put("complianceLevel", null);
            result.put("lastUpdated", LocalDateTime.now());
            result.put("status", "success");
            
        } catch (Exception e) {
            log.error("컴플라이언스 종합 현황 조회 실패: {}", e.getMessage(), e);
            result.put("error", ComplianceServiceErrorMessages.MSG_COMPLIANCE_OVERALL_STATUS_QUERY_FAILED);
        }
        
        return result;
    }
    
    /**
     * 현재 테넌트의 교육 대상(임직원) 활성 인원.
     *
     * @return 인원 수, 테넌트 컨텍스트가 없으면 {@code null}
     */
    private Long countEducationTargets() {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return null;
        }
        return userRepository.countByTenantIdAndRolesInAndIsActiveTrueAndIsDeletedFalse(
            tenantId, EDUCATION_TARGET_ROLES);
    }

    /**
     * 처리방침 기본 정보 — 현재 테넌트 설정(이름·연락처)만 사용. 값이 없으면 {@code null}.
     *
     * @return 기본 정보 맵 (null 값 허용)
     */
    /**
     * 현재 테넌트 센터 연락처. 값이 없으면 공백 + {@code notice} 안내만 노출한다.
     *
     * <p>P1 보안(2026-10-03): 특정 테넌트(마인드가든) 전화·이메일·주소 하드코딩 제거.
     * 마인드가든 값으로의 폴백은 없다.
     *
     * @return {@code emergency}/{@code email}/{@code address} + 필요 시 {@code notice}
     */
    private Map<String, Object> buildTenantContactInfo() {
        Optional<Tenant> tenant = currentTenant();
        String emergency = blankToEmpty(tenant.map(Tenant::getContactPhone).orElse(null));
        String email = blankToEmpty(tenant.map(Tenant::getContactEmail).orElse(null));
        String address = blankToEmpty(tenant.map(ComplianceService::joinTenantAddress).orElse(null));

        Map<String, Object> contactInfo = new LinkedHashMap<>();
        contactInfo.put("emergency", emergency);
        contactInfo.put("email", email);
        contactInfo.put("address", address);
        if (emergency.isEmpty() || email.isEmpty() || address.isEmpty()) {
            contactInfo.put("notice", ComplianceServiceErrorMessages.MSG_CENTER_PROFILE_REQUIRED);
        }
        return contactInfo;
    }

    /**
     * 실측 점검 데이터가 없는 처리방침 준수 항목 상태 — 전 항목 「미점검」.
     *
     * @return 항목별 상태 맵
     */
    private static Map<String, Object> buildNotReviewedComplianceStatus() {
        Map<String, Object> complianceStatus = new LinkedHashMap<>();
        for (String item : POLICY_COMPLIANCE_ITEMS) {
            complianceStatus.put(item, ComplianceServiceErrorMessages.STATUS_NOT_REVIEWED);
        }
        return complianceStatus;
    }

    /**
     * 현재 테넌트 컨텍스트의 테넌트.
     *
     * @return 테넌트, 컨텍스트·행이 없으면 빈 Optional
     */
    private Optional<Tenant> currentTenant() {
        return Optional.ofNullable(TenantContextHolder.getTenantId())
            .filter(id -> !id.isBlank())
            .flatMap(tenantRepository::findByTenantIdAndIsDeletedFalse);
    }

    /**
     * null·공백은 빈 문자열로 정규화 (화면에서 공백 표시).
     *
     * @param value 원본 값
     * @return 공백이면 빈 문자열, 아니면 trim 값
     */
    private static String blankToEmpty(String value) {
        return (value == null || value.isBlank()) ? "" : value.trim();
    }

    private Map<String, Object> buildTenantBasicInfo() {
        Optional<Tenant> tenant = currentTenant();

        Map<String, Object> basicInfo = new LinkedHashMap<>();
        basicInfo.put("companyName", tenant.map(Tenant::getName).orElse(null));
        basicInfo.put("privacyOfficer", null);
        basicInfo.put("contactEmail", tenant.map(Tenant::getContactEmail).orElse(null));
        basicInfo.put("contactPhone", tenant.map(Tenant::getContactPhone).orElse(null));
        basicInfo.put("address", tenant.map(ComplianceService::joinTenantAddress).orElse(null));
        basicInfo.put("lastUpdated", null);
        return basicInfo;
    }

    /**
     * 테넌트 주소 + 상세주소. 둘 다 비어 있으면 {@code null}.
     *
     * @param tenant 테넌트
     * @return 표시용 주소
     */
    private static String joinTenantAddress(Tenant tenant) {
        String joined = Stream.of(tenant.getAddress(), tenant.getAddressDetail())
            .filter(part -> part != null && !part.isBlank())
            .map(String::trim)
            .collect(Collectors.joining(" "));
        return joined.isEmpty() ? null : joined;
    }

    /**
     * 그룹 집계 조회. 실패 시 빈 맵으로 두고 전체 건수 응답은 유지한다.
     *
     * @param label 로그용 집계 이름
     * @param query 집계 조회
     * @return 집계 맵 (실패·null 이면 빈 맵)
     */
    private Map<String, Long> countStatsOrEmpty(String label, Supplier<Map<String, Long>> query) {
        try {
            Map<String, Long> stats = query.get();
            return stats != null ? stats : Collections.emptyMap();
        } catch (RuntimeException e) {
            log.warn("개인정보 처리 현황 {} 집계 실패: {}", label, e.getMessage());
            return Collections.emptyMap();
        }
    }
}
