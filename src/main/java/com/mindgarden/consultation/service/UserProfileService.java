package com.mindgarden.consultation.service;

import com.mindgarden.consultation.dto.UserProfileResponse;
import com.mindgarden.consultation.dto.UserProfileUpdateRequest;

/**
 * 유저 프로필 관리 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface UserProfileService {
    
    /**
     * 유저 프로필 추가 정보 등록/수정
     * 
     * @param userId 사용자 ID
     * @param request 추가할 프로필 정보
     * @return 업데이트된 프로필 정보
     */
    UserProfileResponse updateUserProfile(Long userId, UserProfileUpdateRequest request);
    
    /**
     * 유저 프로필 조회
     * 
     * @param userId 사용자 ID
     * @return 유저 프로필 정보
     */
    UserProfileResponse getUserProfile(Long userId);
    
    /**
     * 유저 역할 변경
     * 
     * @param userId 사용자 ID
     * @param newRole 새로운 역할
     * @return 역할 변경 결과
     */
    boolean changeUserRole(Long userId, com.mindgarden.consultation.constant.UserRole newRole);
    
    /**
     * 유저 프로필 완성도 확인
     * 
     * @param userId 사용자 ID
     * @return 프로필 완성도 (0-100%)
     */
    int getProfileCompletionRate(Long userId);
    
    /**
     * 상담사 자격 요건 확인
     * 
     * @param userId 사용자 ID
     * @return 상담사 자격 요건 충족 여부
     */
    boolean checkConsultantEligibility(Long userId);
}
