type ConfirmNeededProps = {
  label?: string;
};

export function ConfirmNeeded({ label = '확인 필요' }: ConfirmNeededProps) {
  return <span className="confirm-needed">[{label}]</span>;
}
