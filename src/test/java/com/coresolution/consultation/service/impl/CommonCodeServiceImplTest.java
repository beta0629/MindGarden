package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CodeGroupMetadataRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodePermissionService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link CommonCodeServiceImpl} 테넌트 PK 격리·코어 폴백 조회 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-03-29
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CommonCodeServiceImpl")
class CommonCodeServiceImplTest {

    private static final String TENANT = "tenant-pk-iso-test";

    @Mock
    private CommonCodeRepository commonCodeRepository;
    @Mock
    private CodeGroupMetadataRepository codeGroupMetadataRepository;
    @Mock
    private CommonCodePermissionService permissionService;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CommonCodeServiceImpl commonCodeService;

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("getCommonCodeById: 테넌트 행이 있으면 findByTenantIdAndId만 사용(코어 폴백 없음)")
    void getCommonCodeById_prefersTenantRow() {
        TenantContextHolder.setTenantId(TENANT);
        CommonCode row = baseCodeBuilder().build();
        row.setId(10L);
        row.setTenantId(TENANT);
        when(commonCodeRepository.findByTenantIdAndId(TENANT, 10L)).thenReturn(Optional.of(row));

        assertEquals(row, commonCodeService.getCommonCodeById(10L));

        verify(commonCodeRepository).findByTenantIdAndId(TENANT, 10L);
        verify(commonCodeRepository, never()).findActiveCoreCodeById(anyLong());
    }

    @Test
    @DisplayName("getCommonCodeById: 테넌트 행이 없으면 코어 PK 폴백")
    void getCommonCodeById_fallsBackToCoreWhenTenantMisses() {
        TenantContextHolder.setTenantId(TENANT);
        CommonCode core = baseCodeBuilder().build();
        core.setId(11L);
        core.setTenantId(null);
        when(commonCodeRepository.findByTenantIdAndId(TENANT, 11L)).thenReturn(Optional.empty());
        when(commonCodeRepository.findActiveCoreCodeById(11L)).thenReturn(Optional.of(core));

        assertEquals(core, commonCodeService.getCommonCodeById(11L));

        verify(commonCodeRepository).findByTenantIdAndId(TENANT, 11L);
        verify(commonCodeRepository).findActiveCoreCodeById(11L);
    }

    @Test
    @DisplayName("getCommonCodeById: 테넌트 컨텍스트 없으면 코어 단건만 조회")
    void getCommonCodeById_withoutTenantContext_usesCoreOnly() {
        TenantContextHolder.clear();
        CommonCode core = baseCodeBuilder().build();
        core.setId(12L);
        when(commonCodeRepository.findActiveCoreCodeById(12L)).thenReturn(Optional.of(core));

        assertEquals(core, commonCodeService.getCommonCodeById(12L));

        verify(commonCodeRepository, never()).findByTenantIdAndId(anyString(), anyLong());
        verify(commonCodeRepository).findActiveCoreCodeById(12L);
    }

    @Test
    @DisplayName("getCommonCodeById: 조회 실패 시 RuntimeException")
    void getCommonCodeById_notFound_throws() {
        TenantContextHolder.setTenantId(TENANT);
        when(commonCodeRepository.findByTenantIdAndId(eq(TENANT), eq(99L))).thenReturn(Optional.empty());
        when(commonCodeRepository.findActiveCoreCodeById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> commonCodeService.getCommonCodeById(99L));
    }

    private static CommonCode.CommonCodeBuilder baseCodeBuilder() {
        return CommonCode.builder()
            .codeGroup("G")
            .codeValue("V")
            .codeLabel("L")
            .koreanName("K");
    }
}
