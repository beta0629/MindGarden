import { shouldShowConfirmNeeded } from '@/lib/site';

type ConfirmNeededProps = {
  label?: string;
};

/**
 * Internal review marker only. Renders nothing unless
 * NEXT_PUBLIC_SHOW_CONFIRM_NEEDED=true (visitors never see it).
 */
export function ConfirmNeeded({ label = '확인 필요' }: ConfirmNeededProps) {
  if (!shouldShowConfirmNeeded()) {
    return null;
  }

  return <span className="confirm-needed">[{label}]</span>;
}
