package com.coresolution.core.krpublic;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.coresolution.core.constant.KrPublicDataMessages;

/**
 * 온보딩 게이트·영속 코드 단위 테스트. 외부 HTTP 없음.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
class BusinessRegistrationVerifierTest {

    private final BusinessRegistrationVerifier verifier = new BusinessRegistrationVerifier();

    @Test
    @DisplayName("계속사업자+일치 → MATCH, 게이트 통과")
    void continueMatch() {
        BusinessVerificationResult result = base()
                .authenticityMatch(true)
                .businessStatus(KrPublicDataMessages.businessContinue())
                .overallStatus(KrPublicDataMessages.overallMatch())
                .build();

        verifier.enrich(result);
        verifier.assertOnboardingAllowed(result);

        assertEquals(BusinessRegistrationVerifier.STATUS_MATCH, result.getVerificationStatus());
        assertFalse(Boolean.TRUE.equals(result.getSuspendedWarning()));
    }

    @Test
    @DisplayName("휴업+일치 → SUSPENDED 경고, 게이트 통과")
    void suspendedWarningAllowed() {
        BusinessVerificationResult result = base()
                .authenticityMatch(true)
                .businessStatus(KrPublicDataMessages.businessSuspended())
                .overallStatus(KrPublicDataMessages.overallMatch())
                .build();

        verifier.enrich(result);
        verifier.assertOnboardingAllowed(result);

        assertEquals(BusinessRegistrationVerifier.STATUS_SUSPENDED, result.getVerificationStatus());
        assertTrue(result.getSuspendedWarning());
    }

    @Test
    @DisplayName("폐업 → CLOSED, 게이트 차단")
    void closedBlocked() {
        BusinessVerificationResult result = base()
                .authenticityMatch(true)
                .businessStatus(KrPublicDataMessages.businessClosed())
                .overallStatus(KrPublicDataMessages.overallMatch())
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> verifier.assertOnboardingAllowed(result));
        assertEquals(KrPublicDataMessages.gateClosed(), ex.getMessage());
        assertEquals(BusinessRegistrationVerifier.STATUS_CLOSED, result.getVerificationStatus());
    }

    @Test
    @DisplayName("진위 불일치 → MISMATCH, 게이트 차단")
    void mismatchBlocked() {
        BusinessVerificationResult result = base()
                .authenticityMatch(false)
                .businessStatus(KrPublicDataMessages.businessContinue())
                .overallStatus(KrPublicDataMessages.overallMismatch())
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> verifier.assertOnboardingAllowed(result));
        assertEquals(KrPublicDataMessages.gateMismatch(), ex.getMessage());
        assertEquals(BusinessRegistrationVerifier.STATUS_MISMATCH, result.getVerificationStatus());
    }

    @Test
    @DisplayName("미등록 → UNREGISTERED, 게이트 차단")
    void unregisteredBlocked() {
        BusinessVerificationResult result = base()
                .authenticityMatch(null)
                .businessStatus(KrPublicDataMessages.businessUnregistered())
                .overallStatus(KrPublicDataMessages.overallUnregistered())
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> verifier.assertOnboardingAllowed(result));
        assertEquals(KrPublicDataMessages.gateUnregistered(), ex.getMessage());
        assertEquals(BusinessRegistrationVerifier.STATUS_UNREGISTERED, result.getVerificationStatus());
    }

    @Test
    @DisplayName("미확인 → UNCONFIRMED, 게이트 통과")
    void unconfirmedAllowed() {
        BusinessVerificationResult result = base()
                .authenticityMatch(null)
                .businessStatus(null)
                .overallStatus(KrPublicDataMessages.overallUnconfirmed())
                .build();

        verifier.enrich(result);
        verifier.assertOnboardingAllowed(result);

        assertEquals(BusinessRegistrationVerifier.STATUS_UNCONFIRMED, result.getVerificationStatus());
        assertNull(result.getResultCode());
    }

    @Test
    @DisplayName("결과 코드 조합")
    void composeResultCode() {
        assertEquals("b_stt_cd=01;valid=01",
                BusinessRegistrationVerifier.composeResultCode("01", "01"));
        assertEquals("b_stt_cd=03", BusinessRegistrationVerifier.composeResultCode("03", null));
        assertEquals("valid=02", BusinessRegistrationVerifier.composeResultCode(" ", "02"));
        assertNull(BusinessRegistrationVerifier.composeResultCode(null, ""));
    }

    private static BusinessVerificationResult.BusinessVerificationResultBuilder base() {
        return BusinessVerificationResult.builder().checkedAt("2026-10-14T00:00:00Z");
    }
}
