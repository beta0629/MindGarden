/**
 * 테마 응답 DTO
 */

package com.mindgarden.user.dto;

import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테마 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThemeResponse {
    
    private String themePreference;
    private Map<String, String> customThemeColors;
    private String role;
    
    // 추가 정보
    private String themeName;
    private String themeDescription;
    private String previewColor;
}
