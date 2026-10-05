package com.coresolution.consultation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import lombok.Getter;
import lombok.Setter;

/**
 * 어드민 수동 다중 발송(SMS·알림톡·푸시) 공용 설정.
 *
 * <p>{@code notification.manual.*} 키로 바인딩한다. 수신자 상한은 DTO 검증·서비스·화면이 모두 이 값 하나만 쓴다.
 * 채널별 청크 크기와 초당 발송 수는 프로바이더 한도에 맞춰 환경변수로 조정한다(application.yml 참고).
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@ConfigurationProperties(prefix = "notification.manual")
@Getter
@Setter
public class ManualNotificationProperties {

    /** 설정 누락 시 안전망 상한. 실제 값은 application.yml {@code notification.manual.max-recipients}. */
    public static final int DEFAULT_MAX_RECIPIENTS = 500;

    /** 한 번에 발송할 수 있는 최종 수신자 수 상한(전체·직접 선택 공통). */
    private int maxRecipients = DEFAULT_MAX_RECIPIENTS;

    /** 발송 확인 단계에서 보여 줄 수신자 미리보기 인원. */
    private int previewSize;

    /** 비동기 발송 작업 설정. */
    private Job job = new Job();

    /**
     * 발송 작업(비동기) 설정.
     */
    @Getter
    @Setter
    public static class Job {
        /** REAL = 프로바이더 실호출, DRY_RUN = 같은 기록 경로로 프로바이더 호출만 생략(.dev). */
        private String providerMode;
        /** 작업 생성 직후 백그라운드 실행 여부(테스트에서 false 로 두고 워커를 직접 호출). */
        private boolean autoLaunch = true;
        /** 실행 점유(lease) 유지 시간(초). 만료되면 다른 인스턴스·복구 스케줄러가 이어서 실행한다. */
        private int leaseSeconds;
        /** 멈춘 작업 복구 스케줄러 사용 여부. */
        private boolean recoveryEnabled = true;
        /** PENDING 상태로 이 시간(초) 넘게 남은 작업만 복구 스케줄러가 집어 간다. */
        private int pendingGraceSeconds;
        /** 복구 스케줄러가 한 번에 집어 갈 작업 수. */
        private int recoveryBatchSize;
        /** 발송 워커 스레드 수. */
        private int executorPoolSize;
        /** 발송 워커 대기열 크기. */
        private int executorQueueCapacity;
        /** SMS 프로바이더 한도. */
        private Channel sms = new Channel();
        /** 알림톡 프로바이더 한도. */
        private Channel alimtalk = new Channel();
        /** 푸시 프로바이더 한도. */
        private Channel push = new Channel();
    }

    /**
     * 채널별 프로바이더 한도.
     */
    @Getter
    @Setter
    public static class Channel {
        /** 청크 하나에 담는 수신자 수(프로바이더 요청당 한도). */
        private int chunkSize;
        /** 초당 최대 발송 수(프로바이더 초당 한도). 0 이하면 조절하지 않는다. */
        private int perSecond;
    }
}
