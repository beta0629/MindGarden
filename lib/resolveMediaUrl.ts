/**
 * DB·레거시에 저장된 미디어 URL을 현재 origin에서 로드 가능한 형태로 통일
 * (로컬 dev: 배포 도메인으로 저장된 /uploads/... 를 상대 경로로)
 */
const UPLOAD_PREFIX = '/uploads/';

/** 이 호스트로 저장된 업로드 파일은 pathname만 쓰면 현재 사이트에서 제공 가능 */
const HOSTS_STRIP_TO_PATH = new Set(
  [
    'localhost',
    '127.0.0.1',
    'api.mindgarden.co.kr',
    'www.mindgarden.co.kr',
    'mindgarden.co.kr',
  ].map((h) => h.toLowerCase())
);

function shouldUsePathOnly(host: string, pathname: string): boolean {
  const h = host.toLowerCase();
  if (!pathname.startsWith(UPLOAD_PREFIX)) return false;
  if (HOSTS_STRIP_TO_PATH.has(h)) return true;
  for (const known of HOSTS_STRIP_TO_PATH) {
    if (h.endsWith(`.${known}`)) return true;
  }
  return false;
}

export function resolveMediaUrl(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith('data:') || t.startsWith('blob:')) return t;
  if (t.startsWith('//')) return `https:${t}`;
  if (t.startsWith('/')) return t;
  if (t.startsWith('uploads/')) return `/${t}`;

  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t);
      const path = `${u.pathname}${u.search || ''}`;
      if (shouldUsePathOnly(u.hostname, path)) {
        return path;
      }
    } catch {
      return t;
    }
    return t;
  }

  return `/${t.replace(/^\/+/, '')}`;
}
