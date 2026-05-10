package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.coresolution.consultation.constant.ProfessionalProviderTypeConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ResolvedProfessionalRegistration;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CommonCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ProfessionalProviderTypeServiceImpl} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-10
 */
@ExtendWith(MockitoExtension.class)
class ProfessionalProviderTypeServiceImplTest {

    private static final String TENANT = "tenant-test-001";

    @Mock
    private CommonCodeRepository commonCodeRepository;

    private ProfessionalProviderTypeServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ProfessionalProviderTypeServiceImpl(commonCodeRepository, new ObjectMapper());
    }

    @Test
    @DisplayName("professionalTypeCode 지정 시 해당 행의 systemAuthorityRole 로 UserRole 결정")
    void resolve_whenTypeCodeProvided_returnsFromExtraData() {
        CommonCode row = CommonCode.builder()
                .codeValue("CUSTOM_TYPE")
                .codeGroup(ProfessionalProviderTypeConstants.CODE_GROUP)
                .isActive(true)
                .extraData("{\"systemAuthorityRole\":\"CONSULTANT\",\"isDefault\":false,\"sortOrder\":5}")
                .build();
        row.setIsDeleted(false);
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(TENANT,
                ProfessionalProviderTypeConstants.CODE_GROUP, "CUSTOM_TYPE"))
                .thenReturn(Optional.of(row));

        ResolvedProfessionalRegistration r = service.resolve(TENANT, "CUSTOM_TYPE", null);

        assertEquals("CUSTOM_TYPE", r.professionalProviderTypeCode());
        assertEquals(UserRole.CONSULTANT, r.userRole());
    }

    @Test
    @DisplayName("미존재 professionalTypeCode 는 IllegalArgumentException")
    void resolve_whenTypeCodeUnknown_throws() {
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(anyString(), anyString(), anyString()))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.resolve(TENANT, "NO_SUCH", null));
    }

    @Test
    @DisplayName("코드 미지정·레거시 없으면 기본 행(DEFAULT_COUNSELOR) 사용")
    void resolve_whenBlankUsesDefaultRow() {
        CommonCode def = CommonCode.builder()
                .codeValue(ProfessionalProviderTypeConstants.DEFAULT_TYPE_CODE_VALUE)
                .codeGroup(ProfessionalProviderTypeConstants.CODE_GROUP)
                .isActive(true)
                .extraData("{\"systemAuthorityRole\":\"CONSULTANT\",\"isDefault\":true,\"sortOrder\":0}")
                .build();
        def.setIsDeleted(false);
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrderAsc(TENANT,
                ProfessionalProviderTypeConstants.CODE_GROUP))
                .thenReturn(List.of(def));

        ResolvedProfessionalRegistration r = service.resolve(TENANT, "  ", null);

        assertEquals(ProfessionalProviderTypeConstants.DEFAULT_TYPE_CODE_VALUE, r.professionalProviderTypeCode());
        assertEquals(UserRole.CONSULTANT, r.userRole());
    }
}
