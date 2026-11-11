package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ShopCatalogSkuConstants;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuEventPriceItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuEventPriceUpsertRequest;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopCatalogSkuEventPrice;
import com.coresolution.consultation.exception.ShopCatalogSkuEventPriceConflictException;
import com.coresolution.consultation.repository.ShopCatalogSkuEventPriceRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import java.time.LocalDate;
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
 * {@link AdminShopCatalogSkuEventPriceServiceImpl} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminShopCatalogSkuEventPriceServiceImpl")
class AdminShopCatalogSkuEventPriceServiceImplTest {

    private static final String TENANT = "tenant-event-price";
    private static final Long SKU_ID = 11L;

    @Mock
    private ShopCatalogSkuRepository shopCatalogSkuRepository;

    @Mock
    private ShopCatalogSkuEventPriceRepository shopCatalogSkuEventPriceRepository;

    @InjectMocks
    private AdminShopCatalogSkuEventPriceServiceImpl service;

    @Test
    @DisplayName("create — 겹치는 기간이면 409 충돌 예외")
    void create_overlappingPeriod_throwsConflict() {
        when(shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(SKU_ID, TENANT))
                .thenReturn(Optional.of(sku(60000L)));
        when(shopCatalogSkuEventPriceRepository.findOverlappingPeriods(
                eq(TENANT), eq(SKU_ID),
                eq(LocalDate.of(2026, 11, 15)), eq(LocalDate.of(2026, 12, 10)),
                isNull()))
                .thenReturn(List.of(existing(1L, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30))));

        ShopCatalogSkuEventPriceConflictException ex = assertThrows(
                ShopCatalogSkuEventPriceConflictException.class,
                () -> service.create(TENANT, SKU_ID, new ShopCatalogSkuEventPriceUpsertRequest(
                        45000L, LocalDate.of(2026, 11, 15), LocalDate.of(2026, 12, 10))));
        assertEquals(ShopCatalogSkuConstants.EVENT_PRICE_PERIOD_OVERLAP_MESSAGE, ex.getMessage());
        assertEquals(ShopCatalogSkuEventPriceConflictException.ERROR_CODE,
                ShopCatalogSkuEventPriceConflictException.ERROR_CODE);
        verify(shopCatalogSkuEventPriceRepository, never()).save(any());
    }

    @Test
    @DisplayName("create — 인접 기간(종료 D, 다음 시작 D+1)은 허용")
    void create_adjacentPeriods_allowed() {
        when(shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(SKU_ID, TENANT))
                .thenReturn(Optional.of(sku(60000L)));
        when(shopCatalogSkuEventPriceRepository.findOverlappingPeriods(
                eq(TENANT), eq(SKU_ID),
                eq(LocalDate.of(2026, 12, 1)), eq(LocalDate.of(2026, 12, 31)),
                isNull()))
                .thenReturn(List.of());
        when(shopCatalogSkuEventPriceRepository.save(any(ShopCatalogSkuEventPrice.class)))
                .thenAnswer(inv -> {
                    ShopCatalogSkuEventPrice row = inv.getArgument(0);
                    row.setId(3L);
                    return row;
                });

        ShopCatalogSkuEventPriceItem item = service.create(
                TENANT,
                SKU_ID,
                new ShopCatalogSkuEventPriceUpsertRequest(
                        40000L, LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 31)));

        assertEquals(3L, item.id());
        assertEquals(40000L, item.eventPriceMinor());
        ArgumentCaptor<ShopCatalogSkuEventPrice> captor = ArgumentCaptor.forClass(ShopCatalogSkuEventPrice.class);
        verify(shopCatalogSkuEventPriceRepository).save(captor.capture());
        assertEquals(TENANT, captor.getValue().getTenantId());
        assertEquals(SKU_ID, captor.getValue().getSkuId());
    }

    @Test
    @DisplayName("create — 같은 날 맞닿음(종료 D, 다음 시작 D)은 겹침")
    void create_sameDayTouch_isOverlap() {
        when(shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(SKU_ID, TENANT))
                .thenReturn(Optional.of(sku(60000L)));
        when(shopCatalogSkuEventPriceRepository.findOverlappingPeriods(
                eq(TENANT), eq(SKU_ID),
                eq(LocalDate.of(2026, 11, 30)), eq(LocalDate.of(2026, 12, 31)),
                isNull()))
                .thenReturn(List.of(existing(1L, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30))));

        assertThrows(ShopCatalogSkuEventPriceConflictException.class,
                () -> service.create(TENANT, SKU_ID, new ShopCatalogSkuEventPriceUpsertRequest(
                        45000L, LocalDate.of(2026, 11, 30), LocalDate.of(2026, 12, 31))));
    }

    @Test
    @DisplayName("create — 이벤트 가격이 정상가 이상이면 400")
    void create_eventPriceNotLessThanUnit_throws() {
        when(shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(SKU_ID, TENANT))
                .thenReturn(Optional.of(sku(60000L)));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.create(TENANT, SKU_ID, new ShopCatalogSkuEventPriceUpsertRequest(
                        60000L, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30))));
        assertEquals(ShopCatalogSkuConstants.EVENT_PRICE_MUST_BE_LESS_THAN_PRICE_MESSAGE, ex.getMessage());
        verify(shopCatalogSkuEventPriceRepository, never()).findOverlappingPeriods(
                any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("create — 시작일 > 종료일이면 400")
    void create_startAfterEnd_throws() {
        when(shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(SKU_ID, TENANT))
                .thenReturn(Optional.of(sku(60000L)));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.create(TENANT, SKU_ID, new ShopCatalogSkuEventPriceUpsertRequest(
                        45000L, LocalDate.of(2026, 12, 31), LocalDate.of(2026, 11, 1))));
        assertEquals(ShopCatalogSkuConstants.EVENT_DATE_RANGE_INVALID_MESSAGE, ex.getMessage());
    }

    @Test
    @DisplayName("softDelete — 테넌트·SKU 스코프 행만 삭제")
    void softDelete_marksDeleted() {
        when(shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(SKU_ID, TENANT))
                .thenReturn(Optional.of(sku(60000L)));
        ShopCatalogSkuEventPrice row = existing(5L, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30));
        when(shopCatalogSkuEventPriceRepository.findByIdAndTenantIdAndSkuIdAndIsDeletedFalse(5L, TENANT, SKU_ID))
                .thenReturn(Optional.of(row));
        when(shopCatalogSkuEventPriceRepository.save(any(ShopCatalogSkuEventPrice.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.softDelete(TENANT, SKU_ID, 5L);

        ArgumentCaptor<ShopCatalogSkuEventPrice> captor = ArgumentCaptor.forClass(ShopCatalogSkuEventPrice.class);
        verify(shopCatalogSkuEventPriceRepository).save(captor.capture());
        assertTrue(Boolean.TRUE.equals(captor.getValue().getIsDeleted()));
    }

    private static ShopCatalogSku sku(long unitPriceMinor) {
        ShopCatalogSku row = new ShopCatalogSku();
        row.setId(SKU_ID);
        row.setTenantId(TENANT);
        row.setSkuCode("SKU-1");
        row.setTitle("상품");
        row.setUnitPriceMinor(unitPriceMinor);
        return row;
    }

    private static ShopCatalogSkuEventPrice existing(Long id, LocalDate start, LocalDate end) {
        ShopCatalogSkuEventPrice row = new ShopCatalogSkuEventPrice();
        row.setId(id);
        row.setTenantId(TENANT);
        row.setSkuId(SKU_ID);
        row.setEventPriceMinor(45000L);
        row.setStartDate(start);
        row.setEndDate(end);
        row.setIsDeleted(false);
        return row;
    }
}
