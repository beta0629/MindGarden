import { BOOKING_CTA_HINT, BOOKING_CTA_LABEL, SITE } from '@/lib/site';

type BookingCtaProps = {
  className?: string;
  showHint?: boolean;
  block?: boolean;
};

export function BookingCta({
  className = '',
  showHint = false,
  block = false,
}: BookingCtaProps) {
  return (
    <div>
      <a
        className={`btn ${block ? 'btn--block' : ''} ${className}`.trim()}
        href={SITE.bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-booking-cta="true"
      >
        {BOOKING_CTA_LABEL}
        <span aria-hidden="true">↗</span>
      </a>
      {showHint ? <p className="hero__hint">{BOOKING_CTA_HINT}</p> : null}
    </div>
  );
}
