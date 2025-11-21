package com.coresolution.consultation.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 사용자 프로필 업데이트 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileUpdateRequest {
    
    private String userId;
    private String name;
    private String nickname;
    private String phone;
    private String birthDate;
    private String email;
    private String bio;
    private String occupation;
    private String location;
    private String interests;
    private Boolean emailNotification;
    private Boolean smsNotification;
}
