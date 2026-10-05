import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyRefreshedOnboardingViews,
  createSnapshotCache,
  refreshOnboardingViews
} from "./onboardingViewRefresh.ts";

const DETAIL_ERROR = "데이터를 불러오는데 실패했습니다.";
const LIST_ERROR = "데이터를 불러오는데 실패했습니다.";

describe("refreshOnboardingViews", () => {
  it("returns the refetched detail and list together", async () => {
    const detail = { id: "9", status: "APPROVED", tenantName: "마음정원" };
    const list = [detail, { id: "10", status: "PENDING", tenantName: "새 신청" }];
    const snapshot = await refreshOnboardingViews({
      fetchDetail: async () => detail,
      fetchList: async () => list,
      detailFailureMessage: DETAIL_ERROR,
      listFailureMessage: LIST_ERROR
    });

    assert.deepEqual(snapshot.detail, detail);
    assert.deepEqual(snapshot.list, list);
    assert.equal(snapshot.detailError, "");
    assert.equal(snapshot.listError, "");
  });

  it("keeps a successful list when the detail refetch fails", async () => {
    const list = [{ id: "10", status: "REJECTED", tenantName: "거절된 센터" }];
    const snapshot = await refreshOnboardingViews({
      fetchDetail: async () => {
        throw new Error("상세 조회 실패");
      },
      fetchList: async () => list,
      detailFailureMessage: DETAIL_ERROR,
      listFailureMessage: LIST_ERROR
    });

    assert.equal(snapshot.detail, null);
    assert.equal(snapshot.detailError, "상세 조회 실패");
    assert.deepEqual(snapshot.list, list);
    assert.equal(snapshot.listError, "");
  });

  it("uses the fallback when a refetch rejection has no message", async () => {
    const snapshot = await refreshOnboardingViews({
      fetchDetail: async () => {
        throw new Error(" ");
      },
      fetchList: async () => {
        throw new Error(" ");
      },
      detailFailureMessage: DETAIL_ERROR,
      listFailureMessage: LIST_ERROR
    });

    assert.equal(snapshot.detailError, DETAIL_ERROR);
    assert.equal(snapshot.listError, LIST_ERROR);
  });
});

describe("applyRefreshedOnboardingViews", () => {
  it("applies both sides when both fetches succeed", async () => {
    const applied: string[] = [];
    await applyRefreshedOnboardingViews({
      fetchDetail: async () => ({ status: "ON_HOLD", tenantName: "보류 센터" }),
      fetchList: async () => [{ status: "ON_HOLD" }],
      detailFailureMessage: DETAIL_ERROR,
      listFailureMessage: LIST_ERROR,
      applyDetail: (detail) => applied.push(`detail:${detail.status}:${detail.tenantName}`),
      applyList: (rows) => applied.push(`list:${rows.length}`)
    });

    assert.deepEqual(applied, ["list:1", "detail:ON_HOLD:보류 센터"]);
  });

  it("still applies the list when the detail refetch fails", async () => {
    const applied: string[] = [];
    const snapshot = await applyRefreshedOnboardingViews({
      fetchDetail: async () => {
        throw new Error("상세 없음");
      },
      fetchList: async () => [{ status: "PENDING" }],
      detailFailureMessage: DETAIL_ERROR,
      listFailureMessage: LIST_ERROR,
      applyDetail: () => applied.push("detail"),
      applyList: (rows) => applied.push(`list:${rows[0].status}`)
    });
    assert.equal(snapshot.detailError, "상세 없음");
    assert.deepEqual(applied, ["list:PENDING"]);
  });
});

describe("createSnapshotCache", () => {
  it("publishes the latest list to subscribers and later reads", () => {
    const cache = createSnapshotCache<Array<{ status: string }>>();
    const seen: string[] = [];
    const unsubscribe = cache.subscribe((rows) => {
      seen.push(rows.map((row) => row.status).join(","));
    });

    assert.equal(cache.read(), null);
    cache.publish([{ status: "APPROVED" }]);
    cache.publish([{ status: "REJECTED" }, { status: "PENDING" }]);
    unsubscribe();
    cache.publish([{ status: "ON_HOLD" }]);

    assert.deepEqual(seen, ["APPROVED", "REJECTED,PENDING"]);
    assert.deepEqual(cache.read(), [{ status: "ON_HOLD" }]);
  });
});
