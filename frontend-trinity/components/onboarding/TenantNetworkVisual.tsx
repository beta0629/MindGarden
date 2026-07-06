import Image from "next/image";
import { TRINITY_CONSTANTS } from "../../constants/trinity";

interface TenantNetworkVisualProps {
  className?: string;
}

/**
 * 좌측 패널 멀티테넌트 네트워크 일러스트 — mockup tenant-network-visual.svg
 */
export default function TenantNetworkVisual({
  className = "",
}: TenantNetworkVisualProps) {
  return (
    <figure
      className={`trinity-tenant-network ${className}`.trim()}
      aria-label={TRINITY_CONSTANTS.ONBOARDING_V2.PANEL.NETWORK_ARIA}
    >
      <Image
        src={TRINITY_CONSTANTS.ASSETS.TENANT_NETWORK_VISUAL}
        alt=""
        width={480}
        height={480}
        className="trinity-tenant-network__image"
        priority
      />
    </figure>
  );
}
