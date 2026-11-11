import Image from 'next/image';
import { SITE } from '@/lib/site';

type MapLinkCardProps = {
  imageSrc?: string;
  className?: string;
};

export function MapLinkCard({
  imageSrc = '/images/location-lobby-c148-16x9.jpg',
  className = '',
}: MapLinkCardProps) {
  const href = `https://map.naver.com/p/entry/place/${SITE.naverPlaceId}`;

  return (
    <a
      className={`map-link-card ${className}`.trim()}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Image
        src={imageSrc}
        alt=""
        width={960}
        height={540}
        sizes="(max-width: 768px) 100vw, 560px"
      />
      <span className="map-link-card__label">
        네이버 지도에서 길찾기 ↗
      </span>
    </a>
  );
}
