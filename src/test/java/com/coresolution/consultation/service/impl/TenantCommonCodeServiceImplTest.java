package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.coresolution.consultation.dto.CommonCodeUpdateRequest;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CodeGroupMetadataRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link TenantCommonCodeServiceImpl} — 요청 tenantId 기준 조회·코어 ID 안내.
 *
 * @author CoreSolution
 * @since 2026-04-07
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TenantCommonCodeService 구현")
class TenantCommonCodeServiceImplTest {

    private static final String TENANT = "tenant-scoped-test";

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @Mock
    private CodeGroupMetadataRepository codeGroupMetadataRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private TenantCommonCodeServiceImpl tenantCommonCodeService;

    @Test
    @DisplayName("updateTenantCode: 경로의 tenantId로 findByTenantIdAndId 호출")
    void updateTenantCode_usesRequestTenantId() {
        CommonCode row = baseRow(10L, TENANT);
        CommonCodeUpdateRequest request = CommonCodeUpdateRequest.builder().codeLabel("x").build();
        when(commonCodeRepository.findByTenantIdAndId(TENANT, 10L)).thenReturn(Optional.of(row));
        when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(inv -> inv.getArgument(0));

        tenantCommonCodeService.updateTenantCode(TENANT, 10L, request);

        verify(commonCodeRepository).findByTenantIdAndId(eq(TENANT), eq(10L));
    }

    @Test
    @DisplayName("updateTenantCode: 코어 PK만 있으면 플랫폼 API 안내 예외")
    void updateTenantCode_coreOnlyId_throwsPlatformMessage() {
        CommonCodeUpdateRequest request = CommonCodeUpdateRequest.builder().codeLabel("x").build();
        CommonCode coreRow = baseRow(99L, null);
        when(commonCodeRepository.findByTenantIdAndId(TENANT, 99L)).thenReturn(Optional.empty());
        when(commonCodeRepository.findActiveCoreCodeById(99L)).thenReturn(Optional.of(coreRow));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> tenantCommonCodeService.updateTenantCode(TENANT, 99L, request));

        assertTrue(ex.getMessage().contains("시스템 공통코드"));
    }

    @Test
    @DisplayName("validateTenantCodeOwnership: 코어 PK만 있으면 false")
    void validateTenantCodeOwnership_coreOnly_false() {
        CommonCode coreRow = baseRow(88L, null);
        when(commonCodeRepository.findByTenantIdAndId(TENANT, 88L)).thenReturn(Optional.empty());
        when(commonCodeRepository.findActiveCoreCodeById(88L)).thenReturn(Optional.of(coreRow));

        assertFalse(tenantCommonCodeService.validateTenantCodeOwnership(TENANT, 88L));
    }

    @Test
    @DisplayName("validateTenantCodeOwnership: 테넌트 행이면 true")
    void validateTenantCodeOwnership_tenantRow_true() {
        CommonCode row = baseRow(12L, TENANT);
        when(commonCodeRepository.findByTenantIdAndId(TENANT, 12L)).thenReturn(Optional.of(row));

        assertTrue(tenantCommonCodeService.validateTenantCodeOwnership(TENANT, 12L));
    }

    @Test
    @DisplayName("validateTenantCodeOwnership: 없는 PK면 예외")
    void validateTenantCodeOwnership_missing_throws() {
        when(commonCodeRepository.findByTenantIdAndId(TENANT, 77L)).thenReturn(Optional.empty());
        when(commonCodeRepository.findActiveCoreCodeById(77L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> tenantCommonCodeService.validateTenantCodeOwnership(TENANT, 77L));
        assertEquals("존재하지 않는 코드입니다: 77", ex.getMessage());
    }

    private static CommonCode baseRow(Long id, String tenantId) {
        CommonCode c = CommonCode.builder()
            .codeGroup("G")
            .codeValue("V")
            .codeLabel("L")
            .koreanName("K")
            .build();
        c.setId(id);
        c.setTenantId(tenantId);
        return c;
    }
}
