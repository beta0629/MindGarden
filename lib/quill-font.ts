/**
 * Quill 에디터(BlogEditor) 공통 폰트 설정.
 * 툴바·저장 HTML 클래스(.ql-font-*)·app/globals.css와 동기화할 것.
 */
export const QUILL_FONT_WHITELIST = [
  'noto-sans-kr',
  'pretendard',
  'nanum-gothic',
  /* 젊은 층에서 자주 쓰는 무료 폰트 */
  'nanum-square-neo',
  'ibm-plex-sans-kr',
  'suit',
  'jua',
  'do-hyeon',
  /* 명조·신문 바탕 */
  'nanum-myeongjo',
  'noto-serif-kr',
  'kopub-batang',
  'serif',
  'monospace',
] as const;

let registered = false;

/** 클라이언트에서 Quill 로드 직후, 첫 에디터 생성 전에 한 번만 호출 */
export async function registerQuillFontsOnce(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (registered) return;
  const Quill = (await import('quill')).default;
  const Font = Quill.import('formats/font') as { whitelist: string[] };
  Font.whitelist = [...QUILL_FONT_WHITELIST];
  Quill.register(Font, true);
  registered = true;
}
