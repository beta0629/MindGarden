import { render, waitFor } from "@testing-library/react";

const AUTH_KEY = "fixture-auth-key-value";
const CUSTOMER_KEY = "fixture-customer-key-value";
const PAYMENT_KEY = "fixture-payment-key-value";
const CONTACT_PHONE = "01099998888";
const ADMIN_PASSWORD = "fixture-admin-password";
const PAYMENT_METHOD_ID = "fixture-payment-method-id";
const ORDER_ID = "fixture-order-id";
const TENANT_NAME = "픽스처테스트센터";

let mockParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockParams,
  useRouter: () => ({ push: jest.fn() }),
}));

const mockCreatePaymentMethod = jest.fn();
const mockCreateOnboardingRequest = jest.fn();

jest.mock("../../utils/api", () => ({
  createPaymentMethod: (...args: unknown[]) => mockCreatePaymentMethod(...args),
  createOnboardingRequest: (...args: unknown[]) => mockCreateOnboardingRequest(...args),
}));

jest.mock("../../utils/commonCodeUtils", () => ({
  getDefaultRiskLevel: jest.fn().mockResolvedValue("LOW"),
}));

// eslint-disable-next-line import/first
import OnboardingCallbackPage from "../../app/onboarding/callback/page";

const SECRETS = [
  AUTH_KEY,
  CUSTOMER_KEY,
  PAYMENT_KEY,
  CONTACT_PHONE,
  ADMIN_PASSWORD,
  PAYMENT_METHOD_ID,
  ORDER_ID,
  TENANT_NAME,
];

function consoleOutput(spies: jest.SpyInstance[]): string {
  return spies
    .flatMap((spy) => spy.mock.calls)
    .map((args) => args.map((arg: unknown) => {
      try {
        return typeof arg === "string" ? arg : JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }).join(" "))
    .join("\n");
}

describe("온보딩 콜백 — 결제 키·연락처를 콘솔에 남기지 않는다", () => {
  let spies: jest.SpyInstance[];

  beforeEach(() => {
    spies = (["log", "info", "warn", "error", "debug"] as const).map((method) =>
      jest.spyOn(console, method).mockImplementation(() => undefined)
    );
    mockCreatePaymentMethod.mockReset();
    mockCreateOnboardingRequest.mockReset();
    mockCreatePaymentMethod.mockResolvedValue({ paymentMethodId: PAYMENT_METHOD_ID });
    mockCreateOnboardingRequest.mockResolvedValue({ id: "req-1" });
    sessionStorage.setItem(
      "onboarding_form_data",
      JSON.stringify({ tenantName: TENANT_NAME, contactPhone: CONTACT_PHONE, adminPassword: ADMIN_PASSWORD })
    );
  });

  afterEach(() => {
    spies.forEach((spy) => spy.mockRestore());
    sessionStorage.clear();
  });

  it("카드 등록 성공 흐름", async () => {
    mockParams = new URLSearchParams({
      status: "success",
      type: "register",
      authKey: AUTH_KEY,
      customerKey: CUSTOMER_KEY,
      tenantName: TENANT_NAME,
      contactPhone: CONTACT_PHONE,
    });
    render(<OnboardingCallbackPage />);
    await waitFor(() => expect(mockCreateOnboardingRequest).toHaveBeenCalled());
    expect(mockCreatePaymentMethod).toHaveBeenCalledWith(expect.objectContaining({ paymentMethodToken: AUTH_KEY }));
    expect(mockCreateOnboardingRequest).toHaveBeenCalledWith(expect.objectContaining({
      tenantName: TENANT_NAME,
      checklistJson: expect.stringContaining(PAYMENT_METHOD_ID),
    }));
    const output = consoleOutput(spies);
    SECRETS.forEach((secret) => expect(output).not.toContain(secret));
  });

  it("즉시 결제 성공 흐름", async () => {
    mockParams = new URLSearchParams({
      status: "success",
      type: "pay",
      paymentKey: PAYMENT_KEY,
      orderId: ORDER_ID,
      customerKey: CUSTOMER_KEY,
      tenantName: TENANT_NAME,
      contactPhone: CONTACT_PHONE,
    });
    render(<OnboardingCallbackPage />);
    await waitFor(() => expect(mockCreateOnboardingRequest).toHaveBeenCalled());
    expect(mockCreatePaymentMethod).not.toHaveBeenCalled();
    expect(mockCreateOnboardingRequest).toHaveBeenCalledWith(expect.objectContaining({
      checklistJson: expect.stringContaining(ORDER_ID),
    }));
    const output = consoleOutput(spies);
    SECRETS.forEach((secret) => expect(output).not.toContain(secret));
  });

  it("카드 등록 실패 흐름 (console.error 는 운영에도 남으므로 URL 파라미터 원문 금지)", async () => {
    mockParams = new URLSearchParams({
      status: "fail",
      code: "USER_CANCEL",
      authKey: AUTH_KEY,
      customerKey: CUSTOMER_KEY,
      contactPhone: CONTACT_PHONE,
    });
    render(<OnboardingCallbackPage />);
    await waitFor(() => expect(spies[3]).toHaveBeenCalled());
    const output = consoleOutput(spies);
    SECRETS.forEach((secret) => expect(output).not.toContain(secret));
  });
});
