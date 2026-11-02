package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.dto.ConsultantSalaryProfileResponse;
import com.coresolution.consultation.entity.ConsultantSalaryProfile;
import com.coresolution.consultation.exception.SalaryProfileConflictException;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.ConsultantSalaryOptionRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.SalaryTaxCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
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
import org.springframework.dao.DataIntegrityViolationException;

/**
 * 급여 프로필 생성·조회 P0 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-11-02
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SalaryManagementServiceImpl 급여 프로필 P0")
class SalaryManagementServiceImplProfileTest {

    private static final String TENANT_ID = "tenant-salary-p0";
    private static final Long CONSULTANT_ID = 22L;

    @Mock
    private ConsultantSalaryProfileRepository consultantSalaryProfileRepository;
    @Mock
    private ConsultantSalaryOptionRepository consultantSalaryOptionRepository;
    @Mock
    private SalaryCalculationRepository salaryCalculationRepository;
    @Mock
    private SalaryTaxCalculationRepository salaryTaxCalculationRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SalaryManagementServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("빈 salaryType → ValidationException(400)")
    void create_blankSalaryType_throwsValidation() {
        ConsultantSalaryProfile profile = baseProfile("");
        assertThatThrownBy(() -> service.createSalaryProfile(profile, null))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("급여 유형");
        verify(consultantSalaryProfileRepository, never()).save(any());
    }

    @Test
    @DisplayName("잘못된 salaryType → ValidationException(400)")
    void create_invalidSalaryType_throwsValidation() {
        ConsultantSalaryProfile profile = baseProfile("HOURLY");
        assertThatThrownBy(() -> service.createSalaryProfile(profile, null))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("허용되지 않은");
        verify(consultantSalaryProfileRepository, never()).save(any());
    }

    @Test
    @DisplayName("DataIntegrity → ValidationException(4xx 안전 문구, SQL 미노출)")
    void create_dataIntegrity_throwsSafeValidation() {
        ConsultantSalaryProfile profile = baseProfile("FREELANCE");
        when(consultantSalaryProfileRepository.existsByTenantIdAndConsultantIdAndIsActiveTrue(
                TENANT_ID, CONSULTANT_ID)).thenReturn(false);
        when(consultantSalaryProfileRepository.save(any(ConsultantSalaryProfile.class)))
                .thenThrow(new DataIntegrityViolationException(
                        "Duplicate entry 'x' for key 'uk_secret_sql_pii'"));

        assertThatThrownBy(() -> service.createSalaryProfile(profile, null))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("저장할 수 없습니다")
                .hasMessageNotContaining("uk_secret_sql_pii")
                .hasMessageNotContaining("Duplicate entry");
    }

    @Test
    @DisplayName("정상 저장")
    void create_validProfile_saves() {
        ConsultantSalaryProfile profile = baseProfile("FREELANCE");
        when(consultantSalaryProfileRepository.existsByTenantIdAndConsultantIdAndIsActiveTrue(
                TENANT_ID, CONSULTANT_ID)).thenReturn(false);
        when(consultantSalaryProfileRepository.save(any(ConsultantSalaryProfile.class)))
                .thenAnswer(invocation -> {
                    ConsultantSalaryProfile saved = invocation.getArgument(0);
                    saved.setId(100L);
                    return saved;
                });

        ConsultantSalaryProfile result = service.createSalaryProfile(profile, null);

        assertThat(result.getId()).isEqualTo(100L);
        ArgumentCaptor<ConsultantSalaryProfile> captor =
                ArgumentCaptor.forClass(ConsultantSalaryProfile.class);
        verify(consultantSalaryProfileRepository).save(captor.capture());
        assertThat(captor.getValue().getSalaryType()).isEqualTo("FREELANCE");
    }

    @Test
    @DisplayName("중복 활성 프로필 생성 → SalaryProfileConflictException(409)")
    void create_duplicateActive_throwsConflict() {
        ConsultantSalaryProfile profile = baseProfile("REGULAR");
        when(consultantSalaryProfileRepository.existsByTenantIdAndConsultantIdAndIsActiveTrue(
                TENANT_ID, CONSULTANT_ID)).thenReturn(true);

        assertThatThrownBy(() -> service.createSalaryProfile(profile, null))
                .isInstanceOf(SalaryProfileConflictException.class)
                .hasMessageContaining("이미 활성");
        verify(consultantSalaryProfileRepository, never()).save(any());
    }

    @Test
    @DisplayName("중복 활성 행이 있어도 조회는 최신 1건")
    void getDetail_duplicateRows_returnsLatest() {
        ConsultantSalaryProfile older = baseProfile("FREELANCE");
        older.setId(1L);
        older.setUpdatedAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        ConsultantSalaryProfile newer = baseProfile("REGULAR");
        newer.setId(2L);
        newer.setUpdatedAt(LocalDateTime.of(2026, 10, 1, 0, 0));

        when(consultantSalaryProfileRepository
                .findFirstByTenantIdAndConsultantIdAndIsActiveTrueOrderByUpdatedAtDescIdDesc(
                        TENANT_ID, CONSULTANT_ID))
                .thenReturn(Optional.of(newer));
        when(consultantSalaryOptionRepository.findByTenantIdAndSalaryProfileIdAndActive(
                eq(TENANT_ID), eq(2L)))
                .thenReturn(List.of());

        ConsultantSalaryProfileResponse response =
                service.getSalaryProfileDetailForConsultant(CONSULTANT_ID);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(2L);
        assertThat(response.getSalaryType()).isEqualTo("REGULAR");
    }

    @Test
    @DisplayName("목록 조회 시 상담사당 최신 1건만")
    void getAll_duplicateRows_dedupesLatestPerConsultant() {
        ConsultantSalaryProfile older22 = baseProfile("FREELANCE");
        older22.setId(10L);
        older22.setConsultantId(22L);
        older22.setUpdatedAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        ConsultantSalaryProfile newer22 = baseProfile("REGULAR");
        newer22.setId(11L);
        newer22.setConsultantId(22L);
        newer22.setUpdatedAt(LocalDateTime.of(2026, 10, 1, 0, 0));
        ConsultantSalaryProfile only99 = baseProfile("FREELANCE");
        only99.setId(20L);
        only99.setConsultantId(99L);
        only99.setUpdatedAt(LocalDateTime.of(2026, 5, 1, 0, 0));

        when(consultantSalaryProfileRepository.findByTenantIdAndIsActiveTrue(TENANT_ID))
                .thenReturn(List.of(older22, newer22, only99));

        List<ConsultantSalaryProfile> result = service.getAllSalaryProfiles();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(ConsultantSalaryProfile::getId).containsExactlyInAnyOrder(11L, 20L);
    }

    private ConsultantSalaryProfile baseProfile(String salaryType) {
        ConsultantSalaryProfile profile = new ConsultantSalaryProfile();
        profile.setTenantId(TENANT_ID);
        profile.setConsultantId(CONSULTANT_ID);
        profile.setSalaryType(salaryType);
        profile.setBaseSalary(BigDecimal.valueOf(30000));
        profile.setIsActive(true);
        return profile;
    }
}
