package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 마이페이지 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyPageResponse {

    private Long id;
    private String username;
    private String email;
    private String name;
    private String phone;
    private String address;
    private String addressDetail;
    private String postalCode;
    private String profileImage;
    private String role;
    private String grade;
    private Long experiencePoints;
    private Integer totalConsultations;
    private LocalDateTime lastLoginAt;
    private Boolean isActive;
    private Boolean isEmailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
