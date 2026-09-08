package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;

import com.coresolution.consultation.dto.PaymentRequest;
import com.coresolution.consultation.service.BankTransferService;
import com.coresolution.consultation.service.PaymentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * PaymentTestController local-only fail-closed 단위 테스트.
 *
 * <p>증명 목표:
 * <ul>
 *   <li>&#64;Profile 값이 정확히 {@code {"local"}} (dev 제외)</li>
 *   <li>&#64;ConditionalOnProperty 가 {@code isDev=true} 유지</li>
 *   <li>non-local → mutating/health API 403, PaymentService/BankTransferService 미호출</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PaymentTestController — local-only fail-closed")
class PaymentTestControllerLocalOnlyTest {

    @Mock private PaymentService paymentService;
    @Mock private BankTransferService bankTransferService;
    @Mock private Environment environment;

    @InjectMocks
    private PaymentTestController paymentTestController;

    @Test
    @DisplayName("@Profile 값은 정확히 local 만 (dev 제외)")
    void profileAnnotation_isLocalOnly() {
        Profile profile = PaymentTestController.class.getAnnotation(Profile.class);

        assertThat(profile).isNotNull();
        assertThat(Arrays.asList(profile.value())).containsExactly("local");
        assertThat(profile.value()).doesNotContain("dev");
    }

    @Test
    @DisplayName("@ConditionalOnProperty 는 isDev=true 를 유지")
    void conditionalOnProperty_requiresIsDevTrue() {
        ConditionalOnProperty condition =
                PaymentTestController.class.getAnnotation(ConditionalOnProperty.class);

        assertThat(condition).isNotNull();
        assertThat(condition.name()).containsExactly("isDev");
        assertThat(condition.havingValue()).isEqualTo("true");
    }

    @Test
    @DisplayName("non-local — createTestPayment 는 403 이고 PaymentService 미호출")
    void createTestPayment_nonLocal_returns403_withoutSideEffects() {
        when(environment.acceptsProfiles("local")).thenReturn(false);

        ResponseEntity<?> response = paymentTestController.createTestPayment(
                "CARD", "TOSS", 100000L, 1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(paymentService, never()).createPayment(any(PaymentRequest.class));
        verify(bankTransferService, never()).confirmDeposit(any(), any(), any());
    }

    @Test
    @DisplayName("non-local — createBulkPayments 는 403 이고 PaymentService 미호출")
    void createBulkPayments_nonLocal_returns403_withoutSideEffects() {
        when(environment.acceptsProfiles("local")).thenReturn(false);

        ResponseEntity<?> response = paymentTestController.createBulkPayments(5);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(paymentService, never()).createPayment(any(PaymentRequest.class));
        verify(bankTransferService, never()).getUnconfirmedDeposits();
    }

    @Test
    @DisplayName("non-local — checkPaymentSystemHealth 는 403 이고 서비스 미호출")
    void checkPaymentSystemHealth_nonLocal_returns403_withoutSideEffects() {
        when(environment.acceptsProfiles("local")).thenReturn(false);

        ResponseEntity<?> response = paymentTestController.checkPaymentSystemHealth();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(paymentService, never()).getPaymentStatistics(any(), any());
        verify(paymentService, never()).processExpiredPayments();
        verify(bankTransferService, never()).getUnconfirmedDeposits();
    }
}
