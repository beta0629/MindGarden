package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 관리자 통합 사용자 관리에서 이름·이메일·전화번호만 수정할 때 사용.
 * 저장 시 서비스에서 개인정보 필드는 암호화합니다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminManagedUserBasicUpdateRequest {

    @NotBlank(message = "이름은 필수입니다.")
    @Size(max = 200, message = "이름은 200자 이하여야 합니다.")
    private String name;

    @NotBlank(message = "이메일은 필수입니다.")
    @Size(max = 320, message = "이메일은 320자 이하여야 합니다.")
    private String email;

    /** 비우면 전화번호를 저장하지 않음(null). */
    @Size(max = 50, message = "전화번호는 50자 이하여야 합니다.")
    private String phone;
}
