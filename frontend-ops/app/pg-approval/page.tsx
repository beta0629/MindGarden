"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import MGButton from "@/components/ui/MGButton";
import { Modal } from "@/components/ui/Modal";
import OpsCard from "@/components/ui/OpsCard";
import {
  PG_APPROVAL_LABELS,
  PG_APPROVAL_MIN_REJECTION_REASON_LENGTH
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

type ModalMode = "approve" | "reject" | null;

export default function PgApprovalPage() {
  const [items, setItems] = useState<PgConfigurationPendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [centerIdFilter, setCenterIdFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PgConfigurationPendingItem | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [testBeforeApprove, setTestBeforeApprove] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

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

  const closeModal = () => {
    setModalMode(null);
    setSelected(null);
    setApprovalNote("");
    setRejectionReason("");
    setTestBeforeApprove(true);
  };

  const openApprove = (item: PgConfigurationPendingItem) => {
    setSelected(item);
    setModalMode("approve");
    setApprovalNote("");
    setTestBeforeApprove(true);
  };

  const openReject = (item: PgConfigurationPendingItem) => {
    setSelected(item);
    setModalMode("reject");
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

  const handleApproveSubmit = async (event: FormEvent) => {
    event.preventDefault();
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

  const handleRejectSubmit = async (event: FormEvent) => {
    event.preventDefault();
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

  if (loading && items.length === 0) {
    return (
      <section className="panel">
        <header className="panel__header">
          <h1>{PG_APPROVAL_LABELS.LOADING}</h1>
        </header>
        <div className="loading-message">
          <p>{PG_APPROVAL_LABELS.LOADING}</p>
        </div>
      </section>
    );
  }

  if (error && items.length === 0) {
    return (
      <section className="panel">
        <header className="panel__header">
          <h1>{PG_APPROVAL_LABELS.PAGE_TITLE}</h1>
        </header>
        <div className="error-message">
          <p>{error}</p>
          <MGButton variant="secondary" onClick={loadPending}>
            {PG_APPROVAL_LABELS.REFRESH}
          </MGButton>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <header className="panel__header panel__header--split">
        <div>
          <h1>{PG_APPROVAL_LABELS.PAGE_TITLE}</h1>
          <p>{PG_APPROVAL_LABELS.PAGE_SUBTITLE}</p>
        </div>
        <MGButton variant="secondary" onClick={loadPending} loading={loading}>
          {PG_APPROVAL_LABELS.REFRESH}
        </MGButton>
      </header>

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

      {filteredItems.length === 0 ? (
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
                  <dt>{PG_APPROVAL_LABELS.CENTER_ID}</dt>
                  <dd>{item.tenantId}</dd>
                </div>
                <div>
                  <dt>{PG_APPROVAL_LABELS.PROVIDER}</dt>
                  <dd>{item.pgProvider}</dd>
                </div>
                {item.merchantId ? (
                  <div>
                    <dt>Merchant ID</dt>
                    <dd>{item.merchantId}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="ops-form-actions">
                <MGButton
                  variant="outline"
                  size="small"
                  loading={testingId === item.configId}
                  onClick={() => handleTestConnection(item)}
                >
                  {PG_APPROVAL_LABELS.TEST_CONNECTION}
                </MGButton>
                <MGButton
                  variant="success"
                  size="small"
                  onClick={() => openApprove(item)}
                >
                  {PG_APPROVAL_LABELS.APPROVE}
                </MGButton>
                <MGButton
                  variant="danger"
                  size="small"
                  onClick={() => openReject(item)}
                >
                  {PG_APPROVAL_LABELS.REJECT}
                </MGButton>
              </div>
            </OpsCard>
          ))}
        </div>
      )}

      <Modal
        open={modalMode === "approve" && !!selected}
        title={PG_APPROVAL_LABELS.APPROVE_TITLE}
        onClose={closeModal}
      >
        {selected ? (
          <form className={styles.modalForm} onSubmit={handleApproveSubmit}>
            <p>
              <strong>{selected.pgName || selected.pgProvider}</strong>
              {" · "}
              {PG_APPROVAL_LABELS.CENTER_ID}: {selected.tenantId}
            </p>
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
              <MGButton type="submit" variant="success" loading={submitting}>
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
            <p>
              <strong>{selected.pgName || selected.pgProvider}</strong>
              {" · "}
              {PG_APPROVAL_LABELS.CENTER_ID}: {selected.tenantId}
            </p>
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
              <MGButton type="submit" variant="danger" loading={submitting}>
                {PG_APPROVAL_LABELS.SUBMIT_REJECT}
              </MGButton>
            </div>
          </form>
        ) : null}
      </Modal>
    </section>
  );
}
