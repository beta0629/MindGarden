/**
 * 관리자 히어로 비디오: 브라우저에서 1080p H.264로 변환해 업로드 용량·시간을 줄임.
 * ffmpeg.wasm 사용 — 클라이언트에서만 호출할 것.
 */

export type TranscodeProgressCallback = (percent0to100: number) => void;

const EXEC_TIMEOUT_MS = 25 * 60 * 1000;

let cachedFfmpeg: import('@ffmpeg/ffmpeg').FFmpeg | null = null;
let loadFfmpegPromise: Promise<import('@ffmpeg/ffmpeg').FFmpeg> | null = null;

async function getFfmpegInstance(): Promise<import('@ffmpeg/ffmpeg').FFmpeg> {
  if (typeof window === 'undefined') {
    throw new Error('브라우저에서만 사용할 수 있습니다.');
  }
  if (cachedFfmpeg?.loaded) {
    return cachedFfmpeg;
  }
  if (!loadFfmpegPromise) {
    loadFfmpegPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = new FFmpeg();
      await ffmpeg.load();
      cachedFfmpeg = ffmpeg;
      return ffmpeg;
    })().catch((e) => {
      loadFfmpegPromise = null;
      throw e;
    });
  }
  return loadFfmpegPromise;
}

function extensionForVideoFile(file: File): string {
  const n = file.name.toLowerCase();
  if (n.endsWith('.mov')) return 'mov';
  if (n.endsWith('.webm')) return 'webm';
  if (n.endsWith('.mkv')) return 'mkv';
  if (n.endsWith('.avi')) return 'avi';
  return 'mp4';
}

/**
 * 서버 FFmpeg와 동일 계열 설정(1080p 패드, H.264 CRF 23, AAC 128k, 30fps, faststart).
 */
export async function clientTranscodeHeroVideo(
  file: File,
  onProgress?: TranscodeProgressCallback
): Promise<File> {
  const ffmpeg = await getFfmpegInstance();
  const { fetchFile } = await import('@ffmpeg/util');

  const stamp = Date.now();
  const ext = extensionForVideoFile(file);
  const inName = `in_${stamp}.${ext}`;
  const outName = `out_${stamp}.mp4`;

  const onProg = ({ progress }: { progress: number }) => {
    onProgress?.(Math.min(100, Math.max(0, Math.round(progress * 100))));
  };
  ffmpeg.on('progress', onProg);

  try {
    onProgress?.(0);
    await ffmpeg.writeFile(inName, await fetchFile(file));

    const code = await ffmpeg.exec(
      [
        '-i',
        inName,
        '-vf',
        'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
        '-c:v',
        'libx264',
        '-preset',
        'medium',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-r',
        '30',
        '-movflags',
        '+faststart',
        outName,
      ],
      EXEC_TIMEOUT_MS
    );

    if (code !== 0) {
      throw new Error('동영상 변환에 실패했습니다.');
    }

    const out = await ffmpeg.readFile(outName);
    if (!(out instanceof Uint8Array)) {
      throw new Error('변환 결과를 읽지 못했습니다.');
    }

    const base = file.name.replace(/\.[^/.]+$/, '') || 'hero';
    const safeBase = base.replace(/[^a-zA-Z0-9가-힣._-]/g, '_').slice(0, 80);

    const outCopy = new Uint8Array(out.byteLength);
    outCopy.set(out);
    return new File([outCopy], `${safeBase}_1080p.mp4`, { type: 'video/mp4' });
  } finally {
    ffmpeg.off('progress', onProg);
    await ffmpeg.deleteFile(inName).catch(() => {});
    await ffmpeg.deleteFile(outName).catch(() => {});
  }
}
