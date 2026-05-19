package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.core.constant.PlatformComponentCodes;
import com.coresolution.core.repository.TenantComponentRepository;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link TenantComponentActivationServiceImpl} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-19
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TenantComponentActivationService 테스트")
class TenantComponentActivationServiceImplTest {

  private static final String TENANT_ID = "tenant-uuid-001";

  @Mock
  private TenantComponentRepository tenantComponentRepository;

  @InjectMocks
  private TenantComponentActivationServiceImpl service;

  @Test
  @DisplayName("CLIENT_SHOP 활성 레코드가 있으면 true")
  void isComponentActive_whenActiveRecordExists_returnsTrue() {
    when(tenantComponentRepository.existsActiveByTenantIdAndComponentCode(
            eq(TENANT_ID), eq(PlatformComponentCodes.CLIENT_SHOP)))
        .thenReturn(true);

    assertThat(service.isComponentActive(TENANT_ID, PlatformComponentCodes.CLIENT_SHOP)).isTrue();

    verify(tenantComponentRepository)
        .existsActiveByTenantIdAndComponentCode(TENANT_ID, PlatformComponentCodes.CLIENT_SHOP);
  }

  @Test
  @DisplayName("tenantId가 비어 있으면 false")
  void isComponentActive_whenTenantIdBlank_returnsFalse() {
    assertThat(service.isComponentActive("  ", PlatformComponentCodes.CLIENT_SHOP)).isFalse();
  }

  @Test
  @DisplayName("활성 component_code 목록 조회")
  void listActiveComponentCodes_returnsRepositoryResult() {
    when(tenantComponentRepository.findActiveComponentCodesByTenantId(TENANT_ID))
        .thenReturn(List.of(PlatformComponentCodes.CLIENT_SHOP, PlatformComponentCodes.CLIENT_REWARD));

    assertThat(service.listActiveComponentCodes(TENANT_ID))
        .containsExactly(PlatformComponentCodes.CLIENT_SHOP, PlatformComponentCodes.CLIENT_REWARD);
  }
}
