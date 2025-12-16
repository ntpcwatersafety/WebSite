import React from 'react';

interface HeroProps {
  title: string;
  subtitle: string;
  imageUrl: string;
}

const Hero: React.FC<HeroProps> = ({ title, subtitle, imageUrl }) => {
  return (
    <header className="relative w-full h-[300px] md:h-[350px] flex flex-col justify-center items-center text-center text-white p-4 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700"
        style={{ backgroundImage: `url('${imageUrl}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#006994]/80 to-[#006994]/50 z-10" />

      {/* Content */}
      <div className="relative z-20 max-w-4xl animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-md tracking-wide">
          {title}
        </h1>
        <p className="text-lg md:text-xl font-light tracking-wider opacity-90">
          {subtitle}
        </p>
      </div>
    </header>
  );
};

export default Hero;