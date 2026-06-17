import React from 'react';
import Link from 'next/link';

interface V2ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  fullWidth?: boolean;
}

export const V2Button: React.FC<V2ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  href,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-800 shadow-sm",
    outline: "border border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-slate-200 bg-white",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-200"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const combinedClassName = `${baseStyle} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
};
