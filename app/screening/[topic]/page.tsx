import { notFound } from 'next/navigation';
import { screeningData, Topic } from '@/lib/screening-data';
import ScreeningFlow from './ScreeningFlow';

export function generateStaticParams() {
  return Object.keys(screeningData).map((topic) => ({
    topic,
  }));
}

export function generateMetadata({ params }: { params: { topic: string } }) {
  const data = screeningData[params.topic as Topic];
  if (!data) return { title: '간이 체크리스트 | 마인드가든' };
  
  return {
    title: `${data.title} | 마인드가든`,
    description: data.description,
  };
}

export default function ScreeningTopicPage({ params }: { params: { topic: string } }) {
  const data = screeningData[params.topic as Topic];

  if (!data) {
    notFound();
  }

  return (
    <main className="content-shell">
      <div className="screening-flow">
        <ScreeningFlow data={data} />
      </div>
    </main>
  );
}
