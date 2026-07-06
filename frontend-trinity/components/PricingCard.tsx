"use client";

import { V2Button } from "./ui/V2Button";

interface PricingCardProps {
  id: string;
  name: string;
  price: number;
  currency?: string;
  features: string[];
  popular?: boolean;
}

export default function PricingCard({
  id,
  name,
  price,
  currency = "KRW",
  features,
  popular = false,
}: PricingCardProps) {
  // Format price
  const formattedPrice = new Intl.NumberFormat("ko-KR").format(price);
  
  // TBD Placeholder logic from Gap Analysis
  // "가격 Placeholder 미준수: TBD로 변경하여 스펙 준수"
  // But wait, if price is fetched from API, we display it, otherwise maybe TBD.
  // Actually, if price === 0, let's check if it's free or just a placeholder.
  // We'll show the actual price if it's > 0, otherwise maybe "무료" or "문의".
  const displayPrice = price === 0 ? "TBD" : formattedPrice;

  return (
    <div 
      className={`relative flex flex-col p-8 rounded-2xl bg-white border ${
        popular 
          ? "border-blue-500 shadow-xl shadow-blue-500/10 scale-105 z-10" 
          : "border-slate-200 shadow-md hover:shadow-lg hover:border-slate-300"
      } transition-all duration-300`}
    >
      {popular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span className="bg-blue-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm">
            가장 인기있는 플랜
          </span>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-slate-900">
            {displayPrice === "TBD" ? "₩TBD" : `₩${displayPrice}`}
          </span>
          <span className="text-sm font-medium text-slate-500">/월</span>
        </div>
      </div>
      
      <ul className="flex-grow space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-slate-600 leading-tight">{feature}</span>
          </li>
        ))}
      </ul>
      
      <V2Button 
        href={`/onboarding?plan=${id}`} 
        variant={popular ? "primary" : "outline"} 
        fullWidth
      >
        선택하기
      </V2Button>
    </div>
  );
}
