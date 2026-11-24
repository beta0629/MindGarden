type BrandLockupProps = {
  href?: string;
  compact?: boolean;
  onNavigate?: () => void;
};

/**
 * Brand mark + name. Plain &lt;a&gt; (not next/link) so the App Router client
 * chunk is not pulled into first paint on marketing pages.
 */
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
        fetchPriority="low"
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
    <a className="brand" href={href} onClick={onNavigate}>
      {inner}
    </a>
  );
}
