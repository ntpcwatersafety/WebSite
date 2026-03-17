import React from 'react';

interface HeroProps {
  title: string;
  subtitle: string;
  imageUrl: string;
}

const Hero: React.FC<HeroProps> = ({ title, subtitle, imageUrl }) => {
  return (
    <header className="relative flex h-[280px] w-full flex-col items-center justify-center overflow-hidden px-4 pt-8 text-center text-white sm:h-[320px] md:h-[350px]">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700"
        style={{ backgroundImage: `url('${imageUrl}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#006994]/80 to-[#006994]/50 z-10" />

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-4xl animate-fade-in-up px-2">
        <h1 className="mb-3 text-2xl font-bold leading-tight drop-shadow-md tracking-[0.08em] sm:text-3xl md:mb-4 md:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mx-auto max-w-2xl text-sm font-light leading-relaxed tracking-[0.18em] opacity-90 sm:text-base md:text-xl">
          {subtitle}
        </p>
      </div>
    </header>
  );
};

export default Hero;