package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.dto.UserAddressDto;

/**
 * 사용자 주소 Service 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface UserAddressService {
    
    /**
     * 사용자의 모든 주소 조회
     */
    List<UserAddressDto> getUserAddresses(Long userId);
    
    /**
     * 주소 상세 조회
     */
    UserAddressDto getAddress(Long addressId);
    
    /**
     * 주소 추가
     */
    UserAddressDto addAddress(Long userId, UserAddressDto addressDto);
    
    /**
     * 주소 수정
     */
    UserAddressDto updateAddress(Long addressId, UserAddressDto addressDto);
    
    /**
     * 주소 삭제
     */
    void deleteAddress(Long addressId);
    
    /**
     * 기본 주소 설정
     */
    UserAddressDto setPrimaryAddress(Long userId, Long addressId);
    
    /**
     * 주소 타입별 조회
     */
    List<UserAddressDto> getAddressesByType(Long userId, String addressType);
    
    /**
     * 사용자의 기본 주소 조회
     */
    java.util.Optional<UserAddressDto> getPrimaryAddress(Long userId);
}
