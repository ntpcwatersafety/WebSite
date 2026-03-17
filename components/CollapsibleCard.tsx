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
    <div className="mb-6 overflow-hidden rounded-2xl border-t-4 border-primary bg-white shadow-sm transition-all duration-300 md:mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-4 bg-white px-5 py-4 text-left transition-colors select-none hover:bg-gray-50 sm:px-6 sm:py-5 md:px-8 md:py-6 ${
          isOpen ? 'border-b border-gray-100' : ''
        }`}
      >
        <h2 className="m-0 pr-2 text-xl font-bold leading-snug text-primary sm:text-2xl">{title}</h2>
        <ChevronDown 
          className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} 
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
          className={`px-5 pb-5 pt-2 transition-all duration-300 sm:px-6 sm:pb-6 md:px-8 md:pb-8 ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleCard;