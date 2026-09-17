package com.coresolution.consultation.constant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link ShopSessionCountConstants} 단위 검증.
 *
 * @author MindGarden
 * @since 2026-09-17
 */
@DisplayName("ShopSessionCountConstants")
class ShopSessionCountConstantsTest {

    @Test
    @DisplayName("resolvePackageType — 1=SINGLE, 2+=PACKAGE")
    void resolvePackageType() {
        assertEquals(ShopSessionCountConstants.PACKAGE_TYPE_SINGLE, ShopSessionCountConstants.resolvePackageType(1));
        assertEquals(ShopSessionCountConstants.PACKAGE_TYPE_PACKAGE, ShopSessionCountConstants.resolvePackageType(2));
        assertEquals(ShopSessionCountConstants.PACKAGE_TYPE_PACKAGE, ShopSessionCountConstants.resolvePackageType(10));
    }

    @Test
    @DisplayName("isSingleSession")
    void isSingleSession() {
        assertTrue(ShopSessionCountConstants.isSingleSession(1));
        assertFalse(ShopSessionCountConstants.isSingleSession(3));
    }

    @Test
    @DisplayName("resolveSessionsToGrant — 회기수×수량")
    void resolveSessionsToGrant() {
        assertEquals(10, ShopSessionCountConstants.resolveSessionsToGrant(5, 2));
        assertEquals(1, ShopSessionCountConstants.resolveSessionsToGrant(1, 1));
    }

    @Test
    @DisplayName("resolveSessionsToGrant — 잘못된 인자 거부")
    void resolveSessionsToGrant_rejectsInvalid() {
        assertThrows(IllegalArgumentException.class, () -> ShopSessionCountConstants.resolveSessionsToGrant(0, 1));
        assertThrows(IllegalArgumentException.class, () -> ShopSessionCountConstants.resolveSessionsToGrant(1, 0));
    }
}
