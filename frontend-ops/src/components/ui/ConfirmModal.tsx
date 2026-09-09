"use client";

import { ReactNode } from "react";

import MGButton from "@/components/ui/MGButton";
import { Modal } from "@/components/ui/Modal";

export type ConfirmModalVariant = "warning" | "danger" | "outlineWarn";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  variant?: ConfirmModalVariant;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * 확인/취소 2버튼 모달 (Modal + MGButton 래퍼).
 * window.confirm 대체용. 정지 Confirm은 outlineWarn (solid danger 금지).
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "warning",
  loading = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  const confirmVariant =
    variant === "danger"
      ? "danger"
      : variant === "outlineWarn"
        ? "outlineWarn"
        : "success";

  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className="ops-confirm-modal-body">{message}</div>
      <div className="ops-form-actions">
        <MGButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </MGButton>
        <MGButton
          type="button"
          variant={confirmVariant}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </MGButton>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
