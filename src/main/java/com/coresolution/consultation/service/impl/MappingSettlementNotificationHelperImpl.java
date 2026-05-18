package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.MappingSettlementNotificationCopy;
import com.coresolution.consultation.constant.MobilePushCanonicalTypes;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.MappingSettlementScenario;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.util.MobilePushMessageFormatter;
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

    private final ConsultationMessageService consultationMessageService;
    private final MobilePushDispatchService mobilePushDispatchService;
    private final CommonCodeService commonCodeService;

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
            case MAPPING_APPROVED -> mobilePushDispatchService.dispatchMappingSettlement(
                    tenantId,
                    mappingId,
                    clientUserId,
                    consultantUserId,
                    true,
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
