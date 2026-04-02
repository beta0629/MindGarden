import { notFound } from 'next/navigation';
import {
  COUNSELING_SLUGS,
  getCounselingPage,
} from '@/lib/counseling-type-pages';
import CounselingTypePageView from '@/components/CounselingTypePageView';

export function generateStaticParams() {
  return COUNSELING_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const data = getCounselingPage(params.slug);
  if (!data) {
    return { title: '페이지를 찾을 수 없습니다' };
  }
  return {
    title: data.metaTitle,
    description: data.metaDescription,
  };
}

export default function CounselingTypePage({
  params,
}: {
  params: { slug: string };
}) {
  const data = getCounselingPage(params.slug);
  if (!data) {
    notFound();
  }
  return <CounselingTypePageView data={data} />;
}
