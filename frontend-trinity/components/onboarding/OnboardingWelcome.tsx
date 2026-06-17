"use client";

import { V2Button } from "../ui/V2Button";
import CoreSolutionLogo from "../CoreSolutionLogo";
import { TRINITY_CONSTANTS } from "../../constants/trinity";

interface OnboardingWelcomeProps {
  onStart: () => void;
}

export default function OnboardingWelcome({ onStart }: OnboardingWelcomeProps) {
  return (
    <div className="flex flex-col h-full min-h-screen justify-center px-6 py-12 md:px-16 lg:px-24 xl:px-32 bg-white">
      <div className="w-full max-w-2xl mx-auto flex flex-col">
        
        <div className="flex justify-end mb-16">
          <a
            href={`mailto:${TRINITY_CONSTANTS.COMPANY.EMAIL}`}
            className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {TRINITY_CONSTANTS.ONBOARDING_V2.HELP_LABEL}
          </a>
        </div>

        <div className="flex flex-col flex-1 justify-center animate-[fadeIn_0.6s_ease-out]">
          <span className="block text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">
            {TRINITY_CONSTANTS.ONBOARDING_V2.WELCOME_EYEBROW}
          </span>

          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
            환영합니다
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed mb-12">
            {TRINITY_CONSTANTS.BRANDING.CORESOLUTION_NAME} 서비스 신청을 시작합니다. 간단한 정보만 입력하시면 빠르게 서비스를 이용하실 수 있습니다.
          </p>

          <div className="flex flex-col gap-8 mb-16">
            <div className="flex items-start gap-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 shrink-0 shadow-sm border border-blue-100">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">간편한 단계별 입력</h3>
                <p className="text-slate-600 leading-relaxed">복잡한 서류 없이 온라인으로 바로 신청하세요.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 shrink-0 shadow-sm border border-blue-100">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">빠른 신청 처리</h3>
                <p className="text-slate-600 leading-relaxed">신청 후 즉시 테넌트가 생성되어 바로 사용할 수 있습니다.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 shrink-0 shadow-sm border border-blue-100">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">안전한 정보 관리</h3>
                <p className="text-slate-600 leading-relaxed">모든 데이터는 안전하게 암호화되어 보관됩니다.</p>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <V2Button onClick={onStart} size="lg" className="w-full sm:w-auto px-12 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
              시작하기 →
            </V2Button>
            <p className="text-sm text-slate-500 mt-6 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              시작하기를 누르면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
