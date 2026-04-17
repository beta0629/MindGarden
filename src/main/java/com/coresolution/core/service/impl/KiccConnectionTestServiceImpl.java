package com.coresolution.core.service.impl;

import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.ConnectionTestResponse;
import com.coresolution.core.service.KiccEasypayEndpointResolver;
import com.coresolution.core.service.PgConnectionTestService;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
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

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * KICC 이지페이 온라인 결제 API 연결 테스트.
 * {@code POST /api/trades/retrieveTransaction} 로 도메인·상점ID(Mall ID) 검증 (공식 문서: 거래상태 조회).
 * 승인·취소용 HMAC(상점 검증키) 전체 검증은 Phase 2에서 구현한다.
 *
 * @author CoreSolution
 * @since 2026-04-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KiccConnectionTestServiceImpl implements PgConnectionTestService {

    private static final ZoneId KICC_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter YYYYMMDD = DateTimeFormatter.BASIC_ISO_DATE;

    private final RestTemplate restTemplate;
    private final PersonalDataEncryptionService encryptionService;
    private final ObjectMapper objectMapper;
    private final KiccEasypayEndpointResolver kiccEasypayEndpointResolver;

    @Override
    public ConnectionTestResponse testConnection(TenantPgConfiguration configuration) {
        log.info("KICC 이지페이 연결 테스트 시작: configId={}", configuration.getConfigId());

        try {
            String mallId = configuration.getMerchantId() != null
                    ? configuration.getMerchantId().trim()
                    : "";
            if (mallId.isEmpty()) {
                return failed("KICC 이지페이 연결 테스트: 상점 ID(Mall ID)가 비어 있습니다. 가맹점 ID 필드에 KICC Mall ID를 입력해 주세요.");
            }

            String apiKey = encryptionService.decrypt(configuration.getApiKeyEncrypted());
            String secretKey = encryptionService.decrypt(configuration.getSecretKeyEncrypted());
            if (apiKey == null || apiKey.trim().isEmpty()) {
                return failed("API Key가 비어 있습니다. KICC에서 안내한 상점 연동용 키를 API 키에 입력해 주세요.");
            }
            if (secretKey == null || secretKey.trim().isEmpty()) {
                return failed("Secret Key(상점 검증키)가 비어 있습니다. 승인·취소 시 메시지 인증(HMAC)에 사용됩니다.");
            }

            boolean testMode = Boolean.TRUE.equals(configuration.getTestMode());
            String host = kiccEasypayEndpointResolver.resolveApiHost(configuration);
            if (host == null || host.isBlank()) {
                return failed("KICC 이지페이 API 호스트가 설정되지 않았습니다. 테넌트 PG 설정의 호스트 오버라이드 또는 "
                        + "배포 설정 mindgarden.pg.kicc.easypay.host-test / host-prod 를 확인해 주세요.");
            }
            String url = kiccEasypayEndpointResolver.resolveRetrieveTransactionUrl(configuration);

            String shopTransactionId = "MG-CONN-" + UUID.randomUUID().toString().replace("-", "");
            if (shopTransactionId.length() > 60) {
                shopTransactionId = shopTransactionId.substring(0, 60);
            }
            String transactionDate = LocalDate.now(KICC_ZONE).format(YYYYMMDD);

            Map<String, String> body = new LinkedHashMap<>();
            body.put("mallId", mallId);
            body.put("shopTransactionId", shopTransactionId);
            body.put("transactionDate", transactionDate);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(new MediaType("application", "json", StandardCharsets.UTF_8));
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response;
            try {
                response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            } catch (RestClientException e) {
                log.warn("KICC API HTTP 오류: {}", e.getMessage());
                return failed("KICC 이지페이 API에 연결할 수 없습니다. 방화벽(HTTPS 443), API 호스트(" + host
                        + "), 테스트/운영 모드·호스트 오버라이드 설정을 확인해 주세요. 상세: " + e.getMessage());
            }

            String raw = response.getBody();
            if (raw == null || raw.isBlank()) {
                return failed("KICC 이지페이 API 응답이 비어 있습니다.");
            }

            JsonNode root = objectMapper.readTree(raw);
            String resCd = textOrEmpty(root, "resCd");
            String resMsg = textOrEmpty(root, "resMsg");

            if (isLikelySuccess(resCd, resMsg)) {
                String detailJson = buildDetails(host, testMode, resCd, resMsg, shopTransactionId, transactionDate, true);
                return ConnectionTestResponse.builder()
                        .success(true)
                        .result("SUCCESS")
                        .message(buildSuccessMessage(resCd, resMsg))
                        .testedAt(LocalDateTime.now())
                        .details(detailJson)
                        .build();
            }

            String detailJson = buildDetails(host, testMode, resCd, resMsg, shopTransactionId, transactionDate, false);
            return ConnectionTestResponse.builder()
                    .success(false)
                    .result("FAILED")
                    .message("KICC 이지페이 응답 오류: [" + resCd + "] " + resMsg
                            + " — Mall ID·키·테스트/운영 모드가 KICC에 등록된 값과 일치하는지 확인해 주세요.")
                    .testedAt(LocalDateTime.now())
                    .details(detailJson)
                    .build();

        } catch (Exception e) {
            log.error("KICC 이지페이 연결 테스트 예외: {}", e.getMessage(), e);
            return failed("KICC 이지페이 연결 테스트 처리 중 오류: " + e.getMessage());
        }
    }

    private static String buildSuccessMessage(String resCd, String resMsg) {
        if ("0000".equals(resCd)) {
            return "KICC 이지페이 API 연결 및 거래상태 조회 응답이 정상(resCd=0000)입니다.";
        }
        return "KICC 이지페이 API에 연결되었습니다. 조회용 더미 거래번호로 인해 응답코드는 "
                + resCd + "일 수 있습니다(상세: " + resMsg + "). Mall ID·도메인은 유효한 것으로 간주됩니다.";
    }

    /**
     * 거래상태 조회는 존재하지 않는 거래에 대해 비정상 코드를 반환할 수 있으나,
     * 상점 미등록·인증 오류 등은 실패로 분류한다.
     */
    private static boolean isLikelySuccess(String resCd, String resMsg) {
        if ("0000".equals(resCd)) {
            return true;
        }
        if (resMsg == null || resMsg.isBlank()) {
            return false;
        }
        if (isAuthOrMallFailure(resMsg)) {
            return false;
        }
        return true;
    }

    private static boolean isAuthOrMallFailure(String resMsg) {
        String m = resMsg;
        return m.contains("미등록")
                || m.contains("유효하지 않")
                || m.contains("유효하지 않은")
                || m.contains("인증 실패")
                || m.contains("인증실패")
                || m.contains("상점오류")
                || m.contains("상점 오류")
                || m.contains("상점정보")
                || m.contains("키 오류")
                || m.contains("키오류")
                || m.contains("전자서명")
                || m.contains("검증 실패");
    }

    private String buildDetails(
            String host,
            boolean testMode,
            String resCd,
            String resMsg,
            String shopTransactionId,
            String transactionDate,
            boolean success) {
        try {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("host", host);
            map.put("testMode", testMode);
            map.put("endpoint", KiccEasypayEndpointResolver.retrieveTransactionPath());
            map.put("resCd", resCd);
            map.put("resMsg", resMsg);
            map.put("shopTransactionId", shopTransactionId);
            map.put("transactionDate", transactionDate);
            map.put("docsNote", "Phase 2: 승인·취소·msgAuthValue(HMAC-SHA256, 상점 검증키) 연동");
            map.put("connectivitySuccess", success);
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{\"note\":\"details serialization failed\"}";
        }
    }

    private static String textOrEmpty(JsonNode root, String field) {
        if (root == null || !root.has(field) || root.get(field).isNull()) {
            return "";
        }
        return root.get(field).asText("");
    }

    private ConnectionTestResponse failed(String message) {
        return ConnectionTestResponse.builder()
                .success(false)
                .result("FAILED")
                .message(message)
                .testedAt(LocalDateTime.now())
                .build();
    }

    @Override
    public boolean supports(PgProvider provider) {
        return provider == PgProvider.KICC;
    }
}
