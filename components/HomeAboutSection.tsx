import Link from 'next/link';
import HomeSectionVisual from '@/components/HomeSectionVisual';
import { homeSectionImages } from '@/lib/home-section-images';

export default function HomeAboutSection() {
  return (
    <section id="about" className="content-section">
      <div className="section-intro-row">
        <div className="section-intro-copy">
          <h2 className="section-title">마인드 가든 소개</h2>
          <div className="section-desc about-intro-prose">
            <p>
              안녕하세요, 더 깊은 치유와 성장을 위해 인천 송도로 확장 이전한 마인드가든 심리상담센터입니다.
              본 센터는 15년 이상의 풍부한 임상 내공과 전직 심리연구소 소장 출신 대표원장의 체계적인 시스템을
              바탕으로, 내담자의 삶에 실질적인 변화를 이끌어냅니다.
            </p>
            <p>
              마인드가든은 유료 광고 없이 오직 <strong>상담의 질</strong>로만 인정받아 왔습니다. 현직
              상담사들이 직접 상담을 받고, 경험하신 분들이 소중한 가족을 자신 있게 소개하는{' '}
              <strong>전문가가 찾는 전문가</strong>의 실력을 확인해 보세요.
            </p>
          </div>
        </div>
        <HomeSectionVisual
          src={homeSectionImages.about.src}
          alt={homeSectionImages.about.alt}
          priority
        />
      </div>

      <div className="counseling-type-stack about-detail-stack">
        <article className="counseling-type-card">
          <h3 className="counseling-type-card-title">
            🌿 1. ADHD 및 복합 동반질환 전문·특화 시스템
          </h3>
          <div className="counseling-type-card-body">
            <p>
              단순 상담을 넘어, 까다롭고 복합적인 심리 기제와 일상 문제에 대한 명확한 개입을 약속합니다.
            </p>
            <p>
              <strong>전문 대상:</strong> 아동·청소년 ADHD/ADD, 성인 ADHD 전문 케어
            </p>
            <p>
              <strong>아동·청소년 문제 개입 및 중재:</strong> 등교 거부, 학교 폭력 피해·가해, 따돌림, 도벽,
              습관적 거짓말 등 학교 및 일상 부적응 문제 해결
            </p>
            <p>
              <strong>집중 케어 동반질환:</strong> 중독(게임, 알코올), 틱(Tic)·투렛, HSP(민감한 사람),
              아스퍼거, PTSD(트라우마), 공황장애, 불안·강박, 우울 및 양극성 장애, 경계선 성격, 애착 문제,
              조현병 등
            </p>
            <p>
              <strong>위기 관리:</strong> 자해 및 자살 위기 긴급 개입 전문
            </p>
          </div>
        </article>

        <article className="counseling-type-card">
          <h3 className="counseling-type-card-title">
            🌿 2. 커플·부부·가족 및 양육 코칭 특화 시스템
          </h3>
          <div className="counseling-type-card-body">
            <p>가족상담 박사 과정의 전문성으로 관계의 본질적인 회복을 돕습니다.</p>
            <p>
              <strong>커플·부부·가족 상담:</strong> 애착 문제 및 갈등 해결, 이혼 위기 및 재결합 가정 적응
              상담
            </p>
            <p>
              <strong>부모-자녀 관계 케어:</strong> 부모-자녀 간 극심한 갈등 해소 및 정서적 유대 강화
            </p>
            <p>
              <strong>양육 및 훈육 코칭:</strong> 감정 코칭 및 효과적인 대화법 전수를 통해 가정 내 올바른
              훈육 체계를 세우는 맞춤형 솔루션
            </p>
          </div>
        </article>

        <article className="counseling-type-card">
          <h3 className="counseling-type-card-title">🌿 3. 대표원장의 15년 임상 권위와 전문성</h3>
          <div className="counseling-type-card-body">
            <p>
              <strong>학술:</strong> 교육학 학사 / 상담학 석사 / 가족상담(박사일부수료)
            </p>
            <p>
              <strong>전문 경력:</strong> 전) 심리연구소 소장(5년), 유명 프랜차이즈 수석 상담사 역임,
              해양경찰 및 소방공무원 전문상담사, 한국이민재단 전문강사 등
            </p>
          </div>
        </article>

        <article className="counseling-type-card">
          <h3 className="counseling-type-card-title">🛡️ 4. 마인드가든의 프라이버시 및 상담 철학</h3>
          <div className="counseling-type-card-body">
            <p>
              마인드가든은 내담자의 <strong>완전한 익명성</strong>과 <strong>상담 기록의 안전</strong>을
              최우선 가치로 둡니다.
            </p>
            <p>
              <strong>100% 개인 유료 상담제:</strong> 상담의 질을 유지하고 내담자의 민감한 정보가 외부
              기관에 공유되는 것을 방지하기 위해, 바우처나 국가 지원 상담 사업을 일절 진행하지 않습니다.
            </p>
            <p>
              <strong>철저한 비밀 유지:</strong> 상담 내용은 법이 정한 예외 상황(자타해 위험 등)을 제외하고는
              그 어떤 형식으로도 외부(기관, 학교, 직장 등)에 유출되거나 기록이 남지 않습니다.
            </p>
            <p>
              <strong>독립적 운영:</strong> 외부 기관의 개입 없이 오직 상담자와 내담자 사이의 신뢰를
              바탕으로 최적의 솔루션에만 집중합니다.
            </p>
          </div>
        </article>
      </div>

      <div className="counseling-type-cta about-visit-cta">
        <h3 className="counseling-type-cta-title">🏡 이용 및 방문 안내 (100% 사전 예약제)</h3>
        <p>
          <strong>위치:</strong> 인천 연수구 해돋이로 120번길 23 아크리아2 2층 (204호)
        </p>
        <p>
          <strong>상담 문의:</strong>{' '}
          <a href="tel:0327248501">032-724-8501</a> / <a href="tel:01079238501">010-7923-8501</a>
        </p>
        <p>
          <strong>운영 시간:</strong> 평일 11:00 - 20:00 / 토 10:00 - 17:00 (시간 외 예약 협의 가능)
        </p>
        <p>
          <strong>주차:</strong> 아크리아 2 지하 1, 2층 (만차 시 연결된 아크리아 1 주차장 이용 가능)
        </p>
        <div className="counseling-type-links about-about-links">
          <Link href="/about/mindgarden">센터 상세 소개</Link>
          <Link href="/counselors">상담사 프로필</Link>
        </div>
      </div>
    </section>
  );
}
