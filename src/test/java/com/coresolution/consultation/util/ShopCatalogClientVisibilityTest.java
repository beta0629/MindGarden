package com.coresolution.consultation.util;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 상담 상품 가시성 — 패키지명·분야 코드.
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@DisplayName("ShopCatalogClientVisibility")
class ShopCatalogClientVisibilityTest {

    @Test
    @DisplayName("분야 코드가 없으면 패키지명 매칭만 사용한다")
    void nullFieldCode_matchesPackageNameOnly() {
        ConsultantClientMapping mapping = mapping("언어치료", "FAMILY");
        assertTrue(ShopCatalogClientVisibility.isConsultationVisible(
                null, List.of("언어치료 10회기"), List.of("언어치료"), List.of(mapping)));
        assertFalse(ShopCatalogClientVisibility.isConsultationVisible(
                null, List.of("일반상담"), List.of("언어치료"), List.of(mapping)));
    }

    @Test
    @DisplayName("매핑이 없으면 상담 상품을 숨긴다")
    void noMapping_hidesConsultation() {
        assertFalse(ShopCatalogClientVisibility.isConsultationVisible(
                "SPEECH", List.of("언어치료"), List.of("언어치료"), List.of()));
    }

    @Test
    @DisplayName("분야 코드는 상담사 분야와 맞으면 다른 패키지명도 통과한다")
    void fieldCode_matchesConsultantSpecialty() {
        ConsultantClientMapping mapping = mapping("단회기", "SPEECH");
        assertTrue(ShopCatalogClientVisibility.isConsultationVisible(
                "SPEECH", List.of("회기권"), List.of(), List.of(mapping)));
        assertFalse(ShopCatalogClientVisibility.isConsultationVisible(
                "FAMILY", List.of("가족권"), List.of(), List.of(mapping)));
    }

    private static ConsultantClientMapping mapping(String packageName, String specialty) {
        User consultant = new User();
        consultant.setSpecialty(specialty);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setPackageName(packageName);
        mapping.setConsultant(consultant);
        return mapping;
    }
}
