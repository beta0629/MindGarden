package com.coresolution.consultation.service;

import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.ClientEngagementTypeConstants;
import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.InstitutionLinkContractRepository;
import com.coresolution.consultation.service.support.ConsultationRecordWriter;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.ClientPlatform;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 회기권 일지 쓰기와 타기관 일지 쓰기를 분기만 한다. try/catch 로 감싸지 않는다.
 *
 * <p>회기권 기본 경로에 일정 조회를 추가하지 않는다. rem=0·회차 null 로는 판별하지 않는다.
 * 타기관은 {@code engagementType}/{@code paymentTiming}, {@code contractId},
 * {@code mappingId}→{@link PaymentTimingConstants#INSTITUTION_LINK},
 * 또는 {@code clientId}→내담자 {@link ClientEngagementTypeConstants#INSTITUTION_LINK} 로만 판별한다.</p>
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
    private final ClientRepository clientRepository;
    private final ConsultationRecordCreateRequestValidator consultationRecordCreateRequestValidator;

    /**
     * 테넌트를 확인하고 필수값을 검증한 뒤, 타기관이면 전용 서비스만, 아니면 회기권 일지 서비스만 호출한다.
     *
     * <p>두 경로 모두 공용 가드({@code ConsultationRecordAccessGuard})를 통과한 작성자로만 저장한다.
     * 작성자 없이 저장하는 오버로드는 두지 않는다.</p>
     *
     * @param recordData 스케줄 상담일지 본문
     * @param platform 요청 클라이언트 채널({@code X-Client-Platform}, 로그용)
     * @param writer 가드가 만든 작성자 정보 (두 경로 모두 필수)
     * @return 저장된 일지
     */
    public Object create(Map<String, Object> recordData, ClientPlatform platform, ConsultationRecordWriter writer) {
        TenantContextHolder.getRequiredTenantId();
        boolean institutionLink = isInstitutionLink(recordData);
        consultationRecordCreateRequestValidator.validate(recordData, institutionLink, platform);
        if (institutionLink) {
            return institutionLinkConsultationLogService.createFromSchedulePayload(recordData, writer);
        }
        return consultationRecordService.createConsultationRecord(recordData, writer);
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
        if (resolveInstitutionClient(recordData)) {
            return true;
        }
        return resolveInstitutionMapping(recordData) || resolveContractFromMapping(recordData);
    }

    private boolean resolveInstitutionClient(Map<String, Object> recordData) {
        String tenantId = TenantContextHolder.getTenantId();
        Long clientId = toLong(recordData.get("clientId"));
        if (tenantId == null || tenantId.isBlank() || clientId == null) {
            return false;
        }
        Optional<Client> client = clientRepository.findByTenantIdAndIdIncludingDeleted(tenantId, clientId);
        return client.map(Client::getEngagementType)
                .filter(ClientEngagementTypeConstants::isInstitutionLink)
                .isPresent();
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
