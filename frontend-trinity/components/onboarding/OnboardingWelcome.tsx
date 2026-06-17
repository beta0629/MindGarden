"use client";

import { V2Button } from "../ui/V2Button";
import CoreSolutionLogo from "../CoreSolutionLogo";

interface OnboardingWelcomeProps {
  onStart: () => void;
}

export default function OnboardingWelcome({ onStart }: OnboardingWelcomeProps) {
  return (
    <div className="flex flex-col h-full min-h-screen justify-center items-center px-4 py-12 md:py-24 bg-white">
      <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center">
        
        <div className="mb-10 w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm relative">
           <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full"></div>
           <CoreSolutionLogo variant="primary" className="h-10 w-10 relative z-10" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6 leading-tight">
          Core Solution<br/>
          <span className="text-blue-600">서비스 신청하기</span>
        </h1>
        
        <p className="text-lg text-slate-600 mb-12 max-w-md leading-relaxed">
          간단한 비즈니스 정보만 입력하시면 
          <br className="hidden sm:block"/>
          기업의 성장을 위한 모든 준비가 완료됩니다.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mb-12 text-left">
           <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold mb-3 shadow-sm border border-slate-100">1</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">기본 정보</h3>
              <p className="text-xs text-slate-500">이메일 및 회사명</p>
           </div>
           <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold mb-3 shadow-sm border border-slate-100">2</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">플랜 선택</h3>
              <p className="text-xs text-slate-500">맞춤형 서비스</p>
           </div>
           <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold mb-3 shadow-sm border border-slate-100">3</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">완료 및 설정</h3>
              <p className="text-xs text-slate-500">대시보드 접속</p>
           </div>
        </div>

        <V2Button onClick={onStart} size="lg" className="w-full sm:w-auto px-12 py-4 text-lg rounded-xl">
          지금 바로 시작하기 →
        </V2Button>
        
        <p className="mt-8 text-sm text-slate-500 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          입력하신 정보는 안전하게 보호됩니다.
        </p>
      </div>
    </div>
  );
}
