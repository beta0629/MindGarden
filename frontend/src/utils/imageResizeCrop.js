/**
 * 이미지 리사이즈·크롭 유틸 (Canvas API, data URL 입출력)
 * @author MindGarden
 * @since 2025-02-25
 */

const DEFAULT_JPEG_QUALITY = 0.9;

/**
 * data URL에서 base64 부분의 바이트 크기 계산
 * @param {string} dataUrl - data URL
 * @returns {number} 바이트 수 (대략치)
 */
export function getDataUrlByteSize(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return 0;
  const base64 = dataUrl.includes('base64,') ? dataUrl.split('base64,')[1] : '';
  if (!base64) return 0;
  const padding = (base64.match(/=/g) || []).length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

/**
 * 비율 유지하며 최대 너비/높이 제한, JPEG 품질 적용 후 data URL 반환
 * @param {string} dataUrl - 입력 data URL
 * @param {Object} options - { maxWidth, maxHeight, quality (0~1) }
 * @returns {Promise<string>} 처리된 data URL (image/jpeg)
 */
export function resizeImage(dataUrl, options = {}) {
  const { maxWidth = 1024, maxHeight = 1024, quality = DEFAULT_JPEG_QUALITY } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'));
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width <= maxWidth && height <= maxHeight) {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', quality));
          return;
        }
        const scale = Math.min(maxWidth / width, maxHeight / height);
        const w = Math.round(width * scale);
        const h = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        reject(e);
      }
    };
    img.src = dataUrl;
  });
}

/**
 * 정사각형(가운데 기준) 크롭 후 data URL 반환
 * @param {string} dataUrl - 입력 data URL
 * @param {number} size - 정사각형 한 변 길이(px)
 * @returns {Promise<string>} 크롭된 data URL (image/jpeg)
 */
export function cropImageToSquare(dataUrl, size = 400) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'));
    img.onload = () => {
      try {
        const s = Math.min(img.width, img.height, size);
        const x = (img.width - s) / 2;
        const y = (img.height - s) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, x, y, s, s, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', DEFAULT_JPEG_QUALITY));
      } catch (e) {
        reject(e);
      }
    };
    img.src = dataUrl;
  });
}
