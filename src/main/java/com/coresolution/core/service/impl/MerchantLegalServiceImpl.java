package com.coresolution.core.service.impl;

import java.util.LinkedHashMap;
import java.util.Map;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.dto.MerchantLegalDto;
import com.coresolution.core.dto.MerchantLegalUpdateRequest;
import com.coresolution.core.krpublic.BusinessVerificationResult;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.MerchantLegalService;
import com.coresolution.core.util.BusinessRegistrationNumberValidator;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 테넌트 사업자·약관 서비스 구현.
 *
 * @author CoreSolution
 * @since 2026-09-09
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MerchantLegalServiceImpl implements MerchantLegalService {

    private static final String STATUS_UNREGISTERED = "UNREGISTERED";
    private static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    private static final String STATUS_COMPLETE = "COMPLETE";
    private static final String STATUS_REGISTERED = "REGISTERED";
    private static final String STATUS_PRIVATE = "PRIVATE";
    private static final String STATUS_PUBLIC = "PUBLIC";
    private static final String SETTINGS_KEY = "krPublicData";

    private final TenantRepository tenantRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public MerchantLegalDto getForTenant(String tenantId) {
        Tenant tenant = requireTenant(tenantId);
        MerchantLegalDto dto = toDto(
                tenant.getName(),
                tenant.getBusinessRegistrationNumber(),
                tenant.getRepresentativeName(),
                tenant.getBusinessLandline(),
                tenant.getBusinessAddress(),
                tenant.getMailOrderReportNumber(),
                tenant.getRefundPolicyText(),
                tenant.getProductPriceGuideText());
        applyStoredPublicData(dto, tenant.getSettingsJson());
        return dto;
    }

    @Override
    @Transactional
    public MerchantLegalDto saveForTenant(String tenantId, MerchantLegalUpdateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("사업자·약관 요청이 필요합니다.");
        }
        String bizRaw = blankToNull(request.getBusinessRegistrationNumber());
        if (bizRaw != null && !BusinessRegistrationNumberValidator.isValidRequired(bizRaw)) {
            throw new IllegalArgumentException(BusinessRegistrationNumberValidator.INVALID_MESSAGE);
        }

        Tenant tenant = requireTenant(tenantId);
        tenant.setBusinessRegistrationNumber(
                bizRaw == null ? null : BusinessRegistrationNumberValidator.formatForDisplay(bizRaw));
        tenant.setRepresentativeName(blankToNull(request.getRepresentativeName()));
        tenant.setBusinessLandline(blankToNull(request.getBusinessLandline()));
        tenant.setBusinessAddress(blankToNull(request.getBusinessAddress()));
        tenant.setMailOrderReportNumber(blankToNull(request.getMailOrderReportNumber()));
        tenant.setRefundPolicyText(blankToNull(request.getRefundPolicyText()));
        tenant.setProductPriceGuideText(blankToNull(request.getProductPriceGuideText()));
        mergePublicDataSettings(tenant, request);
        tenantRepository.save(tenant);

        log.info("사업자·약관 저장 완료: tenantId={} verification={}", tenantId,
                request.getBusinessVerification() == null
                        ? "none"
                        : request.getBusinessVerification().getOverallStatus());
        return getForTenant(tenantId);
    }

    @Override
    public MerchantLegalDto toDto(
            String centerName,
            String businessRegistrationNumber,
            String representativeName,
            String businessLandline,
            String businessAddress,
            String mailOrderReportNumber,
            String refundPolicyText,
            String productPriceGuideText) {

        String regStatus = deriveRegistrationStatus(
                businessRegistrationNumber, representativeName, businessLandline, businessAddress);
        String mailStatus = isBlank(mailOrderReportNumber) ? STATUS_UNREGISTERED : STATUS_REGISTERED;
        String siteStatus = STATUS_COMPLETE.equals(regStatus) ? STATUS_PUBLIC : STATUS_PRIVATE;

        return MerchantLegalDto.builder()
                .centerName(nullToEmpty(centerName))
                .businessRegistrationNumber(nullToEmpty(businessRegistrationNumber))
                .representativeName(nullToEmpty(representativeName))
                .businessLandline(nullToEmpty(businessLandline))
                .businessAddress(nullToEmpty(businessAddress))
                .mailOrderReportNumber(nullToEmpty(mailOrderReportNumber))
                .refundPolicyText(nullToEmpty(refundPolicyText))
                .productPriceGuideText(nullToEmpty(productPriceGuideText))
                .registrationStatus(regStatus)
                .mailOrderStatus(mailStatus)
                .sitePublicStatus(siteStatus)
                .registrationStatusLabel(labelRegistration(regStatus))
                .mailOrderStatusLabel(STATUS_REGISTERED.equals(mailStatus) ? "등록" : "미등록")
                .sitePublicStatusLabel(STATUS_PUBLIC.equals(siteStatus) ? "공개" : "비공개")
                .build();
    }

    private Tenant requireTenant(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId가 필요합니다.");
        }
        return tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("테넌트를 찾을 수 없습니다: " + tenantId));
    }

    private static String deriveRegistrationStatus(
            String biz, String rep, String phone, String address) {
        boolean b = !isBlank(biz);
        boolean r = !isBlank(rep);
        boolean p = !isBlank(phone);
        boolean a = !isBlank(address);
        int filled = (b ? 1 : 0) + (r ? 1 : 0) + (p ? 1 : 0) + (a ? 1 : 0);
        if (filled == 0) {
            return STATUS_UNREGISTERED;
        }
        if (filled == 4) {
            return STATUS_COMPLETE;
        }
        return STATUS_IN_PROGRESS;
    }

    private static String labelRegistration(String status) {
        if (STATUS_COMPLETE.equals(status)) {
            return "등록";
        }
        if (STATUS_IN_PROGRESS.equals(status)) {
            return "작성중";
        }
        return "미등록";
    }

    private static boolean isBlank(String v) {
        return v == null || v.isBlank();
    }

    private static String blankToNull(String v) {
        if (v == null) {
            return null;
        }
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }

    private static String nullToEmpty(String v) {
        return v == null ? "" : v;
    }

    private void mergePublicDataSettings(Tenant tenant, MerchantLegalUpdateRequest request) {
        Map<String, Object> root = readSettingsObject(tenant.getSettingsJson());
        if (root == null) {
            log.warn("tenant settings_json is not an object; skip krPublicData merge tenantId={}", tenant.getTenantId());
            return;
        }
        boolean clear = isBlank(request.getBusinessRegistrationNumber());
        if (clear) {
            root.remove(SETTINGS_KEY);
        } else {
            Map<String, Object> block = new LinkedHashMap<>();
            if (!isBlank(request.getOpeningDate())) {
                block.put("openingDate", request.getOpeningDate().trim());
            }
            if (request.getBusinessVerification() != null) {
                block.put("businessVerification", objectMapper.convertValue(
                        request.getBusinessVerification(), new TypeReference<Map<String, Object>>() {
                        }));
            }
            if (block.isEmpty()) {
                root.remove(SETTINGS_KEY);
            } else {
                root.put(SETTINGS_KEY, block);
            }
        }
        try {
            tenant.setSettingsJson(objectMapper.writeValueAsString(root));
        } catch (Exception ex) {
            log.warn("krPublicData settings write failed: type={}", ex.getClass().getSimpleName());
        }
    }

    private void applyStoredPublicData(MerchantLegalDto dto, String settingsJson) {
        Map<String, Object> root = readSettingsObject(settingsJson);
        if (root == null) {
            return;
        }
        Object raw = root.get(SETTINGS_KEY);
        if (!(raw instanceof Map<?, ?> block)) {
            return;
        }
        Object opening = block.get("openingDate");
        if (opening != null && !String.valueOf(opening).isBlank()) {
            dto.setOpeningDate(String.valueOf(opening).trim());
        }
        Object verification = block.get("businessVerification");
        if (verification instanceof Map<?, ?>) {
            dto.setBusinessVerification(objectMapper.convertValue(verification, BusinessVerificationResult.class));
        }
    }

    private Map<String, Object> readSettingsObject(String settingsJson) {
        if (settingsJson == null || settingsJson.isBlank()) {
            return new LinkedHashMap<>();
        }
        try {
            JsonNode node = objectMapper.readTree(settingsJson);
            if (!node.isObject()) {
                return null;
            }
            return objectMapper.convertValue(node, new TypeReference<LinkedHashMap<String, Object>>() {
            });
        } catch (Exception ex) {
            log.warn("tenant settings_json read failed: type={}", ex.getClass().getSimpleName());
            return null;
        }
    }
}
