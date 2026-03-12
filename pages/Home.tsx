import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import CollapsibleCard from '../components/CollapsibleCard';

import { getHomeSections, PAGE_CONTENT } from '../services/cms';
import { renderSectionContent, renderTextContent } from '../services/contentRenderer';
import { loadCmsData, CmsData } from '../services/cmsLoader';
import { SectionContent } from '../types';

const Home: React.FC = () => {
  const pageData = PAGE_CONTENT.home;
  const [dynamicSections, setDynamicSections] = useState<SectionContent[]>([]);
  const [introContent, setIntroContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSections = async () => {
      setLoading(true);
      try {
        const sections = await getHomeSections();
        setDynamicSections(sections);
      } catch (error) {
        console.error('載入首頁區塊失敗:', error);
      }
      setLoading(false);
    };
    loadSections();
  }, []);

  return (
    <>
      <Hero 
        title={pageData.title}
        subtitle={pageData.subtitle}
        imageUrl={pageData.imageUrl}
      />
      <main className="container max-w-[1000px] mx-auto my-8 px-5">
        {dynamicSections && dynamicSections.length > 0 ? (
          dynamicSections.map((section) => (
            <CollapsibleCard 
              key={section.id} 
              title={section.title} 
              isOpenDefault={section.isOpenDefault}
            >
              {renderSectionContent(section)}
            </CollapsibleCard>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border-t-4 border-gray-300 p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-700 mb-6">{pageData.title}</h2>
            <div className="flex flex-col items-center justify-center text-gray-400 gap-4">
              <span style={{fontSize: 64}}>🚧</span>
              <p className="text-xl">內容建置中...</p>
              <p className="text-sm">資料庫內容串接後，將在此顯示「{pageData.title}」的詳細資訊。</p>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Home;