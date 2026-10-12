package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopClientOfferConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.shop.offer.ShopClientOfferCreateRequest;
import com.coresolution.consultation.dto.shop.offer.ShopClientOfferResponse;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopClientOffer;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.repository.ShopClientOfferPaidLookupRepository;
import com.coresolution.consultation.repository.ShopClientOfferRepository;
import com.coresolution.consultation.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("ShopClientOfferService — 서버 금액 확정·본인·기록")
class ShopClientOfferServiceTest {

    private static final String TENANT = "tenant-offer";
    private static final Long CLIENT = 7L;
    private static final Long ADMIN = 1L;

    @Mock
    private ShopClientOfferRepository offerRepository;
    @Mock
    private ShopClientOfferPaidLookupRepository paidLookupRepository;
    @Mock
    private ShopCatalogSkuRepository skuRepository;
    @Mock
    private ShopCatalogPackageOfferResolver packageOfferResolver;
    @Mock
    private ClientShopCatalogService clientShopCatalogService;
    @Mock
    private ClientShopConsultantMappingService consultantMappingService;
    @Mock
    private UserRepository userRepository;

    private ShopClientOfferService service;

    @BeforeEach
    void setUp() {
        service = new ShopClientOfferService(offerRepository, paidLookupRepository, skuRepository,
                packageOfferResolver, clientShopCatalogService, consultantMappingService, userRepository);
    }

    private static User client() {
        User u = new User();
        u.setId(CLIENT);
        u.setTenantId(TENANT);
        u.setRole(UserRole.CLIENT);
        return u;
    }

    private static ShopCatalogSku source(String category) {
        ShopCatalogSku s = new ShopCatalogSku();
        s.setId(5L);
        s.setTenantId(TENANT);
        s.setSkuCode("SRC-1");
        s.setTitle("기본 10회기");
        s.setUnitPriceMinor(100000L);
        s.setSessionCount(10);
        s.setCatalogVisible(true);
        s.setActive(true);
        s.setCatalogCategory(category);
        s.setFieldCode("GENERAL");
        s.setConsultantId(9L);
        s.setSourcePackageCode(null);
        return s;
    }

    private void stubBase(ShopCatalogSku src) {
        when(userRepository.findByTenantIdAndId(TENANT, CLIENT)).thenReturn(Optional.of(client()));
        when(skuRepository.findActiveByTenantAndSkuCode(TENANT, "SRC-1")).thenReturn(Optional.of(src));
    }

    @Test
    @DisplayName("생성 — 서버가 원가에서 최종가를 계산하고 숨김 SKU·기록을 남긴다")
    void create_serverConfirmsPrice() {
        ShopCatalogSku src = source(ShopCatalogCategory.CONSULTATION);
        stubBase(src);
        when(skuRepository.save(any(ShopCatalogSku.class))).thenAnswer(i -> i.getArgument(0));
        when(offerRepository.save(any(ShopClientOffer.class))).thenAnswer(i -> i.getArgument(0));
        when(consultantMappingService.listActiveMappings(TENANT, CLIENT)).thenReturn(List.of());
        when(clientShopCatalogService.isVisibleForClientMappings(any(), any(), anyList())).thenReturn(true);

        ShopClientOfferResponse res = service.create(TENANT, ADMIN, new ShopClientOfferCreateRequest(
                CLIENT, "SRC-1", ShopClientOfferConstants.DISCOUNT_TYPE_RATE, 20L));

        assertEquals(100000L, res.originalPriceMinor());
        assertEquals(80000L, res.finalPriceMinor());
        assertTrue(res.offerSkuCode().startsWith(ShopClientOfferConstants.SKU_CODE_PREFIX));
        ArgumentCaptor<ShopCatalogSku> sku = ArgumentCaptor.forClass(ShopCatalogSku.class);
        verify(skuRepository).save(sku.capture());
        assertEquals(80000L, sku.getValue().getUnitPriceMinor());
        assertFalse(sku.getValue().getCatalogVisible());
        assertEquals(null, sku.getValue().getSourcePackageCode());
        assertEquals(9L, sku.getValue().getConsultantId());
        ArgumentCaptor<ShopClientOffer> row = ArgumentCaptor.forClass(ShopClientOffer.class);
        verify(offerRepository).save(row.capture());
        assertEquals(ADMIN, row.getValue().getCreatedByUserId());
        assertEquals(ShopClientOfferConstants.DISCOUNT_TYPE_RATE, row.getValue().getDiscountType());
        assertEquals(20L, row.getValue().getDiscountValue());
    }

    @Test
    @DisplayName("생성 — 내담자 배정과 맞지 않으면 저장하지 않는다")
    void create_notEligible() {
        ShopCatalogSku src = source(ShopCatalogCategory.CONSULTATION);
        stubBase(src);
        when(consultantMappingService.listActiveMappings(TENANT, CLIENT)).thenReturn(List.of());
        when(clientShopCatalogService.isVisibleForClientMappings(any(), any(), anyList())).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.create(TENANT, ADMIN, new ShopClientOfferCreateRequest(
                        CLIENT, "SRC-1", ShopClientOfferConstants.DISCOUNT_TYPE_AMOUNT, 1000L)));
        assertEquals(ShopClientOfferConstants.MSG_CLIENT_NOT_ELIGIBLE, ex.getMessage());
        verify(skuRepository, never()).save(any(ShopCatalogSku.class));
        verify(offerRepository, never()).save(any(ShopClientOffer.class));
    }

    @Test
    @DisplayName("생성 — 다른 테넌트·내담자 아님이면 거부")
    void create_clientNotFound() {
        when(userRepository.findByTenantIdAndId(TENANT, CLIENT)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class,
                () -> service.create(TENANT, ADMIN, new ShopClientOfferCreateRequest(
                        CLIENT, "SRC-1", ShopClientOfferConstants.DISCOUNT_TYPE_AMOUNT, 1000L)));
        verify(offerRepository, never()).save(any(ShopClientOffer.class));
    }

    @Test
    @DisplayName("내담자 목록 — 본인 지정만 조회한다(내담자 ID 로만 조회)")
    void listForClient_scopedToClient() {
        when(offerRepository.findByTenantIdAndClientIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                TENANT, CLIENT, ShopClientOfferConstants.STATUS_ACTIVE)).thenReturn(List.of());
        assertTrue(service.listForClient(TENANT, CLIENT, true).isEmpty());
        verify(offerRepository, never()).findByTenantIdAndClientIdAndIsDeletedFalseOrderByIdDesc(any(), any());
    }
}
