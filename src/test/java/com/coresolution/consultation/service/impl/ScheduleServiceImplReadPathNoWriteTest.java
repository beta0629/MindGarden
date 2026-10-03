package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.lang.reflect.Method;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.core.context.TenantContextHolder;

/**
 * 스케줄 조회 경로는 지난 일정 자동 완료(쓰기)를 하지 않는다.
 *
 * <p>이전에는 {@code findByClientId} 등 조회 9개가 매 호출마다 {@code autoCompleteExpiredSchedules()} 를 불러
 * 지난 일정 COMPLETED 전환·회기 차감·급여 동기화를 GET 안에서 수행했다. 완료 처리는
 * {@code ScheduleAutoCompleteService} 배치로만 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("스케줄 조회 경로 — 자동 완료 쓰기 없음")
class ScheduleServiceImplReadPathNoWriteTest {

    private static final String TENANT_ID = "tenant-read-no-write";
    private static final Long CONSULTANT_ID = 10L;
    private static final Long CLIENT_ID = 20L;
    private static final LocalDate DAY = LocalDate.of(2026, 10, 4);

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;
    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    /** 조회 메서드 이름과 호출. */
    record ReadCall(String name, ThrowingCall call) {
        @Override
        public String toString() {
            return name;
        }
    }

    @FunctionalInterface
    interface ThrowingCall {
        void run(ScheduleServiceImpl service);
    }

    static Stream<ReadCall> readCalls() {
        Pageable page = PageRequest.of(0, 10);
        return Stream.of(
            new ReadCall("findByConsultantId", s -> s.findByConsultantId(CONSULTANT_ID)),
            new ReadCall("findByConsultantIdAndDate", s -> s.findByConsultantIdAndDate(CONSULTANT_ID, DAY)),
            new ReadCall("findByConsultantIdAndDateBetween",
                s -> s.findByConsultantIdAndDateBetween(CONSULTANT_ID, DAY.minusDays(7), DAY)),
            new ReadCall("findByClientId", s -> s.findByClientId(CLIENT_ID)),
            new ReadCall("findByClientIdAndDate", s -> s.findByClientIdAndDate(CLIENT_ID, DAY)),
            new ReadCall("findByClientIdAndDateBetween",
                s -> s.findByClientIdAndDateBetween(CLIENT_ID, DAY.minusDays(7), DAY)),
            new ReadCall("findSchedulesByUserRole", s -> s.findSchedulesByUserRole(CONSULTANT_ID, "CONSULTANT")),
            new ReadCall("findSchedulesByUserRoleAndDate",
                s -> s.findSchedulesByUserRoleAndDate(CONSULTANT_ID, "CONSULTANT", DAY)),
            new ReadCall("findSchedulesWithNamesByUserRolePaged",
                s -> s.findSchedulesWithNamesByUserRolePaged(CLIENT_ID, "CLIENT", page)));
    }

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        lenient().when(commonCodeService.getCodeValue(eq("ROLE"), eq("CLIENT"))).thenReturn("CLIENT");
        lenient().when(mappingRepository.findActiveOrExhaustedByTenantId(anyString()))
            .thenReturn(Collections.emptyList());
        lenient().when(scheduleRepository.findByTenantIdAndClientId(anyString(), any(), any(Pageable.class)))
            .thenReturn(new PageImpl<>(Collections.emptyList()));
        Schedule pastBooked = new Schedule();
        pastBooked.setId(1L);
        pastBooked.setStatus(ScheduleStatus.BOOKED);
        pastBooked.setDate(DAY.minusDays(1));
        lenient().when(scheduleRepository.findByDateBeforeAndStatus(anyString(), any(), any()))
            .thenReturn(List.of(pastBooked));
        lenient().when(scheduleRepository.findExpiredConfirmedSchedules(anyString(), any(), any()))
            .thenReturn(List.of(pastBooked));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("readCalls")
    @DisplayName("조회 호출 — 지난 일정 탐색·저장 없음 (지난 BOOKED 일정이 있어도)")
    void readCall_doesNotAutoCompleteOrSave(ReadCall readCall) {
        try {
            readCall.call().run(scheduleService);
        } catch (RuntimeException ignored) {
            // 역할 판정 실패 등 조회 자체 예외는 이 테스트의 관심사가 아니다. 쓰기 여부만 본다.
        }
        verify(scheduleRepository, never()).findExpiredConfirmedSchedules(anyString(), any(), any());
        verify(scheduleRepository, never()).findByDateBeforeAndStatus(anyString(), any(), any());
        verify(scheduleRepository, never()).save(any());
        verify(scheduleRepository, never()).saveAndFlush(any());
        verify(scheduleRepository, never()).saveAll(any());
        verify(mappingRepository, never()).save(any());
    }

    @Test
    @DisplayName("내담자 일정 조회 — 저장소 조회만 하고 결과를 그대로 반환")
    void findByClientId_readsTenantScopedOnly() {
        scheduleService.findByClientId(CLIENT_ID);
        verify(scheduleRepository).findByTenantIdAndClientId(TENANT_ID, CLIENT_ID);
        verify(scheduleRepository, never()).save(any());
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("readMethodNames")
    @DisplayName("조회 메서드는 @Transactional(readOnly = true)")
    void readMethods_areReadOnlyTransactional(String methodName) {
        Method method = Stream.of(ScheduleServiceImpl.class.getDeclaredMethods())
            .filter(m -> m.getName().equals(methodName))
            .findFirst()
            .orElse(null);
        assertNotNull(method, methodName);
        Transactional tx = method.getAnnotation(Transactional.class);
        assertNotNull(tx, methodName + " 에 @Transactional 이 없다");
        assertTrue(tx.readOnly(), methodName + " 는 readOnly 여야 한다");
    }

    static Stream<String> readMethodNames() {
        return readCalls().map(ReadCall::name);
    }
}
