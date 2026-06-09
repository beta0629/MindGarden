package com.coresolution.consultation.service;

import java.util.Map;
import com.coresolution.consultation.dto.ConsultantApplicationRequest;
import com.coresolution.consultation.dto.UserProfileResponse;
import com.coresolution.consultation.dto.UserProfileUpdateRequest;

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
    boolean changeUserRole(Long userId, com.coresolution.consultation.constant.UserRole newRole);
    
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
    
    /**
     * 상담사 신청
     * 
     * @param userId 사용자 ID
     * @param request 상담사 신청 정보
     * @return 신청 결과
     */
    Map<String, Object> applyForConsultant(Long userId, ConsultantApplicationRequest request);

    /**
     * 프로필 이미지 URL 만 영속화한다. {@link com.coresolution.consultation.util.ProfileImageUrlGuard}
     * 입력 가드를 재실행해 base64 dataURI · 길이 초과를 차단한다.
     *
     * <p>P0 영구 대책 Phase 2 — 2026-06-09. 신설된 {@code POST /api/v1/users/profile/{userId}/image}
     * 가 storage 에 파일을 저장한 직후 호출한다.</p>
     *
     * @param userId 대상 사용자 PK
     * @param url    {@code /api/v1/files/profile-images/{file}} 형태 또는 외부 URL
     * @return 업데이트된 URL (가드 통과한 값)
     */
    String updateProfileImageUrl(Long userId, String url);
}
