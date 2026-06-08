package com.coresolution.consultation.config;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.boot.context.properties.ConfigurationProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Sign in with Apple (SIWA) OAuth2 자격증명 프로퍼티.
 *
 * <p>Apple App Store 4.8 (Login Services) 대응 — T1 트랙. 디자이너 핸드오프
 * {@code docs/project-management/2026-06-04/APPLE_T1_SIWA_DESIGN_HANDOFF.md} §6,
 * 오케스트레이션 {@code docs/project-management/APPLE_REJECTION_PLAN_A_ORCHESTRATION_2026_06_04.md} §1 T1
 * 와 정합한다.</p>
 *
 * <p>운영 env 는 다음 키로 주입된다 (운영 GitHub Actions secret · backend {@code .env.prod} 동일):
 * <ul>
 *   <li>{@code APPLE_CLIENT_ID} → {@link #clientId} — Apple Service ID (예: {@code co.kr.coresolution.app.signin})</li>
 *   <li>{@code APPLE_TEAM_ID} → {@link #teamId} — Apple Developer Team ID (10자리)</li>
 *   <li>{@code APPLE_KEY_ID} → {@link #keyId} — Sign in with Apple Key ID (10자리)</li>
 *   <li>{@code APPLE_PRIVATE_KEY} → {@link #privateKey} — Apple 발급 .p8 PEM 내용 (BEGIN/END PRIVATE KEY 라인 포함)</li>
 *   <li>{@code APPLE_REDIRECT_URI} → {@link #redirectUri} — Service ID 에 등록한 Return URL</li>
 *   <li>{@code APPLE_ALLOWED_AUDIENCES} → {@link #allowedAudiences} — identityToken {@code aud} 허용 List
 *       (콤마 구분; 미지정 시 {@link #clientId} 단일값 fallback). iOS 네이티브 SIWA 는 {@code aud=Bundle ID}
 *       (예: {@code com.mindgarden.MindGardenMobile}) 를, 웹/Service ID 는 {@code aud=Service ID} 를
 *       발급하므로 둘 모두 허용해야 iPhone 앱·웹 양쪽 로그인이 동시에 동작한다 (P0 hotfix 2026-06-08).</li>
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
@NoArgsConstructor
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

    /**
     * identityToken {@code aud} 검증 시 허용할 audience List. Spring Boot 의 콤마 구분 자동 바인딩
     * (`apple.allowed-audiences=co.kr.coresolution.app.signin,com.mindgarden.MindGardenMobile`)
     * 또는 List 표기 모두 허용한다. 비어 있으면 {@link #clientId} 단일값으로 fallback —
     * 즉 본 hotfix 적용 전 동작을 100% 보존한다 (회귀 0).
     *
     * <p>iOS 네이티브 SIWA 는 Apple 이 토큰 {@code aud} 에 Bundle ID 를 박아 발급하므로
     * (참조: <a href="https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidcredential/3153039-identitytoken">
     * Apple Docs — identityToken</a>),
     * Service ID 단일 검증으로는 모든 네이티브 토큰이 reject 된다 (2026-06-08 운영 P0).</p>
     */
    private List<String> allowedAudiences = new ArrayList<>();

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

    /**
     * {@link #allowedAudiences} 에 {@link #clientId} 를 자동 합쳐 정규화된 audience List 를 반환한다.
     *
     * <p>정책:
     * <ol>
     *   <li>{@link #allowedAudiences} 가 비어 있으면 {@link #clientId} 단일값으로 fallback
     *       (단, {@link #clientId} 도 blank 면 빈 List 반환 → 모든 audience reject)</li>
     *   <li>{@link #allowedAudiences} 가 비어 있지 않으면 그 값들에 {@link #clientId} 를 합치고
     *       {@link LinkedHashSet} 으로 중복 제거 + 입력 순서 보존</li>
     *   <li>모든 항목은 trim 후 blank 항목 제외</li>
     * </ol>
     * </p>
     *
     * <p>본 메서드는 부작용이 없는 read-only 계산이므로 매 호출마다 안전하게 재호출 가능하다.</p>
     *
     * @return 정규화된 audience List (blank 제거 + 중복 제거 + clientId 자동 포함)
     */
    public List<String> getResolvedAllowedAudiences() {
        Set<String> resolved = new LinkedHashSet<>();
        if (allowedAudiences != null) {
            for (String aud : allowedAudiences) {
                if (aud == null) continue;
                String trimmed = aud.trim();
                if (!trimmed.isEmpty()) {
                    resolved.add(trimmed);
                }
            }
        }
        if (clientId != null) {
            String trimmedClientId = clientId.trim();
            if (!trimmedClientId.isEmpty()) {
                resolved.add(trimmedClientId);
            }
        }
        return new ArrayList<>(resolved);
    }
}
