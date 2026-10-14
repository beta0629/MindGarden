import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PG_APPROVAL_LABELS,
  formatKeyChangedLabel,
  formatPendingEditDisplay,
  shouldShowReapprovalBadge
} from "./pgApproval.ts";

describe("pgApproval helpers", () => {
  describe("shouldShowReapprovalBadge", () => {
    it("hasPendingEdit true + APPROVED 이면 재승인 배지", () => {
      assert.equal(
        shouldShowReapprovalBadge({
          hasPendingEdit: true,
          status: "ACTIVE",
          approvalStatus: "APPROVED"
        }),
        true
      );
    });

    it("ACTIVE+PENDING 레거시 조건도 true", () => {
      assert.equal(
        shouldShowReapprovalBadge({
          hasPendingEdit: false,
          status: "ACTIVE",
          approvalStatus: "PENDING"
        }),
        true
      );
    });

    it("pending 없고 APPROVED 이면 false", () => {
      assert.equal(
        shouldShowReapprovalBadge({
          hasPendingEdit: false,
          status: "ACTIVE",
          approvalStatus: "APPROVED"
        }),
        false
      );
    });
  });

  describe("pendingEditDiff labels", () => {
    it("diff 라벨 상수가 정의되어 있다", () => {
      assert.equal(PG_APPROVAL_LABELS.REAPPROVAL_BADGE, "재승인 대기");
      assert.equal(PG_APPROVAL_LABELS.PENDING_EDIT_DIFF_TITLE, "대기 수정 비교");
      assert.equal(PG_APPROVAL_LABELS.PENDING_EDIT_CURRENT, "현재(live)");
      assert.equal(PG_APPROVAL_LABELS.PENDING_EDIT_PENDING, "대기(pending)");
      assert.equal(PG_APPROVAL_LABELS.DIFF_CHANNEL_KEY, "채널 키");
      assert.equal(PG_APPROVAL_LABELS.DIFF_API_KEY_CHANGED, "API 키 변경");
      assert.equal(PG_APPROVAL_LABELS.DIFF_SECRET_KEY_CHANGED, "시크릿 키 변경");
    });

    it("formatPendingEditDisplay / formatKeyChangedLabel", () => {
      assert.equal(formatPendingEditDisplay(""), PG_APPROVAL_LABELS.MERCHANT_EMPTY);
      assert.equal(formatPendingEditDisplay("****ABCD"), "****ABCD");
      assert.equal(formatKeyChangedLabel(true), PG_APPROVAL_LABELS.DIFF_CHANGED_YES);
      assert.equal(formatKeyChangedLabel(false), PG_APPROVAL_LABELS.DIFF_CHANGED_NO);
    });
  });
});
