import Image from "next/image";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import "../../styles/components/onboarding-pricing-v2.css";

interface TrustBadgesProps {
  className?: string;
}

/**
 * Step3 하단 인증/보안 마크 — mockup TrustBadges 패턴
 */
export default function TrustBadges({ className = "" }: TrustBadgesProps) {
  const { TRUST_BADGES, LABELS } = TRINITY_CONSTANTS.PRICING;

  return (
    <ul
      className={`trinity-trust-badges ${className}`.trim()}
      aria-label={LABELS.TRUST_BADGES_ARIA}
    >
      {TRUST_BADGES.map((badge) => (
        <li key={badge.key} className="trinity-trust-badges__item">
          <Image
            src={badge.iconSrc}
            alt=""
            width={32}
            height={32}
            className="trinity-trust-badges__icon"
          />
          <span className="trinity-trust-badges__label">{badge.label}</span>
        </li>
      ))}
    </ul>
  );
}
