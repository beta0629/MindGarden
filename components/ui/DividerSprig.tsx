import { PictureAsset } from '@/components/ui/PictureAsset';

/** Cream-background section separator (240×32 CSS). */
export function DividerSprig() {
  return (
    <div className="divider-sprig" aria-hidden="true">
      <PictureAsset
        baseName="divider-sprig@2x"
        svgSrc="/illustrations/divider-sprig.svg"
        width={240}
        height={32}
        alt=""
      />
    </div>
  );
}
