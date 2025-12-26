import React, { useState } from 'react';
import { GalleryItem } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryCarouselProps {
  items: GalleryItem[];
}

const GalleryCarousel: React.FC<GalleryCarouselProps> = ({ items }) => {
  const activeItems = items.filter(item => item.isActive !== false);
  const [current, setCurrent] = useState(0);
  if (activeItems.length === 0) return <div className="text-gray-400">無活動剪影</div>;

  const goPrev = () => setCurrent((prev) => (prev === 0 ? activeItems.length - 1 : prev - 1));
  const goNext = () => setCurrent((prev) => (prev === activeItems.length - 1 ? 0 : prev + 1));
  const item = activeItems[current];

  return (
    <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 左側圖片 */}
      <div className="md:w-1/2 flex items-center justify-center bg-gray-100 min-h-[320px]">
        <img src={item.imageUrl} alt={item.title || '活動剪影'} className="max-h-80 w-auto object-contain" />
      </div>
      {/* 右側內容 */}
      <div className="md:w-1/2 flex flex-col justify-center p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <button onClick={goPrev} className="p-2 text-gray-500 hover:text-primary"><ChevronLeft size={28} /></button>
          <span className="text-sm text-gray-400">{current + 1} / {activeItems.length}</span>
          <button onClick={goNext} className="p-2 text-gray-500 hover:text-primary"><ChevronRight size={28} /></button>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2 text-primary">{item.title || '（無標題）'}</h3>
          {item.description && <div className="text-gray-700 mb-2 whitespace-pre-line">{item.description}</div>}
        </div>
      </div>
    </div>
  );
};

export default GalleryCarousel;
