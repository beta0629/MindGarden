package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.core.constant.OnboardingConstants;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.repository.onboarding.OnboardingRequestRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("OnboardingServiceImpl 공개 조회(휴대폰·이메일)")
class OnboardingServiceImplPublicLookupTest {

    private static final String PHONE = "01012345678";
    private static final String EMAIL = "user@example.com";

    @Mock
    private OnboardingRequestRepository repository;

    @InjectMocks
    private OnboardingServiceImpl onboardingService;

    @Test
    @DisplayName("휴대폰만으로 requestedBy 조회")
    void findPublicByContact_phoneOnly() {
        OnboardingRequest request = OnboardingRequest.builder().id(1L).requestedBy(PHONE).build();
        when(repository.findByRequestedByAndIsDeletedFalseOrderByCreatedAtDesc(PHONE))
                .thenReturn(List.of(request));
        when(repository.findByChecklistContactPhone(PHONE)).thenReturn(List.of());

        List<OnboardingRequest> results = onboardingService.findPublicByContact(null, "010-1234-5678");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo(1L);
        verify(repository).findByRequestedByAndIsDeletedFalseOrderByCreatedAtDesc(PHONE);
    }

    @Test
    @DisplayName("이메일만으로 checklist contactEmail 조회")
    void findPublicByContact_emailOnly() {
        OnboardingRequest request = OnboardingRequest.builder()
                .id(2L)
                .requestedBy(PHONE)
                .checklistJson("{\"contactEmail\":\"" + EMAIL + "\"}")
                .build();
        when(repository.findByRequestedByIgnoreCaseAndIsDeletedFalseOrderByCreatedAtDesc(EMAIL))
                .thenReturn(List.of());
        when(repository.findByChecklistContactEmailIgnoreCase(EMAIL)).thenReturn(List.of(request));

        List<OnboardingRequest> results = onboardingService.findPublicByContact(EMAIL, null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo(2L);
    }

    @Test
    @DisplayName("연락처 없으면 예외")
    void findPublicByContact_missingContact() {
        assertThatThrownBy(() -> onboardingService.findPublicByContact(null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(OnboardingConstants.ERROR_ONBOARDING_PUBLIC_CONTACT_REQUIRED);
    }

    @Test
    @DisplayName("ID+휴대폰 본인 확인 성공")
    void findByIdAndContact_phoneMatch() {
        OnboardingRequest request = OnboardingRequest.builder()
                .id(10L)
                .requestedBy(PHONE)
                .build();
        when(repository.findActiveById(10L)).thenReturn(Optional.of(request));

        OnboardingRequest result = onboardingService.findByIdAndContact(10L, null, PHONE);

        assertThat(result.getId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("ID+연락처 불일치 시 예외")
    void findByIdAndContact_mismatch() {
        OnboardingRequest request = OnboardingRequest.builder()
                .id(11L)
                .requestedBy(PHONE)
                .build();
        when(repository.findActiveById(11L)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> onboardingService.findByIdAndContact(11L, EMAIL, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(OnboardingConstants.ERROR_ONBOARDING_REQUEST_NOT_FOUND);
    }
}
