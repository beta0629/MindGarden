package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.PublicCounselingServiceGuideKeys;
import com.coresolution.consultation.dto.publicguide.PublicCounselingServiceGuideView;
import com.coresolution.consultation.dto.shop.ShopCatalogSkuResponse;
import com.coresolution.consultation.entity.SystemConfig;
import com.coresolution.consultation.repository.SystemConfigRepository;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.service.PlatformLegalCopyService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 공개 상담 서비스 안내. system_config 만 읽고 스키마는 바꾸지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-01
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PublicCounselingServiceGuideService")
class PublicCounselingServiceGuideServiceTest {

    @Mock
    private SystemConfigRepository systemConfigRepository;

    @Mock
    private ClientShopCatalogService clientShopCatalogService;

    private PublicCounselingServiceGuideService service;

    @BeforeEach
    void setUp() {
        service = new PublicCounselingServiceGuideService(
                systemConfigRepository,
                clientShopCatalogService,
                new ObjectMapper());
    }

    @Test
    @DisplayName("설정이 없으면 한 줄 폴백·빈 종류·빈 자격·문의 환불")
    void emptyConfigUsesFallbacks() {
        Tenant tenant = Tenant.builder().tenantId("t1").name("마음센터").build();
        when(clientShopCatalogService.listVisibleSkus(eq("t1"))).thenReturn(List.of());

        PublicCounselingServiceGuideView view = service.load(tenant, "");

        assertThat(view.getOneLiner()).contains("마음센터");
        assertThat(view.getTypes()).isEmpty();
        assertThat(view.getCounselors()).isEmpty();
        assertThat(view.getRefundBody()).contains("문의해 주세요");
        assertThat(view.getPaymentNote())
                .isEqualTo(PlatformLegalCopyService.CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE);
        assertThat(view.getPaymentNote()).doesNotContain("일시불만");
        assertThat(PublicCounselingServiceGuideService.showCenter(view)).isTrue();
    }

    @Test
    @DisplayName("system_config JSON 으로 종류·자격을 읽고 암호화 값은 건너뛴다")
    void readsTypesAndSkipsEncryptedOneLiner() {
        Tenant tenant = Tenant.builder()
                .tenantId("t1")
                .name("마음센터")
                .businessLandline("02-000-0000")
                .refundPolicyText("첫째 문장입니다. 둘째 문장이에요. 셋째는 버려요.")
                .build();
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(eq("t1"), anyString()))
                .thenAnswer(invocation -> {
                    String key = invocation.getArgument(1);
                    if (PublicCounselingServiceGuideKeys.ONE_LINER.equals(key)) {
                        return Optional.of(SystemConfig.builder()
                                .configValue("비밀 한 줄")
                                .isEncrypted(true)
                                .build());
                    }
                    if (PublicCounselingServiceGuideKeys.TYPES.equals(key)) {
                        return Optional.of(SystemConfig.builder()
                                .configValue("[{\"name\":\"개인상담\",\"audience\":\"성인\","
                                        + "\"modality\":\"비대면\",\"minutes\":50}]")
                                .isEncrypted(false)
                                .build());
                    }
                    if (PublicCounselingServiceGuideKeys.QUALIFICATIONS.equals(key)) {
                        return Optional.of(SystemConfig.builder()
                                .configValue("[{\"name\":\"김상담\",\"lines\":[\"임상심리사 · 기관\"]}]")
                                .isEncrypted(false)
                                .build());
                    }
                    return Optional.empty();
                });
        when(clientShopCatalogService.listVisibleSkus(eq("t1"))).thenReturn(List.of(
                ShopCatalogSkuResponse.builder()
                        .skuCode("PKG10")
                        .title("10회 패키지")
                        .unitPriceMinor(100000L)
                        .sessionCount(10)
                        .validityMonths(3)
                        .build(),
                ShopCatalogSkuResponse.builder()
                        .skuCode("SHOP-20260929-001")
                        .title("1000원_테스트")
                        .unitPriceMinor(1000L)
                        .sessionCount(1)
                        .build()));

        PublicCounselingServiceGuideView view = service.load(tenant, "https://example.test/services");

        assertThat(view.getOneLiner()).doesNotContain("비밀 한 줄");
        assertThat(view.getTypes()).hasSize(1);
        assertThat(view.getTypes().get(0).getName()).isEqualTo("개인상담");
        assertThat(view.getCounselors()).hasSize(1);
        assertThat(view.getProducts()).hasSize(1);
        assertThat(view.getProducts().get(0).getName()).isEqualTo("10회 패키지");
        assertThat(view.getProducts().get(0).getValidityMonths()).isEqualTo(3);
        assertThat(view.getProducts())
                .extracting(row -> row.getName())
                .doesNotContain("1000원_테스트");
        assertThat(view.getRefundBody()).isEqualTo("첫째 문장입니다. 둘째 문장이에요.");
        assertThat(PublicCounselingServiceGuideService.sharedMinutes(view.getTypes())).isEqualTo(50);
    }

    @Test
    @DisplayName("환불 조항은 앞 두 문장만")
    void firstSentencesKeepsTwo() {
        assertThat(PublicCounselingServiceGuideService.firstSentences(
                "가입니다. 나예요. 다입니다.", 2))
                .isEqualTo("가입니다. 나예요.");
    }
}
