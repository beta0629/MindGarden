package com.coresolution.consultation.service.portone;

import java.math.BigDecimal;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * 포트원 V2 REST 결제 조회·검증.
 * <p>
 * {@code GET https://api.portone.io/payments/{paymentId}} + {@code Authorization: PortOne {apiSecret}}.
 * status≠PAID 는 짧은 재조회 후 fail-closed empty. 금액 불일치는 재시도 없이 즉시 empty.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-09-16
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PortOneV2PaymentVerifyService {

    /** 포트원 V2 REST 결제 조회 베이스 URL (공개 API 호스트). */
    static final String PORTONE_V2_PAYMENTS_BASE_URL = "https://api.portone.io/payments";

    /** PAID 상태 문자열 (포트원 V2 Payment.status). */
    static final String STATUS_PAID = "PAID";

    /** CANCELLED 상태 문자열 (포트원 V2 Payment.status). */
    static final String STATUS_CANCELLED = "CANCELLED";

    /** PARTIAL_CANCELLED 상태 문자열 (포트원 V2 Payment.status). */
    static final String STATUS_PARTIAL_CANCELLED = "PARTIAL_CANCELLED";

    /** status≠PAID 일시적 지연 대비 최대 조회 횟수 (fail-closed). */
    static final int TRANSIENT_STATUS_MAX_ATTEMPTS = 3;

    /** 첫 재조회 대기(ms). */
    static final long TRANSIENT_STATUS_BASE_DELAY_MS = 300L;

    /** 재조회마다 증가하는 대기(ms) — 300, 400. */
    static final long TRANSIENT_STATUS_DELAY_STEP_MS = 100L;

    private final TenantPgConfigurationRepository tenantPgConfigurationRepository;
    private final PersonalDataEncryptionService encryptionService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    /** 단위 테스트에서 지연을 0으로 줄이기 위한 필드 (기본값 = 운영 상수). */
    private int transientStatusMaxAttempts = TRANSIENT_STATUS_MAX_ATTEMPTS;
    private long transientStatusBaseDelayMs = TRANSIENT_STATUS_BASE_DELAY_MS;
    private long transientStatusDelayStepMs = TRANSIENT_STATUS_DELAY_STEP_MS;

    /**
     * 테넌트 ACTIVE IAMPORT 설정으로 포트원 REST 를 조회해 결제 승인·금액 일치 여부를 검증한다.
     *
     * @param tenantId  테넌트 ID
     * @param paymentId 포트원/내부 결제 ID
     * @param expectedAmount 기대 금액
     * @return 검증 성공 시 true
     */
    public boolean verifyPaidAmount(String tenantId, String paymentId, BigDecimal expectedAmount) {
        return verifyPaidAmountBody(tenantId, paymentId, expectedAmount).isPresent();
    }

    /**
     * {@link #verifyPaidAmount} 와 동일 검증 후, 성공 시 포트원 REST 원시 JSON 바디를 반환한다.
     * 호출측에서 {@code external_response} 등에 저장할 때 사용한다.
     *
     * @param tenantId       테넌트 ID
     * @param paymentId      포트원/내부 결제 ID
     * @param expectedAmount 기대 금액
     * @return 검증 성공 시 REST JSON, 실패 시 empty (tenant fail-closed)
     */
    public Optional<String> verifyPaidAmountBody(String tenantId, String paymentId, BigDecimal expectedAmount) {
        if (tenantId == null || tenantId.isBlank() || paymentId == null || paymentId.isBlank()) {
            return Optional.empty();
        }
        if (expectedAmount == null) {
            return Optional.empty();
        }

        TenantPgConfiguration configuration = tenantPgConfigurationRepository
                .findByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                        tenantId, PgProvider.IAMPORT, PgConfigurationStatus.ACTIVE)
                .orElse(null);
        if (configuration == null) {
            log.warn("포트원 결제 검증: ACTIVE IAMPORT 설정 없음 tenantId={}", tenantId);
            return Optional.empty();
        }
        if (configuration.getApprovalStatus() != ApprovalStatus.APPROVED) {
            log.warn("포트원 결제 검증: 미승인 설정 configId={}", configuration.getConfigId());
            return Optional.empty();
        }

        String apiSecret = decryptSecret(configuration);
        if (apiSecret == null || apiSecret.isBlank()) {
            log.warn("포트원 결제 검증: API Secret 복호화 실패 configId={}", configuration.getConfigId());
            return Optional.empty();
        }

        int maxAttempts = Math.max(1, transientStatusMaxAttempts);
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            Optional<String> bodyOpt = fetchPaymentBody(paymentId, apiSecret);
            if (bodyOpt.isEmpty()) {
                return Optional.empty();
            }

            JsonNode paymentNode;
            try {
                paymentNode = objectMapper.readTree(bodyOpt.get());
            } catch (Exception e) {
                log.warn("포트원 결제 검증: JSON 파싱 실패 paymentId={}: {}", paymentId, e.getMessage());
                return Optional.empty();
            }

            String status = text(paymentNode, "status");
            if (!STATUS_PAID.equalsIgnoreCase(status)) {
                log.info("포트원 결제 검증: PAID 아님 paymentId={}, status={}, attempt={}/{}, testMode={}",
                        paymentId, status, attempt, maxAttempts, configuration.getTestMode());
                if (attempt < maxAttempts) {
                    awaitTransientStatusRetry(attempt);
                    continue;
                }
                return Optional.empty();
            }

            BigDecimal paidAmount = extractTotalAmount(paymentNode);
            if (paidAmount == null) {
                log.warn("포트원 결제 검증: 금액 파싱 실패 paymentId={}", paymentId);
                return Optional.empty();
            }
            boolean amountOk = paidAmount.compareTo(expectedAmount) == 0;
            if (!amountOk) {
                // 금액 불일치는 재시도하지 않음 (fail-closed)
                log.warn("포트원 결제 검증: 금액 불일치 paymentId={}, expected={}, actual={}",
                        paymentId, expectedAmount, paidAmount);
                return Optional.empty();
            }
            return bodyOpt;
        }
        return Optional.empty();
    }

    /**
     * 결제 엔티티의 제공자가 IAMPORT(포트원)인지 여부.
     *
     * @param payment 결제
     * @return IAMPORT 이면 true
     */
    public boolean isIamportPayment(Payment payment) {
        return payment != null && payment.getProvider() == Payment.PaymentProvider.IAMPORT;
    }

    /**
     * PortOne V2 결제 상태 문자열을 조회한다 (tenant fail-closed).
     *
     * @param tenantId  테넌트 ID
     * @param paymentId 포트원 결제 ID
     * @return 상태 문자열(예: PAID/CANCELLED/PARTIAL_CANCELLED), 조회 실패 시 empty
     */
    public Optional<String> fetchPaymentStatus(String tenantId, String paymentId) {
        if (tenantId == null || tenantId.isBlank() || paymentId == null || paymentId.isBlank()) {
            return Optional.empty();
        }

        TenantPgConfiguration configuration = tenantPgConfigurationRepository
                .findByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                        tenantId, PgProvider.IAMPORT, PgConfigurationStatus.ACTIVE)
                .orElse(null);
        if (configuration == null) {
            log.warn("포트원 결제 상태 조회: ACTIVE IAMPORT 설정 없음 tenantId={}", tenantId);
            return Optional.empty();
        }
        if (configuration.getApprovalStatus() != ApprovalStatus.APPROVED) {
            log.warn("포트원 결제 상태 조회: 미승인 설정 configId={}", configuration.getConfigId());
            return Optional.empty();
        }

        String apiSecret = decryptSecret(configuration);
        if (apiSecret == null || apiSecret.isBlank()) {
            log.warn("포트원 결제 상태 조회: API Secret 복호화 실패 configId={}", configuration.getConfigId());
            return Optional.empty();
        }

        Optional<String> bodyOpt = fetchPaymentBody(paymentId.trim(), apiSecret);
        if (bodyOpt.isEmpty()) {
            return Optional.empty();
        }
        try {
            JsonNode paymentNode = objectMapper.readTree(bodyOpt.get());
            String status = text(paymentNode, "status");
            if (status == null || status.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(status.trim());
        } catch (Exception e) {
            log.warn("포트원 결제 상태 조회: JSON 파싱 실패 paymentId={}: {}", paymentId, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * PortOne 결제가 전액/부분 취소 상태인지 여부.
     *
     * @param tenantId  테넌트 ID
     * @param paymentId 포트원 결제 ID
     * @return CANCELLED 또는 PARTIAL_CANCELLED 이면 true
     */
    public boolean isCancelledOrPartialCancelled(String tenantId, String paymentId) {
        Optional<String> statusOpt = fetchPaymentStatus(tenantId, paymentId);
        if (statusOpt.isEmpty()) {
            return false;
        }
        String status = statusOpt.get();
        return STATUS_CANCELLED.equalsIgnoreCase(status)
                || STATUS_PARTIAL_CANCELLED.equalsIgnoreCase(status);
    }

    /**
     * status≠PAID 재조회 전 대기. attempt는 1-based 완료 시도 번호.
     *
     * @param completedAttempt 방금 끝난 시도 번호 (1 → 첫 대기)
     */
    void awaitTransientStatusRetry(int completedAttempt) {
        long delayMs = transientStatusBaseDelayMs
                + Math.max(0, completedAttempt - 1) * transientStatusDelayStepMs;
        if (delayMs <= 0L) {
            return;
        }
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.debug("포트원 결제 검증 재시도 대기 중단 paymentAttempt={}", completedAttempt);
        }
    }

    private String decryptSecret(TenantPgConfiguration configuration) {
        try {
            String encrypted = configuration.getSecretKeyEncrypted();
            if (encrypted == null || encrypted.isBlank()) {
                return null;
            }
            return encryptionService.decrypt(encrypted);
        } catch (Exception e) {
            log.error("포트원 API Secret 복호화 실패 configId={}", configuration.getConfigId(), e);
            return null;
        }
    }

    private Optional<String> fetchPaymentBody(String paymentId, String apiSecret) {
        URI uri = UriComponentsBuilder
                .fromHttpUrl(PORTONE_V2_PAYMENTS_BASE_URL)
                .pathSegment(paymentId)
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUri();
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, "PortOne " + apiSecret);
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    uri, HttpMethod.GET, new HttpEntity<>(headers), String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("포트원 결제 조회 실패 paymentId={}, status={}", paymentId, response.getStatusCode());
                return Optional.empty();
            }
            return Optional.of(response.getBody());
        } catch (RestClientException e) {
            log.warn("포트원 결제 조회 HTTP 오류 paymentId={}: {}", paymentId, e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.warn("포트원 결제 조회 오류 paymentId={}: {}", paymentId, e.getMessage());
            return Optional.empty();
        }
    }

    private static BigDecimal extractTotalAmount(JsonNode paymentNode) {
        JsonNode amountNode = paymentNode.get("amount");
        if (amountNode == null || amountNode.isNull()) {
            return null;
        }
        if (amountNode.isNumber()) {
            return amountNode.decimalValue();
        }
        JsonNode total = amountNode.get("total");
        if (total != null && total.isNumber()) {
            return total.decimalValue();
        }
        if (total != null && total.isTextual()) {
            try {
                return new BigDecimal(total.asText());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        return node.get(field).asText(null);
    }
}
