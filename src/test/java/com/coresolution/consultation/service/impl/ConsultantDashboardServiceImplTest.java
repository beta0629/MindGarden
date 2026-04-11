package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.dto.response.HighPriorityClientResponse;
import com.coresolution.consultation.dto.response.IncompleteRecordResponse;
import com.coresolution.consultation.dto.response.UpcomingPreparationResponse;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

/**
 * ConsultantDashboardServiceImpl 단위 테스트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-03-09
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("상담사 대시보드 서비스 테스트")
class ConsultantDashboardServiceImplTest {
    
    @Mock
    private ScheduleRepository scheduleRepository;
    
    @Mock
    private ConsultationRecordRepository consultationRecordRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;
    
    @InjectMocks
    private ConsultantDashboardServiceImpl consultantDashboardService;
    
    private static final String TEST_TENANT_ID = "test-tenant-123";
    private static final Long TEST_CONSULTANT_ID = 1L;
    private static final Long TEST_CLIENT_ID = 2L;
    
    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }
    
    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }
    
    @Test
    @DisplayName("미작성 상담일지 조회 - 성공")
    void testGetIncompleteRecords_Success() {
        Schedule schedule = new Schedule();
        schedule.setId(1L);
        schedule.setConsultantId(TEST_CONSULTANT_ID);
        schedule.setClientId(TEST_CLIENT_ID);
        schedule.setDate(LocalDate.now().minusDays(1));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(ScheduleStatus.COMPLETED);
        
        User client = User.builder()
            .name("홍길동")
            .build();
        client.setId(TEST_CLIENT_ID);
        
        Map<String, String> decryptedData = new HashMap<>();
        decryptedData.put("name", "홍길동");
        
        when(scheduleRepository.findIncompleteRecords(eq(TEST_TENANT_ID), eq(TEST_CONSULTANT_ID), any(Pageable.class)))
            .thenReturn(Arrays.asList(schedule));
        when(userRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(TEST_CLIENT_ID)))
            .thenReturn(Optional.of(client));
        when(userPersonalDataCacheService.getDecryptedUserData(client)).thenReturn(decryptedData);
        
        List<IncompleteRecordResponse> result = consultantDashboardService.getIncompleteRecords(TEST_CONSULTANT_ID, 10);
        
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(schedule.getId(), result.get(0).getScheduleId());
        assertEquals("홍길동", result.get(0).getClientName());
        assertEquals(schedule.getDate(), result.get(0).getSessionDate());
        
        verify(scheduleRepository).findIncompleteRecords(eq(TEST_TENANT_ID), eq(TEST_CONSULTANT_ID), any(Pageable.class));
    }
    
    @Test
    @DisplayName("미작성 상담일지 조회 - tenantId 없음")
    void testGetIncompleteRecords_NoTenantId() {
        TenantContextHolder.clear();
        
        assertThrows(IllegalStateException.class, () -> {
            consultantDashboardService.getIncompleteRecords(TEST_CONSULTANT_ID, 10);
        });
    }
    
    @Test
    @DisplayName("긴급 확인 필요 내담자 조회 - 성공")
    void testGetHighPriorityClients_Success() {
        ConsultationRecord record = ConsultationRecord.builder()
            .id(1L)
            .consultantId(TEST_CONSULTANT_ID)
            .clientId(TEST_CLIENT_ID)
            .sessionDate(LocalDate.now().minusDays(1))
            .sessionNumber(5)
            .riskAssessment("HIGH")
            .mainIssues("우울증 증상 악화")
            .emergencyResponsePlan("즉시 연락, 추가 세션 고려")
            .build();
        
        User client = User.builder()
            .name("이철수")
            .build();
        client.setId(TEST_CLIENT_ID);
        
        Map<String, String> decryptedData = new HashMap<>();
        decryptedData.put("name", "이철수");
        
        when(consultationRecordRepository.findHighPriorityClients(eq(TEST_TENANT_ID), eq(TEST_CONSULTANT_ID), any(Pageable.class)))
            .thenReturn(Arrays.asList(record));
        when(userRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(TEST_CLIENT_ID)))
            .thenReturn(Optional.of(client));
        when(userPersonalDataCacheService.getDecryptedUserData(client)).thenReturn(decryptedData);
        
        List<HighPriorityClientResponse> result = consultantDashboardService.getHighPriorityClients(TEST_CONSULTANT_ID, 5);
        
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(TEST_CLIENT_ID, result.get(0).getClientId());
        assertEquals("이철수", result.get(0).getClientName());
        assertEquals("HIGH", result.get(0).getRiskLevel());
        assertEquals(record.getSessionDate(), result.get(0).getLastSessionDate());
        
        verify(consultationRecordRepository).findHighPriorityClients(eq(TEST_TENANT_ID), eq(TEST_CONSULTANT_ID), any(Pageable.class));
    }
    
    @Test
    @DisplayName("긴급 확인 필요 내담자 조회 - tenantId 없음")
    void testGetHighPriorityClients_NoTenantId() {
        TenantContextHolder.clear();
        
        assertThrows(IllegalStateException.class, () -> {
            consultantDashboardService.getHighPriorityClients(TEST_CONSULTANT_ID, 5);
        });
    }
    
    @Test
    @DisplayName("다음 상담 준비 정보 조회 - 성공")
    void testGetUpcomingPreparation_Success() {
        Schedule schedule = new Schedule();
        schedule.setId(1L);
        schedule.setConsultantId(TEST_CONSULTANT_ID);
        schedule.setClientId(TEST_CLIENT_ID);
        schedule.setDate(LocalDate.now());
        schedule.setStartTime(LocalTime.of(14, 0));
        schedule.setEndTime(LocalTime.of(15, 0));
        schedule.setStatus(ScheduleStatus.BOOKED);
        
        ConsultationRecord record = ConsultationRecord.builder()
            .id(1L)
            .clientId(TEST_CLIENT_ID)
            .sessionNumber(4)
            .mainIssues("불안 증상 지속")
            .riskAssessment("MEDIUM")
            .build();
        
        User client = User.builder()
            .name("김영희")
            .build();
        client.setId(TEST_CLIENT_ID);
        
        Map<String, String> decryptedData = new HashMap<>();
        decryptedData.put("name", "김영희");
        
        when(scheduleRepository.findUpcomingPreparation(
            eq(TEST_TENANT_ID), eq(TEST_CONSULTANT_ID), any(LocalDate.class), 
            any(LocalDate.class), any(LocalTime.class), any(Pageable.class)))
            .thenReturn(Arrays.asList(schedule));
        when(consultationRecordRepository.findLatestByClientId(eq(TEST_TENANT_ID), eq(TEST_CLIENT_ID), any(Pageable.class)))
            .thenReturn(Arrays.asList(record));
        when(userRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(TEST_CLIENT_ID)))
            .thenReturn(Optional.of(client));
        when(userPersonalDataCacheService.getDecryptedUserData(client)).thenReturn(decryptedData);
        
        List<UpcomingPreparationResponse> result = consultantDashboardService.getUpcomingPreparation(TEST_CONSULTANT_ID, 2);
        
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(schedule.getId(), result.get(0).getScheduleId());
        assertEquals("김영희", result.get(0).getClientName());
        assertEquals(schedule.getDate(), result.get(0).getSessionDate());
        assertEquals(schedule.getStartTime(), result.get(0).getSessionTime());
        assertEquals(4, result.get(0).getSessionNumber());
        assertEquals("불안 증상 지속", result.get(0).getLastIssues());
        assertEquals("MEDIUM", result.get(0).getRiskLevel());
        
        verify(scheduleRepository).findUpcomingPreparation(
            eq(TEST_TENANT_ID), eq(TEST_CONSULTANT_ID), any(LocalDate.class), 
            any(LocalDate.class), any(LocalTime.class), any(Pageable.class));
    }
    
    @Test
    @DisplayName("다음 상담 준비 정보 조회 - tenantId 없음")
    void testGetUpcomingPreparation_NoTenantId() {
        TenantContextHolder.clear();
        
        assertThrows(IllegalStateException.class, () -> {
            consultantDashboardService.getUpcomingPreparation(TEST_CONSULTANT_ID, 2);
        });
    }
}
