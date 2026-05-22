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
}
