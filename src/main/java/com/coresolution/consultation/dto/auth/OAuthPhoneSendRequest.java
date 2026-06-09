package com.coresolution.consultation.dto.auth;

import com.coresolution.consultation.entity.auth.OAuthProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * provider-agnostic OAuth 휴대폰 매칭 흐름 — OTP 발송 요청 본문.
 *
 * <p>{@code POST /api/v1/oauth/phone/send} 엔드포인트가 받는다.
 * Apple/Google/Kakao/Naver 4 종 provider 가 동일 스키마로 호출한다.</p>
 *
 * <p>기존 {@code ApplePhoneSendRequest} 와 비교하면 {@link #oauthProvider} 필드가 추가됐다.
 * Apple 전용 alias 엔드포인트({@code /api/v1/auth/oauth/apple/phone/send}) 는 본 DTO 와
 * 무관하게 Apple 전용 {@code ApplePhoneSendRequest} 를 그대로 사용한다(FE PR #161 호환).</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OAuthPhoneSendRequest {

    /** 어떤 OAuth provider 흐름인지 식별. */
    @NotNull(message = "oauthProvider 는 필수입니다.")
    private OAuthProvider oauthProvider;

    /** OAuth 콜백 응답으로 받은 단기 JWT (provider 별 sub + tenantId 포함). */
    @NotBlank(message = "phoneVerificationToken 은 필수입니다.")
    @Size(max = 4096)
    private String phoneVerificationToken;

    /** 한국 휴대폰 번호. 정규화 후 SHA-256 hex 만 저장. */
    @NotBlank(message = "phone 은 필수입니다.")
    @Size(max = 32)
    private String phone;
}
