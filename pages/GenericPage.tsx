import React from 'react';
import Hero from '../components/Hero';
import { Construction } from 'lucide-react';
import { PageConfig } from '../types';

interface GenericPageProps {
  data: PageConfig;
}

const GenericPage: React.FC<GenericPageProps> = ({ data }) => {
  return (
    <>
      <Hero 
        title={data.title}
        subtitle={data.subtitle}
        imageUrl={data.imageUrl}
      />
      <main className="container max-w-[1000px] mx-auto my-12 px-5 text-center">
        <div className="bg-white rounded-lg shadow-sm border-t-4 border-gray-300 p-12">
            <h2 className="text-3xl font-bold text-gray-700 mb-6">{data.title}</h2>
            <div className="flex flex-col items-center justify-center text-gray-400 gap-4">
                <Construction size={64} />
                <p className="text-xl">此頁面建置中...</p>
                <p className="text-sm">資料庫內容串接後，將在此顯示「{data.title}」的詳細資訊。</p>
            </div>
        </div>
      </main>
    </>
  );
};

export default GenericPage;