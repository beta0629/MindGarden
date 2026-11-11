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
        <div className="confirm-needed" style={{ marginTop: '0.5rem' }}>
          [확인 필요]
        </div>
      </div>
    </div>
  );
}
