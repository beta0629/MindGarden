package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.MappingSettlementNotificationCopy;
import com.coresolution.consultation.constant.MobilePushCanonicalTypes;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.MappingSettlementScenario;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.util.MobilePushMessageFormatter;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * {@link MappingSettlementNotificationHelper} 구현. PG Payment 플로우와 분리된 매칭 API 전용 발화.
 *
 * @author MindGarden
 * @since 2026-05-18
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MappingSettlementNotificationHelperImpl implements MappingSettlementNotificationHelper {

    private static final String FALLBACK_CONSULTANT_NAME = "상담사";

    private final ConsultationMessageService consultationMessageService;
    private final MobilePushDispatchService mobilePushDispatchService;
    private final CommonCodeService commonCodeService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Override
    public void notifyAfterMappingSettlement(
            ConsultantClientMapping mapping, String tenantId, MappingSettlementScenario scenario) {
        if (mapping == null || mapping.getId() == null || scenario == null) {
            return;
        }
        Long consultantUserId = mapping.getConsultant() != null ? mapping.getConsultant().getId() : null;
        Long clientUserId = mapping.getClient() != null ? mapping.getClient().getId() : null;
        if (consultantUserId == null || clientUserId == null) {
            log.warn("매칭 정산 알림 생략: consultant/client 없음 mappingId={}", mapping.getId());
            return;
        }
        String tid = tenantId != null && !tenantId.isBlank() ? tenantId : mapping.getTenantId();
        if (tid == null || tid.isBlank()) {
            log.warn("매칭 정산 알림 생략: tenantId 없음 mappingId={}", mapping.getId());
            return;
        }

        try {
            sendInAppMessages(mapping, scenario, consultantUserId, clientUserId);
        } catch (Exception ex) {
            log.error("매칭 정산 인앱 알림 실패: mappingId={}, scenario={}", mapping.getId(), scenario, ex);
        }

        try {
            dispatchPush(mapping, tid, scenario, consultantUserId, clientUserId);
        } catch (Exception ex) {
            log.warn("매칭 정산 푸시 실패: mappingId={}, scenario={}", mapping.getId(), scenario, ex);
        }

        try {
            dispatchExternalNotification(mapping, tid, scenario);
        } catch (Exception ex) {
            log.warn("매칭 정산 알림톡/SMS 실패: mappingId={}, scenario={}", mapping.getId(), scenario, ex);
        }
    }

    /**
     * 알림톡→SMS 폴백(비차단). {@link MappingSettlementScenario#MAPPING_APPROVED}는 전용 템플릿 없음 — 제외.
     */
    private void dispatchExternalNotification(
            ConsultantClientMapping mapping, String tenantId, MappingSettlementScenario scenario) {
        switch (scenario) {
            case PAYMENT_CONFIRMED, DEPOSIT_CONFIRMED -> sendPaymentCompletedToClient(mapping, tenantId);
            case MAPPING_APPROVED -> {
                // PAYMENT_COMPLETED 알림톡 템플릿 없음 — 이번 배치 제외
            }
            default -> {
            }
        }
    }

    private void sendPaymentCompletedToClient(ConsultantClientMapping mapping, String tenantId) {
        Long clientUserId = mapping.getClient() != null ? mapping.getClient().getId() : null;
        if (clientUserId == null) {
            return;
        }
        User client = findUserByTenant(tenantId, clientUserId).orElse(null);
        if (client == null) {
            log.warn("매칭 정산 알림톡/SMS 생략: 내담자 User 미조회 mappingId={}, clientId={}",
                    mapping.getId(), clientUserId);
            return;
        }
        long amount = resolvePaymentAmountLong(mapping);
        String packageName = resolvePackageName(mapping);
        String consultantName = resolveConsultantDisplayName(mapping, tenantId);
        notificationService.sendPaymentCompleted(client, amount, packageName, consultantName);
    }

    private Optional<User> findUserByTenant(String tenantId, Long userId) {
        if (tenantId == null || tenantId.isBlank() || userId == null) {
            return Optional.empty();
        }
        return userRepository.findByTenantIdAndId(tenantId, userId);
    }

    private static long resolvePaymentAmountLong(ConsultantClientMapping mapping) {
        Long amount = mapping.getPaymentAmount() != null && mapping.getPaymentAmount() > 0
                ? mapping.getPaymentAmount()
                : mapping.getPackagePrice();
        return amount != null && amount > 0 ? amount : 0L;
    }

    private String resolveConsultantDisplayName(ConsultantClientMapping mapping, String tenantId) {
        if (mapping.getConsultant() == null || mapping.getConsultant().getId() == null) {
            return FALLBACK_CONSULTANT_NAME;
        }
        return findUserByTenant(tenantId, mapping.getConsultant().getId())
                .map(u -> u.getName() != null && !u.getName().isBlank() ? u.getName() : FALLBACK_CONSULTANT_NAME)
                .orElse(FALLBACK_CONSULTANT_NAME);
    }

    private void sendInAppMessages(
            ConsultantClientMapping mapping,
            MappingSettlementScenario scenario,
            Long consultantUserId,
            Long clientUserId) {
        String packageName = resolvePackageName(mapping);
        String amountLabel = resolveAmountLabel(mapping);
        String consultantRole = getRoleCode(UserRole.CONSULTANT.name());
        String messageType = getMessageType(MappingSettlementNotificationCopy.MESSAGE_TYPE_PAYMENT);

        switch (scenario) {
            case PAYMENT_CONFIRMED -> {
                String body = String.format(
                        MappingSettlementNotificationCopy.BODY_PAYMENT_CONFIRMED_FMT, packageName, amountLabel);
                sendToClient(consultantUserId, clientUserId, consultantRole, messageType,
                        MappingSettlementNotificationCopy.TITLE_PAYMENT_CONFIRMED, body);
            }
            case DEPOSIT_CONFIRMED -> {
                String body = String.format(
                        MappingSettlementNotificationCopy.BODY_DEPOSIT_CONFIRMED_FMT, packageName, amountLabel);
                sendToClient(consultantUserId, clientUserId, consultantRole, messageType,
                        MappingSettlementNotificationCopy.TITLE_DEPOSIT_CONFIRMED, body);
            }
            case MAPPING_APPROVED -> {
                String body = String.format(
                        MappingSettlementNotificationCopy.BODY_MAPPING_APPROVED_FMT, packageName);
                sendToClient(consultantUserId, clientUserId, consultantRole, messageType,
                        MappingSettlementNotificationCopy.TITLE_MAPPING_APPROVED, body);
                sendToConsultant(consultantUserId, clientUserId, messageType,
                        MappingSettlementNotificationCopy.TITLE_MAPPING_APPROVED, body);
            }
            default -> {
            }
        }
    }

    private void sendToClient(
            Long consultantUserId,
            Long clientUserId,
            String consultantRole,
            String messageType,
            String title,
            String body) {
        consultationMessageService.sendMessage(
                consultantUserId,
                clientUserId,
                null,
                consultantRole,
                title,
                body,
                messageType,
                false,
                false);
    }

    private void sendToConsultant(
            Long consultantUserId, Long clientUserId, String messageType, String title, String body) {
        consultationMessageService.sendMessage(
                consultantUserId,
                clientUserId,
                null,
                getRoleCode(UserRole.CLIENT.name()),
                title,
                body,
                messageType,
                false,
                false);
    }

    private void dispatchPush(
            ConsultantClientMapping mapping,
            String tenantId,
            MappingSettlementScenario scenario,
            Long consultantUserId,
            Long clientUserId) {
        Long mappingId = mapping.getId();
        String packageName = resolvePackageName(mapping);
        String amountLabel = resolveAmountLabel(mapping);
        switch (scenario) {
            case PAYMENT_CONFIRMED -> mobilePushDispatchService.dispatchMappingSettlement(
                    tenantId,
                    mappingId,
                    clientUserId,
                    consultantUserId,
                    false,
                    MobilePushCanonicalTypes.PAYMENT_COMPLETED,
                    "mapping-payment-confirmed",
                    MappingSettlementNotificationCopy.PUSH_TITLE_PAYMENT,
                    MobilePushMessageFormatter.buildMappingPaymentConfirmedPushBody(packageName, amountLabel),
                    null);
            case DEPOSIT_CONFIRMED -> mobilePushDispatchService.dispatchMappingSettlement(
                    tenantId,
                    mappingId,
                    clientUserId,
                    consultantUserId,
                    false,
                    MobilePushCanonicalTypes.PAYMENT_COMPLETED,
                    "mapping-deposit-confirmed",
                    MappingSettlementNotificationCopy.PUSH_TITLE_DEPOSIT,
                    MobilePushMessageFormatter.buildMappingDepositConfirmedPushBody(packageName, amountLabel),
                    null);
            // 시나리오 #1 — MAPPING_APPROVED 푸시는 내담자 단독(2026-05-23 라운드 정책 정정).
            // 상담사 인앱 메시지는 sendInAppMessages 에서 별도 발화하므로 푸시는 client only 로 한정.
            // BODY_PUSH_APPROVED_CONSULTANT 는 dedupe·로깅 보존을 위해 인자로 전달하되 includeConsultant=false 로 무시된다.
            case MAPPING_APPROVED -> mobilePushDispatchService.dispatchMappingSettlement(
                    tenantId,
                    mappingId,
                    clientUserId,
                    consultantUserId,
                    false,
                    MobilePushCanonicalTypes.MAPPING_APPROVED,
                    "mapping-approved",
                    MappingSettlementNotificationCopy.PUSH_TITLE_APPROVED,
                    MappingSettlementNotificationCopy.BODY_PUSH_APPROVED_CLIENT,
                    MappingSettlementNotificationCopy.BODY_PUSH_APPROVED_CONSULTANT);
            default -> {
            }
        }
    }

    private static String resolvePackageName(ConsultantClientMapping mapping) {
        if (mapping.getPackageName() != null && !mapping.getPackageName().isBlank()) {
            return mapping.getPackageName();
        }
        return MappingSettlementNotificationCopy.FALLBACK_PACKAGE_NAME;
    }

    private static String resolveAmountLabel(ConsultantClientMapping mapping) {
        Long amount = mapping.getPaymentAmount() != null && mapping.getPaymentAmount() > 0
                ? mapping.getPaymentAmount()
                : mapping.getPackagePrice();
        return amount != null && amount > 0 ? String.valueOf(amount) : MappingSettlementNotificationCopy.FALLBACK_AMOUNT;
    }

    private String getRoleCode(String roleName) {
        try {
            String codeValue = commonCodeService.getCodeValue("ROLE", roleName);
            return codeValue != null ? codeValue : roleName;
        } catch (Exception e) {
            return roleName;
        }
    }

    private String getMessageType(String messageTypeName) {
        try {
            String codeValue = commonCodeService.getCodeValue("MESSAGE_TYPE", messageTypeName);
            return codeValue != null ? codeValue : messageTypeName;
        } catch (Exception e) {
            return messageTypeName;
        }
    }
}
