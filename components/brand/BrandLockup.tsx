import Link from 'next/link';

type BrandLockupProps = {
  href?: string;
  compact?: boolean;
  onNavigate?: () => void;
};

export function BrandLockup({
  href = '/',
  compact = false,
  onNavigate,
}: BrandLockupProps) {
  const inner = (
    <>
      <img
        className="brand__mark"
        src="/brand/logo.svg"
        alt=""
        width={40}
        height={40}
        decoding="async"
      />
      <span className="brand__text">
        <span className="brand__name">마인드가든</span>
        {compact ? null : (
          <span className="brand__sub">심리상담센터</span>
        )}
      </span>
    </>
  );

  return (
    <Link className="brand" href={href} onClick={onNavigate}>
      {inner}
    </Link>
  );
}
