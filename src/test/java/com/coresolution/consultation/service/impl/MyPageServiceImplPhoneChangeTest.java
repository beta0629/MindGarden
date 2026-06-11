package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.MyPagePhoneChangeRequest;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserAddressRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.service.ProfileImageStorageService;
import com.coresolution.consultation.service.SmsOtpVerificationService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@code MyPageServiceImpl#changePhone} 단위 테스트 — 정규화·OTP 검증·tenant unique·AuditLog 적재.
 *
 * <p>커버리지:
 * <ul>
 *   <li>정규화: {@code 010-1234-5678} / {@code +821012345678} / {@code 01012345678} 모두 동일 정규형 저장</li>
 *   <li>중복: 동일 tenant 내 다른 사용자가 이미 사용 중인 경우 차단</li>
 *   <li>OTP: 만료·불일치·미발송 모두 거부</li>
 *   <li>AuditLog: {@code USER_PHONE_CHANGE} 로 적재되는지 확인</li>
 * </ul></p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MyPageServiceImpl 휴대전화 변경(Phase A)")
class MyPageServiceImplPhoneChangeTest {

    // tenant_id 컬럼 길이(36) 한도. UUID(no-dash) 32자 + prefix 4자 = 36자.
    private static final String TENANT = "tph-" + UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    private static final Long USER_ID = 42L;
    private static final String OTP = "123456";
    private static final String NORMALIZED_PHONE = "01012345678";

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserService userService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private UserAddressRepository userAddressRepository;
    @Mock
    private NotificationChannelPreferenceResolutionService notificationChannelPreferenceResolutionService;
    @Mock
    private ProfileImageStorageService profileImageStorageService;
    @Mock
    private SmsOtpVerificationService smsOtpVerificationService;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private MyPageServiceImpl myPageService;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT);
        // getMyPageInfo() 가 changePhone 종료 직전에 호출되므로 비-비즈니스 후속 호출들도 nullsafe 응답을 준비.
        lenient().when(userRepository.findProfileImageInfoByUserId(eq(TENANT), eq(USER_ID)))
                .thenReturn(Collections.emptyList());
        lenient().when(userAddressRepository.findByUserIdAndIsPrimaryTrueAndIsDeletedFalse(eq(USER_ID)))
                .thenReturn(Optional.empty());
        lenient().when(notificationChannelPreferenceResolutionService.buildProfileSnapshot(any()))
                .thenReturn(new NotificationChannelPreferenceResolutionService.NotificationChannelProfileSnapshot(
                        null, false, false, null, false));
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("정규화: 010-1234-5678 입력 → 01012345678 정규형으로 암호화 호출")
    void normalizesHyphenatedInput() {
        prepareSuccess();
        myPageService.changePhone(USER_ID, request("010-1234-5678", OTP));
        verify(encryptionUtil).encrypt(NORMALIZED_PHONE);
        verify(smsOtpVerificationService).verifyAndConsume(NORMALIZED_PHONE, OTP);
    }

    @Test
    @DisplayName("정규화: +82 10-1234-5678 (E.164) → 01012345678 정규형")
    void normalizesE164Input() {
        prepareSuccess();
        myPageService.changePhone(USER_ID, request("+82 10-1234-5678", OTP));
        verify(encryptionUtil).encrypt(NORMALIZED_PHONE);
        verify(smsOtpVerificationService).verifyAndConsume(NORMALIZED_PHONE, OTP);
    }

    @Test
    @DisplayName("OTP 만료·불일치·미발송 → IllegalArgumentException 던지고 저장 안 함")
    void rejectsInvalidOtp() {
        when(userRepository.findByTenantIdAndId(TENANT, USER_ID)).thenReturn(Optional.of(buildUser()));
        when(smsOtpVerificationService.verifyAndConsume(NORMALIZED_PHONE, OTP)).thenReturn(false);

        assertThatThrownBy(() -> myPageService.changePhone(USER_ID, request(NORMALIZED_PHONE, OTP)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("인증 코드");

        verify(userRepository, never()).save(any());
        verify(auditLogService, never()).record(any());
    }

    @Test
    @DisplayName("같은 tenant 내 다른 사용자가 동일 번호 사용 중이면 IllegalArgumentException")
    void rejectsDuplicatePhoneInSameTenant() {
        when(userRepository.findByTenantIdAndId(TENANT, USER_ID)).thenReturn(Optional.of(buildUser()));
        when(smsOtpVerificationService.verifyAndConsume(NORMALIZED_PHONE, OTP)).thenReturn(true);
        when(userService.existsPhoneDuplicate(NORMALIZED_PHONE, TENANT, USER_ID)).thenReturn(true);

        assertThatThrownBy(() -> myPageService.changePhone(USER_ID, request(NORMALIZED_PHONE, OTP)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이미 등록된 휴대폰 번호");

        verify(userRepository, never()).save(any());
        verify(auditLogService, never()).record(any());
    }

    @Test
    @DisplayName("AuditLog: USER_PHONE_CHANGE 로 마스킹된 before/after 메타데이터 기록")
    void recordsAuditLogOnSuccess() {
        prepareSuccess();

        myPageService.changePhone(USER_ID, request(NORMALIZED_PHONE, OTP));

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogService).record(captor.capture());
        AuditLog logged = captor.getValue();

        assertThat(logged.getAction()).isEqualTo(AuditAction.USER_PHONE_CHANGE);
        assertThat(logged.getTenantId()).isEqualTo(TENANT);
        assertThat(logged.getActorUserId()).isEqualTo(USER_ID);
        assertThat(logged.getTargetUserId()).isEqualTo(USER_ID);
        assertThat(logged.getEntityType()).isEqualTo("USER");
        assertThat(logged.getEntityId()).isEqualTo(USER_ID);
        assertThat(logged.getMetadataJson())
                .contains("\"phase\":\"A\"")
                .contains("\"after\":\"010-****-5678\"");
    }

    // ---------- helpers ----------

    private void prepareSuccess() {
        when(userRepository.findByTenantIdAndId(TENANT, USER_ID)).thenReturn(Optional.of(buildUser()));
        when(smsOtpVerificationService.verifyAndConsume(eq(NORMALIZED_PHONE), eq(OTP))).thenReturn(true);
        when(userService.existsPhoneDuplicate(eq(NORMALIZED_PHONE), eq(TENANT), eq(USER_ID))).thenReturn(false);
        when(encryptionUtil.encrypt(NORMALIZED_PHONE)).thenReturn("enc-" + NORMALIZED_PHONE);
        // getMyPageInfo 재조회 — userRepository.findProfileImageInfoByUserId 등의 모의는 단순화를 위해
        // 기본 Mockito null 응답으로 통과시키되, 우리는 메서드 실제 반환값까지 단위 검증하지 않는다.
        // PersonalDataEncryptionUtil.decrypt 도 null-safe 로 통과 (기본 null 반환).
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        // getMyPageInfo() 호출 시 다시 호출되는 findByTenantIdAndId 는 위와 동일.
    }

    private MyPagePhoneChangeRequest request(String phone, String code) {
        return MyPagePhoneChangeRequest.builder()
                .newPhoneNumber(phone)
                .verificationCode(code)
                .build();
    }

    private User buildUser() {
        User u = User.builder()
                .userId("u" + USER_ID)
                .email("u" + USER_ID + "@example.com")
                .name("n")
                .role(UserRole.CLIENT)
                .phone("enc-old-phone")
                .isActive(true)
                .build();
        u.setId(USER_ID);
        u.setTenantId(TENANT);
        u.setIsDeleted(false);
        return u;
    }
}
