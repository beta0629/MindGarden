'use client';

import { useEffect, useState } from 'react';
import { BOOKING_CTA_LABEL, SITE } from '@/lib/site';

export function StickyBookingBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const bookingEls = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-booking-cta="true"]'));
    const footer = document.querySelector('footer');

    const update = () => {
      const heroOrSectionVisible = bookingEls().some((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      });
      const footerVisible = footer
        ? footer.getBoundingClientRect().top < window.innerHeight
        : false;
      setVisible(!heroOrSectionVisible && !footerVisible);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      className={`sticky-booking ${visible ? 'is-visible' : ''}`}
      aria-hidden={!visible}
    >
      <a
        className="btn btn--block"
        href={SITE.bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={visible ? 0 : -1}
      >
        {BOOKING_CTA_LABEL}
      </a>
    </div>
  );
}
