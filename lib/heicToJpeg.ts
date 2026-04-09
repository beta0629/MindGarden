/**
 * 브라우저에서 HEIC/HEIF → JPEG
 *
 * - heic2any는 구버전 libheif라 iOS 18+ / 최신 iPhone 촬영분에서 자주 실패함(이슈 #61, #63).
 * - heic-to는 libheif를 따라가므로 우선 사용하고, 실패 시에만 heic2any 폴백.
 * - createImageBitmap이 HEIC를 직접 읽는 환경이면 WASM 없이 처리.
 */
function isHeicLike(file: File): boolean {
  const nameLower = (file.name || '').toLowerCase();
  const mime = (file.type || '').toLowerCase();
  return (
    mime === 'image/heic' ||
    mime === 'image/heif' ||
    nameLower.endsWith('.heic') ||
    nameLower.endsWith('.heif')
  );
}

async function normalizedHeicBlob(file: File): Promise<Blob> {
  const buf = await file.arrayBuffer();
  const type =
    file.type && file.type !== 'application/octet-stream' ? file.type : 'image/heic';
  return new Blob([buf], { type });
}

async function tryCreateImageBitmapToJpeg(file: File): Promise<File | null> {
  if (typeof window === 'undefined' || typeof createImageBitmap !== 'function') {
    return null;
  }
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    if (!bitmap || bitmap.width < 1 || bitmap.height < 1) {
      return null;
    }
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
    });
    if (!blob) return null;
    const baseName = file.name.replace(/\.(heic|heif)$/i, '') || 'image';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch {
    return null;
  } finally {
    bitmap?.close();
  }
}

async function convertWithHeicTo(blob: Blob, file: File): Promise<File> {
  const { heicTo } = await import('heic-to');
  const out = await heicTo({
    blob,
    type: 'image/jpeg',
    quality: 0.92,
  });
  const baseName = file.name.replace(/\.(heic|heif)$/i, '') || 'image';
  return new File([out], `${baseName}.jpg`, { type: 'image/jpeg' });
}

async function convertWithHeic2any(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default;
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  });
  const blob = Array.isArray(result) ? result[0] : result;
  const baseName = file.name.replace(/\.(heic|heif)$/i, '') || 'image';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}

export async function heicToJpegIfNeeded(file: File): Promise<File> {
  if (!isHeicLike(file)) return file;

  const viaBitmap = await tryCreateImageBitmapToJpeg(file);
  if (viaBitmap) return viaBitmap;

  const blob = await normalizedHeicBlob(file);

  try {
    return await convertWithHeicTo(blob, file);
  } catch (e1) {
    console.warn('heic-to failed, trying heic2any:', e1);
    try {
      return await convertWithHeic2any(file);
    } catch (e2) {
      console.error('heic2any:', e2);
      throw new Error(
        'HEIC/HEIF를 JPEG로 바꾸지 못했습니다. 설정 › 카메라 › 포맷에서 「호환성 우선」으로 두거나, 사진에서 JPG로 내보낸 뒤 다시 선택해 주세요.'
      );
    }
  }
}
