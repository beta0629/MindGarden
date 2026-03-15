package com.coresolution.consultation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 스태프(사무원) 등록 요청 DTO
 * - 내담자/상담사 등록과 동일하게 이메일·이름·비밀번호·전화번호로 신규 사용자 생성 후 role=STAFF 부여
 *
 * @author Core Solution
 * @since 2026-02
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffRegistrationRequest {

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    /** 비밀번호: 미입력 시 임시 비밀번호 자동 생성 */
    private String password;

    private String name;

    private String phone;

    /** 프로필 사진 (base64 data URL, 선택) */
    private String profileImageUrl;
}
