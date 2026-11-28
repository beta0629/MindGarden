package com.coresolution.consultation.sct.util;

import java.nio.charset.Charset;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctFormType;
import org.springframework.util.StringUtils;

/**
 * SCT 초대 SMS 본문 조립·EUC-KR 바이트 계산.
 *
 * <p>단문 템플릿: {@code [마인드가든] {shortTitle} {koreanMonthDay}까지\n{absoluteShortUrl}}.
 * 본문에 전화번호를 넣지 않는다.</p>
 *
 * <p>PROD/DEV 동일 코드 경로. 절대 URL 길이(EUC-KR 바이트)만으로
 * spaced date → compact date → (청소년) 짧은 제목 순으로 축소한다.
 * host·profile 분기 없음.</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public final class SctSmsMessageBuilder {

    private static final Charset EUC_KR = Charset.forName("EUC-KR");
    private static final DateTimeFormatter MONTH_DAY_SPACED =
            DateTimeFormatter.ofPattern("M월 d일", Locale.KOREAN);
    private static final DateTimeFormatter MONTH_DAY_COMPACT =
            DateTimeFormatter.ofPattern("M월d일", Locale.KOREAN);

    private SctSmsMessageBuilder() {
    }

    /**
     * 양식 유형 → SMS 짧은 제목.
     *
     * @param formType ADULT/ADOLESCENT/CHILD
     * @return 짧은 제목
     */
    public static String shortTitleForFormType(String formType) {
        if (!StringUtils.hasText(formType)) {
            return "문장완성";
        }
        try {
            SctFormType type = SctFormType.fromCode(formType.trim().toUpperCase(Locale.ROOT));
            return switch (type) {
                case ADULT -> "성인 문장완성";
                case ADOLESCENT -> "청소년 문장완성";
                case CHILD -> "아동 문장완성";
            };
        } catch (IllegalArgumentException ex) {
            return "문장완성";
        }
    }

    /**
     * 바이트 초과 시 쓰는 짧은 청소년 제목(URL 길이만으로 선택).
     *
     * @return 청소년 질문지
     */
    public static String shortTitleAdolescentCompact() {
        return "청소년 질문지";
    }

    /**
     * 한국어 월·일 (공백 포함: {@code 12월 9일}).
     *
     * @param expiresAt 만료 시각
     * @return 월·일
     */
    public static String formatKoreanMonthDaySpaced(LocalDateTime expiresAt) {
        if (expiresAt == null) {
            throw new IllegalArgumentException("expiresAt required");
        }
        return expiresAt.format(MONTH_DAY_SPACED);
    }

    /**
     * 한국어 월·일 (공백 제거: {@code 12월9일}) — URL이 길 때 바이트 절약.
     *
     * @param expiresAt 만료 시각
     * @return 월·일
     */
    public static String formatKoreanMonthDayCompact(LocalDateTime expiresAt) {
        if (expiresAt == null) {
            throw new IllegalArgumentException("expiresAt required");
        }
        return expiresAt.format(MONTH_DAY_COMPACT);
    }

    /**
     * EUC-KR 바이트 길이.
     *
     * @param text 본문
     * @return 바이트 수
     */
    public static int eucKrByteLength(String text) {
        if (text == null) {
            return 0;
        }
        return text.getBytes(EUC_KR).length;
    }

    /**
     * 단문 SMS 본문 조립. ≤90B가 되도록 날짜 공백·청소년 제목을 단계적으로 축소한다.
     * 절대 URL 길이만으로 축소 단계가 결정되며 host/profile 분기는 없다.
     *
     * @param formType         양식 유형
     * @param expiresAt        만료
     * @param absoluteShortUrl 절대 단축 URL
     * @return 본문(≤90B) 또는 null(초과 시)
     */
    public static String buildShortSmsBody(
            String formType, LocalDateTime expiresAt, String absoluteShortUrl) {
        if (!StringUtils.hasText(absoluteShortUrl) || expiresAt == null) {
            return null;
        }
        String primaryTitle = shortTitleForFormType(formType);
        String spaced = buildBody(primaryTitle, formatKoreanMonthDaySpaced(expiresAt), absoluteShortUrl);
        if (eucKrByteLength(spaced) <= SctConstants.SMS_EUC_KR_MAX_BYTES) {
            return spaced;
        }
        String compactDate = buildBody(
                primaryTitle, formatKoreanMonthDayCompact(expiresAt), absoluteShortUrl);
        if (eucKrByteLength(compactDate) <= SctConstants.SMS_EUC_KR_MAX_BYTES) {
            return compactDate;
        }
        if (SctFormType.ADOLESCENT.name().equalsIgnoreCase(formType)) {
            String adolescentCompact = buildBody(
                    shortTitleAdolescentCompact(),
                    formatKoreanMonthDayCompact(expiresAt),
                    absoluteShortUrl);
            if (eucKrByteLength(adolescentCompact) <= SctConstants.SMS_EUC_KR_MAX_BYTES) {
                return adolescentCompact;
            }
        }
        return null;
    }

    /**
     * 단문 축소 단계의 최종(가장 compact) 시도본 EUC-KR 바이트 수.
     * {@link #buildShortSmsBody}가 null일 때 overflow 로그용.
     *
     * @param formType         양식 유형
     * @param expiresAt        만료
     * @param absoluteShortUrl 절대 단축 URL(resolver 값)
     * @return 최종 시도본 바이트 수(입력 불가면 0)
     */
    public static int measureMostCompactShortSmsEucKrBytes(
            String formType, LocalDateTime expiresAt, String absoluteShortUrl) {
        if (!StringUtils.hasText(absoluteShortUrl) || expiresAt == null) {
            return 0;
        }
        String compactDate = formatKoreanMonthDayCompact(expiresAt);
        if (SctFormType.ADOLESCENT.name().equalsIgnoreCase(formType)) {
            return eucKrByteLength(buildBody(
                    shortTitleAdolescentCompact(), compactDate, absoluteShortUrl));
        }
        return eucKrByteLength(buildBody(
                shortTitleForFormType(formType), compactDate, absoluteShortUrl));
    }

    /**
     * LMS 폴백 본문(단축 링크 불가 시). 사무실 문의 + 긴 공개 URL.
     *
     * @param formType           양식
     * @param expiresAt          만료
     * @param officePhone        사무실(본문 문의)
     * @param absolutePublicUrl  긴 공개 URL
     * @return LMS 본문
     */
    public static String buildLmsFallbackBody(
            String formType,
            LocalDateTime expiresAt,
            String officePhone,
            String absolutePublicUrl) {
        String typeLabel = switch (safeFormType(formType)) {
            case ADULT -> "성인용";
            case ADOLESCENT -> "청소년용";
            case CHILD -> "아동용";
        };
        String date = formatKoreanMonthDaySpaced(expiresAt);
        StringBuilder sb = new StringBuilder();
        sb.append("[마인드가든 심리상담센터]\n")
                .append(typeLabel).append(" 문장완성 질문지입니다.\n")
                .append(date).append("까지 작성해 주세요.\n");
        if (StringUtils.hasText(officePhone)) {
            sb.append("문의 ").append(officePhone.trim()).append('\n');
        }
        sb.append(absolutePublicUrl);
        return sb.toString();
    }

    private static String buildBody(String shortTitle, String koreanMonthDay, String absoluteUrl) {
        return "[마인드가든] " + shortTitle + " " + koreanMonthDay + "까지\n" + absoluteUrl;
    }

    private static SctFormType safeFormType(String formType) {
        if (!StringUtils.hasText(formType)) {
            return SctFormType.ADULT;
        }
        try {
            return SctFormType.fromCode(formType.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return SctFormType.ADULT;
        }
    }
}
