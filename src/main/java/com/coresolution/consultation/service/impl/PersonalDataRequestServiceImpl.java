package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.entity.PersonalDataAccessLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.PersonalDataAccessLogRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.PersonalDataRequestService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 개인정보 열람/삭제 요청 서비스 구현체
 * 개인정보보호법 준수를 위한 서비스 구현
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PersonalDataRequestServiceImpl implements PersonalDataRequestService {
    
    private final UserRepository userRepository;
    private final PersonalDataAccessLogRepository personalDataAccessLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final PersonalDataEncryptionUtil encryptionUtil;
    
    @Override
    public Map<String, Object> requestPersonalDataAccess(Long userId, HttpServletRequest request) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
            }
            
            User user = userOpt.get();
            
            // 개인정보 복호화
            String decryptedName = encryptionUtil.safeDecrypt(user.getName());
            String decryptedEmail = user.getEmail(); // 이메일은 암호화하지 않음
            String decryptedPhone = encryptionUtil.safeDecrypt(user.getPhone());
            String decryptedNickname = encryptionUtil.safeDecrypt(user.getNickname());
            String decryptedGender = encryptionUtil.safeDecrypt(user.getGender());
            
            // 개인정보 열람 결과 구성
            Map<String, Object> personalData = new HashMap<>();
            personalData.put("id", user.getId());
            personalData.put("name", decryptedName);
            personalData.put("email", decryptedEmail);
            personalData.put("phone", decryptedPhone);
            personalData.put("nickname", decryptedNickname);
            personalData.put("gender", decryptedGender);
            personalData.put("birthDate", user.getBirthDate());
            personalData.put("createdAt", user.getCreatedAt());
            personalData.put("updatedAt", user.getUpdatedAt());
            personalData.put("branchCode", user.getBranchCode());
            
            // 개인정보 접근 로그 기록
            personalDataAccessLogRepository.save(PersonalDataAccessLog.builder()
                .accessorId(userId.toString())
                .accessorName(decryptedName)
                .dataType("USER_INFO")
                .accessType("READ")
                .targetUserId(userId.toString())
                .targetUserName(decryptedName)
                .accessTime(LocalDateTime.now())
                .ipAddress(getClientIpAddress(request))
                .reason("사용자 본인 열람 요청")
                .result("SUCCESS")
                .dataIdentifier("USER_" + userId)
                .dataDetails("개인정보 열람 요청 처리 완료")
                .sessionId(request.getSession().getId())
                .userAgent(request.getHeader("User-Agent"))
                .build());
            
            log.info("✅ 개인정보 열람 요청 처리 완료: userId={}", userId);
            
            return Map.of(
                "success", true,
                "message", "개인정보 열람이 완료되었습니다.",
                "personalData", personalData,
                "accessedAt", LocalDateTime.now()
            );
            
        } catch (Exception e) {
            log.error("개인정보 열람 요청 처리 실패: userId={}, error={}", userId, e.getMessage(), e);
            throw new RuntimeException("개인정보 열람 요청 처리 중 오류가 발생했습니다.", e);
        }
    }
    
    @Override
    public Map<String, Object> requestPersonalDataDeletion(Long userId, String password, String reason, HttpServletRequest request) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
            }
            
            User user = userOpt.get();
            
            // 본인 확인: 비밀번호 검증
            if (password == null || password.isEmpty()) {
                throw new IllegalArgumentException("본인 확인을 위해 비밀번호를 입력해주세요.");
            }
            
            if (!passwordEncoder.matches(password, user.getPassword())) {
                throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
            }
            
            // 개인정보 삭제 요청 로그 기록
            personalDataAccessLogRepository.save(PersonalDataAccessLog.builder()
                .accessorId(userId.toString())
                .accessorName(encryptionUtil.safeDecrypt(user.getName()))
                .dataType("USER_INFO")
                .accessType("DELETE")
                .targetUserId(userId.toString())
                .targetUserName(encryptionUtil.safeDecrypt(user.getName()))
                .accessTime(LocalDateTime.now())
                .ipAddress(getClientIpAddress(request))
                .reason(reason != null ? reason : "사용자 본인 삭제 요청")
                .result("PENDING") // 삭제는 관리자 승인 후 처리
                .dataIdentifier("USER_" + userId)
                .dataDetails("개인정보 삭제 요청 접수")
                .sessionId(request.getSession().getId())
                .userAgent(request.getHeader("User-Agent"))
                .build());
            
            // 실제 삭제는 관리자 승인 후 처리되도록 플래그 설정
            // 또는 즉시 처리할 수도 있음 (정책에 따라)
            // user.setIsDeleted(true);
            // user.setDeletedAt(LocalDateTime.now());
            // userRepository.save(user);
            
            log.info("✅ 개인정보 삭제 요청 접수 완료: userId={}, reason={}", userId, reason);
            
            return Map.of(
                "success", true,
                "message", "개인정보 삭제 요청이 접수되었습니다. 관리자 검토 후 처리됩니다.",
                "requestId", "REQ_" + userId + "_" + System.currentTimeMillis(),
                "requestedAt", LocalDateTime.now(),
                "status", "PENDING"
            );
            
        } catch (IllegalArgumentException e) {
            log.warn("개인정보 삭제 요청 검증 실패: userId={}, error={}", userId, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("개인정보 삭제 요청 처리 실패: userId={}, error={}", userId, e.getMessage(), e);
            throw new RuntimeException("개인정보 삭제 요청 처리 중 오류가 발생했습니다.", e);
        }
    }
    
    @Override
    public Map<String, Object> getRequestStatus(Long userId, LocalDateTime startDate, LocalDateTime endDate) {
        try {
            List<PersonalDataAccessLog> accessLogs = personalDataAccessLogRepository
                .findByTargetUserIdAndAccessTimeBetween(
                    userId.toString(),
                    startDate,
                    endDate
                );
            
            long accessCount = accessLogs.stream()
                .filter(log -> "READ".equals(log.getAccessType()))
                .count();
            
            long deletionRequestCount = accessLogs.stream()
                .filter(log -> "DELETE".equals(log.getAccessType()) && "PENDING".equals(log.getResult()))
                .count();
            
            return Map.of(
                "success", true,
                "userId", userId,
                "period", Map.of(
                    "startDate", startDate,
                    "endDate", endDate
                ),
                "statistics", Map.of(
                    "totalAccessRequests", accessCount,
                    "pendingDeletionRequests", deletionRequestCount,
                    "totalRequests", accessLogs.size()
                ),
                "requests", accessLogs.stream()
                    .map(log -> Map.of(
                        "id", log.getId(),
                        "type", log.getAccessType(),
                        "dataType", log.getDataType(),
                        "accessTime", log.getAccessTime(),
                        "result", log.getResult(),
                        "reason", log.getReason()
                    ))
                    .toList()
            );
            
        } catch (Exception e) {
            log.error("개인정보 요청 현황 조회 실패: userId={}, error={}", userId, e.getMessage(), e);
            throw new RuntimeException("요청 현황 조회 중 오류가 발생했습니다.", e);
        }
    }
    
    @Override
    public Map<String, Object> getPersonalDataProcessingStatus(Long userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
            }
            
            User user = userOpt.get();
            
            // 개인정보 처리 현황 구성
            return Map.of(
                "success", true,
                "userId", userId,
                "dataCollection", Map.of(
                    "purpose", "상담 서비스 제공 및 회원 관리",
                    "items", List.of("이름", "이메일", "전화번호", "생년월일", "성별", "닉네임"),
                    "method", "회원가입 시 직접 입력"
                ),
                "dataUsage", Map.of(
                    "purpose", List.of(
                        "상담 예약 및 관리",
                        "상담사 배정",
                        "결제 처리",
                        "서비스 제공",
                        "고객 지원"
                    ),
                    "retentionPeriod", "회원 탈퇴 후 1년 또는 법정 보관 기간"
                ),
                "dataSharing", Map.of(
                    "thirdParties", List.of(),
                    "purpose", "없음"
                ),
                "userRights", Map.of(
                    "access", true,
                    "correction", true,
                    "deletion", true,
                    "suspension", true
                ),
                "contactInfo", Map.of(
                    "privacyOfficer", "privacy@mindgarden.com",
                    "phone", "02-1234-5678"
                ),
                "lastUpdated", user.getUpdatedAt()
            );
            
        } catch (Exception e) {
            log.error("개인정보 처리 현황 조회 실패: userId={}, error={}", userId, e.getMessage(), e);
            throw new RuntimeException("개인정보 처리 현황 조회 중 오류가 발생했습니다.", e);
        }
    }
    
    /**
     * 클라이언트 IP 주소 추출
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}

