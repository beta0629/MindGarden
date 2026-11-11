import { isSiteIndexable } from '@/lib/site';

type ConfirmNeededProps = {
  label?: string;
};

/**
 * Staging/draft marker only. Hidden when NEXT_PUBLIC_SITE_INDEXABLE=true.
 */
export function ConfirmNeeded({ label = '확인 필요' }: ConfirmNeededProps) {
  if (isSiteIndexable()) {
    return null;
  }

  return <span className="confirm-needed">[{label}]</span>;
}
