package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ConsultationPackageCodeConstants;
import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopCatalogSkuConstants;
import com.coresolution.consultation.dto.shop.ShopCatalogOffer;
import com.coresolution.consultation.dto.shop.ShopCatalogPackageIdentity;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 패키지 요금 → 온라인 판매 조건.
 *
 * @author MindGarden
 * @since 2026-09-24
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ShopCatalogPackageOfferResolver")
class ShopCatalogPackageOfferResolverTest {

    private static final String TENANT = "tenant-fee-link";

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @Test
    @DisplayName("연결된 SKU 단가·회기·이름은 요금 행을 따른다")
    void resolveLinked_usesFeePriceAndName() {
        CommonCode code = packageCode(true, "{\"sessions\":10,\"price\":150000}");
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(
                TENANT, ConsultationPackageCodeConstants.CODE_GROUP, "PACKAGE_001"))
                .thenReturn(Optional.of(code));
        ShopCatalogPackageOfferResolver resolver =
                new ShopCatalogPackageOfferResolver(commonCodeRepository, new ObjectMapper());
        ShopCatalogSku sku = new ShopCatalogSku();
        sku.setTenantId(TENANT);
        sku.setTitle("직접 입력한 이름");
        sku.setUnitPriceMinor(1L);
        sku.setSessionCount(1);
        sku.setSourcePackageCode("PACKAGE_001");

        ShopCatalogOffer offer = resolver.resolveLinked(TENANT, sku);

        assertTrue(offer.linked());
        assertTrue(offer.sellable());
        assertEquals("10회기", offer.title());
        assertEquals(150000L, offer.unitPriceMinor());
        assertEquals(10, offer.sessionCount());
    }

    @Test
    @DisplayName("사용 중지 패키지는 판매하지 않는다")
    void resolveLinked_inactivePackage_notSellable() {
        CommonCode code = packageCode(false, "{\"sessions\":10,\"price\":150000}");
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(
                TENANT, ConsultationPackageCodeConstants.CODE_GROUP, "PACKAGE_001"))
                .thenReturn(Optional.of(code));
        ShopCatalogPackageOfferResolver resolver =
                new ShopCatalogPackageOfferResolver(commonCodeRepository, new ObjectMapper());
        ShopCatalogSku sku = new ShopCatalogSku();
        sku.setSourcePackageCode("PACKAGE_001");
        sku.setTitle("10회기");
        sku.setUnitPriceMinor(150000L);
        sku.setSessionCount(10);

        ShopCatalogOffer offer = resolver.resolveLinked(TENANT, sku);

        assertTrue(offer.linked());
        assertFalse(offer.sellable());
    }

    @Test
    @DisplayName("tenantId 없이 요금 목록을 조회하지 않는다")
    void listActivePackages_requiresTenantId() {
        ShopCatalogPackageOfferResolver resolver =
                new ShopCatalogPackageOfferResolver(commonCodeRepository, new ObjectMapper());
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> resolver.listActivePackages(" "));
        assertEquals("tenantId가 필요합니다.", ex.getMessage());
    }

    @Test
    @DisplayName("활성 요금 행만 목록에 담고 단가를 파싱한다")
    void listActivePackages_readsFeeRows() {
        when(commonCodeRepository.findTenantCodesByGroup(
                TENANT, ConsultationPackageCodeConstants.CODE_GROUP))
                .thenReturn(List.of(packageCode(true, "{\"sessions\":4,\"price\":80000}")));
        ShopCatalogPackageOfferResolver resolver =
                new ShopCatalogPackageOfferResolver(commonCodeRepository, new ObjectMapper());

        List<ShopCatalogPackageIdentity> rows = resolver.listActivePackages(TENANT);

        assertEquals(1, rows.size());
        assertEquals("PACKAGE_001", rows.get(0).packageCode());
        assertEquals(80000L, rows.get(0).unitPriceMinor());
        assertEquals(4, rows.get(0).sessionCount());
        assertTrue(rows.get(0).priceReady());
    }

    @Test
    @DisplayName("패키지 코드 형식이 아니면 거절한다")
    void requirePackageCode_rejectsInvalid() {
        ShopCatalogPackageOfferResolver resolver =
                new ShopCatalogPackageOfferResolver(commonCodeRepository, new ObjectMapper());
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> resolver.requirePackageCode("가격 패키지"));
        assertEquals(ShopCatalogSkuConstants.PACKAGE_CODE_INVALID_MESSAGE, ex.getMessage());
    }

    @Test
    @DisplayName("extraData.category ASSESSMENT 를 identity 에 담는다")
    void toIdentity_parsesAssessmentCategory() {
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(
                TENANT, ConsultationPackageCodeConstants.CODE_GROUP, "PACKAGE_001"))
                .thenReturn(Optional.of(packageCode(
                        true, "{\"sessions\":1,\"price\":20000,\"category\":\"assessment\"}")));
        ShopCatalogPackageOfferResolver resolver =
                new ShopCatalogPackageOfferResolver(commonCodeRepository, new ObjectMapper());

        ShopCatalogPackageIdentity identity = resolver.requireIdentity(TENANT, "PACKAGE_001");

        assertEquals(ShopCatalogCategory.ASSESSMENT, identity.catalogCategory());
        assertTrue(identity.priceReady());
    }

    @Test
    @DisplayName("ASSESSMENT sessions=0 → identity.sessionCount=0, priceReady true")
    void toIdentity_assessmentZeroSessions_priceReady() {
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(
                TENANT, ConsultationPackageCodeConstants.CODE_GROUP, "PACKAGE_001"))
                .thenReturn(Optional.of(packageCode(
                        true, "{\"sessions\":0,\"price\":20000,\"category\":\"ASSESSMENT\"}")));
        ShopCatalogPackageOfferResolver resolver =
                new ShopCatalogPackageOfferResolver(commonCodeRepository, new ObjectMapper());

        ShopCatalogPackageIdentity identity = resolver.requireIdentity(TENANT, "PACKAGE_001");

        assertEquals(ShopCatalogCategory.ASSESSMENT, identity.catalogCategory());
        assertEquals(0, identity.sessionCount());
        assertTrue(identity.priceReady());
    }

    @Test
    @DisplayName("CONSULTATION sessions=0 → sessionCount null, priceReady false")
    void toIdentity_consultationZeroSessions_notReady() {
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(
                TENANT, ConsultationPackageCodeConstants.CODE_GROUP, "PACKAGE_001"))
                .thenReturn(Optional.of(packageCode(
                        true, "{\"sessions\":0,\"price\":20000,\"category\":\"CONSULTATION\"}")));
        ShopCatalogPackageOfferResolver resolver =
                new ShopCatalogPackageOfferResolver(commonCodeRepository, new ObjectMapper());

        ShopCatalogPackageIdentity identity = resolver.requireIdentity(TENANT, "PACKAGE_001");

        assertEquals(ShopCatalogCategory.CONSULTATION, identity.catalogCategory());
        assertNull(identity.sessionCount());
        assertFalse(identity.priceReady());
    }

    @Test
    @DisplayName("unlinked ASSESSMENT SKU sessionCount=0 을 유지한다")
    void unlinked_assessmentZeroSessions_keepsZero() {
        ShopCatalogSku sku = new ShopCatalogSku();
        sku.setTitle("심리검사");
        sku.setUnitPriceMinor(20000L);
        sku.setSessionCount(0);
        sku.setCatalogCategory(ShopCatalogCategory.ASSESSMENT);

        ShopCatalogOffer offer = ShopCatalogOffer.unlinked(sku);

        assertFalse(offer.linked());
        assertTrue(offer.sellable());
        assertEquals(0, offer.sessionCount());
        assertEquals(20000L, offer.unitPriceMinor());
    }

    @Test
    @DisplayName("extraData.category CONSULTATION 을 identity 에 담는다")
    void toIdentity_parsesConsultationCategory() {
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(
                TENANT, ConsultationPackageCodeConstants.CODE_GROUP, "PACKAGE_001"))
                .thenReturn(Optional.of(packageCode(
                        true, "{\"sessions\":4,\"price\":80000,\"category\":\"CONSULTATION\"}")));
        ShopCatalogPackageOfferResolver resolver =
                new ShopCatalogPackageOfferResolver(commonCodeRepository, new ObjectMapper());

        ShopCatalogPackageIdentity identity = resolver.requireIdentity(TENANT, "PACKAGE_001");

        assertEquals(ShopCatalogCategory.CONSULTATION, identity.catalogCategory());
    }

    @Test
    @DisplayName("extraData.category 없거나 무효면 null (이름·코드 추론 없음)")
    void toIdentity_invalidOrMissingCategory_isNullWithoutNameInference() {
        when(commonCodeRepository.findTenantCodesByGroup(
                TENANT, ConsultationPackageCodeConstants.CODE_GROUP))
                .thenReturn(List.of(
                        packageCodeWithValue(
                                "PACKAGE_EXAM", "심리검사 패키지", true,
                                "{\"sessions\":1,\"price\":20000}"),
                        packageCodeWithValue(
                                "PACKAGE_BAD", "검사", true,
                                "{\"sessions\":1,\"price\":20000,\"category\":\"EXAM\"}")));
        ShopCatalogPackageOfferResolver resolver =
                new ShopCatalogPackageOfferResolver(commonCodeRepository, new ObjectMapper());

        List<ShopCatalogPackageIdentity> rows = resolver.listActivePackages(TENANT);

        assertEquals(2, rows.size());
        assertNull(rows.get(0).catalogCategory());
        assertNull(rows.get(1).catalogCategory());
    }

    private static CommonCode packageCode(boolean active, String extraData) {
        return packageCodeWithValue("PACKAGE_001", "10회기", active, extraData);
    }

    private static CommonCode packageCodeWithValue(
            String codeValue, String koreanName, boolean active, String extraData) {
        CommonCode code = CommonCode.builder()
                .codeGroup(ConsultationPackageCodeConstants.CODE_GROUP)
                .codeValue(codeValue)
                .codeLabel(koreanName)
                .koreanName(koreanName)
                .isActive(active)
                .extraData(extraData)
                .build();
        code.setTenantId(TENANT);
        code.setIsDeleted(false);
        return code;
    }
}
