package com.coresolution.core.deploy;

/**
 * Blue/Green 배포 슬롯·트래픽 포인터 SSOT.
 *
 * <p>값은 {@code deploy-production.yml}, systemd unit 예시
 * ({@code mindgarden-core-blue/green.service.example}), Nginx upstream 전환 스크립트와
 * 동일한 슬롯명·포트·active-backend 경로를 사용한다. 비즈니스 코드에 경로·슬롯·포트
 * 리터럴을 두지 말고 본 상수만 참조한다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-12
 */
public final class DeploySlotConstants {

    /** Nginx/트래픽이 가리키는 블루 슬롯 식별자. */
    public static final String SLOT_BLUE = "blue";

    /** Nginx/트래픽이 가리키는 그린 슬롯 식별자. */
    public static final String SLOT_GREEN = "green";

    /**
     * 현재 트래픽 슬롯을 기록하는 파일 경로 (기본값).
     *
     * <p>내용은 {@code blue} 또는 {@code green} 한 줄. 환경변수
     * {@code MG_ACTIVE_BACKEND_FILE} / {@code mindgarden.deploy.active-backend-file} 로 오버라이드.</p>
     */
    public static final String DEFAULT_ACTIVE_BACKEND_FILE = "/etc/mindgarden/active-backend";

    /** 블루 슬롯 HTTP 포트 ({@code SERVER_PORT=8080}). */
    public static final int BLUE_PORT = 8080;

    /** 그린 슬롯 HTTP 포트 ({@code SERVER_PORT=8081}). */
    public static final int GREEN_PORT = 8081;

    private DeploySlotConstants() {
    }
}
