package com.coresolution.consultation.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.coresolution.consultation.entity.ConsultationRecord;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 상담일지 목록 DTO — 서술형 본문 미노출 (#1408 검증 FAIL 보완).
 *
 * <p>목록 응답에 본문 미리보기가 섞이면 Expo·웹 목록 화면만으로도 임상 본문이 유출된다.
 * 본문 필드가 다시 추가되지 않도록 필드 목록 자체를 고정한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@DisplayName("상담일지 목록 DTO — 본문 필드 없음")
class ConsultationRecordListItemResponseTest {

    /** 어떤 경우에도 목록에 실리면 안 되는 서술형 본문 컬럼. */
    private static final List<String> BODY_FIELDS = List.of(
        "clientCondition", "mainIssues", "consultantObservations", "nextSessionPlan",
        "interventionMethods", "clientResponse", "homeworkAssigned", "riskFactors",
        "emergencyResponsePlan", "progressEvaluation", "goalAchievementDetails",
        "consultantAssessment", "specialConsiderations", "medicalInformation",
        "medicationInfo", "familyRelationships", "socialSupport", "environmentalFactors",
        "incompletionReason", "followUpActions", "riskAssessment", "progressScore", "goalAchievement",
        "nextSessionDate", "homeworkDueDate", "followUpDueDate", "completionTime");

    private static final String BODY_TEXT =
        "본문유출감지문구는목록응답의서술필드에그대로실리면안되고요약미리보기는첫줄여든자까지만남고나머지는목록에포함되지않아야한다추가문장으로길이를여든자보다길게만든다끝";

    @Test
    @DisplayName("DTO 필드 목록에 서술형 본문 필드가 없다")
    void hasNoBodyFields() {
        Set<String> fields = Arrays.stream(ConsultationRecordListItemResponse.class.getDeclaredFields())
            .filter(f -> !f.isSynthetic())
            .map(Field::getName)
            .collect(Collectors.toSet());

        assertThat(fields).doesNotContainAnyElementsOf(BODY_FIELDS);
    }

    @Test
    @DisplayName("본문이 채워진 엔티티를 변환·직렬화해도 본문 문구가 나오지 않는다")
    void serializedJson_hasNoBodyText() throws Exception {
        ConsultationRecord entity = new ConsultationRecord();
        entity.setId(1L);
        entity.setConsultationId(502L);
        entity.setClientId(20L);
        entity.setConsultantId(22L);
        entity.setSessionDate(LocalDate.of(2026, 10, 1));
        entity.setSessionNumber(3);
        entity.setIsSessionCompleted(Boolean.TRUE);
        entity.setClientCondition(BODY_TEXT);
        entity.setMainIssues(BODY_TEXT);
        entity.setConsultantObservations(BODY_TEXT);
        entity.setNextSessionPlan(BODY_TEXT);
        entity.setMedicalInformation(BODY_TEXT);
        entity.setMedicationInfo(BODY_TEXT);

        String json = new ObjectMapper().registerModule(new JavaTimeModule())
            .writeValueAsString(ConsultationRecordListItemResponse.fromEntity(entity));

        assertThat(json).doesNotContain(BODY_TEXT);
        for (String field : BODY_FIELDS) {
            assertThat(json).doesNotContain("\"" + field + "\"");
        }
        assertThat(json).contains("\"summaryPreview\":\"본문유출감지문구는목록응답의서술필드에그대로실리면안되고요약미리보기는첫줄여든자까지만남고나머지는목록에포");
        // 메타는 그대로 쓸 수 있어야 한다 (목록 화면 회귀 방지).
        assertThat(json).contains("\"sessionNumber\":3").contains("\"consultantId\":22");
    }
}
