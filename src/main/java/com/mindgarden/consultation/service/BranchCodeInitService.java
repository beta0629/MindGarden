package com.mindgarden.consultation.service;

import java.time.LocalDateTime;
import java.util.List;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.repository.CommonCodeRepository;
import com.mindgarden.consultation.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 지점 코드 초기화 서비스
 * HQ 본사 코드 추가를 위한 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BranchCodeInitService {
    
    private final CommonCodeRepository commonCodeRepository;
    private final UserRepository userRepository;
    
    /**
     * HQ 본사 코드 초기화
     */
    public void initializeHQBranchCode() {
        try {
            log.info("HQ 본사 코드 초기화 시작");
            
            // 1. HQ 본사 코드가 이미 있는지 확인
            var existingHQ = commonCodeRepository.findByCodeGroupAndCodeValue("BRANCH", "HQ");
            
            if (existingHQ.isEmpty()) {
                // 2. HQ 본사 코드 생성
                CommonCode hqCode = new CommonCode();
                hqCode.setCodeGroup("BRANCH");
                hqCode.setCodeValue("HQ");
                hqCode.setCodeLabel("본사");
                hqCode.setCodeDescription("마인드가든 본사");
                hqCode.setSortOrder(1);
                hqCode.setIsActive(true);
                hqCode.setIsDeleted(false);
                hqCode.setCreatedAt(LocalDateTime.now());
                hqCode.setUpdatedAt(LocalDateTime.now());
                hqCode.setVersion(0);
                hqCode.setExtraData("{\"type\": \"headquarters\", \"address\": \"서울특별시 강남구 테헤란로 456\", \"phone\": \"02-1234-5678\", \"email\": \"hq@mindgarden.com\"}");
                
                commonCodeRepository.save(hqCode);
                log.info("HQ 본사 코드 생성 완료");
            } else {
                log.info("HQ 본사 코드가 이미 존재함");
            }
            
            // 3. 본사 관리자 계정들의 지점 코드를 HQ로 업데이트
            var hqAdminEmail = userRepository.findByEmail("super_hq_admin@mindgarden.com");
            if (hqAdminEmail.isPresent()) {
                var admin = hqAdminEmail.get();
                admin.setBranchCode("HQ");
                admin.setUpdatedAt(LocalDateTime.now());
                userRepository.save(admin);
                log.info("본사 관리자 계정 지점 코드 업데이트: {} -> HQ", admin.getEmail());
            }
            
            // 4. 본사 역할의 모든 사용자 업데이트
            var hqUsers = userRepository.findByRoleIn(List.of("HQ_ADMIN", "SUPER_HQ_ADMIN", "HQ_MASTER"));
            for (var user : hqUsers) {
                if (!"HQ".equals(user.getBranchCode())) {
                    user.setBranchCode("HQ");
                    user.setUpdatedAt(LocalDateTime.now());
                    userRepository.save(user);
                    log.info("본사 사용자 지점 코드 업데이트: {} -> HQ", user.getEmail());
                }
            }
            
            log.info("HQ 본사 코드 초기화 완료. 업데이트된 사용자 수: {}", hqUsers.size() + (hqAdminEmail.isPresent() ? 1 : 0));
            
        } catch (Exception e) {
            log.error("HQ 본사 코드 초기화 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("HQ 본사 코드 초기화 실패", e);
        }
    }
}
