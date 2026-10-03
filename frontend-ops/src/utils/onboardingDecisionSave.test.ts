import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { createNotifiedClientError, isClientApiErrorNotified } from "./clientApiError.ts";
import { saveOnboardingDecision, withSavingReleased } from "./onboardingDecisionSave.ts";

const SUCCESS = "결정을 저장했습니다.";
const FAILED = "결정을 저장하지 못했습니다. 다시 시도해주세요.";

describe("saveOnboardingDecision", () => {
  it("returns the updated request and does not set an error when approval resolves", async () => {
    const notices: string[] = [];
    const updated = { status: "APPROVED", id: "77" };
    const result = await saveOnboardingDecision({
      decide: async () => ({ request: updated }),
      isNotified: isClientApiErrorNotified,
      notifySuccess: (message) => notices.push(`ok:${message}`),
      notifyError: (message) => notices.push(`err:${message}`),
      successMessage: SUCCESS,
      failureMessage: FAILED,
    });

    assert.equal(result.saveError, "");
    assert.deepEqual(result.updated, updated);
    assert.deepEqual(notices, [`ok:${SUCCESS}`]);
  });

  it("surfaces a failure and still settles when the request rejects", async () => {
    const notices: string[] = [];
    const result = await saveOnboardingDecision({
      decide: async () => {
        throw new Error("network down");
      },
      isNotified: isClientApiErrorNotified,
      notifySuccess: (message) => notices.push(`ok:${message}`),
      notifyError: (message) => notices.push(`err:${message}`),
      successMessage: SUCCESS,
      failureMessage: FAILED,
    });

    assert.equal(result.saveError, FAILED);
    assert.equal(result.updated, null);
    assert.deepEqual(notices, [`err:${FAILED}`]);
  });

  it("does not raise a second notice when the api client already notified", async () => {
    const notices: string[] = [];
    const result = await saveOnboardingDecision({
      decide: async () => {
        throw createNotifiedClientError("이미 알림", 500, { message: "이미 알림" });
      },
      isNotified: isClientApiErrorNotified,
      notifySuccess: (message) => notices.push(`ok:${message}`),
      notifyError: (message) => notices.push(`err:${message}`),
      successMessage: SUCCESS,
      failureMessage: FAILED,
    });

    assert.equal(result.saveError, FAILED);
    assert.deepEqual(notices, []);
  });
});

describe("decision form save lifecycle", () => {
  it("clears saving and keeps a visible failure when the request rejects", async () => {
    let saving = true;
    let saveError = "";
    const notices: string[] = [];

    await withSavingReleased(
      async () => {
        const result = await saveOnboardingDecision({
          decide: async () => {
            throw new Error("network down");
          },
          isNotified: isClientApiErrorNotified,
          notifySuccess: (message) => notices.push(`ok:${message}`),
          notifyError: (message) => notices.push(`err:${message}`),
          successMessage: SUCCESS,
          failureMessage: FAILED,
        });
        saveError = result.saveError;
      },
      (next) => {
        saving = next;
      },
    );

    assert.equal(saving, false);
    assert.equal(saveError, FAILED);
    assert.deepEqual(notices, [`err:${FAILED}`]);
  });

  it("clears saving after a successful approval response", async () => {
    let saving = true;
    let savedStatus = "";

    await withSavingReleased(
      async () => {
        const result = await saveOnboardingDecision({
          decide: async () => ({ request: { status: "APPROVED" } }),
          isNotified: isClientApiErrorNotified,
          notifySuccess: () => undefined,
          notifyError: () => undefined,
          successMessage: SUCCESS,
          failureMessage: FAILED,
        });
        savedStatus = result.updated?.status ?? "";
      },
      (next) => {
        saving = next;
      },
    );

    assert.equal(saving, false);
    assert.equal(savedStatus, "APPROVED");
  });
});

describe("withSavingReleased", () => {
  it("clears the saving flag after a rejection", async () => {
    const states: boolean[] = [];
    await assert.rejects(
      () =>
        withSavingReleased(
          async () => {
            throw new Error("still failing");
          },
          (saving) => states.push(saving),
        ),
      /still failing/,
    );
    assert.deepEqual(states, [true, false]);
  });

  it("clears the saving flag after success", async () => {
    const states: boolean[] = [];
    await withSavingReleased(
      async () => undefined,
      (saving) => states.push(saving),
    );
    assert.deepEqual(states, [true, false]);
  });
});

describe("OnboardingDecisionForm", () => {
  it("does not pass an async function to startTransition", () => {
    const sourcePath = fileURLToPath(
      new URL("../components/onboarding/OnboardingDecisionForm.tsx", import.meta.url),
    );
    const source = readFileSync(sourcePath, "utf8");
    assert.equal(source.includes("startTransition("), false);
    assert.equal(source.includes("useTransition("), false);
    assert.equal(source.includes("withSavingReleased"), true);
    assert.equal(source.includes("SAVE_FAILED"), true);
  });
});
