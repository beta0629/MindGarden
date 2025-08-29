package com.mindgarden.consultation.service;

import com.mindgarden.consultation.dto.MyPageResponse;
import com.mindgarden.consultation.dto.MyPageUpdateRequest;


/**
 * 마이페이지 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface MyPageService {

    /**
     * 마이페이지 정보 조회
     */
    MyPageResponse getMyPageInfo(Long userId);

    /**
     * 마이페이지 정보 수정
     */
    MyPageResponse updateMyPageInfo(Long userId, MyPageUpdateRequest request);

    /**
     * 프로필 이미지 업로드
     */
    String uploadProfileImage(Long userId, String imageUrl);

    /**
     * 비밀번호 변경
     */
    String changePassword(Long userId, String newPassword);

    /**
     * 소셜 계정 정보 조회
     */
    String getSocialAccountInfo(Long userId);

    /**
     * 소셜 계정 연결
     */
    String linkSocialAccount(Long userId, String socialType, String socialId);

    /**
     * 소셜 계정 연결 해제
     */
    String unlinkSocialAccount(Long userId, String socialType);

    /**
     * 계정 탈퇴
     */
    String deleteAccount(String username);
}
