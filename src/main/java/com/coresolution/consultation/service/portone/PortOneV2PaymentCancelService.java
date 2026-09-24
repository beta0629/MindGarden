package com.coresolution.consultation.service.portone;

import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
 * 포트원 V2 REST 결제 전액 취소(cancel).
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
@RequiredArgsConstructor
public class PortOneV2PaymentCancelService {

    /** 포트원 V2 결제 cancel 베이스 URL. */
    static final String PORTONE_V2_PAYMENTS_BASE_URL = "https://api.portone.io/payments";

    /** 포트원 V2 Payment.status — 전액 취소. */
    static final String STATUS_CANCELLED = "CANCELLED";

    /** 포트원 V2 Payment.status — 부분 취소. */
    static final String STATUS_PARTIAL_CANCELLED = "PARTIAL_CANCELLED";

    private final TenantPgConfigurationRepository tenantPgConfigurationRepository;
    private final PersonalDataEncryptionService encryptionService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

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
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(paymentId)) {
            return false;
        }
        String cancelReason = StringUtils.hasText(reason)
                ? reason.trim()
                : ShopRefundConstants.DEFAULT_PORTONE_CANCEL_REASON;

        TenantPgConfiguration configuration = tenantPgConfigurationRepository
                .findByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                        tenantId, PgProvider.IAMPORT, PgConfigurationStatus.ACTIVE)
                .orElse(null);
        if (configuration == null) {
            log.warn("포트원 결제 취소: ACTIVE IAMPORT 설정 없음 tenantId={}", tenantId);
            return false;
        }
        if (configuration.getApprovalStatus() != ApprovalStatus.APPROVED) {
            log.warn("포트원 결제 취소: 미승인 설정 configId={}", configuration.getConfigId());
            return false;
        }

        String apiSecret = decryptSecret(configuration);
        if (!StringUtils.hasText(apiSecret)) {
            log.warn("포트원 결제 취소: API Secret 복호화 실패 configId={}", configuration.getConfigId());
            return false;
        }

        String trimmedPaymentId = paymentId.trim();
        if (isAlreadyCancelledOnPortOne(trimmedPaymentId, apiSecret)) {
            log.info("포트원 V2 결제 이미 취소됨(멱등 성공) paymentId={}", trimmedPaymentId);
            return true;
        }

        return postCancel(trimmedPaymentId, apiSecret, cancelReason);
    }

    private boolean postCancel(String paymentId, String apiSecret, String reason) {
        URI uri = UriComponentsBuilder
                .fromHttpUrl(PORTONE_V2_PAYMENTS_BASE_URL)
                .pathSegment(paymentId, "cancel")
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, "PortOne " + apiSecret);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("reason", reason);

        try {
            String json = objectMapper.writeValueAsString(body);
            ResponseEntity<String> response = restTemplate.exchange(
                    uri, HttpMethod.POST, new HttpEntity<>(json, headers), String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("포트원 V2 결제 전액 취소 완료 paymentId={}", paymentId);
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

        // cancel 실패 후에도 이미 취소 상태면 멱등 성공 (외부 취소·재시도 레이스)
        if (isAlreadyCancelledOnPortOne(paymentId, apiSecret)) {
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
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode statusNode = root.get("status");
            if (statusNode == null || statusNode.isNull()) {
                return Optional.empty();
            }
            String status = statusNode.asText(null);
            if (status == null || status.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(status.trim());
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
