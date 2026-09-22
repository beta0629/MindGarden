package com.coresolution.consultation.service.shop.impl;

import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopSessionCountConstants;
import com.coresolution.consultation.dto.shop.ShopConsultationFulfillmentContext;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.PaymentRepository;
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
 * (confirmDeposit 이 remaining 을 total 에서 채움). 환불 heal 후 재구매처럼 {@code rem==0} 이고
 * {@code total &lt;= used} 이면 활성화 전 {@code totalSessions = used + sessionsToGrant} 로 보정한다.
 * 온라인 결제·회기권 스펙:
 * {@code docs/project-management/ONLINE_PAYMENT_CATALOG_CHECKOUT_SPEC.md},
 * ERP 흐름: {@code .cursor/skills/core-solution-erp/SKILL.md}.</p>
 *
 * <p>Path A ({@link MappingStatus#ACTIVE} / {@link MappingStatus#SESSIONS_EXHAUSTED}):
 * {@code addSessions} 후 {@link AdminService#confirmPayment}(4arg).</p>
 *
 * <p>{@link MappingStatus#PAYMENT_CONFIRMED}: 미입금 패키지(remaining 0·deposit 미확인)면
 * Shop Payment APPROVED SSOT 확인 후, mapping.paymentStatus 가 CONFIRMED/PAY 가 아니면
 * {@link AdminService#confirmPayment} 로 heal 한 뒤 confirmDeposit → approveMapping.
 * 이미 회기가 있으면 Path A 가산.</p>
 *
 * <p>입금 INCOME ensure 는 회기 활성화와 같은 fulfill {@code REQUIRES_NEW} 원자 단위에서
 * {@link AdminService#ensureConsultationDepositIncomeInCurrentTransaction} 으로 수행한다.
 * INCOME 실패 시 회기도 롤백되어 반쪽 성공(재이행 필수)을 만들지 않는다.</p>
 *
 * <p>Path B 재시도: 활성화가 커밋된 뒤 INCOME 만 실패하면 status 는 ACTIVE(또는 SESSIONS_EXHAUSTED)이고
 * 입금 확인·remaining &gt; 0 이다. 이때 Path A {@code addSessions} 를 다시 하면 회기가 이중 가산된다.
 * 부분 Path B({@link MappingStatus#DEPOSIT_PENDING} / {@link MappingStatus#DEPOSIT_CONFIRMED})에서
 * 회기·입금은 끝났으나 approve 만 남은 경우도 회기 부여를 건너뛰고 {@code approveMapping} 만 재개한다.
 * {@link MappingStatus#PAYMENT_CONFIRMED}+rem&gt;0+입금 원장 OK 는 Path A {@code confirmPayment} 후
 * ACTIVE 로 승격되지 못한 잔여 — 회기 가산 없이 ACTIVE 로 heal 한다.
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
    private final PaymentRepository paymentRepository;

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
     * 매핑 상태에 따라 Path A(가산) 또는 Path B(활성화·재개)를 수행한다.
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
            resumeAfterPathBSessionsGranted(tenantId, mappingId, mapping, status);
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
     * Path B 회기·입금이 이미 반영된 재시도 — addSessions/confirmAndActivate 금지.
     * {@link MappingStatus#DEPOSIT_PENDING} 이면 approve 만 재개한다.
     * {@link MappingStatus#PENDING_PAYMENT} / {@link MappingStatus#DEPOSIT_CONFIRMED} 이면
     * status 를 {@link MappingStatus#DEPOSIT_PENDING} 으로 heal 한 뒤 approve 한다
     * ({@code approveByAdmin} 게이트 충족).
     * {@link MappingStatus#PAYMENT_CONFIRMED}+rem&gt;0 이면 홈 가독 ACTIVE 로 직접 승격한다
     * ({@code approveByAdmin} 은 DEPOSIT_PENDING 게이트라 우회).
     * {@link MappingStatus#SESSIONS_EXHAUSTED} / {@link MappingStatus#ACTIVE} 이면 approve 생략.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param mapping 매핑 엔티티
     * @param status 현재 매핑 상태
     * @author MindGarden
     * @since 2026-09-19
     */
    private void resumeAfterPathBSessionsGranted(
            String tenantId,
            Long mappingId,
            ConsultantClientMapping mapping,
            MappingStatus status) {
        // confirmPayment 스킵 경로 포함 — PortOne Path B 결제수단 CREDIT_CARD 강제
        forcePathBCreditCardPaymentMethod(mapping);

        if (status == MappingStatus.ACTIVE || status == MappingStatus.SESSIONS_EXHAUSTED) {
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

        if (status == MappingStatus.PAYMENT_CONFIRMED) {
            promoteHomeReadableActive(tenantId, mappingId, mapping, status);
            return;
        }

        if (status == MappingStatus.PENDING_PAYMENT || status == MappingStatus.DEPOSIT_CONFIRMED) {
            MappingStatus previousStatus = status;
            mapping.setStatus(MappingStatus.DEPOSIT_PENDING);
            consultantClientMappingRepository.save(mapping);
            log.info(
                    "Shop Path B heal/resume — normalize status to DEPOSIT_PENDING then approveMapping:"
                            + " tenantId={}, mappingId={}, previousStatus={}, remaining={}, depositConfirmed={}",
                    tenantId,
                    mappingId,
                    previousStatus,
                    mapping.getRemainingSessions(),
                    mapping.getDepositConfirmed());
        } else if (status == MappingStatus.DEPOSIT_PENDING) {
            log.info(
                    "Shop Path B resume — approveMapping only (sessions already granted):"
                            + " tenantId={}, mappingId={}, remaining={}, depositConfirmed={}",
                    tenantId,
                    mappingId,
                    mapping.getRemainingSessions(),
                    mapping.getDepositConfirmed());
        } else {
            log.info(
                    "Shop Path B sessions already granted — skip approve (unexpected status):"
                            + " tenantId={}, mappingId={}, status={}",
                    tenantId,
                    mappingId,
                    status);
            return;
        }

        adminService.approveMapping(
                mappingId, ShopCheckoutConstants.CONSULTATION_FULFILLMENT_ACTIVATE_ACTOR);
    }

    /**
     * rem&gt;0 매핑을 홈 KPI가 읽는 {@link MappingStatus#ACTIVE} 로 승격한다 (회기 가산 없음).
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param mapping 매핑 엔티티
     * @param previousStatus 승격 전 상태
     * @author MindGarden
     * @since 2026-09-19
     */
    private void promoteHomeReadableActive(
            String tenantId,
            Long mappingId,
            ConsultantClientMapping mapping,
            MappingStatus previousStatus) {
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setEndDate(null);
        consultantClientMappingRepository.save(mapping);
        log.info(
                "Shop Path B/A heal — promote to ACTIVE (home-readable, no addSessions):"
                        + " tenantId={}, mappingId={}, previousStatus={}, remaining={}, depositConfirmed={}",
                tenantId,
                mappingId,
                previousStatus,
                mapping.getRemainingSessions(),
                mapping.getDepositConfirmed());
    }

    /**
     * Path B — PENDING_PAYMENT 패키지 활성화. 결제 상태가 이미 진행된 경우 재개한다 (addSessions 금지).
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
        PaymentStatus paymentStatus = mapping.getPaymentStatus();

        // APPROVED + remaining/deposit 완료는 isPathBSessionsAlreadyGranted 에서 이미 처리됨.
        // 여기까지 온 APPROVED 는 회기 미부여·입금 불완전 → confirmAndActivate 금지(데이터 부정합).
        if (paymentStatus == PaymentStatus.APPROVED) {
            throw new IllegalStateException(
                    "PENDING_PAYMENT 인데 paymentStatus=APPROVED 이며 회기/입금이 불완전합니다"
                            + " (confirmAndActivate 금지, data corruption): mappingId="
                            + mappingId
                            + ", remaining="
                            + mapping.getRemainingSessions()
                            + ", depositConfirmed="
                            + mapping.getDepositConfirmed());
        }

        if (paymentStatus == PaymentStatus.CONFIRMED || paymentStatus == PaymentStatus.PAY) {
            activatePaymentConfirmedPackage(tenantId, mappingId, mapping, context);
            return;
        }

        requireApprovedShopPayment(tenantId, context.getOrderPublicId(), mappingId);

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
     * PAYMENT_CONFIRMED(또는 PENDING_PAYMENT+CONFIRMED/PAY) 미입금 패키지 —
     * Shop Payment APPROVED SSOT 확인 후, mapping.paymentStatus 가 CONFIRMED/PAY 가 아니면
     * confirmPayment 로 heal 한 뒤 confirmDeposit → approveMapping.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param mapping 매핑 엔티티
     * @param context 이행 컨텍스트
     * @author MindGarden
     * @since 2026-09-19
     */
    private void activatePaymentConfirmedPackage(
            String tenantId,
            Long mappingId,
            ConsultantClientMapping mapping,
            ShopConsultationFulfillmentContext context) {
        requireApprovedShopPayment(tenantId, context.getOrderPublicId(), mappingId);
        preparePackageTotalsForActivation(tenantId, mapping, context);
        String paymentReference = ShopCheckoutConstants.consultationPaymentReference(context.getOrderPublicId());
        PaymentStatus paymentStatus = mapping.getPaymentStatus();
        if (paymentStatus != PaymentStatus.CONFIRMED && paymentStatus != PaymentStatus.PAY) {
            long paymentAmount = resolveActivationPaymentAmount(mapping, context);
            log.warn(
                    "Path B heal mapping paymentStatus before deposit:"
                            + " tenantId={}, mappingId={}, previousPaymentStatus={}, orderPublicId={}",
                    tenantId,
                    mappingId,
                    paymentStatus,
                    context.getOrderPublicId());
            adminService.confirmPayment(
                    mappingId,
                    ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD,
                    paymentReference,
                    paymentAmount);
        } else {
            // confirmPayment 스킵이어도 mapping.paymentMethod 는 CREDIT_CARD (CASH 오표기 금지)
            forcePathBCreditCardPaymentMethod(mapping);
        }
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
     * Path B PAID 활성화 전 Shop Payment APPROVED 행이 있는지 확인한다 (REFUNDED-only 무시, fail-closed).
     *
     * @param tenantId 테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @param mappingId 매핑 ID (로그·예외용)
     * @throws IllegalStateException APPROVED 결제가 없으면
     * @author MindGarden
     * @since 2026-09-19
     */
    private void requireApprovedShopPayment(String tenantId, String orderPublicId, Long mappingId) {
        boolean hasApproved = paymentRepository
                .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        tenantId, orderPublicId, Payment.PaymentStatus.APPROVED)
                .isPresent();
        if (!hasApproved) {
            throw new IllegalStateException(
                    "PAID Path B requires APPROVED payment: tenantId="
                            + tenantId
                            + ", orderPublicId="
                            + orderPublicId
                            + ", mappingId="
                            + mappingId);
        }
    }

    /**
     * Path B 활성화가 이미 커밋된 같은 주문 재시도인지.
     * <p>
     * 쇼핑 최초 구매는 {@link MappingStatus#PENDING_PAYMENT} 로 시작한다.
     * 회기 TX 커밋 후 입금 INCOME TX 만 실패하면 재시도 시 status 가 ACTIVE/SESSIONS_EXHAUSTED,
     * 입금 확인, remaining &gt; 0 이다. 여기서 Path A {@code addSessions} 를 하면 회기가 두 배가 된다.
     * </p>
     * <p>
     * 부분 Path B 후 {@link MappingStatus#DEPOSIT_PENDING} / {@link MappingStatus#DEPOSIT_CONFIRMED},
     * 또는 데이터 부정합으로 {@link MappingStatus#PENDING_PAYMENT} 인데 입금·회기가 이미 반영된 경우도
     * 동일하게 이중 가산을 막는다.
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
        if (status != MappingStatus.ACTIVE
                && status != MappingStatus.SESSIONS_EXHAUSTED
                && status != MappingStatus.DEPOSIT_PENDING
                && status != MappingStatus.DEPOSIT_CONFIRMED
                && status != MappingStatus.PENDING_PAYMENT
                && status != MappingStatus.PAYMENT_CONFIRMED) {
            return false;
        }
        int remaining = mapping.getRemainingSessions() != null ? mapping.getRemainingSessions() : 0;
        if (remaining <= 0) {
            return false;
        }
        if (status == MappingStatus.PENDING_PAYMENT
                || status == MappingStatus.DEPOSIT_PENDING
                || status == MappingStatus.DEPOSIT_CONFIRMED
                || status == MappingStatus.PAYMENT_CONFIRMED) {
            // PAYMENT_CONFIRMED+rem>0: Path A confirmPayment 직후 ACTIVE 미복구 잔여 — 이중 가산 금지
            if (!isDepositLedgerConfirmed(mapping) && !isDepositAlreadyConfirmed(mapping)) {
                return false;
            }
        } else if (!isDepositAlreadyConfirmed(mapping)) {
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
        PaymentStatus paymentStatus = mapping.getPaymentStatus();
        return paymentStatus == PaymentStatus.CONFIRMED
                || paymentStatus == PaymentStatus.APPROVED
                || paymentStatus == PaymentStatus.DEP;
    }

    /**
     * 입금 원장 기준으로 입금이 확정됐는지.
     * {@link PaymentStatus#CONFIRMED}/{@link PaymentStatus#PAY}(결제 확인·미수금)는 제외한다.
     *
     * @param mapping 매핑
     * @return 입금 확정이면 true
     * @author MindGarden
     * @since 2026-09-19
     */
    private static boolean isDepositLedgerConfirmed(ConsultantClientMapping mapping) {
        if (Boolean.TRUE.equals(mapping.getDepositConfirmed())) {
            return true;
        }
        PaymentStatus paymentStatus = mapping.getPaymentStatus();
        return paymentStatus == PaymentStatus.APPROVED || paymentStatus == PaymentStatus.DEP;
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
     * <p>confirmPayment 는 paymentAmount 만 갱신하므로, 호출 전
     * {@link #syncPackagePriceFromLineTotal} 로 packagePrice 도 PAID lineTotal 과 맞춘다
     * (stale catalog packagePrice 가 ERP INCOME 에 쓰이지 않게).</p>
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
        boolean dirty = syncPackagePriceFromLineTotal(mapping, context.getLineTotalMinor());
        if (sessionsToGrant >= ShopSessionCountConstants.MIN_SESSION_COUNT) {
            mapping.addSessions(sessionsToGrant);
            dirty = true;
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
        if (dirty) {
            consultantClientMappingRepository.save(mapping);
        }
        adminService.confirmPayment(
                mappingId,
                ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD,
                ShopCheckoutConstants.consultationPaymentReference(context.getOrderPublicId()),
                resolveActivationPaymentAmount(mapping, context));
        // confirmPayment → entity.confirmPayment 가 status=PAYMENT_CONFIRMED 로 강등한다.
        // 홈 KPI는 ACTIVE(+shop-paid rem>0)만 집계하므로 rem>0 이면 ACTIVE 로 복구한다.
        restoreActiveAfterShopPathAConfirm(tenantId, mappingId);
    }

    /**
     * PAID 주문 lineTotal → mapping packagePrice·paymentAmount SSOT 동기화.
     *
     * <p>lineTotal &gt; 0 이면 REFUNDED/empty 여부와 무관하게 항상 맞춘다.
     * stale catalog packagePrice(예: E2E 1000)가 getAccurateTransactionAmount 에 남아
     * ERP INCOME 이 과소 기표되는 것을 막는다. Path A grant·Path B prepare·COMPLETED fulfill-retry 공용.</p>
     *
     * @param mapping 상담 매핑
     * @param lineTotalMinor 주문 라인 합계(소수 단위, 원)
     * @return 필드가 변경되어 persist 가 필요하면 true
     * @author MindGarden
     * @since 2026-09-19
     */
    public static boolean syncPackagePriceFromLineTotal(
            ConsultantClientMapping mapping, long lineTotalMinor) {
        if (mapping == null || lineTotalMinor <= 0L) {
            return false;
        }
        boolean changed = false;
        if (mapping.getPackagePrice() == null || mapping.getPackagePrice() != lineTotalMinor) {
            mapping.setPackagePrice(lineTotalMinor);
            changed = true;
        }
        if (mapping.getPaymentAmount() == null || mapping.getPaymentAmount() != lineTotalMinor) {
            mapping.setPaymentAmount(lineTotalMinor);
            changed = true;
        }
        return changed;
    }

    /**
     * Path A {@code confirmPayment} 후 rem&gt;0 이면 홈 가독 {@link MappingStatus#ACTIVE} 로 복구한다.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @author MindGarden
     * @since 2026-09-19
     */
    private void restoreActiveAfterShopPathAConfirm(String tenantId, Long mappingId) {
        ConsultantClientMapping afterConfirm = consultantClientMappingRepository
                .findByTenantIdAndId(tenantId, mappingId)
                .orElse(null);
        if (afterConfirm == null) {
            return;
        }
        int remaining = afterConfirm.getRemainingSessions() != null
                ? afterConfirm.getRemainingSessions()
                : 0;
        if (remaining <= 0) {
            return;
        }
        if (afterConfirm.getStatus() == MappingStatus.ACTIVE) {
            return;
        }
        promoteHomeReadableActive(tenantId, mappingId, afterConfirm, afterConfirm.getStatus());
    }

    /**
     * 활성화 전 totalSessions·금액·상품명을 주문 라인 SSOT로 강제 동기화한다. 가산({@code addSessions})하지 않는다.
     *
     * <p>신규 Path B({@code total} 미설정·0): {@code totalSessions = sessionsToGrant}.
     * 환불 heal 후 재구매({@code rem==0} 이고 {@code total &lt;= used}):
     * {@code confirmDeposit} 이 {@code remaining = total - used} 로 채우므로
     * {@code totalSessions = used + sessionsToGrant} 로 올려 회기가 0으로 남지 않게 한다.
     * 이미 {@code total &gt; used}(또는 rem&gt;0)이면 total 을 건드리지 않는다 — Path A 이중 가산 방지와
     * {@link #isPathBSessionsAlreadyGranted} 재시도 가드와 정합.</p>
     *
     * <p>Path B PAID: {@code lineTotalMinor}/{@code titleSnapshot} 이 SSOT.
     * stale mapping {@code packagePrice}/{@code packageName}(예: 무료1회)로 INCOME·적요를 대체하지 않는다.</p>
     *
     * @param tenantId 테넌트 ID
     * @param mapping 매핑 엔티티
     * @param context 이행 컨텍스트
     */
    private void preparePackageTotalsForActivation(
            String tenantId, ConsultantClientMapping mapping, ShopConsultationFulfillmentContext context) {
        int sessionsToGrant = context.getSessionsToGrant();
        if (sessionsToGrant >= ShopSessionCountConstants.MIN_SESSION_COUNT) {
            applyPathBTotalSessionsForGrant(mapping, sessionsToGrant, context.getSkuCode());
        }

        // Path B PAID — 주문 라인 상품명으로 강제 동기화 (mapping stale 「무료1회」 금지)
        if (StringUtils.hasText(context.getTitleSnapshot())) {
            mapping.setPackageName(context.getTitleSnapshot().trim());
        } else if (!StringUtils.hasText(mapping.getPackageName())
                && StringUtils.hasText(context.getSkuCode())) {
            mapping.setPackageName(context.getSkuCode());
        }

        // Path B PAID — cashDue/lineTotal SSOT로 packagePrice·paymentAmount 동기화
        long paidSsot = resolveActivationPaymentAmount(mapping, context);
        syncPackagePriceFromLineTotal(mapping, paidSsot);

        // PortOne/온라인 Path B — paymentMethod=CREDIT_CARD (CASH·레거시 CARD 오표기 금지)
        mapping.setPaymentMethod(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD);

        consultantClientMappingRepository.save(mapping);

        Integer ensuredTotal = mapping.getTotalSessions();
        if (ensuredTotal == null || ensuredTotal < ShopSessionCountConstants.MIN_SESSION_COUNT) {
            throw new IllegalStateException(
                    "활성화할 패키지 회기(totalSessions)가 없습니다: mappingId="
                            + mapping.getId()
                            + ", sessionsToGrant="
                            + sessionsToGrant);
        }
        log.info(
                "Shop Path B package prepared (order-line SSOT): tenantId={}, mappingId={}, "
                        + "totalSessions={}, packageName={}, packagePrice={}, paymentAmount={}, "
                        + "lineTotalMinor={}, cashDueMinor={}",
                tenantId,
                mapping.getId(),
                mapping.getTotalSessions(),
                mapping.getPackageName(),
                mapping.getPackagePrice(),
                mapping.getPaymentAmount(),
                context.getLineTotalMinor(),
                context.getCashDueMinor());
    }

    /**
     * Path B 활성화용 totalSessions 보정. {@code addSessions} 금지 — confirmDeposit 이 remaining 을 채운다.
     *
     * @param mapping 매핑
     * @param sessionsToGrant 부여할 회기 수 (1 이상)
     * @param skuCode 패키지명 보정용 SKU (nullable)
     */
    private static void applyPathBTotalSessionsForGrant(
            ConsultantClientMapping mapping, int sessionsToGrant, String skuCode) {
        Integer total = mapping.getTotalSessions();
        int used = mapping.getUsedSessions() != null ? mapping.getUsedSessions() : 0;
        int remaining = mapping.getRemainingSessions() != null ? mapping.getRemainingSessions() : 0;

        if (total == null || total < ShopSessionCountConstants.MIN_SESSION_COUNT) {
            mapping.setTotalSessions(sessionsToGrant);
            fillPackageNameIfBlank(mapping, skuCode);
            return;
        }
        // 환불·소진 후 rem=0·total<=used: confirmDeposit(total-used)가 0이 되므로 used+grant 로 bump
        if (remaining <= 0 && total <= used) {
            mapping.setTotalSessions(used + sessionsToGrant);
            fillPackageNameIfBlank(mapping, skuCode);
            log.info(
                    "Shop Path B totalSessions bumped for repurchase grant: mappingId={}, used={}, "
                            + "sessionsToGrant={}, newTotal={}",
                    mapping.getId(),
                    used,
                    sessionsToGrant,
                    mapping.getTotalSessions());
        }
    }

    /**
     * packageName 이 비어 있으면 SKU 로 채운다.
     *
     * @param mapping 매핑
     * @param skuCode SKU 코드
     */
    private static void fillPackageNameIfBlank(ConsultantClientMapping mapping, String skuCode) {
        if (!StringUtils.hasText(mapping.getPackageName()) && StringUtils.hasText(skuCode)) {
            mapping.setPackageName(skuCode);
        }
    }

    /**
     * confirmAndActivate / ERP 에 넘길 결제 금액.
     * cashDueMinor 우선, 없으면 lineTotal, 없으면 매핑 금액. 유효하지 않으면 fail-closed.
     *
     * @param mapping 매핑
     * @param context 이행 컨텍스트
     * @return 양수 결제 금액
     */
    private static long resolveActivationPaymentAmount(
            ConsultantClientMapping mapping, ShopConsultationFulfillmentContext context) {
        long cashDue = context.getCashDueMinor();
        if (cashDue > 0) {
            return cashDue;
        }
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
     * Path B PortOne — mapping.paymentMethod 를 CREDIT_CARD 로 강제 저장.
     * confirmPayment 스킵(이미 CONFIRMED/ACTIVE) 시에도 CASH 오표기를 남기지 않는다.
     *
     * @param mapping 매핑
     */
    private void forcePathBCreditCardPaymentMethod(ConsultantClientMapping mapping) {
        if (mapping == null) {
            return;
        }
        String expected = ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD;
        String previous = mapping.getPaymentMethod();
        if (expected.equals(previous)) {
            return;
        }
        mapping.setPaymentMethod(expected);
        consultantClientMappingRepository.save(mapping);
        log.info(
                "Shop Path B paymentMethod forced to CREDIT_CARD: mappingId={}, previous={}",
                mapping.getId(),
                previous);
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
