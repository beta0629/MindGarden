package com.coresolution.consultation.service.portone;

import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
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
 * @author MindGarden
 * @since 2026-09-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PortOneV2PaymentCancelService {

    /** 포트원 V2 결제 cancel 베이스 URL. */
    static final String PORTONE_V2_PAYMENTS_BASE_URL = "https://api.portone.io/payments";

    private final TenantPgConfigurationRepository tenantPgConfigurationRepository;
    private final PersonalDataEncryptionService encryptionService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 테넌트 ACTIVE IAMPORT 설정으로 포트원 V2 전액 취소를 호출한다.
     *
     * @param tenantId  테넌트 ID
     * @param paymentId 포트원/내부 결제 ID
     * @param reason    취소 사유
     * @return 성공 시 true
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

        return postCancel(paymentId.trim(), apiSecret, cancelReason);
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
            if (!response.getStatusCode().is2xxSuccessful()) {
                log.warn(
                        "포트원 결제 취소 실패 paymentId={}, status={}",
                        paymentId,
                        response.getStatusCode());
                return false;
            }
            log.info("포트원 V2 결제 전액 취소 완료 paymentId={}", paymentId);
            return true;
        } catch (RestClientException e) {
            log.warn("포트원 결제 취소 HTTP 오류 paymentId={}: {}", paymentId, e.getMessage());
            return false;
        } catch (Exception e) {
            log.warn("포트원 결제 취소 요청 실패 paymentId={}: {}", paymentId, e.getMessage());
            return false;
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
