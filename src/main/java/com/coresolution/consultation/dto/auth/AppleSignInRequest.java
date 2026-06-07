package com.coresolution.consultation.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Sign in with Apple (SIWA) 로그인/가입 요청 본문.
 *
 * <p>Native iOS (Expo `expo-apple-authentication`) · 웹(Apple JS SDK) 양쪽에서 사용한다.</p>
 *
 * <p>Apple 정책:
 * <ul>
 *   <li>첫 로그인 시에만 {@code email}/{@code givenName}/{@code familyName} 이 제공된다 — 백엔드가 이때만 영구 저장.</li>
 *   <li>두 번째 이후 로그인은 {@code identityToken} 의 {@code sub} 로만 사용자를 식별한다.</li>
 *   <li>Apple Private Relay 사용자는 {@code @privaterelay.appleid.com} 도메인의 익명 이메일을 제공한다.</li>
 * </ul>
 * </p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppleSignInRequest {

    /** Apple 이 발급한 ID token (JWT). 서버에서 JWKS 로 서명 검증. */
    @NotBlank(message = "identityToken 은 필수입니다.")
    @Size(max = 4096, message = "identityToken 길이가 비정상적으로 큽니다.")
    private String identityToken;

    /**
     * Apple authorization code (선택). 웹 콜백 모드에서만 제공 — 백엔드가
     * `/auth/token` 호출에 사용해 access/refresh token 을 발급받을 수 있다.
     */
    @Size(max = 1024)
    private String authorizationCode;

    /** 클라이언트가 인증 시작 시 생성한 nonce — Apple identityToken {@code nonce} 클레임과 일치해야 한다. */
    @Size(max = 256)
    private String nonce;

    /** 첫 로그인에서만 제공되는 이름(주어진 이름). */
    @Size(max = 100)
    private String givenName;

    /** 첫 로그인에서만 제공되는 이름(가족 이름). */
    @Size(max = 100)
    private String familyName;

    /**
     * 첫 로그인에서만 제공되는 이메일. Apple Private Relay 인 경우
     * {@code @privaterelay.appleid.com} 도메인 그대로 저장한다.
     */
    @Size(max = 320)
    private String email;
}
