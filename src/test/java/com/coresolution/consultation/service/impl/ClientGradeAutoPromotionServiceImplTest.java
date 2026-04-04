package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;
import com.coresolution.consultation.constant.ClientGradeAutoPromotionConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserGrade;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ClientGradeAutoPromotionService.Result;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

/**
 * {@link ClientGradeAutoPromotionServiceImpl} 단위 테스트 (Mockito, DB 없음).
 *
 * @author MindGarden
 * @since 2026-04-04
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientGradeAutoPromotionServiceImpl")
class ClientGradeAutoPromotionServiceImplTest {

    private static final String TENANT = "tenant-grade-test";

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ClientGradeAutoPromotionServiceImpl service;

    @Test
    @DisplayName("tenantId가 null이면 IllegalArgumentException")
    void rejectsNullTenant() {
        assertThrows(IllegalArgumentException.class, () -> service.runForTenant(null));
    }

    @Test
    @DisplayName("tenantId가 blank이면 IllegalArgumentException")
    void rejectsBlankTenant() {
        assertThrows(IllegalArgumentException.class, () -> service.runForTenant("   "));
    }

    @Test
    @DisplayName("공통코드에 유효한 CLIENT_* min_sessions가 없으면 스캔 0·내담자 페이지 미호출")
    void emptyRulesSkipsUserPage() {
        when(commonCodeRepository.findCodesByGroupWithFallback(eq(TENANT),
            eq(ClientGradeAutoPromotionConstants.CODE_GROUP_CLIENT_GRADE)))
            .thenReturn(Collections.emptyList());
        when(commonCodeRepository.findCodesByGroupWithFallback(eq(TENANT),
            eq(ClientGradeAutoPromotionConstants.CODE_GROUP_USER_GRADE)))
            .thenReturn(Collections.emptyList());

        Result r = service.runForTenant(TENANT);

        assertThat(r.clientsScanned()).isEqualTo(0);
        assertThat(r.gradesUpdated()).isEqualTo(0);
        verify(userRepository, never()).pageActiveUsersByTenantIdAndRole(any(), any(), any());
    }

    @Test
    @DisplayName("규칙 있음·완료 세션 임계 충족 시 등급 승급 및 save 1회")
    void promotesWhenSessionsMeetThreshold() {
        stubClientGradeRules();
        when(scheduleRepository.countCompletedConsultationSessionsGroupedByClientIdForAutoGrade(
            eq(TENANT), eq(ScheduleStatus.COMPLETED)))
            .thenReturn(Collections.singletonList(new Object[] { 501L, 10L }));

        User client = bronzeUser(501L, 0L);
        when(userRepository.pageActiveUsersByTenantIdAndRole(eq(TENANT), eq(UserRole.CLIENT), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(client), PageRequest.of(0, 200), 1));

        Result r = service.runForTenant(TENANT);

        assertThat(r.clientsScanned()).isEqualTo(1);
        assertThat(r.gradesUpdated()).isEqualTo(1);
        verify(userRepository, times(1)).save(any(User.class));

        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(cap.capture());
        assertThat(cap.getValue().getGrade()).isEqualTo(UserGrade.CLIENT_SILVER);
    }

    @Test
    @DisplayName("이미 임계를 만족하는 등급이면 save 없음")
    void noSaveWhenAlreadyAtEligibleGrade() {
        stubClientGradeRules();
        when(scheduleRepository.countCompletedConsultationSessionsGroupedByClientIdForAutoGrade(
            eq(TENANT), eq(ScheduleStatus.COMPLETED)))
            .thenReturn(Collections.singletonList(new Object[] { 502L, 10L }));

        User client = new User();
        client.setId(502L);
        client.setGrade(UserGrade.CLIENT_SILVER);
        client.setVersion(2L);
        when(userRepository.pageActiveUsersByTenantIdAndRole(eq(TENANT), eq(UserRole.CLIENT), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(client), PageRequest.of(0, 200), 1));

        Result r = service.runForTenant(TENANT);

        assertThat(r.clientsScanned()).isEqualTo(1);
        assertThat(r.gradesUpdated()).isEqualTo(0);
        verify(userRepository, never()).save(any(User.class));
    }

    private void stubClientGradeRules() {
        List<CommonCode> rules = List.of(
            clientGradeRow(UserGrade.CLIENT_BRONZE, "{\"min_sessions\":0}"),
            clientGradeRow(UserGrade.CLIENT_SILVER, "{\"min_sessions\":10}"),
            clientGradeRow(UserGrade.CLIENT_GOLD, "{\"min_sessions\":30}"),
            clientGradeRow(UserGrade.CLIENT_PLATINUM, "{\"min_sessions\":50}")
        );
        when(commonCodeRepository.findCodesByGroupWithFallback(eq(TENANT),
            eq(ClientGradeAutoPromotionConstants.CODE_GROUP_CLIENT_GRADE)))
            .thenReturn(rules);
        when(commonCodeRepository.findCodesByGroupWithFallback(eq(TENANT),
            eq(ClientGradeAutoPromotionConstants.CODE_GROUP_USER_GRADE)))
            .thenReturn(Collections.emptyList());
    }

    private static CommonCode clientGradeRow(String codeValue, String extraData) {
        return CommonCode.builder()
            .codeGroup(ClientGradeAutoPromotionConstants.CODE_GROUP_CLIENT_GRADE)
            .codeValue(codeValue)
            .codeLabel(codeValue)
            .koreanName(codeValue)
            .extraData(extraData)
            .build();
    }

    private static User bronzeUser(long id, Long version) {
        User u = new User();
        u.setId(id);
        u.setGrade(UserGrade.CLIENT_BRONZE);
        u.setVersion(version);
        return u;
    }
}
