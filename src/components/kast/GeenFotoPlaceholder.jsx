import React from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GeenFotoPlaceholder({ className }) {
  return (
    <div className={cn('w-full h-full bg-black flex flex-col items-center justify-center text-white/80 p-3 text-center', className)}>
      <ImageOff className="w-6 h-6 mb-1.5 opacity-70" strokeWidth={1.5} />
      <p className="text-[11px] leading-tight">Van dit item is geen foto</p>
    </div>
  );
}