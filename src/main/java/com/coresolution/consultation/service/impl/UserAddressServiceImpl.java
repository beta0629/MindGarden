package com.coresolution.consultation.service.impl;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.AddressType;
import com.coresolution.consultation.dto.UserAddressDto;
import com.coresolution.consultation.entity.UserAddress;
import com.coresolution.consultation.repository.UserAddressRepository;
import com.coresolution.consultation.service.UserAddressService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 사용자 주소 Service 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserAddressServiceImpl implements UserAddressService {
    
    private final UserAddressRepository userAddressRepository;
    
    @Override
    @Transactional(readOnly = true)
    public List<UserAddressDto> getUserAddresses(Long userId) {
        log.info("🔍 사용자 주소 조회: userId={}", userId);
        
        List<UserAddress> addresses = userAddressRepository.findByUserIdAndIsDeletedFalseOrderByIsPrimaryDescCreatedAtAsc(userId);
        
        return addresses.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserAddressDto getAddress(Long addressId) {
        log.info("🔍 주소 상세 조회: addressId={}", addressId);
        
        UserAddress address = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("주소를 찾을 수 없습니다: " + addressId));
        
        return convertToDto(address);
    }
    
    @Override
    public UserAddressDto addAddress(Long userId, UserAddressDto addressDto) {
        log.info("➕ 주소 추가: userId={}, type={}", userId, addressDto.getAddressType());
        
        UserAddress address = convertToEntity(addressDto);
        address.setUserId(userId);
        
        // 기본 주소로 설정하는 경우, 기존 기본 주소 해제
        if (Boolean.TRUE.equals(addressDto.getIsPrimary())) {
            setPrimaryAddress(userId, null);
        }
        
        UserAddress savedAddress = userAddressRepository.save(address);
        return convertToDto(savedAddress);
    }
    
    @Override
    public UserAddressDto updateAddress(Long addressId, UserAddressDto addressDto) {
        log.info("✏️ 주소 수정: addressId={}", addressId);
        
        UserAddress address = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("주소를 찾을 수 없습니다: " + addressId));
        
        // 기본 주소로 설정하는 경우, 기존 기본 주소 해제
        if (Boolean.TRUE.equals(addressDto.getIsPrimary()) && !Boolean.TRUE.equals(address.getIsPrimary())) {
            setPrimaryAddress(address.getUserId(), null);
        }
        
        updateAddressFields(address, addressDto);
        UserAddress updatedAddress = userAddressRepository.save(address);
        
        return convertToDto(updatedAddress);
    }
    
    @Override
    public void deleteAddress(Long addressId) {
        log.info("🗑️ 주소 삭제: addressId={}", addressId);
        
        UserAddress address = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("주소를 찾을 수 없습니다: " + addressId));
        
        address.setIsDeleted(true);
        userAddressRepository.save(address);
    }
    
    @Override
    public UserAddressDto setPrimaryAddress(Long userId, Long addressId) {
        log.info("⭐ 기본 주소 설정: userId={}, addressId={}", userId, addressId);
        
        // 기존 기본 주소 해제
        userAddressRepository.findByUserIdAndIsPrimaryTrueAndIsDeletedFalse(userId)
                .ifPresent(address -> {
                    address.setIsPrimary(false);
                    userAddressRepository.save(address);
                });
        
        // 새로운 기본 주소 설정
        if (addressId != null) {
            UserAddress address = userAddressRepository.findById(addressId)
                    .orElseThrow(() -> new RuntimeException("주소를 찾을 수 없습니다: " + addressId));
            
            address.setIsPrimary(true);
            UserAddress savedAddress = userAddressRepository.save(address);
            return convertToDto(savedAddress);
        }
        
        return null;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserAddressDto> getAddressesByType(Long userId, String addressType) {
        log.info("🔍 주소 타입별 조회: userId={}, type={}", userId, addressType);
        
        List<UserAddress> addresses = userAddressRepository.findByUserIdAndAddressTypeAndIsDeletedFalse(userId, addressType);
        
        return addresses.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<UserAddressDto> getPrimaryAddress(Long userId) {
        log.info("🔍 기본 주소 조회: userId={}", userId);
        
        Optional<UserAddress> address = userAddressRepository.findByUserIdAndIsPrimaryTrueAndIsDeletedFalse(userId);
        
        return address.map(this::convertToDto);
    }
    
    // DTO <-> Entity 변환 메서드들
    private UserAddressDto convertToDto(UserAddress address) {
        return UserAddressDto.builder()
                .id(address.getId())
                .addressType(address.getAddressType())
                .addressTypeDisplayName(AddressType.getDisplayName(address.getAddressType()))
                .isPrimary(address.getIsPrimary())
                .province(address.getProvince())
                .city(address.getCity())
                .district(address.getDistrict())
                .detailAddress(address.getDetailAddress())
                .postalCode(address.getPostalCode())
                .reference(address.getReference())
                .latitude(address.getLatitude())
                .longitude(address.getLongitude())
                .fullAddress(address.getFullAddress())
                .fullAddressWithPostalCode(address.getFullAddressWithPostalCode())
                .build();
    }
    
    private UserAddress convertToEntity(UserAddressDto dto) {
        UserAddress address = new UserAddress();
        updateAddressFields(address, dto);
        return address;
    }
    
    private void updateAddressFields(UserAddress address, UserAddressDto dto) {
        if (dto.getAddressType() != null) {
            address.setAddressType(dto.getAddressType());
        }
        if (dto.getIsPrimary() != null) {
            address.setIsPrimary(dto.getIsPrimary());
        }
        if (dto.getProvince() != null) {
            address.setProvince(dto.getProvince());
        }
        if (dto.getCity() != null) {
            address.setCity(dto.getCity());
        }
        if (dto.getDistrict() != null) {
            address.setDistrict(dto.getDistrict());
        }
        if (dto.getDetailAddress() != null) {
            address.setDetailAddress(dto.getDetailAddress());
        }
        if (dto.getPostalCode() != null) {
            address.setPostalCode(dto.getPostalCode());
        }
        if (dto.getReference() != null) {
            address.setReference(dto.getReference());
        }
        if (dto.getLatitude() != null) {
            address.setLatitude(dto.getLatitude());
        }
        if (dto.getLongitude() != null) {
            address.setLongitude(dto.getLongitude());
        }
    }
}
