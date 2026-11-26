package com.coresolution.consultation.cli;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.config.ClientEventBackfillProperties;

import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * {@code client_event} 서버 로컬 백필 원샷 진입점 ({@link WebApplicationType#NONE}).
 *
 * <p>운영에서만 사용. .dev HTTP 백필({@code @Profile("dev")}) 경로·토큰·workflow 는 유지하되
 * 운영 노출은 0 — 본 CLI 만 실행한다.</p>
 *
 * <pre>
 * java -jar app.jar \
 *   --spring.main.web-application-type=none \
 *   --client-event.backfill.cli.enabled=true \
 *   --client-event.backfill.mode=dry-run \
 *   --client-event.backfill.tenant-id=TENANT_ID
 * </pre>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@EnableConfigurationProperties(ClientEventBackfillProperties.class)
public final class ClientEventBackfillCliApplication {

    private ClientEventBackfillCliApplication() {
    }

    /**
     * Web 없이 컨텍스트를 기동하고 {@link ClientEventBackfillCliRunner} 에 위임한다.
     *
     * @param args Spring 인자({@code client-event.backfill.*} 필수)
     */
    public static void main(String[] args) {
        new SpringApplicationBuilder(ConsultationManagementApplication.class)
                .web(WebApplicationType.NONE)
                .properties("spring.main.web-application-type=none")
                .run(args);
    }
}
