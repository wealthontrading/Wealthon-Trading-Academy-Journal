import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex items-center justify-center font-black tracking-tighter select-none ${className}`}>
      <div className="flex items-center justify-center bg-gradient-to-br from-indigo-600 to-blue-800 rounded-lg px-2 py-1 shadow-md border-b-2 border-indigo-950">
        <span className="text-white drop-shadow-md tracking-tight leading-none">
          WTA
        </span>
      </div>
    </div>
  );
}
