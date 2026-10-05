import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { createNotifiedClientError, isClientApiErrorNotified } from "./clientApiError.ts";
import {
  readDecisionFailureMessage,
  saveOnboardingDecision,
  settleOnboardingDecision,
  withSavingReleased
} from "./onboardingDecisionSave.ts";

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

  it("surfaces the response reason and still settles when the request rejects", async () => {
    const notices: string[] = [];
    const reason = "이미 처리된 신청입니다.";
    const result = await saveOnboardingDecision({
      decide: async () => {
        throw new Error(reason);
      },
      isNotified: isClientApiErrorNotified,
      notifySuccess: (message) => notices.push(`ok:${message}`),
      notifyError: (message) => notices.push(`err:${message}`),
      successMessage: SUCCESS,
      failureMessage: FAILED,
    });

    assert.equal(result.saveError, reason);
    assert.equal(result.updated, null);
    assert.deepEqual(notices, [`err:${reason}`]);
  });

  it("uses the fallback copy when the rejection has no reason", async () => {
    const notices: string[] = [];
    const result = await saveOnboardingDecision({
      decide: async () => {
        throw new Error("   ");
      },
      isNotified: isClientApiErrorNotified,
      notifySuccess: (message) => notices.push(`ok:${message}`),
      notifyError: (message) => notices.push(`err:${message}`),
      successMessage: SUCCESS,
      failureMessage: FAILED,
    });

    assert.equal(result.saveError, FAILED);
    assert.deepEqual(notices, [`err:${FAILED}`]);
  });

  it("does not announce success when the body says the decision failed", async () => {
    const notices: string[] = [];
    const reason = "승인할 수 없는 상태입니다.";
    const result = await saveOnboardingDecision({
      decide: async () => ({ success: false, message: reason }),
      isNotified: isClientApiErrorNotified,
      notifySuccess: (message) => notices.push(`ok:${message}`),
      notifyError: (message) => notices.push(`err:${message}`),
      successMessage: SUCCESS,
      failureMessage: FAILED,
    });

    assert.equal(result.saveError, reason);
    assert.equal(result.updated, null);
    assert.deepEqual(notices, [`err:${reason}`]);
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

    assert.equal(result.saveError, "이미 알림");
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
        const reason = "network down";
        const result = await saveOnboardingDecision({
          decide: async () => {
            throw new Error(reason);
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
    assert.equal(saveError, "network down");
    assert.deepEqual(notices, ["err:network down"]);
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

describe("settleOnboardingDecision", () => {
  it("refreshes after a successful save and keeps the saved request", async () => {
    const calls: string[] = [];
    const saved = { status: "APPROVED", tenantName: "새 테넌트" };
    const result = await settleOnboardingDecision({
      save: async () => {
        calls.push("save");
        return { saveError: "", updated: saved };
      },
      onSaved: () => calls.push("apply"),
      refresh: async () => {
        calls.push("refresh");
      },
      failureMessage: FAILED,
    });

    assert.equal(result.saveError, "");
    assert.deepEqual(result.updated, saved);
    assert.deepEqual(calls, ["save", "apply", "refresh"]);
  });

  it("still refreshes after a failed save and keeps the failure reason", async () => {
    const calls: string[] = [];
    const reason = "거절 권한이 없습니다.";
    const result = await settleOnboardingDecision({
      save: async () => {
        calls.push("save");
        return { saveError: reason, updated: null };
      },
      refresh: async () => {
        calls.push("refresh");
      },
      failureMessage: FAILED,
    });

    assert.equal(result.saveError, reason);
    assert.equal(result.updated, null);
    assert.deepEqual(calls, ["save", "refresh"]);
  });

  it("does not replace a save failure when the refresh also fails", async () => {
    const reason = "이미 처리된 신청입니다.";
    const result = await settleOnboardingDecision({
      save: async () => ({ saveError: reason, updated: null }),
      refresh: async () => {
        throw new Error("목록을 다시 받지 못했습니다.");
      },
      failureMessage: FAILED,
    });

    assert.equal(result.saveError, reason);
  });

  it("reports the refresh failure when the save itself succeeded", async () => {
    const result = await settleOnboardingDecision({
      save: async () => ({ saveError: "", updated: { status: "APPROVED" } }),
      refresh: async () => {
        throw new Error("상세를 다시 받지 못했습니다.");
      },
      failureMessage: FAILED,
    });

    assert.equal(result.saveError, "상세를 다시 받지 못했습니다.");
    assert.equal(result.updated?.status, "APPROVED");
  });
});

describe("readDecisionFailureMessage", () => {
  it("prefers the error message over the fallback", () => {
    assert.equal(readDecisionFailureMessage(new Error("사유"), FAILED), "사유");
    assert.equal(readDecisionFailureMessage(new Error("  "), FAILED), FAILED);
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
    assert.equal(source.includes("settleOnboardingDecision"), true);
    assert.equal(source.includes("SAVE_FAILED"), true);
    assert.equal(source.includes("disabled={isSaving}"), true);
    assert.equal(source.includes("window.location.reload"), false);
    assert.equal(source.includes("router.refresh"), false);
  });

  it("reloads list and detail through the existing fetches after a decision", () => {
    const detailSource = readFileSync(
      fileURLToPath(new URL("../../app/onboarding/detail/page.tsx", import.meta.url)),
      "utf8",
    );
    const listSource = readFileSync(
      fileURLToPath(new URL("../../app/onboarding/page.tsx", import.meta.url)),
      "utf8",
    );

    assert.equal(detailSource.includes("applyRefreshedOnboardingViews"), true);
    assert.equal(detailSource.includes("fetchOnboardingDetail"), true);
    assert.equal(detailSource.includes("fetchAllOnboarding"), true);
    assert.equal(detailSource.includes("onRefresh={refreshAfterDecision}"), true);
    assert.equal(detailSource.includes("window.location.reload"), false);
    assert.equal(detailSource.includes("router.refresh"), false);
    assert.equal(listSource.includes("onboardingListCache"), true);
    assert.equal(listSource.includes("fetchAllOnboarding"), true);
    assert.equal(listSource.includes("window.location.reload"), false);
    assert.equal(listSource.includes("router.refresh"), false);
  });
});
