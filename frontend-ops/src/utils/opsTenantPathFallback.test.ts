import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createNotifiedClientError } from "./clientApiError.ts";
import {
  isHttpNotFoundError,
  OPS_TENANT_PATH_FALLBACK_STATUS,
  withOpsTenantPathFallback
} from "./opsTenantPathFallback.ts";

describe("opsTenantPathFallback", () => {
  describe("isHttpNotFoundError", () => {
    it("status 404 이면 true", () => {
      const err = createNotifiedClientError("not found", 404, null);
      assert.equal(isHttpNotFoundError(err), true);
      assert.equal(OPS_TENANT_PATH_FALLBACK_STATUS, 404);
    });

    it("403/400/500 이면 false", () => {
      assert.equal(
        isHttpNotFoundError(createNotifiedClientError("forbidden", 403, null)),
        false
      );
      assert.equal(
        isHttpNotFoundError(createNotifiedClientError("bad", 400, null)),
        false
      );
      assert.equal(
        isHttpNotFoundError(createNotifiedClientError("server", 500, null)),
        false
      );
    });

    it("status 없는 Error 이면 false", () => {
      assert.equal(isHttpNotFoundError(new Error("plain")), false);
      assert.equal(isHttpNotFoundError(null), false);
      assert.equal(isHttpNotFoundError("string"), false);
    });
  });

  describe("withOpsTenantPathFallback", () => {
    it("primary 성공 시 fallback 을 호출하지 않는다", async () => {
      let fallbackCalls = 0;
      const result = await withOpsTenantPathFallback(
        async () => ({ ok: true }),
        async () => {
          fallbackCalls += 1;
          return { ok: false };
        }
      );
      assert.deepEqual(result, { ok: true });
      assert.equal(fallbackCalls, 0);
    });

    it("HTTP 404 이면 fallback 을 호출한다", async () => {
      let fallbackCalls = 0;
      const result = await withOpsTenantPathFallback(
        async () => {
          throw createNotifiedClientError("missing route", 404, { code: "NOT_FOUND" });
        },
        async () => {
          fallbackCalls += 1;
          return { via: "ops-alias" };
        }
      );
      assert.deepEqual(result, { via: "ops-alias" });
      assert.equal(fallbackCalls, 1);
    });

    it("HTTP 403 이면 fallback 없이 오류를 status·message 그대로 재throw 한다", async () => {
      let fallbackCalls = 0;
      const primaryError = createNotifiedClientError(
        "ADMIN 은 OPS 전용 API 를 호출할 수 없습니다",
        403,
        null
      );
      await assert.rejects(
        async () =>
          withOpsTenantPathFallback(
            async () => {
              throw primaryError;
            },
            async () => {
              fallbackCalls += 1;
              return { via: "ops-alias" };
            }
          ),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.equal((err as { status?: number }).status, 403);
          assert.equal(
            err.message,
            "ADMIN 은 OPS 전용 API 를 호출할 수 없습니다"
          );
          return true;
        }
      );
      assert.equal(fallbackCalls, 0);
    });

    it("HTTP 500 이면 fallback 없이 재throw 한다", async () => {
      let fallbackCalls = 0;
      await assert.rejects(
        async () =>
          withOpsTenantPathFallback(
            async () => {
              throw createNotifiedClientError("internal", 500, null);
            },
            async () => {
              fallbackCalls += 1;
              return { via: "ops" };
            }
          ),
        (err: unknown) => {
          assert.equal((err as { status?: number }).status, 500);
          assert.equal((err as Error).message, "internal");
          return true;
        }
      );
      assert.equal(fallbackCalls, 0);
    });
  });
});
