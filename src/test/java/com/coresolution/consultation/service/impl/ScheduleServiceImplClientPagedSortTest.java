package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.core.context.TenantContextHolder;

/**
 * ScheduleService 내담자 페이지네이션 정렬 보장 테스트.
 *
 * <p>UX 요구사항: 내담자 expo-app "내 상담 → 완료" 탭에서 최근 상담이 위에 오도록
 * 서비스 레이어에서 Pageable 을 date·startTime DESC 로 오버라이드한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-13
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleService 내담자 페이지네이션 정렬 보장 테스트")
class ScheduleServiceImplClientPagedSortTest {

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private ConsultantClientMappingRepository mappingRepository;

    @Mock
    private CommonCodeService commonCodeService;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    private static final String TEST_TENANT_ID = "test-tenant-uuid";
    private static final Long TEST_CLIENT_ID = 100L;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
        // autoCompleteExpiredSchedules 가 안전하게 통과하도록 빈 리스트 반환.
        lenient().when(scheduleRepository.findExpiredConfirmedSchedules(anyString(), any(), any()))
                .thenReturn(Collections.emptyList());
        // ROLE 공통코드 조회 — CLIENT 역할 매칭 보장.
        lenient().when(commonCodeService.getCodeValue(eq("ROLE"), eq("CLIENT")))
                .thenReturn("CLIENT");
        // 매칭 컨텍스트 빌드 — 빈 결과 반환.
        lenient().when(mappingRepository.findActiveOrExhaustedByTenantId(anyString()))
                .thenReturn(Collections.emptyList());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("CLIENT 역할 페이지 조회 — Pageable 정렬을 date DESC, startTime DESC, id DESC 로 오버라이드한다")
    void clientPaged_overridesSort_toDateDescStartTimeDescIdDesc() {
        Pageable inputPageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.ASC, "date"));
        Page<Schedule> emptyPage = new PageImpl<>(Collections.emptyList(), inputPageable, 0);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        lenient().when(scheduleRepository.findByTenantIdAndClientId(
                eq(TEST_TENANT_ID), eq(TEST_CLIENT_ID), any(Pageable.class)))
                .thenReturn(emptyPage);

        scheduleService.findSchedulesWithNamesByUserRolePaged(TEST_CLIENT_ID, "CLIENT", inputPageable);

        verify(scheduleRepository).findByTenantIdAndClientId(
                eq(TEST_TENANT_ID), eq(TEST_CLIENT_ID), pageableCaptor.capture());
        Pageable captured = pageableCaptor.getValue();
        Sort sort = captured.getSort();
        assertNotNull(sort, "정렬이 반드시 지정되어야 한다");

        List<Sort.Order> orders = sort.toList();
        assertEquals(3, orders.size(), "date / startTime / id 3-key 정렬");

        assertEquals("date", orders.get(0).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(0).getDirection());

        assertEquals("startTime", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());

        assertEquals("id", orders.get(2).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(2).getDirection());

        assertEquals(0, captured.getPageNumber(), "페이지 번호 보존");
        assertEquals(20, captured.getPageSize(), "페이지 크기 보존");
    }

    @Test
    @DisplayName("CLIENT 역할 페이지 조회 — 호출자가 임의의 Sort 를 줘도 무시되고 DESC 가 적용된다")
    void clientPaged_ignoresCallerSort_andEnforcesDesc() {
        Pageable inputPageable = PageRequest.of(2, 5, Sort.by(Sort.Direction.ASC, "id"));
        Page<Schedule> emptyPage = new PageImpl<>(Collections.emptyList(), inputPageable, 0);
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        lenient().when(scheduleRepository.findByTenantIdAndClientId(
                anyString(), anyLong(), any(Pageable.class)))
                .thenReturn(emptyPage);

        scheduleService.findSchedulesWithNamesByUserRolePaged(TEST_CLIENT_ID, "CLIENT", inputPageable);

        verify(scheduleRepository).findByTenantIdAndClientId(
                eq(TEST_TENANT_ID), eq(TEST_CLIENT_ID), pageableCaptor.capture());
        Pageable captured = pageableCaptor.getValue();
        Sort sort = captured.getSort();
        assertTrue(sort.isSorted(), "정렬이 적용되어야 한다");
        assertEquals(Sort.Direction.DESC, sort.getOrderFor("date").getDirection(),
                "date 는 DESC 여야 한다 (호출자 Sort 무시)");
        assertEquals(Sort.Direction.DESC, sort.getOrderFor("startTime").getDirection());
        assertEquals(2, captured.getPageNumber(), "페이지 번호 보존");
        assertEquals(5, captured.getPageSize(), "페이지 크기 보존");
    }
}
