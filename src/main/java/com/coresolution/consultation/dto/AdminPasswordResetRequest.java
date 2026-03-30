package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 관리자 비밀번호 초기화 요청 DTO
 * 쿼리 파라미터 대신 body로 전달하여 특수문자(+, & 등) 변형 방지
 *
 * @author MindGarden
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminPasswordResetRequest {

    @NotBlank(message = "새 비밀번호는 필수입니다.")
    @Size(min = 8, max = 100, message = "비밀번호는 8자 이상 100자 이하여야 합니다.")
    private String newPassword;
}
