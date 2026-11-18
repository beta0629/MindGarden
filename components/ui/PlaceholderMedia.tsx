import { ConfirmNeeded } from './ConfirmNeeded';

type PlaceholderMediaProps = {
  label: string;
  aspectRatio?: string;
  className?: string;
};

export function PlaceholderMedia({
  label,
  aspectRatio = '3 / 4',
  className = '',
}: PlaceholderMediaProps) {
  return (
    <div
      className={`placeholder-media ${className}`.trim()}
      style={{ aspectRatio }}
      role="img"
      aria-label={label}
    >
      <div>
        <div className="placeholder-media__label">{label}</div>
        <ConfirmNeeded />
      </div>
    </div>
  );
}
