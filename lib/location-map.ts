/**
 * 오시는 길 페이지 — 구글 지도 임베드용 단일 위치(아크리아2).
 * 좌표: OpenStreetMap Nominatim으로 건물명 "Acria 2" + 도로명 일치 확인.
 *
 * 선택 환경변수:
 * - NEXT_PUBLIC_GOOGLE_MAPS_EMBED_IFRAME_SRC: 구글 지도 공유 > 지도 퍼가기에서 복사한 iframe src 전체(최우선)
 * - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 있으면 Embed API(Place) 사용
 * - NEXT_PUBLIC_GOOGLE_MAPS_PLACE_ID: 비즈니스 Place ID(있으면 단일 장소로 고정)
 */

export const MINDGARDEN_SONGDO_MAP = {
  /** 해돋이로120번길 23 아크리아2 — 건물 중심 */
  lat: 37.3942628,
  lng: 126.6508326,
  zoom: 18,
} as const;

export function getGoogleMapsEmbedSrc(): string {
  const iframeOverride = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_IFRAME_SRC?.trim();
  if (iframeOverride) {
    return iframeOverride;
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const placeId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_PLACE_ID?.trim();
  const { lat, lng, zoom } = MINDGARDEN_SONGDO_MAP;

  if (key) {
    if (placeId) {
      return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=place_id:${encodeURIComponent(placeId)}&zoom=${zoom}`;
    }
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(`${lat},${lng}`)}&zoom=${zoom}`;
  }

  // API 키 없음: 좌표 한 점만 표시(주소 검색 시 나오는 주변 업체 목록·다중 핀 방지)
  return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&hl=ko&output=embed`;
}

/** 새 탭 구글 지도 — 동일 좌표로 열림 */
export function getGoogleMapsOpenUrl(): string {
  const { lat, lng } = MINDGARDEN_SONGDO_MAP;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
