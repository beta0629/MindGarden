package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ConsultationPackageCodeConstants;
import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopPackageCompositionConstants;
import com.coresolution.consultation.dto.shop.ShopCatalogOffer;
import com.coresolution.consultation.dto.shop.ShopCatalogPackageIdentity;
import com.coresolution.consultation.dto.shop.admin.ShopCompositionCandidateListResponse;
import com.coresolution.consultation.dto.shop.admin.ShopPackageCompositionResponse;
import com.coresolution.consultation.dto.shop.admin.ShopPackageCompositionSaveRequest;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopPackageCompositionItem;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.repository.ShopPackageCompositionItemRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ShopPackageCompositionService} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ShopPackageCompositionService")
class ShopPackageCompositionServiceTest {

    private static final String TENANT = "tenant-comp";
    private static final String OTHER_TENANT = "tenant-other";
    private static final String PKG = "PKG_COMBO";
    private static final String PKG_INNER = "PKG_INNER";

    @Mock
    private ShopPackageCompositionItemRepository compositionRepository;
    @Mock
    private ShopCatalogSkuRepository skuRepository;
    @Mock
    private CommonCodeRepository commonCodeRepository;
    @Mock
    private ShopCatalogPackageOfferResolver offerResolver;

    private ShopPackageCompositionService service;
    private final List<ShopPackageCompositionItem> stored = new ArrayList<>();

    @BeforeEach
    void setUp() {
        service = new ShopPackageCompositionService(
                compositionRepository, skuRepository, commonCodeRepository, offerResolver, new ObjectMapper());
        lenient().when(offerResolver.requireIdentity(eq(TENANT), anyString())).thenAnswer(inv ->
                new ShopCatalogPackageIdentity(inv.getArgument(1), "패키지", 100_000L, 4, true, true));
        lenient().when(offerResolver.resolveLinked(eq(TENANT), any(ShopCatalogSku.class))).thenAnswer(inv ->
                ShopCatalogOffer.unlinked(inv.getArgument(1)));
        lenient().when(compositionRepository.findComposedPackageCodes(eq(TENANT), anyCollection()))
                .thenReturn(List.of());
        lenient().when(commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(
                eq(TENANT), eq(ConsultationPackageCodeConstants.CODE_GROUP), anyString()))
                .thenReturn(Optional.empty());
        lenient().when(compositionRepository.findByTenantIdAndPackageCodeOrderBySortOrderAscIdAsc(TENANT, PKG))
                .thenAnswer(inv -> stored);
        lenient().when(compositionRepository.saveAll(any())).thenAnswer(inv -> {
            stored.clear();
            for (Object o : (Iterable<?>) inv.getArgument(0)) {
                stored.add((ShopPackageCompositionItem) o);
            }
            return stored;
        });
    }

    private ShopCatalogSku sku(long id, String tenant, String code, String category, long price, int sessions) {
        ShopCatalogSku s = new ShopCatalogSku();
        s.setId(id);
        s.setTenantId(tenant);
        s.setSkuCode(code);
        s.setTitle("상품" + id);
        s.setCatalogCategory(category);
        s.setUnitPriceMinor(price);
        s.setSessionCount(sessions);
        s.setActive(true);
        s.setIsDeleted(false);
        lenient().when(skuRepository.findById(id)).thenReturn(Optional.of(s));
        return s;
    }

    private static ShopPackageCompositionSaveRequest request(Long... skuIdAndQty) {
        List<ShopPackageCompositionSaveRequest.Item> items = new ArrayList<>();
        for (int i = 0; i < skuIdAndQty.length; i += 2) {
            items.add(new ShopPackageCompositionSaveRequest.Item(
                    skuIdAndQty[i], skuIdAndQty[i + 1] == null ? null : skuIdAndQty[i + 1].intValue()));
        }
        return new ShopPackageCompositionSaveRequest(items);
    }

    @Test
    @DisplayName("저장 시 단가·회기를 복사하고 합계를 서버가 Σ(단가×수량), Σ(회기×수량)으로 계산 (실물 회기 0)")
    void save_snapshotsAndTotals() {
        sku(1L, TENANT, "CONS-1", ShopCatalogCategory.CONSULTATION, 50_000L, 2);
        sku(2L, TENANT, "GOODS-1", "GOODS", 10_000L, 1);

        ShopPackageCompositionResponse res = service.save(TENANT, PKG, request(1L, 2L, 2L, 3L));

        assertEquals(2, res.items().size());
        assertEquals(50_000L * 2 + 10_000L * 3, res.totalPriceMinor());
        assertEquals(2 * 2, res.totalSessions());
        assertEquals(0, stored.get(1).getSessionCountSnapshot());
        assertFalse(res.priceChanged());
        verify(compositionRepository).deleteByTenantAndPackageCode(TENANT, PKG);
    }

    @Test
    @DisplayName("현재가가 스냅샷과 다르면 가격 변경 표시만 하고 합계는 스냅샷 기준")
    void get_priceChangedWithoutRecalc() {
        ShopCatalogSku s = sku(1L, TENANT, "CONS-1", ShopCatalogCategory.CONSULTATION, 50_000L, 1);
        service.save(TENANT, PKG, request(1L, 1L));
        s.setUnitPriceMinor(60_000L);

        ShopPackageCompositionResponse res = service.get(TENANT, PKG);

        assertTrue(res.priceChanged());
        assertTrue(res.items().get(0).priceChanged());
        assertEquals(60_000L, res.items().get(0).currentUnitPrice());
        assertEquals(50_000L, res.totalPriceMinor());
    }

    @Test
    @DisplayName("다른 테넌트 SKU 는 400")
    void save_otherTenant_rejected() {
        sku(1L, OTHER_TENANT, "X-1", ShopCatalogCategory.CONSULTATION, 1_000L, 1);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.save(TENANT, PKG, request(1L, 1L)));
        assertEquals(ShopPackageCompositionConstants.MSG_ITEM_NOT_FOUND, ex.getMessage());
        verify(compositionRepository, never()).deleteByTenantAndPackageCode(any(), any());
    }

    @Test
    @DisplayName("비활성·삭제 SKU 는 400")
    void save_inactiveOrDeleted_rejected() {
        sku(1L, TENANT, "A", ShopCatalogCategory.CONSULTATION, 1_000L, 1).setActive(false);
        sku(2L, TENANT, "B", ShopCatalogCategory.CONSULTATION, 1_000L, 1).setIsDeleted(true);
        assertEquals(ShopPackageCompositionConstants.MSG_ITEM_INACTIVE, assertThrows(IllegalArgumentException.class,
                () -> service.save(TENANT, PKG, request(1L, 1L))).getMessage());
        assertEquals(ShopPackageCompositionConstants.MSG_ITEM_INACTIVE, assertThrows(IllegalArgumentException.class,
                () -> service.save(TENANT, PKG, request(2L, 1L))).getMessage());
    }

    @Test
    @DisplayName("OFFER_ 전용 SKU 는 400")
    void save_offerSku_rejected() {
        sku(1L, TENANT, "OFFER_ABC", ShopCatalogCategory.CONSULTATION, 1_000L, 1);
        assertEquals(ShopPackageCompositionConstants.MSG_ITEM_OFFER_SKU, assertThrows(IllegalArgumentException.class,
                () -> service.save(TENANT, PKG, request(1L, 1L))).getMessage());
    }

    @Test
    @DisplayName("자기 자신(sourcePackageCode 같음)은 400")
    void save_selfReference_rejected() {
        sku(1L, TENANT, "SELF", ShopCatalogCategory.CONSULTATION, 1_000L, 1).setSourcePackageCode(PKG);
        assertEquals(ShopPackageCompositionConstants.MSG_ITEM_SELF, assertThrows(IllegalArgumentException.class,
                () -> service.save(TENANT, PKG, request(1L, 1L))).getMessage());
    }

    @Test
    @DisplayName("이미 구성이 있는 패키지 SKU 를 담으면(중첩) 400")
    void save_nested_rejected() {
        sku(1L, TENANT, "INNER", ShopCatalogCategory.CONSULTATION, 1_000L, 1).setSourcePackageCode(PKG_INNER);
        when(compositionRepository.findComposedPackageCodes(eq(TENANT), anyCollection()))
                .thenReturn(List.of(PKG_INNER));
        assertEquals(ShopPackageCompositionConstants.MSG_ITEM_NESTED, assertThrows(IllegalArgumentException.class,
                () -> service.save(TENANT, PKG, request(1L, 1L))).getMessage());
    }

    @Test
    @DisplayName("수량 0·빈 구성·중복 항목은 400")
    void save_quantityEmptyDuplicate_rejected() {
        sku(1L, TENANT, "A", ShopCatalogCategory.CONSULTATION, 1_000L, 1);
        assertEquals(ShopPackageCompositionConstants.MSG_QUANTITY_INVALID, assertThrows(IllegalArgumentException.class,
                () -> service.save(TENANT, PKG, request(1L, 0L))).getMessage());
        assertEquals(ShopPackageCompositionConstants.MSG_ITEMS_REQUIRED, assertThrows(IllegalArgumentException.class,
                () -> service.save(TENANT, PKG, new ShopPackageCompositionSaveRequest(List.of()))).getMessage());
        assertEquals(ShopPackageCompositionConstants.MSG_ITEM_DUPLICATE, assertThrows(IllegalArgumentException.class,
                () -> service.save(TENANT, PKG, request(1L, 1L, 1L, 2L))).getMessage());
    }

    @Test
    @DisplayName("레거시 extraData.items 는 조회 시 legacy 표시, 저장 시 비운다")
    void legacyItems_flaggedThenCleared() {
        CommonCode row = new CommonCode();
        row.setCodeValue(PKG);
        row.setIsDeleted(false);
        row.setExtraData("{\"price\":100000,\"items\":[{\"code\":\"A\"},{\"code\":\"B\"}]}");
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(
                TENANT, ConsultationPackageCodeConstants.CODE_GROUP, PKG)).thenReturn(Optional.of(row));

        ShopPackageCompositionResponse before = service.get(TENANT, PKG);
        assertTrue(before.legacy());
        assertEquals(2, before.legacyItemCount());

        sku(1L, TENANT, "A", ShopCatalogCategory.CONSULTATION, 1_000L, 1);
        ShopPackageCompositionResponse after = service.save(TENANT, PKG, request(1L, 1L));

        ArgumentCaptor<CommonCode> saved = ArgumentCaptor.forClass(CommonCode.class);
        verify(commonCodeRepository).save(saved.capture());
        assertFalse(saved.getValue().getExtraData().contains("\"items\""));
        assertTrue(saved.getValue().getExtraData().contains("\"price\""));
        assertFalse(after.legacy());
    }

    @Test
    @DisplayName("후보: 활성만, OFFER_·자기 자신 제외, 검색어와 무관한 전체 수 제공")
    void candidates_filterAndTotal() {
        ShopCatalogSku a = sku(1L, TENANT, "CONS-A", ShopCatalogCategory.CONSULTATION, 50_000L, 2);
        a.setTitle("개인 상담");
        ShopCatalogSku goods = sku(2L, TENANT, "GOODS-B", "GOODS", 9_000L, 1);
        goods.setTitle("워크북");
        ShopCatalogSku offer = sku(3L, TENANT, "OFFER_X", ShopCatalogCategory.CONSULTATION, 1_000L, 1);
        ShopCatalogSku inactive = sku(4L, TENANT, "OFF-1", ShopCatalogCategory.CONSULTATION, 1_000L, 1);
        inactive.setActive(false);
        ShopCatalogSku self = sku(5L, TENANT, "SELF", ShopCatalogCategory.CONSULTATION, 1_000L, 1);
        self.setSourcePackageCode(PKG);
        when(skuRepository.findByTenantIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(TENANT))
                .thenReturn(List.of(a, goods, offer, inactive, self));

        ShopCompositionCandidateListResponse all = service.listCandidates(TENANT, null, PKG);
        assertEquals(2, all.totalActive());
        assertEquals(List.of(1L, 2L), all.items().stream().map(i -> i.skuId()).toList());
        assertEquals(0, all.items().get(1).sessionCount());
        assertEquals(50_000L, all.items().get(0).unitPriceMinor());

        ShopCompositionCandidateListResponse none = service.listCandidates(TENANT, "없는검색어", PKG);
        assertTrue(none.items().isEmpty());
        assertEquals(2, none.totalActive());
    }
}
