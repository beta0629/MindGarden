package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ShopCatalogSkuConstants;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ShopCatalogSkuCodeGenerator} 단위 테스트.
 *
 * <p>운영 핫픽스(Hibernate 6 derived query 타입 불일치) 회귀 가드.
 * Repository 가 {@code List<String>} 을 반환하는 계약을 generator 가 그대로
 * 사용한다는 사실을 명세화한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ShopCatalogSkuCodeGenerator")
class ShopCatalogSkuCodeGeneratorTest {

    private static final String TENANT = "tenant-shop-sku";

    @Mock
    private ShopCatalogSkuRepository shopCatalogSkuRepository;

    @InjectMocks
    private ShopCatalogSkuCodeGenerator shopCatalogSkuCodeGenerator;

    @Test
    @DisplayName("generateNextCode — 기존 코드 없음 → 시퀀스 001 발급")
    void generateNextCode_whenNoExistingCodes_returnsFirstSequence() {
        when(shopCatalogSkuRepository
                .findSkuCodesByTenantIdAndSkuCodeStartingWithAndIsDeletedFalse(
                        eq(TENANT), startsWith(ShopCatalogSkuConstants.SKU_CODE_PREFIX + "-")))
                .thenReturn(Collections.emptyList());

        String code = shopCatalogSkuCodeGenerator.generateNextCode(TENANT);

        assertTrue(code.startsWith(ShopCatalogSkuConstants.SKU_CODE_PREFIX + "-"),
                "코드 접두사는 상수와 일치해야 한다: " + code);
        assertTrue(code.endsWith("-001"), "빈 결과는 첫 시퀀스 001 을 발급해야 한다: " + code);
        assertEquals(expectedCodeForToday(1), code);
    }

    @Test
    @DisplayName("generateNextCode — 기존 시퀀스 3건 → 다음 시퀀스 004 발급")
    void generateNextCode_whenExistingSequences_returnsNextSequence() {
        String prefix = ShopCatalogSkuConstants.SKU_CODE_PREFIX + "-"
                + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-";
        List<String> existing = List.of(
                prefix + "001",
                prefix + "003",
                prefix + "002");
        when(shopCatalogSkuRepository
                .findSkuCodesByTenantIdAndSkuCodeStartingWithAndIsDeletedFalse(
                        eq(TENANT), eq(prefix)))
                .thenReturn(existing);

        String code = shopCatalogSkuCodeGenerator.generateNextCode(TENANT);

        assertEquals(prefix + "004", code);
    }

    @Test
    @DisplayName("generateNextCode — 비정상 suffix 는 0 으로 무시")
    void generateNextCode_whenSuffixMalformed_ignoresInvalid() {
        String prefix = ShopCatalogSkuConstants.SKU_CODE_PREFIX + "-"
                + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-";
        List<String> existing = List.of(
                prefix + "abc",
                prefix + "012",
                prefix);
        when(shopCatalogSkuRepository
                .findSkuCodesByTenantIdAndSkuCodeStartingWithAndIsDeletedFalse(
                        eq(TENANT), eq(prefix)))
                .thenReturn(existing);

        String code = shopCatalogSkuCodeGenerator.generateNextCode(TENANT);

        assertEquals(prefix + "013", code);
    }

    private static String expectedCodeForToday(int sequence) {
        String prefix = ShopCatalogSkuConstants.SKU_CODE_PREFIX + "-"
                + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-";
        return prefix + String.format(
                "%0" + ShopCatalogSkuConstants.SKU_CODE_SEQ_WIDTH + "d", sequence);
    }
}
