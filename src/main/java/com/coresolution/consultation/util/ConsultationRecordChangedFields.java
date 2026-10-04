package com.coresolution.consultation.util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import com.coresolution.consultation.entity.ConsultationRecord;

/**
 * 상담일지 작성·수정 시 바뀐 필드 <strong>이름</strong>만 계산한다.
 *
 * <p>값 비교는 메모리에서만 하고, 결과에는 필드명만 담는다. 반환값을 로그·감사·응답에 써도
 * 본문이 새지 않는다. 추적 대상은 작성 화면에서 편집 가능한 필드다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public final class ConsultationRecordChangedFields {

    /** 감사 컬럼({@code changed_fields}) 최대 길이. */
    public static final int MAX_JOINED_LENGTH = 2000;

    private static final String SEPARATOR = ",";

    private static final Map<String, Function<ConsultationRecord, Object>> TRACKED;

    static {
        Map<String, Function<ConsultationRecord, Object>> fields = new LinkedHashMap<>();
        fields.put("clientCondition", ConsultationRecord::getClientCondition);
        fields.put("mainIssues", ConsultationRecord::getMainIssues);
        fields.put("interventionMethods", ConsultationRecord::getInterventionMethods);
        fields.put("clientResponse", ConsultationRecord::getClientResponse);
        fields.put("nextSessionPlan", ConsultationRecord::getNextSessionPlan);
        fields.put("homeworkAssigned", ConsultationRecord::getHomeworkAssigned);
        fields.put("homeworkDueDate", ConsultationRecord::getHomeworkDueDate);
        fields.put("riskAssessment", ConsultationRecord::getRiskAssessment);
        fields.put("riskFactors", ConsultationRecord::getRiskFactors);
        fields.put("emergencyResponsePlan", ConsultationRecord::getEmergencyResponsePlan);
        fields.put("progressEvaluation", ConsultationRecord::getProgressEvaluation);
        fields.put("progressScore", ConsultationRecord::getProgressScore);
        fields.put("goalAchievement", ConsultationRecord::getGoalAchievement);
        fields.put("goalAchievementDetails", ConsultationRecord::getGoalAchievementDetails);
        fields.put("consultantObservations", ConsultationRecord::getConsultantObservations);
        fields.put("consultantAssessment", ConsultationRecord::getConsultantAssessment);
        fields.put("specialConsiderations", ConsultationRecord::getSpecialConsiderations);
        fields.put("medicalInformation", ConsultationRecord::getMedicalInformation);
        fields.put("medicationInfo", ConsultationRecord::getMedicationInfo);
        fields.put("familyRelationships", ConsultationRecord::getFamilyRelationships);
        fields.put("socialSupport", ConsultationRecord::getSocialSupport);
        fields.put("environmentalFactors", ConsultationRecord::getEnvironmentalFactors);
        fields.put("sessionDurationMinutes", ConsultationRecord::getSessionDurationMinutes);
        fields.put("isSessionCompleted", ConsultationRecord::getIsSessionCompleted);
        fields.put("incompletionReason", ConsultationRecord::getIncompletionReason);
        fields.put("followUpActions", ConsultationRecord::getFollowUpActions);
        fields.put("followUpDueDate", ConsultationRecord::getFollowUpDueDate);
        TRACKED = Collections.unmodifiableMap(fields);
    }

    private ConsultationRecordChangedFields() {
    }

    /**
     * 추적 필드의 현재 값 스냅샷 (메모리 전용 — 외부로 내보내지 않는다).
     *
     * @param record 상담일지 (null 이면 빈 스냅샷)
     * @return 필드명 → 값
     */
    public static Map<String, Object> snapshot(ConsultationRecord record) {
        Map<String, Object> values = new LinkedHashMap<>();
        if (record == null) {
            return values;
        }
        TRACKED.forEach((name, getter) -> values.put(name, normalize(getter.apply(record))));
        return values;
    }

    /**
     * 두 스냅샷에서 값이 달라진 필드명 목록.
     *
     * @param before 변경 전 스냅샷 (작성이면 빈 맵)
     * @param after  변경 후 스냅샷
     * @return 바뀐 필드명 (추적 순서)
     */
    public static List<String> diff(Map<String, Object> before, Map<String, Object> after) {
        List<String> changed = new ArrayList<>();
        for (String name : TRACKED.keySet()) {
            Object previous = before != null ? before.get(name) : null;
            Object current = after != null ? after.get(name) : null;
            if (!Objects.equals(previous, current)) {
                changed.add(name);
            }
        }
        return changed;
    }

    /**
     * 필드명 목록을 감사 컬럼 길이 안에서 콤마로 잇는다. 넘치면 남은 이름은 버린다.
     *
     * @param names 필드명 목록
     * @return 콤마 구분 문자열 (비면 null)
     */
    public static String join(List<String> names) {
        if (names == null || names.isEmpty()) {
            return null;
        }
        StringBuilder joined = new StringBuilder();
        for (String name : names) {
            int extra = (joined.length() == 0 ? 0 : SEPARATOR.length()) + name.length();
            if (joined.length() + extra > MAX_JOINED_LENGTH) {
                break;
            }
            if (joined.length() > 0) {
                joined.append(SEPARATOR);
            }
            joined.append(name);
        }
        return joined.toString();
    }

    private static Object normalize(Object value) {
        if (value instanceof String text && text.isEmpty()) {
            return null;
        }
        return value;
    }
}
