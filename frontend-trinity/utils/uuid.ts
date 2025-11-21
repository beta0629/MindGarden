/**
 * UUID 생성 유틸리티
 * 
 * @author CoreSolution
 * @version 1.0.0
 */

/**
 * UUID v4 생성
 * @returns {string} UUID 문자열
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

