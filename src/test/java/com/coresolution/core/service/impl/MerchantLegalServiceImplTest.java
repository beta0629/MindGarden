package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.core.domain.Tenant;
import com.coresolution.core.dto.MerchantLegalDto;
import com.coresolution.core.dto.MerchantLegalUpdateRequest;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.util.BusinessRegistrationNumberValidator;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * MerchantLegalServiceImpl — 검증·테넌트 격리 fail-closed.
 *
 * @author CoreSolution
 * @since 2026-09-09
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("사업자·약관 서비스")
class MerchantLegalServiceImplTest {

    private static final String TENANT_A = "tenant-a-counseling-001";
    private static final String TENANT_B = "tenant-b-counseling-001";

    @Mock
    private TenantRepository tenantRepository;

    @InjectMocks
    private MerchantLegalServiceImpl service;

    @Test
    @DisplayName("유효하지 않은 사업자번호 저장은 fail-closed")
    void save_invalidBiz_failsClosed() {
        MerchantLegalUpdateRequest req = MerchantLegalUpdateRequest.builder()
                .businessRegistrationNumber("120-81-47522")
                .representativeName("홍길동")
                .build();

        assertThatThrownBy(() -> service.saveForTenant(TENANT_A, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("사업자등록번호");
    }

    @Test
    @DisplayName("존재하지 않는 테넌트 조회는 fail-closed")
    void get_missingTenant_failsClosed() {
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_B)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getForTenant(TENANT_B))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("테넌트를 찾을 수 없습니다");
    }

    @Test
    @DisplayName("저장 시 해당 tenantId 레코드만 갱신")
    void save_updatesOnlyRequestedTenant() {
        Tenant tenant = Tenant.builder()
                .tenantId(TENANT_A)
                .name("테스트센터")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .build();
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_A)).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(inv -> inv.getArgument(0));

        MerchantLegalUpdateRequest req = MerchantLegalUpdateRequest.builder()
                .businessRegistrationNumber("120-81-47521")
                .representativeName("김대표")
                .businessLandline("02-123-4567")
                .businessAddress("서울시 테스트구")
                .mailOrderReportNumber("")
                .refundPolicyText("환불 안내")
                .productPriceGuideText("가격 안내")
                .build();

        MerchantLegalDto dto = service.saveForTenant(TENANT_A, req);

        ArgumentCaptor<Tenant> captor = ArgumentCaptor.forClass(Tenant.class);
        verify(tenantRepository).save(captor.capture());
        assertThat(captor.getValue().getTenantId()).isEqualTo(TENANT_A);
        assertThat(captor.getValue().getBusinessRegistrationNumber())
                .isEqualTo(BusinessRegistrationNumberValidator.formatForDisplay("1208147521"));
        assertThat(dto.getRegistrationStatusLabel()).isEqualTo("등록");
        assertThat(dto.getMailOrderStatusLabel()).isEqualTo("미등록");
        assertThat(dto.getSitePublicStatusLabel()).isEqualTo("공개");
    }
}
