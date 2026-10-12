package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ShopClientOfferConstants;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("ShopOrderableSkuService — 주문 가능 SKU 조회")
class ShopOrderableSkuServiceTest {

    private static final String TENANT = "tenant-orderable";
    private static final Long CLIENT = 7L;
    private static final Long OTHER_CLIENT = 8L;
    private static final String OFFER_CODE = ShopClientOfferConstants.SKU_CODE_PREFIX + "ABC123";

    @Mock
    private ShopCatalogSkuRepository skuRepository;
    @Mock
    private ShopClientOfferService clientOfferService;

    private ShopOrderableSkuService service;

    @BeforeEach
    void setUp() {
        service = new ShopOrderableSkuService(skuRepository, clientOfferService);
    }

    private ShopCatalogSku sku(String code, boolean visible) {
        ShopCatalogSku s = new ShopCatalogSku();
        s.setTenantId(TENANT);
        s.setSkuCode(code);
        s.setCatalogVisible(visible);
        s.setActive(true);
        when(skuRepository.findActiveByTenantAndSkuCode(TENANT, code)).thenReturn(Optional.of(s));
        return s;
    }

    @Test
    @DisplayName("몰 노출 SKU 는 누구나 주문 가능")
    void visibleSku_allowed() {
        ShopCatalogSku s = sku("GEN-1", true);
        assertEquals(s, service.findOrderableForClient(TENANT, "GEN-1", CLIENT).orElseThrow());
    }

    @Test
    @DisplayName("일반 비공개 SKU 직접 주문은 거부")
    void hiddenGeneralSku_rejected() {
        sku("GEN-HIDDEN", false);
        assertTrue(service.findOrderableForClient(TENANT, "GEN-HIDDEN", CLIENT).isEmpty());
    }

    @Test
    @DisplayName("전용 SKU 는 활성 지정된 내담자만 통과")
    void offerSku_onlyAssignedClient() {
        ShopCatalogSku s = sku(OFFER_CODE, false);
        lenient().when(clientOfferService.isActiveOfferForClient(TENANT, CLIENT, OFFER_CODE)).thenReturn(true);
        lenient().when(clientOfferService.isActiveOfferForClient(TENANT, OTHER_CLIENT, OFFER_CODE))
                .thenReturn(false);
        assertEquals(s, service.findOrderableForClient(TENANT, OFFER_CODE, CLIENT).orElseThrow());
        assertTrue(service.findOrderableForClient(TENANT, OFFER_CODE, OTHER_CLIENT).isEmpty());
    }

    @Test
    @DisplayName("지정이 취소·없는 전용 SKU 는 거부")
    void offerSku_unassigned_rejected() {
        sku(OFFER_CODE, false);
        when(clientOfferService.isActiveOfferForClient(TENANT, CLIENT, OFFER_CODE)).thenReturn(false);
        assertTrue(service.findOrderableForClient(TENANT, OFFER_CODE, CLIENT).isEmpty());
    }

    @Test
    @DisplayName("없거나 비활성 SKU 는 빈 값")
    void missingSku_empty() {
        when(skuRepository.findActiveByTenantAndSkuCode(TENANT, "NOPE")).thenReturn(Optional.empty());
        assertTrue(service.findOrderableForClient(TENANT, "NOPE", CLIENT).isEmpty());
    }
}
