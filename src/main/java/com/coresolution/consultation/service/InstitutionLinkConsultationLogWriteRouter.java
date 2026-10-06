package com.coresolution.consultation.service;

import java.util.Map;
import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.InstitutionLinkContractRepository;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 회기권 일지 쓰기와 타기관 일지 쓰기를 분기만 한다. try/catch 로 감싸지 않는다.
 *
 * <p>회기권 기본 경로에 일정 조회를 추가하지 않는다. rem=0·회차 null 로는 판별하지 않는다.
 * 타기관은 {@code engagementType}/{@code paymentTiming}, {@code contractId},
 * 또는 {@code mappingId}→{@link PaymentTimingConstants#INSTITUTION_LINK} 로만 판별한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Component
@RequiredArgsConstructor
public class InstitutionLinkConsultationLogWriteRouter {

    private final InstitutionLinkConsultationLogService institutionLinkConsultationLogService;
    private final ConsultationRecordService consultationRecordService;
    private final ConsultantClientMappingRepository consultantClientMappingRepository;
    private final InstitutionLinkContractRepository institutionLinkContractRepository;

    /**
     * 타기관이면 전용 서비스만, 아니면 회기권 일지 서비스만 호출한다.
     *
     * @param recordData 스케줄 상담일지 본문
     * @return 저장된 일지
     */
    public Object create(Map<String, Object> recordData) {
        if (isInstitutionLink(recordData)) {
            return institutionLinkConsultationLogService.createFromSchedulePayload(recordData);
        }
        return consultationRecordService.createConsultationRecord(recordData);
    }

    /**
     * 타기관 경로인지. rem=0·회차 null 로는 판별하지 않는다.
     *
     * @param recordData 스케줄 상담일지 본문
     * @return 타기관이면 true
     */
    public boolean isInstitutionLink(Map<String, Object> recordData) {
        if (recordData == null) {
            return false;
        }
        if (PaymentTimingConstants.isInstitutionLink(toStringValue(recordData.get("engagementType")))) {
            return true;
        }
        if (PaymentTimingConstants.isInstitutionLink(toStringValue(recordData.get("paymentTiming")))) {
            return true;
        }
        if (toLong(recordData.get("contractId")) != null) {
            return true;
        }
        return resolveInstitutionMapping(recordData) || resolveContractFromMapping(recordData);
    }

    private boolean resolveInstitutionMapping(Map<String, Object> recordData) {
        String tenantId = TenantContextHolder.getTenantId();
        Long mappingId = toLong(recordData.get("mappingId"));
        if (tenantId == null || tenantId.isBlank() || mappingId == null) {
            return false;
        }
        return consultantClientMappingRepository.findByTenantIdAndId(tenantId, mappingId)
                .map(ConsultantClientMapping::getPaymentTiming)
                .filter(PaymentTimingConstants::isInstitutionLink)
                .isPresent();
    }

    private boolean resolveContractFromMapping(Map<String, Object> recordData) {
        String tenantId = TenantContextHolder.getTenantId();
        Long mappingId = toLong(recordData.get("mappingId"));
        if (tenantId == null || tenantId.isBlank() || mappingId == null) {
            return false;
        }
        return institutionLinkContractRepository.findByTenantIdAndSourceMappingId(tenantId, mappingId)
                .isPresent();
    }

    private static Long toLong(Object raw) {
        if (raw == null || raw.toString().isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(raw.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String toStringValue(Object raw) {
        return raw == null ? null : raw.toString();
    }
}
