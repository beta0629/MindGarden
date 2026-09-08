package com.coresolution.core.controller.billing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import com.coresolution.core.service.billing.BillingTestService;
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
 * BillingTestController local-only fail-closed 단위 테스트.
 *
 * <p>증명 목표:
 * <ul>
 *   <li>&#64;Profile 값이 정확히 {@code {"local"}} (dev 제외)</li>
 *   <li>&#64;ConditionalOnProperty 가 {@code isDev=true} 유지</li>
 *   <li>non-local → 테스트 엔드포인트 403, BillingTestService 미호출</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("BillingTestController — local-only fail-closed")
class BillingTestControllerLocalOnlyTest {

    @Mock private BillingTestService billingTestService;
    @Mock private Environment environment;

    @InjectMocks
    private BillingTestController billingTestController;

    @Test
    @DisplayName("@Profile 값은 정확히 local 만 (dev 제외)")
    void profileAnnotation_isLocalOnly() {
        Profile profile = BillingTestController.class.getAnnotation(Profile.class);

        assertThat(profile).isNotNull();
        assertThat(Arrays.asList(profile.value())).containsExactly("local");
        assertThat(profile.value()).doesNotContain("dev");
    }

    @Test
    @DisplayName("@ConditionalOnProperty 는 isDev=true 를 유지")
    void conditionalOnProperty_requiresIsDevTrue() {
        ConditionalOnProperty condition =
                BillingTestController.class.getAnnotation(ConditionalOnProperty.class);

        assertThat(condition).isNotNull();
        assertThat(condition.name()).containsExactly("isDev");
        assertThat(condition.havingValue()).isEqualTo("true");
    }

    @Test
    @DisplayName("non-local — testApprovePayment 는 403 이고 BillingTestService 미호출")
    void testApprovePayment_nonLocal_returns403_withoutSideEffects() {
        when(environment.acceptsProfiles("local")).thenReturn(false);

        Map<String, Object> request = new HashMap<>();
        request.put("paymentMethodId", "pm-1");
        request.put("amount", "1000");
        request.put("customerKey", "cust-1");

        ResponseEntity<?> response = billingTestController.testApprovePayment(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(billingTestService, never()).approvePaymentWithBillingKey(
                anyString(), any(BigDecimal.class), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("non-local — testCancelPayment 는 403 이고 BillingTestService 미호출")
    void testCancelPayment_nonLocal_returns403_withoutSideEffects() {
        when(environment.acceptsProfiles("local")).thenReturn(false);

        Map<String, Object> request = new HashMap<>();
        request.put("paymentKey", "pk-1");
        request.put("cancelReason", "test");

        ResponseEntity<?> response = billingTestController.testCancelPayment(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(billingTestService, never()).cancelPayment(anyString(), anyString());
    }

    @Test
    @DisplayName("non-local — testFullPaymentFlow 는 403 이고 BillingTestService 미호출")
    void testFullPaymentFlow_nonLocal_returns403_withoutSideEffects() {
        when(environment.acceptsProfiles("local")).thenReturn(false);

        Map<String, Object> request = new HashMap<>();
        request.put("paymentMethodId", "pm-1");
        request.put("amount", "1000");
        request.put("customerKey", "cust-1");

        ResponseEntity<?> response = billingTestController.testFullPaymentFlow(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(billingTestService, never()).approvePaymentWithBillingKey(
                anyString(), any(BigDecimal.class), anyString(), anyString(), anyString());
        verify(billingTestService, never()).cancelPayment(anyString(), anyString());
    }

    @Test
    @DisplayName("non-local — testApproveOneTimePayment 는 403 이고 BillingTestService 미호출")
    void testApproveOneTimePayment_nonLocal_returns403_withoutSideEffects() {
        when(environment.acceptsProfiles("local")).thenReturn(false);

        Map<String, Object> request = new HashMap<>();
        request.put("paymentKey", "pk-1");
        request.put("amount", "1000");
        request.put("orderId", "order-1");

        ResponseEntity<?> response = billingTestController.testApproveOneTimePayment(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(billingTestService, never()).approveOneTimePayment(
                anyString(), any(BigDecimal.class), anyString());
    }
}
