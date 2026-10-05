import { readFileSync } from "fs";
import { join } from "path";

import { ONBOARDING_FACT_LABELS, ONBOARDING_MESSAGES } from "@/constants/onboarding";
import { OnboardingRequest } from "@/types/onboarding";

import {
  applyOnboardingDecisionResponse,
  buildOnboardingFacts,
  mapOnboardingDisplay,
  OnboardingFact
} from "./onboardingUtils";

const CONTACT_EMAIL = "owner@example.com";
const OTHER_EMAIL = "other@example.com";
const PHONE = "01012345678";
const TENANT_ID = "tenant-approved-sample";
const TENANT_NAME = "샘플상담센터";
const SUBDOMAIN = "sample-center";
const CIPHER = "k1::QUJDREVGRw==";

function request(partial: Partial<OnboardingRequest>): OnboardingRequest {
  return {
    id: 39,
    tenantId: null,
    tenantName: TENANT_NAME,
    requestedBy: PHONE,
    status: "PENDING",
    riskLevel: "LOW",
    createdAt: "2026-10-05T01:00:00",
    updatedAt: "2026-10-05T01:00:00",
    ...partial
  };
}

function fact(facts: OnboardingFact[], id: string): OnboardingFact | undefined {
  return facts.find((item) => item.id === id);
}

describe("approved onboarding detail block", () => {
  const approved = request({
    status: "APPROVED",
    tenantId: TENANT_ID,
    subdomain: SUBDOMAIN,
    checklistJson: JSON.stringify({
      adminEmail: OTHER_EMAIL,
      email: OTHER_EMAIL,
      representativeEmail: OTHER_EMAIL,
      contactEmail: "  Owner@Example.com ",
      adminPassword: "secret-hash"
    })
  });

  it("shows tenant id, name, subdomain, and both emails from contactEmail", () => {
    const display = mapOnboardingDisplay(approved);
    const facts = buildOnboardingFacts(approved);

    expect(display.tenantId).toBe(TENANT_ID);
    expect(display.tenantName).toBe(TENANT_NAME);
    expect(display.subdomain).toBe(SUBDOMAIN);
    expect(fact(facts, "tenantId")?.label).toBe(ONBOARDING_FACT_LABELS.TENANT_ID);
    expect(fact(facts, "tenantId")?.value).toBe(TENANT_ID);
    expect(fact(facts, "domain")?.value).toBe(SUBDOMAIN);
    expect(fact(facts, "representativeEmail")?.value).toBe(CONTACT_EMAIL);
    expect(fact(facts, "loginEmail")?.value).toBe(CONTACT_EMAIL);
    expect(fact(facts, "representativeEmail")?.value).not.toBe(OTHER_EMAIL);
    expect(fact(facts, "loginEmail")?.value).not.toBe(PHONE);
    expect(facts.some((item) => item.value.includes("secret-hash"))).toBe(false);
  });

  it("does not use adminEmail or requestedBy when contactEmail is absent", () => {
    const facts = buildOnboardingFacts(request({
      status: "APPROVED",
      tenantId: TENANT_ID,
      requestedBy: OTHER_EMAIL,
      checklistJson: JSON.stringify({
        adminEmail: OTHER_EMAIL,
        email: OTHER_EMAIL
      })
    }));

    expect(fact(facts, "representativeEmail")?.value).toBe(ONBOARDING_MESSAGES.EMPTY_VALUE);
    expect(fact(facts, "loginEmail")?.value).toBe(ONBOARDING_MESSAGES.EMPTY_VALUE);
    expect(fact(facts, "tenantId")?.value).toBe(TENANT_ID);
  });

  it("hides ciphertext instead of printing it", () => {
    const facts = buildOnboardingFacts(request({
      status: "APPROVED",
      tenantId: TENANT_ID,
      contactEmail: CIPHER,
      checklistJson: JSON.stringify({ contactEmail: CIPHER, adminEmail: OTHER_EMAIL })
    }));

    expect(fact(facts, "loginEmail")?.value).toBe(ONBOARDING_MESSAGES.EMPTY_VALUE);
    expect(fact(facts, "representativeEmail")?.value).toBe(ONBOARDING_MESSAGES.EMPTY_VALUE);
    expect(facts.some((item) => item.value.includes(CIPHER))).toBe(false);
  });
});

describe("onboarding detail before approval", () => {
  it("keeps contactEmail and does not add a tenant id row", () => {
    const facts = buildOnboardingFacts(request({
      checklistJson: JSON.stringify({ contactEmail: CONTACT_EMAIL, adminEmail: OTHER_EMAIL })
    }));

    expect(fact(facts, "tenantId")).toBeUndefined();
    expect(fact(facts, "representativeEmail")?.value).toBe(CONTACT_EMAIL);
    expect(fact(facts, "loginEmail")?.value).toBe(CONTACT_EMAIL);
  });
});

describe("approval response updates only the detail mapping", () => {
  it("fills tenant id and contact email from the decision response", () => {
    const pending = request({
      checklistJson: JSON.stringify({
        contactEmail: CONTACT_EMAIL,
        adminEmail: OTHER_EMAIL,
        domain: SUBDOMAIN
      })
    });
    const updated = applyOnboardingDecisionResponse(
      {
        ...pending,
        status: "APPROVED",
        tenantId: TENANT_ID,
        tenantName: TENANT_NAME,
        subdomain: SUBDOMAIN,
        contactEmail: CONTACT_EMAIL
      },
      {
        email: CONTACT_EMAIL,
        tenantId: TENANT_ID,
        tenantName: TENANT_NAME
      }
    );
    const facts = buildOnboardingFacts(updated);
    const card = mapOnboardingDisplay(updated);

    expect(card.tenantId).toBe(fact(facts, "tenantId")?.value);
    expect(card.tenantName).toBe(TENANT_NAME);
    expect(card.subdomain).toBe(fact(facts, "domain")?.value);
    expect(card.contactEmail).toBe(CONTACT_EMAIL);
    expect(fact(facts, "loginEmail")?.value).toBe(CONTACT_EMAIL);
    expect(fact(facts, "representativeEmail")?.value).toBe(CONTACT_EMAIL);
  });

  it("does not refetch the onboarding list from the detail page", () => {
    const detailSource = readFileSync(
      join(__dirname, "../../app/onboarding/detail/page.tsx"),
      "utf8"
    );
    const cardSource = readFileSync(
      join(__dirname, "../components/onboarding/OnboardingCardList.tsx"),
      "utf8"
    );

    expect(detailSource.includes("fetchAllOnboarding")).toBe(false);
    expect(detailSource.includes("window.location.reload")).toBe(false);
    expect(detailSource.includes("fetchOnboardingDetail")).toBe(true);
    expect(detailSource.includes("mapOnboardingDisplay")).toBe(true);
    expect(cardSource.includes("mapOnboardingDisplay")).toBe(true);
  });
});
