package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopCatalogSkuConstants;
import com.coresolution.consultation.dto.shop.ShopCatalogSkuResponse;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.service.ClientShopConsultantMappingService;
import com.coresolution.consultation.service.ShopCatalogPackageOfferResolver;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ClientShopCatalogServiceImpl} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientShopCatalogServiceImpl")
class ClientShopCatalogServiceImplTest {

    private static final String TENANT = "tenant-client-shop";
    private static final String THUMB = "/api/v1/files/shop-catalog-thumbnails/demo.png";

    @Mock
    private ShopCatalogSkuRepository shopCatalogSkuRepository;

    @Mock
    private ShopCatalogPackageOfferResolver shopCatalogPackageOfferResolver;

    @Mock
    private ClientShopConsultantMappingService clientShopConsultantMappingService;

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @InjectMocks
    private ClientShopCatalogServiceImpl clientShopCatalogService;

    @Test
    @DisplayName("listVisibleSkus — thumbnailUrl 포함")
    void listVisibleSkus_includesThumbnailUrl() {
        ShopCatalogSku row = sampleSku();
        when(shopCatalogSkuRepository.findCatalogForTenant(TENANT)).thenReturn(List.of(row));

        List<ShopCatalogSkuResponse> list = clientShopCatalogService.listVisibleSkus(TENANT);

        assertEquals(1, list.size());
        assertEquals(THUMB, list.get(0).getThumbnailUrl());
        assertEquals("SKU-01", list.get(0).getSkuCode());
        assertEquals(10, list.get(0).getSessionCount());
        assertEquals("PACKAGE", list.get(0).getPackageType());
    }

    @Test
    @DisplayName("getVisibleSkuByCode — 노출 SKU 반환")
    void getVisibleSkuByCode_whenFound_returnsSku() {
        ShopCatalogSku row = sampleSku();
        when(shopCatalogSkuRepository.findVisibleByTenantAndSkuCode(TENANT, "SKU-01"))
                .thenReturn(Optional.of(row));

        ShopCatalogSkuResponse response = clientShopCatalogService.getVisibleSkuByCode(TENANT, "SKU-01");

        assertEquals(THUMB, response.getThumbnailUrl());
        assertEquals(ShopCatalogCategory.CONSULTATION, response.getCatalogCategory());
    }

    @Test
    @DisplayName("getVisibleSkuByCode — 없으면 EntityNotFoundException")
    void getVisibleSkuByCode_whenMissing_throws() {
        when(shopCatalogSkuRepository.findVisibleByTenantAndSkuCode(TENANT, "MISSING"))
                .thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> clientShopCatalogService.getVisibleSkuByCode(TENANT, "MISSING"));
    }

    @Test
    @DisplayName("로그인 내담자 — 매핑 패키지와 맞는 상담 상품과 검사 상품만 남긴다")
    void listVisibleSkus_forClient_filtersConsultationByPackageName() {
        ShopCatalogSku speech = catalogSku("SPEECH-PKG", "언어치료", ShopCatalogCategory.CONSULTATION, null);
        ShopCatalogSku general = catalogSku("GEN-PKG", "일반상담", ShopCatalogCategory.CONSULTATION, null);
        ShopCatalogSku exam = catalogSku("EXAM-1", "종합심리검사", ShopCatalogCategory.ASSESSMENT, "FULL");
        when(shopCatalogSkuRepository.findCatalogForTenant(TENANT))
                .thenReturn(List.of(speech, general, exam));
        when(clientShopConsultantMappingService.listActiveMappings(TENANT, 7L))
                .thenReturn(List.of(mapping("언어치료", null)));
        when(commonCodeRepository.findTenantCodesByGroup(
                TENANT, ShopCatalogSkuConstants.FIELD_CODE_GROUP_CONSULTATION))
                .thenReturn(List.of());

        List<ShopCatalogSkuResponse> list = clientShopCatalogService.listVisibleSkus(TENANT, 7L);

        assertEquals(2, list.size());
        assertEquals("SPEECH-PKG", list.get(0).getSkuCode());
        assertEquals("EXAM-1", list.get(1).getSkuCode());
        assertEquals("FULL", list.get(1).getFieldCode());
    }

    @Test
    @DisplayName("분야 코드가 있으면 상담사 분야가 맞는 상품만 보이고, 다른 패키지는 숨긴다")
    void listVisibleSkus_forClient_matchesSpecialtyCode() {
        ShopCatalogSku speech = catalogSku("SPEECH-SKU", "회기권", ShopCatalogCategory.CONSULTATION, "SPEECH");
        ShopCatalogSku family = catalogSku("FAMILY-SKU", "가족권", ShopCatalogCategory.CONSULTATION, "FAMILY");
        when(shopCatalogSkuRepository.findCatalogForTenant(TENANT)).thenReturn(List.of(speech, family));
        when(clientShopConsultantMappingService.listActiveMappings(TENANT, 8L))
                .thenReturn(List.of(mapping("단회기", "SPEECH")));
        when(commonCodeRepository.findTenantCodesByGroup(
                TENANT, ShopCatalogSkuConstants.FIELD_CODE_GROUP_CONSULTATION))
                .thenReturn(List.of());

        List<ShopCatalogSkuResponse> list = clientShopCatalogService.listVisibleSkus(TENANT, 8L);

        assertEquals(1, list.size());
        assertEquals("SPEECH-SKU", list.get(0).getSkuCode());
    }

    @Test
    @DisplayName("숨긴 상담 상품 단건은 404")
    void getVisibleSkuByCode_forClient_hidesUnmatched() {
        ShopCatalogSku general = catalogSku("GEN-PKG", "일반상담", ShopCatalogCategory.CONSULTATION, null);
        when(shopCatalogSkuRepository.findVisibleByTenantAndSkuCode(TENANT, "GEN-PKG"))
                .thenReturn(Optional.of(general));
        when(clientShopConsultantMappingService.listActiveMappings(TENANT, 7L))
                .thenReturn(List.of(mapping("언어치료", null)));
        when(commonCodeRepository.findTenantCodesByGroup(
                TENANT, ShopCatalogSkuConstants.FIELD_CODE_GROUP_CONSULTATION))
                .thenReturn(List.of());

        assertThrows(EntityNotFoundException.class,
                () -> clientShopCatalogService.getVisibleSkuByCode(TENANT, "GEN-PKG", 7L));
    }

    @Test
    @DisplayName("상담사 id 가 있으면 같은 배정 상품만 보이고 다른 상담사 상품은 숨긴다")
    void listVisibleSkus_forClient_filtersByBoundConsultant() {
        ShopCatalogSku mine = catalogSku("MINE", "내 선생님 회기", ShopCatalogCategory.CONSULTATION, "SPEECH");
        mine.setConsultantId(11L);
        ShopCatalogSku other = catalogSku("OTHER", "다른 선생님 회기", ShopCatalogCategory.CONSULTATION, "SPEECH");
        other.setConsultantId(22L);
        ShopCatalogSku legacy = catalogSku("LEGACY", "언어치료", ShopCatalogCategory.CONSULTATION, null);
        ShopCatalogSku exam = catalogSku("EXAM-1", "종합심리검사", ShopCatalogCategory.ASSESSMENT, "FULL");
        when(shopCatalogSkuRepository.findCatalogForTenant(TENANT))
                .thenReturn(List.of(mine, other, legacy, exam));
        when(clientShopConsultantMappingService.listActiveMappings(TENANT, 9L))
                .thenReturn(List.of(mapping("언어치료", "FAMILY", 11L)));
        when(commonCodeRepository.findTenantCodesByGroup(
                TENANT, ShopCatalogSkuConstants.FIELD_CODE_GROUP_CONSULTATION))
                .thenReturn(List.of());

        List<ShopCatalogSkuResponse> list = clientShopCatalogService.listVisibleSkus(TENANT, 9L);

        assertEquals(3, list.size());
        assertEquals("MINE", list.get(0).getSkuCode());
        assertEquals("LEGACY", list.get(1).getSkuCode());
        assertEquals("EXAM-1", list.get(2).getSkuCode());
    }

    @Test
    @DisplayName("배정이 여러 명이면 그 상담사 상품의 합집합만 보인다")
    void listVisibleSkus_forClient_unionOfAssignedConsultants() {
        ShopCatalogSku first = catalogSku("A", "회기", ShopCatalogCategory.CONSULTATION, "SPEECH");
        first.setConsultantId(11L);
        ShopCatalogSku second = catalogSku("B", "회기", ShopCatalogCategory.CONSULTATION, "FAMILY");
        second.setConsultantId(22L);
        ShopCatalogSku third = catalogSku("C", "회기", ShopCatalogCategory.CONSULTATION, "SPEECH");
        third.setConsultantId(33L);
        when(shopCatalogSkuRepository.findCatalogForTenant(TENANT)).thenReturn(List.of(first, second, third));
        when(clientShopConsultantMappingService.listActiveMappings(TENANT, 10L))
                .thenReturn(List.of(
                        mapping("단회기", null, 11L),
                        mapping("가족", null, 22L)));
        when(commonCodeRepository.findTenantCodesByGroup(
                TENANT, ShopCatalogSkuConstants.FIELD_CODE_GROUP_CONSULTATION))
                .thenReturn(List.of());

        List<ShopCatalogSkuResponse> list = clientShopCatalogService.listVisibleSkus(TENANT, 10L);

        assertEquals(2, list.size());
        assertEquals("A", list.get(0).getSkuCode());
        assertEquals("B", list.get(1).getSkuCode());
    }

    @Test
    @DisplayName("검사 상품은 배정이 없어도 보이고 상담사 지정 상담 상품은 숨긴다")
    void listVisibleSkus_assessmentVisibleWithoutMapping() {
        ShopCatalogSku exam = catalogSku("EXAM-1", "종합심리검사", ShopCatalogCategory.ASSESSMENT, "FULL");
        ShopCatalogSku bound = catalogSku("BOUND", "회기", ShopCatalogCategory.CONSULTATION, "SPEECH");
        bound.setConsultantId(11L);
        when(shopCatalogSkuRepository.findCatalogForTenant(TENANT)).thenReturn(List.of(exam, bound));
        when(clientShopConsultantMappingService.listActiveMappings(TENANT, 12L)).thenReturn(List.of());
        when(commonCodeRepository.findTenantCodesByGroup(
                TENANT, ShopCatalogSkuConstants.FIELD_CODE_GROUP_CONSULTATION))
                .thenReturn(List.of());

        List<ShopCatalogSkuResponse> list = clientShopCatalogService.listVisibleSkus(TENANT, 12L);

        assertEquals(1, list.size());
        assertEquals("EXAM-1", list.get(0).getSkuCode());
    }

    @Test
    @DisplayName("다른 상담사에게 묶인 상품 단건은 404")
    void getVisibleSkuByCode_forClient_hidesOtherConsultant() {
        ShopCatalogSku other = catalogSku("OTHER", "다른 선생님", ShopCatalogCategory.CONSULTATION, "SPEECH");
        other.setConsultantId(22L);
        when(shopCatalogSkuRepository.findVisibleByTenantAndSkuCode(TENANT, "OTHER"))
                .thenReturn(Optional.of(other));
        when(clientShopConsultantMappingService.listActiveMappings(TENANT, 9L))
                .thenReturn(List.of(mapping("언어치료", "SPEECH", 11L)));
        when(commonCodeRepository.findTenantCodesByGroup(
                TENANT, ShopCatalogSkuConstants.FIELD_CODE_GROUP_CONSULTATION))
                .thenReturn(List.of());

        assertThrows(EntityNotFoundException.class,
                () -> clientShopCatalogService.getVisibleSkuByCode(TENANT, "OTHER", 9L));
    }

    private static ConsultantClientMapping mapping(String packageName, String specialty) {
        return mapping(packageName, specialty, null);
    }

    private static ConsultantClientMapping mapping(String packageName, String specialty, Long consultantId) {
        User consultant = new User();
        consultant.setId(consultantId);
        consultant.setSpecialty(specialty);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setPackageName(packageName);
        mapping.setConsultant(consultant);
        return mapping;
    }

    private static ShopCatalogSku catalogSku(
            String skuCode, String title, String category, String fieldCode) {
        ShopCatalogSku row = new ShopCatalogSku();
        row.setTenantId(TENANT);
        row.setSkuCode(skuCode);
        row.setTitle(title);
        row.setUnitPriceMinor(1000L);
        row.setCurrency("KRW");
        row.setCatalogCategory(category);
        row.setCatalogVisible(true);
        row.setActive(true);
        row.setSessionCount(1);
        row.setFieldCode(fieldCode);
        return row;
    }

    private static ShopCatalogSku sampleSku() {
        ShopCatalogSku row = new ShopCatalogSku();
        row.setId(1L);
        row.setTenantId(TENANT);
        row.setSkuCode("SKU-01");
        row.setTitle("상품");
        row.setUnitPriceMinor(5000L);
        row.setCurrency("KRW");
        row.setCatalogCategory(ShopCatalogCategory.CONSULTATION);
        row.setThumbnailUrl(THUMB);
        row.setCatalogVisible(true);
        row.setActive(true);
        row.setSessionCount(10);
        return row;
    }
}
