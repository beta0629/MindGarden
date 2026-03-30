package com.coresolution.consultation.controller;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.dto.UserAddressDto;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.UserAddressService;
import com.coresolution.consultation.utils.SessionUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 사용자 주소 관리 Controller
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/users/addresses") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class UserAddressController {
    
    private final UserAddressService userAddressService;
    
    /**
     * 사용자의 모든 주소 조회
     */
        @GetMapping
    public ResponseEntity<List<UserAddressDto>> getUserAddresses(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.error("❌ 로그인된 사용자 정보가 없습니다");
                return ResponseEntity.status(401).build();
            }

            log.info("🔍 사용자 주소 조회: userId={}", currentUser.getId());
            List<UserAddressDto> addresses = userAddressService.getUserAddresses(currentUser.getId());
            log.info("✅ 주소 조회 완료: userId={}, count={}", currentUser.getId(), addresses.size());

            return ResponseEntity.ok(addresses);
        } catch (Exception e) {
            log.error("❌ 주소 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 주소 상세 조회
     */
    @GetMapping("/{addressId}")
    public ResponseEntity<UserAddressDto> getAddress(@PathVariable Long addressId) {
        try {
            log.info("🔍 주소 상세 조회: addressId={}", addressId);
            
            UserAddressDto address = userAddressService.getAddress(addressId);
            return ResponseEntity.ok(address);
        } catch (Exception e) {
            log.error("❌ 주소 상세 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 주소 추가
     */
    @PostMapping
    public ResponseEntity<UserAddressDto> addAddress(
            HttpSession session,
            @RequestBody UserAddressDto addressDto) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.error("❌ 로그인된 사용자 정보가 없습니다");
                return ResponseEntity.status(401).build();
            }
            
            log.info("➕ 주소 추가: userId={}", currentUser.getId());
            UserAddressDto savedAddress = userAddressService.addAddress(currentUser.getId(), addressDto);
            log.info("✅ 주소 추가 완료: addressId={}", savedAddress.getId());
            
            return ResponseEntity.ok(savedAddress);
        } catch (Exception e) {
            log.error("❌ 주소 추가 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 주소 수정
     */
    @PutMapping("/{addressId}")
    public ResponseEntity<UserAddressDto> updateAddress(
            @PathVariable Long addressId,
            @RequestBody UserAddressDto addressDto) {
        try {
            log.info("✏️ 주소 수정: addressId={}", addressId);
            
            UserAddressDto updatedAddress = userAddressService.updateAddress(addressId, addressDto);
            return ResponseEntity.ok(updatedAddress);
        } catch (Exception e) {
            log.error("❌ 주소 수정 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 주소 삭제
     */
    @DeleteMapping("/{addressId}")
    public ResponseEntity<Map<String, String>> deleteAddress(@PathVariable Long addressId) {
        try {
            log.info("🗑️ 주소 삭제: addressId={}", addressId);
            
            userAddressService.deleteAddress(addressId);
            return ResponseEntity.ok(Map.of("message", "주소가 성공적으로 삭제되었습니다."));
        } catch (Exception e) {
            log.error("❌ 주소 삭제 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 기본 주소 설정
     */
    @PutMapping("/{addressId}/primary")
    public ResponseEntity<UserAddressDto> setPrimaryAddress(
            HttpSession session,
            @PathVariable Long addressId) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.error("❌ 로그인된 사용자 정보가 없습니다");
                return ResponseEntity.status(401).build();
            }
            
            log.info("⭐ 기본 주소 설정: userId={}, addressId={}", currentUser.getId(), addressId);
            UserAddressDto primaryAddress = userAddressService.setPrimaryAddress(currentUser.getId(), addressId);
            return ResponseEntity.ok(primaryAddress);
        } catch (Exception e) {
            log.error("❌ 기본 주소 설정 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 주소 타입별 조회
     */
    @GetMapping("/type/{addressType}")
    public ResponseEntity<List<UserAddressDto>> getAddressesByType(
            HttpSession session,
            @PathVariable String addressType) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.error("❌ 로그인된 사용자 정보가 없습니다");
                return ResponseEntity.status(401).build();
            }
            
            log.info("🔍 주소 타입별 조회: userId={}, type={}", currentUser.getId(), addressType);
            List<UserAddressDto> addresses = userAddressService.getAddressesByType(currentUser.getId(), addressType);
            return ResponseEntity.ok(addresses);
        } catch (Exception e) {
            log.error("❌ 주소 타입별 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
