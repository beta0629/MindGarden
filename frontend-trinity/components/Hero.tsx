"use client";

import Link from "next/link";
import CoreSolutionLogo from "./CoreSolutionLogo";

export default function Hero() {
  return (
    <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden relative border-b border-slate-800 bg-slate-900" aria-label="Hero">
      {/* Background radial gradient meshes to match mockup */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{
        background: `
          radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 100% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 50% 100%, rgba(30, 64, 175, 0.15) 0%, transparent 50%),
          #0f172a
        `
      }}>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1536px] relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          {/* Left Content */}
          <div className="flex flex-col items-start text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-blue-400 text-sm font-semibold tracking-wide backdrop-blur-sm mb-6">
              새로운 Core Solution 2.0 출시
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold text-white tracking-tight leading-[1.1] mb-6 flex flex-col gap-2">
              <span className="block">마음을 돌보는</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">가장 안정적인 공간</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-400 mb-10 leading-relaxed font-normal">
              상담 기록부터 예약 관리까지, 원장님을 위한 완벽한 솔루션
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link 
                href="/onboarding" 
                className="inline-flex justify-center items-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-500 shadow-[0_4px_14px_rgba(37,99,235,0.39)] hover:shadow-lg hover:-translate-y-0.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                무료로 시작하기
              </Link>
              <Link 
                href="#pricing" 
                className="group inline-flex justify-center items-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-transparent border border-slate-700 hover:bg-slate-800 hover:border-blue-600 hover:text-blue-500 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <span>요금제 보기</span>
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          {/* Right Content - Media */}
          <div className="w-full flex justify-center items-center min-w-0">
            <img 
              src="/assets/dashboard-preview.svg" 
              alt="Core Solution 대시보드" 
              className="w-full max-w-full lg:max-w-[720px] h-auto rounded-2xl border border-slate-700/50 shadow-2xl object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
