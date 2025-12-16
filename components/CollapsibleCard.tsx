import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleCardProps {
  title: string;
  isOpenDefault?: boolean;
  children: React.ReactNode;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({ title, isOpenDefault = false, children }) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white mb-8 rounded-lg shadow-sm border-t-4 border-primary overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-start md:justify-start gap-4 px-8 py-6 cursor-pointer bg-white hover:bg-gray-50 transition-colors select-none ${
          isOpen ? 'border-b border-gray-100' : ''
        } max-md:justify-center`} // Mobile: center, Desktop: start
      >
        <h2 className="text-2xl font-bold text-primary m-0">{title}</h2>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} 
        />
      </button>

      <div
        className="transition-[max-height] duration-300 ease-out overflow-hidden"
        style={{
          maxHeight: isOpen ? `${contentRef.current?.scrollHeight}px` : '0px',
        }}
      >
        <div 
          ref={contentRef}
          className={`px-8 pb-8 pt-2 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleCard;