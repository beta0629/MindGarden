package com.coresolution.core.service.billing.impl;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.core.domain.billing.PaymentMethod;
import com.coresolution.core.repository.billing.PaymentMethodRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

/**
 * {@link PaymentMethodServiceImpl#setDefaultPaymentMethod} 테넌트 소유권 fail-closed 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentMethodServiceImpl — setDefaultPaymentMethod 소유권")
class PaymentMethodServiceImplSetDefaultOwnershipTest {

    @Mock
    private PaymentMethodRepository paymentMethodRepository;

    @InjectMocks
    private PaymentMethodServiceImpl paymentMethodService;

    @Test
    @DisplayName("paymentMethod.tenantId ≠ 요청 tenantId → AccessDeniedException")
    void setDefault_mismatchedTenant_throwsAccessDenied() {
        PaymentMethod pm = PaymentMethod.builder()
                .paymentMethodId("pm-x")
                .tenantId("tenant-owner")
                .paymentMethodToken("tok")
                .pgProvider("TOSS")
                .isDefault(false)
                .isActive(true)
                .build();
        when(paymentMethodRepository.findByPaymentMethodId("pm-x")).thenReturn(Optional.of(pm));

        assertThatThrownBy(() -> paymentMethodService.setDefaultPaymentMethod("pm-x", "tenant-other"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("결제 수단");

        verify(paymentMethodRepository, never()).save(any());
    }
}
