"use client";

import Link from "next/link";
import { TRINITY_CONSTANTS } from "../constants/trinity";
import CoreSolutionLogo from "./CoreSolutionLogo";

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <h3 className="text-lg font-bold text-white mb-4">{TRINITY_CONSTANTS.COMPANY.NAME_FULL}</h3>
            <p className="text-slate-400 mb-4 max-w-sm leading-relaxed">{TRINITY_CONSTANTS.COMPANY.DESCRIPTION}</p>
            <p className="text-slate-500 text-sm">{TRINITY_CONSTANTS.BRANDING.CORESOLUTION_DESCRIPTION}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">서비스</h4>
            <ul className="space-y-3">
              <li><Link href="#about" className="text-slate-400 hover:text-white text-sm transition-colors">회사 소개</Link></li>
              <li><Link href="#services" className="text-slate-400 hover:text-white text-sm transition-colors">기능 소개</Link></li>
              <li><Link href="#pricing" className="text-slate-400 hover:text-white text-sm transition-colors">요금 안내</Link></li>
              <li><Link href="/onboarding" className="text-slate-400 hover:text-white text-sm transition-colors">서비스 신청</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">고객 지원</h4>
            <ul className="space-y-3">
              <li><span className="text-slate-400 text-sm">{TRINITY_CONSTANTS.COMPANY.EMAIL}</span></li>
              <li><Link href="/onboarding/status" className="text-slate-400 hover:text-white text-sm transition-colors">신청 상태 조회</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">{TRINITY_CONSTANTS.COMPANY.COPYRIGHT}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              {TRINITY_CONSTANTS.BRANDING.POWERED_BY}
            </span>
            <CoreSolutionLogo variant="inverse" className="h-5 w-auto opacity-50 hover:opacity-100 transition-all" />
          </div>
        </div>
      </div>
    </footer>
  );
}
