import {
  BUSINESS_REGISTRATION_INVALID_MESSAGE,
  formatBusinessRegistrationNumber,
  isValidBusinessRegistrationNumber,
  isValidBusinessRegistrationNumberOrEmpty,
  normalizeBusinessRegistrationDigits,
} from "../../utils/businessRegistrationNumber";

describe("businessRegistrationNumber", () => {
  it("정규화 시 숫자가 아닌 문자를 제거한다", () => {
    expect(normalizeBusinessRegistrationDigits("123-45-67890")).toBe("1234567890");
    expect(normalizeBusinessRegistrationDigits(" 110 111 2342 ")).toBe("1101112342");
  });

  it("체크섬이 맞는 번호는 통과한다", () => {
    expect(isValidBusinessRegistrationNumber("123-45-67891")).toBe(true);
    expect(isValidBusinessRegistrationNumber("1101112342")).toBe(true);
  });

  it("체크섬이 틀린 번호는 실패한다", () => {
    expect(isValidBusinessRegistrationNumber("123-45-67890")).toBe(false);
    expect(isValidBusinessRegistrationNumber("111-11-11111")).toBe(false);
  });

  it("빈 값은 OrEmpty에서만 허용한다", () => {
    expect(isValidBusinessRegistrationNumber("")).toBe(false);
    expect(isValidBusinessRegistrationNumberOrEmpty("")).toBe(true);
    expect(isValidBusinessRegistrationNumberOrEmpty("123-45-67890")).toBe(false);
    expect(isValidBusinessRegistrationNumberOrEmpty("123-45-67891")).toBe(true);
  });

  it("표시 형식으로 포맷한다", () => {
    expect(formatBusinessRegistrationNumber("1234567891")).toBe("123-45-67891");
  });

  it("무효 메시지 상수가 정의되어 있다", () => {
    expect(BUSINESS_REGISTRATION_INVALID_MESSAGE).toContain("사업자등록번호");
  });
});
