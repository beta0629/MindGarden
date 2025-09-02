package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 마이페이지 정보 수정 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyPageUpdateRequest {

    private String name;
    private String nickname;
    private String phone;
    private String gender;
    private String profileImage;

    // 주소 업데이트용 필드 (user_addresses 테이블과 매핑)
    private String addressType;      // HOME, WORK 등
    private String postalCode;       // 우편번호
    private String address;          // 시/도 + 구/군 + 동/읍/면 (기본 주소 문자열)
    private String addressDetail;    // 상세 주소
    private Boolean isPrimary;       // 기본 주소로 설정 여부
}
