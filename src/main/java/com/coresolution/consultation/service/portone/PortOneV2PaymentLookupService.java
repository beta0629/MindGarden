package com.coresolution.consultation.service.portone;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * 포트원 V2 REST 결제 다건 조회 — 카드 승인번호로 paymentId 해석.
 * <p>
 * {@code GET https://api.portone.io/payments?requestBody=...} (URI-encoded JSON)
 * + {@code Authorization: PortOne {apiSecret}}. 조회 실패 시 GET + body 폴백.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-09-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PortOneV2PaymentLookupService {

    /** 포트원 V2 REST 결제 다건 조회 베이스 URL (공개 API 호스트). */
    static final String PORTONE_V2_PAYMENTS_BASE_URL = "https://api.portone.io/payments";

    /** PAID 상태 문자열 (포트원 V2 Payment.status). */
    static final String STATUS_PAID = "PAID";

    /** 카드 승인번호 텍스트 검색 필드. */
    static final String TEXT_SEARCH_FIELD_CARD_APPROVAL_NUMBER = "CARD_APPROVAL_NUMBER";

    /** 다건 조회 페이지 크기 (승인번호 단건 매칭용). */
    static final int LOOKUP_PAGE_SIZE = 10;

    private final TenantPgConfigurationRepository tenantPgConfigurationRepository;
    private final PersonalDataEncryptionService encryptionService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 카드 승인번호로 PortOne PAID 결제 ID 를 조회한다. fail-closed.
     *
     * @param tenantId            테넌트 ID
     * @param cardApprovalNumber  카드 승인번호
     * @param expectedAmount      기대 금액 ({@code amount.total})
     * @param orderPublicId       주문 공개 ID (있으면 customData 매칭에 사용, blank 허용)
     * @return 단건 매칭 시 PortOne payment {@code id}, 그 외 empty
     */
    public Optional<String> findPaidPaymentIdByCardApprovalNumber(
            String tenantId,
            String cardApprovalNumber,
            BigDecimal expectedAmount,
            String orderPublicId) {
        if (tenantId == null || tenantId.isBlank()) {
            return Optional.empty();
        }
        if (cardApprovalNumber == null || cardApprovalNumber.isBlank()) {
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
            log.warn("포트원 승인번호 조회: ACTIVE IAMPORT 설정 없음 tenantId={}", tenantId);
            return Optional.empty();
        }
        if (configuration.getApprovalStatus() != ApprovalStatus.APPROVED) {
            log.warn("포트원 승인번호 조회: 미승인 설정 configId={}", configuration.getConfigId());
            return Optional.empty();
        }

        String storeId = configuration.getStoreId();
        if (storeId == null || storeId.isBlank()) {
            log.warn("포트원 승인번호 조회: storeId 없음 configId={}", configuration.getConfigId());
            return Optional.empty();
        }

        String apiSecret = decryptSecret(configuration);
        if (apiSecret == null || apiSecret.isBlank()) {
            log.warn("포트원 승인번호 조회: API Secret 복호화 실패 configId={}", configuration.getConfigId());
            return Optional.empty();
        }

        Optional<String> bodyOpt = fetchPaymentsBody(storeId.trim(), cardApprovalNumber.trim(), apiSecret);
        if (bodyOpt.isEmpty()) {
            return Optional.empty();
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(bodyOpt.get());
        } catch (Exception e) {
            log.warn("포트원 승인번호 조회: JSON 파싱 실패: {}", e.getMessage());
            return Optional.empty();
        }

        JsonNode items = root.get("items");
        if (items == null || !items.isArray() || items.isEmpty()) {
            log.warn("포트원 승인번호 조회: 결과 없음 tenantId={}", tenantId);
            return Optional.empty();
        }

        List<JsonNode> paidAmountMatches = new ArrayList<>();
        for (JsonNode item : items) {
            if (item == null || item.isNull()) {
                continue;
            }
            String status = text(item, "status");
            if (!STATUS_PAID.equalsIgnoreCase(status)) {
                continue;
            }
            BigDecimal total = extractTotalAmount(item);
            if (total == null || total.compareTo(expectedAmount) != 0) {
                continue;
            }
            paidAmountMatches.add(item);
        }

        Optional<String> resolved = resolveUniquePaymentId(paidAmountMatches, orderPublicId);
        if (resolved.isEmpty()) {
            log.warn(
                    "포트원 승인번호 조회: 단건 매칭 실패 tenantId={}, paidAmountMatches={}",
                    tenantId,
                    paidAmountMatches.size());
        }
        return resolved;
    }

    /**
     * PAID+금액 후보에서 orderPublicId/customData 규칙을 적용해 단건 paymentId 를 고른다.
     */
    private Optional<String> resolveUniquePaymentId(List<JsonNode> paidAmountMatches, String orderPublicId) {
        if (paidAmountMatches.isEmpty()) {
            return Optional.empty();
        }

        String trimmedOrderId = orderPublicId == null ? null : orderPublicId.trim();
        boolean requireOrder = trimmedOrderId != null && !trimmedOrderId.isBlank();

        if (!requireOrder) {
            if (paidAmountMatches.size() != 1) {
                return Optional.empty();
            }
            return paymentIdOf(paidAmountMatches.get(0));
        }

        List<JsonNode> customDataMatches = new ArrayList<>();
        List<JsonNode> missingCustomData = new ArrayList<>();
        for (JsonNode item : paidAmountMatches) {
            JsonNode customData = item.get("customData");
            if (customData == null || customData.isNull()) {
                missingCustomData.add(item);
                continue;
            }
            if (customDataMatchesOrder(customData, trimmedOrderId)) {
                customDataMatches.add(item);
            }
        }

        if (customDataMatches.size() == 1) {
            return paymentIdOf(customDataMatches.get(0));
        }
        if (customDataMatches.size() > 1) {
            return Optional.empty();
        }

        // customData 매칭 없음 — customData 부재 + PAID+금액 단건일 때만 허용
        if (missingCustomData.size() == 1 && paidAmountMatches.size() == 1) {
            return paymentIdOf(missingCustomData.get(0));
        }
        return Optional.empty();
    }

    private static boolean customDataMatchesOrder(JsonNode customData, String orderPublicId) {
        if (customData.isObject()) {
            String fromField = text(customData, "orderPublicId");
            if (orderPublicId.equals(fromField)) {
                return true;
            }
            return customData.toString().contains(orderPublicId);
        }
        if (customData.isTextual()) {
            String raw = customData.asText();
            if (raw == null || raw.isBlank()) {
                return false;
            }
            if (orderPublicId.equals(raw.trim())) {
                return true;
            }
            return raw.contains(orderPublicId);
        }
        return customData.toString().contains(orderPublicId);
    }

    private static Optional<String> paymentIdOf(JsonNode paymentNode) {
        String id = text(paymentNode, "id");
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(id.trim());
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

    private Optional<String> fetchPaymentsBody(String storeId, String cardApprovalNumber, String apiSecret) {
        String requestBodyJson;
        try {
            requestBodyJson = objectMapper.writeValueAsString(buildGetPaymentsBody(storeId, cardApprovalNumber));
        } catch (Exception e) {
            log.warn("포트원 승인번호 조회: requestBody 직렬화 실패: {}", e.getMessage());
            return Optional.empty();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, "PortOne " + apiSecret);

        Optional<String> viaQuery = exchangeGetWithQueryParam(requestBodyJson, headers);
        if (viaQuery.isPresent()) {
            return viaQuery;
        }
        return exchangeGetWithBody(requestBodyJson, headers);
    }

    private Map<String, Object> buildGetPaymentsBody(String storeId, String cardApprovalNumber) {
        Map<String, Object> page = new LinkedHashMap<>();
        page.put("number", 0);
        page.put("size", LOOKUP_PAGE_SIZE);

        Map<String, Object> textSearchItem = new LinkedHashMap<>();
        textSearchItem.put("field", TEXT_SEARCH_FIELD_CARD_APPROVAL_NUMBER);
        textSearchItem.put("value", cardApprovalNumber);

        Map<String, Object> filter = new LinkedHashMap<>();
        filter.put("storeId", storeId);
        filter.put("status", List.of(STATUS_PAID));
        filter.put("textSearch", List.of(textSearchItem));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("page", page);
        body.put("filter", filter);
        return body;
    }

    private Optional<String> exchangeGetWithQueryParam(String requestBodyJson, HttpHeaders headers) {
        try {
            String encoded = URLEncoder.encode(requestBodyJson, StandardCharsets.UTF_8);
            URI uri = URI.create(PORTONE_V2_PAYMENTS_BASE_URL + "?requestBody=" + encoded);
            ResponseEntity<String> response = restTemplate.exchange(
                    uri, HttpMethod.GET, new HttpEntity<>(headers), String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("포트원 승인번호 조회(query) 실패 status={}", response.getStatusCode());
                return Optional.empty();
            }
            return Optional.of(response.getBody());
        } catch (RestClientException e) {
            log.warn("포트원 승인번호 조회(query) HTTP 오류: {}", e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.warn("포트원 승인번호 조회(query) 오류: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * PortOne {@code x-portone-query-or-body} 폴백 — GET + JSON body.
     */
    private Optional<String> exchangeGetWithBody(String requestBodyJson, HttpHeaders headers) {
        try {
            HttpHeaders bodyHeaders = new HttpHeaders();
            bodyHeaders.putAll(headers);
            bodyHeaders.setContentType(MediaType.APPLICATION_JSON);
            URI uri = URI.create(PORTONE_V2_PAYMENTS_BASE_URL);
            ResponseEntity<String> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    new HttpEntity<>(requestBodyJson, bodyHeaders),
                    String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("포트원 승인번호 조회(body) 실패 status={}", response.getStatusCode());
                return Optional.empty();
            }
            return Optional.of(response.getBody());
        } catch (RestClientException e) {
            log.warn("포트원 승인번호 조회(body) HTTP 오류: {}", e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.warn("포트원 승인번호 조회(body) 오류: {}", e.getMessage());
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
