import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  OPS_ENV_COPY,
  OPS_ENV_VALUE,
  OPS_NAV_COPY,
  OPS_NAV_ID,
  OPS_NAV_PATH,
  OPS_NAV_TREE,
  findOpsNavLeaf,
  listOpsNavLabels,
  listOpsNavLeaves,
  resolveOpsEnvLabel,
  resolveOpsNavSelection
} from "./opsNav.ts";

const APP_ROOT = fileURLToPath(new URL("../../app/", import.meta.url));

const TENANT_DETAIL_PATHS = [
  "/tenants/center-1",
  "/tenants/center-1/",
  "/tenants/center-1/status",
  "/tenants/center-1/domain",
  "/tenants/center-1/admins",
  "/tenants/center-1/settings",
  "/tenants/center-1/features"
];

function pageFile(href: string): string {
  return path.join(APP_ROOT, href.replace(/^\//, ""), "page.tsx");
}

describe("ops nav tree", () => {
  it("keeps the confirmed labels and order", () => {
    assert.deepEqual(listOpsNavLabels(), [
      OPS_NAV_COPY.OVERVIEW,
      OPS_NAV_COPY.ONBOARDING,
      OPS_NAV_COPY.ONBOARDING_LIST,
      OPS_NAV_COPY.ONBOARDING_PENDING,
      OPS_NAV_COPY.ONBOARDING_DONE,
      OPS_NAV_COPY.TENANTS,
      OPS_NAV_COPY.TENANT_LIST,
      OPS_NAV_COPY.TENANT_ADMINS,
      OPS_NAV_COPY.TENANT_DOMAINS,
      OPS_NAV_COPY.TENANT_FEATURES,
      OPS_NAV_COPY.BILLING,
      OPS_NAV_COPY.BILLING_PLANS,
      OPS_NAV_COPY.PG_APPROVAL,
      OPS_NAV_COPY.SUBSCRIPTIONS,
      OPS_NAV_COPY.WEBHOOK_SECRET,
      OPS_NAV_COPY.INVOICES,
      OPS_NAV_COPY.PLATFORM,
      OPS_NAV_COPY.COMMON_CODES,
      OPS_NAV_COPY.SYSTEM_KEYS,
      OPS_NAV_COPY.AI_KEYS,
      OPS_NAV_COPY.SMS,
      OPS_NAV_COPY.NOTIFICATION_TEST,
      OPS_NAV_COPY.MONITORING,
      OPS_NAV_COPY.CACHE,
      OPS_NAV_COPY.SECURITY,
      OPS_NAV_COPY.API_PERFORMANCE
    ]);
  });

  it("exposes overview as the only top-level item and five groups", () => {
    const links = OPS_NAV_TREE.filter((entry) => entry.kind === "link");
    const groups = OPS_NAV_TREE.filter((entry) => entry.kind === "group");
    assert.equal(links.length, 1);
    assert.equal(links[0].kind === "link" && links[0].item.id, OPS_NAV_ID.OVERVIEW);
    assert.equal(groups.length, 5);
    assert.deepEqual(
      groups.map((entry) => (entry.kind === "group" ? entry.group.children.length : 0)),
      [3, 4, 5, 5, 3]
    );
  });

  it("shows 신청 목록 on the onboarding group", () => {
    const leaf = findOpsNavLeaf(OPS_NAV_ID.ONBOARDING_LIST);
    assert.ok(leaf);
    assert.equal(leaf.label, "신청 목록");
    assert.equal(leaf.href, OPS_NAV_PATH.ONBOARDING_LIST);
    assert.equal(leaf.placeholder, false);
    assert.equal(existsSync(pageFile(leaf.href)), true);
  });

  it("has a page for every rail leaf", () => {
    for (const leaf of listOpsNavLeaves()) {
      assert.equal(existsSync(pageFile(leaf.href)), true, leaf.href);
    }
    assert.equal(existsSync(pageFile(OPS_NAV_PATH.ONBOARDING_DETAIL)), true);
  });
});

describe("ops nav selection", () => {
  it("selects only the current leaf and expands only its group", () => {
    const selection = resolveOpsNavSelection("/pg-approval/");
    assert.equal(selection.selectedId, OPS_NAV_ID.PG_APPROVAL);
    assert.equal(selection.expandedGroupId, OPS_NAV_ID.BILLING);
    assert.notEqual(selection.selectedId, OPS_NAV_ID.OVERVIEW);
    assert.notEqual(selection.selectedId, selection.expandedGroupId);
  });

  it("leaves overview without a group", () => {
    const selection = resolveOpsNavSelection("/dashboard");
    assert.equal(selection.selectedId, OPS_NAV_ID.OVERVIEW);
    assert.equal(selection.expandedGroupId, null);
  });

  it("pins every tenant detail path to 테넌트 목록", () => {
    for (const pathname of TENANT_DETAIL_PATHS) {
      const selection = resolveOpsNavSelection(pathname);
      assert.equal(selection.selectedId, OPS_NAV_ID.TENANT_LIST, pathname);
      assert.equal(selection.expandedGroupId, OPS_NAV_ID.TENANTS, pathname);
      assert.notEqual(selection.selectedId, OPS_NAV_ID.TENANT_ADMINS);
      assert.notEqual(selection.selectedId, OPS_NAV_ID.TENANT_DOMAINS);
      assert.notEqual(selection.selectedId, OPS_NAV_ID.TENANT_FEATURES);
    }
  });

  it("keeps cross-tenant lists on their own items", () => {
    assert.equal(
      resolveOpsNavSelection("/tenants/admins").selectedId,
      OPS_NAV_ID.TENANT_ADMINS
    );
    assert.equal(
      resolveOpsNavSelection("/tenants/domains").selectedId,
      OPS_NAV_ID.TENANT_DOMAINS
    );
    assert.equal(
      resolveOpsNavSelection("/tenants/features").selectedId,
      OPS_NAV_ID.TENANT_FEATURES
    );
    assert.equal(
      resolveOpsNavSelection("/tenants/domains-old").selectedId,
      OPS_NAV_ID.TENANT_LIST
    );
  });

  it("pins onboarding detail to 승인 대기, not the list it was opened from", () => {
    for (const pathname of [
      "/onboarding/detail",
      "/onboarding/detail/",
      "/onboarding/detail?id=42",
      "/onboarding/detail/?from=list"
    ]) {
      const selection = resolveOpsNavSelection(pathname);
      assert.equal(selection.selectedId, OPS_NAV_ID.ONBOARDING_PENDING, pathname);
      assert.notEqual(selection.selectedId, OPS_NAV_ID.ONBOARDING_LIST);
      assert.notEqual(selection.selectedId, OPS_NAV_ID.ONBOARDING_DONE);
      assert.equal(selection.expandedGroupId, OPS_NAV_ID.ONBOARDING);
    }
  });

  it("selects 신청 목록 only on the application list route", () => {
    assert.equal(
      resolveOpsNavSelection("/onboarding").selectedId,
      OPS_NAV_ID.ONBOARDING_LIST
    );
    assert.equal(
      resolveOpsNavSelection("/onboarding/pending").selectedId,
      OPS_NAV_ID.ONBOARDING_PENDING
    );
    assert.equal(
      resolveOpsNavSelection("/onboarding/done").selectedId,
      OPS_NAV_ID.ONBOARDING_DONE
    );
  });

  it("does not highlight 기능 켜기 for the old feature-flags route", () => {
    const selection = resolveOpsNavSelection("/feature-flags");
    assert.equal(selection.selectedId, null);
    assert.notEqual(selection.selectedId, OPS_NAV_ID.TENANT_FEATURES);
  });

  it("returns no selection for an unknown path", () => {
    assert.deepEqual(resolveOpsNavSelection("/missing"), {
      selectedId: null,
      expandedGroupId: null
    });
    assert.deepEqual(resolveOpsNavSelection(null), {
      selectedId: null,
      expandedGroupId: null
    });
  });
});

describe("ops env label", () => {
  it("shows 운영 only for the prod value", () => {
    assert.equal(resolveOpsEnvLabel(OPS_ENV_VALUE.PROD), OPS_ENV_COPY.PROD);
    assert.equal(resolveOpsEnvLabel(OPS_ENV_VALUE.DEV), OPS_ENV_COPY.DEV);
    assert.equal(resolveOpsEnvLabel(undefined), OPS_ENV_COPY.DEV);
    assert.equal(resolveOpsEnvLabel("production"), OPS_ENV_COPY.DEV);
    assert.equal(resolveOpsEnvLabel(""), OPS_ENV_COPY.DEV);
  });
});
