import Link from 'next/link';
import { SiteShell } from '@/components/layout/SiteShell';
import { PictureAsset } from '@/components/ui/PictureAsset';

export default function NotFound() {
  return (
    <SiteShell>
      <section className="container page-hero not-found">
        <h1>페이지를 찾을 수 없습니다</h1>
        <p className="muted">
          주소가 바뀌었거나 잘못된 경로일 수 있습니다. 홈에서 다시 찾아 보세요.
        </p>
        <div className="not-found__art">
          <PictureAsset
            baseName="not-found-4x3@2x"
            width={480}
            height={360}
            alt="정원 길 위 빈 자리 일러스트"
            className="not-found__art--desktop"
            priority
          />
          <PictureAsset
            baseName="not-found-1x1@2x"
            width={280}
            height={280}
            alt="정원 길 위 빈 자리 일러스트"
            className="not-found__art--mobile"
            priority
          />
        </div>
        <p>
          <Link className="btn" href="/">
            홈으로 돌아가기
          </Link>
        </p>
      </section>
    </SiteShell>
  );
}
