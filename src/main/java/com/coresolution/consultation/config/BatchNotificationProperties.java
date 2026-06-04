package com.coresolution.consultation.config;

import java.time.LocalDate;
import org.springframework.boot.context.properties.ConfigurationProperties;
import lombok.Getter;
import lombok.Setter;

/**
 * 알림 배치/이벤트 발송 트랙 A·B 설정.
 *
 * <p>{@code notification.batch.*} 키로 바인딩. 운영 게이트
 * (NOTIFICATION_BATCH_MESSAGE_DESIGN §6) — D-2 09:00 KST 배치 cron 외부화,
 * 첫 실행 cutoff(마지막 회기 종료 이후 SESSION_RENEW_PROMPT 발송 조건),
 * 드라이런 토글을 설정으로 분리한다. 하드코딩 0건 원칙 준수.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ConfigurationProperties(prefix = "notification.batch")
@Getter
@Setter
public class BatchNotificationProperties {

    /**
     * D-2 예약 안내 배치 cron 표현식. 기본 {@code 0 0 9 * * *} (매일 09:00).
     * Asia/Seoul zone 은 {@code @Scheduled(zone="Asia/Seoul")} 로 보장.
     */
    private String reservationReminderCron = "0 0 9 * * *";

    /**
     * 예약일과 오늘 사이의 일수(D-N) 임계값. 기본 {@code 2} —
     * "D-2 이상이면 배치 발송, 미만이면 즉시 발송" 분기 임계.
     */
    private int reservationReminderDaysAhead = 2;

    /**
     * 첫 실행 cutoff — {@code SESSION_RENEW_PROMPT} 한정.
     * 매핑의 {@code end_date} 가 본 일자 {@link LocalDate#atStartOfDay()} 이후일 때만 발송.
     * 기본 {@code 2026-05-24} (운영 반영 다음 날 자정).
     */
    private LocalDate sessionRenewDeployCutoff = LocalDate.of(2026, 5, 24);

    /**
     * 드라이런 모드 — 활성화 시 멱등 로그/외부 호출 없이 카운트만 로그한다.
     * 운영 반영 직후 3일 동안 검증용으로 사용한다(기획 §6).
     */
    private boolean dryRun = false;

    /** D-2 예약 안내 배치 활성화 토글. */
    private boolean reservationReminderEnabled = true;

    /**
     * 신규 매칭 환영 안내({@code CLIENT_WELCOME_FIRST})·첫 상담 안내({@code INITIAL_GUIDE_*})
     * 변수 매핑에 사용되는 고객센터/대표 번호. 빈 값이면
     * {@link com.coresolution.consultation.constant.BatchNotificationTemplateCodes#FALLBACK_CONTACT_PHONE} 로 대체.
     */
    private String contactPhone = "";

    /**
     * {@code INITIAL_GUIDE_OFFLINE} 발송 시 지점 주소 변수 누락 또는 미해결 시 사용할 fallback 문구.
     * 빈 값이면 {@link com.coresolution.consultation.constant.BatchNotificationTemplateCodes#FALLBACK_BRANCH_ADDRESS} 로 대체.
     */
    private String fallbackBranchAddress = "";

    /**
     * 배치 SMS 폴백 본문의 코드 안전망(static fallback) 사용 여부.
     *
     * <p>{@code false} 기본 (2026-05-26 P0 SMS 긴급 차단 정책, V20260602_001). 운영에서는
     * {@code SMS_TEMPLATE} 시드(V20260529_004) 가 SSOT 이므로 코드 안전망은 평시 미사용이며,
     * 시드 {@code is_active=FALSE} 로 SMS 발송을 즉시 차단할 수 있도록 본 토글을 {@code false}
     * 로 유지한다. 시드 누락 / 회귀 사고 등 특수 상황에서만 일시적으로 {@code true} 로 켠다.
     *
     * <p>인증 SMS({@link com.coresolution.consultation.service.SmsAuthService#sendVerificationCode})
     * 경로는 본 토글의 영향을 받지 않는다.
     *
     * @since 2026-05-26 (Phase 2 영구 안전망 hotfix)
     */
    private boolean smsStaticFallbackEnabled = false;

    /**
     * 배치/이벤트 발송에서 알림톡 채널 사용 여부.
     *
     * <p>{@code false} 기본 (2026-06-04 사용자 결재: "알림톡은 사용 안 함, 현장결제도 예약이
     * 취소된 게 아니면 문자 발송"). 본 토글이 {@code false} 이면 {@code BatchNotificationDispatchServiceImpl}
     * 가 {@code AlimtalkTemplateMappingResolver} 매핑 조회를 skip 하고 알림톡 시도 자체를 차단한
     * 채 SMS 폴백 경로(F1) 로만 발송한다.
     *
     * <p>운영 yml ({@code application-prod.yml}) 의 {@code kakao.alimtalk.enabled} 게이트와 별개로
     * 작동하는 코드 가드이다 — 운영 환경 변수 누락 시에도 알림톡 미발송을 보장한다.
     *
     * <p>박도영 schedule_id=106 (2026-05-30) 사례처럼 알림톡 매핑 미정착으로 인한
     * {@code TEMPLATE_NOT_MAPPED} 실패가 SMS 발송을 막던 회귀를 자연 해소한다.
     *
     * @since 2026-06-04 (스케줄 등록 즉시 SMS 발송 정책)
     */
    private boolean alimtalkEnabled = false;
}
