package com.coresolution.consultation.service.portone;

import com.coresolution.consultation.config.RestTemplateConfig;
import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * 포트원 V2 REST 결제 취소(cancel) — 전액 또는 금액 지정 부분 취소.
 *
 * <p>{@code POST https://api.portone.io/payments/{paymentId}/cancel}
 * + {@code Authorization: PortOne {apiSecret}}.</p>
 *
 * <p>이미 PortOne 상태가 {@code CANCELLED}/{@code PARTIAL_CANCELLED} 이면
 * cancel API 실패여도 멱등 성공으로 취급한다 (Clinic 환불 체인 계속).</p>
 *
 * @author MindGarden
 * @since 2026-09-17
 */
@Slf4j
@Service
public class PortOneV2PaymentCancelService {

    /** 포트원 V2 결제 cancel 베이스 URL. */
    static final String PORTONE_V2_PAYMENTS_BASE_URL = "https://api.portone.io/payments";

    /** 포트원 V2 Payment.status — 전액 취소. */
    static final String STATUS_CANCELLED = "CANCELLED";

    /** 포트원 V2 Payment.status — 부분 취소. */
    static final String STATUS_PARTIAL_CANCELLED = "PARTIAL_CANCELLED";

    /** 포트원 V2 cancel 요청 body — 부분 취소 금액. */
    static final String CANCEL_BODY_AMOUNT = "amount";

    /** 포트원 V2 요청 멱등 키 헤더 — 같은 키 재요청은 PortOne 이 한 번만 처리한다. */
    static final String HEADER_IDEMPOTENCY_KEY = "Idempotency-Key";

    /** 포트원 V2 Payment 응답 — 금액 객체. */
    static final String PAYMENT_FIELD_AMOUNT = "amount";

    /** 포트원 V2 Payment 응답 — {@code amount.cancelled} 누적 취소 금액. */
    static final String PAYMENT_FIELD_AMOUNT_CANCELLED = "cancelled";

    private final TenantPgConfigurationRepository tenantPgConfigurationRepository;
    private final PersonalDataEncryptionService encryptionService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public PortOneV2PaymentCancelService(
            TenantPgConfigurationRepository tenantPgConfigurationRepository,
            PersonalDataEncryptionService encryptionService,
            ObjectMapper objectMapper,
            @Qualifier(RestTemplateConfig.PORTONE_REST_TEMPLATE) RestTemplate restTemplate) {
        this.tenantPgConfigurationRepository = tenantPgConfigurationRepository;
        this.encryptionService = encryptionService;
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
    }

    /**
     * 테넌트 ACTIVE IAMPORT 설정으로 포트원 V2 전액 취소를 호출한다.
     *
     * <p>이미 취소된 결제는 PortOne GET 상태로 확인 후 {@code true}(멱등 성공)를 반환한다.</p>
     *
     * @param tenantId  테넌트 ID
     * @param paymentId 포트원/내부 결제 ID
     * @param reason    취소 사유
     * @return 성공(또는 이미 취소) 시 true
     */
    public boolean cancelPayment(String tenantId, String paymentId, String reason) {
        return cancelPayment(tenantId, paymentId, reason, null);
    }

    /**
     * {@link #cancelPayment(String, String, String)} + PortOne 멱등 키.
     *
     * @param tenantId       테넌트 ID
     * @param paymentId      포트원/내부 결제 ID
     * @param reason         취소 사유
     * @param idempotencyKey PortOne {@code Idempotency-Key} (없으면 헤더 생략)
     * @return 성공(또는 이미 취소) 시 true
     */
    public boolean cancelPayment(String tenantId, String paymentId, String reason, String idempotencyKey) {
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(paymentId)) {
            return false;
        }
        String cancelReason = resolveCancelReason(reason);
        String apiSecret = resolveActiveApiSecret(tenantId);
        if (apiSecret == null) {
            return false;
        }

        String trimmedPaymentId = paymentId.trim();
        if (isAlreadyCancelledOnPortOne(trimmedPaymentId, apiSecret)) {
            log.info("포트원 V2 결제 이미 취소됨(멱등 성공) paymentId={}", trimmedPaymentId);
            return true;
        }

        return postCancel(trimmedPaymentId, apiSecret, cancelReason, null, idempotencyKey);
    }

    /**
     * 포트원 V2 부분 취소 — 지정 금액만 취소한다 (기환불분을 제외한 잔여 환불).
     *
     * <p>{@code PARTIAL_CANCELLED} 는 멱등 성공으로 보지 않는다 (이미 일부 취소된 결제의 잔여 취소가 목적).
     * {@code CANCELLED} 이면 취소할 잔액이 없으므로 POST 없이 true. POST 실패 후에는 PortOne 취소 누적액이
     * 요청 전 누적액 + 요청 금액 이상일 때만 성공(응답 유실 레이스)으로 본다.</p>
     *
     * @param tenantId  테넌트 ID
     * @param paymentId 포트원/내부 결제 ID
     * @param reason    취소 사유
     * @param amount    취소 금액 (0 초과)
     * @return 성공 시 true
     */
    public boolean cancelPaymentAmount(String tenantId, String paymentId, String reason, BigDecimal amount) {
        return cancelPaymentAmount(tenantId, paymentId, reason, amount, null);
    }

    /**
     * {@link #cancelPaymentAmount(String, String, String, BigDecimal)} + PortOne 멱등 키.
     *
     * @param tenantId       테넌트 ID
     * @param paymentId      포트원/내부 결제 ID
     * @param reason         취소 사유
     * @param amount         취소 금액 (0 초과)
     * @param idempotencyKey PortOne {@code Idempotency-Key} (없으면 헤더 생략)
     * @return 성공 시 true
     */
    public boolean cancelPaymentAmount(
            String tenantId, String paymentId, String reason, BigDecimal amount, String idempotencyKey) {
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(paymentId)
                || amount == null || amount.signum() <= 0) {
            return false;
        }
        String apiSecret = resolveActiveApiSecret(tenantId);
        if (apiSecret == null) {
            return false;
        }
        String trimmedPaymentId = paymentId.trim();
        Optional<JsonNode> before = fetchPayment(trimmedPaymentId, apiSecret);
        if (before.isPresent() && STATUS_CANCELLED.equalsIgnoreCase(readStatus(before.get()))) {
            log.info("포트원 V2 결제 이미 전액 취소됨 — 부분 취소 생략 paymentId={}", trimmedPaymentId);
            return true;
        }
        if (postCancel(trimmedPaymentId, apiSecret, resolveCancelReason(reason), amount, idempotencyKey)) {
            return true;
        }
        if (before.isEmpty()) {
            return false;
        }
        BigDecimal cancelledBefore = readCancelledAmount(before.get());
        return fetchPayment(trimmedPaymentId, apiSecret)
                .map(this::readCancelledAmount)
                .map(after -> after.compareTo(cancelledBefore.add(amount)) >= 0)
                .orElse(false);
    }

    /**
     * 포트원 V2 결제의 누적 취소 금액({@code amount.cancelled})을 조회한다.
     *
     * @param tenantId  테넌트 ID
     * @param paymentId 포트원/내부 결제 ID
     * @return 누적 취소 금액 (조회 실패 시 empty)
     */
    public Optional<BigDecimal> fetchCancelledAmount(String tenantId, String paymentId) {
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(paymentId)) {
            return Optional.empty();
        }
        String apiSecret = resolveActiveApiSecret(tenantId);
        if (apiSecret == null) {
            return Optional.empty();
        }
        return fetchPayment(paymentId.trim(), apiSecret).map(this::readCancelledAmount);
    }

    private static String resolveCancelReason(String reason) {
        return StringUtils.hasText(reason)
                ? reason.trim()
                : ShopRefundConstants.DEFAULT_PORTONE_CANCEL_REASON;
    }

    /**
     * 테넌트 ACTIVE·APPROVED IAMPORT 설정의 API Secret.
     *
     * @param tenantId 테넌트 ID
     * @return 복호화된 API Secret (설정 없음·미승인·복호화 실패 시 null)
     */
    private String resolveActiveApiSecret(String tenantId) {
        TenantPgConfiguration configuration = tenantPgConfigurationRepository
                .findByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                        tenantId, PgProvider.IAMPORT, PgConfigurationStatus.ACTIVE)
                .orElse(null);
        if (configuration == null) {
            log.warn("포트원 결제 취소: ACTIVE IAMPORT 설정 없음 tenantId={}", tenantId);
            return null;
        }
        if (configuration.getApprovalStatus() != ApprovalStatus.APPROVED) {
            log.warn("포트원 결제 취소: 미승인 설정 configId={}", configuration.getConfigId());
            return null;
        }

        String apiSecret = decryptSecret(configuration);
        if (!StringUtils.hasText(apiSecret)) {
            log.warn("포트원 결제 취소: API Secret 복호화 실패 configId={}", configuration.getConfigId());
            return null;
        }
        return apiSecret;
    }

    private boolean postCancel(
            String paymentId, String apiSecret, String reason, BigDecimal amount, String idempotencyKey) {
        URI uri = UriComponentsBuilder
                .fromHttpUrl(PORTONE_V2_PAYMENTS_BASE_URL)
                .pathSegment(paymentId, "cancel")
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, "PortOne " + apiSecret);
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (StringUtils.hasText(idempotencyKey)) {
            headers.set(HEADER_IDEMPOTENCY_KEY, idempotencyKey);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("reason", reason);
        if (amount != null) {
            body.put(CANCEL_BODY_AMOUNT, amount.longValueExact());
        }

        try {
            String json = objectMapper.writeValueAsString(body);
            ResponseEntity<String> response = restTemplate.exchange(
                    uri, HttpMethod.POST, new HttpEntity<>(json, headers), String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("포트원 V2 결제 취소 완료 paymentId={}, amount={}",
                        paymentId, amount != null ? amount : "FULL");
                return true;
            }
            log.warn(
                    "포트원 결제 취소 실패 paymentId={}, status={}",
                    paymentId,
                    response.getStatusCode());
        } catch (RestClientException e) {
            log.warn("포트원 결제 취소 HTTP 오류 paymentId={}: {}", paymentId, e.getMessage());
        } catch (Exception e) {
            log.warn("포트원 결제 취소 요청 실패 paymentId={}: {}", paymentId, e.getMessage());
        }

        // cancel 실패 후에도 이미 취소 상태면 멱등 성공 (외부 취소·재시도 레이스).
        // 부분 취소는 PARTIAL_CANCELLED 가 기존 취소분일 수 있어 호출측이 누적 취소액으로 판정한다.
        if (amount == null && isAlreadyCancelledOnPortOne(paymentId, apiSecret)) {
            log.info("포트원 V2 결제 취소 실패 후 이미 취소 확인(멱등 성공) paymentId={}", paymentId);
            return true;
        }
        return false;
    }

    /**
     * PortOne GET 결제 상태가 CANCELLED/PARTIAL_CANCELLED 인지 확인한다.
     *
     * @param paymentId PortOne 결제 ID
     * @param apiSecret PortOne API Secret
     * @return 이미 취소면 true
     */
    boolean isAlreadyCancelledOnPortOne(String paymentId, String apiSecret) {
        Optional<String> statusOpt = fetchPaymentStatus(paymentId, apiSecret);
        if (statusOpt.isEmpty()) {
            return false;
        }
        String status = statusOpt.get();
        return STATUS_CANCELLED.equalsIgnoreCase(status)
                || STATUS_PARTIAL_CANCELLED.equalsIgnoreCase(status);
    }

    private Optional<String> fetchPaymentStatus(String paymentId, String apiSecret) {
        return fetchPayment(paymentId, apiSecret)
                .map(PortOneV2PaymentCancelService::readStatus)
                .filter(StringUtils::hasText);
    }

    private static String readStatus(JsonNode root) {
        JsonNode statusNode = root.get("status");
        if (statusNode == null || statusNode.isNull()) {
            return null;
        }
        String status = statusNode.asText(null);
        return status == null || status.isBlank() ? null : status.trim();
    }

    /**
     * {@code amount.cancelled} — 없으면 0.
     */
    private BigDecimal readCancelledAmount(JsonNode root) {
        JsonNode amountNode = root.get(PAYMENT_FIELD_AMOUNT);
        JsonNode cancelledNode = amountNode != null ? amountNode.get(PAYMENT_FIELD_AMOUNT_CANCELLED) : null;
        if (cancelledNode == null || cancelledNode.isNull() || !cancelledNode.isNumber()) {
            return BigDecimal.ZERO;
        }
        return cancelledNode.decimalValue();
    }

    private Optional<JsonNode> fetchPayment(String paymentId, String apiSecret) {
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
                log.warn(
                        "포트원 결제 상태 조회 실패 paymentId={}, status={}",
                        paymentId,
                        response.getStatusCode());
                return Optional.empty();
            }
            return Optional.ofNullable(objectMapper.readTree(response.getBody()));
        } catch (RestClientException e) {
            log.warn("포트원 결제 상태 조회 HTTP 오류 paymentId={}: {}", paymentId, e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.warn("포트원 결제 상태 조회 실패 paymentId={}: {}", paymentId, e.getMessage());
            return Optional.empty();
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
}
