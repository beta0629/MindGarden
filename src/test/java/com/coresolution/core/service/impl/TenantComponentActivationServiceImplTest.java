package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.core.constant.PlatformComponentCodes;
import com.coresolution.core.domain.ComponentCatalog;
import com.coresolution.core.domain.TenantComponent;
import com.coresolution.core.repository.ComponentCatalogRepository;
import com.coresolution.core.repository.TenantComponentRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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

  @Mock
  private ComponentCatalogRepository componentCatalogRepository;

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

  @Test
  @DisplayName("Shop·Reward 번들 — 미활성 컴포넌트만 INSERT")
  void activateShopRewardBundle_insertsOnlyMissingComponents() {
    ComponentCatalog shopCatalog = ComponentCatalog.builder()
        .componentId("comp-shop")
        .componentCode(PlatformComponentCodes.CLIENT_SHOP)
        .isActive(true)
        .build();
    when(componentCatalogRepository.findByComponentCodeAndIsDeletedFalse(PlatformComponentCodes.CLIENT_SHOP))
        .thenReturn(Optional.of(shopCatalog));
    when(componentCatalogRepository.findByComponentCodeAndIsDeletedFalse(PlatformComponentCodes.CLIENT_REWARD))
        .thenReturn(Optional.empty());
    when(componentCatalogRepository.findByComponentCodeAndIsDeletedFalse(PlatformComponentCodes.ADMIN_SHOP_CATALOG))
        .thenReturn(Optional.empty());
    when(tenantComponentRepository.existsNonDeletedByTenantIdAndComponentId(TENANT_ID, "comp-shop"))
        .thenReturn(false);

    var result = service.activateShopRewardBundle(TENANT_ID, "ops-test");

    assertThat(result.getActivatedCount()).isEqualTo(1);
    assertThat(result.getActivatedComponentCodes()).containsExactly(PlatformComponentCodes.CLIENT_SHOP);

    ArgumentCaptor<TenantComponent> captor = ArgumentCaptor.forClass(TenantComponent.class);
    verify(tenantComponentRepository).save(captor.capture());
    assertThat(captor.getValue().getTenantId()).isEqualTo(TENANT_ID);
    assertThat(captor.getValue().getComponentId()).isEqualTo("comp-shop");
    assertThat(captor.getValue().isActive()).isTrue();
  }

  @Test
  @DisplayName("Shop·Reward 번들 — tenantId 비어 있으면 예외")
  void activateShopRewardBundle_whenTenantIdBlank_throws() {
    org.junit.jupiter.api.Assertions.assertThrows(
        IllegalArgumentException.class,
        () -> service.activateShopRewardBundle("  ", "ops-test"));
  }
}
