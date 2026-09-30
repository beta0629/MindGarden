package com.coresolution.consultation.service.portone;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopLatePaymentConstants;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.exception.ShopOrderClosedForPaymentException;
import com.coresolution.consultation.exception.ShopPaymentNotApprovableException;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
import com.coresolution.consultation.service.ShopLatePaymentOutcome;
import com.coresolution.consultation.service.ShopLatePaymentRefundService;
import com.coresolution.consultation.service.ShopOrderPaymentState;
import com.coresolution.consultation.util.OutsideTransactionScope;
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
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

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
 * (2) 없으면 주문 참조 후보: {@code merchantOrderReference}, {@code orderId}, {@code payment.merchantUid},
 *     {@code customData.orderPublicId} (객체 또는 JSON 문자열)
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
    private final ClientShopCheckoutService clientShopCheckoutService;
    private final ShopLatePaymentRefundService shopLatePaymentRefundService;

    /**
     * 포트원 V2 웹훅을 처리한다. 서명 검증 실패 시 4xx, 일시적 오류 시 5xx.
     *
     * @param rawBody           원시 요청 바디
     * @param webhookTimestamp  webhook-timestamp 헤더
     * @param webhookSignature  webhook-signature 헤더
     * @param webhookId         webhook-id 헤더 (로깅용, 선택)
     * @return HTTP 응답 엔티티
     */
    // 외부 트랜잭션 없이 실행 — 늦은 결제 PG 취소 동안 DB 커넥션을 잡지 않고, 승인·상태 변경은 각 서비스의 짧은 트랜잭션에서 반영
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public ResponseEntity<Map<String, Object>> handleWebhook(
            byte[] rawBody,
            String webhookTimestamp,
            String webhookSignature,
            String webhookId) {
        // NOT_SUPPORTED 동기화 범위에 EntityManager 가 묶이면 커넥션을 끝까지 쥐므로 범위 밖에서 처리
        return OutsideTransactionScope.call(
                () -> processWebhook(rawBody, webhookTimestamp, webhookSignature, webhookId));
    }

    private ResponseEntity<Map<String, Object>> processWebhook(
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
            // 닫힌 주문 늦은 결제: 결제 행을 이 트랜잭션에서 건드리기 전에 판정(가드가 별도 트랜잭션으로 반영)
            Optional<ResponseEntity<Map<String, Object>>> lateResponse =
                    handleLatePaymentOnClosedOrder(tenantId, paymentId, paymentRow, targetStatus, webhookId, body);
            if (lateResponse.isPresent()) {
                return lateResponse.get();
            }
            // 동일 상태 재전송 시 상태 전이·부가 로직(ERP 등)을 반복하지 않음 — 웹훅 페이로드만 최신으로 유지
            String externalResponse = dataNode != null ? dataNode.toString() : rawUtf8;
            if (paymentRow.getStatus() == targetStatus) {
                paymentService.recordWebhookPayload(tenantId, paymentId, rawUtf8, externalResponse);
                syncShopOrderOnPaymentStatus(tenantId, paymentRow, targetStatus);
                log.info("포트원 웹훅: 동일 상태 재전송(멱등) paymentId={}, status={}, webhookId={}",
                        paymentId, targetStatus, webhookId);
                body.put("status", "ok");
                body.put("paymentId", paymentId);
                body.put("deduplicated", Boolean.TRUE);
                return ResponseEntity.ok(body);
            }
            // CANCELLED/REFUNDED: 서명 검증된 웹훅이 PG 증거. cancelledAt 선기록으로
            // updatePaymentStatus fail-closed 가드의 PortOne REST 레이스를 피한다.
            if ((targetStatus == Payment.PaymentStatus.CANCELLED
                    || targetStatus == Payment.PaymentStatus.REFUNDED)
                    && paymentRow.getCancelledAt() == null) {
                paymentRow.setCancelledAt(LocalDateTime.now());
                paymentRepository.save(paymentRow);
            }
            // 쇼핑 주문 PAID: ERP/매핑 UnexpectedRollback 경로 회피 — shop-safe approve
            if (targetStatus == Payment.PaymentStatus.APPROVED) {
                try {
                    paymentService.approveShopOrderPayment(paymentId);
                } catch (IllegalArgumentException nonShop) {
                    paymentService.updatePaymentStatus(paymentId, targetStatus);
                } catch (ShopOrderClosedForPaymentException | OptimisticLockingFailureException raced) {
                    // 열린 주문으로 판정한 뒤 사용자 취소·만료가 먼저 커밋됨 → 늦은 PAID 로 처리
                    return handleLatePaidAfterRace(tenantId, paymentId, paymentRow.getOrderId(), webhookId, body, raced);
                }
            } else {
                paymentService.updatePaymentStatus(paymentId, targetStatus);
            }
            // NOT_SUPPORTED 호출 동안 영속성 컨텍스트가 유지돼 여기서 재조회하면 승인 전 캐시 엔티티가 돌아온다.
            // 그 스냅샷을 저장하면 승인 커밋과 버전이 충돌하므로 짧은 트랜잭션에서 재조회·기록한다.
            paymentService.recordWebhookPayload(tenantId, paymentId, rawUtf8, externalResponse);
            // CANCELLED/REFUNDED: clinic 체인 보강(멱등). PaymentService sync 와 이중 호출 OK.
            if (targetStatus == Payment.PaymentStatus.CANCELLED
                    || targetStatus == Payment.PaymentStatus.REFUNDED) {
                syncShopOrderOnPaymentStatus(tenantId, paymentRow, targetStatus);
            }
            log.info("포트원 웹훅 처리 완료 paymentId={}, type={}, webhookId={}, testMode={}",
                    paymentId, eventType, webhookId, configuration.getTestMode());
            body.put("status", "ok");
            body.put("paymentId", paymentId);
            return ResponseEntity.ok(body);
        } catch (RuntimeException e) {
            log.error("포트원 웹훅: 결제 반영 실패 tenantId={}, webhookId={}", tenantId, webhookId, e);
            body.put("message", "결제 반영 실패");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
        } finally {
            // 메서드 반환 직후 Spring 이 commit → afterCommit 을 호출한다.
            // finally 에서 즉시 clear 하면 afterCommit fulfill 시 tenant null 레이스 발생.
            // afterCompletion 으로 미뤄 commit/afterCommit 동안 TenantContext 를 유지한다.
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCompletion(int status) {
                        TenantContextHolder.clear();
                    }
                });
            } else {
                TenantContextHolder.clear();
            }
        }
    }

    /**
     * 취소·만료된 주문에 PAID 가 늦게 오거나, 이미 다른 결제로 PAID 인 주문에 또 PAID 가 오면(이중 결제)
     * 승인하지 않고 PortOne 전액 취소한다.
     * 자동 취소가 실패하면 5xx 로 응답해 포트원 재시도를 받는다.
     */
    private Optional<ResponseEntity<Map<String, Object>>> handleLatePaymentOnClosedOrder(
            String tenantId,
            String paymentId,
            Payment paymentRow,
            Payment.PaymentStatus targetStatus,
            String webhookId,
            Map<String, Object> body) {
        boolean pgCancelEvent = targetStatus == Payment.PaymentStatus.CANCELLED
                || targetStatus == Payment.PaymentStatus.REFUNDED;
        boolean lateRefunded = paymentRow.getStatus() == Payment.PaymentStatus.REFUNDED
                && ShopLatePaymentConstants.isAutoRefundFailureReason(paymentRow.getFailureReason());
        if (lateRefunded && targetStatus != Payment.PaymentStatus.APPROVED) {
            // 자동 취소로 생긴 Cancelled·지연된 Ready 등 — REFUNDED 를 되돌리지 않는다
            log.info("포트원 웹훅: 늦은 결제 자동 취소 완료 건 후속 이벤트(멱등) paymentId={}, target={}, webhookId={}",
                    paymentId, targetStatus, webhookId);
            body.put("status", ShopLatePaymentConstants.WEBHOOK_STATUS_LATE_PAYMENT_REFUNDED);
            body.put("paymentId", paymentId);
            body.put("deduplicated", Boolean.TRUE);
            return Optional.of(ResponseEntity.ok(body));
        }
        boolean refundRequired = paymentRow.getStatus() == Payment.PaymentStatus.REFUND_REQUIRED;
        if (refundRequired && !pgCancelEvent && targetStatus != Payment.PaymentStatus.APPROVED) {
            log.info("포트원 웹훅: 환불 필요 건 비대상 이벤트 무시 paymentId={}, target={}, webhookId={}",
                    paymentId, targetStatus, webhookId);
            body.put("status", "ignored");
            body.put("paymentId", paymentId);
            return Optional.of(ResponseEntity.ok(body));
        }
        boolean shouldGuard = targetStatus == Payment.PaymentStatus.APPROVED || (pgCancelEvent && refundRequired);
        if (!shouldGuard) {
            return Optional.empty();
        }
        ShopLatePaymentOutcome outcome = shopLatePaymentRefundService.refundIfOrderClosed(tenantId, paymentId);
        if (outcome == null || outcome == ShopLatePaymentOutcome.NOT_APPLICABLE) {
            return Optional.empty();
        }
        return Optional.of(buildLatePaymentResponse(outcome, tenantId, paymentId, webhookId, body));
    }

    /**
     * 승인 트랜잭션의 주문 잠금 재확인에서 닫힌 주문(또는 낙관적 락 충돌)을 만난 경우.
     * 주문이 닫혔으면 500 대신 늦은 PAID 자동 환불로 처리하고, 열려 있으면 원래 예외를 다시 던진다(재시도).
     * 열린 주문의 승인 불가 결제({@link ShopPaymentNotApprovableException}, H9b)는 이 결제만 PG 자동 취소한다.
     */
    private ResponseEntity<Map<String, Object>> handleLatePaidAfterRace(
            String tenantId,
            String paymentId,
            String orderPublicId,
            String webhookId,
            Map<String, Object> body,
            RuntimeException raced) {
        log.warn("포트원 웹훅: 승인 중 주문 닫힘/동시 변경 감지 — 늦은 결제 재판정 paymentId={}, webhookId={}, cause={}",
                paymentId, webhookId, raced.getClass().getSimpleName());
        // H9b: 열린 주문인데 결제 건이 승인 불가 — 주문은 열린 채 이 결제만 PG 자동 취소
        ShopLatePaymentOutcome outcome = raced instanceof ShopPaymentNotApprovableException
                ? shopLatePaymentRefundService.refundUnapprovableOnOpenOrder(tenantId, paymentId)
                : shopLatePaymentRefundService.refundIfOrderClosed(tenantId, paymentId);
        if (outcome == null || outcome == ShopLatePaymentOutcome.NOT_APPLICABLE) {
            if (isAlreadyApprovedByConcurrentWebhook(tenantId, orderPublicId, paymentId)) {
                // 같은 PAID 의 동시 수신: 다른 요청이 승인·주문 PAID 를 먼저 커밋 — 한 번만 반영된 상태
                log.info("포트원 웹훅: 동시 중복 수신 — 이미 승인 반영됨(멱등) paymentId={}, webhookId={}",
                        paymentId, webhookId);
                body.put("status", "ok");
                body.put("paymentId", paymentId);
                body.put("deduplicated", Boolean.TRUE);
                return ResponseEntity.ok(body);
            }
            throw raced;
        }
        return buildLatePaymentResponse(outcome, tenantId, paymentId, webhookId, body);
    }

    private boolean isAlreadyApprovedByConcurrentWebhook(String tenantId, String orderPublicId, String paymentId) {
        Optional<ShopOrderPaymentState> state =
                paymentService.findShopOrderPaymentState(tenantId, orderPublicId, paymentId);
        return state != null
                && state.isPresent()
                && state.get().paymentStatus() == Payment.PaymentStatus.APPROVED
                && state.get().orderStatus() == ShopClientOrderStatus.PAID;
    }

    private ResponseEntity<Map<String, Object>> buildLatePaymentResponse(
            ShopLatePaymentOutcome outcome,
            String tenantId,
            String paymentId,
            String webhookId,
            Map<String, Object> body) {
        if (outcome == ShopLatePaymentOutcome.REFUND_REQUIRED) {
            log.error("포트원 웹훅: 닫힌 주문 늦은 결제 자동 취소 실패 tenantId={}, paymentId={}, webhookId={}",
                    tenantId, paymentId, webhookId);
            body.put("message", ShopLatePaymentConstants.WEBHOOK_MESSAGE_REFUND_REQUIRED);
            body.put("paymentId", paymentId);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
        }
        if (outcome == ShopLatePaymentOutcome.REFUND_IN_PROGRESS) {
            // 동시 중복 수신 — 다른 요청이 PG 취소를 진행 중. 취소 API 는 부르지 않고 재시도로 최종 결과를 받는다.
            log.warn("포트원 웹훅: 늦은·중복 결제 자동 취소 진행 중(중복 수신) tenantId={}, paymentId={}, webhookId={}",
                    tenantId, paymentId, webhookId);
            body.put("message", ShopLatePaymentConstants.WEBHOOK_MESSAGE_REFUND_IN_PROGRESS);
            body.put("paymentId", paymentId);
            return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
        }
        log.info("포트원 웹훅: 닫힌 주문 늦은 결제 자동 취소 outcome={}, paymentId={}, webhookId={}",
                outcome, paymentId, webhookId);
        body.put("status", ShopLatePaymentConstants.WEBHOOK_STATUS_LATE_PAYMENT_REFUNDED);
        body.put("paymentId", paymentId);
        body.put("deduplicated", outcome == ShopLatePaymentOutcome.ALREADY_REFUNDED);
        return ResponseEntity.ok(body);
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
                // 제품 SSOT: 전액 환불만. PartialCancelled→REFUNDED 매핑 시 전액 clinic reverse 오동작.
                // 무시(200) — 전액 취소는 Transaction.Cancelled 로만 처리.
                return Optional.empty();
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
            textNested(data, "payment", "merchantUid"),
            resolveOrderPublicIdFromCustomData(data)
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

    private void syncShopOrderOnPaymentStatus(
            String tenantId, Payment payment, Payment.PaymentStatus status) {
        String orderPublicId = payment.getOrderId();
        if (orderPublicId == null || orderPublicId.isBlank()) {
            return;
        }
        try {
            if (status == Payment.PaymentStatus.APPROVED) {
                clientShopCheckoutService.completeOrderOnPaymentApproved(tenantId, orderPublicId);
            } else if (status == Payment.PaymentStatus.FAILED) {
                clientShopCheckoutService.releaseOrderHoldOnPaymentFailure(tenantId, orderPublicId);
            } else if (status == Payment.PaymentStatus.CANCELLED
                    || status == Payment.PaymentStatus.REFUNDED) {
                clientShopCheckoutService.reconcileOrderOnPaymentCancelOrRefund(tenantId, orderPublicId);
            }
        } catch (RuntimeException e) {
            log.error(
                    "포트원 웹훅: 쇼핑 주문 연동 실패 tenantId={}, orderPublicId={}, status={}",
                    tenantId,
                    orderPublicId,
                    status,
                    e);
            // APPROVED·FAILED·취소/환불 동기화는 fail-closed: 삼키면 PG 재시도 불가·PENDING 고아 잔존.
            if (status == Payment.PaymentStatus.APPROVED
                    || status == Payment.PaymentStatus.FAILED
                    || status == Payment.PaymentStatus.CANCELLED
                    || status == Payment.PaymentStatus.REFUNDED) {
                throw e;
            }
        }
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

    /**
     * 포트원 {@code customData} 가 객체이거나 JSON 문자열일 때 {@code orderPublicId} 를 꺼낸다.
     *
     * @param data 웹훅 {@code data} 노드
     * @return orderPublicId 또는 null
     */
    private String resolveOrderPublicIdFromCustomData(JsonNode data) {
        if (data == null || data.isNull() || !data.has("customData")) {
            return null;
        }
        JsonNode customData = data.get("customData");
        if (customData == null || customData.isNull()) {
            return null;
        }
        if (customData.isObject()) {
            return text(customData, "orderPublicId");
        }
        if (customData.isTextual()) {
            String raw = customData.asText();
            if (raw == null || raw.isBlank()) {
                return null;
            }
            try {
                JsonNode parsed = objectMapper.readTree(raw);
                return text(parsed, "orderPublicId");
            } catch (Exception e) {
                log.debug("포트원 웹훅: customData JSON 문자열 파싱 실패: {}", e.getMessage());
                return null;
            }
        }
        return null;
    }
}
