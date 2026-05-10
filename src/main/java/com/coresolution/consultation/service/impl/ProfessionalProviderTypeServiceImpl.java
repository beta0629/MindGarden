package com.coresolution.consultation.service.impl;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.coresolution.consultation.constant.ProfessionalProviderTypeConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.dto.ResolvedProfessionalRegistration;
import com.coresolution.consultation.service.ProfessionalProviderTypeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link ProfessionalProviderTypeService} 구현.
 *
 * @author CoreSolution
 * @since 2026-05-10
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfessionalProviderTypeServiceImpl implements ProfessionalProviderTypeService {

    private final CommonCodeRepository commonCodeRepository;
    private final ObjectMapper objectMapper;

    @Override
    public ResolvedProfessionalRegistration resolve(String tenantId, String requestedProfessionalTypeCode,
            String legacyRoleField) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException(AdminServiceUserFacingMessages.MSG_TENANT_INFO_MISSING);
        }
        if (requestedProfessionalTypeCode != null && !requestedProfessionalTypeCode.trim().isEmpty()) {
            String codeValue = requestedProfessionalTypeCode.trim();
            CommonCode row = requireActiveTypeRow(tenantId, codeValue);
            UserRole authorityRole = parseSystemAuthorityRole(row.getExtraData());
            if (!authorityRole.isProfessionalProvider()) {
                throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_INVALID_PROFESSIONAL_PROVIDER_TYPE_CODE);
            }
            return new ResolvedProfessionalRegistration(codeValue, authorityRole);
        }
        if (legacyRoleField != null && !legacyRoleField.trim().isEmpty()) {
            UserRole legacy = UserRole.fromString(legacyRoleField.trim());
            if (legacy.isProfessionalProvider()) {
                String typeCode = mapLegacyRoleToPreferredTypeCode(legacy);
                Optional<CommonCode> rowOpt = findActiveTypeRow(tenantId, typeCode);
                if (rowOpt.isPresent()) {
                    UserRole authorityRole = parseSystemAuthorityRole(rowOpt.get().getExtraData());
                    return new ResolvedProfessionalRegistration(typeCode, authorityRole);
                }
                return new ResolvedProfessionalRegistration(null, legacy);
            }
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_INVALID_PROFESSIONAL_REGISTRATION_ROLE);
        }
        CommonCode def = findDefaultTypeRow(tenantId)
                .orElseThrow(() -> new IllegalStateException(
                        "테넌트에 기본 전문가 유형(PROFESSIONAL_PROVIDER_TYPE)이 없습니다. 온보딩 공통코드 시드를 확인하세요."));
        UserRole authorityRole = parseSystemAuthorityRole(def.getExtraData());
        return new ResolvedProfessionalRegistration(def.getCodeValue(), authorityRole);
    }

    private String mapLegacyRoleToPreferredTypeCode(UserRole legacy) {
        if (legacy == UserRole.PLAY_THERAPIST) {
            return ProfessionalProviderTypeConstants.LEGACY_PLAY_TYPE_CODE_VALUE;
        }
        if (legacy == UserRole.SPEECH_THERAPIST) {
            return ProfessionalProviderTypeConstants.LEGACY_SPEECH_TYPE_CODE_VALUE;
        }
        return ProfessionalProviderTypeConstants.DEFAULT_TYPE_CODE_VALUE;
    }

    private CommonCode requireActiveTypeRow(String tenantId, String codeValue) {
        return findActiveTypeRow(tenantId, codeValue)
                .orElseThrow(() -> new IllegalArgumentException(
                        AdminServiceUserFacingMessages.MSG_INVALID_PROFESSIONAL_PROVIDER_TYPE_CODE));
    }

    private Optional<CommonCode> findActiveTypeRow(String tenantId, String codeValue) {
        return commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(tenantId,
                        ProfessionalProviderTypeConstants.CODE_GROUP, codeValue)
                .filter(cc -> Boolean.TRUE.equals(cc.getIsActive()) && !Boolean.TRUE.equals(cc.getIsDeleted()));
    }

    private Optional<CommonCode> findDefaultTypeRow(String tenantId) {
        List<CommonCode> rows = commonCodeRepository.findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrderAsc(
                tenantId, ProfessionalProviderTypeConstants.CODE_GROUP);
        for (CommonCode cc : rows) {
            if (Boolean.TRUE.equals(cc.getIsDeleted())) {
                continue;
            }
            if (ProfessionalProviderTypeConstants.DEFAULT_TYPE_CODE_VALUE.equals(cc.getCodeValue())) {
                return Optional.of(cc);
            }
            if (parseIsDefaultFlag(cc.getExtraData())) {
                return Optional.of(cc);
            }
        }
        return Optional.empty();
    }

    private boolean parseIsDefaultFlag(String extraDataJson) {
        if (extraDataJson == null || extraDataJson.isBlank()) {
            return false;
        }
        try {
            Map<String, Object> m = objectMapper.readValue(extraDataJson, new TypeReference<>() {});
            Object v = m.get(ProfessionalProviderTypeConstants.EXTRA_KEY_IS_DEFAULT);
            return v instanceof Boolean b && b;
        } catch (Exception e) {
            log.debug("extra_data isDefault 파싱 실패: {}", e.getMessage());
            return false;
        }
    }

    private UserRole parseSystemAuthorityRole(String extraDataJson) {
        if (extraDataJson == null || extraDataJson.isBlank()) {
            return UserRole.CONSULTANT;
        }
        try {
            Map<String, Object> m = objectMapper.readValue(extraDataJson, new TypeReference<>() {});
            Object raw = m.get(ProfessionalProviderTypeConstants.EXTRA_KEY_SYSTEM_AUTHORITY_ROLE);
            if (raw == null) {
                return UserRole.CONSULTANT;
            }
            UserRole parsed = UserRole.fromString(String.valueOf(raw).trim());
            if (parsed.isProfessionalProvider() || parsed == UserRole.CONSULTANT) {
                return parsed;
            }
            return UserRole.CONSULTANT;
        } catch (Exception e) {
            log.warn("extra_data systemAuthorityRole 파싱 실패, CONSULTANT 사용: {}", e.getMessage());
            return UserRole.CONSULTANT;
        }
    }
}
