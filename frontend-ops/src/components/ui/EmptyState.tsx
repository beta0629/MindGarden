import type { ReactNode } from 'react';

/**
 * EmptyState — Clinic-OS / common EmptyState twin (title + supporting · CTA optional).
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  testId?: string;
};

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
  titleClassName = '',
  descriptionClassName = '',
  testId
}: EmptyStateProps) {
  const rootClass = ['mg-v2-empty-state', className].filter(Boolean).join(' ');
  const titleClass = ['mg-v2-empty-state__title', titleClassName]
    .filter(Boolean)
    .join(' ');
  const descClass = ['mg-v2-empty-state__desc', descriptionClassName]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} data-testid={testId}>
      {icon ? <div className="mg-v2-empty-state__icon">{icon}</div> : null}
      <h2 className={titleClass}>{title}</h2>
      {description ? <p className={descClass}>{description}</p> : null}
      {action ? <div className="mg-v2-empty-state__action">{action}</div> : null}
    </div>
  );
}
