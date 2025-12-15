'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Flyer {
  url: string;
  name: string;
}

export function FlyerCarousel({ flyers }: { flyers: Flyer[] }) {
  const [currentFlyer, setCurrentFlyer] = useState(0);

  if (!flyers || flyers.length === 0) {
    return (
      <div className="aspect-[3/4] bg-slate-100 rounded-lg flex items-center justify-center">
        <p className="text-slate-300 text-sm tracking-wider">Coming Soon</p>
      </div>
    );
  }

  const prevFlyer = () => {
    setCurrentFlyer((prev) => (prev === 0 ? flyers.length - 1 : prev - 1));
  };

  const nextFlyer = () => {
    setCurrentFlyer((prev) => (prev === flyers.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-lg shadow-lg">
        {flyers.map((flyer, index) => (
          <img 
            key={index}
            src={flyer.url}
            alt={flyer.name}
            className={`w-full h-auto transition-all duration-500 ${
              index === currentFlyer 
                ? 'opacity-100 scale-100 relative' 
                : 'opacity-0 scale-95 absolute inset-0'
            }`}
          />
        ))}
      </div>
      
      <p className="text-center text-sm text-slate-500 mt-6">{flyers[currentFlyer].name}</p>
      
      {flyers.length > 1 && (
        <>
          <button
            onClick={prevFlyer}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 p-2 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="前へ"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={nextFlyer}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 p-2 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="次へ"
          >
            <ChevronRight size={32} />
          </button>
          
          <div className="flex justify-center gap-3 mt-6">
            {flyers.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFlyer(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentFlyer 
                    ? 'bg-slate-700 w-6' 
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`スライド ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
