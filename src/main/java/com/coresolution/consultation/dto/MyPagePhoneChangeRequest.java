package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 마이페이지 휴대전화 변경(Phase A) 요청 DTO.
 *
 * <p>본인이 새 휴대전화 번호로 SMS 인증을 받은 뒤 {@code newPhoneNumber} + {@code verificationCode}
 * 를 함께 전송한다. 서버는 OTP 단일 사용·5분 TTL 정책을 검증한 뒤 정규화·중복 검사·암호화 저장한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyPagePhoneChangeRequest {

    /**
     * 새 휴대전화 번호 — 사용자가 입력한 원본 문자열. 서버에서
     * {@link com.coresolution.consultation.util.LoginIdentifierUtils#normalizeAndValidateKoreanMobileForSms(String)}
     * 로 정규화한 뒤 검증한다.
     */
    @NotBlank(message = "새 휴대전화 번호를 입력해주세요.")
    private String newPhoneNumber;

    /**
     * SMS 발송 후 사용자가 입력한 6자리 OTP 코드.
     */
    @NotBlank(message = "인증 코드를 입력해주세요.")
    @Pattern(regexp = "^\\d{6}$", message = "6자리 인증 코드를 입력해주세요.")
    private String verificationCode;
}
