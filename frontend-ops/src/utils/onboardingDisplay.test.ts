import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { ONBOARDING_FACT_LABELS, ONBOARDING_MESSAGES } from "../constants/onboarding.ts";
import type { OnboardingRequest } from "../types/onboarding.ts";
import {
  applyOnboardingDecisionResponse,
  buildOnboardingFacts,
  mapOnboardingDisplay,
  type OnboardingFact
} from "./onboardingUtils.ts";

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

    assert.equal(display.tenantId, TENANT_ID);
    assert.equal(display.tenantName, TENANT_NAME);
    assert.equal(display.subdomain, SUBDOMAIN);
    assert.equal(fact(facts, "tenantId")?.label, ONBOARDING_FACT_LABELS.TENANT_ID);
    assert.equal(fact(facts, "tenantId")?.value, TENANT_ID);
    assert.equal(fact(facts, "domain")?.value, SUBDOMAIN);
    assert.equal(fact(facts, "representativeEmail")?.value, CONTACT_EMAIL);
    assert.equal(fact(facts, "loginEmail")?.value, CONTACT_EMAIL);
    assert.notEqual(fact(facts, "representativeEmail")?.value, OTHER_EMAIL);
    assert.notEqual(fact(facts, "loginEmail")?.value, PHONE);
    assert.equal(facts.some((item) => item.value.includes("secret-hash")), false);
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

    assert.equal(fact(facts, "representativeEmail")?.value, ONBOARDING_MESSAGES.EMPTY_VALUE);
    assert.equal(fact(facts, "loginEmail")?.value, ONBOARDING_MESSAGES.EMPTY_VALUE);
    assert.equal(fact(facts, "tenantId")?.value, TENANT_ID);
  });

  it("hides ciphertext instead of printing it", () => {
    const facts = buildOnboardingFacts(request({
      status: "APPROVED",
      tenantId: TENANT_ID,
      contactEmail: CIPHER,
      checklistJson: JSON.stringify({ contactEmail: CIPHER, adminEmail: OTHER_EMAIL })
    }));

    assert.equal(fact(facts, "loginEmail")?.value, ONBOARDING_MESSAGES.EMPTY_VALUE);
    assert.equal(fact(facts, "representativeEmail")?.value, ONBOARDING_MESSAGES.EMPTY_VALUE);
    assert.equal(facts.some((item) => item.value.includes(CIPHER)), false);
  });
});

describe("onboarding detail before approval", () => {
  it("keeps contactEmail and does not add a tenant id row", () => {
    const facts = buildOnboardingFacts(request({
      checklistJson: JSON.stringify({ contactEmail: CONTACT_EMAIL, adminEmail: OTHER_EMAIL })
    }));

    assert.equal(fact(facts, "tenantId"), undefined);
    assert.equal(fact(facts, "representativeEmail")?.value, CONTACT_EMAIL);
    assert.equal(fact(facts, "loginEmail")?.value, CONTACT_EMAIL);
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

    assert.equal(card.tenantId, fact(facts, "tenantId")?.value);
    assert.equal(card.tenantName, TENANT_NAME);
    assert.equal(card.subdomain, fact(facts, "domain")?.value);
    assert.equal(card.contactEmail, CONTACT_EMAIL);
    assert.equal(fact(facts, "loginEmail")?.value, CONTACT_EMAIL);
    assert.equal(fact(facts, "representativeEmail")?.value, CONTACT_EMAIL);
  });

  it("does not refetch the onboarding list from the detail page", () => {
    const detailSource = readFileSync(
      fileURLToPath(new URL("../../app/onboarding/detail/page.tsx", import.meta.url)),
      "utf8"
    );
    const cardSource = readFileSync(
      fileURLToPath(new URL("../components/onboarding/OnboardingCardList.tsx", import.meta.url)),
      "utf8"
    );

    assert.equal(detailSource.includes("fetchAllOnboarding"), false);
    assert.equal(detailSource.includes("window.location.reload"), false);
    assert.equal(detailSource.includes("fetchOnboardingDetail"), true);
    assert.equal(detailSource.includes("mapOnboardingDisplay"), true);
    assert.equal(cardSource.includes("mapOnboardingDisplay"), true);
  });
});
