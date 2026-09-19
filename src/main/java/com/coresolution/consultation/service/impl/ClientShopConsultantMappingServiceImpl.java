package com.coresolution.consultation.service.impl;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.consultation.ConsultationServiceUserFacingMessages;
import com.coresolution.consultation.dto.shop.ShopConsultantMappingOption;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.ClientShopConsultantMappingService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.util.MappingAssignmentStatus;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.ShopConsultantMappingBindUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 내담자 쇼핑 체크아웃용 상담 매핑 조회 구현.
 *
 * @author MindGarden
 * @since 2026-05-20
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClientShopConsultantMappingServiceImpl implements ClientShopConsultantMappingService {

    private final ConsultantClientMappingRepository consultantClientMappingRepository;
    private final UserPersonalDataCacheService userPersonalDataCacheService;
    private final PersonalDataEncryptionUtil encryptionUtil;

    @Override
    @Transactional(readOnly = true)
    public List<ShopConsultantMappingOption> listActiveMappingOptions(String tenantId, Long clientUserId) {
        List<ConsultantClientMapping> active = listActiveMappings(tenantId, clientUserId);
        active.sort(Comparator.comparing(ConsultantClientMapping::getStartDate,
                Comparator.nullsLast(Comparator.reverseOrder())));

        Long preselectedMappingId = ShopConsultantMappingBindUtil.resolveAutoPreselectedMappingId(active, List.of());

        List<ShopConsultantMappingOption> options = new ArrayList<>(active.size());
        for (ConsultantClientMapping mapping : active) {
            String label = StringUtils.hasText(mapping.getPackageName()) ? mapping.getPackageName().trim() : null;
            Long consultantId = mapping.getConsultant() != null ? mapping.getConsultant().getId() : null;
            boolean preselected = preselectedMappingId != null && preselectedMappingId.equals(mapping.getId());
            options.add(ShopConsultantMappingOption.builder()
                    .mappingId(mapping.getId())
                    .consultantId(consultantId)
                    .consultantDisplayName(resolveConsultantDisplayName(mapping.getConsultant()))
                    .label(label)
                    .preselected(preselected)
                    .build());
        }
        return options;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConsultantClientMapping> listActiveMappings(String tenantId, Long clientUserId) {
        // ACTIVE / PENDING_PAYMENT / PAYMENT_CONFIRMED / SESSIONS_EXHAUSTED (isShopCheckoutEligible).
        // paymentStatus는 필터하지 않음. TERMINATED / CANCELLED / INACTIVE 등 제외. tenantId fail-closed.
        return consultantClientMappingRepository
                .findByClientIdAndStatusNot(
                        tenantId, clientUserId, ConsultantClientMapping.MappingStatus.INACTIVE)
                .stream()
                .filter(m -> MappingAssignmentStatus.isShopCheckoutEligible(m.getStatus()))
                .collect(Collectors.toCollection(ArrayList::new));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Long> listActiveMappingIds(String tenantId, Long clientUserId) {
        return listActiveMappings(tenantId, clientUserId).stream()
                .map(ConsultantClientMapping::getId)
                .toList();
    }

    private String resolveConsultantDisplayName(User consultant) {
        if (consultant == null) {
            return ConsultationServiceUserFacingMessages.DEFAULT_CONSULTANT_DISPLAY_NAME;
        }
        try {
            Map<String, String> decrypted = userPersonalDataCacheService.getDecryptedUserData(consultant);
            if (decrypted != null) {
                String name = decrypted.get("name");
                if (StringUtils.hasText(name)) {
                    return name.trim();
                }
            }
        } catch (Exception e) {
            log.warn("상담사 표시명 캐시 복호화 실패: consultantId={}, {}", consultant.getId(), e.getMessage());
        }
        String stored = consultant.getName();
        if (StringUtils.hasText(stored)) {
            String plain = encryptionUtil.safeDecrypt(stored.trim());
            if (StringUtils.hasText(plain) && !plain.startsWith("legacy::")) {
                return plain.trim();
            }
        }
        return ConsultationServiceUserFacingMessages.DEFAULT_CONSULTANT_DISPLAY_NAME;
    }
}
