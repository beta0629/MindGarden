package com.coresolution.consultation.config;

import com.coresolution.consultation.constant.ClientEventBackfillConstants;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * {@code client_event} 서버 로컬 CLI 백필 설정.
 *
 * <p>운영 노출 HTTP 경로와 무관하다. CLI 진입점만 이 프로퍼티를 사용한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Data
@ConfigurationProperties(prefix = ClientEventBackfillConstants.PROP_PREFIX)
public class ClientEventBackfillProperties {

    /**
     * CLI 서브 설정 ({@code client-event.backfill.cli.enabled}).
     */
    private Cli cli = new Cli();

    /**
     * 실행 모드: dry-run | apply | rollback (기본 dry-run).
     */
    private String mode = ClientEventBackfillConstants.MODE_DRY_RUN;

    /**
     * 필수 테넌트 ID.
     */
    private String tenantId;

    /**
     * apply/rollback 확정 값 ({@code APPLY} / {@code ROLLBACK}).
     */
    private String confirm;

    /**
     * 운영시간 창 판정 타임존 (기본 Asia/Seoul).
     */
    private String zone = ClientEventBackfillConstants.DEFAULT_ZONE;

    /**
     * 거부 시작 시각(포함, 시). 기본 11.
     */
    private int blockedHourStart = ClientEventBackfillConstants.DEFAULT_BLOCKED_HOUR_START;

    /**
     * 거부 종료 시각(미포함, 시). 기본 20 → 11≤h&lt;20.
     */
    private int blockedHourEnd = ClientEventBackfillConstants.DEFAULT_BLOCKED_HOUR_END;

    /**
     * CLI enable 게이트.
     */
    @Data
    public static class Cli {
        /**
         * true 일 때만 {@code ClientEventBackfillCliRunner} 가 기동한다.
         */
        private boolean enabled = false;
    }
}
