"use client";

import { usePathname } from "next/navigation";

import OpsQuietHeader from "@/components/shell/OpsQuietHeader";
import {
  OPS_PLACEHOLDER_COPY,
  findOpsNavLeaf,
  resolveOpsNavSelection
} from "@/constants/opsNav";

/**
 * 아직 본문이 없는 레일 항목. 제목은 레일 라벨과 같다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
export default function OpsPlaceholderPage() {
  const pathname = usePathname();
  const selection = resolveOpsNavSelection(pathname);
  const leaf = findOpsNavLeaf(selection.selectedId);
  const title = leaf?.label ?? OPS_PLACEHOLDER_COPY.BADGE;

  return (
    <>
      <OpsQuietHeader title={title} titleId={OPS_PLACEHOLDER_COPY.TITLE_ID} />
      <section
        className="ops-placeholder"
        aria-labelledby={OPS_PLACEHOLDER_COPY.TITLE_ID}
        data-testid="ops-placeholder"
      >
        <p className="ops-placeholder__badge">{OPS_PLACEHOLDER_COPY.BADGE}</p>
        <p className="ops-placeholder__desc">{OPS_PLACEHOLDER_COPY.DESCRIPTION}</p>
      </section>
    </>
  );
}
