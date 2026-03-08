import React, { useState } from 'react';
import { cn } from '../utils/cn';

interface ImageComparisonProps {
    originalImage: string;
    resultImage: string;
    className?: string;
}

export default function ImageComparison({ originalImage, resultImage, className }: ImageComparisonProps) {
    const [showOriginal, setShowOriginal] = useState(false);

    return (
        <div
            className={cn("relative w-full h-full cursor-pointer select-none", className)}
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            onTouchStart={() => setShowOriginal(true)}
            onTouchEnd={() => setShowOriginal(false)}
        >
            <img
                src={showOriginal ? originalImage : resultImage}
                alt="Comparison"
                className="w-full h-full object-cover transition-opacity duration-150"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-white/90 uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                {showOriginal ? 'الأصلية' : 'اضغط للمقارنة'}
            </div>
        </div>
    );
}
