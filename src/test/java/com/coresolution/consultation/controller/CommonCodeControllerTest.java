package com.coresolution.consultation.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.service.CommonCodePermissionService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.core.dto.ApiResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
@DisplayName("CommonCodeController")
class CommonCodeControllerTest {

    @Mock
    private CommonCodeService commonCodeService;

    @Mock
    private CommonCodePermissionService permissionService;

    @InjectMocks
    private CommonCodeController commonCodeController;

    @Test
    @DisplayName("groups 미전달이면 전체 그룹으로 조회한다")
    void getCommonCodesByGroups_withoutGroups_usesAllGroupsFallback() {
        when(commonCodeService.getCommonCodeGroups()).thenReturn(List.of("A", "B"));
        Map<String, List<CommonCode>> expected = new LinkedHashMap<>();
        expected.put("A", List.of());
        expected.put("B", List.of());
        when(commonCodeService.getCommonCodesByGroups(any(String[].class))).thenReturn(expected);

        ResponseEntity<ApiResponse<Map<String, List<CommonCode>>>> response =
            commonCodeController.getCommonCodesByGroups(null);

        ArgumentCaptor<String[]> groupCaptor = ArgumentCaptor.forClass(String[].class);
        verify(commonCodeService).getCommonCodesByGroups(groupCaptor.capture());
        assertEquals(List.of("A", "B"), List.of(groupCaptor.getValue()));
        assertNotNull(response.getBody());
        assertEquals(expected, response.getBody().getData());
    }

    @Test
    @DisplayName("groups 전달 시 공백/중복 콤마/중복 값을 정제한다")
    void getCommonCodesByGroups_withGroups_sanitizesParameter() {
        Map<String, List<CommonCode>> expected = new LinkedHashMap<>();
        expected.put("A", List.of());
        expected.put("B", List.of());
        when(commonCodeService.getCommonCodesByGroups(any(String[].class))).thenReturn(expected);

        ResponseEntity<ApiResponse<Map<String, List<CommonCode>>>> response =
            commonCodeController.getCommonCodesByGroups(" A, ,B,,A ");

        ArgumentCaptor<String[]> groupCaptor = ArgumentCaptor.forClass(String[].class);
        verify(commonCodeService).getCommonCodesByGroups(groupCaptor.capture());
        assertEquals(List.of("A", "B"), List.of(groupCaptor.getValue()));
        assertNotNull(response.getBody());
        assertEquals(expected, response.getBody().getData());
    }
}
