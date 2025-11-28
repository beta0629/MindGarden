package com.coresolution.user.service.impl;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.user.constant.ThemeConstants;
import com.coresolution.user.dto.ThemeResponse;
import com.coresolution.user.dto.ThemeUpdateRequest;
import com.coresolution.user.service.ThemeService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 테마 서비스 구현체
 * 사용자 테마 설정을 관리하는 비즈니스 로직 구현
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-27
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ThemeServiceImpl implements ThemeService {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // 기본 테마 설정 (하드코딩 제거 예정 - 공통코드 활용)
    private static final Map<String, String> DEFAULT_THEMES_BY_ROLE = Map.of(
        ThemeConstants.ROLE_CLIENT, ThemeConstants.THEME_CLIENT,
        ThemeConstants.ROLE_CONSULTANT, ThemeConstants.THEME_CONSULTANT, 
        ThemeConstants.ROLE_ADMIN, ThemeConstants.THEME_ADMIN,
        ThemeConstants.ROLE_PREFIX + ThemeConstants.ROLE_CLIENT, ThemeConstants.THEME_CLIENT,
        ThemeConstants.ROLE_PREFIX + ThemeConstants.ROLE_CONSULTANT, ThemeConstants.THEME_CONSULTANT,
        ThemeConstants.ROLE_PREFIX + ThemeConstants.ROLE_ADMIN, ThemeConstants.THEME_ADMIN
    );

    @Override
    @Transactional(readOnly = true)
    public ThemeResponse getUserTheme(String username) {
        log.debug("사용자 테마 설정 조회: username={}", username);
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new EntityNotFoundException(
                ThemeConstants.formatError(ThemeConstants.ERROR_USER_NOT_FOUND, username)));

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

    @Override
    public ThemeResponse updateUserTheme(String username, ThemeUpdateRequest request) {
        log.info("사용자 테마 설정 업데이트: username={}, theme={}", username, request.getThemePreference());
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new EntityNotFoundException(
                ThemeConstants.formatError(ThemeConstants.ERROR_USER_NOT_FOUND, username)));

        // 테마 유효성 검사
        validateTheme(request.getThemePreference());

        // 사용자 테마 설정 업데이트
        user.setThemePreference(request.getThemePreference());
        
        if (request.getCustomThemeColors() != null) {
            try {
                String customColorsJson = objectMapper.writeValueAsString(request.getCustomThemeColors());
                user.setCustomThemeColors(customColorsJson);
            } catch (JsonProcessingException e) {
                log.error("커스텀 테마 색상 JSON 변환 실패: username={}", username, e);
                throw new RuntimeException(ThemeConstants.ERROR_CUSTOM_COLORS_SAVE_FAILED, e);
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

    @Override
    public ThemeResponse resetUserTheme(String username) {
        log.info("사용자 테마 설정 초기화: username={}", username);
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new EntityNotFoundException(
                ThemeConstants.formatError(ThemeConstants.ERROR_USER_NOT_FOUND, username)));

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

    @Override
    @Transactional(readOnly = true)
    public ThemeResponse getDefaultThemeByRole(String username) {
        log.debug("역할별 기본 테마 조회: username={}", username);
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new EntityNotFoundException(
                ThemeConstants.formatError(ThemeConstants.ERROR_USER_NOT_FOUND, username)));

        String defaultTheme = getDefaultThemeByRoleName(user.getRole().toString());

        return ThemeResponse.builder()
            .themePreference(defaultTheme)
            .customThemeColors(null)
            .role(user.getRole().toString())
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAvailableThemes() {
        log.debug("사용 가능한 테마 목록 조회");
        
        Map<String, Object> themes = new HashMap<>();
        
        themes.put(ThemeConstants.ROLE_CLIENT, Map.of(
            "name", ThemeConstants.THEME_CLIENT_NAME,
            "description", ThemeConstants.THEME_CLIENT_DESCRIPTION,
            "type", ThemeConstants.THEME_CLIENT,
            "preview", ThemeConstants.THEME_CLIENT_PREVIEW_COLOR
        ));
        
        themes.put(ThemeConstants.ROLE_CONSULTANT, Map.of(
            "name", ThemeConstants.THEME_CONSULTANT_NAME, 
            "description", ThemeConstants.THEME_CONSULTANT_DESCRIPTION,
            "type", ThemeConstants.THEME_CONSULTANT,
            "preview", ThemeConstants.THEME_CONSULTANT_PREVIEW_COLOR
        ));
        
        themes.put(ThemeConstants.ROLE_ADMIN, Map.of(
            "name", ThemeConstants.THEME_ADMIN_NAME,
            "description", ThemeConstants.THEME_ADMIN_DESCRIPTION, 
            "type", ThemeConstants.THEME_ADMIN,
            "preview", ThemeConstants.THEME_ADMIN_PREVIEW_COLOR
        ));

        return themes;
    }

    @Override
    @Transactional(readOnly = true)
    public ThemeResponse previewTheme(String username, ThemeUpdateRequest request) {
        log.debug("테마 미리보기: username={}, theme={}", username, request.getThemePreference());
        
        // 테마 유효성 검사
        validateTheme(request.getThemePreference());

        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new EntityNotFoundException(
                ThemeConstants.formatError(ThemeConstants.ERROR_USER_NOT_FOUND, username)));

        return ThemeResponse.builder()
            .themePreference(request.getThemePreference())
            .customThemeColors(request.getCustomThemeColors())
            .role(user.getRole().toString())
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ThemeResponse cancelThemePreview(String username) {
        log.debug("테마 미리보기 취소: username={}", username);
        return getUserTheme(username);
    }

    // ==================== Private 헬퍼 메서드들 ====================

    /**
     * 역할별 기본 테마 조회
     */
    private String getDefaultThemeByRoleName(String role) {
        return DEFAULT_THEMES_BY_ROLE.getOrDefault(role, ThemeConstants.THEME_ADMIN);
    }

    /**
     * 테마 유효성 검사
     */
    private void validateTheme(String themePreference) {
        if (themePreference == null || themePreference.trim().isEmpty()) {
            throw new IllegalArgumentException(ThemeConstants.ERROR_THEME_PREFERENCE_REQUIRED);
        }

        List<String> validThemes = Arrays.asList(ThemeConstants.VALID_THEME_TYPES);
        if (!validThemes.contains(themePreference.toLowerCase())) {
            throw new IllegalArgumentException(
                ThemeConstants.formatError(ThemeConstants.ERROR_INVALID_THEME, themePreference));
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
            log.error("커스텀 테마 색상 파싱 실패: customThemeColors={}", customThemeColors, e);
            throw new RuntimeException(ThemeConstants.ERROR_CUSTOM_COLORS_PARSE_FAILED, e);
        }
    }
}
