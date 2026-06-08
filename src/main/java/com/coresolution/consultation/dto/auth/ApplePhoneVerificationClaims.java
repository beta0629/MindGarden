package com.coresolution.consultation.dto.auth;

import lombok.Builder;
import lombok.Value;

/**
 * Apple SIWA 휴대폰 매칭 흐름 1단계 토큰({@code phoneVerificationToken}) 의 클레임.
 *
 * <p>발급 조건: Apple identityToken 검증 후 apple_sub 매칭 사용자가 없을 때 발급.
 * 클라이언트는 이 토큰을 가지고 휴대폰 입력 화면으로 이동하고, OTP send/verify 호출 시 함께 전송한다.</p>
 *
 * <p>Apple Private Relay 이메일·이름은 첫 로그인에서만 Apple 이 제공하므로 본 토큰에 박아둬,
 * verify 단계에서 신규 가입을 만들 때 prefill 로 사용한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */
@Value
@Builder
public class ApplePhoneVerificationClaims {

    /** 멀티테넌트 격리 — 발급 시점의 테넌트 ID. */
    String tenantId;

    /** 항상 {@code APPLE}. 다른 provider 와 토큰을 섞지 않기 위해 명시. */
    String provider;

    /** Apple identityToken 의 sub. apple_sub 컬럼과 정합. */
    String providerUserId;

    /** Apple 이 첫 로그인에 제공한 이메일(정규화 전 — 저장은 verify 단계에서 정규화). */
    String email;

    /** Apple 이 첫 로그인에 제공한 이름(family + given). */
    String name;

    /** 표시용 닉네임(없으면 name 과 동일). */
    String nickname;
}
