package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 통합 소셜 사용자 정보 DTO
 * 모든 소셜 플랫폼의 사용자 정보를 표준화하여 저장
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialUserInfo {
    
    /**
     * 소셜 제공자 (KAKAO, NAVER, FACEBOOK, INSTAGRAM 등)
     */
    private String provider;
    
    /**
     * 소셜 제공자 사용자 ID
     */
    private String providerUserId;
    
    /**
     * 소셜 계정 이메일
     */
    private String email;
    
    /**
     * 소셜 계정 이름
     */
    private String name;
    
    /**
     * 소셜 계정 닉네임
     */
    private String nickname;
    
    /**
     * 소셜 계정 프로필 이미지 URL
     */
    private String profileImageUrl;
    
    /**
     * 소셜 계정 연령대
     */
    private String ageRange;
    
    /**
     * 소셜 계정 성별
     */
    private String gender;
    
    /**
     * 소셜 계정 생일
     */
    private String birthday;
    
    /**
     * 소셜 계정 휴대폰 번호
     */
    private String phone;
    
    /**
     * 소셜 계정 타입 (카카오계정, 카카오톡, 네이버계정 등)
     */
    private String accountType;
    
    /**
     * 소셜 계정 메타데이터 (JSON 형태로 추가 정보 저장)
     */
    private String metadata;
    
    /**
     * 액세스 토큰
     */
    private String accessToken;
    
    /**
     * 리프레시 토큰
     */
    private String refreshToken;
    
    /**
     * 토큰 만료 시간
     */
    private Long tokenExpiresIn;
    
    /**
     * 소셜 계정 정보를 표준화된 형태로 변환
     */
    public void normalizeData() {
        // 이메일이 없는 경우 처리
        if (this.email == null || this.email.trim().isEmpty()) {
            this.email = this.providerUserId + "@" + this.provider.toLowerCase() + ".social";
        }
        
        // 이름이 없는 경우 닉네임으로 대체
        if ((this.name == null || this.name.trim().isEmpty()) && this.nickname != null) {
            this.name = this.nickname;
        }
        
        // 닉네임이 없는 경우 이름으로 대체
        if ((this.nickname == null || this.nickname.trim().isEmpty()) && this.name != null) {
            this.nickname = this.name;
        }
        
        // 성별 표준화
        if (this.gender != null) {
            this.gender = this.gender.toUpperCase();
            if (this.gender.equals("M") || this.gender.equals("MALE") || this.gender.equals("남성")) {
                this.gender = "MALE";
            } else if (this.gender.equals("F") || this.gender.equals("FEMALE") || this.gender.equals("여성")) {
                this.gender = "FEMALE";
            } else {
                this.gender = "OTHER";
            }
        }
    }
    
    /**
     * 생년월일을 LocalDate로 변환
     */
    public LocalDate getBirthDate() {
        if (this.birthday == null || this.birthday.trim().isEmpty()) {
            return null;
        }
        
        try {
            // 다양한 형식의 생년월일 처리
            if (this.birthday.contains("-")) {
                return LocalDate.parse(this.birthday);
            } else if (this.birthday.length() == 8) {
                // YYYYMMDD 형식
                String year = this.birthday.substring(0, 4);
                String month = this.birthday.substring(4, 6);
                String day = this.birthday.substring(6, 8);
                return LocalDate.of(Integer.parseInt(year), Integer.parseInt(month), Integer.parseInt(day));
            } else if (this.birthday.length() == 6) {
                // MMDD 형식 (연도는 현재 연도 사용)
                String month = this.birthday.substring(0, 2);
                String day = this.birthday.substring(2, 4);
                int currentYear = LocalDate.now().getYear();
                return LocalDate.of(currentYear, Integer.parseInt(month), Integer.parseInt(day));
            }
        } catch (Exception e) {
            // 파싱 실패 시 null 반환
        }
        
        return null;
    }
}
