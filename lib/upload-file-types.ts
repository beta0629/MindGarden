/**
 * 아이폰 등에서 MIME이 비어 있거나(image/heic, video/quicktime) 표준과 다를 때 파일명으로 보조 판별.
 */

const IMAGE_EXT =
  /\.(heic|heif|jpg|jpeg|png|gif|webp|bmp|svg|avif|tiff?|ico)$/i;

const VIDEO_EXT =
  /\.(mov|qt|mp4|m4v|webm|ogv|ogg|avi|mkv|wmv|3gp)$/i;

/** input accept: 확장자 포함 시 iOS 사진/동영상 선택기에서도 노출되기 쉬움 */
export const IMAGE_FILE_ACCEPT =
  'image/*,.heic,.heif,image/heic,image/heif';
export const VIDEO_FILE_ACCEPT =
  'video/*,.mov,.qt,video/quicktime';

export function isLikelyImageFile(file: Pick<File, 'name' | 'type'>): boolean {
  const t = (file.type || '').toLowerCase();
  if (t.startsWith('image/')) return true;
  if (t === 'image/heic' || t === 'image/heif') return true;
  return IMAGE_EXT.test(file.name || '');
}

export function isLikelyVideoFile(file: Pick<File, 'name' | 'type'>): boolean {
  const t = (file.type || '').toLowerCase();
  if (t.startsWith('video/')) return true;
  if (t === 'video/quicktime') return true;
  return VIDEO_EXT.test(file.name || '');
}
