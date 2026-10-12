package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ConsultationPackageCodeConstants;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.exception.CommonCodeInUseException;
import com.coresolution.consultation.repository.ConsultationPackageUsageRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.repository.ShopClientOfferRepository;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CommonCodeDeletionGuardTest {

    private static final String TENANT = "t1";

    @Mock
    private ShopCatalogSkuRepository skuRepository;
    @Mock
    private ConsultationPackageUsageRepository usageRepository;
    @Mock
    private ShopClientOfferRepository clientOfferRepository;
    @InjectMocks
    private CommonCodeDeletionGuard guard;

    private static CommonCode packageCode() {
        CommonCode c = new CommonCode();
        c.setCodeGroup(ConsultationPackageCodeConstants.CODE_GROUP);
        c.setCodeValue("PACKAGE001");
        c.setCodeLabel("10회기 패키지");
        return c;
    }

    private void stubSku() {
        ShopCatalogSku sku = new ShopCatalogSku();
        sku.setSkuCode("SKU-1");
        sku.setTitle("10회기 패키지");
        when(skuRepository.findByTenantIdAndSourcePackageCodeAndIsDeletedFalseOrderByIdAsc(TENANT, "PACKAGE001"))
                .thenReturn(List.of(sku));
    }

    @Test
    @DisplayName("주문·결제 이력이 있으면 409 예외")
    void blockedByOrders() {
        stubSku();
        when(usageRepository.countOrderLinesBySkuCodes(eq(TENANT), argThat(c -> c.contains("SKU-1")))).thenReturn(2L);
        CommonCodeInUseException ex = assertThrows(CommonCodeInUseException.class,
                () -> guard.assertDeletable(TENANT, packageCode()));
        assertEquals(ConsultationPackageCodeConstants.MSG_DELETE_BLOCKED_BY_ORDERS, ex.getMessage());
    }

    @Test
    @DisplayName("회기(매칭) 이력이 있으면 409 예외")
    void blockedBySessions() {
        stubSku();
        when(usageRepository.countOrderLinesBySkuCodes(eq(TENANT), anyCollection())).thenReturn(0L);
        when(usageRepository.countMappingsByPackageNames(eq(TENANT), argThat(c -> c.contains("10회기 패키지"))))
                .thenReturn(1L);
        CommonCodeInUseException ex = assertThrows(CommonCodeInUseException.class,
                () -> guard.assertDeletable(TENANT, packageCode()));
        assertEquals(ConsultationPackageCodeConstants.MSG_DELETE_BLOCKED_BY_SESSIONS, ex.getMessage());
    }

    @Test
    @DisplayName("이력이 없으면 통과")
    void allowedWithoutHistory() {
        when(skuRepository.findByTenantIdAndSourcePackageCodeAndIsDeletedFalseOrderByIdAsc(TENANT, "PACKAGE001"))
                .thenReturn(List.of());
        when(usageRepository.countMappingsByPackageNames(eq(TENANT), anyCollection())).thenReturn(0L);
        assertDoesNotThrow(() -> guard.assertDeletable(TENANT, packageCode()));
    }

    @Test
    @DisplayName("상품이 아닌 공통코드는 검사하지 않는다")
    void otherGroupsSkipped() {
        CommonCode c = new CommonCode();
        c.setCodeGroup("OTHER_GROUP");
        assertDoesNotThrow(() -> guard.assertDeletable(TENANT, c));
        verifyNoInteractions(skuRepository, usageRepository);
    }

    @Test
    @DisplayName("지정(OFFER_) SKU 로 들어온 주문도 원본 상품의 이력으로 보고 409")
    void blockedByClientOfferOrders() {
        stubSku();
        when(clientOfferRepository.findOfferSkuCodesBySourceSkuCodes(eq(TENANT), argThat(c -> c.contains("SKU-1"))))
                .thenReturn(List.of("OFFER_ABC"));
        ShopCatalogSku offerSku = new ShopCatalogSku();
        offerSku.setSkuCode("OFFER_ABC");
        offerSku.setTitle("10회기 패키지 (지정)");
        when(skuRepository.findByTenantIdAndSkuCodeIn(eq(TENANT), argThat(c -> c.contains("OFFER_ABC"))))
                .thenReturn(List.of(offerSku));
        when(usageRepository.countOrderLinesBySkuCodes(eq(TENANT),
                argThat(c -> c.contains("OFFER_ABC") && c.contains("SKU-1")))).thenReturn(1L);
        CommonCodeInUseException ex = assertThrows(CommonCodeInUseException.class,
                () -> guard.assertDeletable(TENANT, packageCode()));
        assertEquals(ConsultationPackageCodeConstants.MSG_DELETE_BLOCKED_BY_ORDERS, ex.getMessage());
    }

    @Test
    @DisplayName("지정 SKU 이름으로 만든 회기(매칭)도 원본 상품의 이력으로 보고 409")
    void blockedByClientOfferSessions() {
        stubSku();
        when(clientOfferRepository.findOfferSkuCodesBySourceSkuCodes(eq(TENANT), anyCollection()))
                .thenReturn(List.of("OFFER_ABC"));
        ShopCatalogSku offerSku = new ShopCatalogSku();
        offerSku.setSkuCode("OFFER_ABC");
        offerSku.setTitle("10회기 패키지 (지정)");
        when(skuRepository.findByTenantIdAndSkuCodeIn(eq(TENANT), anyCollection())).thenReturn(List.of(offerSku));
        when(usageRepository.countOrderLinesBySkuCodes(eq(TENANT), anyCollection())).thenReturn(0L);
        when(usageRepository.countMappingsByPackageNames(eq(TENANT),
                argThat(c -> c.contains("10회기 패키지 (지정)")))).thenReturn(1L);
        CommonCodeInUseException ex = assertThrows(CommonCodeInUseException.class,
                () -> guard.assertDeletable(TENANT, packageCode()));
        assertEquals(ConsultationPackageCodeConstants.MSG_DELETE_BLOCKED_BY_SESSIONS, ex.getMessage());
    }
}
