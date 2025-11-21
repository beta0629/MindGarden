/**
 * 테마 관련 DTO 클래스들
 */

package com.coresolution.user.dto;

import java.util.Map;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테마 업데이트 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThemeUpdateRequest {
    
    @NotBlank(message = "테마 설정은 필수입니다.")
    @Pattern(regexp = "^(client|consultant|admin)$", message = "올바른 테마를 선택해주세요.")
    private String themePreference;
    
    private Map<String, String> customThemeColors;
}
