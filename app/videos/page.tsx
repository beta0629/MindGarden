import Image from 'next/image';
import { SiteShell } from '@/components/layout/SiteShell';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { getLatestVideos } from '@/lib/feeds';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/site';

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: '영상',
  description: '마인드가든 심리상담센터 채널의 최근 영상입니다.',
  path: '/videos',
});

export default async function VideosPage() {
  const videos = await getLatestVideos(8);

  return (
    <SiteShell>
      <section className="container page-hero">
        <h1>영상</h1>
        <p>마인드가든 심리상담센터 채널의 최근 영상입니다.</p>
        <a
          className="text-link"
          href={SITE.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          채널에서 더 보기 ↗
        </a>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container media-grid">
          {videos.map((video) => (
            <a
              key={video.id}
              className="news-card"
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${video.title} 재생`}
            >
              <div
                className="news-card__media"
                style={{ aspectRatio: '9 / 16' }}
              >
                <Image
                  src={video.thumb}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  style={{ objectFit: 'cover' }}
                />
                <span className="news-card__play" aria-hidden="true">
                  ▶
                </span>
              </div>
              <strong>
                {video.title}
                <ConfirmNeeded />
              </strong>
            </a>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
