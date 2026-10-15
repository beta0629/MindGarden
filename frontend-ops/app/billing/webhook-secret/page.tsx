"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import ConfirmModal from "@/components/ui/ConfirmModal";
import MGButton from "@/components/ui/MGButton";
import OpsCard from "@/components/ui/OpsCard";
import OpsQuietHeader from "@/components/shell/OpsQuietHeader";
import {
  OPS_WEBHOOK_SECRET_LABELS,
  OPS_WEBHOOK_SECRET_TEST_IDS
} from "@/constants/opsWebhookSecret";
import {
  fetchOpsPgConfigCandidates,
  fetchOpsPgConfigurationDetail,
  patchOpsTestMode,
  patchOpsWebhookSecret,
  type OpsPgConfigurationItem
} from "@/services/opsWebhookSecretService";
import { fetchOpsTenants, type OpsTenantItem } from "@/services/tenantOpsService";
import { isClientApiErrorNotified } from "@/utils/clientApiError";
import notificationManager from "@/utils/notification";

import styles from "./webhook-secret.module.css";

type ConfirmMode = "secret" | "testMode" | null;

const PAGE_TITLE_ID = "ops-webhook-secret-title";

/**
 * Ops 웹훅 시크릿·테스트 모드 운영 화면
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
export default function OpsWebhookSecretPage() {
  const [tenants, setTenants] = useState<OpsTenantItem[]>([]);
  const [candidates, setCandidates] = useState<OpsPgConfigurationItem[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [detail, setDetail] = useState<OpsPgConfigurationItem | null>(null);
  const [secretInput, setSecretInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [pendingTestMode, setPendingTestMode] = useState<boolean | null>(null);

  const loadTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const tenantList = await fetchOpsTenants();
      setTenants(Array.isArray(tenantList) ? tenantList : []);
    } catch (err) {
      console.error("[OpsWebhookSecretPage] tenants load failed:", err);
      setError(
        err instanceof Error ? err.message : OPS_WEBHOOK_SECRET_LABELS.ERROR_LOAD
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCandidates = useCallback(async (tenantId?: string) => {
    try {
      setError(null);
      const list = await fetchOpsPgConfigCandidates(tenantId || undefined);
      setCandidates(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("[OpsWebhookSecretPage] configs load failed:", err);
      setError(
        err instanceof Error ? err.message : OPS_WEBHOOK_SECRET_LABELS.ERROR_LOAD
      );
      setCandidates([]);
    }
  }, []);

  const loadBase = useCallback(async () => {
    await loadTenants();
    await loadCandidates(selectedTenantId || undefined);
  }, [loadTenants, loadCandidates, selectedTenantId]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    loadCandidates(selectedTenantId || undefined);
  }, [selectedTenantId, loadCandidates]);

  const configsForTenant = useMemo(() => candidates, [candidates]);

  useEffect(() => {
    if (!selectedConfigId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    const loadDetail = async () => {
      try {
        setDetailLoading(true);
        const data = await fetchOpsPgConfigurationDetail(selectedConfigId);
        if (!cancelled) {
          setDetail(data);
          if (data?.tenantId && data.tenantId !== selectedTenantId) {
            setSelectedTenantId(data.tenantId);
          }
        }
      } catch (err) {
        console.error("[OpsWebhookSecretPage] detail failed:", err);
        if (!cancelled) {
          setDetail(null);
          notificationManager.error(
            err instanceof Error ? err.message : OPS_WEBHOOK_SECRET_LABELS.ERROR_LOAD
          );
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    };
    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedConfigId, selectedTenantId]);

  const configured = Boolean(detail?.portoneWebhookSecretConfigured);
  const tenantIdForPatch = detail?.tenantId || selectedTenantId;

  const handleSaveSecret = async () => {
    if (!detail?.configId || !tenantIdForPatch) {
      return;
    }
    const trimmed = secretInput.trim();
    if (!trimmed) {
      notificationManager.error(OPS_WEBHOOK_SECRET_LABELS.NEW_SECRET_PLACEHOLDER);
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const updated = await patchOpsWebhookSecret({
        tenantId: tenantIdForPatch,
        configId: detail.configId,
        webhookSecret: trimmed
      });
      setDetail(updated);
      setSecretInput("");
      setConfirmMode(null);
      notificationManager.success(OPS_WEBHOOK_SECRET_LABELS.SAVE_SUCCESS);
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : OPS_WEBHOOK_SECRET_LABELS.ERROR_SAVE;
      setError(message);
      if (!isClientApiErrorNotified(err)) {
        notificationManager.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTestMode = async () => {
    if (!detail?.configId || !tenantIdForPatch || pendingTestMode == null) {
      return;
    }
    try {
      setSubmitting(true);
      const updated = await patchOpsTestMode({
        tenantId: tenantIdForPatch,
        configId: detail.configId,
        testMode: pendingTestMode
      });
      setDetail(updated);
      setConfirmMode(null);
      setPendingTestMode(null);
      notificationManager.success(OPS_WEBHOOK_SECRET_LABELS.TEST_MODE_SUCCESS);
    } catch (err) {
      notificationManager.error(
        err instanceof Error ? err.message : OPS_WEBHOOK_SECRET_LABELS.ERROR_LOAD
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitSecret = (event: FormEvent) => {
    event.preventDefault();
    setConfirmMode("secret");
  };

  const requestTestModeChange = (next: boolean) => {
    setPendingTestMode(next);
    setConfirmMode("testMode");
  };

  return (
    <>
      <OpsQuietHeader
        title={OPS_WEBHOOK_SECRET_LABELS.PAGE_TITLE}
        titleId={PAGE_TITLE_ID}
        onRefresh={loadBase}
        refreshLabel={OPS_WEBHOOK_SECRET_LABELS.REFRESH}
        refreshing={loading}
      />

      <section
        className={styles.stage}
        data-testid={OPS_WEBHOOK_SECRET_TEST_IDS.PAGE}
        aria-labelledby={PAGE_TITLE_ID}
        aria-busy={loading}
      >
        <p className={styles.hint}>{OPS_WEBHOOK_SECRET_LABELS.PAGE_SUBTITLE}</p>

        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {loading ? <p className={styles.hint}>{OPS_WEBHOOK_SECRET_LABELS.LOADING}</p> : null}

        <div className={styles.filters}>
          <label className={styles.filterField}>
            <span>{OPS_WEBHOOK_SECRET_LABELS.SELECT_TENANT}</span>
            <select
              data-testid={OPS_WEBHOOK_SECRET_TEST_IDS.TENANT_SELECT}
              value={selectedTenantId}
              onChange={(e) => {
                setSelectedTenantId(e.target.value);
                setSelectedConfigId("");
                setDetail(null);
              }}
            >
              <option value="">{OPS_WEBHOOK_SECRET_LABELS.OPTION_ALL}</option>
              {tenants.map((tenant) => (
                <option key={tenant.tenantId} value={tenant.tenantId}>
                  {tenant.name || tenant.tenantId}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.filterField}>
            <span>{OPS_WEBHOOK_SECRET_LABELS.SELECT_CONFIG}</span>
            <select
              data-testid={OPS_WEBHOOK_SECRET_TEST_IDS.CONFIG_SELECT}
              value={selectedConfigId}
              onChange={(e) => setSelectedConfigId(e.target.value)}
            >
              <option value="">
                {configsForTenant.length === 0
                  ? OPS_WEBHOOK_SECRET_LABELS.EMPTY_CONFIGS
                  : OPS_WEBHOOK_SECRET_LABELS.OPTION_SELECT}
              </option>
              {configsForTenant.map((item) => (
                <option key={item.configId} value={item.configId}>
                  {[item.pgName || item.pgProvider, item.configId.slice(0, 8)]
                    .filter(Boolean)
                    .join(" · ")}
                  {item.hasPendingEdit === true
                    || (item.status === "ACTIVE" && item.approvalStatus === "PENDING")
                    ? ` (${OPS_WEBHOOK_SECRET_LABELS.REAPPROVAL_BADGE})`
                    : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        {detailLoading ? (
          <p className={styles.hint}>{OPS_WEBHOOK_SECRET_LABELS.LOADING}</p>
        ) : null}

        {detail ? (
          <OpsCard className={styles.card}>
            <dl className={styles.meta}>
              <div>
                <dt>{OPS_WEBHOOK_SECRET_LABELS.PROVIDER}</dt>
                <dd>{detail.pgName || detail.pgProvider || "—"}</dd>
              </div>
              <div>
                <dt>{OPS_WEBHOOK_SECRET_LABELS.STATUS}</dt>
                <dd>{detail.status || "—"}</dd>
              </div>
              <div>
                <dt>{OPS_WEBHOOK_SECRET_LABELS.APPROVAL}</dt>
                <dd>
                  {detail.approvalStatus || "—"}
                  {detail.hasPendingEdit === true
                    || (detail.status === "ACTIVE" && detail.approvalStatus === "PENDING")
                    ? ` · ${OPS_WEBHOOK_SECRET_LABELS.REAPPROVAL_BADGE}`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>{OPS_WEBHOOK_SECRET_LABELS.TEST_MODE}</dt>
                <dd>
                  {detail.testMode
                    ? OPS_WEBHOOK_SECRET_LABELS.TEST_MODE_ON
                    : OPS_WEBHOOK_SECRET_LABELS.TEST_MODE_OFF}
                </dd>
              </div>
              <div>
                <dt>{OPS_WEBHOOK_SECRET_LABELS.SECRET_STATUS}</dt>
                <dd>
                  <span
                    className={`${styles.badge} ${configured ? styles.badgeOk : ""}`}
                    data-testid={OPS_WEBHOOK_SECRET_TEST_IDS.CONFIGURED_BADGE}
                  >
                    {configured
                      ? OPS_WEBHOOK_SECRET_LABELS.CONFIGURED
                      : OPS_WEBHOOK_SECRET_LABELS.NOT_CONFIGURED}
                  </span>
                </dd>
              </div>
            </dl>

            <p className={styles.hint}>{OPS_WEBHOOK_SECRET_LABELS.MASKED_HINT}</p>

            <form className={styles.card} onSubmit={onSubmitSecret}>
              <label className={styles.filterField}>
                <span>{OPS_WEBHOOK_SECRET_LABELS.NEW_SECRET}</span>
                <input
                  type="password"
                  autoComplete="off"
                  data-testid={OPS_WEBHOOK_SECRET_TEST_IDS.SECRET_INPUT}
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder={OPS_WEBHOOK_SECRET_LABELS.NEW_SECRET_PLACEHOLDER}
                />
              </label>
              <div className={styles.actions}>
                <MGButton
                  type="submit"
                  variant="primary"
                  disabled={submitting || !secretInput.trim()}
                  aria-label={OPS_WEBHOOK_SECRET_LABELS.SAVE_SECRET}
                >
                  <span data-testid={OPS_WEBHOOK_SECRET_TEST_IDS.SAVE_BUTTON}>
                    {OPS_WEBHOOK_SECRET_LABELS.SAVE_SECRET}
                  </span>
                </MGButton>
                <MGButton
                  type="button"
                  variant="ghost"
                  disabled={submitting}
                  aria-label={OPS_WEBHOOK_SECRET_LABELS.TOGGLE_TEST_MODE}
                  onClick={() => requestTestModeChange(!Boolean(detail.testMode))}
                >
                  <span data-testid={OPS_WEBHOOK_SECRET_TEST_IDS.TEST_MODE_TOGGLE}>
                    {OPS_WEBHOOK_SECRET_LABELS.TOGGLE_TEST_MODE}
                  </span>
                </MGButton>
              </div>
            </form>
          </OpsCard>
        ) : null}
      </section>

      <ConfirmModal
        open={confirmMode === "secret"}
        title={OPS_WEBHOOK_SECRET_LABELS.CONFIRM_SAVE_TITLE}
        message={OPS_WEBHOOK_SECRET_LABELS.CONFIRM_SAVE_HINT}
        confirmLabel={OPS_WEBHOOK_SECRET_LABELS.SAVE_SECRET}
        cancelLabel={OPS_WEBHOOK_SECRET_LABELS.CANCEL}
        loading={submitting}
        onConfirm={handleSaveSecret}
        onCancel={() => setConfirmMode(null)}
      />

      <ConfirmModal
        open={confirmMode === "testMode"}
        title={OPS_WEBHOOK_SECRET_LABELS.CONFIRM_TEST_MODE_TITLE}
        message={
          pendingTestMode === false
            ? OPS_WEBHOOK_SECRET_LABELS.CONFIRM_TEST_MODE_OFF_HINT
            : OPS_WEBHOOK_SECRET_LABELS.CONFIRM_TEST_MODE_ON_HINT
        }
        confirmLabel={OPS_WEBHOOK_SECRET_LABELS.TOGGLE_TEST_MODE}
        cancelLabel={OPS_WEBHOOK_SECRET_LABELS.CANCEL}
        loading={submitting}
        onConfirm={handleToggleTestMode}
        onCancel={() => {
          setConfirmMode(null);
          setPendingTestMode(null);
        }}
      />
    </>
  );
}
