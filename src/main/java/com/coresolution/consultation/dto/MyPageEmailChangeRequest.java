package com.coresolution.consultation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 마이페이지 이메일 변경(Phase B) 요청 DTO.
 *
 * <p>본인이 새 이메일로 OTP 인증을 받은 뒤 {@code newEmail} + {@code verificationCode} 를
 * 함께 전송한다. 서버는 OTP 단일 사용·5분 TTL 정책을 검증하고, 정규화·tenant 내 중복 가드를
 * 통과시킨 뒤 새 이메일을 저장한다. 이메일은 사용자 키이므로 변경 직후 모든 활성 세션·refresh
 * token 이 강제 무효화된다 (재로그인 유도).</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyPageEmailChangeRequest {

    /**
     * 새 이메일 — 사용자가 입력한 원본 문자열. 서버에서 {@code trim().toLowerCase()} 정규화 후
     * 저장한다.
     */
    @NotBlank(message = "새 이메일을 입력해주세요.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String newEmail;

    /**
     * 새 이메일로 발송된 6자리 OTP 코드.
     */
    @NotBlank(message = "인증 코드를 입력해주세요.")
    @Pattern(regexp = "^\\d{6}$", message = "6자리 인증 코드를 입력해주세요.")
    private String verificationCode;
}
