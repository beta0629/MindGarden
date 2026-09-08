"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import ConfirmModal from "@/components/ui/ConfirmModal";
import MGButton from "@/components/ui/MGButton";
import { Modal } from "@/components/ui/Modal";
import OpsCard from "@/components/ui/OpsCard";
import OpsQuietHeader from "@/components/shell/OpsQuietHeader";
import {
  PG_APPROVAL_LABELS,
  PG_APPROVAL_MIN_REJECTION_REASON_LENGTH,
  maskMerchantId,
  resolveCenterDisplayName,
  resolvePgDisplayName
} from "@/constants/pgApproval";
import {
  approvePgConfiguration,
  fetchPendingPgApprovals,
  rejectPgConfiguration,
  resolveOpsActorId,
  testPgConnection
} from "@/services/pgApprovalService";
import type { PgConfigurationPendingItem } from "@/types/pgApproval";
import notificationManager from "@/utils/notification";

import styles from "./pg-approval.module.css";

type ModalMode = "approve" | "reject" | "detail" | null;
type ConfirmMode = "approve" | "reject" | null;

function ApprovalConfirmSummary({
  item,
  mode
}: {
  item: PgConfigurationPendingItem;
  mode: ConfirmMode;
}) {
  return (
    <div className={styles.confirmSummary} data-testid="pg-approval-confirm-summary">
      <dl className={styles.confirmSummaryList}>
        <div className={styles.confirmSummaryRow}>
          <dt>{PG_APPROVAL_LABELS.CENTER}</dt>
          <dd>{resolveCenterDisplayName(item)}</dd>
        </div>
        <div className={styles.confirmSummaryRow}>
          <dt>{PG_APPROVAL_LABELS.PG}</dt>
          <dd>{resolvePgDisplayName(item)}</dd>
        </div>
        <div className={styles.confirmSummaryRow}>
          <dt>{PG_APPROVAL_LABELS.MERCHANT}</dt>
          <dd>{maskMerchantId(item.merchantId)}</dd>
        </div>
        {mode === "approve" ? (
          <div className={styles.confirmSummaryRow}>
            <dt>{PG_APPROVAL_LABELS.RESULT}</dt>
            <dd>{PG_APPROVAL_LABELS.RESULT_ACTIVE}</dd>
          </div>
        ) : null}
      </dl>
      <p className={styles.confirmHint}>
        {mode === "reject"
          ? PG_APPROVAL_LABELS.CONFIRM_REJECT_HINT
          : PG_APPROVAL_LABELS.CONFIRM_APPROVE_HINT}
      </p>
    </div>
  );
}

export default function PgApprovalPage() {
  const searchParams = useSearchParams();
  const initialCenterId = searchParams.get("centerId")?.trim() || "";
  const [items, setItems] = useState<PgConfigurationPendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [centerIdFilter, setCenterIdFilter] = useState(initialCenterId);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PgConfigurationPendingItem | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [testBeforeApprove, setTestBeforeApprove] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get("centerId")?.trim() || "";
    setCenterIdFilter(fromQuery);
  }, [searchParams]);

  const loadPending = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPendingPgApprovals({
        tenantId: centerIdFilter.trim() || undefined
      });
      setItems(data);
    } catch (err) {
      console.error("[PgApprovalPage] load failed:", err);
      setError(
        err instanceof Error ? err.message : PG_APPROVAL_LABELS.ERROR_LOAD
      );
    } finally {
      setLoading(false);
    }
  }, [centerIdFilter]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) {
      return items;
    }
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      return (
        item.pgName?.toLowerCase().includes(q) ||
        item.pgProvider?.toLowerCase().includes(q) ||
        item.tenantId?.toLowerCase().includes(q) ||
        item.configId?.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const closeConfirm = useCallback(() => {
    setConfirmMode(null);
  }, []);

  const closeModal = () => {
    setConfirmMode(null);
    setModalMode(null);
    setSelected(null);
    setApprovalNote("");
    setRejectionReason("");
    setTestBeforeApprove(true);
  };

  const openDetail = (item: PgConfigurationPendingItem) => {
    setSelected(item);
    setModalMode("detail");
    setConfirmMode(null);
  };

  const openApprove = (item: PgConfigurationPendingItem) => {
    setSelected(item);
    setModalMode("approve");
    setConfirmMode(null);
    setApprovalNote("");
    setTestBeforeApprove(true);
  };

  const openReject = (item: PgConfigurationPendingItem) => {
    setSelected(item);
    setModalMode("reject");
    setConfirmMode(null);
    setRejectionReason("");
  };

  const handleTestConnection = async (item: PgConfigurationPendingItem) => {
    try {
      setTestingId(item.configId);
      const result = await testPgConnection(item.configId);
      if (result.success) {
        notificationManager.success(
          result.message || PG_APPROVAL_LABELS.TEST_SUCCESS
        );
      } else {
        notificationManager.error(
          result.message || PG_APPROVAL_LABELS.TEST_FAILED
        );
      }
    } catch (err) {
      console.error("[PgApprovalPage] test-connection failed:", err);
      notificationManager.error(
        err instanceof Error ? err.message : PG_APPROVAL_LABELS.TEST_FAILED
      );
    } finally {
      setTestingId(null);
    }
  };

  const runApprove = async () => {
    if (!selected) {
      return;
    }
    try {
      setSubmitting(true);
      await approvePgConfiguration(selected.configId, {
        approvedBy: resolveOpsActorId(),
        approvalNote: approvalNote.trim() || undefined,
        testConnection: testBeforeApprove
      });
      notificationManager.success(PG_APPROVAL_LABELS.APPROVE_SUCCESS);
      closeModal();
      await loadPending();
    } catch (err) {
      console.error("[PgApprovalPage] approve failed:", err);
      notificationManager.error(
        err instanceof Error ? err.message : "승인에 실패했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const runReject = async () => {
    if (!selected) {
      return;
    }
    const reason = rejectionReason.trim();
    if (reason.length < PG_APPROVAL_MIN_REJECTION_REASON_LENGTH) {
      notificationManager.error(PG_APPROVAL_LABELS.REJECTION_REASON_REQUIRED);
      return;
    }
    try {
      setSubmitting(true);
      await rejectPgConfiguration(selected.configId, {
        rejectedBy: resolveOpsActorId(),
        rejectionReason: reason
      });
      notificationManager.success(PG_APPROVAL_LABELS.REJECT_SUCCESS);
      closeModal();
      await loadPending();
    } catch (err) {
      console.error("[PgApprovalPage] reject failed:", err);
      notificationManager.error(
        err instanceof Error ? err.message : "거부에 실패했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) {
      return;
    }
    setConfirmMode("approve");
  };

  const handleRejectSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) {
      return;
    }
    const reason = rejectionReason.trim();
    if (reason.length < PG_APPROVAL_MIN_REJECTION_REASON_LENGTH) {
      notificationManager.error(PG_APPROVAL_LABELS.REJECTION_REASON_REQUIRED);
      return;
    }
    setConfirmMode("reject");
  };

  const handleConfirmAction = async () => {
    if (!confirmMode) {
      return;
    }
    switch (confirmMode) {
      case "approve":
        await runApprove();
        break;
      case "reject":
        await runReject();
        break;
      default: {
        const _exhaustive: never = confirmMode;
        return _exhaustive;
      }
    }
  };

  const confirmTitle =
    confirmMode === "reject"
      ? PG_APPROVAL_LABELS.CONFIRM_REJECT_TITLE
      : PG_APPROVAL_LABELS.CONFIRM_APPROVE_TITLE;
  const confirmLabel =
    confirmMode === "reject"
      ? PG_APPROVAL_LABELS.CONFIRM_REJECT
      : PG_APPROVAL_LABELS.CONFIRM_APPROVE;
  const confirmVariant = confirmMode === "reject" ? "danger" : "warning";

  return (
    <>
      <OpsQuietHeader
        title={PG_APPROVAL_LABELS.PAGE_TITLE}
        titleId="ops-pg-approval-title"
        onRefresh={loadPending}
        refreshLabel={PG_APPROVAL_LABELS.REFRESH}
        refreshing={loading}
      />

      <section
        className={`ops-approval__stage ${styles.stage}`}
        aria-labelledby="ops-pg-approval-title"
        aria-busy={loading}
      >
      {error ? (
        <div className="error-message">
          <p>{error}</p>
          <MGButton variant="ghost" onClick={loadPending}>
            {PG_APPROVAL_LABELS.REFRESH}
          </MGButton>
        </div>
      ) : null}

      <div className={styles.filters}>
        <label className={styles.filterField}>
          <span>{PG_APPROVAL_LABELS.CENTER_ID_FILTER}</span>
          <input
            type="text"
            value={centerIdFilter}
            onChange={(e) => setCenterIdFilter(e.target.value)}
            placeholder={PG_APPROVAL_LABELS.CENTER_ID}
            aria-label={PG_APPROVAL_LABELS.CENTER_ID_FILTER}
          />
        </label>
        <label className={styles.filterField}>
          <span>검색</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={PG_APPROVAL_LABELS.SEARCH_PLACEHOLDER}
            aria-label={PG_APPROVAL_LABELS.SEARCH_PLACEHOLDER}
          />
        </label>
      </div>

      {loading && items.length === 0 ? (
        <div className="loading-message">
          <p>{PG_APPROVAL_LABELS.LOADING}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="ops-empty-message">
          <p>{PG_APPROVAL_LABELS.EMPTY}</p>
        </div>
      ) : (
        <div className="ops-card-list">
          {filteredItems.map((item) => (
            <OpsCard key={item.configId} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>{item.pgName || item.pgProvider}</h3>
                <span className={styles.badge}>
                  {item.approvalStatus || item.status || "PENDING"}
                </span>
              </div>
              <dl className={styles.meta}>
                <div>
                  <dt>{PG_APPROVAL_LABELS.CENTER}</dt>
                  <dd>{resolveCenterDisplayName(item)}</dd>
                </div>
                <div>
                  <dt>{PG_APPROVAL_LABELS.PROVIDER}</dt>
                  <dd>{item.pgProvider}</dd>
                </div>
                {item.merchantId ? (
                  <div>
                    <dt>{PG_APPROVAL_LABELS.MERCHANT}</dt>
                    <dd>{maskMerchantId(item.merchantId)}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="ops-form-actions">
                <MGButton
                  variant="ghost"
                  size="small"
                  onClick={() => openDetail(item)}
                >
                  {PG_APPROVAL_LABELS.DETAIL}
                </MGButton>
                <MGButton
                  variant="ghost"
                  size="small"
                  loading={testingId === item.configId}
                  onClick={() => handleTestConnection(item)}
                >
                  {PG_APPROVAL_LABELS.TEST_CONNECTION}
                </MGButton>
                <MGButton
                  variant="primary"
                  size="small"
                  onClick={() => openApprove(item)}
                >
                  {PG_APPROVAL_LABELS.APPROVE}
                </MGButton>
                <MGButton
                  variant="outlineWarn"
                  size="small"
                  className="pg-approval-cta--reject-review"
                  onClick={() => openReject(item)}
                >
                  {PG_APPROVAL_LABELS.REVIEW_REJECT}
                </MGButton>
              </div>
            </OpsCard>
          ))}
        </div>
      )}

      <Modal
        open={modalMode === "detail" && !!selected}
        title={PG_APPROVAL_LABELS.DETAIL_TITLE}
        onClose={closeModal}
      >
        {selected ? (
          <div className={styles.modalForm}>
            <dl className={styles.confirmSummaryList}>
              <div className={styles.confirmSummaryRow}>
                <dt>{PG_APPROVAL_LABELS.CENTER}</dt>
                <dd>{resolveCenterDisplayName(selected)}</dd>
              </div>
              <div className={styles.confirmSummaryRow}>
                <dt>{PG_APPROVAL_LABELS.PROVIDER}</dt>
                <dd>{selected.pgProvider}</dd>
              </div>
              <div className={styles.confirmSummaryRow}>
                <dt>{PG_APPROVAL_LABELS.PG_NAME}</dt>
                <dd>{selected.pgName || PG_APPROVAL_LABELS.MERCHANT_EMPTY}</dd>
              </div>
              <div className={styles.confirmSummaryRow}>
                <dt>{PG_APPROVAL_LABELS.MERCHANT}</dt>
                <dd>{maskMerchantId(selected.merchantId)}</dd>
              </div>
              <div className={styles.confirmSummaryRow}>
                <dt>{PG_APPROVAL_LABELS.STATUS}</dt>
                <dd>{selected.approvalStatus || selected.status || "PENDING"}</dd>
              </div>
            </dl>
            <div className="ops-form-actions">
              <MGButton type="button" variant="secondary" onClick={closeModal}>
                {PG_APPROVAL_LABELS.CLOSE}
              </MGButton>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={modalMode === "approve" && !!selected}
        title={PG_APPROVAL_LABELS.APPROVE_TITLE}
        onClose={closeModal}
      >
        {selected ? (
          <form className={styles.modalForm} onSubmit={handleApproveSubmit}>
            <div className={styles.confirmSummary}>
              <dl className={styles.confirmSummaryList}>
                <div className={styles.confirmSummaryRow}>
                  <dt>{PG_APPROVAL_LABELS.CENTER}</dt>
                  <dd>{resolveCenterDisplayName(selected)}</dd>
                </div>
                <div className={styles.confirmSummaryRow}>
                  <dt>{PG_APPROVAL_LABELS.PG}</dt>
                  <dd>{resolvePgDisplayName(selected)}</dd>
                </div>
                <div className={styles.confirmSummaryRow}>
                  <dt>{PG_APPROVAL_LABELS.MERCHANT}</dt>
                  <dd>{maskMerchantId(selected.merchantId)}</dd>
                </div>
                <div className={styles.confirmSummaryRow}>
                  <dt>{PG_APPROVAL_LABELS.RESULT}</dt>
                  <dd>{PG_APPROVAL_LABELS.RESULT_ACTIVE}</dd>
                </div>
              </dl>
            </div>
            <label className={styles.switchRow}>
              <input
                type="checkbox"
                checked={testBeforeApprove}
                onChange={(e) => setTestBeforeApprove(e.target.checked)}
              />
              <span>{PG_APPROVAL_LABELS.TEST_BEFORE_APPROVE}</span>
            </label>
            <label className={styles.filterField}>
              <span>{PG_APPROVAL_LABELS.APPROVAL_NOTE}</span>
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                rows={3}
              />
            </label>
            <div className="ops-form-actions">
              <MGButton type="button" variant="secondary" onClick={closeModal}>
                {PG_APPROVAL_LABELS.CANCEL}
              </MGButton>
              <MGButton type="submit" variant="primary" loading={submitting}>
                {PG_APPROVAL_LABELS.SUBMIT_APPROVE}
              </MGButton>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={modalMode === "reject" && !!selected}
        title={PG_APPROVAL_LABELS.REJECT_TITLE}
        onClose={closeModal}
      >
        {selected ? (
          <form className={styles.modalForm} onSubmit={handleRejectSubmit}>
            <div className={styles.confirmSummary}>
              <dl className={styles.confirmSummaryList}>
                <div className={styles.confirmSummaryRow}>
                  <dt>{PG_APPROVAL_LABELS.CENTER}</dt>
                  <dd>{resolveCenterDisplayName(selected)}</dd>
                </div>
                <div className={styles.confirmSummaryRow}>
                  <dt>{PG_APPROVAL_LABELS.PG}</dt>
                  <dd>{resolvePgDisplayName(selected)}</dd>
                </div>
                <div className={styles.confirmSummaryRow}>
                  <dt>{PG_APPROVAL_LABELS.MERCHANT}</dt>
                  <dd>{maskMerchantId(selected.merchantId)}</dd>
                </div>
              </dl>
            </div>
            <p className={styles.hint}>{PG_APPROVAL_LABELS.REJECTION_HINT}</p>
            <label className={styles.filterField}>
              <span>
                {PG_APPROVAL_LABELS.REJECTION_REASON}{" "}
                <span className={styles.required}>*</span>
              </span>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
                minLength={PG_APPROVAL_MIN_REJECTION_REASON_LENGTH}
              />
            </label>
            <div className="ops-form-actions">
              <MGButton type="button" variant="secondary" onClick={closeModal}>
                {PG_APPROVAL_LABELS.CANCEL}
              </MGButton>
              <MGButton
                type="submit"
                variant="outlineWarn"
                className="pg-approval-cta--reject-review"
                loading={submitting}
              >
                {PG_APPROVAL_LABELS.SUBMIT_REJECT}
              </MGButton>
            </div>
          </form>
        ) : null}
      </Modal>

      <ConfirmModal
        open={!!confirmMode && !!selected}
        title={confirmTitle}
        message={
          selected ? (
            <ApprovalConfirmSummary item={selected} mode={confirmMode} />
          ) : null
        }
        confirmLabel={confirmLabel}
        cancelLabel={PG_APPROVAL_LABELS.CANCEL}
        variant={confirmVariant}
        loading={submitting}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirm}
      />
      </section>
    </>
  );
}
