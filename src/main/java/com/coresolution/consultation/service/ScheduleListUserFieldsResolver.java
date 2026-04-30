package com.coresolution.consultation.service;

import java.util.Map;
import org.springframework.stereotype.Component;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import lombok.RequiredArgsConstructor;

/**
 * 관리자 스케줄·매핑 목록 등에서 상담사/내담자 표시명·연락처를 동일 정책으로 채우기 위한 리졸버.
 * {@link com.coresolution.consultation.service.impl.AdminServiceImpl}의 목록용 복호화 로직과 정합을 유지한다.
 *
 * @author CoreSolution
 * @since 2026-04-30
 */
@Component
@RequiredArgsConstructor
public class ScheduleListUserFieldsResolver {

    private final UserPersonalDataCacheService userPersonalDataCacheService;
    private final PersonalDataEncryptionUtil encryptionUtil;

    /**
     * 캐시 복호화 이름 → 엔티티 필드 safeDecrypt → 평문 이름 순으로 표시명을 결정한다.
     *
     * @param user 사용자 엔티티
     * @return 표시 가능한 이름, 없으면 {@link AdminServiceUserFacingMessages#DISPLAY_NAME_UNKNOWN}
     */
    public String resolveDisplayNameForScheduleList(User user) {
        if (user == null) {
            return AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN;
        }
        Map<String, String> decrypted = userPersonalDataCacheService.getDecryptedUserData(user);
        String fromCache = decrypted != null ? decrypted.get("name") : null;
        if (fromCache != null && !fromCache.isBlank()) {
            return fromCache.trim();
        }
        String decryptedName = encryptionUtil.safeDecrypt(user.getName());
        if (decryptedName != null && !decryptedName.isBlank()) {
            return decryptedName.trim();
        }
        String raw = user.getName();
        if (raw != null && !raw.isBlank()) {
            return raw.trim();
        }
        return AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN;
    }

    /**
     * 스케줄 목록용 전화: 캐시 phone → {@code safeDecrypt(user.getPhone())} → 하이픈 포맷.
     *
     * @param user 사용자
     * @return 포맷된 번호, 없으면 빈 문자열
     */
    public String resolvePhoneForScheduleList(User user) {
        if (user == null) {
            return "";
        }
        Map<String, String> decrypted = userPersonalDataCacheService.getDecryptedUserData(user);
        String phone = decrypted != null ? decrypted.get("phone") : null;
        if (phone == null || phone.isBlank()) {
            phone = encryptionUtil.safeDecrypt(user.getPhone());
        }
        if (phone == null || phone.isBlank()) {
            return "";
        }
        String formatted = formatPhoneNumber(phone);
        return formatted != null ? formatted : "";
    }

    /**
     * 스케줄 목록용 이메일: 캐시 email → {@code safeDecrypt(user.getEmail())}.
     *
     * @param user 사용자
     * @return 이메일, 없으면 빈 문자열
     */
    public String resolveEmailForScheduleList(User user) {
        if (user == null) {
            return "";
        }
        Map<String, String> decrypted = userPersonalDataCacheService.getDecryptedUserData(user);
        if (decrypted != null && decrypted.get("email") != null && !decrypted.get("email").isBlank()) {
            return decrypted.get("email");
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return "";
        }
        return encryptionUtil.safeDecrypt(user.getEmail());
    }

    /**
     * 전화번호 하이픈 포맷 (목록·내담자 조회 등 공통).
     *
     * @param phone 원본
     * @return 포맷 결과, 입력이 비면 그대로 반환
     */
    public String formatPhoneNumber(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return phone;
        }

        String numbers = phone.replaceAll("[^0-9]", "");

        if (numbers.length() == 11 && numbers.startsWith("01")) {
            return numbers.substring(0, 3) + "-" + numbers.substring(3, 7) + "-" + numbers.substring(7);
        }
        if (numbers.length() == 10) {
            if (numbers.startsWith("02")) {
                return numbers.substring(0, 2) + "-" + numbers.substring(2, 6) + "-" + numbers.substring(6);
            }
            return numbers.substring(0, 3) + "-" + numbers.substring(3, 6) + "-" + numbers.substring(6);
        }
        if (numbers.length() == 8) {
            return numbers.substring(0, 4) + "-" + numbers.substring(4);
        }

        return phone;
    }
}
