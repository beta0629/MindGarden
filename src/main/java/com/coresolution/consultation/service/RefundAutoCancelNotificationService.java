package com.coresolution.consultation.service;

import java.util.Map;
import com.coresolution.consultation.entity.User;

/**
 * 부분 환불 / 강제 종료로 회기 소진(remaining&lt;=0) 시 자동 일괄 취소된 미래 예약을 사용자에게 알리는
 * 4채널 의무 통지 오케스트레이터(2026-05-26 Phase 0, Q3=3A·보조=C).
 *
 * <p>회기관리 운영 정책 합의서 v2(docs/standards/SESSION_MANAGEMENT_POLICY_DECISIONS.md, commit
 * {@code 63558fb49}) 결정에 따라 다음 4채널을 모두 시도하고 채널별 결과를 반환한다.
 * <ul>
 *   <li>인앱: {@code alerts} 테이블 직접 INSERT (tenant 격리, {@code channel=IN_APP})</li>
 *   <li>이메일: {@link EmailService#sendAutoCancelNotification(String, int, String)}</li>
 *   <li>푸시: {@link MobilePushDispatchService#dispatchAutoCancellation(String, Long, Long, int, String)}</li>
 *   <li>알림톡: {@link KakaoAlimTalkService#sendAutoCancelRefund(String, int, String)}</li>
 * </ul></p>
 *
 * <p>약관·전자상거래법상 환불 처리 + 자동 취소는 의무 통지에 해당하므로, 사용자
 * {@code notificationPreferences} 또는 {@link com.coresolution.consultation.entity.MobilePushSettings}
 * 카테고리 설정과 무관하게 4채널을 모두 시도한다. 한 채널 실패는 다른 채널 발송에 영향을 주지 않는다
 * (best-effort fan-out). 채널별 결과는 호출자가 매핑 {@code notes} 또는 매핑 이력 테이블에 감사
 * 로그로 기록한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-26
 */
public interface RefundAutoCancelNotificationService {

    /** 4채널 발송 결과 키(매핑 notes JSON·로그 공통). */
    String CHANNEL_KEY_IN_APP = "inapp";
    String CHANNEL_KEY_EMAIL = "email";
    String CHANNEL_KEY_PUSH = "push";
    String CHANNEL_KEY_ALIMTALK = "alimtalk";

    /** 결과 라벨 — 채널별 상세 응답은 로그에만 남기고, notes 에는 OK/FAIL/SKIP 만 누적한다. */
    String RESULT_OK = "OK";
    String RESULT_FAIL = "FAIL";
    String RESULT_SKIP = "SKIP";

    /**
     * 자동 일괄 취소 4채널 의무 통지 발송.
     *
     * <p>호출 직전에 호출자(AdminServiceImpl)는 (a) 매핑 상태 갱신, (b)
     * {@code cancelFutureSchedulesForExhaustedMapping} 호출로 미래 일정 일괄 CANCELLED 전이를
     * 완료한 상태여야 한다.</p>
     *
     * @param tenantId    테넌트 ID (필수, 멀티테넌트 격리)
     * @param client      통지 대상 내담자 (전화·이메일 필드 사용)
     * @param mappingId   매핑 PK (감사·푸시 dedupe 키)
     * @param cancelCount 취소된 일정 수
     * @param mypageUrl   마이페이지 URL (null 또는 빈 문자열이면 채널별로 안내 라인 생략)
     * @return 채널 키({@link #CHANNEL_KEY_IN_APP} 등) → 결과 라벨/사유 맵 (절대 null 반환 X,
     *         항상 4개 키 포함)
     */
    Map<String, String> dispatchRefundAutoCancelNotification(
            String tenantId,
            User client,
            Long mappingId,
            int cancelCount,
            String mypageUrl);
}
