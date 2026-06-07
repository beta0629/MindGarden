package com.coresolution.consultation.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Apple 신규 가입 분기에서 클라이언트가 social-signup 화면 prefill 에 사용할 정보.
 *
 * <p>휴대폰은 Apple 정책상 제공되지 않으므로, 디자이너 핸드오프 §4.3 의 "휴대폰 선택" 정책을 따른다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppleSocialUserInfo {

    /** {@code APPLE} 고정. 기존 SocialProvider 정규형과 정합. */
    private String provider;

    /** Apple identityToken 의 {@code sub} (영구 사용자 식별자). */
    private String providerUserId;

    /** Apple 이 제공한 이메일 — Private Relay 도메인 그대로. */
    private String email;

    /**
     * 이름 prefill — {@code givenName + " " + familyName} (한국어 표기 순서는 클라이언트에서 보정).
     */
    private String name;

    /** 닉네임 prefill — 기본은 {@link #name} 동일. */
    private String nickname;

    /** Apple Private Relay 여부 — 이메일 도메인 검사로 도출. */
    private boolean privateRelayEmail;
}
