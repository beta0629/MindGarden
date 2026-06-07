package com.coresolution.consultation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import lombok.Data;

/**
 * Sign in with Apple (SIWA) OAuth2 자격증명 프로퍼티.
 *
 * <p>Apple App Store 4.8 (Login Services) 대응 — T1 트랙. 디자이너 핸드오프
 * {@code docs/project-management/2026-06-04/APPLE_T1_SIWA_DESIGN_HANDOFF.md} §6,
 * 오케스트레이션 {@code docs/project-management/APPLE_REJECTION_PLAN_A_ORCHESTRATION_2026_06_04.md} §1 T1
 * 와 정합한다.</p>
 *
 * <p>5개 운영 env 는 다음 키로 주입된다 (운영 GitHub Actions secret · backend {@code .env.prod} 동일):
 * <ul>
 *   <li>{@code APPLE_CLIENT_ID} → {@link #clientId} — Apple Service ID (예: {@code co.kr.coresolution.app.signin})</li>
 *   <li>{@code APPLE_TEAM_ID} → {@link #teamId} — Apple Developer Team ID (10자리)</li>
 *   <li>{@code APPLE_KEY_ID} → {@link #keyId} — Sign in with Apple Key ID (10자리)</li>
 *   <li>{@code APPLE_PRIVATE_KEY} → {@link #privateKey} — Apple 발급 .p8 PEM 내용 (BEGIN/END PRIVATE KEY 라인 포함)</li>
 *   <li>{@code APPLE_REDIRECT_URI} → {@link #redirectUri} — Service ID 에 등록한 Return URL</li>
 * </ul>
 * </p>
 *
 * <p>Native iOS (Expo `expo-apple-authentication`) 흐름은 {@link #redirectUri} 불필요(서버에서 client_secret 만 사용)
 * 하지만, 웹/콜백 모드를 위해 등록되어 있어야 한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Data
@Component
@ConfigurationProperties(prefix = "apple")
public class AppleOAuth2Properties {

    /** Apple Service ID (Service ID, Apple Developer Console). */
    private String clientId = "";

    /** Apple Developer Team ID (10자리). */
    private String teamId = "";

    /** Sign in with Apple Key ID (10자리). */
    private String keyId = "";

    /**
     * Apple 발급 .p8 PEM 내용. PEM 헤더/푸터(`-----BEGIN PRIVATE KEY-----`/`-----END PRIVATE KEY-----`)
     * 포함 또는 Base64 본문만 모두 허용 (Generator 측에서 정규화).
     */
    private String privateKey = "";

    /** Apple Console Service ID 에 등록한 Return URL. */
    private String redirectUri = "";

    /** Apple JWKS endpoint URL (키 회전 대응 캐싱). */
    private String jwksUri = "https://appleid.apple.com/auth/keys";

    /** Apple ID token issuer (검증 기준). */
    private String issuer = "https://appleid.apple.com";

    /** Apple `/auth/token` endpoint URL (server-callback 흐름). */
    private String tokenUri = "https://appleid.apple.com/auth/token";

    /** JWKS 캐시 TTL(초). 기본 3600 초 (1시간) — 키 회전 대응. */
    private long jwksCacheTtlSeconds = 3600L;

    /**
     * client_secret JWT 만료(초). Apple 정책상 최대 6개월(15777000초) 이지만, 보안상 60일 권장.
     */
    private long clientSecretTtlSeconds = 5184000L;
}
