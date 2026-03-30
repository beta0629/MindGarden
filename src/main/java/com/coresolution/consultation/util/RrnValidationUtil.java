package com.coresolution.consultation.util;

import java.time.LocalDate;
import java.util.regex.Pattern;

/**
 * 주민번호 앞 6자리(YYMMDD) + 뒤 1자리 검증 및 나이·성별 계산
 * 전체 13자리 또는 원문 저장·노출 금지. 앞6+뒤1만 입력받아 검증·파생값 계산.
 *
 * @author MindGarden
 * @since 2026-03-02
 */
public final class RrnValidationUtil {

    private static final Pattern RRN_FIRST_6 = Pattern.compile("^[0-9]{6}$");
    private static final Pattern RRN_LAST_1 = Pattern.compile("^[1-4]$"); // 1~4만 허용 (일반 주민 1,2=1900년대 / 3,4=2000년대)

    private RrnValidationUtil() {
    }

    /**
     * 형식 검증: 앞 6자리 숫자, 뒤 1자리 숫자(1~4)
     *
     * @param rrnFirst6 주민번호 앞 6자리 (YYMMDD)
     * @param rrnLast1  주민번호 뒤 1자리 (성별·세대)
     * @return 검증 성공 여부
     */
    public static boolean validateFormat(String rrnFirst6, String rrnLast1) {
        if (rrnFirst6 == null || rrnLast1 == null) {
            return false;
        }
        String f = rrnFirst6.trim();
        String l = rrnLast1.trim();
        if (f.length() != 6 || l.length() != 1) {
            return false;
        }
        if (!RRN_FIRST_6.matcher(f).matches() || !RRN_LAST_1.matcher(l).matches()) {
            return false;
        }
        // 날짜 유효성 (YYMMDD)
        int yy = Integer.parseInt(f.substring(0, 2), 10);
        int mm = Integer.parseInt(f.substring(2, 4), 10);
        int dd = Integer.parseInt(f.substring(4, 6), 10);
        if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
            return false;
        }
        try {
            int century = (Integer.parseInt(l, 10) <= 2) ? 1900 : 2000;
            LocalDate.of(century + yy, mm, dd);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 앞 6자리+뒤 1자리로 생년월일 계산
     *
     * @param rrnFirst6 앞 6자리 (YYMMDD)
     * @param rrnLast1  뒤 1자리 (1,2=1900년대 / 3,4=2000년대)
     * @return 생년월일, 형식 오류 시 null
     */
    public static LocalDate toBirthDate(String rrnFirst6, String rrnLast1) {
        if (!validateFormat(rrnFirst6, rrnLast1)) {
            return null;
        }
        String f = rrnFirst6.trim();
        String l = rrnLast1.trim();
        int yy = Integer.parseInt(f.substring(0, 2), 10);
        int mm = Integer.parseInt(f.substring(2, 4), 10);
        int dd = Integer.parseInt(f.substring(4, 6), 10);
        int seventh = Integer.parseInt(l, 10);
        int century = (seventh <= 2) ? 1900 : 2000;
        return LocalDate.of(century + yy, mm, dd);
    }

    /**
     * 현재 만 나이 계산
     *
     * @param birthDate 생년월일
     * @return 만 나이, null 입력 시 null
     */
    public static Integer toAge(LocalDate birthDate) {
        if (birthDate == null) {
            return null;
        }
        LocalDate today = LocalDate.now();
        int age = today.getYear() - birthDate.getYear();
        if (today.getMonthValue() < birthDate.getMonthValue()
                || (today.getMonthValue() == birthDate.getMonthValue() && today.getDayOfMonth() < birthDate.getDayOfMonth())) {
            age--;
        }
        return age;
    }

    /**
     * 주민번호 7번째 자리로 성별 판별 (1,3,5,7=남, 2,4,6,8=여)
     * 입력은 1~4만 허용하므로 1,3=남, 2,4=여
     *
     * @param rrnLast1 뒤 1자리
     * @return "MALE", "FEMALE", 또는 null
     */
    public static String toGender(String rrnLast1) {
        if (rrnLast1 == null || rrnLast1.trim().length() != 1) {
            return null;
        }
        int n = rrnLast1.trim().charAt(0) - '0';
        if (n == 1 || n == 3) {
            return "MALE";
        }
        if (n == 2 || n == 4) {
            return "FEMALE";
        }
        return null;
    }

    /**
     * 저장용 문자열 생성 (암호화 전 앞6+뒤1 결합)
     * API·상담일지에는 노출하지 않고 암호화 저장만 함.
     *
     * @param rrnFirst6 앞 6자리
     * @param rrnLast1  뒤 1자리
     * @return "9001011" 형태, null 입력 시 null
     */
    public static String toPlainRrnForStorage(String rrnFirst6, String rrnLast1) {
        if (rrnFirst6 == null || rrnLast1 == null) {
            return null;
        }
        String f = rrnFirst6.trim();
        String l = rrnLast1.trim();
        if (f.length() != 6 || l.length() != 1) {
            return null;
        }
        return f + l;
    }
}
