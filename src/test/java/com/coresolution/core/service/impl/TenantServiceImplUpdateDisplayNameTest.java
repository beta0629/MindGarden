package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.core.constants.TenantDisplayNameMessages;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.dto.TenantNameUpdateRequest;
import com.coresolution.core.dto.TenantNameUpdateResponse;
import com.coresolution.core.repository.TenantRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link TenantServiceImpl#updateTenantDisplayName(String, TenantNameUpdateRequest)} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-04-01
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TenantServiceImpl — 테넌트 표시명 변경")
class TenantServiceImplUpdateDisplayNameTest {

    private static final String TENANT_ID = "tenant-e2e-display-001";

    @Mock
    private TenantRepository tenantRepository;

    @InjectMocks
    private TenantServiceImpl tenantService;

    private Tenant activeTenant(String name) {
        return Tenant.builder()
                .tenantId(TENANT_ID)
                .name(name)
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("정상: 중복 없음 → save 후 응답 필드 검증")
    void updateDisplayName_success_savesAndReturnsResponse() {
        Tenant existing = activeTenant("Old Name");
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID)).thenReturn(Optional.of(existing));
        when(tenantRepository.findByNameAndIsDeletedFalse("New Unique Name")).thenReturn(Optional.empty());
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(inv -> inv.getArgument(0));

        TenantNameUpdateResponse result = tenantService.updateTenantDisplayName(
                TENANT_ID,
                TenantNameUpdateRequest.builder().name("New Unique Name").build());

        assertThat(result.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(result.getName()).isEqualTo("New Unique Name");
        assertThat(result.getBusinessType()).isEqualTo("CONSULTATION");
        assertThat(result.getStatus()).isEqualTo("ACTIVE");
        verify(tenantRepository).save(any(Tenant.class));
    }

    @Test
    @DisplayName("테넌트 없음 → EntityNotFoundException, TENANT_NOT_FOUND")
    void updateDisplayName_tenantMissing_throwsEntityNotFound() {
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID)).thenReturn(Optional.empty());

        TenantNameUpdateRequest request = TenantNameUpdateRequest.builder().name("Any").build();
        EntityNotFoundException ex =
                assertThrows(EntityNotFoundException.class, () -> tenantService.updateTenantDisplayName(TENANT_ID, request));
        assertThat(ex).hasMessage(TenantDisplayNameMessages.TENANT_NOT_FOUND);
    }

    @Test
    @DisplayName("null 이름 → 트림 후 빈 문자열 → IllegalArgumentException")
    void updateDisplayName_nullName_throwsNameEmpty() {
        Tenant existing = activeTenant("X");
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID)).thenReturn(Optional.of(existing));

        TenantNameUpdateRequest request = new TenantNameUpdateRequest();
        request.setName(null);

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> tenantService.updateTenantDisplayName(TENANT_ID, request));
        assertThat(ex).hasMessage(TenantDisplayNameMessages.NAME_EMPTY_AFTER_TRIM);
    }

    @Test
    @DisplayName("공백만 → 트림 후 빈 문자열 → IllegalArgumentException")
    void updateDisplayName_blankAfterTrim_throwsNameEmpty() {
        Tenant existing = activeTenant("X");
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID)).thenReturn(Optional.of(existing));

        TenantNameUpdateRequest blankRequest = TenantNameUpdateRequest.builder().name("   \t  ").build();
        IllegalArgumentException blankEx =
                assertThrows(IllegalArgumentException.class, () -> tenantService.updateTenantDisplayName(TENANT_ID, blankRequest));
        assertThat(blankEx).hasMessage(TenantDisplayNameMessages.NAME_EMPTY_AFTER_TRIM);
    }

    @Test
    @DisplayName("다른 테넌트가 동일 name 사용 → DUPLICATE_NAME_IN_USE")
    void updateDisplayName_duplicateOtherTenant_throwsDuplicate() {
        Tenant existing = activeTenant("Old");
        Tenant other = Tenant.builder()
                .tenantId("other-tenant-id")
                .name("Taken Name")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .build();
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID)).thenReturn(Optional.of(existing));
        when(tenantRepository.findByNameAndIsDeletedFalse("Taken Name")).thenReturn(Optional.of(other));

        TenantNameUpdateRequest dupRequest = TenantNameUpdateRequest.builder().name("Taken Name").build();
        IllegalArgumentException dupEx =
                assertThrows(IllegalArgumentException.class, () -> tenantService.updateTenantDisplayName(TENANT_ID, dupRequest));
        assertThat(dupEx).hasMessage(TenantDisplayNameMessages.DUPLICATE_NAME_IN_USE);
    }

    @Test
    @DisplayName("자기 자신과 동일한 name → 중복으로 실패하지 않음")
    void updateDisplayName_sameNameAsSelf_noDuplicateError() {
        String same = "My Company Name";
        Tenant existing = activeTenant(same);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID)).thenReturn(Optional.of(existing));
        when(tenantRepository.findByNameAndIsDeletedFalse(same)).thenReturn(Optional.of(existing));
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(inv -> inv.getArgument(0));

        TenantNameUpdateResponse result = tenantService.updateTenantDisplayName(
                TENANT_ID,
                TenantNameUpdateRequest.builder().name("  " + same + "  ").build());

        assertThat(result.getName()).isEqualTo(same);
        verify(tenantRepository).save(any(Tenant.class));
    }
}
