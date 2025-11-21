/**
 * 테마 서비스
 * 사용자 테마 설정을 관리하는 비즈니스 로직
 */

package com.coresolution.user.service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.user.dto.ThemeResponse;
import com.coresolution.user.dto.ThemeUpdateRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 테마 서비스 구현체
 */
@Service
@Transactional
public class ThemeService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    // 기본 테마 설정
    private static final Map<String, String> DEFAULT_THEMES_BY_ROLE = Map.of(
        "CLIENT", "client",
        "CONSULTANT", "consultant", 
        "ADMIN", "admin",
        "ROLE_CLIENT", "client",
        "ROLE_CONSULTANT", "consultant",
        "ROLE_ADMIN", "admin"
    );

    /**
     * 사용자 테마 설정 조회
     */
    public ThemeResponse getUserTheme(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + username));

        String themePreference = user.getThemePreference();
        String customThemeColors = user.getCustomThemeColors();

        // 테마 설정이 없으면 역할별 기본 테마 사용
        if (themePreference == null) {
            themePreference = getDefaultThemeByRoleName(user.getRole().toString());
        }

        return ThemeResponse.builder()
            .themePreference(themePreference)
            .customThemeColors(parseCustomColors(customThemeColors))
            .role(user.getRole().toString())
            .build();
    }

    /**
     * 사용자 테마 설정 업데이트
     */
    public ThemeResponse updateUserTheme(String username, ThemeUpdateRequest request) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + username));

        // 테마 유효성 검사
        validateTheme(request.getThemePreference());

        // 사용자 테마 설정 업데이트
        user.setThemePreference(request.getThemePreference());
        
        if (request.getCustomThemeColors() != null) {
            try {
                String customColorsJson = objectMapper.writeValueAsString(request.getCustomThemeColors());
                user.setCustomThemeColors(customColorsJson);
            } catch (JsonProcessingException e) {
                throw new RuntimeException("커스텀 테마 색상 저장에 실패했습니다.", e);
            }
        } else {
            user.setCustomThemeColors(null);
        }

        userRepository.save(user);

        return ThemeResponse.builder()
            .themePreference(user.getThemePreference())
            .customThemeColors(request.getCustomThemeColors())
            .role(user.getRole().toString())
            .build();
    }

    /**
     * 사용자 테마 설정 초기화
     */
    public ThemeResponse resetUserTheme(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + username));

        // 역할별 기본 테마로 초기화
        String defaultTheme = getDefaultThemeByRoleName(user.getRole().toString());
        user.setThemePreference(defaultTheme);
        user.setCustomThemeColors(null);

        userRepository.save(user);

        return ThemeResponse.builder()
            .themePreference(defaultTheme)
            .customThemeColors(null)
            .role(user.getRole().toString())
            .build();
    }

    /**
     * 사용자 역할별 기본 테마 조회
     */
    public ThemeResponse getDefaultThemeByRole(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + username));

        String defaultTheme = getDefaultThemeByRoleName(user.getRole().toString());

        return ThemeResponse.builder()
            .themePreference(defaultTheme)
            .customThemeColors(null)
            .role(user.getRole().toString())
            .build();
    }

    /**
     * 사용 가능한 테마 목록 조회
     */
    public Map<String, Object> getAvailableThemes() {
        Map<String, Object> themes = new HashMap<>();
        
        themes.put("CLIENT", Map.of(
            "name", "내담자 테마",
            "description", "화사한 분위기 (핑크 계열)",
            "type", "client",
            "preview", "#FFB6C1"
        ));
        
        themes.put("CONSULTANT", Map.of(
            "name", "상담사 테마", 
            "description", "활력 충만 분위기 (민트 그린 계열)",
            "type", "consultant",
            "preview", "#98FB98"
        ));
        
        themes.put("ADMIN", Map.of(
            "name", "관리자 테마",
            "description", "간결하고 깔끔한 분위기 (블루 계열)", 
            "type", "admin",
            "preview", "#87CEEB"
        ));

        return themes;
    }

    /**
     * 테마 미리보기 (임시 적용)
     * 실제로는 프론트엔드에서 처리하지만, 서버에서 검증만 수행
     */
    public ThemeResponse previewTheme(String username, ThemeUpdateRequest request) {
        // 테마 유효성 검사
        validateTheme(request.getThemePreference());

        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + username));

        return ThemeResponse.builder()
            .themePreference(request.getThemePreference())
            .customThemeColors(request.getCustomThemeColors())
            .role(user.getRole().toString())
            .build();
    }

    /**
     * 테마 미리보기 취소
     */
    public ThemeResponse cancelThemePreview(String username) {
        return getUserTheme(username);
    }

    /**
     * 역할별 기본 테마 조회
     */
    private String getDefaultThemeByRoleName(String role) {
        return DEFAULT_THEMES_BY_ROLE.getOrDefault(role, "admin");
    }

    /**
     * 테마 유효성 검사
     */
    private void validateTheme(String themePreference) {
        if (themePreference == null || themePreference.trim().isEmpty()) {
            throw new IllegalArgumentException("테마 설정이 올바르지 않습니다.");
        }

        List<String> validThemes = Arrays.asList("client", "consultant", "admin");
        if (!validThemes.contains(themePreference.toLowerCase())) {
            throw new IllegalArgumentException("지원하지 않는 테마입니다: " + themePreference);
        }
    }

    /**
     * 커스텀 색상 파싱
     */
    private Map<String, String> parseCustomColors(String customThemeColors) {
        if (customThemeColors == null || customThemeColors.trim().isEmpty()) {
            return null;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, String> result = objectMapper.readValue(customThemeColors, Map.class);
            return result;
        } catch (JsonProcessingException e) {
            throw new RuntimeException("커스텀 테마 색상 파싱에 실패했습니다.", e);
        }
    }
}
