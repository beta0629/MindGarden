import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
};
