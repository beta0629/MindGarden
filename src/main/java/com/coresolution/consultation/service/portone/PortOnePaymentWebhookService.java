package com.coresolution.consultation.service.portone;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
import com.coresolution.core.constants.TenantPgSettingsJsonKeys;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 포트원 결제모듈 V2 웹훅 처리 (원시 바디 기준 서명 검증 후 비즈니스 반영).
 * <p>
 * <b>테넌트 결정</b>: 페이로드 {@code data.storeId} 로 {@link TenantPgConfiguration} 을 조회한다.
 * DB 의 {@code pg_provider} 는 기존 스키마상 {@link PgProvider#IAMPORT} 로 저장한다(포트원·구 아임포트 공용 슬롯).
 * 조회된 설정의 {@code tenant_id} 로 {@link TenantContextHolder} 를 고정한 뒤 결제만 갱신한다.
 * </p>
 * <p>
 * <b>내부 {@link Payment} 매칭</b>: 포트원 V2 {@code data} 에서 아래 순으로 내부 {@code payment_id} 를 찾는다.
 * (1) 포트원 결제 ID 후보: {@code paymentId}, {@code id}, {@code payment.id}
 * (2) 없으면 주문 참조 후보: {@code merchantOrderReference}, {@code orderId}, {@code payment.merchantUid}
 * — 후자는 내부 {@code order_id} 와 일치하는 단일 행이 있을 때만 해당 행의 {@code paymentId} 를 사용한다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-15
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PortOnePaymentWebhookService {

    private final ObjectMapper objectMapper;
    private final PersonalDataEncryptionService encryptionService;
    private final TenantPgConfigurationRepository tenantPgConfigurationRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;

    /**
     * 포트원 V2 웹훅을 처리한다. 서명 검증 실패 시 4xx, 일시적 오류 시 5xx.
     *
     * @param rawBody           원시 요청 바디
     * @param webhookTimestamp  webhook-timestamp 헤더
     * @param webhookSignature  webhook-signature 헤더
     * @param webhookId         webhook-id 헤더 (로깅용, 선택)
     * @return HTTP 응답 엔티티
     */
    @Transactional
    public ResponseEntity<Map<String, Object>> handleWebhook(
            byte[] rawBody,
            String webhookTimestamp,
            String webhookSignature,
            String webhookId) {
        Map<String, Object> body = new HashMap<>();
        if (rawBody == null || rawBody.length == 0) {
            body.put("message", "빈 요청 바디");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }
        String rawUtf8 = new String(rawBody, StandardCharsets.UTF_8);
        if (webhookTimestamp == null || webhookTimestamp.isBlank()) {
            log.warn("포트원 웹훅: webhook-timestamp 누락 webhookId={}", webhookId);
            body.put("message", "webhook-timestamp 필요");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        }
        if (webhookSignature == null || webhookSignature.isBlank()) {
            log.warn("포트원 웹훅: webhook-signature 누락 webhookId={}", webhookId);
            body.put("message", "webhook-signature 필요");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(rawUtf8);
        } catch (Exception e) {
            log.warn("포트원 웹훅: JSON 파싱 실패 webhookId={}", webhookId, e);
            body.put("message", "JSON 형식 오류");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        String storeId = extractStoreId(root);
        if (storeId == null || storeId.isEmpty()) {
            log.warn("포트원 웹훅: storeId 없음 webhookId={}", webhookId);
            body.put("message", "storeId 없음");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        // storeId 는 포트원 콘솔 스토어 ID; PG 슬롯은 IAMPORT(포트원/구 아임포트 공용)
        List<TenantPgConfiguration> configs = tenantPgConfigurationRepository
                .findAllByStoreIdAndPgProviderAndStatusAndIsDeletedFalse(
                        storeId, PgProvider.IAMPORT, PgConfigurationStatus.ACTIVE);
        if (configs.isEmpty()) {
            log.warn("포트원 웹훅: ACTIVE PG 설정 없음 storeId={}, webhookId={}", storeId, webhookId);
            body.put("message", "스토어 PG 설정 없음");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
        }
        if (configs.size() > 1) {
            log.warn("포트원 웹훅: 동일 storeId ACTIVE 설정 다건 — 첫 건 사용 storeId={}, count={}",
                    storeId, configs.size());
        }
        TenantPgConfiguration configuration = configs.get(0);

        Optional<String> secretOpt = resolveWebhookSecret(configuration);
        if (secretOpt.isEmpty()) {
            log.warn("포트원 웹훅: portoneWebhookSecret 미설정 configId={}, webhookId={}",
                    configuration.getConfigId(), webhookId);
            body.put("message", "웹훅 시크릿 미설정");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
        }

        if (!PortOneWebhookSignatureVerifier.isValid(rawUtf8, webhookTimestamp, webhookSignature, secretOpt.get())) {
            log.warn("포트원 웹훅: 서명 검증 실패 storeId={}, webhookId={}", storeId, webhookId);
            body.put("message", "서명 검증 실패");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
        }

        String eventType = root.path("type").asText(null);
        JsonNode dataNode = root.get("data");

        Optional<Payment.PaymentStatus> mapped = mapEventToStatus(eventType);
        if (mapped.isEmpty()) {
            log.info("포트원 웹훅: 미지원 이벤트 무시(200) type={}, webhookId={}", eventType, webhookId);
            body.put("status", "ignored");
            body.put("message", "미지원 이벤트");
            return ResponseEntity.ok(body);
        }

        String tenantId = configuration.getTenantId();
        TenantContextHolder.setTenantId(tenantId);
        try {
            Optional<String> paymentIdOpt = resolvePaymentIdForUpdate(tenantId, dataNode);
            if (paymentIdOpt.isEmpty()) {
                log.warn("포트원 웹훅: 매칭 결제 없음 tenantId={}, type={}, webhookId={}",
                        tenantId, eventType, webhookId);
                body.put("status", "noop");
                body.put("message", "매칭 결제 없음");
                return ResponseEntity.ok(body);
            }
            String paymentId = paymentIdOpt.get();
            Optional<Payment> existing = paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId);
            if (existing.isEmpty()) {
                log.warn("포트원 웹훅: 결제 행 없음 tenantId={}, paymentId={}, webhookId={}",
                        tenantId, paymentId, webhookId);
                body.put("status", "noop");
                body.put("message", "매칭 결제 없음");
                return ResponseEntity.ok(body);
            }
            Payment.PaymentStatus targetStatus = mapped.get();
            Payment paymentRow = existing.get();
            // 동일 상태 재전송 시 상태 전이·부가 로직(ERP 등)을 반복하지 않음 — 웹훅 페이로드만 최신으로 유지
            if (paymentRow.getStatus() == targetStatus) {
                paymentRow.setWebhookData(rawUtf8);
                paymentRow.setExternalResponse(dataNode != null ? dataNode.toString() : rawUtf8);
                paymentRepository.save(paymentRow);
                log.info("포트원 웹훅: 동일 상태 재전송(멱등) paymentId={}, status={}, webhookId={}",
                        paymentId, targetStatus, webhookId);
                body.put("status", "ok");
                body.put("paymentId", paymentId);
                body.put("deduplicated", Boolean.TRUE);
                return ResponseEntity.ok(body);
            }
            paymentService.updatePaymentStatus(paymentId, targetStatus);
            paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId).ifPresent(p -> {
                p.setWebhookData(rawUtf8);
                p.setExternalResponse(dataNode != null ? dataNode.toString() : rawUtf8);
                paymentRepository.save(p);
            });
            log.info("포트원 웹훅 처리 완료 paymentId={}, type={}, webhookId={}", paymentId, eventType, webhookId);
            body.put("status", "ok");
            body.put("paymentId", paymentId);
            return ResponseEntity.ok(body);
        } catch (RuntimeException e) {
            log.error("포트원 웹훅: 결제 반영 실패 tenantId={}, webhookId={}", tenantId, webhookId, e);
            body.put("message", "결제 반영 실패");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
        } finally {
            TenantContextHolder.clear();
        }
    }

    private Optional<String> resolveWebhookSecret(TenantPgConfiguration configuration) {
        String json = configuration.getSettingsJson();
        if (json == null || json.isBlank()) {
            return Optional.empty();
        }
        try {
            JsonNode node = objectMapper.readTree(json);
            JsonNode secretNode = node.get(TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET);
            if (secretNode == null || secretNode.isNull()) {
                return Optional.empty();
            }
            String raw = secretNode.asText("");
            if (raw.isEmpty()) {
                return Optional.empty();
            }
            if (encryptionService.isEncrypted(raw)) {
                return Optional.ofNullable(encryptionService.decrypt(raw));
            }
            return Optional.of(raw);
        } catch (Exception e) {
            log.warn("포트원 웹훅: settings_json 처리 실패 configId={}", configuration.getConfigId(), e);
            return Optional.empty();
        }
    }

    private static String extractStoreId(JsonNode root) {
        JsonNode data = root.get("data");
        if (data != null && data.hasNonNull("storeId")) {
            return data.get("storeId").asText();
        }
        if (root.hasNonNull("storeId")) {
            return root.get("storeId").asText();
        }
        return null;
    }

    private Optional<Payment.PaymentStatus> mapEventToStatus(String type) {
        if (type == null) {
            return Optional.empty();
        }
        switch (type) {
            case PortOneV2WebhookConstants.EVENT_TRANSACTION_PAID:
                return Optional.of(Payment.PaymentStatus.APPROVED);
            case PortOneV2WebhookConstants.EVENT_TRANSACTION_VIRTUAL_ACCOUNT_ISSUED:
            case PortOneV2WebhookConstants.EVENT_TRANSACTION_READY:
                return Optional.of(Payment.PaymentStatus.PENDING);
            case PortOneV2WebhookConstants.EVENT_TRANSACTION_PAY_PENDING:
                return Optional.of(Payment.PaymentStatus.PROCESSING);
            case PortOneV2WebhookConstants.EVENT_TRANSACTION_FAILED:
                return Optional.of(Payment.PaymentStatus.FAILED);
            case PortOneV2WebhookConstants.EVENT_TRANSACTION_CANCELLED:
                return Optional.of(Payment.PaymentStatus.CANCELLED);
            case PortOneV2WebhookConstants.EVENT_TRANSACTION_PARTIAL_CANCELLED:
                return Optional.of(Payment.PaymentStatus.REFUNDED);
            default:
                return Optional.empty();
        }
    }

    /**
     * 포트원 V2 {@code data} 객체에서 내부 결제 레코드의 {@code paymentId} 문자열을 유추한다.
     *
     * @param tenantId 테넌트(웹훅에서 store 로 역추적한 설정의 tenantId)
     * @param data       웹훅 루트의 {@code data} 노드
     * @return {@link Payment#paymentId} 와 매칭되는 값
     */
    private Optional<String> resolvePaymentIdForUpdate(String tenantId, JsonNode data) {
        if (data == null || data.isNull()) {
            return Optional.empty();
        }
        String[] paymentCandidates = new String[] {
            text(data, "paymentId"),
            text(data, "id"),
            textNested(data, "payment", "id")
        };
        for (String candidate : paymentCandidates) {
            if (candidate == null || candidate.isEmpty()) {
                continue;
            }
            Optional<Payment> byPid = paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, candidate);
            if (byPid.isPresent()) {
                return Optional.of(candidate);
            }
        }
        String[] orderCandidates = new String[] {
            text(data, "merchantOrderReference"),
            text(data, "orderId"),
            textNested(data, "payment", "merchantUid")
        };
        for (String order : orderCandidates) {
            if (order == null || order.isEmpty()) {
                continue;
            }
            List<Payment> list = paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(tenantId, order);
            if (list.size() == 1) {
                return Optional.of(list.get(0).getPaymentId());
            }
        }
        return Optional.empty();
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.hasNonNull(field)) {
            return null;
        }
        String v = node.get(field).asText();
        return v.isEmpty() ? null : v;
    }

    private static String textNested(JsonNode node, String parent, String child) {
        if (node == null) {
            return null;
        }
        JsonNode p = node.get(parent);
        if (p == null || !p.hasNonNull(child)) {
            return null;
        }
        String v = p.get(child).asText();
        return v.isEmpty() ? null : v;
    }
}
