/**
 * 브라우저에서 HEIC/HEIF → JPEG 변환 (크롬 등 Canvas가 HEIC를 못 읽을 때).
 * 이미 JPEG/PNG 등이면 그대로 반환.
 */
export async function heicToJpegIfNeeded(file: File): Promise<File> {
  const nameLower = (file.name || '').toLowerCase();
  const mime = (file.type || '').toLowerCase();
  const isHeic =
    mime === 'image/heic' ||
    mime === 'image/heif' ||
    nameLower.endsWith('.heic') ||
    nameLower.endsWith('.heif');
  if (!isHeic) return file;

  try {
    const heic2any = (await import('heic2any')).default;
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    });
    const blob = Array.isArray(result) ? result[0] : result;
    const baseName = file.name.replace(/\.(heic|heif)$/i, '') || 'image';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch (e) {
    console.error('heic2any:', e);
    throw new Error(
      'HEIC/HEIF 파일을 JPEG로 변환하지 못했습니다. 사진 앱에서 JPG로 내보내거나 다른 이미지로 시도해 주세요.'
    );
  }
}
