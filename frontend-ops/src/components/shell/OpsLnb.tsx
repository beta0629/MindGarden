"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  OPS_NAV_COPY,
  OPS_NAV_TREE,
  resolveOpsNavSelection,
  type OpsNavId
} from "@/constants/opsNav";

/**
 * Ops 왼쪽 레일. 현재 화면의 그룹만 펼치고, 2단 항목 하나만 선택한다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */

type OpsLnbProps = {
  embedded?: boolean;
  idPrefix?: string;
  onNavigate?: () => void;
};

function rowClass(active: boolean, sub: boolean): string {
  const names = ["mg-v2-desktop-lnb__row"];
  if (sub) {
    names.push("mg-v2-desktop-lnb__row--sub");
  }
  if (active) {
    names.push("mg-v2-desktop-lnb__row--active");
  }
  return names.join(" ");
}

export default function OpsLnb({
  embedded = false,
  idPrefix = "rail",
  onNavigate
}: OpsLnbProps) {
  const pathname = usePathname();
  const selection = resolveOpsNavSelection(pathname);
  const [openGroupIds, setOpenGroupIds] = useState<OpsNavId[]>(
    selection.expandedGroupId ? [selection.expandedGroupId] : []
  );

  useEffect(() => {
    setOpenGroupIds(selection.expandedGroupId ? [selection.expandedGroupId] : []);
  }, [pathname, selection.expandedGroupId]);

  const toggleGroup = (groupId: OpsNavId) => {
    setOpenGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId]
    );
  };

  const asideClass = embedded
    ? "mg-v2-desktop-lnb mg-v2-desktop-lnb--embedded"
    : "mg-v2-desktop-lnb";

  return (
    <aside className={asideClass} aria-label={OPS_NAV_COPY.ARIA_LABEL}>
      <nav className="mg-v2-desktop-lnb__nav">
        <ul className="mg-v2-desktop-lnb__list">
          {OPS_NAV_TREE.map((entry) => {
            if (entry.kind === "link") {
              const active = selection.selectedId === entry.item.id;
              return (
                <li key={entry.item.id} className="mg-v2-desktop-lnb__item">
                  <Link
                    href={entry.item.href}
                    className={rowClass(active, false)}
                    aria-current={active ? "page" : undefined}
                    data-testid={`${idPrefix}-nav-${entry.item.id}`}
                    onClick={onNavigate}
                  >
                    {entry.item.label}
                  </Link>
                </li>
              );
            }

            const group = entry.group;
            const open = openGroupIds.includes(group.id);
            const current = selection.expandedGroupId === group.id;
            const subId = `${idPrefix}-sub-${group.id}`;
            const groupClass = [
              "mg-v2-desktop-lnb__row",
              "mg-v2-desktop-lnb__group",
              current ? "mg-v2-desktop-lnb__group--current" : ""
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <li key={group.id} className="mg-v2-desktop-lnb__item">
                <button
                  type="button"
                  className={groupClass}
                  aria-expanded={open}
                  aria-controls={subId}
                  data-testid={`${idPrefix}-nav-${group.id}`}
                  onClick={() => toggleGroup(group.id)}
                >
                  <span>{group.label}</span>
                  <span
                    className={
                      open
                        ? "mg-v2-desktop-lnb__chevron mg-v2-desktop-lnb__chevron--open"
                        : "mg-v2-desktop-lnb__chevron"
                    }
                    aria-hidden="true"
                  />
                </button>
                <ul
                  id={subId}
                  className="mg-v2-desktop-lnb__sub"
                  hidden={!open}
                >
                  {group.children.map((child) => {
                    const active = selection.selectedId === child.id;
                    return (
                      <li key={child.id} className="mg-v2-desktop-lnb__item">
                        <Link
                          href={child.href}
                          className={rowClass(active, true)}
                          aria-current={active ? "page" : undefined}
                          data-testid={`${idPrefix}-nav-${child.id}`}
                          onClick={onNavigate}
                        >
                          {child.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
