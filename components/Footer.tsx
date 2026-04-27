import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-white text-center py-8 mt-auto">
      <div className="container mx-auto px-4">
        <p className="mb-2">&copy; 2026 新北市水上安全協會. All Rights Reserved.</p>
        <p className="text-sm opacity-80">致力於推廣水域安全與救生技能</p>
        <p className="text-sm opacity-80">
          <a href="https://fidogood.com" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-100">飛朵資訊 Fidogood</a> 製作
        </p>
      </div>
    </footer>
  );
};

export default Footer;