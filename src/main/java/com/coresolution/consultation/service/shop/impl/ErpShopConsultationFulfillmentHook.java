package com.coresolution.consultation.service.shop.impl;

import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopSessionCountConstants;
import com.coresolution.consultation.dto.shop.ShopConsultationFulfillmentContext;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.shop.ShopConsultationFulfillmentHook;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담 패키지 PAID 이행 훅 — Path A(추가 회기 가산) / Path B(미결제 패키지 활성화).
 *
 * <p>Path B ({@link MappingStatus#PENDING_PAYMENT}): 패키지 total 위에 {@code addSessions} 하지 않는다.
 * {@link AdminService#confirmAndActivate} 로 confirmPayment → confirmDeposit → approveMapping 을 수행한다
 * (confirmDeposit 이 remaining 을 total 에서 채움). 온라인 결제·회기권 스펙:
 * {@code docs/project-management/ONLINE_PAYMENT_CATALOG_CHECKOUT_SPEC.md},
 * ERP 흐름: {@code .cursor/skills/core-solution-erp/SKILL.md}.</p>
 *
 * <p>Path A ({@link MappingStatus#ACTIVE} / {@link MappingStatus#SESSIONS_EXHAUSTED}):
 * {@code addSessions} 후 {@link AdminService#confirmPayment}(4arg).</p>
 *
 * <p>{@link MappingStatus#PAYMENT_CONFIRMED}: 미입금 패키지(remaining 0·deposit 미확인)면
 * confirmDeposit → approveMapping 활성화. 이미 회기가 있으면 Path A 가산.</p>
 *
 * <p>입금 INCOME ensure 는 이 훅과 같은 트랜잭션에 넣지 않는다.
 * {@link com.coresolution.consultation.service.impl.ShopOrderFulfillmentServiceImpl} 이
 * 회기 활성화(REQUIRES_NEW #1)와 {@code ensureConsultationDepositIncome}(REQUIRES_NEW #2)를 분리한다.
 * ensure 실패가 이미 커밋된 회기를 롤백하지 않게 하기 위함이다.</p>
 *
 * <p>Path B 재시도: 활성화가 커밋된 뒤 INCOME 만 실패하면 status 는 ACTIVE(또는 SESSIONS_EXHAUSTED)이고
 * 입금 확인·remaining &gt; 0 이다. 이때 Path A {@code addSessions} 를 다시 하면 회기가 이중 가산된다.
 * 이 경우는 회기 부여를 건너뛰고 호출측 INCOME ensure 만 남긴다.
 * ACTIVE 이고 remaining 이 0 이며 {@code sessionsToGrant &gt; 0} 인 추가 구매, 또는
 * paymentReference 가 다른 주문인 재구매는 Path A 를 유지한다.</p>
 *
 * <p>{@link MappingStatus#TERMINATED} / {@link MappingStatus#CANCELLED} /
 * {@link MappingStatus#INACTIVE} 등은 fail-closed.</p>
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ErpShopConsultationFulfillmentHook implements ShopConsultationFulfillmentHook {

    private final AdminService adminService;
    private final ConsultantClientMappingRepository consultantClientMappingRepository;

    @Override
    public void onConsultationPackagePaid(ShopConsultationFulfillmentContext context) {
        Long mappingId = context.getMappingId();
        if (mappingId == null) {
            log.debug(
                    "Consultation ERP hook skipped — no mappingId: tenantId={}, orderPublicId={}",
                    context.getTenantId(),
                    context.getOrderPublicId());
            return;
        }

        String tenantId = context.getTenantId();
        String previousTenant = TenantContextHolder.getTenantId();
        try {
            TenantContextHolder.setTenantId(tenantId);
            fulfillConsultationMapping(tenantId, mappingId, context);
            log.info(
                    "Consultation fulfillment completed: tenantId={}, mappingId={}, orderPublicId={},"
                            + " amount={}, sessionsToGrant={}",
                    tenantId,
                    mappingId,
                    context.getOrderPublicId(),
                    context.getLineTotalMinor(),
                    context.getSessionsToGrant());
        } finally {
            if (previousTenant != null) {
                TenantContextHolder.setTenantId(previousTenant);
            } else {
                TenantContextHolder.clear();
            }
        }
    }

    /**
     * 매핑 상태에 따라 Path A(가산) 또는 Path B(활성화)를 수행한다.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param context 이행 컨텍스트
     */
    private void fulfillConsultationMapping(
            String tenantId, Long mappingId, ShopConsultationFulfillmentContext context) {
        ConsultantClientMapping mapping = consultantClientMappingRepository
                .findByTenantIdAndId(tenantId, mappingId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "매핑을 찾을 수 없습니다: mappingId=" + mappingId));
        MappingStatus status = mapping.getStatus();

        if (isPathBSessionsAlreadyGranted(mapping, context)) {
            log.info(
                    "Shop Path B sessions already granted — skip addSessions/confirmAndActivate"
                            + " (income ensure is a separate TX): tenantId={}, mappingId={}, status={},"
                            + " remaining={}, depositConfirmed={}, paymentStatus={}, paymentReference={}",
                    tenantId,
                    mappingId,
                    status,
                    mapping.getRemainingSessions(),
                    mapping.getDepositConfirmed(),
                    mapping.getPaymentStatus(),
                    mapping.getPaymentReference());
            return;
        }

        if (status == MappingStatus.PENDING_PAYMENT) {
            activatePendingPaymentPackage(tenantId, mappingId, mapping, context);
            return;
        }

        if (status == MappingStatus.PAYMENT_CONFIRMED) {
            if (isUnpaidPackageAwaitingDeposit(mapping)) {
                activatePaymentConfirmedPackage(tenantId, mappingId, mapping, context);
                return;
            }
            grantSessionsThenConfirmPayment(tenantId, mappingId, mapping, context);
            return;
        }

        if (status == MappingStatus.ACTIVE || status == MappingStatus.SESSIONS_EXHAUSTED) {
            grantSessionsThenConfirmPayment(tenantId, mappingId, mapping, context);
            return;
        }

        throw new IllegalStateException(
                ShopCheckoutConstants.MSG_SESSION_GRANT_MAPPING_NOT_ACTIVE
                        + " mappingId="
                        + mappingId
                        + ", status="
                        + status);
    }

    /**
     * Path B — PENDING_PAYMENT 패키지를 confirmAndActivate 로 활성화한다 (addSessions 금지).
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param mapping 매핑 엔티티
     * @param context 이행 컨텍스트
     */
    private void activatePendingPaymentPackage(
            String tenantId,
            Long mappingId,
            ConsultantClientMapping mapping,
            ShopConsultationFulfillmentContext context) {
        preparePackageTotalsForActivation(tenantId, mapping, context);
        long paymentAmount = resolveActivationPaymentAmount(mapping, context);
        String paymentReference = ShopCheckoutConstants.consultationPaymentReference(context.getOrderPublicId());
        adminService.confirmAndActivate(
                mappingId,
                ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD,
                paymentReference,
                paymentAmount,
                null);
        log.info(
                "Shop Path B activate (PENDING_PAYMENT): tenantId={}, mappingId={}, paymentAmount={}, totalSessions={}",
                tenantId,
                mappingId,
                paymentAmount,
                mapping.getTotalSessions());
    }

    /**
     * PAYMENT_CONFIRMED 미입금 패키지 — confirmDeposit → approveMapping (confirmPayment 생략).
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param mapping 매핑 엔티티
     * @param context 이행 컨텍스트
     */
    private void activatePaymentConfirmedPackage(
            String tenantId,
            Long mappingId,
            ConsultantClientMapping mapping,
            ShopConsultationFulfillmentContext context) {
        preparePackageTotalsForActivation(tenantId, mapping, context);
        String paymentReference = ShopCheckoutConstants.consultationPaymentReference(context.getOrderPublicId());
        ConsultantClientMapping afterDeposit = adminService.confirmDeposit(mappingId, paymentReference);
        MappingStatus statusAfterDeposit = afterDeposit.getStatus();
        if (statusAfterDeposit != MappingStatus.SESSIONS_EXHAUSTED) {
            adminService.approveMapping(
                    mappingId, ShopCheckoutConstants.CONSULTATION_FULFILLMENT_ACTIVATE_ACTOR);
        }
        log.info(
                "Shop Path B activate (PAYMENT_CONFIRMED): tenantId={}, mappingId={}, statusAfterDeposit={}, totalSessions={}",
                tenantId,
                mappingId,
                statusAfterDeposit,
                afterDeposit.getTotalSessions());
    }

    /**
     * Path B 활성화가 이미 커밋된 같은 주문 재시도인지.
     * <p>
     * 쇼핑 최초 구매는 {@link MappingStatus#PENDING_PAYMENT} 로 시작한다.
     * 회기 TX 커밋 후 입금 INCOME TX 만 실패하면 재시도 시 status 가 ACTIVE/SESSIONS_EXHAUSTED,
     * 입금 확인, remaining &gt; 0 이다. 여기서 Path A {@code addSessions} 를 하면 회기가 두 배가 된다.
     * </p>
     * <p>
     * paymentReference 가 있고 이번 주문 공개 ID 를 포함하지 않으면 다른 주문의 Path A 재구매로 보고
     * 건너뛰지 않는다. reference 가 없으면(레거시) 입금 확인+remaining &gt; 0 만으로 이중 가산을 막는다.
     * remaining 이 0 이면 추가 구매(Path A)이므로 false.
     * </p>
     *
     * @param mapping 매핑
     * @param context 이번 이행 컨텍스트
     * @return 회기 부여를 건너뛰면 true
     */
    private static boolean isPathBSessionsAlreadyGranted(
            ConsultantClientMapping mapping, ShopConsultationFulfillmentContext context) {
        MappingStatus status = mapping.getStatus();
        if (status != MappingStatus.ACTIVE && status != MappingStatus.SESSIONS_EXHAUSTED) {
            return false;
        }
        int remaining = mapping.getRemainingSessions() != null ? mapping.getRemainingSessions() : 0;
        if (remaining <= 0) {
            return false;
        }
        if (!isDepositAlreadyConfirmed(mapping)) {
            return false;
        }
        return !isDifferentShopOrderReference(mapping, context);
    }

    /**
     * 입금이 이미 확인된 매핑인지. {@code depositConfirmed} 또는 입금 후 paymentStatus.
     *
     * @param mapping 매핑
     * @return 입금 확인이면 true
     */
    private static boolean isDepositAlreadyConfirmed(ConsultantClientMapping mapping) {
        if (Boolean.TRUE.equals(mapping.getDepositConfirmed())) {
            return true;
        }
        ConsultantClientMapping.PaymentStatus paymentStatus = mapping.getPaymentStatus();
        return paymentStatus == ConsultantClientMapping.PaymentStatus.CONFIRMED
                || paymentStatus == ConsultantClientMapping.PaymentStatus.APPROVED
                || paymentStatus == ConsultantClientMapping.PaymentStatus.DEP;
    }

    /**
     * paymentReference 가 이번 주문이 아닌 다른 쇼핑 주문을 가리키는지.
     *
     * @param mapping 매핑
     * @param context 이행 컨텍스트
     * @return 다른 주문 reference 이면 true (Path A 유지)
     */
    private static boolean isDifferentShopOrderReference(
            ConsultantClientMapping mapping, ShopConsultationFulfillmentContext context) {
        String paymentReference = mapping.getPaymentReference();
        String orderPublicId = context.getOrderPublicId();
        if (!StringUtils.hasText(paymentReference) || !StringUtils.hasText(orderPublicId)) {
            return false;
        }
        return !paymentReference.contains(orderPublicId);
    }

    /**
     * Path A — ACTIVE/SESSIONS_EXHAUSTED(또는 회기 있는 PAYMENT_CONFIRMED)에 회기 가산 후 confirmPayment.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param mapping 매핑 엔티티
     * @param context 이행 컨텍스트
     */
    private void grantSessionsThenConfirmPayment(
            String tenantId,
            Long mappingId,
            ConsultantClientMapping mapping,
            ShopConsultationFulfillmentContext context) {
        int sessionsToGrant = context.getSessionsToGrant();
        if (sessionsToGrant >= ShopSessionCountConstants.MIN_SESSION_COUNT) {
            mapping.addSessions(sessionsToGrant);
            consultantClientMappingRepository.save(mapping);
            log.info(
                    "Shop Path A session grant: tenantId={}, mappingId={}, sessionsAdded={}, total={}, remaining={}, status={}",
                    tenantId,
                    mappingId,
                    sessionsToGrant,
                    mapping.getTotalSessions(),
                    mapping.getRemainingSessions(),
                    mapping.getStatus());
        } else {
            log.warn(
                    "Shop session grant skipped — invalid sessionsToGrant: tenantId={}, mappingId={}, value={}",
                    tenantId,
                    mappingId,
                    sessionsToGrant);
        }
        adminService.confirmPayment(
                mappingId,
                ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD,
                ShopCheckoutConstants.consultationPaymentReference(context.getOrderPublicId()),
                context.getLineTotalMinor());
    }

    /**
     * 활성화 전 totalSessions·금액 필드를 보정한다. 가산(addSessions)하지 않는다.
     *
     * @param tenantId 테넌트 ID
     * @param mapping 매핑 엔티티
     * @param context 이행 컨텍스트
     */
    private void preparePackageTotalsForActivation(
            String tenantId, ConsultantClientMapping mapping, ShopConsultationFulfillmentContext context) {
        int sessionsToGrant = context.getSessionsToGrant();
        Integer total = mapping.getTotalSessions();
        if ((total == null || total < ShopSessionCountConstants.MIN_SESSION_COUNT)
                && sessionsToGrant >= ShopSessionCountConstants.MIN_SESSION_COUNT) {
            mapping.setTotalSessions(sessionsToGrant);
            if (!StringUtils.hasText(mapping.getPackageName()) && StringUtils.hasText(context.getSkuCode())) {
                mapping.setPackageName(context.getSkuCode());
            }
        }

        long lineTotal = context.getLineTotalMinor();
        if (lineTotal > 0) {
            if (mapping.getPackagePrice() == null || mapping.getPackagePrice() <= 0) {
                mapping.setPackagePrice(lineTotal);
            }
            if (mapping.getPaymentAmount() == null || mapping.getPaymentAmount() <= 0) {
                mapping.setPaymentAmount(lineTotal);
            }
        }

        consultantClientMappingRepository.save(mapping);

        Integer ensuredTotal = mapping.getTotalSessions();
        if (ensuredTotal == null || ensuredTotal < ShopSessionCountConstants.MIN_SESSION_COUNT) {
            throw new IllegalStateException(
                    "활성화할 패키지 회기(totalSessions)가 없습니다: mappingId="
                            + mapping.getId()
                            + ", sessionsToGrant="
                            + sessionsToGrant);
        }
        log.debug(
                "Shop Path B package prepared: tenantId={}, mappingId={}, totalSessions={}, packagePrice={}, paymentAmount={}",
                tenantId,
                mapping.getId(),
                mapping.getTotalSessions(),
                mapping.getPackagePrice(),
                mapping.getPaymentAmount());
    }

    /**
     * confirmAndActivate / ERP 에 넘길 결제 금액. lineTotal 우선, 없으면 매핑 금액. 유효하지 않으면 fail-closed.
     *
     * @param mapping 매핑
     * @param context 이행 컨텍스트
     * @return 양수 결제 금액
     */
    private static long resolveActivationPaymentAmount(
            ConsultantClientMapping mapping, ShopConsultationFulfillmentContext context) {
        long lineTotal = context.getLineTotalMinor();
        if (lineTotal > 0) {
            return lineTotal;
        }
        if (mapping.getPaymentAmount() != null && mapping.getPaymentAmount() > 0) {
            return mapping.getPaymentAmount();
        }
        if (mapping.getPackagePrice() != null && mapping.getPackagePrice() > 0) {
            return mapping.getPackagePrice();
        }
        throw new IllegalStateException(
                "활성화 결제 금액이 유효하지 않습니다: mappingId=" + mapping.getId());
    }

    /**
     * PAYMENT_CONFIRMED 이지만 아직 입금·회기 충전 전인 미결제 패키지인지.
     *
     * @param mapping 매핑
     * @return 미입금 패키지이면 true
     */
    private static boolean isUnpaidPackageAwaitingDeposit(ConsultantClientMapping mapping) {
        int remaining = mapping.getRemainingSessions() != null ? mapping.getRemainingSessions() : 0;
        boolean depositConfirmed = Boolean.TRUE.equals(mapping.getDepositConfirmed());
        return remaining <= 0 && !depositConfirmed;
    }
}
