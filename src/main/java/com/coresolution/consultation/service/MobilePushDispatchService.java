package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.MobilePushBroadcastResult;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.Schedule;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Expo Push API를 통한 모바일 OS 푸시 발송(토큰·설정 게이트·멱등·무효 토큰 비활성).
 *
 * @author MindGarden
 * @since 2026-05-16
 */
public interface MobilePushDispatchService {

    /**
     * 예약 리마인더 푸시(내담자·상담사).
     *
     * @param tenantId 테넌트 ID
     * @param schedule 일정
     * @param body 알림 본문(짧게)
     * @param reminderSlotCode 멱등·로그용 슬롯(예: T60, T30)
     */
    void dispatchBookingReminder(String tenantId, Schedule schedule, String body, String reminderSlotCode);

    /**
     * 예약 확정 푸시(내담자). actor(변경 주체) 본인은 수신 제외.
     *
     * @param tenantId 테넌트 ID
     * @param schedule 일정
     * @param actorUserId 변경 주체(현재 로그인 사용자) PK. null이면 actor 가드 미적용.
     */
    void dispatchBookingConfirmed(String tenantId, Schedule schedule, Long actorUserId);

    /**
     * 예약 취소 푸시(내담자·상담사). actor(변경 주체) 본인은 수신 제외.
     *
     * @param tenantId 테넌트 ID
     * @param schedule 일정
     * @param actorUserId 변경 주체(현재 로그인 사용자) PK. null이면 actor 가드 미적용.
     */
    void dispatchBookingCancelled(String tenantId, Schedule schedule, Long actorUserId);

    /**
     * 예약 일정 변경 푸시(내담자·상담사). actor(변경 주체) 본인은 수신 제외.
     *
     * @param tenantId 테넌트 ID
     * @param schedule 변경 후 일정(식별·수신자·신규 슬롯)
     * @param previousDate 변경 전 일자
     * @param previousStart 변경 전 시작 시각
     * @param previousEnd 변경 전 종료 시각
     * @param actorUserId 변경 주체(현재 로그인 사용자) PK. null이면 actor 가드 미적용.
     */
    void dispatchBookingRescheduled(
            String tenantId,
            Schedule schedule,
            LocalDate previousDate,
            LocalTime previousStart,
            LocalTime previousEnd,
            Long actorUserId);

    /**
     * 결제 완료 푸시(결제자).
     *
     * @param tenantId 테넌트 ID
     * @param payment 결제
     */
    void dispatchPaymentCompleted(String tenantId, Payment payment);

    /**
     * 결제 실패 푸시(결제자).
     *
     * @param tenantId 테넌트 ID
     * @param payment 결제
     */
    void dispatchPaymentFailed(String tenantId, Payment payment);

    /**
     * 회기 소진 임박 푸시(내담자).
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 PK
     * @param clientUserId 내담자 사용자 PK
     * @param remainingSessions 남은 회기 수
     */
    void dispatchSessionLow(String tenantId, Long mappingId, Long clientUserId, int remainingSessions);

    /**
     * 마음 날씨 카드 공유 푸시(담당 상담사).
     *
     * @param tenantId 테넌트 ID
     * @param cardId 카드 PK
     * @param consultantUserId 수신 상담사 users.id
     * @param clientDisplayName 푸시 본문용 내담자 표시명
     * @param summarySnippet 요약 일부(선택)
     */
    void dispatchMindWeatherShared(
            String tenantId,
            Long cardId,
            Long consultantUserId,
            String clientDisplayName,
            String summarySnippet);

    void dispatchMoodJournalShared(
            String tenantId,
            Long clientUserId,
            Long consultantUserId,
            String clientDisplayName,
            String journalDate,
            String emoji,
            String memoSnippet);

    /**
     * 어드민 매칭 정산(결제·입금·승인) 푸시. PG {@code Payment} 발송과 분리·멱등 버킷 사용.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 PK
     * @param clientUserId 내담자 users.id
     * @param consultantUserId 상담사 users.id
     * @param includeConsultant 상담사 푸시 포함 여부(승인 시 true)
     * @param canonicalType {@link com.coresolution.consultation.constant.MobilePushCanonicalTypes}
     * @param dedupeBucket 멱등 버킷(시나리오별 고정)
     * @param title 알림 제목
     * @param clientBody 내담자 알림 본문
     * @param consultantBody 상담사 알림 본문({@code includeConsultant}일 때만 사용, null이면 {@code clientBody}와 동일)
     */
    void dispatchMappingSettlement(
            String tenantId,
            Long mappingId,
            Long clientUserId,
            Long consultantUserId,
            boolean includeConsultant,
            String canonicalType,
            String dedupeBucket,
            String title,
            String clientBody,
            String consultantBody);

    /**
     * 쇼핑몰 주문 PAID 확정 푸시(내담자).
     *
     * @param tenantId 테넌트 ID
     * @param clientUserId 내담자 users.id
     * @param orderPublicId 주문 public ID
     * @param totalPaidMinor 결제 합계(원, minor)
     */
    void dispatchShopOrderPaid(String tenantId, Long clientUserId, String orderPublicId, long totalPaidMinor);

    /**
     * 쇼핑몰 PG 결제 실패 푸시(내담자).
     */
    void dispatchShopPaymentFailed(String tenantId, Long clientUserId, String orderPublicId);

    /**
     * 구매 적립 포인트 푸시(내담자).
     */
    void dispatchPointEarned(String tenantId, Long clientUserId, String orderPublicId, long earnAmountMinor);

    /**
     * 쇼핑몰 hold TTL 만료 푸시(내담자).
     */
    void dispatchShopOrderHoldExpired(String tenantId, Long clientUserId, String orderPublicId);

    /**
     * 쇼핑몰 전액 환불 푸시(내담자).
     */
    void dispatchShopOrderRefunded(String tenantId, Long clientUserId, String orderPublicId, long refundAmountMinor);

    /**
     * CONSULTATION fulfillment COMPLETED 푸시(내담자·선택 상담사).
     */
    void dispatchShopFulfillmentCompleted(
            String tenantId,
            Long clientUserId,
            Long consultantUserId,
            String orderPublicId,
            String skuCode);

    /**
     * 회기 소진(remaining&lt;=0) 자동 일괄 취소 의무 통지 푸시(2026-05-26 Phase 0, Q3=3A·보조=C).
     *
     * <p>회기관리 운영 정책 합의서 v2 결정에 따라 부분 환불·강제 종료로 미래 예약이 일괄 취소된
     * 사용자에게 인앱·이메일·푸시·알림톡 4채널 의무 통지의 푸시 채널을 담당한다. 약관·전자상거래법상
     * 의무 통지에 해당하여 {@code MobilePushSettings} 카테고리/사용자 채널 선호도를 우회하지만,
     * (a) 토큰 없음·(b) Expo 인프라 미설정·(c) 동일 mappingId 중복 호출은 정상 skip 한다.</p>
     *
     * <p>다른 dispatch 메서드와 달리 본 메서드는 화이트리스트({@link
     * com.coresolution.consultation.constant.MobilePushAllowedEvents}) 통과를 전제로 하지만
     * 카테고리 게이트는 우회하기 위해 {@code dispatchFanout} 을 사용하지 않고 자체 경로를 사용한다.</p>
     *
     * @param tenantId 테넌트 ID (필수)
     * @param userId 수신 사용자 PK (내담자 {@code users.id})
     * @param mappingId 매핑 PK (멱등 dedupe 키)
     * @param cancelCount 자동 취소된 일정 수
     * @param mypageUrl 마이페이지 URL (Expo data 페이로드, 없으면 null/빈 문자열 허용)
     */
    void dispatchAutoCancellation(String tenantId, Long userId, Long mappingId, int cancelCount, String mypageUrl);

    /**
     * 어드민 수동 다중 발송용 푸시 broadcast.
     *
     * <p>기존 fanout({@code dispatchFanout}) 화이트리스트({@link
     * com.coresolution.consultation.constant.MobilePushAllowedEvents}) 와 별도 경로로,
     * 사용자별 토큰 lookup → 카테고리(SYSTEM 재사용) 게이트 → 멱등 청구 → 단건 Expo POST 를
     * 순차 수행하며 <strong>행 단위 결과</strong>를 반환한다.
     *
     * <p>SKIPPED 정책 (실패 아님 — 행 단위 결과에 사유 명시):
     * <ul>
     *   <li>{@link MobilePushBroadcastResult#ERROR_CODE_NO_TOKEN}: 활성 토큰 없음</li>
     *   <li>{@link MobilePushBroadcastResult#ERROR_CODE_OPTED_OUT}:
     *       사용자 {@code MobilePushSettings.systemEnabled = false} (시스템 카테고리 OFF)</li>
     *   <li>{@link MobilePushBroadcastResult#ERROR_CODE_DUPLICATE}: 멱등 청구 충돌
     *       ({@code ADMIN_ANNOUNCEMENT} canonical type 으로 동일 batch+userId 24h 내 중복)</li>
     * </ul>
     * FAILED: Expo HTTP/티켓 오류 ({@link MobilePushBroadcastResult#ERROR_CODE_EXPO_FAILED}).
     *
     * @param tenantId          테넌트 ID (필수)
     * @param recipientUserIds  수신 대상 {@code users.id} 목록 (1~50명, 입력 순서 보존)
     * @param title             푸시 제목 (Expo title)
     * @param body              푸시 본문 (Expo body)
     * @param dedupeBucket      멱등 버킷 식별자 — 호출자(보통 batch UUID) 가 결정,
     *                          내부적으로 {@code ADMIN_ANNOUNCEMENT:{bucket}:{userId}} 키로 청구
     * @return 입력 {@code recipientUserIds} 순서를 보존한 행 단위 결과 목록.
     *         null·중복 입력은 dedupe 되며, 결과 크기는 {@code <= recipientUserIds.size()}.
     */
    List<MobilePushBroadcastResult> dispatchAdminAnnouncement(
            String tenantId,
            List<Long> recipientUserIds,
            String title,
            String body,
            String dedupeBucket);

    /**
     * 인증 OTP push 발송(2026-06-11) — push-first OTP 정책 전용 SSOT 경로.
     *
     * <p>{@link com.coresolution.consultation.service.OtpDeliveryService} 에서만 호출되며,
     * 본 메서드는 다음 모두를 우회한다.
     * <ul>
     *   <li>{@link com.coresolution.consultation.constant.MobilePushAllowedEvents} 화이트리스트
     *       — OTP 는 보안 인증 의무 통지에 해당.</li>
     *   <li>{@code MobilePushSettings} 카테고리 게이트 — 사용자가 일반 알림을 끄더라도 본인 인증
     *       OTP 는 본인이 직접 요청한 발송이므로 게이트 우회.</li>
     *   <li>{@code MobilePushDispatchDedupService} 멱등 청구 — OTP 코드 자체가 5분 TTL · 단일 사용으로
     *       이미 dedup 보장. 동일 사용자가 재발송 요청 시 새 코드를 즉시 전달해야 하므로 1분 버킷도 부적합.</li>
     *   <li>{@code MobilePushInboxPersister} 알림센터 적재 — 보안상 OTP 코드는 인박스 히스토리에
     *       남기지 않는다(앱 잠금 해제 후에만 노출).</li>
     * </ul></p>
     *
     * <p>Expo access token 미설정·활성 토큰 없음·HTTP 실패는 모두 {@code false} 를 반환하며,
     * 호출자(SSOT) 가 SMS 폴백으로 진행한다.</p>
     *
     * @param tenantId   테넌트 ID (필수)
     * @param userId     수신 사용자 PK (필수)
     * @param title      푸시 제목 (예: "[MindGarden] 인증번호")
     * @param body       푸시 본문 (예: "인증번호: 123456 (5분 내 입력)")
     * @param purposeCode {@link com.coresolution.consultation.constant.OtpPurpose#getCode()} 값
     * @return Expo 발송 시도가 1개 이상의 활성 토큰에 대해 성공했으면 {@code true}, 그 외 {@code false}
     */
    boolean dispatchAuthenticationOtp(
            String tenantId,
            Long userId,
            String title,
            String body,
            String purposeCode);
}
