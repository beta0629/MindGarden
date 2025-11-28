package com.coresolution.user.service;

import com.coresolution.user.dto.ThemeResponse;
import com.coresolution.user.dto.ThemeUpdateRequest;

import java.util.Map;

/**
 * 테마 서비스 인터페이스
 * 사용자 테마 설정을 관리하는 비즈니스 로직 정의
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-27
 */
public interface ThemeService {
    
    /**
     * 사용자 테마 설정 조회
     * 
     * @param username 사용자명
     * @return 테마 설정 정보
     */
    ThemeResponse getUserTheme(String username);
    
    /**
     * 사용자 테마 설정 업데이트
     * 
     * @param username 사용자명
     * @param request 테마 업데이트 요청
     * @return 업데이트된 테마 설정
     */
    ThemeResponse updateUserTheme(String username, ThemeUpdateRequest request);
    
    /**
     * 사용자 테마 설정 초기화
     * 
     * @param username 사용자명
     * @return 초기화된 테마 설정
     */
    ThemeResponse resetUserTheme(String username);
    
    /**
     * 사용자 역할별 기본 테마 조회
     * 
     * @param username 사용자명
     * @return 역할별 기본 테마
     */
    ThemeResponse getDefaultThemeByRole(String username);
    
    /**
     * 사용 가능한 테마 목록 조회
     * 
     * @return 사용 가능한 테마 목록
     */
    Map<String, Object> getAvailableThemes();
    
    /**
     * 테마 미리보기 (임시 적용)
     * 
     * @param username 사용자명
     * @param request 테마 미리보기 요청
     * @return 미리보기 테마 설정
     */
    ThemeResponse previewTheme(String username, ThemeUpdateRequest request);
    
    /**
     * 테마 미리보기 취소
     * 
     * @param username 사용자명
     * @return 원본 테마 설정
     */
    ThemeResponse cancelThemePreview(String username);
}
