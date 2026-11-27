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
     * DEV 도메인(+4B)용 짧은 청소년 제목.
     *
     * @return 청소년 질문지
     */
    public static String shortTitleAdolescentDevCompact() {
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
     * 한국어 월·일 (공백 제거: {@code 12월9일}) — DEV 바이트 절약.
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
            String adolescentDev = buildBody(
                    shortTitleAdolescentDevCompact(),
                    formatKoreanMonthDayCompact(expiresAt),
                    absoluteShortUrl);
            if (eucKrByteLength(adolescentDev) <= SctConstants.SMS_EUC_KR_MAX_BYTES) {
                return adolescentDev;
            }
        }
        return null;
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
        String office = StringUtils.hasText(officePhone) ? officePhone.trim() : "";
        return "[마인드가든 심리상담센터]\n"
                + typeLabel + " 문장완성 질문지입니다.\n"
                + date + "까지 작성해 주세요.\n"
                + "문의 " + office + "\n"
                + absolutePublicUrl;
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
