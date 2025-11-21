package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * 상담사 프로필 추가 등록 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantProfileRequest {
    
    @NotBlank(message = "성별은 필수입니다.")
    @Size(max = 10, message = "성별은 10자 이하여야 합니다.")
    private String gender;
    
    @NotNull(message = "생년월일은 필수입니다.")
    private LocalDate birthDate;
    
    @NotBlank(message = "전문 분야는 필수입니다.")
    @Size(max = 100, message = "전문 분야는 100자 이하여야 합니다.")
    private String specialty;
    
    @Size(max = 500, message = "자격증 정보는 500자 이하여야 합니다.")
    private String qualifications;
    
    @Size(max = 1000, message = "경력 사항은 1000자 이하여야 합니다.")
    private String experience;
    
    @Size(max = 500, message = "상담 가능 시간은 500자 이하여야 합니다.")
    private String availableTime;
    
    @Size(max = 2000, message = "자기소개는 2000자 이하여야 합니다.")
    private String introduction;
    
    @Size(max = 500, message = "학력 정보는 500자 이하여야 합니다.")
    private String education;
    
    @Size(max = 500, message = "수상 경력은 500자 이하여야 합니다.")
    private String awards;
    
    @Size(max = 1000, message = "연구 실적은 1000자 이하여야 합니다.")
    private String research;
    
    // 상담 가능 분야 목록
    private List<String> counselingAreas;
    
    // 상담 가능 연령대
    private List<String> targetAgeGroups;
    
    // 상담 방식 (대면/비대면/혼합)
    private String counselingMethod;
    
    // 상담료 (시간당)
    private Integer hourlyRate;
    
    // 상담 가능 지역
    private List<String> availableLocations;
}
