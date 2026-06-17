import { TRINITY_CONSTANTS } from '../constants/trinity';

type TrinityLogoVariant = 'primary' | 'inverse' | 'icon';

const LOGO_SRC: Record<TrinityLogoVariant, string> = {
  primary: TRINITY_CONSTANTS.ASSETS.LOGO.PRIMARY,
  inverse: TRINITY_CONSTANTS.ASSETS.LOGO.INVERSE,
  icon: TRINITY_CONSTANTS.ASSETS.LOGO.ICON,
};

interface TrinityLogoProps {
  variant?: TrinityLogoVariant;
  className?: string;
}

export default function TrinityLogo({ variant = 'primary', className }: TrinityLogoProps) {
  return (
    <img
      src={LOGO_SRC[variant]}
      alt={TRINITY_CONSTANTS.ASSETS.LOGO.ALT}
      className={className}
    />
  );
}
