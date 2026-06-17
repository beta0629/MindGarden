import { TRINITY_CONSTANTS } from '../constants/trinity';

type CoreSolutionLogoVariant = 'primary' | 'inverse' | 'icon';

const LOGO_SRC: Record<CoreSolutionLogoVariant, string> = {
  primary: TRINITY_CONSTANTS.ASSETS.CORE_SOLUTION_LOGO.PRIMARY,
  inverse: TRINITY_CONSTANTS.ASSETS.CORE_SOLUTION_LOGO.INVERSE,
  icon: TRINITY_CONSTANTS.ASSETS.CORE_SOLUTION_LOGO.ICON,
};

interface CoreSolutionLogoProps {
  variant?: CoreSolutionLogoVariant;
  className?: string;
}

export default function CoreSolutionLogo({
  variant = 'primary',
  className,
}: CoreSolutionLogoProps) {
  return (
    <img
      src={LOGO_SRC[variant]}
      alt={TRINITY_CONSTANTS.ASSETS.CORE_SOLUTION_LOGO.ALT}
      className={className}
    />
  );
}
