package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 상담일지 목록 표시명 — 복호화, 테넌트 범위, 삭제·미존재 생략, 일괄 조회.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("상담일지 목록 표시명 일괄 조회")
class ConsultationRecordPersonNameResolverImplTest {

    private static final String TENANT_A = "tenant-log-names-a";
    private static final String TENANT_B = "tenant-log-names-b";

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;

    private ConsultationRecordPersonNameResolverImpl resolver;

    @BeforeEach
    void setUp() {
        resolver = new ConsultationRecordPersonNameResolverImpl(userRepository, userPersonalDataCacheService);
    }

    @Test
    @DisplayName("복호화된 이름을 쓰고, 여러 행이어도 사용자 조회는 한 번이다")
    void decryptedNames_singleBatchQuery() {
        User client = user(10L, TENANT_A, "cipher-client", "client-login");
        User consultant = user(20L, TENANT_A, "cipher-consultant", "consultant-login");
        User otherClient = user(11L, TENANT_A, "cipher-other", "other-login");
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_A), any()))
            .thenReturn(List.of(client, consultant, otherClient));
        when(userPersonalDataCacheService.getDecryptedUserData(client)).thenReturn(Map.of("name", "김내담"));
        when(userPersonalDataCacheService.getDecryptedUserData(consultant)).thenReturn(Map.of("name", "이상담"));
        when(userPersonalDataCacheService.getDecryptedUserData(otherClient)).thenReturn(Map.of("name", "박내담"));

        Map<Long, String> names = resolver.resolveForRecords(TENANT_A, List.of(
            record(1L, 10L, 20L),
            record(2L, 11L, 20L),
            record(3L, 10L, 20L)));

        assertThat(names).containsEntry(10L, "김내담").containsEntry(20L, "이상담").containsEntry(11L, "박내담");
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<Long>> ids = ArgumentCaptor.forClass(Collection.class);
        verify(userRepository, times(1)).findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_A), ids.capture());
        assertThat(ids.getValue()).containsExactlyInAnyOrder(10L, 11L, 20L);
        verify(userRepository, never()).findByTenantIdAndId(anyString(), any());
        verify(userRepository, never()).findByTenantIdAndIdIn(anyString(), any());
        verify(userPersonalDataCacheService, times(3)).getDecryptedUserData(any(User.class));
    }

    @Test
    @DisplayName("다른 테넌트 사용자는 현재 테넌트 조회 결과에 포함되지 않는다")
    void otherTenantUser_isNotIncluded() {
        User sameTenant = user(10L, TENANT_A, "cipher", "login-a");
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_A), any()))
            .thenReturn(List.of(sameTenant));
        when(userPersonalDataCacheService.getDecryptedUserData(sameTenant)).thenReturn(Map.of("name", "같은테넌트"));

        Map<Long, String> names = resolver.resolveDisplayNames(TENANT_A, List.of(10L, 99L));

        assertThat(names).containsOnly(Map.entry(10L, "같은테넌트"));
        assertThat(names.values()).doesNotContain("다른테넌트");
        verify(userRepository, times(1)).findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_A), any());
        verify(userRepository, never()).findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_B), any());
    }

    @Test
    @DisplayName("삭제·미존재 id 와 이름이 비고 로그인 id 도 없으면 맵에서 빠져 화면 locale 폴백으로 남긴다")
    void deletedOrMissingOrBlank_omittedFromMap() {
        User blankName = user(30L, TENANT_A, "", "login-blank");
        User noIdentity = user(31L, TENANT_A, " ", null);
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_A), any()))
            .thenReturn(List.of(blankName, noIdentity));
        when(userPersonalDataCacheService.getDecryptedUserData(blankName)).thenReturn(Map.of("name", ""));
        when(userPersonalDataCacheService.getDecryptedUserData(noIdentity)).thenReturn(Map.of("name", " "));

        Map<Long, String> names = resolver.resolveDisplayNames(TENANT_A, List.of(30L, 31L, 404L));

        assertThat(names).containsOnly(Map.entry(30L, "login-blank"));
        assertThat(names).doesNotContainKey(31L);
        assertThat(names).doesNotContainKey(404L);
        verify(userRepository, times(1)).findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_A), any());
        verify(userRepository, never()).findByTenantIdAndIdIgnoringDeleted(anyString(), any());
    }

    @Test
    @DisplayName("복호화가 실패하면 로그인 id 로 폴백하고 조회 예외를 올리지 않는다")
    void decryptFailure_fallsBackToLoginId() {
        User user = user(40L, TENANT_A, "cipher", "login-fallback");
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_A), any()))
            .thenReturn(List.of(user));
        when(userPersonalDataCacheService.getDecryptedUserData(user)).thenThrow(new IllegalStateException("decrypt"));

        Map<Long, String> names = resolver.resolveDisplayNames(TENANT_A, List.of(40L));

        assertThat(names).containsEntry(40L, "login-fallback");
    }

    @Test
    @DisplayName("테넌트나 id 가 없으면 저장소를 조회하지 않는다")
    void blankScope_skipsRepository() {
        assertThat(resolver.resolveDisplayNames(null, List.of(1L))).isEmpty();
        assertThat(resolver.resolveDisplayNames("  ", List.of(1L))).isEmpty();
        assertThat(resolver.resolveDisplayNames(TENANT_A, List.of())).isEmpty();
        assertThat(resolver.resolveForRecords(TENANT_A, List.of())).isEmpty();
        verify(userRepository, never()).findByTenantIdAndIdInAndIsDeletedFalse(anyString(), any());
    }

    private static User user(Long id, String tenantId, String storedName, String loginId) {
        User user = new User();
        user.setId(id);
        user.setTenantId(tenantId);
        user.setName(storedName);
        user.setUserId(loginId);
        return user;
    }

    private static ConsultationRecord record(Long id, Long clientId, Long consultantId) {
        ConsultationRecord record = new ConsultationRecord();
        record.setId(id);
        record.setClientId(clientId);
        record.setConsultantId(consultantId);
        return record;
    }
}
