import Link from 'next/link';
import { screeningData, Topic } from '@/lib/screening-data';

export const metadata = {
  title: '자가진단 | 마인드가든',
  description: '마인드가든 심리상담센터에서 제공하는 다양한 자가진단 테스트입니다.',
};

export default function ScreeningHubPage() {
  const topics = Object.values(screeningData);

  return (
    <main className="content-shell">
      <div className="screening-hub">
        <h1 className="screening-hub-title">자가진단 테스트</h1>
        <p className="screening-hub-desc">
          현재 겪고 있는 어려움을 간단히 점검해 보세요.
          <br />본 테스트는 참고용이며, 정확한 진단은 전문가와의 상담이 필요합니다.
        </p>

        <div className="screening-grid">
          {topics.map((topic) => (
            <Link 
              key={topic.topic} 
              href={`/screening/${topic.topic}`}
              className="screening-card"
            >
              <div className="screening-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h2 className="screening-card-title">{topic.title}</h2>
              <p className="screening-card-desc">{topic.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
