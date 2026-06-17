"use client";

import Link from "next/link";
import { V2Button } from "./ui/V2Button";
import CoreSolutionLogo from "./CoreSolutionLogo";

export default function Hero() {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-slate-900 overflow-hidden relative border-b border-slate-800">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-blue-600/20 blur-[120px] opacity-70"></div>
        <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-indigo-600/20 blur-[100px] opacity-60"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-5xl">
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-blue-400 text-sm font-medium backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 shadow-blue-500/50 shadow-lg"></span>
            새로운 Core Solution 2.0 출시
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight mb-6">
          기업 성장의 <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">새로운 표준을 제시합니다</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          대기업 수준의 ERP 시스템을 저렴한 비용으로. 복잡한 시스템 구축 없이 즉시 도입 가능한 클라우드 기반 통합 솔루션입니다.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/onboarding" className="inline-flex justify-center items-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/40 hover:shadow-lg hover:shadow-blue-600/50 transition-all w-full sm:w-auto">
            무료로 시작하기
          </Link>
          <Link href="#services" className="inline-flex justify-center items-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all w-full sm:w-auto">
            서비스 알아보기
          </Link>
        </div>

        {/* Dashboard Preview mockup wrapper */}
        <div className="relative mx-auto w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-700/50 bg-slate-900 overflow-hidden transform translate-y-4 hover:-translate-y-2 transition-transform duration-500">
          <div className="h-12 bg-slate-800 border-b border-slate-700/50 flex items-center px-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
            </div>
          </div>
          <div className="bg-slate-900 w-full aspect-[16/10] flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 flex">
                {/* Sidebar */}
                <div className="w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col hidden md:flex">
                  <div className="mb-8 opacity-90"><CoreSolutionLogo variant="inverse" /></div>
                  <div className="space-y-4">
                    <div className="h-10 bg-blue-600/10 border border-blue-500/20 rounded-lg w-full"></div>
                    <div className="h-10 bg-slate-800/50 rounded-lg w-3/4"></div>
                    <div className="h-10 bg-slate-800/50 rounded-lg w-5/6"></div>
                  </div>
                </div>
                {/* Main */}
                <div className="flex-1 bg-slate-900 p-8 flex flex-col">
                   <div className="h-8 bg-slate-800 rounded w-1/3 mb-8"></div>
                   <div className="flex gap-6 mb-8">
                     <div className="h-32 bg-slate-800 rounded-xl flex-1 border border-slate-700/50"></div>
                     <div className="h-32 bg-slate-800 rounded-xl flex-1 border border-slate-700/50"></div>
                     <div className="h-32 bg-slate-800 rounded-xl flex-1 border border-slate-700/50"></div>
                   </div>
                   <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700/50"></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
