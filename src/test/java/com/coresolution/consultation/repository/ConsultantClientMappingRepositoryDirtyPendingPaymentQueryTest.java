package com.coresolution.consultation.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.MappingStatusConstants;
import java.lang.reflect.Method;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

/**
 * {@link ConsultantClientMappingRepository#findDirtyPendingPaymentMappings} JPQL —
 * value·countQuery 모두 REFUNDED paymentStatus 제외 조건 포함 검증.
 *
 * @author CoreSolution
 * @since 2026-10-29
 */
@DisplayName("ConsultantClientMappingRepository dirty pending-payment JPQL")
class ConsultantClientMappingRepositoryDirtyPendingPaymentQueryTest {

    @Test
    @DisplayName("value·countQuery 에 paymentStatus REFUNDED 제외 조건이 있다")
    void findDirtyPendingPaymentMappings_excludesRefundedInValueAndCountQuery() throws Exception {
        Method method = ConsultantClientMappingRepository.class.getMethod(
                "findDirtyPendingPaymentMappings",
                String.class,
                java.time.LocalDateTime.class,
                org.springframework.data.domain.Pageable.class);
        Query query = method.getAnnotation(Query.class);
        assertThat(query).isNotNull();

        String refundedExcludeFragment =
                "m.paymentStatus IS NULL OR m.paymentStatus <> '" + MappingStatusConstants.REFUNDED + "'";
        assertThat(query.value()).contains(refundedExcludeFragment);
        assertThat(query.value()).contains("m.status = 'PENDING_PAYMENT'");
        assertThat(query.countQuery()).contains(refundedExcludeFragment);
        assertThat(query.countQuery()).contains("m.status = 'PENDING_PAYMENT'");
    }
}
