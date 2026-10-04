package com.coresolution.consultation.service.ai.privacy;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.coresolution.consultation.constant.AiPrivacyFlagKeys;
import com.coresolution.consultation.constant.SystemConfigAccessPolicy;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.SystemConfigService;

/**
 * {@link AiPiiMaskingService} — 패턴·이름 마스킹, 테넌트 토글, 반례.
 *
 * @author MindGarden
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AiPiiMaskingService")
class AiPiiMaskingServiceTest {

    private static final String TENANT_ID = "tenant-mask-test";

    @Mock
    private SystemConfigService systemConfigService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AiPiiMaskingService service;

    @ParameterizedTest
    @ValueSource(strings = {
        "010-1234-5678", "01012345678", "010 1234 5678", "010.1234.5678",
        "+82-10-1234-5678", "+821012345678", "02-123-4567", "031-987-6543", "070-1234-5678"
    })
    @DisplayName("전화번호 변형 모두 토큰 치환")
    void applyMasking_phoneVariants(String phone) {
        String masked = AiPiiMaskingService.applyMasking("연락처 " + phone + " 입니다", null);
        assertFalse(masked.contains(phone), masked);
        assertTrue(masked.contains(AiPiiMaskingService.TOKEN_PHONE), masked);
    }

    @ParameterizedTest
    @ValueSource(strings = {"900101-1234567", "9001011234567", "900101 - 2234567"})
    @DisplayName("주민등록번호 (하이픈 유무) 치환")
    void applyMasking_rrn(String rrn) {
        String masked = AiPiiMaskingService.applyMasking("주민번호 " + rrn, null);
        assertFalse(masked.contains(rrn), masked);
        assertTrue(masked.contains(AiPiiMaskingService.TOKEN_RRN), masked);
    }

    @Test
    @DisplayName("이메일·카드번호 치환")
    void applyMasking_emailAndCard() {
        String masked = AiPiiMaskingService.applyMasking(
                "메일 a.b+c@example.co.kr 카드 1234-5678-9012-3456", null);
        assertEquals("메일 " + AiPiiMaskingService.TOKEN_EMAIL + " 카드 " + AiPiiMaskingService.TOKEN_CARD, masked);
    }

    @Test
    @DisplayName("이름 — 긴 식별자 우선, 한 글자 식별자는 제외")
    void applyMasking_namesLongestFirst() {
        String masked = AiPiiMaskingService.applyMasking(
                "김민지 님과 민지 씨, 김 선생님", List.of("민지", "김민지", "김"));
        assertEquals("[이름] 님과 [이름] 씨, 김 선생님", masked);
    }

    @Test
    @DisplayName("반례 — 날짜·시각·금액·회기 번호는 치환하지 않음")
    void applyMasking_doesNotTouchNonPii() {
        String text = "2026-10-04 14:30 상담 3회기, 결제 50,000원, 점수 12/40, 기간 2026.01.01~2026.12.31";
        assertEquals(text, AiPiiMaskingService.applyMasking(text, null));
    }

    @Test
    @DisplayName("반례 — 이미 마스킹된 문자열 재적용 시 변화 없음(멱등)")
    void applyMasking_idempotent() {
        String once = AiPiiMaskingService.applyMasking("김민지 010-1234-5678 a@b.co", List.of("김민지"));
        assertEquals(once, AiPiiMaskingService.applyMasking(once, List.of("김민지")));
    }

    @Test
    @DisplayName("테넌트 행 없음(기본값 true 전달) → 마스킹 ON")
    void mask_defaultOn() {
        when(systemConfigService.getBooleanForTenant(
                TENANT_ID, AiPrivacyFlagKeys.PII_MASKING_ENABLED, true)).thenReturn(true);
        assertEquals("[전화번호]", service.mask(TENANT_ID, "010-1234-5678"));
    }

    @Test
    @DisplayName("테넌트 토글 OFF → 원문")
    void mask_disabledReturnsOriginal() {
        when(systemConfigService.getBooleanForTenant(
                TENANT_ID, AiPrivacyFlagKeys.PII_MASKING_ENABLED, true)).thenReturn(false);
        assertEquals("010-1234-5678", service.mask(TENANT_ID, "010-1234-5678"));
    }

    @Test
    @DisplayName("tenantId 없음 → 설정 조회 없이 마스킹 ON")
    void mask_noTenantDefaultsOn() {
        assertEquals("[이메일]", service.mask(null, "a@b.co"));
        verify(systemConfigService, never()).getBooleanForTenant(any(), anyString(), eq(true));
    }

    @Test
    @DisplayName("식별자 조회는 같은 테넌트 범위 쿼리만 사용, 이름·닉네임 포함")
    void resolveUserIdentifiers_tenantScoped() {
        User client = User.builder().name("김민지").nickname("민지쌤").build();
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(TENANT_ID, Set.of(10L, 20L)))
                .thenReturn(List.of(client));
        List<String> ids = service.resolveUserIdentifiers(TENANT_ID, 10L, null, 20L);
        assertEquals(List.of("김민지", "민지쌤"), ids);
    }

    @Test
    @DisplayName("식별자 조회 실패 → 빈 목록(패턴 마스킹은 계속)")
    void resolveUserIdentifiers_failureReturnsEmpty() {
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), any()))
                .thenThrow(new IllegalStateException("db down"));
        assertTrue(service.resolveUserIdentifiers(TENANT_ID, 1L).isEmpty());
    }

    @Test
    @DisplayName("토글 키는 테넌트 ADMIN 쓰기 허용 목록에 포함")
    void flagKeyIsTenantWritable() {
        assertTrue(SystemConfigAccessPolicy.isWritable(AiPrivacyFlagKeys.PII_MASKING_ENABLED));
        assertFalse(SystemConfigAccessPolicy.isOpsOnlyWrite(AiPrivacyFlagKeys.PII_MASKING_ENABLED));
        assertFalse(SystemConfigAccessPolicy.isSecretValueKey(AiPrivacyFlagKeys.PII_MASKING_ENABLED));
    }
}
