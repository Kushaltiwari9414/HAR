import React from 'react';
import { Feather } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between p-6 border-b border-stone-300 bg-[#f5f5f4]/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-red-900 flex items-center justify-center rounded-sm shadow-sm">
          <span className="font-serif text-stone-50 text-xl font-bold">気</span>
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold tracking-wide text-stone-900">HAR</h1>
          <p className="text-xs text-stone-500 tracking-widest uppercase">Ink & Motion Fusion</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
         <div className="flex items-center gap-2 px-3 py-1 border-l-2 border-stone-300">
            <Feather className="w-4 h-4 text-stone-600" />
            <span className="text-xs font-serif italic text-stone-600">Demo v.0.2.5</span>
         </div>
      </div>
    </header>
  );
};